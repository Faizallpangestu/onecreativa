# QA/UAT Phase 5?16: kandidat release terbaru

**Status: otomatis lokal lulus pada cakupan yang tercatat; browser/mobile/perangkat/staging/UAT belum lulus. Production NO-GO.** Matriks ini menggantikan status baseline sebelum implementasi kelas, publication dan billing siswa. Audit awal tetap tersedia dalam [baseline QA](QA_PHASE_5_16_BASELINE.md).

Bukti jumlah checks dan perintah: [verification](release-verification.json). [HTTP nyata](release-http-verification.json) menggunakan cookie/session/CSRF server dan upload multipart. Seluruh mutation test memakai database synthetic terisolasi dan memverifikasi data aplikasi tidak berubah.

Chrome/Edge lokal gagal membuka port debugging; [browser report](release-browser-verification.json) complete=false dan tidak ada screenshot PASS. Local build/API PASS tidak menggantikan browser acceptance.

| Module | Scenario | Status/bukti lokal | Acceptance dan ketergantungan staging |
| --- | --- | --- | --- |
| HRD | Employee directory/create/edit/inactivation | PASS lokal; UAT pending; 78 integrasi employee + 12 state UI; read-only directory 6 staff | Satu profil orphan belum bisa login sebagai pemilik yang terbukti; Directory menampilkan orphan untuk review; transaksi create/edit; tidak recovery otomatis |
| HRD | Employment/manager/resignation | PASS subset lokal; UAT pending; HTTP create/resign/invalid manager berhasil | Detail employment asli belum diisi; Relasi manager, validasi self/cycle, status dan tanggal resignation |
| HRD | Leave/overtime | PASS subset lokal; perangkat/UI pending; Approval spoof/conflict dan waktu asli diperiksa | Bukti attendance diperlukan; tidak boleh membuat jam kerja fiktif; Sesi/pemilik server, approval reviewer, request lembur terpisah, histori dipertahankan |
| HRD | Face/RFID | NOT VERIFIED E2E; Belum dapat menyatakan scan fisik berhasil | Browser/perangkat nyata belum diuji; Guard dan validasi upload diperbaiki; jalankan UAT kamera/RFID |
| Security | Session/CSRF/roles/private files | PASS lokal; hosting pending; HTTP anonymous/foreign role/object/inactive/logout diperiksa | Aturan Apache belum dibuktikan pada target host; Active session, actor server, CSRF, object scope, denied private folders |
| Finance | Accounting/journal/reports/reversal | PASS fixture; reconciliation pending; 105 accounting integration checks | Saldo awal dan sumber historis belum disahkan; Posted balanced journal dan sumber/alokasi eksplisit; coverage tetap jujur |
| Finance | RAB approval/commitment/realization | PASS lokal; UAT pending; 75 budget workflow checks | Kebijakan approval dan role aktual perlu acceptance bisnis; Approval tidak mencatat kas/expense otomatis; cap/concurrency/realization teruji |
| Finance | Payroll/payslip/settlement | PASS lokal; UAT pending; 68 salary workflow checks | Payroll UI dan mail provider nyata belum diuji; Snapshot immutable, pembayaran idempotent, ekspor/file privat |
| Finance | Invoice/reimbursement receipt | PASS lokal; Finance review pending; HTTP retry/conflict/count/owner/Finance diperiksa | Dokumen receipt lama bukan pembayaran terverifikasi; Pending review, private proof, posted allocation sebagai saldo, retry tanpa duplikasi |
| Sensei | Classes/assignments/roster | Implemented; konfigurasi kosong; Fixture assigned/foreign/unassigned roster teruji | Belum ada kelas/assignment operasional; Form admin dan server scope explicit class/date/teacher |
| Sensei/LMS | Attendance/QR/corrections | PASS lokal; kamera/UAT pending; HTTP QR forgery/identity spoof/retry/notes diuji | Pertemuan lama belum punya pengajar valid; Enrollment + token server + expiry + koreksi beraudit |
| Sensei/LMS | Task/material/quiz/UKOM/submission/publication | PASS lokal; browser pending; 49 relationship/learning/billing/Matching integration checks; HTTP full learning flow | Nilai published tidak mempunyai workflow koreksi resmi; Draft/publish explicit, deadline, private uploads; hasil published immutable |
| LMS | Personal dashboard/profile/card | Implemented; identity/configuration pending; Profile tanpa enrollment tetap identity asli; student/foreign scope diuji | Tiga peserta tanpa account valid; Identitas unik dari account server; sumber kelas asli; tidak menebak nama/email |
| LMS/Finance | Student bills/payment review | PASS fixture; real owner links pending; Receipt tidak mengurangi AR; owner spoof ditolak | Belum ada invoice owner operasional; Explicit owner link, exact amount, proof pending, verified allocation/reversal |
| Matching | Identity/progress/document verification | PASS subset lokal; export/UAT pending; Fixture/HTTP access, upload, verification missing file diperiksa | Data historis belum diklasifikasikan oleh pemilik; Optional internal student link, external candidate, duplicate guard, history, actual document check |
| LPK | Student/material views | Implemented subset; role policy pending; Build/lint lulus; browser belum terverifikasi | Role LPK tidak otomatis berhak membaca semua kelas; Materi memakai API kelas; absensi siswa memakai namespace LMS; unauthorized jelas |
| GA/legacy/other participant roles | Complete operational workflows | PARTIAL / NOT VERIFIED; Tidak diberi label full-system PASS | Belum semua halaman dan role peserta diuji end-to-end; Central API guards; validasi upload; lanjutkan acceptance matrix di staging |
| Database | Historical preservation | PASS lokal; identity review pending; 61 tabel lama utuh; 45 tabel original Phase 2 dan agregat finansial utuh | Tujuh record butuh bukti pemilik; Backup/restore, hash comparison; preserve record tanpa auto-update |
| Release | Build/package/PWA | PASS lokal; Apache staging pending; Build dan package check; manifest SHA-256 disediakan | Package tidak berisi konfigurasi host/private data; Isolated release artifact, protections, private exclusions, NetworkOnly API |
| QA | Browser/mobile/UX/export | NOT VERIFIED; Browser report complete=false; tidak ada screenshot PASS | Chrome/Edge tidak membuka port debugging lokal; HTTP nyata sudah diuji; browser acceptance harus dilakukan di staging/mesin QA |

## Pelaksanaan acceptance

Gunakan staging terpisah dan account QA nyata: Super/Admin, HR/HR Admin, Finance/Finance Admin, Sensei assigned dan unassigned, dua siswa di kelas berbeda, LPK, GA, dan role peserta lainnya. Jangan mengubah localStorage untuk membuktikan permission. Uji API langsung menggunakan session yang sama dengan UI.

1. Isi kelas, assignment, enrollment dan invoice owner berdasarkan hubungan nyata. Review tujuh identity issues menggunakan [template](HISTORICAL_IDENTITY_REVIEW.csv). Tidak membuat default kelas/siswa/teacher.
2. Uji directory, search/filter/pagination, detail, create/edit, inactive/resignation, manager, password dan decimal/date. Uji error jaringan, pending save, duplicate retry dan modal keyboard/focus/scroll.
3. Uji tugas/materi/quiz/UKOM/konsultasi: teacher own class, student enrolled, foreign denied, upload/deadline, draft grade/feedback hidden, publish dan nilai 0 sah. Published result tidak bisa ditimpa tanpa workflow koreksi yang direview.
4. Uji QR di kamera nyata: server token, expiry/revoke, actual identity, check-in/out/retry dan correction notes. Cocokkan histori teacher/student dan timestamp asli. Uji perangkat Face/RFID, izin browser dan error yang actionable.
5. Uji capital/loan/revenue/deferred, source invoice/vendor/payroll/reimbursement, RAB noncash approval/realization/caps, payment/allocation/reversal. Cocokkan sumber dan GL/TB/P&L/CF; Finance mengesahkan saldo awal dan bank/kas actual.
6. Uji student bill own scope, proof pending, verified-posted payment dan reversal; proof/upload sendiri tidak membuat paid. Uji invoice/reimbursement retry sama key dan conflict payload berbeda, private owner/reviewer access.
7. Uji Matching internal link/external candidate/duplicate/progress notes/history/actual document verification. Uji Excel/filter/date/numeric export, SMTP target dan private downloads.
8. Uji semua flow GA/legacy/other participant roles; personal Nenkin/Mendang/Alumni belum mempunyai acceptance lengkap. Jangan menandai full-system PASS berdasarkan subset tests.
9. Uji desktop/mobile, labels, table overflow, focus, no uncaught runtime error, camera cleanup, 21 warning React Hooks dan performance bundle target.
10. Verifikasi HTTPS target: private directories/diagnostics/scripts denied, anonymous 401, foreign 403, CSRF 403, inactive/logout invalidates session, cookie Secure/HttpOnly/SameSite, request ID/no-store, API NetworkOnly dan no cached operational data.

Untuk setiap scenario simpan role/account QA, waktu, URL/versi release, actual result, request ID bila error, screenshot tanpa PII dan nama reviewer. Tutup setiap PARTIAL/NOT VERIFIED dengan bukti atau keputusan scope tertulis pemilik. Approval migrasi additive lokal sudah diberikan dan diterapkan; recovery/koreksi histori tetap memerlukan bukti dan keputusan tersendiri.

Gate dan deployment/rollback: [readiness](PRODUCTION_READINESS.md), [runbook](PRODUCTION_RUNBOOK.md).
