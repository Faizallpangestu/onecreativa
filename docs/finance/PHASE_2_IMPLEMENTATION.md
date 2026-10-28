# ONE Creativa — Phase 2: hasil audit dan implementasi lokal

Tanggal: 12 Oktober 2026. React/PHP/MySQLi dan identitas visual navy, biru, serta panel putih tetap digunakan. Tidak ada deployment hosting, reset database, penghapusan data bisnis, perubahan akun/role, atau posting transaksi historis otomatis.

**Fondasi finance dan jalur operasional baru tersedia untuk QA lokal. Seluruh aplikasi belum dapat dinyatakan terverifikasi end-to-end atau siap produksi.** Cakupan verifikasi dan pekerjaan yang masih terbuka dibedakan di bawah. Pengguna mengonfirmasi RAB belum diuji QA; tidak ada insiden “RAB gagal diproses” dengan langkah reproduksi yang telah terverifikasi.

## 1. Audit pekerjaan sebelumnya

Pekerjaan sebelumnya menghasilkan audit, bukan implementasi akuntansi. Bukti sebelum migrasi: `PHASE_1_AUDIT.md`, `database-audit.json`, `verification.json`, dan `phase2-before.json`; 45 tabel tanpa COA, jurnal, periode, rekening kas/bank, maupun alokasi pembayaran.

| Fitur | Status sebelum Phase 2 | Bukti / masalah aktual |
| --- | --- | --- |
| Chart of Accounts | Not implemented | Tidak ada `accounts` dalam snapshot sebelum migrasi |
| Double-entry journal | Not implemented | Tidak ada `journal_entries` / `journal_lines` |
| Automatic journal posting | Not implemented | Finance, invoice, salary, dan RAB belum memiliki jurnal |
| Dynamic income/expense form | Partially implemented | Form CRUD kategori teks di `TransaksiPemasukan.jsx` / `TransaksiPengeluaran.jsx`; belum memvalidasi substansi dengan COA |
| RAB workflow | Implemented but defective | Approval di `budget_workflow.php` menciptakan income “Pendanaan RAB”; tidak ada komitmen/realisasi |
| Invoice integration | Partially implemented | `billing_*` dan `invoice_*` terpisah; tanpa pengakuan piutang/alokasi jurnal; beberapa aksi billing mengembalikan sukses tanpa implementasi |
| Payroll workflow | Implemented and verified untuk workflow lama; accounting not implemented | 68 pemeriksaan salary; pembayaran menghasilkan `finance_records`, bukan utang gaji/jurnal |
| Financial dashboard / P&L | Implemented but defective | `finance.php` dan halaman profit menghitung income−expense; modal ikut menjadi laba |
| Hosting/runtime QA | Unable to verify | Tidak ada akses QA/hosting atau laporan HTTP kegagalan RAB; artifact build lama tidak membuktikan deployment yang aktif |

Data lokal sebelum migrasi: 3 transaksi finance, 1 payroll paid, 9 users, 13 roles, 8 employees, 5 peserta intensif. Transaksi finance terdiri atas modal Rp2 juta, kebutuhan kantor Rp2 juta, dan payroll Rp10 juta. Angka tersebut tidak digunakan sebagai laba akrual sebelum review dokumen dan pengakuan jurnal.

## 2. Implementasi finance yang dapat diperiksa

| Fitur | Status sekarang | Bukti implementasi / verifikasi |
| --- | --- | --- |
| COA dan rekening | Implemented and verified pada API/services; QA browser pending | `accounting_schema.php`, `accounting_journal.php::ac_master_mutate`, `AccountingTools.jsx`; akun 1–5, normal balance, parent, detail, aktif, klasifikasi laporan; struktur akun yang telah berjurnal dikunci |
| Jurnal double-entry | Implemented and verified | `accounting_journal.php`; decimal string/integer cents, debit=credit, period locking, source/event unik, immutable posted header/lines, reversal; pemeriksaan integrasi dan trigger SQL |
| Posting dari sumber | Implemented and verified untuk jalur kanonik | Pengakuan invoice/tagihan/payroll/klaim dan pembayaran verified membentuk jurnal; approval RAB tidak membentuk jurnal; historical/legacy tidak otomatis posted |
| Buku transaksi | Implemented and verified pada API/build; QA browser pending | `/buku-transaksi`, `FinanceWorkspace.jsx`, `accounting_ledger.php`; transaksi kanonik, finance legacy, pembayaran invoice legacy, jurnal pengakuan/adjustment/reversal; ID sumber asli dipertahankan |
| Detail dan audit | Implemented and verified pada API/build | General/financial/source/dokumen, approval, pembayaran, jurnal, reversal, audit; bukti baru melalui endpoint authenticated; `RecordTree` menampilkan rincian sumber aktual |
| Filter dan ekspor | Implemented and verified pada API/build | Server filter tanggal/bulan/tahun/sumber/jenis/substansi/COA/departemen/batch/siswa/vendor/rekening/status/pembuat/search; CSV dan data Excel menggunakan filter yang sama, nominal numeric, IDs sumber, proteksi formula CSV, izin server |
| Form kas masuk/keluar | Implemented and verified pada API/build | `AccountingTransactionForm.jsx`; jenis menentukan COA, arah dan aktivitas arus kas; real source lookup, dokumen, rekening berbeda untuk transfer, preview jurnal; draft dapat diedit/dikembalikan untuk revisi sebelum pembayaran |
| RAB | Implemented and verified pada API/services/build | `budgets.php`, `budget_workflow.php`, `budget_realization.php`, `BudgetRealizationForm.jsx`; department, review, return revision, approve/reject, nominal approved per item, commitment/realisasi, bukti, vendor, rekening, klasifikasi, link bill, closure; concurrency/idempotency/cap/reversal diuji |
| Vendor bill | Implemented and verified | Draft dan approval oleh reviewer lain; pengakuan aset/beban vs AP; settlement AP tidak menghasilkan beban kedua |
| Invoice integration | Implemented and verified untuk pengakuan/alokasi; migrasi dua UI legacy masih parsial | Invoice nyata → AR vs revenue/deferred → cicilan vs AR; batas outstanding saat posting, earned-revenue release, source link; pembayaran legacy tetap perlu review |
| Payroll accounting | Partially implemented secara otomatis; pengakuan/review tersedia dan terverifikasi | Workflow salary tetap menjadi jalur pembayaran. Buku transaksi menautkan pembayaran salary/finance asli, bukan membayar payroll kedua kali. Pengakuan gross−leave, utang net, kasbon, BPJS memerlukan COA potongan yang benar. Tidak ada autopost payroll historis |
| Reimbursement accounting | Implemented pada jalur pengakuan/settlement; QA lintas UI pending | Approved claim → beban/aset vs utang reimbursement → pembayaran vs utang. Pengajuan tetap milik actor server; approve/reject tidak mempercayai role query |
| Laporan | Implemented and verified pada API/services/build | P&L, neraca, arus kas, ekuitas, AR/AP aging, budget vs actual, GL, TB, riwayat/running balance kas-bank, sumber/penggunaan dana; `/laporan-keuangan`, `/profit`, `/dashboard-finance` |
| Rekonsiliasi bank / sertifikasi saldo awal | Not implemented | Tidak ada bank statement import/matching atau persetujuan saldo awal. Coverage tidak dinyatakan complete secara otomatis |
| Penyusutan aset / jadwal pendapatan otomatis | Not implemented | Pembelian aset dan earned revenue tersedia; penyusutan dan jadwal pengakuan otomatis belum tersedia |

Posting pembayaran mengikuti **draft → submitted → approved oleh reviewer berbeda → paid dengan bukti/reference → verified → posted**. “Catat pembayaran” adalah pencatatan pembayaran yang sudah benar-benar terjadi; aplikasi tidak mengirim transfer bank.

Pengakuan dokumen, adjustment, dan reversal memakai izin `post`. Konfigurasi backend menyediakan `read`, `prepare`, `approve`, `post`, `configure` per role; localStorage hanya membatasi navigasi. Default Finance: read/prepare/post; Admin/Super Admin: read/approve/configure; Director/Direktur: read/approve. Role/account existing tidak dibuat ulang atau diganti.

`finance.php` menjadi pembacaan historis authenticated; penulisan/hard-delete lama ditolak dan diarahkan ke buku transaksi. API invoice/billing memakai sesi/CSRF dan tidak menghapus dokumen finansial secara fisik. Aksi billing yang belum didukung mengembalikan error, bukan sukses semu. CSRF pada pemanggilan legacy didukung `session.php` dan `sessionHeaders.js`.

## 3. Substansi akuntansi

- Modal/investor: debit kas, kredit ekuitas; bukan revenue. Pinjaman: kredit kewajiban; bukan revenue.
- Invoice: AR vs revenue atau deferred sesuai layanan. Penerimaan cicilan melunasi AR; tidak mengakui revenue lagi. Deferred hanya dilepas dengan nominal dan bukti layanan terpenuhi.
- Payroll/reimbursement/vendor: pengakuan kewajiban dipisahkan dari pembayaran. Settlement mengurangi kewajiban; tidak membebankan ulang.
- Aset/persediaan/uang muka menggunakan akun aset. Pokok pinjaman dan bunga memakai jenis terpisah. Transfer internal memiliki arus kas konsolidasi nol.
- RAB approval adalah otorisasi anggaran. Komitmen mencadangkan batas, realisasi tercatat membuat draft pembayaran, accrual berasal dari pengakuan tagihan, pembayaran posted membentuk jurnal kas.
- Realisasi tidak boleh melebihi sisa item. Tidak ada bypass over-budget; kebutuhan tambahan harus diajukan dan disetujui terpisah. Pembatalan draft/reversal melepaskan realisasi tanpa menghapus sumber asli.
- Source-of-funds memakai jurnal dan dimensi yang benar. Kas umum tidak dialokasikan secara otomatis ke modal/invoice tertentu. Fitur segregasi/restricted fund khusus belum tersedia.

Laporan hanya dari jurnal posted dan selalu menyertakan coverage: jumlah jurnal, legacy perlu review, pembayaran belum posted, dokumen belum diakui, serta saldo awal belum disertifikasi. **Tidak ada pernyataan laporan sudah lengkap atau telah direkonsiliasi eksternal.** Empty posted journal menghasilkan angka nol dengan penjelasan coverage; kegagalan SQL/API menghasilkan error yang terlihat.

## 4. Audit sistem bersama, HRD, Sensei, LMS, Matching, GA

Inventory: `phase2-system-inventory.json` mencakup 103 route dan 74 endpoint PHP; `phase2-system-database.json` berisi skema, FK, indeks, dan count seluruh 61 tabel setelah migrasi. Scanner belum mendeteksi session authorization pada 33 endpoint nondiagnostic dan menemukan runtime DDL pada 17 endpoint termasuk helper. Flag static adalah kandidat pemeriksaan, bukan otomatis bukti exploit. Ada endpoint di luar jalur yang diuji yang masih memerlukan review otorisasi dan DDL runtime.

| Area | Temuan / tindakan / batas verifikasi |
| --- | --- |
| HRD–Finance | Salary/payroll/slip existing dipertahankan; 68 regression checks. Employee IDs, request paid, deductions, dan finance link menjadi sumber pengakuan. Tidak semua CRUD HRD, absensi face/RFID, leave, overtime, atau pengiriman email diuji end-to-end dalam pekerjaan ini |
| Dashboard Creativa | Sebelumnya memuat siswa dari localStorage, minimum 1, KPI 36/12/18, growth, chart kas dan pendaftaran contoh. Sekarang query master/role/meetings aktual, peserta asli dan link laporan posted; hero/desain existing dipertahankan. Tabel program yang tidak tersedia diberi null/availability, bukan nol semu |
| Matching Job | Tabel aktual `lpk_matching_job`; dashboard lama mencari `lpk_matching`. Nama sumber dashboard diperbaiki. CRUD onboarding/placement/payments Matching belum diverifikasi penuh |
| Sensei dashboard | Fallback 48 siswa dan persentase pertumbuhan tetap dihapus. Total dari master; data backend tidak lagi ditimpa agenda localStorage. Kalender existing dihubungkan ke meeting records; agenda menampilkan tanggal/waktu asli dan tidak membuat status berlangsung berdasarkan urutan baris. Pengumuman lokal ditandai lokal, tidak dianggap data server |
| LMS statistik | Identity dari sesi, query ID siswa lain ditolak; nilai 0 termasuk rata-rata; jadwal berlalu tidak menghasilkan aktivitas “membaca materi”; label menjadi Materi Tersedia; error tampil di UI |
| LMS grade roster | GET tidak lagi membuat siswa/default batch. Siswa hanya membaca roster sendiri dan tidak dapat menilai. Grade 0–100 divalidasi; teacher/admin mutations memakai CSRF. Legacy grade roster belum mempunyai assignment per class/batch yang kuat |
| LMS submission / agenda / task / attendance | Session/role/CSRF, actor identity, teacher meeting ownership; siswa tidak dapat grade, Sensei tidak dapat grade/delete meeting pengajar lain; attendance `users.name` yang tidak ada diganti employee name/email. Path upload menjadi absolute dari endpoint; GET tidak membuat folder; runtime CREATE/ALTER dihapus dari endpoint yang diperbaiki, memakai skema existing yang telah tersedia |
| Assignment / enrollment LMS | `lms_meetings.sensei_id` dipertahankan dan digunakan untuk keputusan ownership. Tidak dilakukan assignment massal atau repair user/student ID. Namespace legacy grade memakai peserta ID, submission/attendance memakai user ID; belum dikonversi diam-diam. Enrollment class/batch dan semua endpoint leaderboard/kaiwa/pengumuman masih perlu review menyeluruh |
| GA/aset/maintenance | Purchase source tersedia untuk finance; aset dan riwayat lama dipertahankan. API maintenance dan resolve_map tetap masuk package karena dipakai UI. Workflow transfer, scan, audit aset, dan maintenance tidak dinyatakan lulus QA |
| Deployment | `copy-backend.js` mengecualikan tests, diagnostic/migration helper API, private backups, local config overrides, dan data private storage. Tetap mempertahankan endpoint bisnis. Build tidak dipublish; storage/upload existing pada server target harus dipertahankan terpisah |
| Cache / dokumen private | API menggunakan NetworkOnly pada service worker agar otorisasi tidak dilewati oleh respons cache lama. Bukti finance baru authenticated; dokumen reimbursement/LMS legacy masih memakai direktori public uploads dan belum dimigrasikan ke penyimpanan private |

Dengan batas di atas, **integrasi HRD/Sensei/LMS penuh, seluruh permission bisnis, serta seluruh fitur aplikasi belum dinyatakan selesai**. Tidak ada kebijakan assignment baru yang dibuat dari asumsi nama/email/batch. Inventory dan temuan ini menjadi daftar pekerjaan lanjutan, bukan bukti semua endpoint aman.

## 5. Bukti data dan verifikasi

- Backup private sebelum perubahan: `backend/storage/backups/phase2-1791778079699/database.sql`, dengan source snapshot terpilih. Direktori ditolak melalui `.htaccess` dan tidak dipaketkan untuk hosting. Backup lokal bukan backup produksi.
- Migrasi lokal CLI `finance_traceability.php` sudah dry-run lalu diterapkan: 45 → 61 tabel; 20 COA template dan 25 permission rows adalah master/configuration, bukan transaksi/KPI palsu.
- `phase2-before.json` / `phase2-after.json`: 3 finance, 1 salary paid, 9 users, 13 roles, 8 employees, 5 siswa tetap sama. Rekening/periode baru masih kosong; 0 jurnal / 0 transaksi accounting baru.
- `tools/phase2-data-integrity.cjs` membandingkan seluruh nilai kolom asli di **45 tabel** dengan dump private sebelum perubahan, bukan hanya row count. `phase2-data-integrity.json`: seluruh nilai asli dan aggregate finansial unchanged.
- `tools/phase2-local-check.php`: buku transaksi database nyata memuat 3 baris historical, 0 posted, 3 review flags; detail legacy/salary dapat dibaca tanpa reclassification.
- Integration tests memakai database sementara dengan nama terverifikasi, data sintetis, HTTP server loopback, dan cleanup `finally`. Tidak menambahkan data pengujian ke database operasional. SMTP eksternal dinonaktifkan pada fixture.
- `accounting_test.php`: **99 checks**, termasuk finance/RAB/vendor, HTTP login/CSRF/spoof/proof/export, closed period, immutable journal/audit, transfer/reversal/aging/coverage, concurrent cap, draft correction, dimensi student AR/deferred/earned revenue, reimbursement decision audit, dan LMS ownership/statistik.
- `budget_workflow_test.php`: **75 checks**, expectation approval diperbaiki menjadi nonkas; rollback/concurrency/HTTP/lampiran tetap diuji.
- `salary_workflow_test.php`: **68 checks**, regression workflow/slip; expectation anonymous finance access diperketat menjadi 401.
- **Total 242 integration checks**. PHP syntax (28 file), ESLint file frontend yang diubah, dan Vite production build diperiksa; rincian perintah/hasil final ada di `phase2-verification.json`. Tidak ada pengujian browser otomatis atau persetujuan QA manual yang diklaim.
- `tools/phase2-build-check.cjs` memeriksa service worker hasil build (API NetworkOnly, precache tanpa data private) dan menjalankan fungsi packaging asli pada fixture sintetis (endpoint bisnis/proteksi tersedia, credential lokal/backup/bukti private/tests/diagnostic tidak disalin).

Backend accounting memakai request ID pada error, log server berisi konteks, respons tidak membocorkan SQL/credential. Error RAB juga memiliki request ID; penyebab insiden hosting tetap membutuhkan log kejadian nyata.

## 6. QA lokal dan aktivasi

Jalankan Apache/MySQL lokal, lalu `npm run dev` dan buka `http://localhost:5173`. Proxy development mengarah ke `/One-creativa/backend/api` pada Apache lokal. Build verifikasi tidak mengganti bundle hosting atau deployment existing.

1. Login Admin/Super Admin; buka `/buku-transaksi` → Master & Pengakuan. Periksa COA, daftarkan rekening perusahaan **yang nyata**, dan buka periode yang benar dengan alasan. Konfigurasi izin hanya untuk role yang telah terdaftar. Tidak ada saldo awal yang diisi otomatis.
2. Login Finance; uji modal, pinjaman, pendapatan, invoice/DP, beban/aset, gaji, reimbursement dan transfer dengan dokumen nyata di environment QA. Reviewer berbeda menyetujui; Finance mencatat/verifikasi pembayaran yang benar-benar terjadi sebelum posting.
3. Uji RAB 5.000 → approved 5.000 → realization 2.000 → remaining 3.000; lower approval; return revision; commitment; race/duplicate; upload/link; reversal; closure. Bukti otomatis untuk contoh tersebut tersedia di fixture, bukan data operasional.
4. Cocokkan GL/TB/neraca/P&L/arus kas/aging dengan sumber dan tanggal; buka jurnal dari GL, pastikan export menggunakan filter, status dan IDs yang sama. Uji non-finance/learner/teacher lain terhadap data private dan mutation.
5. Review 3 transaksi historis dan payroll paid yang ada; jangan menganggap modal sebagai laba atau menyimpulkan angka nol posted adalah hasil bisnis historis. Penetapan saldo awal dan pengakuan historis harus didukung dokumen dan keputusan Finance.
6. Selesaikan batas integrasi pada bagian 4 serta QA browser/mobile dan deployment target. Gunakan `PHASE_2_ROLLBACK.md`; backup/restore produksi dan penerapan migrasi produksi memerlukan persetujuan tersendiri.
