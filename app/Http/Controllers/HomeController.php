<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Config;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $metrics = [
            'orders' => 0,
            'pending' => 0,
            'paid' => 0,
        ];

        $recentPayments = [];

        try {
            $metrics = [
                'orders' => Order::count(),
                'pending' => Payment::where('status', 'pending')->count(),
                'paid' => Payment::where('status', 'paid')->count(),
            ];

            $recentPayments = Payment::query()
                ->with('order')
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (Payment $payment): array => [
                    'id' => $payment->id,
                    'orderNumber' => $payment->order?->order_number ?? 'N/A',
                    'customerName' => $payment->order?->customer_name ?? 'Guest',
                    'amount' => number_format($payment->amount),
                    'status' => $payment->status,
                    'paymentMethod' => $payment->payment_method,
                    'detailUrl' => route('payments.show', $payment->order?->order_number ?? ''),
                    'updatedAt' => $payment->updated_at?->toIso8601String(),
                ])
                ->all();
        } catch (Throwable) {
            $metrics = [
                'orders' => 0,
                'pending' => 0,
                'paid' => 0,
            ];
            $recentPayments = [];
        }

        return Inertia::render('Home', [
            'product' => [
                'name' => 'DOKU Checkout Starter Pack',
                'summary' => 'Sample Laravel + Inertia app dengan package reusable DOKU untuk flow checkout, callback, webhook, dan status sync.',
                'price' => 149000,
                'currency' => 'IDR',
                'includes' => [
                    'Driver DOKU Checkout asli untuk sandbox/production.',
                    'Fake checkout driver untuk demo lokal tanpa credential.',
                    'Webhook verification dengan signature DOKU non-SNAP.',
                    'UI transaksi dan event log sebagai reference implementation.',
                ],
            ],
            'integration' => [
                'driver' => (string) Config::get('doku.driver', 'fake'),
                'environment' => (string) Config::get('doku.environment', 'sandbox'),
                'ready' => (string) Config::get('doku.driver', 'fake') === 'fake'
                    || (filled(Config::get('doku.client_id')) && filled(Config::get('doku.secret_key'))),
                'paymentDueDate' => (int) Config::get('doku.payment_due_date', 60),
            ],
            'metrics' => $metrics,
            'recentPayments' => $recentPayments,
        ]);
    }
}
