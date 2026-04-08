<?php

namespace App\Http\Controllers;

use App\Actions\ApplyPaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use DokuLaravel\Contracts\StatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PaymentController extends Controller
{
    public function index(): Response
    {
        try {
            $payments = Payment::query()
                ->with('order')
                ->latest()
                ->paginate(12)
                ->through(fn (Payment $payment): array => $this->serializePaymentRow($payment));

            $summary = [
                'all' => Payment::count(),
                'pending' => Payment::where('status', 'pending')->count(),
                'paid' => Payment::where('status', 'paid')->count(),
                'failed' => Payment::where('status', 'failed')->count(),
            ];
        } catch (Throwable) {
            $payments = [
                'data' => [],
                'links' => [],
            ];
            $summary = [
                'all' => 0,
                'pending' => 0,
                'paid' => 0,
                'failed' => 0,
            ];
        }

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'summary' => $summary,
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $order->load([
            'payments' => fn ($query) => $query->latest(),
            'payments.events' => fn ($query) => $query->latest(),
        ]);

        /** @var Payment|null $payment */
        $payment = $order->payments->first();

        return Inertia::render('Payments/Show', [
            'isReturnVisit' => $request->routeIs('payments.return'),
            'order' => [
                'id' => $order->id,
                'orderNumber' => $order->order_number,
                'customerName' => $order->customer_name,
                'customerEmail' => $order->customer_email,
                'amount' => $order->amount,
                'currency' => $order->currency,
                'status' => $order->status,
                'lineItems' => $order->line_items ?? [],
                'createdAt' => $order->created_at?->toIso8601String(),
            ],
            'payment' => $payment ? [
                'id' => $payment->id,
                'provider' => $payment->provider,
                'providerReference' => $payment->provider_reference,
                'requestId' => $payment->request_id,
                'paymentMethod' => $payment->payment_method,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'checkoutUrl' => $payment->checkout_url,
                'paidAt' => $payment->paid_at?->toIso8601String(),
                'expiredAt' => $payment->expired_at?->toIso8601String(),
                'rawResponseSummary' => $payment->raw_response_summary,
            ] : null,
            'events' => $payment
                ? $payment->events->map(fn ($event): array => [
                    'id' => $event->id,
                    'eventType' => $event->event_type,
                    'source' => $event->source,
                    'signatureStatus' => $event->signature_status,
                    'processedAt' => $event->processed_at?->toIso8601String(),
                    'createdAt' => $event->created_at?->toIso8601String(),
                    'payload' => $event->payload,
                ])->values()->all()
                : [],
        ]);
    }

    public function sync(
        Payment $payment,
        StatusService $statusService,
        ApplyPaymentStatus $applyPaymentStatus,
    ): RedirectResponse {
        try {
            $status = $statusService->checkStatus($payment->order->order_number);

            $payment->events()->create([
                'event_type' => 'status_synced',
                'source' => 'manual_sync',
                'provider_request_id' => $status->requestId,
                'signature_status' => 'not_applicable',
                'payload' => $status->raw,
                'processed_at' => now(),
            ]);

            $applyPaymentStatus->execute($payment, $status->normalizedStatus, [
                'request_id' => $status->requestId,
                'payment_method' => $status->paymentMethod,
                'raw' => $status->raw,
            ]);

            return redirect()
                ->route('payments.show', $payment->order->order_number)
                ->with('success', 'Status transaksi berhasil disinkronkan dari gateway.');
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('payments.show', $payment->order->order_number)
                ->with('error', 'Gagal sinkronisasi status dari DOKU.');
        }
    }

    protected function serializePaymentRow(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'orderNumber' => $payment->order?->order_number ?? 'N/A',
            'customerName' => $payment->order?->customer_name ?? 'Guest',
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'status' => $payment->status,
            'paymentMethod' => $payment->payment_method,
            'providerReference' => $payment->provider_reference,
            'detailUrl' => $payment->order
                ? route('payments.show', $payment->order->order_number)
                : null,
            'updatedAt' => $payment->updated_at?->toIso8601String(),
        ];
    }
}
