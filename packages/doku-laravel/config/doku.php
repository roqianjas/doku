<?php

return [
    'driver' => env('DOKU_DRIVER', 'fake'),
    'environment' => env('DOKU_ENV', 'sandbox'),
    'base_url' => env('DOKU_BASE_URL'),
    'client_id' => env('DOKU_CLIENT_ID'),
    'secret_key' => env('DOKU_SECRET_KEY'),
    'merchant_id' => env('DOKU_MERCHANT_ID'),
    'notification_url' => env('DOKU_NOTIFICATION_URL'),
    'payment_due_date' => (int) env('DOKU_PAYMENT_DUE_DATE', 60),
    'auto_redirect' => env('DOKU_AUTO_REDIRECT', true),
    'request_timeout' => (int) env('DOKU_REQUEST_TIMEOUT', 20),
    'validate_response_signature' => env('DOKU_VALIDATE_RESPONSE_SIGNATURE', false),
    'payment_method_types' => array_values(array_filter(array_map(
        static fn (string $item): string => trim($item),
        explode(',', (string) env('DOKU_PAYMENT_METHOD_TYPES', ''))
    ))),
    'fake' => [
        'checkout_base_url' => env(
            'DOKU_FAKE_CHECKOUT_BASE_URL',
            rtrim((string) env('APP_URL', 'http://localhost'), '/').'/sandbox/doku/checkout'
        ),
    ],
];
