# Paket produksi 15 Oktober 2026

Build aplikasi disiapkan dalam folder `dist` dan arsip ZIP di root project.
Arsip berisi isi `dist`, termasuk `.htaccess`, frontend, dan backend PHP.

## Hasil yang diukur

Laporan Lighthouse mengukur halaman **login publik `/login`**, mobile dan desktop,
dengan throttling standar, profil Chrome terpisah, hasil build produksi, gzip,
dan header statis. Laporan HTML/JSON lengkap berada di `docs/audit/lighthouse-*`.
Skor ini bukan jaminan untuk seluruh halaman internal atau server hosting.
Hosting perlu diuji kembali setelah unggah karena latensi, HTTPS, kompresi,
dan konfigurasi server memengaruhi hasil.

Halaman login publik memakai HTML hasil prerender dan JavaScript kecil untuk
form, pengecekan sesi, tombol password, dan pergantian informasi. Aplikasi React
lengkap dimuat pada modul internal. Model wajah dimuat saat fitur wajah dibuka.
Halaman internal tetap memakai pemeriksaan sesi dan role server, serta noindex.

## Unggah

1. Ekstrak isi ZIP ke root aplikasi hosting. Pastikan `.htaccess` ikut terunggah;
   aturan ini menyajikan `login.html` pada URL `/login`.
2. Pertahankan konfigurasi `config/db_env.php`, `config/mail.local.php`, serta
   data `uploads`/`storage` yang sudah ada di hosting. File konfigurasi pribadi
   dan data pengguna tidak disertakan di paket ini.
3. Muat ulang halaman dan periksa login, absen masuk/pulang, lalu jalankan
   Lighthouse pada URL hosting. Migrasi penghapusan akun dari pekerjaan
   sebelumnya tetap mengikuti `ACCESS_RIGHTS.md`.

## Pengujian lokal

```sh
npm run build
node tools/check-build-artifact.cjs
node tools/check-production-apache.cjs
node tools/access-rights-browser-check.cjs --attendance --preview
node tools/lighthouse-build-check.cjs
```

Runner Apache menggunakan instalasi lokal `C:/Muhammadfaizal/apache` dan port
loopback terpisah. Runner browser memakai database sintetis sementara dan
memastikan data asli tetap utuh. Runner Lighthouse memakai Lighthouse dari
cache npm lokal; lokasi paket lain dapat diberikan melalui
`CREATIVA_LIGHTHOUSE_PATH`.
