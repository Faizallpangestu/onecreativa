Penggajian Karyawan dikelola Finance dan diperiksa Admin/Super Admin per karyawan. Periode adalah satu bulan kalender absensi; tanggal gajian tanggal 4 bulan berikutnya. Hadir, terlambat, dinas, atau check-in dengan status kosong mendapat uang makan Rp30.000 dan transport Rp20.000 per tanggal unik. Cuti/izin/absen tidak dihitung, dan absensi kosong menghasilkan tunjangan Rp0. Kehadiran sebelum tanggal bergabung tidak dihitung.

Tab Gaji Pokok pada Penggajian Karyawan memungkinkan Finance/Admin menetapkan nominal per karyawan, bulan absensi mulai berlaku, dan alasan perubahan. Nominal berlaku terus sampai jadwal perubahan berikutnya. Setiap penyimpanan menambah riwayat dengan identitas pengubah; versi mencegah penyimpanan dari data lama. Sebelum pengaturan mulai berlaku, gaji memakai nilai individu pada data karyawan; nilai 0 memakai standar jabatan. Migrasi tidak mengganti nilai awal atau pengajuan nyata.

Pengaturan yang akan mengubah periode submitted/approved/paid atau slip lama published ditolak. Jadwal kenaikan bulan depan tidak memengaruhi bulan sebelumnya. Draft tidak diubah diam-diam; gunakan Simpan & Hitung Ulang untuk menerapkan gaji yang berlaku dan absensi terbaru. Snapshot menyimpan ID pengaturan dan bulan berlaku untuk audit. Gaji pokok kosong menghalangi pengajuan. Finance dapat melengkapi rekening tujuan pada draft; perubahan rekening hanya berlaku pada pengajuan tersebut. Pengajuan hanya bisa dibuat setelah periode absensi selesai, dan perubahan sumber absensi/gaji sebelum pengajuan mengharuskan hitung ulang.

Alur: draft → submitted → approved/rejected. Pengajuan ditolak dapat direvisi menjadi draft dan diajukan kembali dengan riwayat tetap tersimpan. Pengajuan approved dikunci dan siap ditransfer mulai tanggal gajian. Persetujuan tidak mengirim uang. Setelah transfer bank benar-benar selesai, Finance mencatat tanggal aktual dan referensi transaksi; status menjadi paid dan satu pengeluaran Penggajian Karyawan dibuat. Tidak ada integrasi transfer bank otomatis. Pembayaran setelah tanggal jadwal dimungkinkan; tanggal sebelum jadwal/persetujuan atau tanggal masa depan ditolak.

Kunci baris, versi, dan indeks unik mencegah pengajuan/pembayaran ganda untuk karyawan-periode yang sama. Pengeluaran terhubung tidak dapat diedit/dihapus lewat API Finance dan hanya tampil untuk Finance/Admin. Snapshot nominal, rekening, absensi, dan seluruh keputusan/pembayaran tetap tersedia pada riwayat.

Slip gaji sistem lama dipertahankan; periode dengan slip lama berstatus published tidak bisa diproses lagi untuk menghindari pembayaran ganda. Endpoint lama save_payroll/publish_payroll dinonaktifkan (410), dan tampilan HRD menjadi perhitungan untuk dibaca. Akses slip memverifikasi identitas melalui sesi server; parameter employee_id/role tidak dapat membuka slip orang lain.

Finance dapat mengisi THR dan potongan kasbon, BPJS Ketenagakerjaan, BPJS Kesehatan, serta izin/sakit secara manual pada draft. Jumlah pendapatan, jumlah potongan, dan gaji bersih dihitung server, tersimpan dalam riwayat, dan diperiksa Admin. Komponen manual dipertahankan saat absensi dihitung ulang. Pengajuan/persetujuan mengunci nominal; perubahan memerlukan penolakan dan revisi. Tidak ada tarif BPJS atau potongan izin otomatis. Pembayaran dan pengeluaran menggunakan gaji bersih setelah potongan.

Penerbitan slip dan email mengikuti [SALARY_SLIPS.md](SALARY_SLIPS.md): setelah persetujuan Admin, Finance memeriksa pratinjau dan menerbitkan slip. Slip baru terlihat di dashboard karyawan setelah penerbitan Finance, termasuk sebelum transfer dengan status Menunggu Transfer. Email memerlukan konfigurasi SMTP kantor. Tidak ada asumsi potongan pajak/lembur tambahan.

Instalasi (ulang aman, tanpa memproses gaji/transaksi nyata):

```powershell
php backend/migrations/salary_workflow.php
```

Pengujian pada database sementara:

```powershell
php backend/tests/salary_workflow_test.php
php backend/tests/salary_base_settings_test.php
php backend/tests/budget_workflow_test.php
```

Zona tanggal payroll adalah Asia/Jakarta (UTC+7), dengan koneksi SQL +07:00. Riwayat tetap memakai bulan absensi, sedangkan pengeluaran memakai tanggal transfer aktual.
