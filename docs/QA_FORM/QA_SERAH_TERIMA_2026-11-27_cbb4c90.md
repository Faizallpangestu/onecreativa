# FORM QA / SERAH TERIMA SOFTWARE — OneCreativa

> Cetak: buka Markdown preview → Print → Save as PDF. A4 landscape, margin narrow, background graphics on, header/footer off. Form ini tidak memuat password, hash, cookie, token, atau data pribadi.

## A. Identitas & cakupan

| Field | Isi |
| --- | --- |
| Sistem | OneCreativa |
| Versi / commit | `cbb4c90` (merge main `2599827`) |
| Tanggal QA | 2026-11-27 |
| Lingkungan | Lokal Windows, MariaDB 10.4.32, PHP 8.2.12, Chrome/CDP; staging tidak tersedia |
| Paket rilis | `dist` hasil build; `One-creativa-dist-production.zip` dikembalikan ke isi git index setelah build |
| Disiapkan oleh | OpenCode QA run (bukti otomatis lokal) |
| Diterima oleh | Belum ditunjuk |
| Modul tercakup | HRD/GA, Finance, LMS/Sensei/LPK, RPA, Security, Release |
| Keputusan gate | **NO-GO** |

| Rekap | Jumlah |
| --- | --- |
| Gate otomatis Pass / Fail / Blocked | 8 / 5 / 1 |
| Case matriks Pass / Fail / Blocked / Not Run | 0 / 0 / 0 / 72 |
| Persona UAT selesai / blocker | 0 / 11 |
| Temuan open | 8 (6 defect + 1 blocker + 1 observasi) |

## B. Hasil pengujian

### B1. Gate otomatis

| ID | Check | Perintah | Expected | Actual | Status | Bukti | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GATE-01 | Lint | `npm run lint` | 0 error | 639 problems: 572 error, 67 warning | Fail | `docs/QA_FORM/evidence/build-gates.json` | DEF-001 |
| GATE-02 | Build | `npm run build` | build sukses | sukses 7,95 s; PWA 14 entri precache | Pass | `docs/QA_FORM/evidence/build-gates.json` | - |
| GATE-03 | Artifact | `node tools/check-build-artifact.cjs` | tidak ada file privat | `config/db_env.php` ikut ke paket | Fail | `docs/QA_FORM/evidence/build-gates.json` | DEF-002 |
| GATE-04 | Lighthouse | `node tools/lighthouse-build-check.cjs` | semua skor 100 | mobile 78/96/100/100, desktop 98/96/100/100 | Fail | `docs/audit/lighthouse-summary.json` | DEF-006 |
| GATE-05 | Backend suite | `npm run test:php` | 13/13 lulus | 2/13 lulus; fixture lama tidak cocok dengan service saat ini | Blocked | `docs/QA_FORM/evidence/php-tests.json` | OBS-001 |
| GATE-06 | HTTP checks | `node tools/release-browser-check.cjs --http-only` | check HTTP nyata berjalan | 102 check lulus | Pass | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | - |
| GATE-07 | Browser desktop + mobile | `node tools/release-browser-check.cjs` | acceptance Chrome + Vite | 29 check lulus, screenshot mobile dibuat | Pass | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | - |
| GATE-08 | Access rights browser | `node tools/access-rights-browser-check.cjs` | login/role/delete/attendance | 11 check lulus | Pass | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | - |
| GATE-09 | Employee UI state | `node tools/employee-ui-test.mjs` | 12 check | 12 check lulus | Pass | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | - |
| GATE-10 | Student invoice browser | `node tools/student-invoice-browser-test.mjs` | 15 skenario | 15 skenario lulus | Pass | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | - |
| GATE-11 | Invoice email browser | `node tools/invoice-email-browser-test.mjs` | PASS semua skenario | gagal pada baris 93: penerima tidak tampil | Fail | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | DEF-003 |
| GATE-12 | Receipt browser | `node tools/receipt-browser-test.mjs` | PASS semua skenario | gagal pada baris 95: tombol Verify tidak ditemukan | Fail | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` | DEF-004 |
| GATE-13 | Whitespace | `git diff --check` | 0 error | 0 error | Pass | `docs/QA_FORM/evidence/build-gates.json` | - |
| GATE-14 | Cetak form ke PDF | `npx marked@12` + Chrome `--print-to-pdf` | PDF valid & tabel tidak terpotong | 5 halaman A4 landscape, 223 KB, header `%PDF-` | Pass | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.pdf` | - |

### B2. Matriks kasus fungsional

Ringkasan per modul; rincian 72 case dengan ID stabil ada di `docs/QA_FORM/TEST_CASE_MATRIX.md`.

| Modul | Total | Pass | Fail | Blocked | Not Run | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| HRD | 13 | 0 | 0 | 0 | 13 | Menunggu akun HR/Manager & data karyawan nyata |
| GA | 3 | 0 | 0 | 0 | 3 | Menunggu akun GA & data aset |
| Finance | 18 | 0 | 0 | 0 | 18 | Menunggu akun Finance & data invoice/bukti |
| LMS/Sensei | 20 | 0 | 0 | 0 | 20 | Menunggu kelas, assignment, enrollment & 2 siswa nyata |
| Matching | 3 | 0 | 0 | 0 | 3 | Menunggu akun LPK & dokumen kandidat |
| RPA | 5 | 0 | 0 | 0 | 5 | Menunggu lingkungan n8n/webhook |
| Security/Release | 5 | 0 | 0 | 0 | 5 | Menunggu staging HTTPS |
| Shared/UX | 5 | 0 | 0 | 0 | 5 | Menunggu review identitas historis |

### B3. UAT per persona / role

| Persona | Role | Fokus pengujian | Status | Bukti | Tester / tgl |
| --- | --- | --- | --- | --- | --- |
| Super Admin | `super_admin` | approval, konfigurasi role, akses global | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| Admin | `admin` | akses global & batas hak | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| HR Admin | `hr`, `hr_admin`, `manager` | directory, cuti, lembur, resignation | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| Karyawan | `karyawan` | slip gaji, absensi, profil sendiri | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| Finance / Finance Admin | `finance`, `finance_admin` | invoice, RAB, journal, verifikasi, receipt | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| GA | `ga` | aset & maintenance | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| Admin LMS/LPK | `admin_lms`, `lpk` | kelas, materi, enrollment | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| Sensei terikat kelas | `sensei`, `sensei_intensif` | roster, tugas, nilai, QR kelas sendiri | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| Sensei tanpa kelas | `sensei` | penolakan akses lintas kelas | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| Siswa A / Siswa B | `peserta_intensif`, `siswa` | kelas berbeda, tagihan own scope | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |
| Mitra & peserta lain | `mitra_telu`, `peserta_*` | dashboard & invoice masing-masing | Blocked | `docs/QA_FORM/evidence/uat-blocked.json` | - |

## C. Daftar temuan (defect)

| ID | Severity | Modul | Deskripsi | Status | Owner | Target | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEF-001 | Major | Frontend/LMS-Quiz | 317 error dan 33 warning ESLint pada file hasil merge | Open | Frontend owner | Sebelum serah terima | Not run |
| DEF-002 | Blocker | Release artifact | `copy-backend.js` menulis kredensial database ke `config/db_env.php` dalam paket; nilai tidak dicatat di sini | Open | Release owner | Sebelum serah terima | Not run |
| DEF-003 | Major | Finance browser fixture | `invoice-email-browser-test.mjs:93` mengharapkan penerima tampil di UI | Open | Finance/QA owner | Sebelum serah terima | Not run |
| DEF-004 | Major | Finance browser fixture | `receipt-browser-test.mjs:95` tidak menemukan tombol Verify | Open | Finance/QA owner | Sebelum serah terima | Not run |
| DEF-005 | Major | Student LMS UI | `/lms/tugas` memakai data demo localStorage, bukan payload server `lms_tasks.php` | Open | LMS owner | Sebelum serah terima | Not run |
| DEF-006 | Major | Performance/Aksesibilitas | Lighthouse: mobile 78/96/100/100, desktop 98/96/100/100; LCP, kontras warna, nama aksesibel, dan image delivery perlu perbaikan | Open | Frontend owner | Sebelum serah terima | Not run |
| BLK-003 | Blocker (input) | UAT | Staging, akun QA, dan data relasi tidak diberikan | Open | System owner | Sebelum serah terima | Not run |
| OBS-001 | Observasi | Freshness bukti | Bukti audit lama 2026-10-12 lebih tua dari perubahan November | Open | QA lead | Sebelum serah terima | Not run |

Perbaikan yang sudah diverifikasi dalam run ini: FIX-001 alias query `relationships.php`, FIX-002 larangan status invoice `Lunas` saat dibuat, FIX-003 ekspresi nama pada query tagihan siswa, FIX-004 runner browser. Lihat `docs/QA_FORM/evidence/defects-and-gate.md`.

## D. Limitasi & scope yang tidak diuji

- Face/RFID fisik, kamera, dan scan perangkat nyata: NOT VERIFIED.
- Browser acceptance dilakukan di lokal dengan DB sintetis, bukan di staging HTTPS; ini bukan pengganti UAT.
- Lighthouse/performance: tidak tersedia di mesin ini.
- Tujuh record identitas historis di `docs/audit/HISTORICAL_IDENTITY_REVIEW.csv`: masih `needs_review`.
- Saldo awal, rekonsiliasi bank, dan data operasional nyata: memerlukan penandatanganan Finance.
- Semua 72 case fungsional: Not Run karena tidak ada staging/akun QA.
- Test otomatis memakai database sintetis terisolasi; tidak membuktikan data produksi.

Dilarang menandai item di bagian D sebagai Pass tanpa bukti baru.

## E. Indeks bukti

| Bukti | Path |
| --- | --- |
| Master test case matrix | `docs/QA_FORM/TEST_CASE_MATRIX.md` |
| Runbook QA | `docs/QA_FORM/RUNBOOK.md` |
| Gate lint/build/artifact | `docs/QA_FORM/evidence/build-gates.json` |
| Hasil test PHP | `docs/QA_FORM/evidence/php-tests.json` |
| Blokir HTTP lama | `docs/QA_FORM/evidence/http-checks.json` |
| Browser/UI acceptance 2026-11-27 | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` |
| Blokir UAT | `docs/QA_FORM/evidence/uat-blocked.json` |
| Defect & gate | `docs/QA_FORM/evidence/defects-and-gate.md` |
| Ringkasan Lighthouse | `docs/audit/lighthouse-summary.json` |
| Versi PDF (5 halaman A4 landscape) | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.pdf` |
| Versi Excel / Google Sheets | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.xlsx` |
| Baseline audit (referensi, bukan hasil run ini) | `docs/audit/QA_PHASE_5_16.md` |

## F. Persetujuan

| Peran | Nama | Tanda tangan | Tanggal |
| --- | --- | --- | --- |
| Disiapkan (QA) |  |  |  |
| Diverifikasi (Lead/PO) |  |  |  |
| Diterima (Klien/PO) |  |  |  |

Keputusan penerima: `[ ] Terima` `[x] Terima dengan catatan` `[ ] Tolak`

Catatan penerima: Gate **NO-GO**. Browser/UI acceptance lokal sudah menghasilkan 169 check lulus dan PDF 5 halaman, tetapi forma ini bukan penerimaan sistem. Serah terima menunggu penutupan DEF-001 sampai DEF-006, BLK-003, dan eksekusi 72 case di staging.
