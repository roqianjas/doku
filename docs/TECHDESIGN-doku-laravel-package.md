# Technical Design: Reusable Laravel Package for DOKU

Status: Draft for review  
Tanggal: 2026-04-07  
Scope: Initial design for package architecture

## 1. Tujuan

Dokumen ini mendefinisikan desain teknis awal package Laravel untuk integrasi DOKU yang dapat:

- dipakai oleh sample app pada repo ini,
- dipakai ulang oleh project Laravel lain,
- dan berkembang dari use case DOKU Checkout fase 1 ke fitur DOKU lain pada fase berikutnya.

## 2. Prinsip Desain

- Laravel-first developer experience.
- Tidak mencampur business logic aplikasi dengan transport logic gateway.
- Reusable lintas project.
- Aman untuk webhook dan signature verification.
- Extensible untuk mendukung produk DOKU berikutnya.
- Testable tanpa harus selalu memanggil sandbox DOKU.

## 3. Keputusan Arsitektur Awal

### Decision 1

Package akan fokus pada DOKU Checkout di fase 1.

Alasan:

- integrasi paling cepat untuk demo end-to-end,
- risiko scope lebih kecil,
- cukup untuk membuktikan abstraction package.

### Decision 2

Package dibuat sebagai Laravel package lokal dulu, lalu disiapkan agar mudah dipindah ke repo sendiri.

Rekomendasi struktur:

- root project sebagai sample app,
- `packages/doku-laravel` sebagai package lokal composer path repository.

### Decision 3

Untuk fase 1, package akan mengimplementasikan HTTP integration dan signing yang diperlukan untuk Checkout flow secara native di dalam package.

Alasan:

- kebutuhan sample app fokus ke checkout orchestration,
- official PHP SDK DOKU yang tersedia saat ini berfokus pada area SNAP dan tidak otomatis memberi developer experience Laravel,
- native implementation memberi kontrol penuh atas API boundary package.

Catatan:

- Bila nanti SNAP feature ingin ditambah, package dapat menyediakan adapter baru yang memanfaatkan official SDK atau native implementation sesuai hasil evaluasi saat itu.

## 4. Target Package Scope Fase 1

### Public capabilities

- membaca konfigurasi DOKU dari Laravel config dan env,
- membuat payment session/checkout request,
- memvalidasi webhook/notification,
- normalisasi response dan status,
- check status transaksi,
- melempar event Laravel untuk hook aplikasi,
- menyediakan exception hierarchy yang konsisten,
- menyediakan fake driver untuk testing.

### Out of scope package fase 1

- persistence opinionated yang mengunci skema database tertentu,
- UI package,
- admin dashboard,
- auto-refund,
- settlement module,
- multi-merchant orchestration.

## 5. Batas Tanggung Jawab

### Package bertanggung jawab atas

- config loading,
- request construction,
- HTTP client to DOKU,
- signature generation,
- webhook verification,
- payload parsing,
- status mapping,
- domain DTO dan result object,
- event dispatching,
- logging hook,
- test utilities.

### Aplikasi host bertanggung jawab atas

- order lifecycle,
- database schema final,
- authorization,
- UI dan route app,
- policy bisnis,
- queue tuning,
- audit retention,
- notifikasi ke user.

## 6. Usulan Struktur Direktori Package

```text
packages/
  doku-laravel/
    composer.json
    config/
      doku.php
    routes/
      webhook.php
    src/
      Contracts/
      DTO/
      Enums/
      Events/
      Exceptions/
      Http/
      Mapping/
      Services/
      Support/
      Webhooks/
      DokuServiceProvider.php
    tests/
```

## 7. Public API yang Diusulkan

### Service facade style

```php
$result = app(\Vendor\Doku\Contracts\CheckoutService::class)->createCheckout(
    new CreateCheckoutData(
        orderNumber: 'ORD-20260407-0001',
        amount: 150000,
        currency: 'IDR',
        customerName: 'Budi',
        customerEmail: 'budi@example.com',
        successUrl: route('payments.return.success'),
        failedUrl: route('payments.return.failed'),
        notificationUrl: route('doku.webhook'),
    )
);
```

### Result object

Contoh data yang dikembalikan:

- `isSuccess`
- `providerReference`
- `requestId`
- `paymentUrl`
- `status`
- `raw`

### Webhook verifier

```php
$notification = app(\Vendor\Doku\Contracts\WebhookVerifier::class)
    ->parseAndVerify($headers, $body);
```

## 8. Contract yang Direkomendasikan

- `CheckoutService`
- `StatusService`
- `WebhookVerifier`
- `SignatureGenerator`
- `GatewayClient`
- `StatusMapper`
- `LoggerContextFactory`

Dengan contract ini, app host dapat:

- mock service untuk test,
- mengganti implementation tertentu bila dibutuhkan,
- dan menjaga package tetap fleksibel.

## 9. Konfigurasi yang Direkomendasikan

File `config/doku.php`:

```php
return [
    'driver' => env('DOKU_DRIVER', 'checkout'),
    'environment' => env('DOKU_ENV', 'sandbox'),
    'client_id' => env('DOKU_CLIENT_ID'),
    'secret_key' => env('DOKU_SECRET_KEY'),
    'merchant_id' => env('DOKU_MERCHANT_ID'),
    'base_url' => env('DOKU_BASE_URL'),
    'notification_url' => env('DOKU_NOTIFICATION_URL'),
    'success_url' => env('DOKU_SUCCESS_URL'),
    'failed_url' => env('DOKU_FAILED_URL'),
    'timeout' => (int) env('DOKU_TIMEOUT', 15),
    'log_channel' => env('DOKU_LOG_CHANNEL'),
    'mask_sensitive' => true,
];
```

Catatan:

- field final dapat berubah setelah kita lock flow endpoint yang akan dipakai,
- config harus cukup kecil agar tidak membingungkan,
- environment production dan sandbox harus dipisahkan jelas.

## 10. Flow Integrasi Fase 1

### Flow A: Create checkout

1. User klik tombol bayar di app.
2. App membuat `Order`.
3. App memanggil `CheckoutService` dari package.
4. Package membangun request ke DOKU.
5. Package generate signature/header yang dibutuhkan.
6. Package memanggil endpoint DOKU.
7. Package mengembalikan `paymentUrl` dan reference ke app.
8. App membuat `Payment`.
9. User di-redirect ke halaman pembayaran DOKU.

### Flow B: Return URL

1. Setelah user selesai atau meninggalkan flow DOKU, user kembali ke app.
2. App menampilkan halaman hasil sementara.
3. App mengambil status transaksi dari data internal terbaru.
4. Jika status final belum ada, app bisa menampilkan `pending`.

### Flow C: Webhook

1. DOKU memanggil endpoint webhook app.
2. Route webhook diarahkan ke controller/handler package.
3. Package memverifikasi signature dan payload.
4. Package menghasilkan notification object terstruktur.
5. App atau listener internal memproses update status payment.
6. Event log disimpan.
7. Endpoint mengembalikan acknowledgement sesuai kontrak integrasi.

### Flow D: Manual check status

1. Admin klik sync status.
2. App memanggil `StatusService`.
3. Package memanggil check status API DOKU.
4. Package memetakan hasil ke status internal.
5. App memperbarui payment dan event log.

## 11. Status Mapping Internal

Package perlu memetakan status eksternal DOKU ke enum internal yang stabil:

- `created`
- `pending`
- `paid`
- `failed`
- `expired`
- `cancelled`
- `unknown`

Aturan penting:

- `paid` dianggap final.
- status final tidak boleh diturunkan kembali oleh event yang lebih lama.
- event duplikat tetap dicatat, tetapi tidak boleh merusak state akhir.

## 12. Webhook Handling Strategy

### Prinsip

- verify first, process second,
- idempotent by design,
- simpan raw payload,
- pisahkan validasi signature dari business update.

### Rekomendasi implementasi

- package menyediakan parser + verifier,
- app menyediakan listener atau action untuk update database,
- event Laravel dipakai untuk menghubungkan package dan app,
- webhook bisa diproses sync atau lewat queue tergantung kebutuhan.

### Event yang direkomendasikan

- `DokuNotificationReceived`
- `DokuNotificationVerified`
- `DokuPaymentStatusUpdated`
- `DokuRequestFailed`

## 13. Error Model

Package sebaiknya punya exception yang eksplisit:

- `ConfigurationException`
- `AuthenticationException`
- `SignatureVerificationException`
- `GatewayRequestException`
- `GatewayResponseException`
- `UnsupportedFeatureException`

Manfaat:

- memudahkan penanganan error di app,
- memudahkan mapping error ke HTTP response,
- memudahkan test.

## 14. Logging Strategy

Package harus log seperlunya, bukan berlebihan.

Minimal context:

- order number bila ada,
- internal payment id bila ada,
- request id,
- provider reference,
- endpoint name,
- environment,
- result status.

Field sensitif harus di-mask:

- secret key,
- signature raw penuh,
- credential sensitif lain.

## 15. Testing Strategy

### Unit tests

- signature generation,
- signature verification,
- request payload builder,
- status mapping,
- exception mapping.

### Integration tests

- create checkout service dengan HTTP fake,
- webhook parsing end-to-end,
- check status flow dengan HTTP fake.

### Contract tests di sample app

- app bisa membuat order dan payment melalui package,
- webhook yang valid mengubah status,
- webhook duplikat tidak menyebabkan data korup.

## 16. Sample App Integration Boundary

Agar package reusable, sample app tidak boleh mengandalkan class internal package terlalu dalam.

Pattern yang direkomendasikan:

- controller app memanggil contract package,
- controller menyimpan hasil ke model app,
- listener app memproses event dari package,
- model dan migration tetap milik app.

Dengan ini package bisa dipakai di project lain yang punya skema database berbeda.

## 17. Rencana Packaging dan Distribusi

### Tahap awal

- develop package sebagai local path repository.

### Setelah stabil

- pindahkan ke repo terpisah,
- rapikan namespace vendor final,
- tambah CI untuk test matrix,
- publish ke private repository atau Packagist sesuai keputusan review.

## 18. Open Questions untuk Review

- Apakah package harus langsung mendukung dua mode, `checkout` dan `snap`, atau `checkout` dulu?
- Apakah webhook route disediakan package secara otomatis, atau hanya helper/controller yang di-registrasi manual oleh app?
- Apakah event update status akan diproses sinkron atau via queue pada implementasi awal?
- Apakah kita ingin menyimpan raw request/response penuh, atau versi yang sudah disanitasi saja?
- Nama vendor/package final ingin dikunci sekarang atau nanti?

## 19. Rekomendasi Implementasi

Rekomendasi saya untuk implementasi sesudah dokumen ini disetujui:

1. Bootstrap sample app Laravel Inertia React TSX.
2. Buat package lokal `packages/doku-laravel`.
3. Implement fase 1 pada DOKU Checkout + webhook + status sync.
4. Tambahkan automated tests dan sample UI transaksi.
5. Finalisasi boundary package sebelum publish untuk reuse lintas project.

## 20. Referensi Resmi

Referensi di bawah dicek pada 2026-04-07:

- DOKU Checkout overview: https://developers.doku.com/accept-payments/doku-checkout
- Supported payment methods for DOKU Checkout: https://developers.doku.com/accept-payments/doku-checkout/supported-payment-methods
- DOKU Non-SNAP Check Status: https://developers.doku.com/get-started-with-doku-api/check-status-api/non-snap
- DOKU SNAP signature component: https://developers.doku.com/get-started-with-doku-api/signature-component/snap
- Official DOKU PHP SDK on Packagist: https://packagist.org/packages/doku/doku-php-library
