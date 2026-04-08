# DOKU Checkout Lab

Sample web app berbasis Laravel 13 + Inertia.js + React TSX untuk integrasi DOKU payment gateway, lengkap dengan package Laravel reusable yang tinggal dipindahkan ke project lain.

## Isi project

- `app/` berisi sample host application untuk flow order, payment, webhook, event log, dan sandbox checkout.
- `packages/doku-laravel/` berisi package reusable untuk integrasi DOKU.
- `packages/doku-laravel/README.md` berisi panduan package jika nanti dipisah ke project lain.
- `docs/PRD-doku-demo-app.md` berisi PRD awal.
- `docs/TECHDESIGN-doku-laravel-package.md` berisi technical design package.
- `docs/PACKAGE-EXTRACTION-CHECKLIST.md` berisi checklist saat package dipindah ke repository terpisah.

## Fitur yang sudah ada

- Laravel + Inertia React TSX sudah terpasang.
- Demo launcher di halaman `/`.
- Package lokal `roqianjas/doku-laravel` dengan contract `CheckoutService`, `StatusService`, dan `WebhookVerifier`.
- Driver `fake` untuk demo lokal tanpa credential DOKU.
- Driver `checkout` untuk integrasi HTTP DOKU Checkout.
- Halaman transaksi, detail transaksi, return page, dan event log.
- Endpoint webhook `POST /webhooks/doku`.
- Webhook hardening: verifikasi signature, validasi `Client-Id`, dan idempotency berbasis request id webhook.
- Sandbox lokal `GET /sandbox/doku/checkout/{order}` untuk simulasi sukses, pending, failed, expired, atau cancelled.

## Struktur package

```text
packages/doku-laravel
├── config/doku.php
├── src/Contracts
├── src/DTO
├── src/Exceptions
├── src/Services
├── src/Support
└── src/DokuServiceProvider.php
```

## Menjalankan project

1. Install dependency backend dan frontend.
2. Siapkan database MySQL Anda sendiri.
3. Jalankan migration.
4. Jalankan server Laravel dan Vite.

Contoh:

```powershell
composer install
npm install
php artisan migrate
php artisan serve
npm run dev
```

## Konfigurasi environment

Default project saat ini memakai:

- `DOKU_DRIVER=fake`
- `SESSION_DRIVER=file`
- `CACHE_STORE=file`
- `QUEUE_CONNECTION=sync`

Ini sengaja dipilih supaya halaman utama tetap bisa dibuka walaupun credential DOKU dan database final belum diisi.

### Untuk demo lokal tanpa credential DOKU

Biarkan nilai berikut:

```env
DOKU_DRIVER=fake
DOKU_ENV=sandbox
```

Saat checkout dibuat, user akan diarahkan ke sandbox lokal dan Anda bisa memilih outcome transaksi secara manual.

### Untuk mencoba DOKU Checkout asli

Ubah environment menjadi kira-kira seperti ini:

```env
DOKU_DRIVER=checkout
DOKU_ENV=sandbox
DOKU_CLIENT_ID=your-client-id
DOKU_SECRET_KEY=your-secret-key
DOKU_MERCHANT_ID=your-merchant-id
DOKU_BASE_URL=https://api-sandbox.doku.com
DOKU_NOTIFICATION_URL=https://your-public-url/webhooks/doku
```

Catatan:

- `DOKU_NOTIFICATION_URL` harus bisa diakses publik.
- Return page sample app memakai route `payments.return`.
- Webhook signature diverifikasi memakai format non-SNAP.
- Route webhook dikecualikan dari CSRF, tetapi tetap diamankan dengan signature verification DOKU.

### Untuk test lewat tunnel publik

Jika Anda memakai `localhost.run` atau proxy publik sejenis:

- set `APP_URL` dan `DOKU_NOTIFICATION_URL` ke domain tunnel aktif,
- gunakan `npm run build`, bukan `npm run dev`,
- pastikan file `public/hot` tidak ada,
- biarkan tunnel tetap hidup selama test webhook,
- restart `php artisan serve` dan jalankan `php artisan optimize:clear` setelah mengganti domain.

## Database

`.env.example` sudah diarahkan ke MySQL karena PHP lokal di environment ini tidak menyediakan `pdo_sqlite`.

Isi minimal berikut sebelum migration:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=doku_demo
DB_USERNAME=root
DB_PASSWORD=
```

## Route penting

- `/` halaman launcher demo.
- `POST /checkout/demo` membuat order dan checkout.
- `/payments` daftar transaksi.
- `/payments/{order}` detail transaksi.
- `/payments/{order}/return` return page dari checkout.
- `POST /payments/{payment}/sync` manual status sync.
- `POST /webhooks/doku` webhook DOKU.
- `/sandbox/doku/checkout/{order}` sandbox lokal untuk fake driver.

## Verifikasi yang sudah dilakukan

- `npm run build`
- `php artisan route:list`

## Catatan implementasi

- Logic gateway dipusatkan di package, bukan di controller app.
- Status internal dipetakan ke `created`, `pending`, `paid`, `failed`, `expired`, `cancelled`, `refunded`, dan `unknown`.
- App host menyimpan `orders`, `payments`, dan `payment_events`.
- Return page tidak menjadi source of truth tunggal; status final tetap mengikuti data internal terbaru.
- Event log payment sekarang juga menyimpan `provider_request_id` agar request checkout, manual sync, dan webhook lebih mudah diaudit.

## Referensi resmi DOKU

- https://developers.doku.com/accept-payments/doku-checkout
- https://developers.doku.com/accept-payments/doku-checkout/supported-payment-methods
- https://developers.doku.com/get-started-with-doku-api/check-status-api/non-snap
- https://developers.doku.com/get-started-with-doku-api/signature-component/snap
- https://packagist.org/packages/doku/doku-php-library


