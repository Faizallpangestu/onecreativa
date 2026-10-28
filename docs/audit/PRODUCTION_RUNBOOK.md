# Runbook kandidat release ONE Creativa

Status: **untuk persiapan staging; production NO-GO** sampai gate dalam [readiness report](PRODUCTION_READINESS.md) ditutup. Semua uji mutation memakai database fixture/staging, bukan data bisnis production.

## 1. Siapkan staging terpisah

Gunakan PHP dengan mysqli, mbstring, fileinfo dan ekstensi yang dibutuhkan PHPMailer; MariaDB dengan InnoDB serta constraint/trigger yang didukung. Versi server target harus diverifikasi sendiri; bukti lokal memakai MariaDB 10.4.32. Jangan mengekspos development server Vite atau PHP built-in server sebagai production.

Siapkan database dan user staging terpisah. Simpan konfigurasi lokal host dalam `config/db_env.php` pada document root release (`backend/config/db_env.php` pada source tree). Jangan memasukkan password dalam command line, log atau artifact. Host tanpa file konfigurasi terlindungi tidak boleh memakai fallback database localhost.

Set `CREATIVA_TIMEZONE` sesuai kebijakan perusahaan; default aplikasi Asia/Jakarta. Pastikan class timezone, jam PHP/database dan tanggal laporan konsisten. Konfigurasi SMTP menggunakan file private `config/mail.local.php` sesuai konfigurasi existing; paket tidak menyalin SMTP rahasia antarhost. AI menggunakan `CREATIVA_AI_API_KEY`; tanpa key fitur harus menampilkan unavailable, bukan respons percakapan buatan. Rotasi key AI lama melalui pemilik provider.

Storage privat harus writable oleh account PHP dan denied melalui web. `storage/documents`, bukti Finance/RAB, uploads lama dan foto lama perlu dipertahankan beserta metadata nama file. Jangan menyalin isi backup atau QA ke document root. Verifikasi filesystem permission dan direct URL denial di staging.

## 2. Backup dan schema

Sebelum perubahan target: maintenance write window, backup konsisten seluruh database beserta trigger, serta backup storage/uploads/config/source di lokasi privat. Restore pada database terpisah dan bandingkan row count/hash/schema/trigger. Simpan log pemeriksaan tanpa PII dan rahasia.

Migrasi lokal yang sudah diterapkan:

1. `backend/migrations/20261012_relationships.sql` — 9 tabel.
2. `backend/migrations/20261012_attendance_sessions.sql` — 1 tabel.
3. `backend/migrations/20261012_student_payments.sql` — 1 tabel.
4. `backend/migrations/20261012_overtime_requests.sql` — 1 tabel.

Migrasi membutuhkan fondasi tabel Finance/HRD/LMS yang sudah ada. Jangan menjalankan SQL CREATE langsung pada database yang belum dibandingkan dengan schema lokal, dan jangan menggunakan `IF NOT EXISTS` untuk menyembunyikan perbedaan schema. `tools/release-relationships.cjs` membatasi koneksi localhost; tool tersebut bukan migrator remote production. Perbedaan schema target memerlukan preflight dan migrator target yang direview sebelum apply. Tidak ada HTTP endpoint untuk menjalankan migrasi.

Pemeriksaan lokal yang dapat diulang memakai PowerShell:

```powershell
node tools/release-relationships.cjs
node tools/release-relationships.cjs --attendance-sessions
node tools/release-relationships.cjs --student-payments
node tools/release-relationships.cjs --overtime
```

Tanpa `--apply-local`, perintah melakukan backup/restore verification dan preflight lokal, tidak mengubah tabel bisnis. Tabel yang sudah ada dibandingkan dengan expected schema. Tidak perlu apply ulang schema lokal yang sudah lulus. Tidak ada historical recovery dalam tool ini.

Isi konfigurasi operasional melalui form admin menggunakan hubungan yang sudah disahkan: kelas → assignment Sensei → enrollment → meeting. Finance menghubungkan invoice sumber dengan siswa secara eksplisit. Mapping orphan memakai bukti identitas dan approval record terpisah; tidak boleh berdasarkan kemiripan nama/email saja.

## 3. Jalankan verifikasi kandidat

```powershell
& C:\Muhammadfaizal\php\php.exe backend/tests/accounting_test.php
& C:\Muhammadfaizal\php\php.exe backend/tests/budget_workflow_test.php
& C:\Muhammadfaizal\php\php.exe backend/tests/salary_workflow_test.php
& C:\Muhammadfaizal\php\php.exe backend/tests/employee_directory_test.php
& C:\Muhammadfaizal\php\php.exe backend/tests/relationships_test.php
node tools/employee-ui-test.mjs
node tools/release-browser-check.cjs --http-only
node tools/phase2-data-integrity.cjs
& C:\Muhammadfaizal\php\php.exe tools/phase5-local-check.php
node node_modules/eslint/bin/eslint.js src
node node_modules/vite/bin/vite.js build --outDir .phase2-build-check
$env:CREATIVA_RELEASE_OUT = '.phase2-build-check'
node copy-backend.js
Remove-Item Env:CREATIVA_RELEASE_OUT
node tools/phase2-build-check.cjs
node tools/release-artifact-check.cjs
```

Semua integrasi mutation membuat database unik terisolasi dan menghapus hanya database fixture miliknya setelah selesai. HTTP QA memakai cookie/session/CSRF asli, upload multipart, folder QA privat, dan pengecekan bahwa database aplikasi tetap utuh. Test router CLI-only tidak ikut artifact. Sesuaikan path PHP pada mesin QA; jangan memakai QA fixture untuk membuat account production.

Browser runner `node tools/release-browser-check.cjs` tersedia untuk mesin dengan browser/CDP yang bekerja. Runner lokal saat ini gagal membuka port debugging Chrome/Edge; jangan menjadikan report `complete=false` sebagai PASS. Playwright tidak terpasang. Jalankan browser acceptance matrix manual/otomatis di mesin QA sebelum go-live.

## 4. Paket dan deployment staging

Artifact kandidat berada di `.phase2-build-check`, bukan `dist` lama. [Manifest](release-artifact-manifest.json) mencatat path dan SHA-256 file. Paket frontend/backend disusun untuk document root yang sama: `/api`, `/services`, `/config`, `/migrations`, `/storage`, `/uploads`.

Deploy melalui direktori release baru, lalu overlay konfigurasi host private dan sambungkan storage/uploads yang dipertahankan. Jangan menghapus direktori live atau menimpa storage/database dengan fixture. Jangan memakai sync dengan opsi delete atas storage. Endpoint lama yang tidak lagi disertakan dalam paket harus tidak dapat diakses melalui document root lama.

Apache harus mematuhi aturan `.htaccess`, memblokir browsing directory dan akses langsung ke config/services/vendor/migrations/storage/dokumen privat. Untuk Nginx, buat aturan deny setara sebelum QA; file `.htaccess` sendiri tidak membuktikan enforcement. Pastikan fallback SPA tidak mengubah API error menjadi HTML status 200.

Verifikasi pada HTTPS staging:

- URL privat/diagnostik serta PHP/script upload ditolak; file valid hanya melalui endpoint berizin.
- Anonymous API 401, foreign role/object 403, CSRF mutation 403, inactive session 401.
- Server tidak menampilkan SQL/password/hash; respons private `Cache-Control: no-store` dan request ID tersedia.
- Session cookie HttpOnly/SameSite dan Secure aktif pada TLS termination yang digunakan; proxy tidak boleh menyebabkan session cookie HTTP yang salah.
- Service worker baru aktif; API selalu NetworkOnly; data lama tidak diambil dari cache. Logout menghapus session server.
- Error jaringan tidak menghasilkan angka nol, array kosong atau sukses palsu pada flow yang direview.

## 5. UAT, rekonsiliasi, dan keputusan go-live

Gunakan [QA matrix](QA_PHASE_5_16.md) untuk scenario dan role. Uji desktop/mobile, focus/modal/table/label, upload/download, decimal/date/export, task draft/publish, QR nyata, klaim/approval/pembayaran/reversal, invoice siswa, Matching dan error/retry. Uji perangkat Face/RFID dan SMTP target dengan account QA.

Finance menandatangani rekonsiliasi sumber → transaction → allocation → journal → GL/TB/financial reports; cek bahwa capital/loan bukan profit dan approval RAB bukan expense/kas. Dokumentasikan selisih, resolution, reviewer dan waktunya. Seluruh role dan flow legacy yang belum tercakup juga harus disahkan; akses personal peserta Nenkin/Mendang/Alumni belum dianggap lengkap.

Setelah semua gate ditutup, owner release menetapkan waktu deploy production, backup terbaru, reviewer QA/Finance/HRD dan rencana pemantauan. Tidak ada deployment atau pesan kepada pihak lain yang dilakukan oleh pekerjaan lokal ini.

## 6. Rollback dan pemantauan

Jika staging/UAT gagal, hentikan affected writes dan kembalikan frontend/backend ke source release kompatibel. Biarkan tabel additive dan histori yang sudah ditulis tersedia. Jangan DROP tabel baru atau restore backup lama di atas transaksi baru. Gunakan forward fix/reversal melalui workflow yang direview.

Pantau request ID, HTTP 4xx/5xx, kegagalan login/upload/approval, konflik retry, keseimbangan journal dan sumber yang belum direview. Jangan mencatat password, token QR, cookie, dokumen atau nomor rekening dalam log publik. Simpan backup dan bukti acceptance secara privat sesuai kebijakan pemilik sistem.
