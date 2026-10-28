# ONE Creativa: status release, 12 Oktober 2026

**Keputusan: NO-GO untuk production. Kandidat release lokal disiapkan untuk QA staging.** Implementasi dan pengujian lokal bukan bukti bahwa data operasional, konfigurasi hosting, perangkat absensi, dan persetujuan bisnis sudah siap. Belum ada deployment ke hosting.

Laporan ini menggantikan status implementasi dalam audit awal [Phase 5–16](PHASE_5_16_AUDIT.md). Temuan awal tetap disimpan sebagai histori. Instruksi pengguna “lanjutkan sampai selesai tahap siap production” menjadi dasar melanjutkan implementasi dan migrasi additive lokal; tidak digunakan untuk menebak pemilik data historis.

## Perubahan yang sudah dilaksanakan

Database lokal bertambah dari 61 menjadi 73 tabel. Dua belas tabel baru dibuat tanpa mengisi data operasional buatan. Setiap migrasi memakai backup database dan storage, uji restore pada database terpisah, pemeriksaan schema, serta perbandingan seluruh nilai lama. Sembilan trigger audit/journal ikut diverifikasi saat restore. Bukti: [relasi](relationships-migration-applied.json), [sesi QR](20261012_attendance_sessions-applied.json), [bukti pembayaran siswa](20261012_student_payments-applied.json), [lembur](20261012_overtime_requests-applied.json).

Enam profil staff, termasuk satu profil orphan, dapat dibaca oleh HRD. Dua profil learner tidak dicampur dengan directory staff. Employee create/edit memvalidasi identitas, role, jabatan, departemen, tanggal, nominal dan manager; resignation/inactivation mempertahankan histori. Password, PIN, gaji dan dokumen pribadi dibatasi di backend, bukan berdasarkan localStorage atau role kiriman client.

Kelas, assignment Sensei, enrollment, meeting dan invoice owner mempunyai hubungan eksplisit. Dashboard Sensei/siswa membaca scope tersebut. Tugas, materi, quiz, UKOM, submission, nilai draft dan publikasi memakai data server; nilai nol tetap sah, nilai draft/feedback belum dipublikasikan tidak terlihat oleh siswa. QR mempunyai token server, expiry dan enrollment; koreksi status wajib alasan dan mempertahankan waktu scan asli.

Bukti pembayaran siswa serta invoice receipt menunggu review dan tidak mengurangi outstanding dengan sendirinya. Saldo mengikuti alokasi pembayaran yang verified, journal posted, dan belum direversal. Klaim reimbursement, invoice client dan receipt memakai idempotency key serta hash isi/file. Retry tidak membuat dokumen tambahan, dan key yang digunakan untuk payload berbeda ditolak. Finance tetap memakai nominal decimal, balanced journal, audit immutable, RAB commitment/realization dan payroll snapshot.

Matching mendukung profil eksternal dan hubungan siswa internal yang dipilih secara eksplisit, pemeriksaan duplikasi, histori progres, serta verifikasi dokumen yang benar-benar tersedia. Penghapusan fisik histori finansial dan akademik ditolak. File pribadi dilayani melalui endpoint yang memeriksa sesi dan pemilik/izin; MIME file divalidasi sebelum disimpan. Gambar aman dapat dipreview melalui endpoint privat.

Paket release mengecualikan konfigurasi rahasia, backup, fixture, log QA, dokumen dan foto asli serta endpoint diagnostik. API memakai NetworkOnly pada service worker. Kandidat build berada di `.phase2-build-check`; `dist` dan bundle root yang sudah ada tidak ditimpa.

## Matriks status akhir lokal

Inventory terbaru memetakan 105 routes dan 76 API PHP. Pemeriksaan statis menemukan central/session guard pada endpoint bisnis yang callable, dua endpoint payroll lama retired HTTP 410, dan runtime DDL hanya pada delapan endpoint diagnostik/migrasi yang ditolak serta tidak dipaketkan. Ini evidence source, bukan pengganti uji setiap flow pada hosting. [Inventory terbaru](release-system-inventory.json) mencatat flag dan keterbatasannya.

PASS lokal berarti pemeriksaan otomatis yang tercatat berhasil. Status tersebut tidak menyatakan UAT atau production sudah lulus.

| Module | Feature | Current Status | Problem | Root Cause | Priority | Fix | Test Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HRD | Employee directory/create/edit/inactivation | PASS lokal; UAT pending | Satu profil orphan belum bisa login sebagai pemilik yang terbukti | Account relation historis putus | P1 | Directory menampilkan orphan untuk review; transaksi create/edit; tidak recovery otomatis | 78 integrasi employee + 12 state UI; read-only directory 6 staff |
| HRD | Employment/manager/resignation | PASS subset lokal; UAT pending | Detail employment asli belum diisi | Tabel baru sengaja kosong | P1 | Relasi manager, validasi self/cycle, status dan tanggal resignation | HTTP create/resign/invalid manager berhasil |
| HRD | Leave/overtime | PASS subset lokal; perangkat/UI pending | Bukti attendance diperlukan; tidak boleh membuat jam kerja fiktif | Namespace/request lama tidak konsisten | P1 | Sesi/pemilik server, approval reviewer, request lembur terpisah, histori dipertahankan | Approval spoof/conflict dan waktu asli diperiksa |
| HRD | Face/RFID | NOT VERIFIED E2E | Browser/perangkat nyata belum diuji | Lingkungan perangkat/QA belum tersedia | P1 | Guard dan validasi upload diperbaiki; jalankan UAT kamera/RFID | Belum dapat menyatakan scan fisik berhasil |
| Security | Session/CSRF/roles/private files | PASS lokal; hosting pending | Aturan Apache belum dibuktikan pada target host | Tidak ada staging yang bisa diuji | P1 | Active session, actor server, CSRF, object scope, denied private folders | HTTP anonymous/foreign role/object/inactive/logout diperiksa |
| Finance | Accounting/journal/reports/reversal | PASS fixture; reconciliation pending | Saldo awal dan sumber historis belum disahkan | Tidak ada bukti bank dan dokumen pemilik | P1 | Posted balanced journal dan sumber/alokasi eksplisit; coverage tetap jujur | 105 accounting integration checks |
| Finance | RAB approval/commitment/realization | PASS lokal; UAT pending | Kebijakan approval dan role aktual perlu acceptance bisnis | Director belum ada sebagai account operasional | P1 | Approval tidak mencatat kas/expense otomatis; cap/concurrency/realization teruji | 75 budget workflow checks |
| Finance | Payroll/payslip/settlement | PASS lokal; UAT pending | Payroll UI dan mail provider nyata belum diuji | SMTP/perangkat QA target belum tersedia | P1 | Snapshot immutable, pembayaran idempotent, ekspor/file privat | 68 salary workflow checks |
| Finance | Invoice/reimbursement receipt | PASS lokal; Finance review pending | Dokumen receipt lama bukan pembayaran terverifikasi | Legacy proof sebelumnya dianggap total paid | P1 | Pending review, private proof, posted allocation sebagai saldo, retry tanpa duplikasi | HTTP retry/conflict/count/owner/Finance diperiksa |
| Sensei | Classes/assignments/roster | Implemented; konfigurasi kosong | Belum ada kelas/assignment operasional | Administrator belum memberikan hubungan nyata | P1 | Form admin dan server scope explicit class/date/teacher | Fixture assigned/foreign/unassigned roster teruji |
| Sensei/LMS | Attendance/QR/corrections | PASS lokal; kamera/UAT pending | Pertemuan lama belum punya pengajar valid | Dua meeting memakai teacher ID invalid | P1 | Enrollment + token server + expiry + koreksi beraudit | HTTP QR forgery/identity spoof/retry/notes diuji |
| Sensei/LMS | Task/material/quiz/UKOM/submission/publication | PASS lokal; browser pending | Nilai published tidak mempunyai workflow koreksi resmi | Belum ada keputusan bisnis untuk koreksi hasil final | P1 | Draft/publish explicit, deadline, private uploads; hasil published immutable | 49 relationship/learning/billing/Matching integration checks; HTTP full learning flow |
| LMS | Personal dashboard/profile/card | Implemented; identity/configuration pending | Tiga peserta tanpa account valid | Relasi lama memakai ID account yang tidak sah | P1 | Identitas unik dari account server; sumber kelas asli; tidak menebak nama/email | Profile tanpa enrollment tetap identity asli; student/foreign scope diuji |
| LMS/Finance | Student bills/payment review | PASS fixture; real owner links pending | Belum ada invoice owner operasional | Invoice historis tidak memiliki hubungan siswa yang terbukti | P1 | Explicit owner link, exact amount, proof pending, verified allocation/reversal | Receipt tidak mengurangi AR; owner spoof ditolak |
| Matching | Identity/progress/document verification | PASS subset lokal; export/UAT pending | Data historis belum diklasifikasikan oleh pemilik | Link dan histori baru sengaja kosong | P1 | Optional internal student link, external candidate, duplicate guard, history, actual document check | Fixture/HTTP access, upload, verification missing file diperiksa |
| LPK | Student/material views | Implemented subset; role policy pending | Role LPK tidak otomatis berhak membaca semua kelas | Belum ada keputusan perluasan class permissions | P2 | Materi memakai API kelas; absensi siswa memakai namespace LMS; unauthorized jelas | Build/lint lulus; browser belum terverifikasi |
| GA/legacy/other participant roles | Complete operational workflows | PARTIAL / NOT VERIFIED | Belum semua halaman dan role peserta diuji end-to-end | Cakupan legacy luas; akses personal Nenkin/Mendang/Alumni perlu provider/policy tersendiri | P1 | Central API guards; validasi upload; lanjutkan acceptance matrix di staging | Tidak diberi label full-system PASS |
| Database | Historical preservation | PASS lokal; identity review pending | Tujuh record butuh bukti pemilik | Orphan sudah ada pada baseline | P0 | Backup/restore, hash comparison; preserve record tanpa auto-update | 61 tabel lama utuh; 45 tabel original Phase 2 dan agregat finansial utuh |
| Release | Build/package/PWA | PASS lokal; Apache staging pending | Package tidak berisi konfigurasi host/private data | Perlu overlay deployment yang benar | P1 | Isolated release artifact, protections, private exclusions, NetworkOnly API | Build dan package check; manifest SHA-256 disediakan |
| QA | Browser/mobile/UX/export | NOT VERIFIED | Chrome/Edge tidak membuka port debugging lokal | Penyebab environment belum diketahui | P1 | HTTP nyata sudah diuji; browser acceptance harus dilakukan di staging/mesin QA | Browser report complete=false; tidak ada screenshot PASS |

## Gate go-live yang belum dapat ditutup

1. **Identity dan konfigurasi:** pemilik HRD/LPK menyetujui mapping dengan bukti. Employee `1 → user 3`; peserta `2/3/4 → user 18/19/20`; meeting `2/3 → Sensei 14`; submission `1 → user 16`. Gunakan [template review](HISTORICAL_IDENTITY_REVIEW.csv). Setelah itu isi kelas, teaching assignment, enrollment dan invoice owner dari data yang nyata. Semua tabel konfigurasi baru saat ini kosong.
2. **Finance:** rekonsiliasi saldo awal, bank/kas, piutang/hutang, payroll dan transaksi historis terhadap sumber dokumen. Tentukan kebijakan approver, status kandidat siap, dan koreksi nilai final. Tidak ada autopost histori atau pengesahan angka melalui fixture.
3. **Hosting:** staging terpisah dengan konfigurasi database/SMTP/AI yang terlindungi, HTTPS, storage writable privat, timezone dan Apache access rules yang terbukti bekerja. Kredensial AI lama yang pernah tertanam di source harus dirotasi oleh pemilik provider; release baru membaca environment.
4. **QA/UAT:** peran nyata Admin/Super/HRD/Finance/Sensei/siswa/LPK/GA dan peran peserta lain, browser desktop/mobile, error/session expiry/retry, upload/download, export, kamera/RFID, email dan flow operasional lengkap. Masih ada 21 warning React Hooks yang dicatat dalam [lint summary](release-eslint-summary.json); evaluasi perilakunya saat browser QA. Bundle export sekitar 1,78 MB dan database Browserslist lama juga masih memerlukan review performa target.

Form assignment Sensei saat ini mendukung pembuatan hubungan; workflow perubahan/penonaktifan assignment yang sudah mempunyai histori perlu dilengkapi serta diuji bersama kebijakan pemilik. Koreksi hasil yang sudah dipublikasikan juga belum mempunyai workflow resmi. Pembatasan immutable melindungi histori, tetapi kedua kebutuhan tersebut belum boleh dianggap selesai sebagai CRUD lengkap.

Tanpa bukti di atas, status tetap NO-GO. Gate ini adalah kebutuhan data dan verifikasi, bukan permintaan mengulang persetujuan untuk perbaikan lokal.

## Bukti dan langkah berikut

- [Verification lokal](release-verification.json): perintah, jumlah checks, syntax, lint, build dan batas cakupan.
- [HTTP nyata](release-http-verification.json), [browser belum lulus](release-browser-verification.json), [integritas database](release-data-integrity.json), [integritas Phase 2](../finance/phase2-data-integrity.json).
- [QA acceptance matrix](QA_PHASE_5_16.md), [runbook release](PRODUCTION_RUNBOOK.md), [manifest paket](release-artifact-manifest.json).

Lanjutkan dengan staging terisolasi dan data fixture yang disetujui. Perbaiki kegagalan UAT, ulangi checks yang terdampak, lalu tutup setiap gate menggunakan bukti dan nama reviewer. Deployment production dilakukan setelah gate go-live disahkan.
