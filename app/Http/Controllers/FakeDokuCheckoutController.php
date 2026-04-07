<?php

namespace App\Http\Controllers;

use App\Actions\ApplyPaymentStatus;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FakeDokuCheckoutController extends Controller
{
    public function show(Order $order): Response
    {
        $order->load([
            'payments' => fn ($query) => $query->latest(),
        ]);

        $payment = $order->payments->firstOrFail();

        return Inertia::render('Sandbox/FakeCheckout', [
            'order' => [
                'orderNumber' => $order->order_number,
                'customerName' => $order->customer_name,
                'customerEmail' => $order->customer_email,
                'amount' => $order->amount,
                'currency' => $order->currency,
                'status' => $order->status,
                'lineItems' => $order->line_items ?? [],
            ],
            'payment' => [
                'id' => $payment->id,
                'status' => $payment->status,
                'providerReference' => $payment->provider_reference,
                'requestId' => $payment->request_id,
            ],
        ]);
    }

    public function update(
        Request $request,
        Order $order,
        ApplyPaymentStatus $applyPaymentStatus,
    ): RedirectResponse {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,paid,failed,expired,cancelled'],
        ]);

        $payment = $order->latestPayment()->firstOrFail();

        $payment->events()->create([
            'event_type' => 'fake_checkout_status_selected',
            'source' => 'fake_checkout',
            'signature_status' => 'local_demo',
            'payload' => [
                'selected_status' => $validated['status'],
                'order_number' => $order->order_number,
            ],
            'processed_at' => now(),
        ]);

        $applyPaymentStatus->execute($payment, $validated['status'], [
            'payment_method' => 'FAKE_CHECKOUT',
            'raw' => [
                'fake_checkout' => [
                    'status' => $validated['status'],
                ],
            ],
        ]);

        return redirect()
            ->route('payments.return', $order->order_number)
            ->with('success', 'Fake checkout berhasil mensimulasikan status transaksi.');
    }
}
