# Status persetujuan dan pekerjaan lanjutan

Instruksi pengguna **?lanjutkan sampai selesai tahap siap production?** menjadi dasar melanjutkan perbaikan dan migrasi additive development lokal. Persetujuan lokal tidak perlu diminta ulang. Tidak ada deployment hosting, historical auto-recovery, penghapusan data atau koreksi transaksi historis.

Empat migrasi versioned sudah diterapkan: relasi 9 tabel, sesi QR 1 tabel, bukti pembayaran siswa 1 tabel dan request lembur 1 tabel. Database bertambah dari 61 menjadi 73 tabel; seluruh nilai lama dipertahankan. Backup SQL/storage, restore fixture, schema dan sembilan trigger terverifikasi. PROPOSED_RELATIONSHIPS.sql adalah proposal awal; implementasi otoritatif ada di backend/migrations/20261012_*.sql dan laporan apply masing-masing.

Form admin kelas/assignment/enrollment, API teacher/student scope, dashboard, QR, tugas/submission/publication, billing siswa dan Matching telah diimplementasikan pada cakupan laporan. [Readiness](PRODUCTION_READINESS.md), [verification](release-verification.json), [QA matrix](QA_PHASE_5_16.md) mencatat hasil aktual serta batasannya.

Masih perlu keputusan pemilik data untuk satu employee orphan, tiga peserta tanpa account valid, dua meeting dengan Sensei invalid dan satu submission tanpa user valid. Isi [template identitas](HISTORICAL_IDENTITY_REVIEW.csv) dengan proposed user ID, bukti, reviewer dan waktu. Jangan menebak nama/email atau menganggap approval schema sebagai approval recovery.

Administrator perlu mengisi kelas/assignment/enrollment/invoice owner yang nyata. Finance perlu mengesahkan saldo awal, bank/kas, piutang/hutang, payroll, histori dan kebijakan approval. QA membutuhkan staging, account role nyata dan perangkat. Production tetap NO-GO sampai gate tersebut ditutup; [runbook](PRODUCTION_RUNBOOK.md) menjelaskan langkah berikut.

Rollback memakai source release kompatibel dan mempertahankan tabel/histori additive. Jangan DROP tabel atau restore backup lama di atas transaksi baru; prioritaskan forward fix/reversal yang direview.
