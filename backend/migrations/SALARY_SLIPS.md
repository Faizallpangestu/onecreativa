Slip gaji diperiksa dan diterbitkan Finance setelah penggajian disetujui Admin. Penerbitan dapat dilakukan sebelum transfer. Status pembayaran tetap approved sampai Finance mencatat transfer; slip/email/dashboard menampilkan Menunggu Transfer atau Sudah Ditransfer sesuai catatan pembayaran.

Alur penggunaan:

1. Finance membuka Penggajian Karyawan → Lihat Rincian → Pratinjau Slip Gaji.
2. Periksa nominal, tujuan rekening, email dan nomor BPJS. Rekening mengikuti penggajian yang disetujui; email dan nomor BPJS diambil dari profil terkini. Jika rekening profil berubah setelah persetujuan, pratinjau memberi tahu Finance bahwa rekeningnya berbeda.
3. Konfirmasi bahwa slip sudah benar, lalu Terbitkan Slip & Kirim Email.
4. Slip diterbitkan ke dashboard karyawan. Pengiriman SMTP dicoba bila email kantor sudah dikonfigurasi. Finance dapat melihat status dan mencoba pengiriman ulang untuk pending/failed.

Slip memakai kop perusahaan, logo, tanggal gajian, nama/NIK, jabatan, dan tanggal mulai kerja. Pendapatan dan potongan ditampilkan berdampingan, diikuti jumlah pendapatan, jumlah potongan, gaji bersih, terbilang, dan kolom Mengetahui. Dokumen yang sama digunakan untuk pratinjau, dashboard karyawan, cetak/PDF, dan email. Logo email disematkan sebagai CID; lampiran HTML menyertakan logo agar dapat dibuka tanpa internet.

Finance mengisi THR (pendapatan tambahan), kasbon, BPJS Ketenagakerjaan, BPJS Kesehatan, izin/sakit, dan catatan secara manual pada draft. Semua nilai awal Rp0. Simpan & Hitung Ulang menghitung jumlah pendapatan dan potongan dengan presisi sen di server. Gaji bersih = gaji pokok + uang makan + transport + THR − kasbon − BPJS TK − BPJS Kesehatan − izin/sakit. Nilai negatif/tidak valid dan potongan melebihi pendapatan ditolak. Pengajuan ke Admin mengunci seluruh komponen; revisi memerlukan penolakan Admin, pembukaan draft, dan pengajuan ulang. Admin melihat setiap potongan sebelum menyetujui. Transfer/pengeluaran mengikuti gaji bersih yang disetujui.

Profil menyimpan bpjs_tk/bpjs_kes sebagai nomor kepesertaan. Nomor tersebut tetap ditampilkan terpisah dari nominal potongan manual; tidak ada persentase BPJS atau potongan izin yang dihitung otomatis. Perhitungan ulang absensi mempertahankan komponen manual, dan riwayat menyimpan rincian tiap revisi. Migrasi menambahkan kolom dengan potongan Rp0 tanpa mengubah nominal gaji/transaksi/slip lama.

Snapshot menyimpan nominal yang disetujui, identitas, email, rekening dan nomor BPJS saat Finance menerbitkan slip. Perubahan profil berikutnya tidak mengganti slip lama. Perubahan profil/versi gaji antara pratinjau dan penerbitan mengharuskan pemeriksaan ulang. Nominal, status paid dan pengeluaran tidak berubah akibat penerbitan. Catatan transfer terbaru tetap tampil pada slip yang sudah terbit.

Slip baru hanya terlihat setelah Finance menerbitkannya, termasuk jika gaji sudah dibayar. Arsip slip sistem lama tetap tersedia. Riwayat employee berasal dari slip yang benar-benar terbit; bulan lain tidak ditandai telah dibayar. API/verifikasi server membatasi karyawan ke slip miliknya dan mengikat snapshot ke user_id saat diterbitkan. Dokumen cetak hanya dapat dibuka melalui sesi terautentikasi. API dan dokumen memiliki Cache-Control no-store dan dikecualikan dari cache PWA.

Email dikirim menggunakan PHPMailer 7.1.1 (distribusi minimal upstream, LGPL 2.1), melalui SMTP dengan TLS/SMTPS dan pemeriksaan sertifikat tetap aktif. Sumber: https://github.com/PHPMailer/PHPMailer/tree/v7.1.1. Pesan memuat slip lengkap dan lampiran HTML yang dapat dicetak. Cetak / Simpan PDF membuka dokumen untuk dicetak ke PDF melalui browser.

Konfigurasi pada server:

1. Salin backend/config/mail.example.php menjadi backend/config/mail.local.php pada instalasi development. Untuk deployment hasil build, simpan file sebagai config/mail.local.php pada server tujuan. File lokal ini diabaikan Git dan tidak disalin oleh build.
2. Isi host, port (587/tls atau 465/ssl), username, password email SMTP, from_email, dan from_name dari akun email kantor. Jika server membutuhkan CA bundle, isi ca_file dengan path bundle terpercaya. Kredensial tetap di server.
3. Alternatif file lokal: gunakan environment CREATIVA_SMTP_HOST, CREATIVA_SMTP_PORT, CREATIVA_SMTP_ENCRYPTION, CREATIVA_SMTP_USERNAME, CREATIVA_SMTP_PASSWORD, CREATIVA_SMTP_FROM_EMAIL, CREATIVA_SMTP_FROM_NAME, CREATIVA_SMTP_CA_FILE. Environment mengatasi nilai pada file lokal.
4. Aktifkan Apache/PHP environment yang sesuai, buka kembali pratinjau, lalu Kirim Email pada slip pending. Tidak ada email nyata yang dikirim oleh migrasi atau pengujian.

Hostinger Email untuk finance@creativabridging.com menggunakan smtp.hostinger.com, port 465, encryption ssl, username dan from_email finance@creativabridging.com. Isi password mailbox tersebut pada backend/config/mail.local.php atau CREATIVA_SMTP_PASSWORD. Pengiriman tetap nonaktif jika username sudah diisi tetapi password kosong. Pengaturan resmi: https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/ . Pada deployment dist, konfigurasi lokal harus dibuat tersendiri sebagai config/mail.local.php di server tujuan karena file lokal tidak ikut build. Setelah password diisi, klik Muat Ulang pada pratinjau slip, lalu Kirim Email. Konfigurasi dan pengujian tidak mengirim email nyata.

Status email:

- pending: slip terbit, email belum dikirim; termasuk saat SMTP belum diaktifkan.
- sending: upaya sedang berjalan. Jika proses terhenti pada status ini, administrator perlu memeriksa log provider email sebelum memulihkan status agar tidak menggandakan pesan.
- sent: server SMTP menerima pesan; ini bukan bukti pesan masuk inbox. Waktu pengiriman, penerima dan aktor dicatat.
- failed: upaya gagal; slip tetap di dashboard. Sebelum mencoba ulang, periksa apakah server sempat menerima pesan. Penerima tetap menggunakan email yang sudah diperiksa saat slip diterbitkan.

Indeks unik mencegah publikasi ganda. Klaim pengiriman atomik mencegah dua request mengirim email bersamaan. Pengulangan request publish tidak mencoba ulang email yang gagal; gunakan aksi retry_email secara eksplisit. Status sent/sending tidak dikirim ulang otomatis. Pengiriman email tidak berada di dalam transaksi publikasi sehingga kegagalan SMTP tidak membatalkan slip dashboard.

Instalasi ulang aman, tanpa menerbitkan slip atau mengirim email:

```powershell
php backend/migrations/salary_workflow.php
```

Pengujian:

```powershell
php backend/tests/salary_slip_test.php
php backend/tests/salary_deductions_test.php
php backend/tests/salary_mail_test.php
php backend/tests/salary_workflow_test.php
php backend/tests/salary_base_settings_test.php
php backend/tests/budget_workflow_test.php
```

Pengujian database memakai database sementara yang dibersihkan otomatis. Test HTTP/preview mematikan email eksternal; test SMTP memakai penerima lokal 127.0.0.1 dengan TLS dan autentikasi. Tidak ada akun/absensi/gaji nyata yang dimodifikasi.
