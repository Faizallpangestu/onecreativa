# FORM QA / SERAH TERIMA SOFTWARE — OneCreativa

> Dokumen ini sudah **mandiri**: berisi identitas, gate, 72 test case, UAT per role, seluruh temuan/defect, bukti, limitasi, dan persetujuan. Tidak perlu membuka dokumen QA lain untuk memahami hasil pengujian.
>
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
| Case matriks Pass / Fail / Blocked / Not Run | 26 / 1 / 45 / 0 |
| Persona UAT selesai / blocker | 0 / 11 |
| Temuan open | 8 (6 defect + 1 blocker + 1 observasi) |
| Temuan resolved/fixed | 6 (FIX-001..004, BLK-001, BLK-002) |

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
| GATE-14 | Cetak form ke PDF | `npx marked@12` + Chrome `--print-to-pdf` | PDF valid & tabel tidak terpotong | PDF 8 halaman A4 landscape, header `%PDF-` | Pass | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.pdf` | - |

### B2. Matriks kasus fungsional (72 case)

Nilai status: `Not Run`, `Pass`, `Fail`, `Blocked`, `N/A`. "Baseline audit" ialah status lama dari dokumen audit, bukan hasil QA run ini. Setiap `Fail` wajib memiliki ID defect; setiap `Blocked` wajib memiliki alasan di bagian C/D.

| ID | Modul | Skenario & langkah ringkas | Role/akun QA | Expected | Baseline audit | Bukti | Hasil | Tester / tgl |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HRD-01 | HRD | Ambil daftar staff, cari, filter departemen, pagination, buka detail | HR / HR Admin | 8 profil awal tercakup; 6 staff termasuk orphan, 2 profil learner scope LMS; error tidak ditampilkan sebagai kosong | PASS lokal; browser NOT VERIFIED | GATE-07 browser-verification-2026-11-27.json; GATE-08 access-rights-verification.json; sebagian: daftar karyawan tampil | Pass (lokal) | OpenCode QA / 2026-11-27 |
| HRD-02 | HRD | Buat karyawan: identitas wajib, password wajib, tanggal/telepon/gaji, departemen/jabatan | HR | ID dikembalikan; tidak ada password default; email/duplikat/FK invalid ditolak | PASS API; browser NOT VERIFIED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| HRD-03 | HRD | Edit karyawan: status inactive, password kosong, field dihilangkan | HR | active=0; tanggal/telepon asli tetap; field yang dihilangkan tidak ditimpa | PASS API+UI unit | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| HRD-04 | HRD | Coba ubah role ke finance/super_admin dan buat role baru | HR / Admin | 403; tidak ada role baru otomatis; Super Admin hanya dikelola Super Admin | PASS subset | GATE-08 access-rights-verification.json; role spoof ditolak server | Pass (lokal) | OpenCode QA / 2026-11-27 |
| HRD-05 | HRD | Nonaktifkan akun lalu pakai session lama; cek riwayat gaji | HR / Karyawan | session lama 401; snapshot/histori slip tetap; tidak ada delete cascade | PASS lokal | GATE-08 access-rights-verification.json; session nonaktif/terhapus ditolak | Pass (lokal) | OpenCode QA / 2026-11-27 |
| HRD-06 | HRD | Finance dan LPK coba baca profil privat karyawan lain | Finance / LPK | 403; gaji LPK tersembunyi; tidak ada kebocoran privat | PASS API | GATE-06 browser-verification-2026-11-27.json; privasi gaji Finance | Pass (lokal) | OpenCode QA / 2026-11-27 |
| HRD-07 | HRD | Update profil sendiri + unggah foto | Karyawan | Self scope hanya; tipe & konten gambar aman | PASS API | GATE-06 browser-verification-2026-11-27.json; upload foto & MIME | Pass (lokal) | OpenCode QA / 2026-11-27 |
| HRD-08 | HRD | Profil orphan: cek apakah sistem membuat ulang akun otomatis | HR / Owner | tidak dibuat ulang; review memakai bukti identitas | NOT VERIFIED / recovery NOT EXECUTED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| HRD-09 | HRD | Setujui cuti oleh manager; cek jam kerja & saldo | Manager | timestamp kerja NULL; saldo terpotong sekali | PASS subset | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| HRD-10 | HRD | Self-approval, role spoof lewat body, duplikat approval, konflik absensi | HR / Karyawan | 403/409; absensi existing tidak berubah; saldo tidak terpotong dua kali | PASS subset | GATE-06 browser-verification-2026-11-27.json; GATE-08 access-rights-verification.json; spoof/self-approval ditolak | Pass (lokal) | OpenCode QA / 2026-11-27 |
| HRD-11 | HRD | Ajukan lembur lalu setujui sebagai reviewer dan non-reviewer | Manager / Karyawan | hanya reviewer yang diizinkan; request terpisah; histori dipertahankan | PARTIAL | GATE-06 browser-verification-2026-11-27.json; approval lembur | Pass (lokal) | OpenCode QA / 2026-11-27 |
| HRD-12 | HRD | Absensi penuh di browser + scan Face/RFID pada perangkat nyata | HR | scan berhasil; izin browser dan error actionable; tidak ada jam fiktif | NOT VERIFIED E2E | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| HRD-13 | HRD | Publikasi slip gaji; karyawan hanya melihat slip sendiri | Finance / Karyawan | snapshot immutable; akses lintas karyawan 403 | PASS lokal; UI mail belum | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| GA-01 | GA | Buat/edit aset dan assign ke karyawan | GA / Admin | aset tersimpan; relasi kepemilikan jelas | PARTIAL | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| GA-02 | GA | Ajukan dan tutup maintenance | GA | status dan histori tercatat; tidak ada penimpaan langsung | NOT VERIFIED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| GA-03 | GA | Scan RFID via endpoint dengan akun berizin dan tanpa izin | GA / HR | berhasil untuk berizin; 403 untuk lainnya | NOT VERIFIED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-01 | Finance | Capital, loan, direct revenue, advance/deferred | Finance | modal/loan tidak menjadi pendapatan; saldo cocok GL/TB/P&L/CF | PASS fixture; rekonsiliasi pending | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-02 | Finance | Invoice AR + pembayaran sebagian | Finance | outstanding reconciles; status Paid/Partially Paid benar | PASS lokal; review pending | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-03 | Finance | Vendor bill + settlement | Finance | sumber dan outstanding cocok; tidak ada expense kedua | PASS fixture | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-04 | Finance | Settlement payroll/reimbursement | Finance | tidak ada pengakuan ganda; alokasi posted | PASS fixture | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-05 | Finance | Approval RAB | Finance / Admin | approval noncash; tidak mencatat kas/expense otomatis | PASS lokal; UAT pending | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-06 | Finance | Commitment, realisasi parsial, cap item, race, cancel/close | Finance | cap dipatuhi; tidak ada duplikasi; journal terkait | PASS lokal | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-07 | Finance | Transfer aset, reversal, period close, cash history | Finance | transfer terkonsolidasi nol; reversal tertaut; journal posted seimbang | PASS fixture | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-08 | Finance | Ledger filter, CSV/Excel numerik, bukti privat | Finance | ID/sumber & jumlah filter identik; private file 403; export tidak bypass izin | PASS API/build; browser export NOT VERIFIED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-09 | Finance | Admin mencoba memberi hak approve ke diri sendiri | Admin / Super Admin | 403; konfigurasi hanya Super Admin | PASS langsung | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-10 | Finance | Saldo awal + rekonsiliasi bank dengan dokumen | Finance | keputusan tertulis & referensi dokumen; coverage dinyatakan incomplete | NOT VERIFIED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-11 | Finance | Buat invoice wizard multi-enrollment dengan metadata & cicilan | Finance | skema, item, termin, rekening sesuai payload; token publik dibuat | PASS lokal | GATE-06 browser-verification-2026-11-27.json; invoice desimal/retry/conflict; status paid ditolak | Pass (lokal) | OpenCode QA / 2026-11-27 |
| FIN-12 | Finance | Resend notifikasi invoice; replay request yang sama | Finance | riwayat kanal tercatat; replay tidak mengirim ulang otomatis | PASS lokal | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-13 | Finance | Buka receipt document & PDF dari payment id | Finance | dokumen privat, menaut ke pembayaran benar; MIME benar | PASS lokal | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-14 | Finance | Midtrans QRIS/VA + webhook (signature, duplikat, status) | Finance | signature valid; replay idempoten; status tidak mundur | PASS gateway lokal | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-15 | Finance | Tagihan siswa: own scope, bukti pending, verifikasi & reversal | Siswa / Finance | lintas siswa 403; upload bukti tidak membuat Paid; reversal tercatat | PASS fixture; owner link pending | GATE-06 browser-verification-2026-11-27.json; GATE-07 browser-verification-2026-11-27.json; owner scope & bukti pending | Pass (lokal) | OpenCode QA / 2026-11-27 |
| FIN-16 | Finance | Verifikasi pembayaran: retry key sama, conflict payload beda, email receipt | Finance | tidak ada duplikat; conflict 409; email history tercatat | PASS lokal | GATE-06 browser-verification-2026-11-27.json; retry idempoten & conflict | Pass (lokal) | OpenCode QA / 2026-11-27 |
| FIN-17 | Finance | Laporan GL/TB/P&L/CF dengan sumber transaksi | Finance | seimbang; sumber transaksi dapat ditelusuri | PASS fixture | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| FIN-18 | Finance | Invoice/reimbursement retry & conflict & akses private | Finance | key sama tidak duplikat; payload beda 409; private hanya owner/reviewer | PASS HTTP | GATE-06 browser-verification-2026-11-27.json; retry/conflict/akses privat | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-01 | LMS | Buat program, batch, kelas, kurikulum | Admin LMS | data tersimpan; tidak ada kelas default otomatis | Implemented; config kosong | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-02 | Sensei | Lihat kelas sendiri, roster, jadwal mingguan/timezone | Sensei assigned | hanya kelas yang ditugaskan; tidak menghitung semua siswa | PASS fixture; operasional kosong | GATE-06 browser-verification-2026-11-27.json; GATE-07 browser-verification-2026-11-27.json; roster kelas sendiri | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-03 | Sensei | Coba baca kelas/roster kelas lain | Sensei unassigned | 403; tidak ada data bocor | PASS fixture | GATE-06 browser-verification-2026-11-27.json; Sensei tanpa kelas ditolak | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-04 | Sensei | Buat/edit assignment dengan scope kelas & tanggal | Sensei assigned | scope kelas eksplisit; assignment tidak lintas kelas | PASS subset | GATE-07 browser-verification-2026-11-27.json; tugas diterbitkan lewat UI | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-05 | Sensei/Siswa | QR absensi: token server, expiry, revoke, check-in/out, retry, koreksi | Sensei assigned + 2 Siswa | token asli; pemalsuan ditolak; koreksi beraudit; tidak ada check-in fiktif | PASS HTTP; kamera pending | GATE-06 browser-verification-2026-11-27.json; GATE-07 browser-verification-2026-11-27.json; QR token/check-in; kamera fisik belum | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-06 | Sensei | Telat/izin/alfa dicocokkan dengan histori learner | Sensei assigned | histori teacher & student sama; tidak ada KPI mengarang | PARTIAL | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-07 | Siswa | Kumpulkan tugas: upload, deadline, retry | Siswa terenroll | upload privat; deadline dipatuhi; retry tidak duplikat | PARTIAL | GATE-06 browser-verification-2026-11-27.json; GATE-07 browser-verification-2026-11-27.json; submission lewat API | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-08 | Sensei/Siswa | Draft nilai & feedback disembunyikan; publish; nilai 0 sah | Sensei assigned + Siswa | draft tidak terlihat siswa; publish menyimpan nilai 0 dengan benar | PARTIAL | GATE-06 browser-verification-2026-11-27.json; GATE-07 browser-verification-2026-11-27.json; draft tersembunyi, publish nol | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-09 | Sensei | Timpa nilai yang sudah published tanpa workflow koreksi | Sensei assigned | ditolak; koreksi memakai workflow tersendiri | NOT VERIFIED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-10 | Sensei/Siswa | Quiz & UKOM: buat, kerjakan, nilai, publikasi | Sensei assigned + Siswa | hasil hanya untuk anggota kelas; publikasi eksplisit | PASS lokal; browser pending | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-11 | Sensei | AI quiz generator: pilih kelas, chapter aktif, tingkat kesulitan, rentang pertemuan | Sensei / Admin LMS | pertanyaan sesuai kurikulum kelas & rentang; tidak ada terjemahan yang tidak diminta | Implemented baru; belum diverifikasi | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-12 | Sensei/Siswa | Question bank & daily quiz | Sensei assigned + Siswa | bank per kelas; daily quiz hanya peserta kelas | Implemented baru | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-13 | Sensei/Siswa | Konsultasi: kirim pesan, balasan, scope kelas | Sensei assigned + Siswa | hanya participant terkait; tidak ada lintas akses | NOT VERIFIED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-14 | Sensei | Dashboard periode: numerator/denominator, zero-safe rate | Sensei assigned | periode sama; tidak ada NaN/Infinity untuk nol | PASS lokal; browser pending | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-15 | Siswa | Login LMS, profil, card, identitas & batch | 2 Siswa kelas berbeda | identitas dari akun server; tidak ditebak dari nama/email; siswa lain 403 | PASS guard; enrollment pending | GATE-06 browser-verification-2026-11-27.json; identitas server & foreign denied | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-16 | Siswa | Dashboard intensif: jadwal, sources, KPI dari server | Siswa | tidak ada data operasional dari localStorage | FAIL baseline | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-17 | Siswa | Tagihan sendiri: installments, outstanding, riwayat pembayaran terverifikasi | Siswa | receipt submission tidak dihitung Paid; alokasi posted | NOT IMPLEMENTED / PARTIAL | GATE-07 browser-verification-2026-11-27.json; GATE-06 browser-verification-2026-11-27.json; tagihan own scope | Pass (lokal) | OpenCode QA / 2026-11-27 |
| LMS-18 | Siswa/Sensei | Leaderboard & analytics dengan scope kelas | Sensei + 2 Siswa | hanya anggota kelas; agregat tidak membocorkan siswa lain | Implemented baru | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-19 | LPK | Absensi, nilai, tugas, quiz, materi LPK dengan role LPK | LPK + Siswa | role LPK tidak otomatis berhak semua kelas; namespace LMS dipakai | PARTIAL | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| LMS-20 | Sensei/LPK | Upload materi & akses privat | Sensei / LPK | hanya kelas berizin; file privat tidak langsung bisa diunduh | PARTIAL | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| MCH-01 | Matching | Akses lowongan & kandidat lintas role | Admin / Super / LPK vs Finance / Siswa | 403 untuk role tidak berizin; tidak ada hard delete | PASS API | GATE-06 browser-verification-2026-11-27.json; akses role & dokumen privat | Pass (lokal) | OpenCode QA / 2026-11-27 |
| MCH-02 | Matching | Buat/edit kandidat, internal link, kandidat eksternal, duplikat, histori | LPK | internal link opsional & direview; duplikat dicegah; status history tersimpan | NOT VERIFIED | GATE-06 browser-verification-2026-11-27.json; upload/verifikasi dokumen kandidat | Pass (lokal) | OpenCode QA / 2026-11-27 |
| MCH-03 | Matching | Upload CV/JFT/SSW, verifikasi dokumen, filter, export Excel | LPK | verifikasi nyata bukan dari nama file; file privat; export aman | NOT VERIFIED | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| RPA-01 | RPA | Workflow n8n invoice: rendernya, WA, email, status terkirim | Admin | email dikirim lewat backend; replay tidak mengirim ulang; status tercatat | PASS lokal; n8n pending | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| RPA-02 | RPA | Playwright PDF worker invoice & receipt | Admin | PDF sesuai data; tidak ada character clip; path privat | PASS lokal | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| RPA-03 | RPA | Receipt automation: token, webhook, dispatch idempoten | Finance | pembayaran tersimpan walau dispatch gagal; status jujur | PASS lokal | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| RPA-04 | RPA | Halaman automation status & log | Admin | log menampilkan request ID; tidak ada secret | Implemented | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| RPA-05 | RPA | Pengaturan RPA: secret disimpan di config, tidak tampil di UI | Admin | secret tidak terekspos; webhook lama ditolak | PASS lokal | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| REL-01 | Release | Build, prerender login, copy-backend, artifact manifest & hash | QA | build sukses; paket tidak memuat config privat/test | PASS lokal | GATE-03 build-gates.json (DEF-002); artifact check gagal karena config/db_env.php ikut paket | Fail | OpenCode QA / 2026-11-27 |
| REL-02 | Release | HTTPS staging: direktori privat/diagnostik & file upload ditolak | QA | 403/404 untuk config/services/storage/migrations/scripts | PASS lokal; hosting pending | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| REL-03 | Release | Service worker & API NetworkOnly; tidak ada data operasional dari cache | QA | API selalu NetworkOnly; logout menghapus session server | PASS lokal; browser pending | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| REL-04 | Shared | Preservasi 61 tabel lama & 45 tabel Phase 2 (hash/row count) | QA / Owner | hash/count sama; tidak ada migrasi otomatis pada data historis | PASS lokal | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| REL-05 | Shared | Review 7 record identitas historis | Owner | keputusan tertulis per record; tidak auto-update berdasarkan kemiripan | needs_review | uat-blocked.json: staging/akun QA belum tersedia; UAT staging belum tersedia | Blocked | OpenCode QA / 2026-11-27 |
| SEC-01 | Security | Anonymous 401, foreign role/object 403, CSRF mutation 403, inactive/logout 401 | Semua role | status-code sesuai; session server menjadi otoritas | PASS lokal; hosting pending | GATE-06 browser-verification-2026-11-27.json; GATE-08 access-rights-verification.json; 401/403/CSRF/session | Pass (lokal) | OpenCode QA / 2026-11-27 |
| SEC-02 | Security | Role spoof lewat parameter request-body & localStorage | Semua role | server mengabaikan role dari client; 403 untuk escalation | PASS lokal | GATE-08 access-rights-verification.json; GATE-06 browser-verification-2026-11-27.json; role spoof ditolak | Pass (lokal) | OpenCode QA / 2026-11-27 |
| SEC-03 | Security | Respons error: tanpa SQL/password/hash; request ID; Cache-Control no-store | QA | tidak ada kebocoran; ID tersedia untuk korelasi | PASS lokal | GATE-06 browser-verification-2026-11-27.json; tanpa hash SQL; request ID; no-store | Pass (lokal) | OpenCode QA / 2026-11-27 |
| MOB-01 | UX | Desktop & mobile: navbar/sidebar, modal focus/close, table overflow, label/date/currency | QA | tidak ada runtime error; fokus tertahan; tabel tidak terpotong | NOT VERIFIED | GATE-07 browser-verification-2026-11-27.json; viewport mobile tidak overflow | Pass (lokal) | OpenCode QA / 2026-11-27 |
| MOB-02 | UX | Error jaringan, pending save, duplicate retry | QA | error terlihat; tidak ada angka nol/array kosong/sukses palsu; retry tanpa duplikat | PASS subset | GATE-10 student-invoice-browser-test.mjs; network/conflict/offline ditangani | Pass (lokal) | OpenCode QA / 2026-11-27 |

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

### C1. Temuan open

| ID | Severity | Modul | Deskripsi | Status | Owner | Target | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEF-001 | Major | Frontend/LMS-Quiz | `npm run lint` exit 1: 639 problems (572 error, 67 warning) pada file hasil merge; scrutinize terutama duplicate key, unused var, `Date.now()` saat render, whitespace, dan dependency hook | Open | Frontend owner | Sebelum serah terima | Not run |
| DEF-002 | Blocker | Release artifact | `copy-backend.js:57-62` menulis `config/db_env.php` berisi kredensial database ke paket; artifact check menolak paket. Nilai kredensial sengaja tidak dicatat. | Open | Release owner | Sebelum serah terima | Not run |
| DEF-003 | Major | Finance browser fixture | `tools/invoice-email-browser-test.mjs:93` mengharapkan `student@example.test` tampil di UI; fixture saat ini tidak merender string tersebut | Open | Finance/QA owner | Sebelum serah terima | Not run |
| DEF-004 | Major | Finance browser fixture | `tools/receipt-browser-test.mjs:95` tidak menemukan tombol `Verify` setelah berpindah ke Daftar Pembayaran | Open | Finance/QA owner | Sebelum serah terima | Not run |
| DEF-005 | Major | Student LMS UI | `/lms/tugas` memakai data demo localStorage (`src/services/lmsStudentData.js`), bukan payload server `lms_tasks.php`; verifikasi browser terpaksa memakai API sebagai sumber otoritatif | Open | LMS owner | Sebelum serah terima | Not run |
| DEF-006 | Major | Performance/Aksesibilitas | Lighthouse: mobile 78/96/100/100, desktop 98/96/100/100; LCP 6,1 s (mobile), kontras warna, nama aksesibel, dan image delivery ±834 KiB perlu perbaikan | Open | Frontend owner | Sebelum serah terima | Not run |
| BLK-003 | Blocker (input) | UAT | Staging URL, akun QA, dan data relasi tidak diberikan; 72 case tetap Not Run | Open | System owner | Sebelum serah terima | Not run |
| OBS-001 | Observasi | Freshness bukti | Bukti audit lama 2026-10-12 lebih tua dari perubahan November; tidak bisa dipakai sebagai acceptance build ini | Open | QA lead | Sebelum serah terima | Not run |

### C2. Perbaikan dan blocker yang sudah terselesaikan dalam QA run ini

| ID | Severity | Modul | Temuan | Status | Bukti retest |
| --- | --- | --- | --- | --- | --- |
| FIX-001 | Major | LMS API | `backend/api/relationships.php` memakai alias `c` pada `rs_class_filter()` tanpa alias di `lms_classes` → SQL 1054. Alias ditambahkan. | Fixed | HTTP + browser PASS |
| FIX-002 | Blocker | Billing API | `add_invoice` menerima `status: 'Lunas'` dari client → status paid bisa dipalsukan. Guard ditambahkan: invoice baru wajib `Unpaid`. | Fixed | HTTP 102 PASS |
| FIX-003 | Major | Billing API | Query daftar siswa memakai `$selName` (mengandung `AS nama`) di dalam `WHERE` subquery → SQL syntax error. Dipisah menjadi `$nameExpr`. | Fixed | Browser PASS |
| FIX-004 | Major | QA runner | Runner browser punya label/tombol usang dan fixture batch tanpa 2026; ditambah override `PHP_BIN`/`CHROME_BIN` serta verifikasi via API/DB. | Fixed | Browser PASS |
| BLK-001 | Blocker (environment) | Backend/HTTP/browser | DB lokal tidak tersedia. MySQL XAMPP dijalankan dan DB `one-creativa` diisi dari master schema. | Resolved | HTTP + browser PASS |
| BLK-002 | Blocker (environment) | Performance | Lighthouse tidak terpasang. Dipasang lokal dengan `npm install --no-save` dan dijalankan. | Resolved | Lighthouse ran; skor di DEF-006 |

### C3. Keputusan gate

**NO-GO.** Browser/UI acceptance lokal green pada enam runner (169 check lulus + PDF terverifikasi), tetapi serah terima tidak dapat diterima selama staging UAT tidak ada dan temuan open belum tertutup.

Syarat pindah ke GO:

1. DEF-001 dan DEF-002 ditutup atau diterima tertulis oleh pemilik sistem.
2. DEF-003, DEF-004, DEF-005 dan DEF-006 diperbaiki dan runner dijalankan ulang hijau.
3. BLK-003 terselesaikan: staging + akun QA tersedia, 72 case dijalankan dan ditandatangani.
4. Setiap case memiliki status akhir; setiap `Fail` memiliki ID defect; setiap `Blocked` memiliki alasan.

## D. Limitasi & scope yang tidak diuji

- Face/RFID fisik, kamera, dan scan perangkat nyata: NOT VERIFIED.
- Browser acceptance dilakukan di lokal dengan DB sintetis, bukan di staging HTTPS; ini bukan pengganti UAT.
- Tujuh record identitas historis di `docs/audit/HISTORICAL_IDENTITY_REVIEW.csv`: masih `needs_review`; butuh keputusan tertulis pemilik.
- Saldo awal, rekonsiliasi bank, dan data operasional nyata: memerlukan penandatanganan Finance.
- Case fungsional: 26 Pass (lokal), 1 Fail, 59 Blocked, 0 Not Run. UAT persona di staging belum tersedia.
- Test otomatis memakai database sintetis terisolasi; tidak membuktikan data produksi.
- Lighthouse sudah dijalankan, tetapi skor belum memenuhi syarat gate (DEF-006).

Dilarang menandai item di bagian D sebagai Pass tanpa bukti baru.

## E. Indeks bukti

| Bukti | Path |
| --- | --- |
| Matriks 72 case | Bagian B2 pada dokumen ini |
| Log defect lengkap + keputusan gate | Bagian C pada dokumen ini |
| Runbook QA | `docs/QA_FORM/RUNBOOK.md` |
| Ringkasan seluruh perubahan | `docs/QA_FORM/RINGKASAN_PERUBAHAN.md` |
| Gate lint/build/artifact | `docs/QA_FORM/evidence/build-gates.json` |
| Hasil test PHP | `docs/QA_FORM/evidence/php-tests.json` |
| Blokir HTTP lama | `docs/QA_FORM/evidence/http-checks.json` |
| Browser/UI acceptance 2026-11-27 | `docs/QA_FORM/evidence/browser-verification-2026-11-27.json` |
| Blokir UAT | `docs/QA_FORM/evidence/uat-blocked.json` |
| Ringkasan Lighthouse | `docs/audit/lighthouse-summary.json` |
| Versi PDF (8 halaman A4 landscape) | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.pdf` |
| Versi Excel / Google Sheets | `docs/QA_FORM/QA_SERAH_TERIMA_2026-11-27_cbb4c90.xlsx` |
| Baseline audit (referensi, bukan hasil run ini) | `docs/audit/QA_PHASE_5_16.md` |

## F. Persetujuan

| Peran | Nama | Tanda tangan | Tanggal |
| --- | --- | --- | --- |
| Disiapkan (QA) |  |  |  |
| Diverifikasi (Lead/PO) |  |  |  |
| Diterima (Klien/PO) |  |  |  |

Keputusan penerima: `[ ] Terima` `[x] Terima dengan catatan` `[ ] Tolak`

Catatan penerima: Gate **NO-GO**. Dokumen ini menggabungkan seluruh hasil QA lokal 2026-11-27 termasuk 72 test case dan defect, tetapi bukan penerimaan sistem. Serah terima menunggu penutupan DEF-001 sampai DEF-006, BLK-003, dan eksekusi 72 case di staging.
