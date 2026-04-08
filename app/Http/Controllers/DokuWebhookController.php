<?php

namespace App\Http\Controllers;

use App\Actions\ApplyPaymentStatus;
use App\Models\Payment;
use App\Models\PaymentEvent;
use DokuLaravel\Contracts\WebhookVerifier;
use DokuLaravel\DTO\NotificationData;
use DokuLaravel\Exceptions\SignatureVerificationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

            Log::info('DOKU webhook verified.', [
                'order_number' => $notification->orderNumber,
                'request_id' => $notification->requestId,
                'status' => $notification->normalizedStatus,
                'client_id' => $notification->clientId,
            ]);

            $payment = Payment::query()
                ->with('order')
                ->whereHas('order', fn ($query) => $query->where('order_number', $notification->orderNumber))
                ->latest()
                ->first();

            if (! $payment) {
                Log::warning('DOKU webhook received for unknown payment.', [
                    'order_number' => $notification->orderNumber,
                    'request_id' => $notification->requestId,
                ]);

                return response()->json([
                    'message' => 'Payment not found, but notification acknowledged.',
                ], 202);
            }

            $existingEvent = PaymentEvent::query()
                ->where('payment_id', $payment->id)
                ->where('source', 'webhook')
                ->where('provider_request_id', $notification->requestId)
                ->first();

            if ($existingEvent) {
                Log::info('Duplicate DOKU webhook ignored.', [
                    'payment_id' => $payment->id,
                    'order_number' => $notification->orderNumber,
                    'request_id' => $notification->requestId,
                ]);

                return response()->json([
                    'message' => 'Notification already processed.',
                ]);
            }

            PaymentEvent::query()->create([
                'payment_id' => $payment->id,
                'event_type' => 'gateway_notification_received',
                'source' => 'webhook',
                'provider_request_id' => $notification->requestId,
                'signature_status' => 'verified',
                'payload' => $this->buildEventPayload($notification),
                'processed_at' => now(),
            ]);

            $applyPaymentStatus->execute($payment, $notification->normalizedStatus, [
                'request_id' => $notification->originalRequestId ?? $notification->requestId,
                'payment_method' => $notification->paymentMethod,
                'raw' => $notification->payload,
            ]);

            Log::info('DOKU webhook applied to payment.', [
                'payment_id' => $payment->id,
                'order_number' => $notification->orderNumber,
                'request_id' => $notification->requestId,
                'status' => $notification->normalizedStatus,
            ]);

            return response()->json([
                'message' => 'Notification received.',
            ]);
        } catch (SignatureVerificationException $exception) {
            Log::warning('DOKU webhook rejected.', [
                'path' => $request->getPathInfo(),
                'reason' => $exception->getMessage(),
            ]);
            report($exception);

            return response()->json([
                'message' => 'Invalid signature.',
            ], 401);
        } catch (Throwable $exception) {
            Log::error('DOKU webhook processing failed.', [
                'path' => $request->getPathInfo(),
                'message' => $exception->getMessage(),
            ]);
            report($exception);

            return response()->json([
                'message' => 'Webhook processing failed.',
            ], 500);
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildEventPayload(NotificationData $notification): array
    {
        return array_replace_recursive($notification->payload, [
            '_meta' => [
                'client_id' => $notification->clientId,
                'request_id' => $notification->requestId,
                'request_timestamp' => $notification->requestTimestamp,
                'verified' => $notification->verified,
            ],
        ]);
    }
}
