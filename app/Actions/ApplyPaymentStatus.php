<?php

namespace App\Actions;

use App\Models\Payment;

class ApplyPaymentStatus
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function execute(Payment $payment, string $incomingStatus, array $context = []): Payment
    {
        $status = strtolower($incomingStatus);

        if ($status === 'unknown' || $status === '') {
            return $payment->fresh(['order', 'events']) ?? $payment;
        }

        if ($this->shouldIgnore($payment->status, $status)) {
            return $payment->fresh(['order', 'events']) ?? $payment;
        }

        $rawSummary = is_array($payment->raw_response_summary)
            ? $payment->raw_response_summary
            : [];

        $payment->fill([
            'status' => $status,
            'payment_method' => $context['payment_method'] ?? $payment->payment_method,
            'provider_reference' => $context['provider_reference'] ?? $payment->provider_reference,
            'request_id' => $context['request_id'] ?? $payment->request_id,
            'raw_response_summary' => array_replace_recursive($rawSummary, $context['raw'] ?? []),
        ]);

        if ($status === 'paid' && ! $payment->paid_at) {
            $payment->paid_at = $context['paid_at'] ?? now();
        }

        if ($status === 'expired' && ! $payment->expired_at) {
            $payment->expired_at = $context['expired_at'] ?? now();
        }

        $payment->save();

        if ($payment->relationLoaded('order') || $payment->order()->exists()) {
            $payment->order()->update([
                'status' => $this->mapOrderStatus($status),
            ]);
        }

        return $payment->fresh(['order', 'events']) ?? $payment;
    }

    protected function shouldIgnore(?string $currentStatus, string $incomingStatus): bool
    {
        $current = strtolower((string) $currentStatus);

        if ($current === '' || ! $this->isFinal($current) || $current === $incomingStatus) {
            return false;
        }

        return ! ($current === 'paid' && $incomingStatus === 'refunded');
    }

    protected function isFinal(string $status): bool
    {
        return in_array($status, ['paid', 'expired', 'cancelled', 'refunded'], true);
    }

    protected function mapOrderStatus(string $paymentStatus): string
    {
        return match ($paymentStatus) {
            'paid' => 'paid',
            'failed' => 'failed',
            'expired' => 'expired',
            'cancelled' => 'cancelled',
            'refunded' => 'refunded',
            default => 'pending',
        };
    }
}
