<?php

namespace App\Http\Controllers;

use App\Actions\ApplyPaymentStatus;
use App\Models\Payment;
use DokuLaravel\Contracts\WebhookVerifier;
use DokuLaravel\Exceptions\SignatureVerificationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class DokuWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        WebhookVerifier $webhookVerifier,
        ApplyPaymentStatus $applyPaymentStatus,
    ): JsonResponse {
        try {
            $notification = $webhookVerifier->parseAndVerify(
                headers: $request->headers->all(),
                body: $request->getContent(),
                requestTarget: $request->getPathInfo(),
            );

            $payment = Payment::query()
                ->with('order')
                ->whereHas('order', fn ($query) => $query->where('order_number', $notification->orderNumber))
                ->latest()
                ->first();

            if (! $payment) {
                return response()->json([
                    'message' => 'Payment not found, but notification acknowledged.',
                ], 202);
            }

            $payment->events()->create([
                'event_type' => 'gateway_notification_received',
                'source' => 'webhook',
                'signature_status' => 'verified',
                'payload' => $notification->payload,
                'processed_at' => now(),
            ]);

            $applyPaymentStatus->execute($payment, $notification->normalizedStatus, [
                'request_id' => $notification->originalRequestId ?? $notification->requestId,
                'payment_method' => $notification->paymentMethod,
                'raw' => $notification->payload,
            ]);

            return response()->json([
                'message' => 'Notification received.',
            ]);
        } catch (SignatureVerificationException $exception) {
            report($exception);

            return response()->json([
                'message' => 'Invalid signature.',
            ], 401);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Webhook processing failed.',
            ], 500);
        }
    }
}
