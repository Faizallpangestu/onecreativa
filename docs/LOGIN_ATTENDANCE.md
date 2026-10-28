# Pemeriksaan login dan absensi

## Perubahan

- Token CSRF sekarang dipasang untuk request Axios dengan `baseURL: /api`, termasuk `/face_clock.php` dan `/face_enroll.php`.
- Absen wajah mengambil profil akun yang sedang login dari `/api/profile.php`. Karyawan tidak perlu mendapatkan akses ke daftar seluruh karyawan.
- Sesi server mengembalikan `employee_id` yang benar saat cache login browser kosong. ID akun `users.id` tidak dipakai sebagai pengganti ID karyawan.
- Halaman menunggu profil dan pengaturan lokasi berhasil dimuat. Kegagalannya ditampilkan dan dapat dicoba ulang.
- Status WFO/WFH diperbarui dari profil server. Ketentuan lokasi yang sudah berlaku tetap digunakan.
- Login mencari email terlebih dahulu, lalu NIK, sehingga email akun tidak bentrok dengan NIK akun lain. Spasi di email lama dan perbedaan huruf besar/kecil ditangani.
- Password lama yang benar tetap dapat dipakai, termasuk hash MD5 yang diperbarui setelah login berhasil. Batas minimal password baru tidak diterapkan pada proses login akun lama.
- Jika password benar tetapi akun nonaktif, pesan menjelaskan status akun. Password salah tetap mendapatkan pesan umum. Password dan status akun tidak diubah otomatis.

## Akun hosting pada gambar

Akun pada gambar tidak ditemukan di database lokal saat pemeriksaan. Perubahan kode lokal tidak membuktikan status atau kecocokan password akun di hosting.

Untuk pemeriksaan di phpMyAdmin **database hosting yang dipakai aplikasi**, ganti email contoh lalu jalankan query baca ini:

```sql
SELECT DATABASE() AS database_yang_diperiksa;

SELECT u.id AS user_id, u.email, u.is_active, r.name AS role_name,
       COUNT(e.id) AS jumlah_profil_karyawan,
       MIN(e.id) AS employee_id, MIN(e.employee_code) AS nik
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
LEFT JOIN employees e ON e.user_id = u.id
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM('email-akun@contoh.com'))
GROUP BY u.id, u.email, u.is_active, r.name;
```

Tidak ada baris berarti akun tidak ada di database tersebut atau email berbeda.
`is_active=0` berarti akses login nonaktif. `role_name=NULL` berarti role belum
terhubung. `jumlah_profil_karyawan=0` berarti akun belum punya profil untuk
absensi karyawan; nilai lebih dari satu perlu pemeriksaan relasi oleh admin.
Jika akun aktif dan relasinya benar, admin perlu memeriksa kredensial akun.
Jangan mengirim nilai kolom `password_hash` atau password saat melaporkan hasil.

## Penerapan dan pengujian

Unggah paket `dist` hasil build ke hosting dengan tetap memakai konfigurasi
database hosting yang benar. Perubahan kode lokal belum mengubah website hosting.
Perbaikan login/absen ini tidak memerlukan migrasi tabel baru; migrasi penghapusan
akun LMS pada pekerjaan sebelumnya tetap mengikuti `ACCESS_RIGHTS.md`.

```sh
node tools/session-headers-test.mjs
php backend/tests/employee_directory_test.php
npm run build
node tools/access-rights-browser-check.cjs --attendance --preview
```

Tes API dan browser menggunakan database sintetis sementara; absensi nyata tidak
ditambahkan dan akun pengguna tidak diubah.
