# local/doku-laravel

Reusable Laravel-first integration for DOKU Checkout.

## Features

- `CheckoutService` for DOKU Checkout API.
- `StatusService` for Non-SNAP status sync.
- `WebhookVerifier` for DOKU notification signature verification.
- `fake` driver for local demo flow.
- `checkout` driver for real DOKU gateway flow.

## Install

Add the package to a Laravel app and register config values:

```env
DOKU_DRIVER=checkout
DOKU_ENV=sandbox
DOKU_CLIENT_ID=your-client-id
DOKU_SECRET_KEY=your-secret-key
DOKU_BASE_URL=https://api-sandbox.doku.com
DOKU_NOTIFICATION_URL=https://your-domain/webhooks/doku
```

## Security Notes

- Exempt your webhook route from Laravel CSRF protection.
- Verify incoming webhook signature before updating payment status.
- Match the incoming `Client-Id` header against your configured `DOKU_CLIENT_ID`.
- Treat the webhook path as POST-only.

## Runtime Notes

- For local public testing with tunnels, trust forwarded proxy headers so Laravel generates HTTPS URLs correctly.
- When using a public tunnel, prefer production asset build instead of `npm run dev`.
