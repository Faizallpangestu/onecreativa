# QA runbook - OneCreativa full-scope handover

Tujuan: menghasilkan bukti pengujian yang dapat diaudit untuk seluruh modul dan form serah terima berbasis Markdown. Semua perintah dijalankan lokal; tidak ada deploy, tidak ada penulisan ke database produksi, dan tidak ada pengiriman email eksternal.

## Prasyarat

- Node.js 20+ dan npm; dependensi sudah terpasang (`npm ci` bila belum).
- PHP 8.2 CLI dengan ekstensi `mysqli`, `mbstring`, `fileinfo`, dan akses ke MariaDB/MySQL lokal.
- Akun database lokal dengan izin membuat database sementara untuk test. Konfigurasi dibaca dari `backend/config/database.php` atau override privat `backend/config/db_env.php` (jangan commit file privat).
- Chrome/Edge untuk `test:browser` bila tersedia.
- Staging terpisah + akun QA nyata untuk UAT (lihat `docs/QA_FORM/TEST_CASE_MATRIX.md` dan `docs/audit/QA_PHASE_5_16.md:34`).

## Menyiapkan database lokal (XAMPP)

Runner browser membuat database sintetis dengan menyalin schema dari database lokal `one-creativa`. Pada mesin QA ini MySQL tidak terpasang sebagai Windows service dan shell tidak memiliki hak admin, jadi proses dijalankan melalui WMI agar tetap hidup setelah perintah selesai:

```powershell
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine = '"C:\xampp\mysql\bin\mysqld.exe" --defaults-file=C:\xampp\mysql\bin\my.ini'
}
"pid=$($r.ProcessId)"
Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet
```

Lalu siapkan schema (jalankan sekali, kecuali DB dibuat ulang):

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' -u root -e 'CREATE DATABASE IF NOT EXISTS `one-creativa` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;'
cmd /c '"C:\xampp\mysql\bin\mysql.exe" -u root --default-character-set=utf8mb4 "one-creativa" < "D:\Project\creativa\onecreativa\backend\migrations\ONE_CREATIVA_HOSTINGER_BERSIH_2026.sql"'
& 'C:\xampp\mysql\bin\mysql.exe' -u root 'one-creativa' -e 'ALTER TABLE peserta_intensif ADD COLUMN IF NOT EXISTS metode_pembayaran VARCHAR(50) DEFAULT NULL AFTER program;'
```

Catatan: proses mysqld bukan service, jadi harus dijalankan ulang setelah komputer restart. Jangan menaruh password pada perintah, log, atau artifact.

## Lighthouse (BLK-002)

```powershell
npm install --no-save --no-audit --no-fund lighthouse chrome-launcher
$env:CREATIVA_LIGHTHOUSE_PATH = (Resolve-Path 'node_modules\lighthouse').Path
node tools/lighthouse-build-check.cjs
```

Script mengembalikan exit 1 bila ada skor di bawah 100. Itu adalah temuan performa/aksesibilitas, bukan kegagalan instalasi; catat skor aktualnya di form.

## Cetak form ke PDF

```powershell
npx --yes marked@12 -i "docs/QA_FORM/QA_SERAH_TERIMA_<run>.md" -o "docs/QA_FORM/.qa-form.html"
# sisipkan style @page A4 landscape pada HTML sebelum mencetak
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer `
  --print-to-pdf="D:\Project\creativa\onecreativa\docs\QA_FORM\QA_SERAH_TERIMA_<run>.pdf" `
  "file:///D:/Project/creativa/onecreativa/docs/QA_FORM/.qa-form.html"
```

Environment variable (nama saja, tanpa nilai):

| Nama | Fungsi |
| --- | --- |
| `PHP_BIN` | Path executable PHP; default `php` untuk runner, fallback lama untuk browser runner |
| `CHROME_BIN` | Path executable Chrome untuk browser runner |
| `CREATIVA_TIMEZONE` | Zona waktu aplikasi; default `Asia/Jakarta` |
| `CREATIVA_RELEASE_OUT` | Output artifact build; tidak dipakai oleh runner QA |
| `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT` | Identitas database lokal untuk pemeriksaan read-only tertentu |

Contoh (PowerShell, sesi saat ini saja):

```powershell
$env:PHP_BIN = 'php'
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

## Perintah

| Perintah | Output | Catatan |
| --- | --- | --- |
| `npm run lint` | console | ESLint seluruh repo |
| `npm run test:php` | `docs/QA_FORM/evidence/php-tests.json` | Menjalankan semua `backend/tests/*_test.php` dengan database sintetis terisolasi |
| `npm run test:http` | console + log proses di `backend/storage/qa/` | 102+ check HTTP nyata: session, CSRF, multipart, role, QR, billing, Matching |
| `npm run test:browser` | `docs/audit/release-browser-verification.json` | Butuh Chrome + CDP; gagal berarti Blocked, bukan Pass |
| `node tools/access-rights-browser-check.cjs` | `docs/audit/access-rights-verification.json` | Login, role, deletion, dan attendance; butuh DB lokal + Chrome |
| `node tools/employee-ui-test.mjs` | console | 12 state/role/error checks tanpa browser |
| `node tools/student-invoice-browser-test.mjs` | console | 15 skenario mock API; bukan backend E2E |
| `node tools/invoice-email-browser-test.mjs` | console | Mock API; saat ini gagal pada DEF-003 |
| `node tools/receipt-browser-test.mjs` | console | Mock API; saat ini gagal pada DEF-004 |
| `npm run test:all` | gabungan lint + PHP + HTTP | Browser sengaja tidak termasuk karena bergantung mesin/UI |
| `npm run qa:xlsx` | `docs/QA_FORM/QA_SERAH_TERIMA_<run>.xlsx` | Membuat versi Excel dari form `.md` terbaru dan matriks kasus; file ini bisa di-upload ke Google Sheets |
| `php tools/phase5-local-check.php` | console | Pemeriksaan read-only direktori karyawan pada database lokal |

Build/artifact (dijalankan terpisah untuk menjaga paket produksi tidak tertimpa):

```powershell
node node_modules/vite/bin/vite.js build --outDir .qa-build-check
node tools/check-build-artifact.cjs
```

Bukti lama di `docs/audit/` tetap menjadi referensi, bukan hasil run ini. Salin ringkasan hasil ke `docs/QA_FORM/evidence/` dengan nama yang jelas.

## Mengisi form

1. Isi `docs/QA_FORM/QA_SERAH_TERIMA_TEMPLATE.md` sebagai salinan baru `docs/QA_FORM/QA_SERAH_TERIMA_<tanggal>-<commit>.md`.
2. Untuk setiap case di `docs/QA_FORM/TEST_CASE_MATRIX.md`, pindahkan hasil ke bagian B form dengan ID yang sama.
3. `Pass` wajib memiliki path bukti; `Fail` wajib memiliki ID defect di bagian C; `Blocked` wajib alasan di bagian D.
4. Jangan tulis password, hash, cookie, token QR, nomor rekening, atau data pribadi ke form/screenshot.
5. Cetak: buka Markdown preview → Print → Save as PDF → A4 landscape, margin narrow, background graphics on, header/footer off.

## Gate

Gate awal adalah **NO-GO** sampai semua P0 tertutup dan tidak ada Blocker/Major yang open. Jika staging/akun QA tidak tersedia, nyatakan Blocked dan minta keputusan tertulis pemilik sistem; jangan menggantinya dengan PASS dari test lokal.
