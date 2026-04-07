# PRD: Sample Web App Laravel Inertia + DOKU

Status: Draft for review  
Tanggal: 2026-04-07  
Owner: Product + Engineering

## 1. Ringkasan

Dokumen ini mendefinisikan kebutuhan produk untuk 1 sample web app berbasis Laravel + Inertia.js + React TSX yang terintegrasi dengan DOKU payment gateway.

Tujuan utama sample app ini bukan hanya menampilkan alur pembayaran end-to-end, tetapi juga menjadi reference implementation untuk package Laravel DOKU yang reusable di project lain.

Pendekatan fase 1 yang direkomendasikan:

- Gunakan DOKU Checkout sebagai entry point integrasi pembayaran.
- Gunakan HTTP Notification dari DOKU untuk update status transaksi.
- Bangun package Laravel terpisah agar logika DOKU tidak tersebar di app.
- Siapkan struktur yang memungkinkan perluasan ke SNAP, Virtual Account, atau direct API pada fase berikutnya.

## 2. Latar Belakang

Saat ini belum ada pengalaman integrasi DOKU yang dibungkus sebagai package Laravel reusable di workspace ini. DOKU memang memiliki dokumentasi resmi dan SDK PHP untuk sebagian use case SNAP, tetapi kebutuhan kita adalah:

- developer experience yang cocok untuk Laravel,
- API yang konsisten untuk dipakai lintas project,
- webhook handling yang rapi,
- normalisasi status transaksi,
- dan sample app yang bisa dipakai sebagai blueprint implementasi.

Karena itu, project ini akan terdiri dari dua deliverable:

- sample web app untuk demo alur bisnis pembayaran,
- package Laravel DOKU yang reusable dan dapat dipisahkan ke repo sendiri.

## 3. Tujuan Produk

### Tujuan utama

- Menyediakan demo aplikasi web yang menunjukkan alur create order, checkout ke DOKU, callback, webhook, dan status payment.
- Menyediakan package Laravel DOKU yang reusable, terdokumentasi, dan siap dipakai ulang.
- Mengurangi risiko integrasi di project berikutnya dengan pola integrasi yang sudah tervalidasi.

### Tujuan bisnis

- Mempercepat future integration project dengan DOKU.
- Menjadi baseline internal untuk standar payment integration.
- Memudahkan onboarding developer lain karena alur dan package sudah terdokumentasi.

### Tujuan teknis

- Memisahkan concern aplikasi dengan concern payment gateway.
- Menyediakan lapisan abstraction agar app tidak bergantung langsung pada detail header, signature, dan endpoint DOKU.
- Menyediakan observability dasar untuk debugging transaksi.

## 4. Non-Goals Fase 1

Hal-hal berikut tidak menjadi target implementasi awal, kecuali nanti disetujui saat review:

- Multi-merchant atau multi-tenant.
- Subscription atau recurring payment.
- Refund automation.
- Settlement reconciliation.
- Penyimpanan instrumen kartu.
- Integrasi semua channel SNAP sekaligus.
- Dashboard operasional yang kompleks.
- Backoffice production-grade dengan role/permission penuh.

## 5. Persona

### Merchant Admin / Developer Internal

Kebutuhan:

- Bisa membuat order demo.
- Bisa memicu pembayaran ke DOKU.
- Bisa melihat status transaksi.
- Bisa memastikan callback dan webhook berjalan benar.
- Bisa memakai package yang sama di project lain.

### End Customer Demo

Kebutuhan:

- Melihat item yang akan dibayar.
- Melanjutkan checkout ke DOKU.
- Mendapat halaman sukses, pending, atau gagal setelah pembayaran.

## 6. Problem Statement

Tanpa abstraction yang rapi, integrasi payment gateway biasanya menghasilkan:

- logika signature dan request yang tersebar di controller,
- webhook handling yang rapuh,
- status transaksi yang tidak konsisten,
- sulit diuji,
- dan sulit dipindahkan ke project baru.

Sample app ini harus membuktikan bahwa integrasi DOKU dapat dibuat:

- terstruktur,
- reusable,
- mudah diuji,
- dan mudah diadopsi ulang.

## 7. Ruang Lingkup Fase 1

### In scope

- Laravel app dengan UI berbasis Inertia.js + React TSX.
- Halaman daftar produk atau item demo.
- Halaman checkout sederhana.
- Pembuatan order internal.
- Pembuatan payment request ke DOKU Checkout.
- Redirect customer ke halaman pembayaran DOKU.
- Return URL dari DOKU ke aplikasi.
- Notification URL untuk webhook DOKU.
- Penyimpanan order, payment, dan payment events dasar.
- Halaman riwayat transaksi.
- Sinkronisasi status berbasis webhook.
- Manual check status transaction dari aplikasi bila dibutuhkan.
- Logging dan error handling dasar.
- Dokumentasi setup sandbox.

### Out of scope

- Full ERP or e-commerce workflow.
- Shipping, inventory, coupon, pajak yang kompleks.
- Integrasi payment method di luar DOKU.

## 8. Asumsi Produk

- Workspace saat ini masih greenfield.
- Implementasi pertama ditujukan untuk environment sandbox DOKU.
- Flow awal difokuskan ke DOKU Checkout karena paling cepat untuk demo end-to-end.
- Aplikasi demo akan memakai single merchant credential terlebih dahulu.
- Package akan dikembangkan di repo yang sama dulu, lalu disiapkan agar mudah dipisah menjadi package mandiri.

## 9. User Stories

### Checkout flow

- Sebagai user demo, saya ingin melihat item yang akan dibayar agar saya tahu nominal transaksi.
- Sebagai user demo, saya ingin menekan tombol bayar dan diarahkan ke DOKU agar bisa menyelesaikan pembayaran.
- Sebagai user demo, saya ingin kembali ke halaman hasil pembayaran agar tahu apakah transaksi sukses, pending, atau gagal.

### Admin / internal flow

- Sebagai admin internal, saya ingin membuat order demo agar dapat menguji berbagai skenario payment.
- Sebagai admin internal, saya ingin melihat status order dan payment agar tahu lifecycle transaksi.
- Sebagai admin internal, saya ingin melihat riwayat event webhook agar debugging lebih mudah.
- Sebagai admin internal, saya ingin menjalankan manual status sync agar bisa memverifikasi transaksi jika webhook terlambat.

### Developer flow

- Sebagai developer, saya ingin memakai service dari package Laravel agar integrasi DOKU tidak ditulis ulang.
- Sebagai developer, saya ingin konfigurasi lewat file config dan env agar setup per project mudah.
- Sebagai developer, saya ingin event dan exception yang konsisten agar observability lebih baik.

## 10. Functional Requirements

### FR-01 Product and order demo

- Sistem harus menyediakan minimal 1 halaman untuk membuat order demo.
- Sistem harus menyimpan order number, amount, currency, customer info minimum, dan status order.

### FR-02 Create payment session

- Sistem harus dapat membuat payment request ke DOKU dari order internal.
- Sistem harus menyimpan relasi antara order internal dan referensi transaksi DOKU.
- Sistem harus menyimpan request identifier yang diperlukan untuk tracing.

### FR-03 Redirect to DOKU

- Sistem harus mengarahkan user ke payment page DOKU setelah payment session berhasil dibuat.
- Sistem harus menampilkan error yang aman bila pembuatan payment gagal.

### FR-04 Return URL handling

- Sistem harus memiliki endpoint atau page untuk menerima redirect result dari DOKU.
- Return URL tidak boleh menjadi satu-satunya sumber kebenaran status transaksi.
- Status final harus ditentukan dari webhook atau check status, bukan hanya query parameter return URL.

### FR-05 Notification URL handling

- Sistem harus memiliki endpoint webhook khusus DOKU.
- Sistem harus memverifikasi request webhook dari DOKU sesuai mekanisme signature resmi yang dipakai pada flow implementasi.
- Sistem harus menyimpan payload webhook untuk audit.
- Sistem harus idempotent terhadap webhook duplikat.

### FR-06 Payment status management

- Sistem harus memetakan status dari DOKU ke status internal yang sederhana, minimal:
- `created`
- `pending`
- `paid`
- `failed`
- `expired`
- `cancelled`

### FR-07 Transaction history

- Sistem harus menyediakan halaman list transaksi.
- Sistem harus menampilkan order number, amount, payment method bila tersedia, reference dari DOKU, dan status terakhir.

### FR-08 Manual status sync

- Sistem harus menyediakan aksi manual untuk meminta status transaksi ke DOKU.
- Hasil sync harus memperbarui payment dan menambah event log.

### FR-09 Logging and diagnostics

- Sistem harus mencatat request/response gateway secara aman.
- Sistem tidak boleh mencatat credential rahasia dalam plaintext.
- Sistem harus menyediakan correlation data minimum untuk debugging.

### FR-10 Developer usability

- Integrasi DOKU di app harus melalui package/service abstraction, bukan langsung dari controller ke HTTP client.
- Konfigurasi harus dapat diatur melalui `.env` dan file config publishable.

## 11. Non-Functional Requirements

### Security

- Secret key dan credential harus disimpan via environment variable.
- Signature request dan webhook wajib diverifikasi.
- Tidak menyimpan data kartu sensitif.
- Logging harus mem-mask field sensitif.

### Reliability

- Webhook processing harus aman untuk retry.
- Update status harus idempotent.
- Error gateway harus dipisahkan dari error aplikasi umum.

### Maintainability

- Kode integrasi harus modular dan mudah dipindahkan ke package terpisah.
- Harus ada automated tests untuk signature, request builder, webhook verification, dan status mapping.

### Observability

- Harus ada log context untuk order id, payment id, request id, dan reference gateway.

### Performance

- Response checkout initiation untuk user normal harus tetap cepat, dengan proses berat dipindahkan ke queue bila perlu.

## 12. UX Scope

UI sample app cukup sederhana, tetapi harus jelas dan usable:

- halaman daftar item atau order demo,
- halaman checkout/summary,
- halaman status pembayaran,
- halaman transaksi internal,
- halaman detail transaksi dan event log sederhana.

UI tidak perlu mengikuti desain final production, tetapi harus cukup baik untuk:

- demo,
- testing,
- dan onboarding developer/stakeholder.

## 13. Data Model Awal

### Order

- id
- order_number
- customer_name
- customer_email
- currency
- amount
- status
- created_at
- updated_at

### Payment

- id
- order_id
- provider
- provider_reference
- request_id
- payment_method
- amount
- currency
- status
- checkout_url atau payment_url
- raw_response_summary
- paid_at nullable
- expired_at nullable
- created_at
- updated_at

### Payment Event

- id
- payment_id
- event_type
- source
- payload
- signature_status
- processed_at
- created_at

## 14. Success Metrics

### Delivery success

- Sample app dapat menjalankan happy path pembayaran sandbox end-to-end.
- Webhook masuk dan memutakhirkan status transaksi secara konsisten.
- Package dapat dipakai oleh sample app tanpa coupling ke controller spesifik.

### Reusability success

- Minimal 80 persen logika DOKU ditempatkan di package, bukan di app.
- Project Laravel baru dapat mengadopsi package dengan setup yang jelas dan minim perubahan.

### Quality success

- Terdapat automated tests untuk flow inti package.
- Terdapat dokumentasi instalasi dan konfigurasi sandbox.

## 15. Risiko dan Mitigasi

### Risiko 1: Perbedaan flow antar produk DOKU

Mitigasi:

- Fase 1 dibatasi ke DOKU Checkout.
- Desain package dibuat berbasis driver/module agar produk lain bisa ditambah bertahap.

### Risiko 2: Ketergantungan berlebih pada return URL

Mitigasi:

- Status final ditentukan oleh webhook dan/atau check status API.

### Risiko 3: Webhook duplikat atau out-of-order

Mitigasi:

- Terapkan idempotency dan event log.
- Simpan semua event lalu update status dengan aturan transisi yang aman.

### Risiko 4: Package terlalu terikat ke sample app

Mitigasi:

- Package hanya memegang concern DOKU.
- Persistence dan business rule inti tetap dikontrol app melalui contract dan event.

### Risiko 5: Scope creep ke banyak channel

Mitigasi:

- Definisikan fase 1 hanya untuk checkout orchestration.
- Tambahan SNAP/VA/refund masuk backlog fase berikutnya.

## 16. Rencana Delivery Bertahap

### Phase A: Foundation

- Bootstrap Laravel + Inertia React TSX.
- Buat domain order dan payment minimum.
- Buat skeleton package lokal.

### Phase B: DOKU Checkout integration

- Implement request signing, create checkout, return URL, notification URL, dan status sync.

### Phase C: Admin visibility

- Tambah list transaksi, detail transaksi, dan event log sederhana.

### Phase D: Hardening

- Tambah tests, retry strategy, logging mask, dan dokumentasi install.

## 17. Open Questions untuk Review

- Apakah fase 1 memang disetujui fokus hanya ke DOKU Checkout, bukan langsung SNAP/VA?
- Apakah sample app cukup berupa demo order tunggal, atau perlu katalog produk mini?
- Apakah manual check status perlu muncul di UI sejak fase 1, atau cukup endpoint internal dulu?
- Apakah package ingin disiapkan langsung dengan nama vendor final, atau sementara memakai nama internal dulu?
- Apakah target akhir package akan dipublikasikan ke Packagist, atau cukup private package internal?

## 18. Rekomendasi Keputusan

Agar implementasi cepat tetapi tetap reusable, rekomendasi saya:

- setujui scope fase 1 pada DOKU Checkout + webhook + status sync,
- buat sample app demo order sederhana,
- bangun package Laravel lokal terlebih dahulu di repo yang sama,
- setelah stabil, baru pecah menjadi package mandiri dan siapkan publish workflow.

## 19. Referensi Resmi

Referensi di bawah dicek pada 2026-04-07:

- DOKU Checkout overview: https://developers.doku.com/accept-payments/doku-checkout
- Supported payment methods for DOKU Checkout: https://developers.doku.com/accept-payments/doku-checkout/supported-payment-methods
- DOKU Non-SNAP Check Status: https://developers.doku.com/get-started-with-doku-api/check-status-api/non-snap
- DOKU SNAP signature component: https://developers.doku.com/get-started-with-doku-api/signature-component/snap
- Official DOKU PHP SDK on Packagist: https://packagist.org/packages/doku/doku-php-library
