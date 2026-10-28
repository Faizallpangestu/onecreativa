RAB kantor memakai database dan sesi login server. Finance membuat/edit draft dan mengajukan. Reviewer dengan izin backend `approve` (default Admin, Super Admin, Director/Direktur) mereview, menyetujui, menolak, atau mengembalikan untuk revisi. RAB yang diajukan dikunci; keputusan, pembatalan, pengaju dan snapshot rincian tetap tercatat.

Persetujuan hanya mengotorisasi anggaran; tidak membuat income, modal, kas, beban, atau jurnal. Dengan fondasi Phase 2, komitmen dan realisasi ditautkan ke item approved. Pengakuan utang/aset/beban, pencatatan pembayaran, verifikasi, dan posting jurnal adalah tahap terpisah. Kunci baris, indeks unik, version check, dan transaksi database mencegah duplikasi, pelampauan batas, serta keputusan terhadap data lama. Transaksi `Pendanaan RAB` historis tidak otomatis dihapus atau diubah; memerlukan review Finance dengan bukti sumber.

Instalasi / deployment:

```powershell
php backend/migrations/budget_workflow.php
php backend/migrations/finance_traceability.php --dry-run
php backend/migrations/finance_traceability.php
```

Backup database dan lampiran target terlebih dahulu; deployment produksi memerlukan persetujuan. Migrasi dapat dijalankan ulang dan tidak mengubah transaksi lama. Login ulang setelah deployment untuk membuat sesi server. Data lama di `anggaran_data` / `anggaran_kas` browser tidak otomatis diimpor atau disetujui karena belum memiliki pengaju, periode dan bukti keputusan yang terverifikasi; penyimpanannya tidak dihapus. Lihat `docs/finance/PHASE_2_IMPLEMENTATION.md` dan `PHASE_2_ROLLBACK.md` untuk cakupan terverifikasi, batas implementasi, serta QA.

Pemeriksaan integrasi (database sementara, akun dan transaksi aplikasi tidak diubah):

Lampiran RAB opsional: satu gambar JPG/PNG/WebP maksimal 2 MB dan/atau link HTTP(S). Jalankan kembali migrasi di atas untuk menambahkan kolom lampiran. Direktori `storage/budget-attachments` harus dapat ditulis PHP; gambar hanya diberikan lewat endpoint RAB dengan sesi Finance/Admin. Sertakan `storage/.htaccess` saat deployment dan pertahankan/backup folder gambar bersama database. Mengganti atau menghapus gambar draft tidak menghapus gambar pada snapshot riwayat.

```powershell
php backend/tests/budget_workflow_test.php
```

Pengujian mencakup izin sesi/role, CSRF, validasi nominal, snapshot riwayat, status terkunci, filter kedua jenis bulan, penolakan/pembatalan, rollback, approval paralel, penguncian pemasukan, dan logout. File pengujian/migrasi menolak akses HTTP; router pengujian hanya aktif di server CLI dengan nama database sementara yang dibatasi.
