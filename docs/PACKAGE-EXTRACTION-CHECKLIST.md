# Package Extraction Checklist

Checklist ini dipakai saat `packages/doku-laravel` dipindahkan menjadi repository terpisah.

## 1. Siapkan repository baru

- Buat repository baru untuk package.
- Alternatif tercepat dari repo demo ini: jalankan `scripts/export-doku-package.ps1` untuk mengekspor package ke folder repo standalone.
- Pindahkan seluruh isi `packages/doku-laravel/` ke root repository baru.
- Pastikan file berikut ikut terbawa:
  - `composer.json`
  - `README.md`
  - `LICENSE`
  - `config/doku.php`
  - `src/`
  - `tests/`
  - `phpunit.xml.dist`
  - `.github/workflows/tests.yml`

## 2. Ubah metadata Composer

- Pastikan nama package final memang `roqianjas/doku-laravel`, atau ganti lagi jika Anda memilih vendor Composer lain.
- Tambahkan informasi repository/public package setelah tujuan publish sudah final.
- Jalankan `composer validate --strict` di repository package.

## 3. Siapkan quality gate

- Jalankan `composer install` di repository package.
- Jalankan `composer test` di repository package.
- Tambahkan CI untuk menjalankan unit test.
- Sediakan environment CI yang memiliki `pdo_sqlite` atau MySQL untuk feature test.
- Pastikan rule linting dan formatting package konsisten.

## 4. Integrasikan ke host app

- Hapus path repository lokal dari host app jika package sudah dipublish.
- Ganti dependency host app dari path local ke package Composer biasa.
- Jalankan `composer update roqianjas/doku-laravel`.

## 5. Ulangi verifikasi integrasi

- Publish config package jika dibutuhkan.
- Isi `DOKU_*` environment variables di host app.
- Pastikan route webhook tetap:
  - `POST /webhooks/doku`
- Pastikan host app tetap:
  - mengecualikan route webhook dari CSRF,
  - memverifikasi signature DOKU,
  - mempercayai forwarded proxy headers saat berada di balik tunnel/proxy.

## 6. Uji flow minimum

- Create checkout.
- Redirect ke DOKU Checkout sandbox.
- Simulasikan payment success.
- Pastikan webhook tercatat.
- Pastikan status internal berubah menjadi `paid`.
- Uji juga duplicate webhook dan manual status sync.





