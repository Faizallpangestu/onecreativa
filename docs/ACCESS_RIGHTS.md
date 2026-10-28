# Hak akses login dan penghapusan akun LMS

Halaman Akses Siswa dan Akses Sensei hanya dapat dibuka oleh `admin`,
`super_admin`, dan `lpk`. Hak Akses Sistem dibatasi untuk `admin` dan
`super_admin`. Role dan status sesi diperiksa melalui server setiap perpindahan
halaman, saat jendela kembali aktif, dan setiap 60 detik.

Tombol hapus menggunakan `user_id`; `id` profil karyawan juga dikirim jika
tersedia agar backend dapat memeriksa kesesuaian kedua identitas. Akun tanpa
profil karyawan tetap dapat dihapus.

Akun tanpa riwayat dihapus dari `users`, `employees`, dan `peserta_intensif`.
Akun dengan riwayat diberi `users.deleted_at` dan `is_active=0`, lalu dikeluarkan
dari daftar hak akses. Absensi, nilai, kelas, tagihan, dan transaksi tetap
tersimpan. Akun yang diarsipkan tidak dapat diaktifkan kembali melalui form edit.
Pesan halaman menjelaskan hasil penghapusan yang sebenarnya.

## Penerapan

Sebelum memakai tombol hapus, jalankan migrasi CLI ini pada database tujuan:

```sh
php backend/migrations/lms_account_deletion.php
```

Migrasi hanya menambahkan kolom `users.deleted_at` jika belum tersedia; tidak
mengubah data akun yang sudah ada. Pada paket hasil build, backend disalin ke
root sehingga perintahnya menjadi:

```sh
php migrations/lms_account_deletion.php
```

Kemudian unggah hasil `npm run build` dengan konfigurasi database server yang
sudah berlaku. Build lokal tidak otomatis memperbarui situs produksi.

## Verifikasi

```sh
php backend/tests/employee_directory_test.php
node tools/access-rights-browser-check.cjs
```

Kedua pengujian memakai database sintetis sementara. Pengujian browser memeriksa
hak akses server, penghapusan dari UI, reload daftar, pencabutan sesi, pembuatan
akun, perubahan status login, dan logout. Runner browser menggunakan PHP lokal
di `C:/Muhammadfaizal/php/php.exe` serta Chrome.
