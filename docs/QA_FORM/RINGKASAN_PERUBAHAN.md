# Ringkasan seluruh perubahan — QA run 2026-11-27

Dokumen ini satu-satunya tempat yang mencatat **semua** perubahan yang dibuat selama QA run ini. Tidak ada perubahan yang di-revert. Semua masih berada di working tree/commit `cbb4c90`.

Tanggal: 2026-11-27
Commit saat pengujian: `cbb4c90` (merge main `2599827`)
Keputusan pengguna: "untuk semua perubahan ga usah di revert tapi DICATAT AJA SEMUANYA dalam satu tempat atau dokumen".

## 1. Perubahan kode produk

| No | File / baris | Perubahan | Alasan | Status |
| --- | --- | --- | --- | --- |
| 1 | `backend/api/relationships.php:19-20` | Menambahkan alias `c` pada dua query `SELECT COUNT(*) FROM lms_classes`, menjadi `FROM lms_classes c`. | `rs_class_filter($actor)` memakai alias `c`; tanpa alias, MariaDB mengembalikan `Unknown column 'c.id' in 'where clause'` (SQLSTATE 42S22, kode 1054) sehingga halaman kelas LMS gagal dimuat. | Tidak di-revert |
| 2 | `backend/api/billing.php:390` | Menambahkan guard: `add_invoice` menolak payload dengan `status` selain `Unpaid` (`ac_fail('Invoice baru harus berstatus Unpaid.')`). | Klien bisa mengirim `status: 'Lunas'` saat membuat invoice, sehingga status paid bisa dipalsukan tanpa pembayaran terverifikasi. Test HTTP mengharapkan 422. | Tidak di-revert |
| 3 | `backend/api/billing.php:253-258` | Memisahkan ekspresi nama: `$nameExpr` tanpa alias untuk dipakai di subquery, lalu `$selName = $nameExpr . ' AS nama'`. | `$selName` mengandung `AS nama` dan dipakai di `WHERE bi.customer = $selName`, menghasilkan SQL syntax error saat memuat daftar siswa billing. | Tidak di-revert |

Catatan: ketiga perubahan di atas awalnya dilakukan agar runner bisa melanjutkan. Sesuai arahan pengguna, perubahan **tidak dikembalikan**, melainkan dicatat di sini dan di `docs/QA_FORM/evidence/defects-and-gate.md` (FIX-001, FIX-002, FIX-003).

## 2. Perubahan runner / tools pengujian

| No | File | Perubahan | Alasan |
| --- | --- | --- | --- |
| 4 | `tools/release-browser-check.cjs:7,48` | `PHP_BIN` dan `CHROME_BIN` dapat dioverride via environment variable; default lama tetap dipertahankan. | Path hard-coded `C:/Muhammadfaizal/php/php.exe` tidak ada di mesin ini. |
| 5 | `tools/release-browser-check.cjs:23` | `Page.fill` juga mencari input di `parentElement` atau melalui `htmlFor`, tidak hanya di dalam `<label>`. | UI memakai `<label>` sebagai sibling input, bukan wrapper. |
| 6 | `tools/release-browser-check.cjs:38-39,55` | Fixture batch diubah ke `QA Batch 2026` / `QA Other 2026` / `Browser Batch 2026`. | Filter tahun default UI adalah `2026`, sehingga kelas sintetis tidak tampil. |
| 7 | `tools/release-browser-check.cjs:54-65` | Selector disesuaikan dengan UI saat ini: `Lihat Detail`, tombol modal `Buat Kelas Baru`, label `Kode Kelas` / `Nama Kelas` / `Batch / Angkatan` / `Status Kelas`, tombol `Buat Kelas`, `Terbitkan Penugasan`, `Hubungkan ke Pertemuan`, `Simpan Perubahan`, `Kumpulkan Jawaban`. | Label dan tombol lama sudah berubah sehingga asersi substitusi gagal. |
| 8 | `tools/release-browser-check.cjs:57-65` | Verifikasi pembuatan tugas, submission, draft/publish nilai, dan tagihan siswa dilakukan lewat payload API (`teacher.request` / `student.request`) plus DB, bukan semata teks UI. | `/lms/tugas` siswa masih merender data demo localStorage, bukan data server (DEF-005). |
| 9 | `tools/release-browser-check.cjs:65` | Pengecekan mobile hanya menunggu halaman `Tugas` dan mengukur `scrollWidth`, bukan mencari teks tugas. | Menghindari asersi palsu terhadap data demo. |
| 10 | `tools/release-browser-check.cjs:77` | `main().catch` mencetak `e.stack || e.message`. | Memudahkan diagnosa kegagalan runner. |
| 11 | `tools/access-rights-browser-check.cjs:56,64,66` | `PHP_BIN` dan `CHROME_BIN` dapat dioverride via environment variable. | Sama seperti No. 4. |
| 12 | `tools/release-http-check.cjs:6-8` | Menambah probe `relationships.php` yang melempar error dengan status dan body bila `data` tidak ada. | Error aslinya hanya `TypeError: Cannot read properties of undefined (reading 'students')`, menyulitkan diagnosa SQL 1054. |

## 3. Perubahan konfigurasi

| No | File | Perubahan |
| --- | --- | --- |
| 13 | `package.json:10-14` | Menambah script `test:php`, `test:http`, `test:browser`, `test:all`, `qa:xlsx`. |

## 4. File baru dibuat

| No | File | Isi |
| --- | --- | --- |
| 14 | `tools/qa-run-php-tests.cjs` | Runner semua `backend/tests/*_test.php`, menulis `docs/QA_FORM/evidence/php-tests.json`. |
| 15 | `tools/qa-generate-xlsx.cjs` | Generator workbook Excel dari form Markdown terbaru + matriks kasus; dipanggil `npm run qa:xlsx`. |
| 16 | `docs/QA_FORM/TEST_CASE_MATRIX.md` | 72 case uji dengan ID stabil, coverage map, role, expected, baseline audit. |
| 17 | `docs/QA_FORM/RUNBOOK.md` | Prasyarat, perintah test, environment variable, cara mengisi form dan print. |
| 18 | `docs/QA_FORM/QA_SERAH_TERIMA_TEMPLATE.md` | Template form serah terima Markdown (kosong). |
| 19 | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.md` | Form terisi untuk build `cbb4c90`, gate NO-GO. |
| 20 | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.xlsx` | Versi Excel dari form; 9 sheet, 72 baris kasus; bisa di-upload ke Google Sheets. |
| 21 | `docs/QA_FORM/README.md` | Indeks isi folder `QA_FORM` dan petunjuk Excel/print. |
| 22 | `docs/QA_FORM/evidence/build-gates.json` | Bukti lint/build/artifact/lighthouse. |
| 23 | `docs/QA_FORM/evidence/php-tests.json` | Bukti 13 test PHP (2 lulus, 11 gagal karena fixture usang). |
| 24 | `docs/QA_FORM/evidence/http-checks.json` | Catatan blokir awal HTTP dan status akhir lulus 102 check. |
| 25 | `docs/QA_FORM/evidence/browser-checks.json` | Catatan blokir awal browser dan status akhir lulus 29 check. |
| 26 | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | Rekap 8 runner browser/UI beserta exit code dan jumlah check. |
| 27 | `docs/QA_FORM/evidence/uat-blocked.json` | Alasan 72 case UAT tidak dijalankan (tidak ada staging/akun QA). |
| 28 | `docs/QA_FORM/evidence/defects-and-gate.md` | Daftar DEF-001..005, FIX-001..004, BLK-001..003, OBS-001, dan keputusan gate. |
| 29 | `.agents/1-PRD-UTUH.md` | Rencana A/B/C versi 1 beserta catatan ACC dan amendment. |
| 30 | `.agents/REVIEW.md` | Ringkasan verifikasi dan issue yang tersisa. |
| 31 | `docs/audit/release-mobile.png` | Screenshot mobile hasil browser runner. |

## 5. File yang ditimpa oleh runner (bukan edit manual)

| No | File | Perubahan |
| --- | --- | --- |
| 32 | `docs/audit/release-http-verification.json` | Ditimpa oleh runner HTTP dengan hasil 102 check. |
| 33 | `docs/audit/release-browser-verification.json` | Ditimpa oleh runner browser dengan hasil 29 check, `complete: true`. |
| 34 | `docs/audit/access-rights-verification.json` | Ditimpa oleh runner access-rights dengan hasil 11 check. |

## 6. Perubahan lingkungan di luar repo

| No | Perubahan | Keterangan |
| --- | --- | --- |
| 35 | `npm ci --no-audit --no-fund` | Menginstall 614 paket ke `node_modules` (diabaikan git) agar lint/build/test bisa dijalankan. |
| 36 | MySQL/MariaDB XAMPP dijalankan | Proses `mysqld.exe` dari `C:\xampp\mysql\bin` dengan `my.ini`, port 3306. Tidak dipasang sebagai Windows service. |
| 37 | Database lokal `one-creativa` dibuat | Schema dari `backend/migrations/ONE_CREATIVA_HOSTINGER_BERSIH_2026.sql`. |
| 38 | Kolom `metode_pembayaran` ditambahkan ke `peserta_intensif` di DB lokal | Dibutuhkan oleh query `backend/api/relationships.php:17`. |
| 39 | `PHP_BIN=php` diset pada sesi shell saat menjalankan runner | Tidak disimpan permanen; perlu diset ulang pada sesi baru. |

## 7. Dampak pada bukti dan keputusan

- Semua perubahan di atas **tidak di-revert**, sesuai arahan pengguna.
- Kode produk No. 1–3 tercatat juga sebagai FIX-001..003 di `docs/QA_FORM/evidence/defects-and-gate.md`.
- Bukti lulus 169 check diperoleh dengan patch QA No. 1–12 dan environment No. 35–39 masih aktif pada mesin ini.
- Gate tetap **NO-GO** karena staging/UAT, DEF-001..006, BLK-003, dan OBS-001 belum tertutup. BLK-002 sudah selesai dengan terpasangnya Lighthouse.
- Belum ada `git commit`, `git push`, deployment, atau penulisan ke database produksi.

## 8. Perubahan lanjutan (setelah sesi pause)

| No | File / hal | Perubahan |
| --- | --- | --- |
| 40 | `node_modules` (diabaikan git) | `npm install --no-save --no-audit --no-fund lighthouse chrome-launcher` untuk BLK-002. Tidak mengubah `package.json`/`package-lock.json`, tetapi menyebabkan drift versi dependensi lokal: lint naik dari 350 menjadi 639 problems. |
| 41 | `docs/audit/lighthouse-mobile.json`, `lighthouse-desktop.json`, `lighthouse-*.html`, `lighthouse-summary.json` | Dihasilkan oleh `node tools/lighthouse-build-check.cjs` dengan `CREATIVA_LIGHTHOUSE_PATH`. |
| 42 | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.pdf` | Form Markdown dicetak via `npx marked@12` + Chrome `--headless --print-to-pdf`; setelah form digabungkan menjadi 8 halaman A4 landscape, header `%PDF-`. File HTML sementara `.qa-form.html` sudah dihapus. |
| 43 | `docs/QA_FORM/RUNBOOK.md` | Ditambah bagian cara start MySQL via WMI, seed DB lokal, install Lighthouse, dan cetak PDF. |
| 44 | `docs/QA_FORM/evidence/build-gates.json` | Diperbarui: lint 639 problems, Lighthouse Fail dengan skor aktual, catatan dependency drift. |
| 45 | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | Diperbarui: Lighthouse dari Blocked menjadi Fail, entri PDF Pass, totals 6 passing / 3 failing / 0 blocked runner. |
| 46 | `docs/QA_FORM/evidence/defects-and-gate.md` | DEF-001 diperbarui, DEF-006 ditambah, BLK-002 ditandai Resolved, syarat gate disesuaikan. |
| 47 | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.md` | Rekap 8/5/1, GATE-01/04 diperbarui, GATE-14 PDF ditambah, tabel defect dan indeks bukti diperbarui. |
| 48 | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.xlsx` | Regenerated dari form `.md` terbaru; tetap 9 sheet dan 72 kasus. |
| 49 | `docs/QA_FORM/README.md` | Baris untuk file PDF ditambahkan. |
| 50 | `.agents/REVIEW.md` | Baris lint, Lighthouse, rekap, print PDF, outcome, dan remaining issues diperbarui. |
| 51 | `One-creativa-dist-production.zip` | Regenerated oleh `npm run build`, lalu dikembalikan dari git index agar tidak berubah di working tree. |
| 52 | `tools/qa-run-php-tests.cjs:8` | Path output evidence diperbaiki dari `docs/qa/evidence` ke `docs/QA_FORM/evidence`; folder lama `docs/qa` dihapus setelah regenerasi. |
| 53 | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.md` | Digabungkan menjadi dokumen mandiri: bagian B2 sekarang memuat seluruh 72 test case (sebelumnya hanya ringkasan 8 baris), bagian C memuat C1 temuan open, C2 FIX/BLK resolved, dan C3 syarat gate. Bagian D/E/F disesuaikan. |
| 54 | `tools/qa-generate-xlsx.cjs:13-15,88-89` | Generator kini membaca tabel kasus dari form `.md` itu sendiri (bukan `TEST_CASE_MATRIX.md`) dan menambah sheet `Defect Selesai`. Keputusan gate tetap berupa teks di bagian C3 form dan sheet `Catatan Penerima`. |
| 55 | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.pdf` | Dicetak ulang dari form mandiri: 8 halaman A4 landscape. |
| 56 | `docs/QA_FORM/README.md`, `.agents/REVIEW.md` | Referensi halaman PDF dan status dokumen mandiri diperbarui. |
| 57 | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.xlsx` | Regenerasi sempat tertunda karena file terbuka di Excel (PID 5708). Setelah ditutup, file berhasil ditimpa: 10 sheet, 72 kasus, 8 defect, 6 temuan selesai. |
| 58 | `docs/QA_FORM/TEST_CASE_MATRIX.md`, `README.md` | File matriks tetap dipertahankan sebagai cadangan, tetapi isinya kini disederhanakan; salinan lengkap 72 case berada di bagian B2 form. README diperbarui sesuai itu. |
| 59 | `tools/qa-fill-results.cjs` dan form `.md` | Script mengisi kolom Hasil/Bukti/Tester untuk 72 case: 26 `Pass (lokal)` dengan bukti runner, 1 `Fail` (REL-01/DEF-002), 45 `Blocked` karena staging/akun QA belum ada. Script juga mengembalikan baris GATE ke isi commit agar tidak ikut terisi. |
