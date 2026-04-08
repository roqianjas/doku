<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;
use DokuLaravel\Contracts\CheckoutService;
use DokuLaravel\DTO\CreateCheckoutData;
use DokuLaravel\Exceptions\ConfigurationException;
use DokuLaravel\Exceptions\GatewayRequestException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

class CheckoutController extends Controller
{
    public function store(Request $request, CheckoutService $checkoutService): SymfonyResponse|RedirectResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_email' => ['required', 'email', 'max:120'],
            'amount' => ['required', 'integer', 'min:10000', 'max:50000000'],
        ]);

        $order = null;

        try {
            $orderNumber = 'ORD-'.now()->format('YmdHis').'-'.Str::upper(Str::random(4));

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'currency' => 'IDR',
                'amount' => (int) $validated['amount'],
                'status' => 'created',
                'line_items' => [[
                    'id' => 'STARTER-PACK',
                    'name' => 'DOKU Checkout Starter Pack',
                    'price' => (int) $validated['amount'],
                    'quantity' => 1,
                ]],
            ]);

            $checkout = $checkoutService->createCheckout(new CreateCheckoutData(
                orderNumber: $order->order_number,
                amount: $order->amount,
                currency: $order->currency,
                customerName: $order->customer_name,
                customerEmail: $order->customer_email,
                callbackUrl: route('payments.return', $order->order_number),
                callbackUrlResult: route('payments.return', $order->order_number),
                notificationUrl: (string) (config('doku.notification_url') ?: route('doku.webhook')),
                paymentDueDate: (int) config('doku.payment_due_date', 60),
                autoRedirect: (bool) config('doku.auto_redirect', true),
                lineItems: $order->line_items ?? [],
            ));

            $payment = $order->payments()->create([
                'provider' => 'doku',
                'provider_reference' => $checkout->providerReference,
                'request_id' => $checkout->requestId,
                'payment_method' => config('doku.driver') === 'fake' ? 'FAKE_CHECKOUT' : null,
                'amount' => $order->amount,
                'currency' => $order->currency,
                'status' => $checkout->status,
                'checkout_url' => $checkout->paymentUrl,
                'raw_response_summary' => $checkout->raw,
                'expired_at' => $this->parseExpiry($checkout->expiresAt),
            ]);

            $payment->events()->create([
                'event_type' => 'checkout_created',
                'source' => config('doku.driver') === 'fake' ? 'fake_driver' : 'checkout_api',
                'provider_request_id' => $checkout->requestId,
                'signature_status' => 'not_applicable',
                'payload' => $checkout->raw,
                'processed_at' => now(),
            ]);

            $order->update([
                'status' => $checkout->status,
            ]);

            return Inertia::location($checkout->paymentUrl);
        } catch (Throwable $exception) {
            report($exception);

            if ($order instanceof Order) {
                /** @var Payment $failedPayment */
                $failedPayment = $order->payments()->create([
                    'provider' => 'doku',
                    'amount' => $order->amount,
                    'currency' => $order->currency,
                    'status' => 'failed',
                    'raw_response_summary' => [
                        'message' => $exception->getMessage(),
                    ],
                ]);

                $failedPayment->events()->create([
                    'event_type' => 'checkout_failed',
                    'source' => 'application',
                    'signature_status' => 'not_applicable',
                    'payload' => [
                        'message' => $exception->getMessage(),
                    ],
                    'processed_at' => now(),
                ]);

                $order->update([
                    'status' => 'failed',
                ]);
            }

            $message = $this->resolveCheckoutErrorMessage($exception);

            return back()->with('error', $message);
        }
    }

    protected function parseExpiry(?string $value): ?Carbon
    {
        if (! $value) {
            return null;
        }

        if (preg_match('/^\d{14}$/', $value) === 1) {
            return Carbon::createFromFormat('YmdHis', $value, 'Asia/Jakarta');
        }

        return rescue(
            callback: static fn () => Carbon::parse($value),
            rescue: null,
            report: false,
        );
    }

    protected function resolveCheckoutErrorMessage(Throwable $exception): string
    {
        if ($exception instanceof ConfigurationException) {
            return 'Credential DOKU belum lengkap. Isi variabel DOKU_* di .env atau gunakan driver fake.';
        }

        if ($exception instanceof GatewayRequestException) {
            $message = $this->extractGatewayMessage($exception->getMessage());

            if ($message['code'] === 'invalid_client_id') {
                return 'DOKU menolak Client ID. Periksa lagi DOKU_CLIENT_ID dan pastikan credential ini memang aktif untuk DOKU Checkout sandbox.';
            }

            if ($message['text'] !== null) {
                return 'Checkout DOKU gagal: '.$message['text'];
            }
        }

        return 'Checkout gagal dibuat. Pastikan database dan konfigurasi DOKU sudah siap.';
    }

    /**
     * @return array{code: string|null, text: string|null}
     */
    protected function extractGatewayMessage(string $message): array
    {
        $start = strpos($message, '{');

        if ($start === false) {
            return [
                'code' => null,
                'text' => null,
            ];
        }

        $decoded = json_decode(substr($message, $start), true);

        if (! is_array($decoded)) {
            return [
                'code' => null,
                'text' => null,
            ];
        }

        return [
            'code' => data_get($decoded, 'error.code'),
            'text' => data_get($decoded, 'error.message'),
        ];
    }
}
