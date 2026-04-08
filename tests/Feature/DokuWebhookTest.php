<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentEvent;
use DokuLaravel\Support\SignatureGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\RequiresPhpExtension;
use Tests\TestCase;

#[RequiresPhpExtension('pdo_sqlite')]
class DokuWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected SignatureGenerator $signatureGenerator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->signatureGenerator = new SignatureGenerator;

        config()->set('doku.client_id', 'demo-client');
        config()->set('doku.secret_key', 'super-secret');
    }

    public function test_it_marks_payment_as_paid_when_verified_webhook_is_received(): void
    {
        [$order, $payment] = $this->createPendingPayment();
        $payload = $this->makeWebhookPayload($order, $payment);

        $response = $this->postJson(
            route('doku.webhook'),
            $payload,
            $this->makeWebhookHeaders($payload)
        );

        $response->assertOk()
            ->assertJson([
                'message' => 'Notification received.',
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'paid',
        ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'paid',
            'payment_method' => 'VIRTUAL_ACCOUNT_BRI',
        ]);

        $this->assertDatabaseHas('payment_events', [
            'payment_id' => $payment->id,
            'event_type' => 'gateway_notification_received',
            'source' => 'webhook',
            'provider_request_id' => 'notif-001',
            'signature_status' => 'verified',
        ]);
    }

    public function test_it_ignores_duplicate_webhook_notifications(): void
    {
        [$order, $payment] = $this->createPendingPayment();
        $payload = $this->makeWebhookPayload($order, $payment);
        $headers = $this->makeWebhookHeaders($payload);

        $this->postJson(route('doku.webhook'), $payload, $headers)
            ->assertOk();

        $this->postJson(route('doku.webhook'), $payload, $headers)
            ->assertOk()
            ->assertJson([
                'message' => 'Notification already processed.',
            ]);

        $this->assertSame(
            1,
            PaymentEvent::query()
                ->where('payment_id', $payment->id)
                ->where('source', 'webhook')
                ->where('provider_request_id', 'notif-001')
                ->count()
        );

        $payment->refresh();

        $this->assertSame('paid', $payment->status);
    }

    public function test_it_rejects_webhook_with_unexpected_client_id(): void
    {
        [$order, $payment] = $this->createPendingPayment();
        $payload = $this->makeWebhookPayload($order, $payment);

        $response = $this->postJson(
            route('doku.webhook'),
            $payload,
            $this->makeWebhookHeaders($payload, clientId: 'other-client', requestId: 'notif-099')
        );

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid signature.',
            ]);

        $this->assertDatabaseMissing('payment_events', [
            'payment_id' => $payment->id,
            'source' => 'webhook',
        ]);

        $payment->refresh();

        $this->assertSame('pending', $payment->status);
    }

    /**
     * @return array{0: Order, 1: Payment}
     */
    protected function createPendingPayment(): array
    {
        $order = Order::query()->create([
            'order_number' => 'ORD-20260408-TEST-001',
            'customer_name' => 'Budi Santoso',
            'customer_email' => 'budi@example.com',
            'currency' => 'IDR',
            'amount' => 149000,
            'status' => 'pending',
            'line_items' => [[
                'id' => 'STARTER-PACK',
                'name' => 'DOKU Checkout Starter Pack',
                'price' => 149000,
                'quantity' => 1,
            ]],
        ]);

        $payment = $order->payments()->create([
            'provider' => 'doku',
            'provider_reference' => 'demo-provider-reference',
            'request_id' => 'checkout-request-001',
            'amount' => 149000,
            'currency' => 'IDR',
            'status' => 'pending',
        ]);

        return [$order, $payment];
    }

    /**
     * @return array<string, mixed>
     */
    protected function makeWebhookPayload(Order $order, Payment $payment): array
    {
        return [
            'order' => [
                'invoice_number' => $order->order_number,
                'amount' => $order->amount,
            ],
            'transaction' => [
                'status' => 'SUCCESS',
                'original_request_id' => $payment->request_id,
            ],
            'channel' => [
                'id' => 'VIRTUAL_ACCOUNT_BRI',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string>
     */
    protected function makeWebhookHeaders(
        array $payload,
        string $clientId = 'demo-client',
        string $requestId = 'notif-001',
        string $requestTimestamp = '2026-04-08T02:15:00Z',
    ): array {
        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        return [
            'Client-Id' => $clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $requestTimestamp,
            'Signature' => $this->signatureGenerator->generateSignature(
                clientId: $clientId,
                requestId: $requestId,
                requestTimestamp: $requestTimestamp,
                requestTarget: '/webhooks/doku',
                secretKey: 'super-secret',
                digest: $this->signatureGenerator->generateDigest($body),
            ),
        ];
    }
}
