# SECURITY TEST — OneCreativa

Dokumen ini adalah **satu-satunya** catatan uji keamanan untuk repo ini. Berisi test case, hasil, lokasi file:baris, tingkat kefatalan, alasan, bukti, dan rencana perbaikan. **Audit awal dilakukan tanpa perbaikan; setelah ACC Revision 2, implementasi T-S01 dimulai dan dicatat terpisah.**

## A. Identitas & metode

| Field | Isi |
| --- | --- |
| Sistem | OneCreativa (HRIS/ERP + LPK/LMS + portal pendaftaran/invoice) |
| Commit diuji | `0cbcd74410aff9e5a14858b1456992ea35fa563c` |
| Tanggal | 2026-11-27 |
| Mode | Audit statis source-first, read-only |
| Profil | Standard, scope seluruh repo yang relevan: `backend/api`, `backend/services`, `backend/config`, `src`, `vite.config.js`, `copy-backend.js`, `public/.htaccess`, `automation/`, `docs/audit` |
| Metode | Reconnaissance → hunting paralel → verifikasi independen (mengikuti panduan skill `security-audit`) |
| Eksekusi dinamis | **TIDAK dijalankan** |
| Alasan tidak eksekusi | OS-enforced sandbox tidak tersedia (tidak ada pembatasan network, environment kosong, read-only mount, resource limit, dan descriptor promotion). Sesuai aturan skill, fakta perilaku yang hanya bisa dibuktikan dengan eksekusi ditandai `NEEDS VALIDATION`. Tidak ada probing ke endpoint live / produksi. |
| Perbaikan | Audit awal hanya mencatat; implementasi dimulai pada T-S01 setelah ACC Rev2. |
| Rencana perbaikan | Terkonsolidasi di bagian H; status Approved / ACC Granted |
| Kredensial | Nilai password/token/kunci **sengaja tidak ditulis ulang** di dokumen ini; hanya lokasi file:baris dan jenis rahasianya yang dicatat. |

### Status hasil

| Status | Arti |
| --- | --- |
| `FAIL (temuan)` | Source menunjukkan kontrol keamanan dilanggar / tidak ada |
| `PASS (kontrol)` | Source menunjukkan kontrol berfungsi; hipotesis kelemahan ditolak |
| `NEEDS VALIDATION` | Jejak source ada, tetapi dampak nyata bergantung pada fakta deployment yang tidak ada di repo |
| `NOT RUN` | Uji dinamis tidak dijalankan karena sandbox/staging tidak tersedia |

### Severity

`critical` > `high` > `medium` > `low` > `informational`. Hanya temuan `FAIL`/`source-confirmed` yang diberi severity; `NEEDS VALIDATION` tidak diberi severity final.

---

## B. Ringkasan eksekutif

| Kategori | Jumlah |
| --- | --- |
| Test case | 34 |
| `FAIL (temuan)` | 24 |
| `PASS (kontrol)` | 7 |
| `NEEDS VALIDATION` | 3 |
| Temuan critical | 4 |
| Temuan high | 9 |
| Temuan medium | 7 |
| Temuan low | 3 |
| Informasional | 1 |
| Rencana perbaikan | 9 requirement, 10 task (bagian H) |

Kesimpulan: **tidak aman untuk produksi**. Empat temuan `critical` berhubungan dengan akun privileged yang bisa diambil alih, secret bersama yang bocor lewat endpoint publik, skrip maintenance tanpa auth yang ikut ter-package, dan kredensial produksi yang tertanam di source/release artifact. Temuan ini saling berantai (mis. secret publik → aksi finance destruktif + SQL injection).

---

## C. Matriks test case & hasil

| ID | Skenario uji | Expected aman | Hasil observasi (source) | Status | Ref | Bukti | Akibat jika tidak diperbaiki |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-T-01 | Login dengan email `telu@creativabridging.com` / `admin.lms@*` dan password dari source | Tidak ada auto-provision; password known ditolak | `login.php` membuat/menimpa `users.password_hash`, `role_id`, `is_active=1` sebelum `password_verify` | `FAIL (temuan)` | SEC-01 | backend/api/login.php:31-84,95-101; backend/services/api_entry_policy.php:6 | Akun privileged dengan password yang ada di source bisa diambil alih; upaya admin menonaktifkan/mengganti password selalu ter-reset tiap login. |
| SEC-T-02 | Admin menonaktifkan/mengganti password akun di atas, lalu login lagi | Akun tetap nonaktif | `UPDATE ... is_active=1, password_hash=...` dijalankan tiap percobaan login | `FAIL (temuan)` | SEC-01 | backend/api/login.php:31-84,95-101; backend/services/api_entry_policy.php:6 | Akun privileged dengan password yang ada di source bisa diambil alih; upaya admin menonaktifkan/mengganti password selalu ter-reset tiap login. |
| SEC-T-03 | `GET /api/webhook_registration.php` tanpa kredensial | 401/403, tidak ada material rahasia | GET mengembalikan dokumentasi berisi literal `X-Webhook-Secret` dan `sample_payload.secret` | `FAIL (temuan)` | SEC-02 | backend/api/webhook_registration.php:18-68,47,50,90; backend/services/rpa_automation.php:22 | Shared secret terbaca publik, sehingga pendaftaran, invoice/receipt, payment link, sinkronisasi siswa, dan aksi finance bisa dipanggil siapa saja. |
| SEC-T-04 | Pakai secret dari SEC-T-03 untuk POST webhook pendaftaran | 401 | Secret sama dipakai sebagai gate POST; endpoint masuk daftar deferred | `FAIL (temuan)` | SEC-02, SEC-07 | backend/api/webhook_registration.php:18-68,47,50,90; backend/services/rpa_automation.php:22 | Shared secret terbaca publik, sehingga pendaftaran, invoice/receipt, payment link, sinkronisasi siswa, dan aksi finance bisa dipanggil siapa saja. |
| SEC-T-05 | `GET automation_status.php?action=test_smtp&to=<attacker>` | 401/403 | Cabang `test_smtp` tidak ada pengecekan secret; `$_GET['to']` jadi penerima email SMTP resmi | `FAIL (temuan)` | SEC-05 | backend/api/automation_status.php:26-49 | Email resmi finance@creativabridging.com bisa dikirim ke alamat arbitrer untuk phishing/spam dan merusak reputasi pengirim. |
| SEC-T-06 | `GET automation_status.php?action=reset_test_payment&...&invoice_id=' OR 1=1--` | 401 / query parameterized | `invoice_id` diinterpolasi langsung ke `DELETE`/`UPDATE` setelah gate secret | `FAIL (temuan)` | SEC-06 | backend/api/automation_status.php:60-65,85-101,137,156-161 | SQL injection menghapus/mengubah seluruh baris pembayaran/invoice; due_installments membocorkan nama, email, telepon, dan nominal pelanggan. |
| SEC-T-07 | `GET automation_status.php?action=due_installments&secret=...` | 401, tidak ada PII | Mengembalikan nama/email/telepon/nominal seluruh pelanggan | `FAIL (temuan)` | SEC-06 | backend/api/automation_status.php:60-65,85-101,137,156-161 | SQL injection menghapus/mengubah seluruh baris pembayaran/invoice; due_installments membocorkan nama, email, telepon, dan nominal pelanggan. |
| SEC-T-08 | POST multipart 100 MB ke `lms_upload.php` tanpa session/CSRF | 401/403 + kuota | Tidak ada `require database.php`, tidak ada guard; `mkdir(0777)` + `move_uploaded_file` | `FAIL (temuan)` | SEC-08 | backend/api/lms_upload.php:1-52; backend/uploads/lms_materials/.htaccess:1 | Upload 100 MB tanpa auth berulang menyebabkan disk exhaustion dan konten attacker berada di origin aplikasi; .htaccess memitigasi RCE tetapi harus divalidasi. |
| SEC-T-09 | Ulangi upload berkali-kali | Rate limit / kuota | Tidak ada pembatas jumlah request | `FAIL (temuan)` | SEC-08 | backend/api/lms_upload.php:1-52; backend/uploads/lms_materials/.htaccess:1 | Upload 100 MB tanpa auth berulang menyebabkan disk exhaustion dan konten attacker berada di origin aplikasi; .htaccess memitigasi RCE tetapi harus divalidasi. |
| SEC-T-10 | `GET lms_academic.php?action=students` tanpa session | 401 | Deferred `lms_*`, tanpa self-guard; mengembalikan NIK/email/telepon/total bayar semua siswa | `FAIL (temuan)` | SEC-09 | backend/api/lms_academic.php:1-8,470-538,540-632; backend/services/api_entry_policy.php:9 | NIK/email/telepon/total bayar seluruh siswa terbaca, akun sensei dibuat dengan password statis, dan nilai kaiwa bisa ditulis untuk user_id korban. |
| SEC-T-11 | `POST lms_academic.php?action=save_sensei` tanpa session | 403 | Membuat `users` role `sensei` dengan password statis known | `FAIL (temuan)` | SEC-09 | backend/api/lms_academic.php:1-8,470-538,540-632; backend/services/api_entry_policy.php:9 | NIK/email/telepon/total bayar seluruh siswa terbaca, akun sensei dibuat dengan password statis, dan nilai kaiwa bisa ditulis untuk user_id korban. |
| SEC-T-12 | `POST lms_academic.php?action=save_kaiwa_session` dengan `user_id` korban | Nilai terikat ke actor session | `user_id` diambil dari body, tanpa ownership check | `FAIL (temuan)` | SEC-09 | backend/api/lms_academic.php:1-8,470-538,540-632; backend/services/api_entry_policy.php:9 | NIK/email/telepon/total bayar seluruh siswa terbaca, akun sensei dibuat dengan password statis, dan nilai kaiwa bisa ditulis untuk user_id korban. |
| SEC-T-13 | `GET /backend/api/finance_audit_fix.php` tanpa session | 401 lewat `api_entry_policy` | File mendefinisikan `CREATIVA_TEST_ROUTER`, sehingga policy dilewati; bisa install schema/seed permission/periode | `FAIL (temuan)` | SEC-10 | backend/api/finance_audit_fix.php:17-18,31-33,69-78,124-146,294-315,370-394 | Schema, periode, permission, dan COA akuntansi bisa diubah tanpa login; info DB dan angka keuangan tampil dengan display_errors aktif. |
| SEC-T-14 | `GET /perbaiki_hostinger.php` tanpa kredensial | 401/404, tidak ada write | Skrip bypass policy, menulis ulang `db_env.php`/`rpa_settings.json`/`mail.local.php`, seed user dengan password tetap, dan ikut ter-copy ke `dist` | `FAIL (temuan)` | SEC-03 | perbaiki_hostinger.php:2,55-97,125,546-596; copy-backend.js:51-53 | Kredensial DB/SMTP/Midtrans/Fonnte, aturan .htaccess, dan akun pengguna diubah lewat HTTP tanpa login; skrip ikut ter-copy ke dist. |
| SEC-T-15 | `GET clean_reset_production.php?key=<kunci di dokblok>` | Ditolak; tidak ada TRUNCATE | Kunci statis dicetak di file sendiri; `TRUNCATE` ~30 tabel finance/audit | `FAIL (temuan)` + `NEEDS VALIDATION` | SEC-04 | clean_reset_production.php:5,11,14-42,47-91 | Sekitar 30 tabel finance/billing/payroll/audit bisa di-TRUNCATE lewat kunci statis yang dicetak sendiri oleh file itu. |
| SEC-T-16 | Forge `sig=hash_hmac(email\|time, secret hardcoded)` ke `sso_login.php` | Signature ditolak | Secret hardcoded; email+time attacker-controlled; session dibuat untuk email aktif mana pun | `FAIL (temuan)` | SEC-11 | backend/api/sso_login.php:11-12,16-23,26-36,54-57; backend/services/api_entry_policy.php:9-10,22-24 | Session untuk email aktif mana pun bisa dipalsukan, menjadi privilege escalation dari foothold; akses tanpa session masih bergantung deployment. |
| SEC-T-17 | Forge SSO di atas **tanpa** session sama sekali | 401 | `sso_login.php` tidak deferred → `ed_start()` butuh session; hanya eskalasi dari foothold | `NEEDS VALIDATION` | SEC-11 | backend/api/sso_login.php:11-12,16-23,26-36,54-57; backend/services/api_entry_policy.php:9-10,22-24 | Session untuk email aktif mana pun bisa dipalsukan, menjadi privilege escalation dari foothold; akses tanpa session masih bergantung deployment. |
| SEC-T-18 | Baca repo / `dist/config/db_env.php` / zip release | Tidak ada plaintext kredensial | `copy-backend.js` menulis password DB ke `dist`; `database.php`, `rpa_config.php`, `rpa_automation.php`, `perbaiki_hostinger.php` memuat kredensial hardcoded | `FAIL (temuan)` | SEC-12 | backend/config/database.php:39-41,50-54,67-69; copy-backend.js:59-62; backend/config/rpa_config.php:54-55 | Pembaca repo/ZIP release mendapat akses DB produksi, Midtrans, SMTP, Fonnte, dan signing SSO; nilai tidak ditulis ulang di dokumen ini. |
| SEC-T-19 | Simulasi gagal koneksi DB produksi | Tidak ada kredensial persist | `database.php` mencoba beberapa password fallback lalu `file_put_contents` kredensial yang berhasil ke `config/db_env.php` | `FAIL (temuan)` | SEC-13 | backend/config/database.php:31-42,45-80 | Saat koneksi DB gagal, kredensial plaintext ditulis ke config/db_env.php di dalam docroot. |
| SEC-T-20 | `fetch()` cross-origin ke endpoint secret-gated | CORS ditolak / token tidak terbaca | `ACAO: *` di `.htaccess` dan beberapa endpoint; tanpa `Allow-Credentials`, dampaknya terbatas | `FAIL (temuan)` | SEC-14 | backend/.htaccess:14; backend/api/automation_status.php:8; backend/api/webhook_registration.php:3; backend/api/lms_upload.php:2 | Origin mana pun bisa membaca/menggerakkan endpoint berbasis secret; memperparah temuan lain, bukan credentialed cross-origin read. |
| SEC-T-21 | Simpan nama aset GA berisi `<img onerror>` lalu admin buka Print QR | Teks di-escape, tidak ada script | `document.write` menyisipkan field aset tanpa HTML escaping; CSP tidak punya `script-src` | `FAIL (temuan)` | SEC-15 | src/pages/ga/DetailAset.jsx:83-111; src/pages/ga/FormAset.jsx:96-122; public/.htaccess:97 | Script tersimpan berjalan di DOM korban, dapat membaca CSRF token dan melakukan aksi atas nama korban di origin aplikasi. |
| SEC-T-22 | Worker PDF render `http://127.0.0.1:5678/...` dengan secret default | Port/path ditolak allowlist | `isAllowedTargetUrl` hanya cek scheme+hostname, abaikan port; Chromium jalan `--no-sandbox` | `FAIL (temuan)` | SEC-16 | automation/playwright-pdf-worker.mjs:6,23-27,31-46,83-86,175-181,199 | Halaman internal/loopback bisa dirender jadi PDF dan diekstrak; Chromium tanpa sandbox; /health membocorkan allowedOrigins. |
| SEC-T-23 | `GET :3100/health` tanpa secret | Tidak ada konfigurasi internal | Mengembalikan daftar endpoint + `allowedOrigins` | `FAIL (temuan)` | SEC-16 | automation/playwright-pdf-worker.mjs:6,23-27,31-46,83-86,175-181,199 | Halaman internal/loopback bisa dirender jadi PDF dan diekstrak; Chromium tanpa sandbox; /health membocorkan allowedOrigins. |
| SEC-T-24 | Upstream JSON berisi `fee_proof_url=http://169.254.169.254/...`; jalankan sync | Host/IP allowlist menolak | URL dipakai verbatim, `CURLOPT_SSL_VERIFYPEER=false`, body ditulis ke `uploads/payment_proofs` | `FAIL (temuan)` | SEC-17 | backend/api/sync_students_web.php:25-28,325-327,329-335,343-353,388-403 | SSRF ke metadata/internal dengan TLS mati, body attacker ditulis ke uploads, dan password portal siswa di-reset ke nilai statis. |
| SEC-T-25 | MITM upstream `jisho_proxy.php` dengan 302 ke internal | TLS gagal / redirect diblok | `SSL_VERIFYPEER=false` + `FOLLOWLOCATION=true`; host tetap fixed sehingga bukan SSRF langsung | `FAIL (temuan)` | SEC-18 | backend/api/jisho_proxy.php:8,13,16; backend/api/takoboto_proxy.php:6,11,14; backend/api/cors.php:6 | MITM/redirect injection pada proxy tanpa auth; respons direlay di origin aplikasi. Host tetap fixed sehingga bukan SSRF penuh. |
| SEC-T-26 | Workflow n8n baca `$env.WABLAS_TOKEN` | `N8N_BLOCK_ENV_ACCESS_IN_NODE` aktif | Compose men-set `false`; encryption key default known; `N8N_SECURE_COOKIE=false` | `FAIL (temuan)` + `NEEDS VALIDATION` | SEC-19 | automation/docker-compose.yml:1,12-14,31-35; automation/README.md:50 | Workflow n8n dapat membaca env rahasia, encryption key default diketahui, cookie tidak Secure, dan UI n8n terekspos. |
| SEC-T-27 | Jalankan `setup-vps.sh` | Installer terverifikasi; `.env` bukan kode | `curl ... \| sh` + `source .env` sebagai root | `FAIL (temuan)` | SEC-20 | automation/setup-vps.sh:15,23-26 | Installer remote dan isi .env dieksekusi sebagai shell root saat bootstrap VPS tanpa verifikasi artifact. |
| SEC-T-28 | User A logout, user B login di browser sama, buka halaman finance | Tidak ada sisa data A | `logout` tidak menghapus `finance_*`; purge hanya sekali per release tag | `FAIL (temuan)` | SEC-21 | src/App.jsx:9-44; src/utils/loginSession.js:1-7; src/utils/logoutUser.js:4-6 | Data finance pengguna sebelumnya masih tampil setelah logout pada browser bersama/kiosk. |
| SEC-T-29 | Login dengan `X-Forwarded-For: 1.2.3.4` | IP peer asli yang tercatat | Header forwarded dipercaya untuk `login_audit_log`/`accounting_audit_logs` | `FAIL (temuan)` | SEC-22 | backend/api/login.php:27,107,127,149,156 | Audit trail IP bisa dipalsukan lewat forwarded header, sehingga atribusi/forensik tidak valid. |
| SEC-T-30 | Set `localStorage.user.role_name=super_admin`, lalu approve leave | 403 | Role diambil dari DB `session_actor()`; `$_GET['role']` ditimpa policy; test `employee_directory_test.php` menegaskan 403 | `PASS (kontrol)` | V-01 | src/components/ProtectedRoute.jsx:22-25; backend/config/session.php:12-25; backend/services/api_entry_policy.php:15 | Tidak ada — kontrol berfungsi; hipotesis role-spoof dari localStorage ditolak. |
| SEC-T-31 | `GET /api/test_finance.php` / `debug*.php` tanpa auth | 404 | `api_entry_policy.php:7` mem-blok pola `test\|debug\|check\|fix_\|...` | `PASS (kontrol)` | V-02 | backend/services/api_entry_policy.php:7 | Tidak ada — endpoint test/debug/check/fix_ diblok 404. |
| SEC-T-32 | Upload lewat `rs_upload` / akses `rs_document` | MIME + ukuran + basename + symlink dicek | `relationships.php:132-150` memiliki kontrol tersebut | `PASS (kontrol)` | V-03 | backend/services/relationships.php:132-150 | Tidak ada — MIME, ukuran, basename, dan symlink sudah dicek. |
| SEC-T-33 | `finance.php?view=photo` dengan `photo_path` arbitrer | Path traversal ditolak | `realpath` + tolak `..`; tidak ada jalur write untrusted ke `photo_path` | `PASS (kontrol)` | V-04 | backend/api/finance.php:410-438 | Tidak ada — realpath dan tolak .. aktif; tidak ada jalur write untrusted. |
| SEC-T-34 | Cek konsumen `jwt.php` / injeksi `rpa-auto-watcher.ps1` | Tidak ada boundary yang bisa dicapai | `jwt.php` tidak punya consumer dan excluded dari release; watcher hanya interpolasi konstanta | `PASS (kontrol)` | V-05, V-07 | backend/api/jwt.php:5; copy-backend.js:13 | Tidak ada — jwt.php tidak punya consumer dan excluded dari release. |

Kolom **Bukti** merujuk ke `file:baris`/artefak; kolom **Akibat jika tidak diperbaiki** merangkum dampak nyata bila temuan dibiarkan. Untuk baris `PASS`, akibatnya ditulis "tidak ada" karena kontrol sudah berfungsi.

Semua test case bersifat **source-only**. Uji dinamis (HTTP live, upload nyata, SMTP, SSRF, browser XSS) tidak dijalankan → baris `NOT RUN` tidak diklaim sebagai bukti perilaku runtime.

---

## D. Temuan detail

### D.0 Bukti & dampak per temuan

| ID | Severity | Bukti (file:baris / artefak) | Akibat jika tidak diperbaiki | Status |
| --- | --- | --- | --- | --- |
| SEC-01 | critical | backend/api/login.php:31-84,95-101; backend/services/api_entry_policy.php:6 | Akun privileged dengan password yang ada di source bisa diambil alih; upaya admin menonaktifkan/mengganti password selalu ter-reset tiap login. | FAIL (source-confirmed) |
| SEC-02 | critical | backend/api/webhook_registration.php:18-68,47,50,90; backend/services/rpa_automation.php:22 | Shared secret terbaca publik, sehingga pendaftaran, invoice/receipt, payment link, sinkronisasi siswa, dan aksi finance bisa dipanggil siapa saja. | FAIL (override env needs validation) |
| SEC-03 | critical | perbaiki_hostinger.php:2,55-97,125,546-596; copy-backend.js:51-53 | Kredensial DB/SMTP/Midtrans/Fonnte, aturan .htaccess, dan akun pengguna diubah lewat HTTP tanpa login; skrip ikut ter-copy ke dist. | FAIL (URL needs validation) |
| SEC-04 | high | clean_reset_production.php:5,11,14-42,47-91 | Sekitar 30 tabel finance/billing/payroll/audit bisa di-TRUNCATE lewat kunci statis yang dicetak sendiri oleh file itu. | FAIL + NEEDS VALIDATION |
| SEC-05 | medium | backend/api/automation_status.php:26-49 | Email resmi finance@creativabridging.com bisa dikirim ke alamat arbitrer untuk phishing/spam dan merusak reputasi pengirim. | FAIL (delivery needs validation) |
| SEC-06 | high | backend/api/automation_status.php:60-65,85-101,137,156-161 | SQL injection menghapus/mengubah seluruh baris pembayaran/invoice; due_installments membocorkan nama, email, telepon, dan nominal pelanggan. | FAIL (source-confirmed) |
| SEC-07 | high | backend/services/rpa_automation.php:16-23; backend/config/rpa_config.php:81-83; automation/.env.example:7-8; automation/docker-compose.yml:12-13,35 | Satu secret statis dipakai lintas backend+automation dan masuk query string/log, sehingga public_token/session ERP bisa dilewati. | FAIL (override needs validation) |
| SEC-08 | high | backend/api/lms_upload.php:1-52; backend/uploads/lms_materials/.htaccess:1 | Upload 100 MB tanpa auth berulang menyebabkan disk exhaustion dan konten attacker berada di origin aplikasi; .htaccess memitigasi RCE tetapi harus divalidasi. | FAIL (static serving needs validation) |
| SEC-09 | high | backend/api/lms_academic.php:1-8,470-538,540-632; backend/services/api_entry_policy.php:9 | NIK/email/telepon/total bayar seluruh siswa terbaca, akun sensei dibuat dengan password statis, dan nilai kaiwa bisa ditulis untuk user_id korban. | FAIL (source-confirmed) |
| SEC-10 | high | backend/api/finance_audit_fix.php:17-18,31-33,69-78,124-146,294-315,370-394 | Schema, periode, permission, dan COA akuntansi bisa diubah tanpa login; info DB dan angka keuangan tampil dengan display_errors aktif. | FAIL (URL needs validation) |
| SEC-11 | high | backend/api/sso_login.php:11-12,16-23,26-36,54-57; backend/services/api_entry_policy.php:9-10,22-24 | Session untuk email aktif mana pun bisa dipalsukan, menjadi privilege escalation dari foothold; akses tanpa session masih bergantung deployment. | FAIL (unauth reach needs validation) |
| SEC-12 | critical | backend/config/database.php:39-41,50-54,67-69; copy-backend.js:59-62; backend/config/rpa_config.php:54-55 | Pembaca repo/ZIP release mendapat akses DB produksi, Midtrans, SMTP, Fonnte, dan signing SSO; nilai tidak ditulis ulang di dokumen ini. | FAIL (liveness needs validation) |
| SEC-13 | medium | backend/config/database.php:31-42,45-80 | Saat koneksi DB gagal, kredensial plaintext ditulis ke config/db_env.php di dalam docroot. | FAIL (.htaccess needs validation) |
| SEC-14 | low | backend/.htaccess:14; backend/api/automation_status.php:8; backend/api/webhook_registration.php:3; backend/api/lms_upload.php:2 | Origin mana pun bisa membaca/menggerakkan endpoint berbasis secret; memperparah temuan lain, bukan credentialed cross-origin read. | FAIL (source-confirmed) |
| SEC-15 | medium | src/pages/ga/DetailAset.jsx:83-111; src/pages/ga/FormAset.jsx:96-122; public/.htaccess:97 | Script tersimpan berjalan di DOM korban, dapat membaca CSRF token dan melakukan aksi atas nama korban di origin aplikasi. | FAIL (CSP scope needs validation) |
| SEC-16 | high | automation/playwright-pdf-worker.mjs:6,23-27,31-46,83-86,175-181,199 | Halaman internal/loopback bisa dirender jadi PDF dan diekstrak; Chromium tanpa sandbox; /health membocorkan allowedOrigins. | FAIL (internal reach needs validation) |
| SEC-17 | medium | backend/api/sync_students_web.php:25-28,325-327,329-335,343-353,388-403 | SSRF ke metadata/internal dengan TLS mati, body attacker ditulis ke uploads, dan password portal siswa di-reset ke nilai statis. | FAIL (upstream needs validation) |
| SEC-18 | low | backend/api/jisho_proxy.php:8,13,16; backend/api/takoboto_proxy.php:6,11,14; backend/api/cors.php:6 | MITM/redirect injection pada proxy tanpa auth; respons direlay di origin aplikasi. Host tetap fixed sehingga bukan SSRF penuh. | FAIL (network needs validation) |
| SEC-19 | high | automation/docker-compose.yml:1,12-14,31-35; automation/README.md:50 | Workflow n8n dapat membaca env rahasia, encryption key default diketahui, cookie tidak Secure, dan UI n8n terekspos. | FAIL + NEEDS VALIDATION (compose typo) |
| SEC-20 | medium | automation/setup-vps.sh:15,23-26 | Installer remote dan isi .env dieksekusi sebagai shell root saat bootstrap VPS tanpa verifikasi artifact. | FAIL (network trust needs validation) |
| SEC-21 | low | src/App.jsx:9-44; src/utils/loginSession.js:1-7; src/utils/logoutUser.js:4-6 | Data finance pengguna sebelumnya masih tampil setelah logout pada browser bersama/kiosk. | FAIL (source-confirmed) |
| SEC-22 | low | backend/api/login.php:27,107,127,149,156 | Audit trail IP bisa dipalsukan lewat forwarded header, sehingga atribusi/forensik tidak valid. | FAIL (source-confirmed) |
| SEC-23 | medium | backend/services/rpa_automation.php:651,673,710-713,876,931,942 | Akun portal siswa berpotensi diakses dengan password statis atau nomor WA; provisioning eksternal harus divalidasi owner. | NEEDS VALIDATION (portal eksternal) |
| SEC-24 | informational | automation/check_participant_remote.php:2; backend/api/sync_students_web.php:67 | Secret makin luas tersebar lewat access log dan Referer, memperbesar dampak SEC-02/SEC-07. | FAIL (source-confirmed) |


### SEC-01 — Auto-seed akun privileged dengan password hardcoded — `critical`

- **File:baris**: `backend/api/login.php:31-50`, `:63-84`, `:95-101`; `backend/services/api_entry_policy.php:6`
- **Principal**: klien tanpa autentikasi ke `/api/login.php`
- **Boundary**: internet → sesi aplikasi ber-role `mitra_telu` / `admin_lms`
- **Hasil**: Sebelum `password_verify`, login membuat atau **menimpa** `password_hash`, `role_id`, dan `is_active=1` untuk `telu@creativabridging.com` dan `admin.lms@*`. Password bersifat konstan di source. Akun yang dinonaktifkan/dirotasi admin aktif kembali pada percobaan login berikutnya.
- **Alasan fatal**: `login.php` sengaja dikecualikan dari entry policy; cabang seed berjalan pada identifier yang dipilih penyerang; `admin_lms` termasuk role default yang diizinkan policy.
- **Status**: `FAIL (temuan)` — source-confirmed.

### SEC-02 — Endpoint publik membocorkan shared webhook secret — `critical`

- **File:baris**: `backend/api/webhook_registration.php:18-68` (literal di `:47`, `:50`, `:90`); `backend/services/rpa_automation.php:22`; `backend/config/rpa_config.php:81-84`; `backend/services/api_entry_policy.php:8`
- **Principal**: klien tanpa autentikasi
- **Boundary**: internet → bearer capability untuk webhook pendaftaran, dokumen invoice/receipt, payment link, dan aksi finance otomatis
- **Hasil**: GET mengembalikan `usage.headers['X-Webhook-Secret']` dan `sample_payload.secret` berisi nilai literal yang sama dengan fallback `rpa_get_secret()`. `authorized` di `:37` hanya informasi, bukan gate.
- **Alasan fatal**: endpoint masuk daftar deferred (tidak ada session guard); rahasia dicetak ke response, bukan diredact; secret yang sama dipakai lintas endpoint.
- **Status**: `FAIL (temuan)` — source-confirmed. Efektif jika deployment tidak meng-override secret; override termasuk `NEEDS VALIDATION`.

### SEC-03 — Skrip maintenance tanpa auth ikut ter-package ke release — `critical`

- **File:baris**: `perbaiki_hostinger.php:2` (`CREATIVA_TEST_ROUTER`), `:55-97`, `:125`, `:546-596` (khususnya `:552`, `:589-596`); `copy-backend.js:51-53`; `backend/config/database.php:85-88`
- **Principal**: klien HTTP tanpa kredensial yang dapat mengakses root dokumen release
- **Boundary**: internet → konfigurasi produksi, filesystem, dan akun pengguna
- **Hasil**: Skrip melewati `api_entry_policy()`, menulis ulang `config/db_env.php`, `rpa_settings.json`, `mail.local.php` dengan nilai yang diketahui dari source, men-seed/reset user dengan password tetap, serta menghapus/mengubah aturan `.htaccess`. Build menyalinnya ke `dist`.
- **Alasan fatal**: tidak ada session, CSRF, atau kunci; konstanta bypass didefinisikan sebelum `database.php` dimuat; skrip berada di artifact deploy.
- **Status**: `FAIL (temuan)` — source-confirmed; URL publik pasti bergantung penempatan docroot → `NEEDS VALIDATION`.

### SEC-04 — Reset produksi destruktif dengan kunci statis yang dicetak sendiri — `high`

- **File:baris**: `clean_reset_production.php:5`, `:11`, `:14-42` (kunci muncul lagi di `:35-36`), `:47-79`, `:84-91`
- **Principal**: klien tanpa autentikasi
- **Boundary**: internet → datastore finance/billing/payroll/audit
- **Hasil**: Kunci statis (nilai tidak ditulis ulang di laporan ini) tertulis di docblock dan di halaman 403; jika diterima, skrip melakukan `TRUNCATE` pada ~30 tabel termasuk `accounting_audit_logs` dan membuka kembali periode akuntansi.
- **Alasan**: tidak ada session/CSRF; kontrolnya hanya string statis yang dibocorkan file itu sendiri.
- **Status**: `FAIL (temuan)` + `NEEDS VALIDATION` — verifier menurunkan dari `critical` karena file tidak mendefinisikan `CREATIVA_TEST_ROUTER` (masuk `ed_start`) dan path `config/database.php` di repo root tidak resolv; dampak penuh bergantung deployment.

### SEC-05 — Relay SMTP tanpa autentikasi — `medium`

- **File:baris**: `backend/api/automation_status.php:26-49` (`:30-31`, `:32-41`)
- **Principal**: klien tanpa autentikasi / origin web mana pun
- **Boundary**: internet → identitas pengirim email resmi `finance@creativabridging.com`
- **Hasil**: `action=test_smtp` memanggil `rpa_send_smtp_email()` dengan `$_GET['to']` sebagai penerima, tanpa pengecekan secret. Endpoint deferred + `ACAO:*`.
- **Alasan**: cabang ini diproses sebelum gate secret; pengiriman nyata bergantung konfigurasi SMTP.
- **Status**: `FAIL (temuan)` — source-confirmed; deliverability `NEEDS VALIDATION`.

### SEC-06 — SQL injection pada aksi finance destruktif yang digate secret publik — `high`

- **File:baris**: `backend/api/automation_status.php:60-65` (`:63`, `:65`), `:85-101` (`:87`, `:101`), `:137`, `:156-161` (`:159-161`); gate `:52-58`, `:77-83`, `:148-154`
- **Principal**: klien tanpa autentikasi yang memakai secret dari SEC-02
- **Boundary**: query HTTP → MySQL finance
- **Hasil**: `$targetInv` / `$delInvId` diinterpolasi langsung ke `DELETE FROM billing_pembayaran`, `UPDATE billing_invoices`, dan `DELETE FROM billing_invoices`. Payload `' OR 1=1--` memperluas efek ke seluruh baris. `due_installments` juga mengembalikan PII pelanggan.
- **Alasan**: gate memakai `hash_equals` tetapi secretnya sudah bocor; query tidak prepared; aksi berupa GET.
- **Status**: `FAIL (temuan)` — source-confirmed; chained dengan SEC-02.

### SEC-07 — Satu shared secret dipakai lintas backend + automation dan diterima lewat query string — `high`

- **File:baris**: `backend/services/rpa_automation.php:16-23`; `backend/config/rpa_config.php:81-83`; `backend/config/rpa.local.example.php:9`; `automation/.env.example:7-8`; `automation/docker-compose.yml:12-13,35`; `automation/playwright-pdf-worker.mjs:6`; `automation/check_participant_remote.php:2`; `backend/api/sync_students_web.php:25-28,67`; `backend/api/invoice_document.php:20,29`; `backend/api/receipt_document.php:17,22`; `backend/api/midtrans_payment.php:79,94-96`; `backend/api/automation_status.php:53,78,149,171,467`; `backend/api/webhook_registration.php:71,85-93`
- **Principal**: pembaca repo / klien tanpa autentikasi
- **Boundary**: kredensial statis → dokumen invoice/receipt, payment link, sinkronisasi siswa, aksi finance, PDF worker
- **Hasil**: `?api_key=` / `?secret=` melewati `public_token` dan session ERP; secret muncul di URL → log/Referer.
- **Alasan**: fallback literal sama di banyak komponen; tidak ada rotasi/pemisahan per-komponen.
- **Status**: `FAIL (temuan)` — source-confirmed; override env `NEEDS VALIDATION`.

### SEC-08 — Upload file tanpa autentikasi — `high`

- **File:baris**: `backend/api/lms_upload.php:1-52` (`:2`, `:18-22`, `:25-27`, `:34`, `:42`, `:48-52`, `:54`); `backend/services/api_entry_policy.php:7-9`; `backend/uploads/lms_materials/.htaccess:1`
- **Principal**: klien tanpa autentikasi / origin web mana pun
- **Boundary**: internet → filesystem direktori web
- **Hasil**: POST multipart hingga 100 MB diterima tanpa session/CSRF/kuota; `mkdir(0777)`; nama file acak terbatas; URL `/backend/uploads/lms_materials/...` dikembalikan. Ekstensi whitelist menolak `php`, dan `.htaccess` `Require all denied` memitigasi RCE/serving langsung.
- **Alasan**: file tidak memuat `config/database.php`, sehingga `api_entry_policy()` tidak pernah jalan; `lms_*` juga deferred.
- **Status**: `FAIL (temuan)` — source-confirmed; enforcement `.htaccess` dan docroot `NEEDS VALIDATION`.

### SEC-09 — LMS academic API tanpa guard: CRUD, PII, pembuatan akun — `high`

- **File:baris**: `backend/api/lms_academic.php:1-8`, `:21-26`, `:135-171` (`:142`), `:208-262`, `:264-273`, `:275-421`, `:470-538` (`:504`, `:509`, `:511-513`), `:540-632` (`:544`, `:612`, `:623-624`), `:654-682`; `backend/services/api_entry_policy.php:9`
- **Principal**: klien tanpa autentikasi
- **Boundary**: internet → data akademik, PII siswa, dan tabel `users`
- **Hasil**: GET/POST tanpa session dapat membaca NIK/email/telepon/total bayar seluruh siswa, membuat/menghapus program/enrollment/sensei, menulis nilai kaiwa untuk `user_id` arbitrer, dan membuat akun `sensei` dengan password statis.
- **Alasan**: semua endpoint `lms_*` di-defer dari policy; file tidak menambahkan `ed_start`/`rs_start`/CSRF/ownership.
- **Status**: `FAIL (temuan)` — verifier menurunkan dari `critical` ke `high` karena bukan takeover akun arbitrary, tetapi remains unauthenticated PII + account creation.

### SEC-10 — `finance_audit_fix.php` melewati entry policy — `high`

- **File:baris**: `backend/api/finance_audit_fix.php:17-18`, `:31-33`, `:69-78`, `:124-146`, `:294-315`, `:370-394`, `:9`, `:12-14`; `backend/config/database.php:85-88`; `copy-backend.js:13`
- **Principal**: klien tanpa autentikasi
- **Boundary**: internet → skema/periode/permission akuntansi + disclosures
- **Hasil**: `CREATIVA_TEST_ROUTER` membuat bootstrap melewati `api_entry_policy()`. File bisa install schema, membuka periode, seed `finance_role_permissions`, menambah COA, menampilkan info DB dan angka keuangan, serta `display_errors=1`. Nama file tidak cocok pola excluded di `copy-backend.js`, sehingga ikut release.
- **Alasan**: konstanta bypass + komentar "hapus file ini" yang tidak diikuti proses build.
- **Status**: `FAIL (temuan)` — source-confirmed; URL deploy `NEEDS VALIDATION`.

### SEC-11 — SSO HMAC secret hardcoded → session forgery — `high`

- **File:baris**: `backend/api/sso_login.php:11-12`, `:16-23`, `:26-36`, `:54-57`; `backend/services/api_entry_policy.php:9-10,22-24`
- **Principal**: pengguna dengan foothold session ber-role rendah (mudah didapat via SEC-01)
- **Boundary**: assertion lintas sistem → sesi email aktif mana pun
- **Hasil**: `sig = HMAC(email|time, secret hardcoded)` divalidasi dengan window 10 menit; email dan time attacker-controlled; session dibuat untuk target.
- **Alasan**: secret statis di source; tidak ada nonce/replay protection selain skew waktu.
- **Status**: `FAIL (temuan)` — verifier menurunkan dari `critical` ke `high` karena `sso_login.php` tidak deferred → `ed_start()` butuh session untuk akses tanpa autentikasi. Fakta itu `NEEDS VALIDATION` bila deployment memasang jalur khusus.

### SEC-12 — Kredensial produksi tertanam di source dan release artifact — `critical`

- **File:baris**: `backend/config/database.php:39-41`, `:50-54`, `:67-69`; `copy-backend.js:59-62`, `:65-73`; `backend/config/rpa_config.php:54-55`, `:59`; `backend/services/rpa_automation.php:22`, `:554`; `perbaiki_hostinger.php:58-61`, `:64`, `:76`, `:86-88`, `:95`; `backend/api/sso_login.php:11`; `backend/api/jwt.php:5`
- **Principal**: pihak dengan akses baca repo / ZIP release / file manager hosting
- **Boundary**: artifact → DB produksi, Midtrans, SMTP, Fonnte/Wablas, SSO signing
- **Hasil**: password DB, Midtrans server/client key dengan `is_production=true`, SMTP password, token Fonnte, shared secret, dan HMAC secret berupa literal plaintext. Build aktif menulis password DB ke `dist/config/db_env.php` dan menyertakan `perbaiki_hostinger.php`.
- **Alasan**: tidak ada pemisahan secret dari source; build justru menyalin nilainya ke artifact.
- **Status**: `FAIL (temuan)` — source-confirmed untuk keberadaan; **apakah kredensial masih live/valid = `NEEDS VALIDATION`**. Nilai tidak ditulis ulang di dokumen ini.

### SEC-13 — Koneksi DB gagal menulis plaintext password ke config — `medium`

- **File:baris**: `backend/config/database.php:31-42`, `:45-80` (khususnya `:50-55`, `:57-69`)
- **Principal**: request tanpa autentikasi yang bertepatan dengan gangguan koneksi DB
- **Boundary**: kondisi runtime → file konfigurasi di dalam docroot
- **Hasil**: kode mencoba beberapa password fallback lalu `file_put_contents` kredensial yang berhasil ke `backend/config/db_env.php`.
- **Alasan**: self-modifying config dengan fallback hardcoded; `config/.htaccess` memitigasi pembacaan langsung, tetapi bergantung enforcement server.
- **Status**: `FAIL (temuan)` — source-confirmed; enforcement `.htaccess` `NEEDS VALIDATION`.

### SEC-14 — Wildcard CORS pada backend — `low`

- **File:baris**: `backend/.htaccess:14-16`; `backend/api/automation_status.php:8`; `backend/api/webhook_registration.php:3`; `backend/api/lms_upload.php:2`; `copy-backend.js:18`; `backend/config/session.php:5-8`
- **Principal**: origin web berbahaya
- **Boundary**: origin attacker → endpoint berbasis secret/param
- **Hasil**: `ACAO:*` mengizinkan pembacaan response lintas origin untuk endpoint yang sudah publik/secret-gated. Tidak ada `Access-Control-Allow-Credentials`, sehingga endpoint berbasis cookie tidak dapat dibaca lintas origin.
- **Alasan**: verifier menurunkan ke `low` karena tidak ada credentialed cross-origin read; `backend/.htaccess` juga tidak ikut release.
- **Status**: `FAIL (temuan)` — source-confirmed.

### SEC-15 — Stored/DOM XSS pada cetak QR aset GA + CSP tanpa `script-src` — `medium`

- **File:baris**: `src/pages/ga/DetailAset.jsx:83-111` (`:95-100`, `:111`); `src/pages/ga/FormAset.jsx:96-122` (`:107-110`, `:122`); `backend/api/assets.php:206-220`; `public/.htaccess:97`
- **Principal**: editor aset GA; korban = pengguna lain yang membuka Print QR
- **Boundary**: teks tersimpan di DB → DOM korban di origin aplikasi
- **Hasil**: field aset disimpan hanya dengan SQL escaping, lalu disisipkan tanpa HTML escaping ke `win.document.write` bersama inline `<script>`. CSP hanya `object-src`/`base-uri`/`frame-ancestors`, tanpa `default-src`/`script-src`.
- **Alasan**: verifier menurunkan ke `medium` karena popup `about:blank` tidak selalu terkena header CSP tersebut, butuh klik korban, dan sebagian input bersifat self-XSS.
- **Status**: `FAIL (temuan)` — source-confirmed; siapa yang boleh menulis field aset = `NEEDS VALIDATION`.

### SEC-16 — Playwright PDF worker: SSRF karena port diabaikan + `--no-sandbox` + `/health` disclosure — `high`

- **File:baris**: `automation/playwright-pdf-worker.mjs:6`, `:23-27` (`:26`), `:31-46` (`:38`), `:82-86`, `:101-106`, `:124`, `:149-158`, `:172-182` (`:175-181`), `:199`
- **Principal**: klien yang mengetahui `WORKER_SECRET` default
- **Boundary**: HTTP worker → Chromium → loopback/internal compose network
- **Hasil**: `isAllowedTargetUrl` hanya membandingkan scheme+hostname, bukan port/path. `http://127.0.0.1:5678/...`, `http://localhost:3100/...`, dan port arbitrer pada host yang diizinkan lolos; `page.goto` merender dan mengembalikan PDF/base64. Chromium jalan dengan `--no-sandbox`. `/health` tanpa auth membocorkan `allowedOrigins`.
- **Alasan**: allowlist tidak lengkap; secret default statis; tidak ada egress restriction.
- **Status**: `FAIL (temuan)` — source-confirmed; layanan internal yang benar-benar reachable / override secret = `NEEDS VALIDATION`. `/health` sendiri `informational`.

### SEC-17 — `sync_students_web.php`: SSRF + TLS off + penulisan body ke uploads — `medium`

- **File:baris**: `backend/api/sync_students_web.php:25-28`, `:169`, `:282`, `:325-327`, `:329-335`, `:343-353` (`:347`, `:353`), `:388-403`
- **Principal**: klien dengan secret dari SEC-02, atau pihak yang dapat memengaruhi JSON upstream
- **Boundary**: data eksternal → HTTP client server + filesystem
- **Hasil**: `fee_proof_url` dipakai verbatim sebagai URL curl dengan `CURLOPT_SSL_VERIFYPEER=false`; body ditulis ke `backend/uploads/payment_proofs/` dengan nama acak + ekstensi whitelist. Ada juga PUT jarak jauh yang set password tetap untuk participant tanpa `password_hash`.
- **Alasan**: tidak ada host/IP/scheme allowlist; verifier menurunkan ke `medium` karena endpoint butuh secret/`api_session_guard('prepare')` dan bukan arbitrary write path.
- **Status**: `FAIL (temuan)` — source-confirmed; upstream controllability `NEEDS VALIDATION`.

### SEC-18 — Proxy jisho/takoboto mematikan verifikasi TLS dan mengikuti redirect — `low`

- **File:baris**: `backend/api/jisho_proxy.php:8`, `:13`, `:16`, `:30`; `backend/api/takoboto_proxy.php:6`, `:11`, `:14`, `:68-73`; `backend/api/cors.php:6`
- **Principal**: klien tanpa autentikasi / aktor posisi jaringan
- **Boundary**: proxy tanpa auth → upstream HTTPS + response di origin aplikasi
- **Hasil**: `SSL_VERIFYPEER=false` + `FOLLOWLOCATION=true` tanpa batasan `REDIR_PROTOCOLS`/host; body diteruskan. Host tujuan tetap fixed, sehingga verifier menolak klaim SSRF penuh.
- **Alasan**: residual MITM/redirect-injection, bukan kontrol yang sepenuhnya hilang.
- **Status**: `FAIL (temuan)` — source-confirmed untuk kode; dampak jaringan `NEEDS VALIDATION`.

### SEC-19 — n8n: akses `$env` diaktifkan, encryption key default, cookie tidak Secure — `high`

- **File:baris**: `automation/docker-compose.yml:1`, `:12-14`, `:31-35`; `automation/README.md:50`; `automation/.env.example:5-8`; `automation/Caddyfile:1-4`; `automation/setup-vps.sh:28-33`
- **Principal**: editor workflow n8n / pihak yang dapat menjangkau UI `:5678`
- **Boundary**: eksekusi workflow → environment host / credential store
- **Hasil**: `N8N_BLOCK_ENV_ACCESS_IN_NODE="false"` mengizinkan `{{$env.WABLAS_TOKEN}}` dll.; `N8N_ENCRYPTION_KEY` default known; `N8N_SECURE_COOKIE=false`; port n8n dan Caddy 80/443 diekspos.
- **Alasan**: kontrol isolasi sengaja dimatikan dan didokumentasikan sebagai kebutuhan.
- **Status**: `FAIL (temuan)` + `NEEDS VALIDATION` — `docker-compose.yml:1` memakai `rservices:` bukan `services:`, sehingga compose bisa tidak menerapkan blok ini; nilai juga bisa dioverride `.env`.

### SEC-20 — `setup-vps.sh` menjalankan installer remote sebagai root — `medium`

- **File:baris**: `automation/setup-vps.sh:15`, `:23-26`, `:30-33`
- **Principal**: aktor posisi jaringan / CDN yang dikompromi, atau `.env` yang dimodifikasi
- **Boundary**: konten remote / file `.env` → shell root VPS
- **Hasil**: `curl -fsSL https://get.docker.com | sh` tanpa checksum/signature; `set -a; source .env` mengeksekusi isi `.env` sebagai shell.
- **Alasan**: supply-chain bootstrap tanpa verifikasi artifact dan data diperlakukan sebagai kode.
- **Status**: `FAIL (temuan)` — source-confirmed; hasil aktual bergantung trust jaringan/TLS → `NEEDS VALIDATION`.

### SEC-21 — Cache finance di localStorage bertahan setelah logout — `low`

- **File:baris**: `src/App.jsx:9-44` (`:15-38`); `src/utils/loginSession.js:1-7`; `src/utils/logoutUser.js:4-6`; `src/services/realFinancialService.js:8-41`
- **Principal**: pengguna berikutnya pada profil browser yang sama (shared/kiosk)
- **Boundary**: cache satu pengguna → UI pengguna lain
- **Hasil**: purge hanya sekali per `one_creativa_release_tag` dan hanya menghapus daftar kunci tetap; `logout` tidak menghapus `finance_*`, `saved_custom_*`, `billing_pembayaran_custom`. Halaman finance membaca kunci tersebut.
- **Alasan**: verifier mencatat `finance.php:216-225` mencegah sinkronisasi cache ke DB, sehingga dampaknya UI-local.
- **Status**: `FAIL (temuan)` — source-confirmed.

### SEC-22 — Audit IP login dapat dipalsukan lewat forwarded header — `low`

- **File:baris**: `backend/api/login.php:27`, `:107`, `:127`, `:149`, `:156`
- **Principal**: klien tanpa autentikasi
- **Boundary**: header request → immutable audit trail
- **Hasil**: `CF-Connecting-IP` / `X-Forwarded-For` dipercaya tanpa validasi trusted-proxy; nilainya ditulis ke `login_audit_log` dan `accounting_audit_logs`.
- **Alasan**: merusak atribusi, bukan akses data langsung.
- **Status**: `FAIL (temuan)` — source-confirmed.

### SEC-23 — Password portal siswa statis dikirim lewat notifikasi — `medium`

- **File:baris**: `backend/services/rpa_automation.php:651`, `:673`, `:710-713`, `:876`, `:931`, `:942`
- **Principal**: penerima/interseptor pesan invoice/receipt, atau pihak yang mengetahui nomor WA siswa
- **Boundary**: pesan → akun dashboard siswa pada portal eksternal
- **Hasil**: kredensial bersifat konstan (atau nomor telepon) dan dikirim via SMTP/Fonnte.
- **Alasan**: credential reuse lintas principal.
- **Status**: `NEEDS VALIDATION` — provisioning akun `creativabridging.com` berada di luar repo ini.

### SEC-24 — Secret muncul di URL query outbound — `informational`

- **File:baris**: `automation/check_participant_remote.php:2`; `backend/api/sync_students_web.php:67`
- **Principal**: pembaca log proxy/server / pembaca source
- **Boundary**: secret → log/Referer
- **Hasil**: `api_key=<shared secret>` ditempatkan di URL outbound.
- **Alasan**: memperluas permukaan kebocoran secret yang sudah bocor di SEC-02.
- **Status**: `FAIL (temuan)` — source-confirmed, dampak minimal setelah SEC-02.

---

## E. Kontrol yang lolos / hipotesis ditolak

| ID | Hipotesis | Hasil | Bukti |
| --- | --- | --- | --- |
| V-01 | Role dari `localStorage` bisa escalation ke API | `PASS (kontrol)` — ditolak | `ProtectedRoute.jsx:22-25` revalidasi `/api/session.php`; `config/session.php:12-25` baca role dari DB; `api_entry_policy.php:15` menimpa `$_GET['role']`; `employee_directory_test.php:63` assert role spoof 403 |
| V-02 | `test_*`/`debug_*` endpoint bisa dump data tanpa auth | `PASS (kontrol)` | `api_entry_policy.php:7` mengembalikan 404 untuk pola tersebut |
| V-03 | `rs_upload`/`rs_document` tidak aman | `PASS (kontrol)` | `relationships.php:132-150`: `is_uploaded_file`, MIME whitelist, 10 MB, nama acak, `basename`, tolak backslash, cek symlink, `nosniff` |
| V-04 | `finance.php?view=photo` path traversal | `PASS (kontrol)` — tidak reachable | `finance.php:410-438` punya `realpath` + tolak `..`; tidak ada jalur write untrusted ke `photo_path` |
| V-05 | PWA menyimpan response API terautentikasi | `PASS (kontrol)` | `vite.config.js:40-44` `NetworkOnly` untuk `/api/`; `:45-59` hanya `/assets/` sameOrigin |
| V-06 | `jwt.php` secret hardcoded = temuan berdiri sendiri | Ditolak | `backend/api/jwt.php:5` tidak punya consumer in-repo dan excluded oleh `copy-backend.js:13`; tetap tercatat sebagai bagian SEC-12 |
| V-07 | `rpa-auto-watcher.ps1` command injection | Ditolak | `automation/rpa-auto-watcher.ps1:15,30` hanya interpolasi konstanta; `:37` `catch {}` adalah observability defect, bukan boundary violation |
| V-08 | `create_admin_now.php` / `create_dummy.php` = backdoor aktif | Ditolak / informasional | `backend/create_admin_now.php:18,23,26` menulis kolom `password` yang tidak dibaca `login.php:100-101`; keduanya excluded dari release oleh `copy-backend.js:14` dan tetap tergate `ed_start` |

---

## F. Fakta yang harus divalidasi pemilik sistem

Source saja tidak bisa memastikan hal berikut; temuan terkait tidak boleh diklaim sebagai dampak produksi penuh sebelum ini dicek:

1. Apakah kredensial DB, Midtrans, SMTP, Fonnte/Wablas, `CREATIVA_WEBHOOK_SECRET`, dan `WORKER_SECRET` masih live atau sudah dirotasi/di-override lewat env / `storage/rpa_settings.json` / `rpa.local.php` / `mail.local.php`.
2. Apakah `perbaiki_hostinger.php`, `clean_reset_production.php`, `finance_audit_fix.php`, `sso_login.php`, dan `lms_upload.php` benar-benar berada di docroot yang dapat diakses HTTP, serta apakah `config/database.php` resolv di lokasi tersebut.
3. Apakah Apache/LiteSpeed/Hostinger benar-benar menegakkan `backend/.htaccess`, `config/.htaccess`, `uploads/.htaccess`, dan `uploads/lms_materials/.htaccess` (runbook `docs/audit/PRODUCTION_RUNBOOK.md:72` sudah mengingatkan `.htaccess` sendiri bukan bukti enforcement).
4. Apakah `CREATIVA_PRIVATE_UPLOAD_DIR` di-set di luar web root; jika tidak, `public/.htaccess:16-19` meneruskan `/backend/` dan `/uploads/` langsung ke static handler.
5. Apakah port `3100` (worker), `5678` (n8n), dan Caddy `80/443` terlindungi firewall/ingress; apakah compose `rservices:` typo diperbaiki saat deploy.
6. Siapa yang dapat menyimpan field aset GA dan apakah CSP header tersebut benar-benar dikirim untuk halaman SPA yang dipakai korban (SEC-15).
7. Apakah portal `creativabridging.com` benar-benar memprovisi akun dengan password dari notifikasi (SEC-23).

Rencana validasi yang aman: lakukan di staging terpisah dengan akun dummy, tanpa kredensial produksi, tanpa probing endpoint live, dan tanpa mengubah data produksi. Tidak ada instruksi live-probe/exploit di dokumen ini.

---

## G. Kesimpulan

- Audit awal **hanya membaca source**; tidak ada perbaikan pada tahap audit, tidak ada eksekusi target, tidak ada network probing. Setelah ACC Rev2, perbaikan T-S01 dimulai.
- Ditemukan **4 critical**, **9 high**, **7 medium**, **3 low**, **1 informational** temuan source-confirmed/terkondisi, plus 3 kategori `NEEDS VALIDATION`.
- Rantai dampak terbesar: **SEC-02 (secret bocor) → SEC-06/SEC-07 (aksi finance + SQLi)** dan **SEC-01 (akun known-password) → SEC-11 (SSO forgery) → eskalasi**, diperparah **SEC-03/SEC-12 (kredensial & skrip maintenance ikut release)**.
- Status keamanan: **NO-GO** untuk produksi sampai temuan critical/high ditutup dan fakta deployment di bagian F divalidasi.
- Dokumen ini sengaja tidak memuat nilai kredensial; hanya lokasi dan jenisnya.

## H. Rencana perbaikan (konsolidasi, Approved / ACC Granted)

Bagian ini adalah **satu-satunya tempat** untuk seluruh rencana tindak lanjut audit keamanan. Isinya dipindahkan dari draft Revision 2 di `.agents/1-PRD-UTUH.md`; file PRD sekarang hanya menyimpan status persetujuan/ACC, bukan duplikat A/B/C.

| Field | Isi |
| --- | --- |
| Revision | 2 (disetujui) |
| Status | `Approved` |
| Implementation authorization | `Granted` |
| Approved revision | 2; Revision 1 tetap baseline QA |
| Approval date | 2026-11-27 |
| Approval quotation/reference | "commit dan push di branch security dan lanjutkan kr acc rev2" |
| Tanggal draft | 2026-11-27 |
| Sumber temuan | `docs/SECURITY_TEST.md` bagian A–G pada commit `7d2ebc7`, branch `security/audit-20261127` |
| Kedalaman | Full |
| Perubahan kode | T-S01 dimulai setelah ACC; bukti dicatat di `.agents/REVIEW.md`. |

Ini adalah perubahan material terhadap baseline QA yang sudah disetujui. Revision 1 dan amendment 1 tidak diubah. Pengguna memberi ACC pada 2026-11-27, sehingga T-S01 dapat dimulai. Rotasi kredensial live, penghapusan file terdeploy, deploy, dan live probing tetap membutuhkan ACC terpisah.

### H.1 Part A — Requirements

#### A1. Problem, pengguna, dan hasil yang diinginkan
Audit source-only menemukan bahwa aktor tanpa autentikasi atau ber-trust rendah dapat menjangkau jalur privileged, secret bersama tertanam di source dan artifact release, aksi finance destruktif digate oleh secret yang justru dipublikasikan, beberapa endpoint melewati `api_entry_policy`, dan sink outbound/frontend kurang containment. QA lead, owner backend/frontend, dan release owner butuh urutan perbaikan yang menutup boundary itu tanpa mengubah perilaku sah pengguna.

Hasil teramati: setiap SEC-01..SEC-24 ditutup oleh perubahan source + bukti regresi, atau diterima tertulis oleh pemilik sistem; artifact release tidak mengandung kredensial plaintext; request tanpa autentikasi ke endpoint yang sebelumnya terbuka mengembalikan 401/403; `docs/SECURITY_TEST.md` memiliki kolom retest dengan bukti baru.

#### A2. Scope, exclusions, constraints

In scope: perubahan source/config/build di repo ini untuk SEC-01..SEC-24, regression test berbasis harness lokal yang sudah ada, serta pembaruan `docs/SECURITY_TEST.md`, `docs/QA_FORM/RUNBOOK.md`, dan `.agents/REVIEW.md`.

Exclusions yang butuh ACC terpisah: rotasi kredensial live, tulis DB produksi, menghapus file dari host yang sudah terdeploy, deploy/push, probing endpoint live, konfigurasi provider/firewall/Apache/LiteSpeed di luar repo, dan operasi berbayar.

Constraints/asumsi:
- Nilai password/token/kunci tidak pernah ditulis ke rencana, log, screenshot, atau laporan; hanya nama env dan path private config.
- Rotasi live dan validasi deployment adalah aksi owner di luar repo; direncanakan sebagai task blocked/owner-dependent, bukan diam-diam dianggap selesai.
- Staging URL dan akun QA belum tersedia (BLK-003); retest dinamis tetap lokal/sintetis sampai itu ada.
- OS-enforced sandbox tidak tersedia, jadi eksekusi target-controlled hanya memakai harness lokal sintetis yang sudah ada.
- Tidak ada artefak QA yang disetujui ditimpa untuk scaffholding rencana ini.

#### A3. Requirements and acceptance

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| SEC-FR-01 | Hapus hardcoded secret dari source dan artifact | P0 | Tidak ada literal kredensial di source runtime; `copy-backend.js` tidak menulis `db_env.php` berisi kredensial; artifact check menolak kemunculannya; nama env/private config didokumentasikan tanpa nilai. |
| SEC-FR-02 | Autentikasi/otorisasi di setiap endpoint sensitif | P0 | `api_entry_policy.php` tidak punya carve-out deferred untuk state change; `CREATIVA_TEST_ROUTER` tidak mem-bypass policy; login tidak auto-seed/menimpa akun; SSO menolak signature palsu; regression test assert 401/403. |
| SEC-FR-03 | Skrip maintenance berbahaya keluar dari release | P0 | `perbaiki_hostinger.php`, `clean_reset_production.php`, `finance_audit_fix.php`, seeder, dan skrip root diagnostik tidak masuk `dist`; build memakai allowlist eksplisit; artifact check gagal bila ada. |
| SEC-FR-04 | Hilangkan SQLi pada aksi finance yang digate secret | P0 | Semua SQL dinamis di `automation_status.php` prepared; secret hanya dari header, bukan `?api_key`/`?secret`; `due_installments` butuh auth privileged; regression test menolak `' OR 1=1--`. |
| SEC-FR-05 | Guard upload, LMS academic, finance-audit | P0 | `lms_upload.php` butuh session/CSRF/MIME/kuota; `lms_academic.php` memakai `ed_start`/`rs_start` + ownership; `finance_audit_fix.php` tidak reachable tanpa auth; tidak ada PII/akun dibuat tanpa auth. |
| SEC-FR-06 | Contain outbound HTTP/SSRF/TLS/worker | P1 | `sync_students_web.php`, proxy, dan PDF worker punya allowlist scheme+host+port+path dengan TLS ON; Chromium sandbox aktif; `/health` tidak bocorkan config; compose/VPS tidak eksekusi konten remote/env tanpa verifikasi. |
| SEC-FR-07 | Hardening browser | P1 | Field aset GA di-HTML-escape sebelum `document.write`; CSP punya `default-src`/`script-src`; logout menghapus cache finance; CORS memakai origin allowlist, bukan `*`. |
| SEC-FR-08 | Audit attribution & credential delivery | P2 | IP audit tidak percaya forwarded header tanpa trusted-proxy; tidak ada secret di URL query; kredensial portal siswa per-user/random, bukan statis/nomor WA. |
| SEC-FR-09 | Regression evidence & deployment validation | P0 | Runner keamanan lokal + harness yang diperluas menghasilkan bukti JSON; `docs/SECURITY_TEST.md` punya kolom retest; `.agents/REVIEW.md` mencatat command, exit code, dan blocker owner. |

#### A4. Open decisions and risks
- Skrip root berbahaya: default rencana adalah **exclude dari build**; penghapusan dari repo butuh ACC terpisah karena destructive.
- Nama env yang diusulkan: `CREATIVA_WEBHOOK_SECRET`, `CREATIVA_DB_PASS`, `CREATIVA_MIDTRANS_SERVER_KEY`, `CREATIVA_SMTP_PASS`, `WORKER_SECRET`, `N8N_ENCRYPTION_KEY`, `ALLOWED_RENDER_ORIGINS`, `CREATIVA_PRIVATE_UPLOAD_DIR`. Tanpa nilai.
- Kredensial masih live/rotated, docroot, enforcement `.htaccess`, perilaku compose `rservices:`, dan exposure n8n tetap butuh validasi owner (bagian F).
- Rotasi tanpa koordinasi bisa memutus n8n, SMTP, Midtrans callback, dan notifikasi siswa; mitigasinya cutover bertahap dengan regression lokal dulu.

### H.2 Part B — Technical approach

#### B1. Context and architecture
Stack tidak berubah: Vite 8/React 19, PHP/MySQLi prosedural, `api_entry_policy.php` sebagai guard bootstrap, `database.php` sebagai loader koneksi/policy, `copy-backend.js` sebagai packager, `automation/` sebagai stack n8n/Playwright/Caddy terpisah. Perbaikan mempertahankan bentuk request/response sah dan memindahkan setiap keputusan trust ke titik server terakhir yang dipercaya.

#### B2. Interfaces, data, security
- Auth: `session_actor()` (`backend/config/session.php:12-25`) tetap sumber identitas; `ed_start()`/`rs_start()`/`api_session_guard()` tetap guard reusable. Yang dihapus adalah bypass, bukan diganti framework baru.
- Data: tidak perlu migrasi schema untuk perubahan kode. Finance/audit tetap lewat helper prepared `ac_query`/`ac_one`/`ac_rows`.
- Secrets: runtime membaca dari `backend/config/db_env.php`, `mail.local.php`, `rpa.local.php`, atau env; repo hanya menyimpan `*.example.php` dengan placeholder kosong.
- Build: `copy-backend.js` beralih dari eksklusi regex ke allowlist eksplisit file API/service yang boleh dikirim; `dist/config/db_env.php` tidak pernah di-generate dengan nilai.
- External dependencies (nama saja): `CREATIVA_WEBHOOK_SECRET`, `CREATIVA_DB_PASS`, `CREATIVA_MIDTRANS_SERVER_KEY`, `CREATIVA_SMTP_PASS`, `WORKER_SECRET`, `N8N_ENCRYPTION_KEY`, `ALLOWED_RENDER_ORIGINS`, `CREATIVA_PRIVATE_UPLOAD_DIR`.

#### B3. Decisions

| Decision | Pilihan | Alternatif / alasan | Risk / mitigasi |
| --- | --- | --- | --- |
| D-S01 | Secret di env/private config, nol literal di source runtime | Menyimpan literal dengan komentar "jangan commit" | Literal sudah bocor; config-only + rotasi adalah satu-satunya perbaikan permanen |
| D-S02 | Hapus deferred carve-out dan bypass `CREATIVA_TEST_ROUTER` | Tambal per-endpoint saja | Tambalan mudah drift; policy pusat + self-guard bisa diuji |
| D-S03 | Allowlist eksplisit release | Regex exclusion tambahan | Regex sudah kecolengan `finance_audit_fix.php`, `lms_upload.php`, `sso_login.php` |
| D-S04 | Prepared statements + secret header-only | Escape interpolasi | Escape rentan salah; prepared + header-only menghapus pasangan injeksi/kebocoran |
| D-S05 | Allowlist SSRF scheme+host+port+path + TLS ON | Hostname-only | Worker lama mengabaikan port; proxy mematikan TLS |
| D-S06 | TDD untuk perubahan perilaku; config/build lewat artifact check | Review manual saja | Regression test membuat tiap fix terverifikasi independen |
| D-S07 | Tidak ada rotasi/penghapusan/deploy di revisi ini | Pembersihan langsung | Itu aksi destructive/owner yang butuh ACC terpisah |

#### B4. Verification and recovery
Per-task: `npm run test:php`, `node tools/release-browser-check.cjs --http-only`, `node tools/security-regression-check.cjs`, `npm run lint`, `npm run build`, `node tools/check-build-artifact.cjs`, `node tools/release-artifact-check.cjs`, `git diff --check`, dan secret-pattern scan atas source + `dist`. Perubahan perilaku memakai RED-GREEN: tulis assertion gagal → lihat gagal pada source sekarang → perbaiki minimal → lihat hijau. Recovery: semua edit lokal source/config; tanpa tulis produksi; gate gagal tetap NO-GO dan hanya membatalkan perubahan lokal yang diuji.

### H.3 Part C — Tasks and progress

Status: T-S01 `In Progress` setelah ACC; task lainnya masih `Todo`.

| ID | Outcome | Requirement | Dependencies | Status |
| --- | --- | --- | --- | --- |
| T-S01 | Secret/config hygiene + build allowlist | SEC-FR-01, SEC-FR-03 | None | In Progress |
| T-S02 | Central auth policy, login, SSO | SEC-FR-02 | T-S01 | Todo |
| T-S03 | Retire skrip maintenance/seeder dari release | SEC-FR-03 | T-S01 | Todo |
| T-S04 | Finance automation: SQLi, secret header, PII gating | SEC-FR-04 | T-S02 | Todo |
| T-S05 | Guard upload, LMS academic, finance-audit | SEC-FR-05 | T-S02 | Todo |
| T-S06 | SSRF/TLS/worker/automation hardening | SEC-FR-06 | T-S01 | Todo |
| T-S07 | XSS/CSP/cache/CORS browser | SEC-FR-07 | None | Todo |
| T-S08 | Audit attribution & credential delivery | SEC-FR-08 | T-S01 | Todo |
| T-S09 | Regression suite + evidence refresh | SEC-FR-09 | T-S02..T-S08 | Todo |
| T-S10 | Owner deployment validation + retest | SEC-FR-09 | T-S09, staging/owner | Todo |

#### T-S01 — Secret/config hygiene + build allowlist
- Status: In Progress
- Files: `backend/config/database.php`, `backend/config/rpa_config.php`, `backend/services/rpa_automation.php`, `backend/api/sso_login.php`, `backend/api/jwt.php`, `copy-backend.js`, `backend/config/*.example.php`, `automation/.env.example`, `automation/docker-compose.yml`.
- Acceptance: runtime baca secret hanya dari env/private config; `copy-backend.js` tidak lagi emit `db_env.php` bernilai; example hanya placeholder; release allowlist eksplisit.
- Verification: assertion gagal di `tools/security-regression-check.cjs` untuk pola kredensial dan `config/db_env.php` di artifact; `npm run build` + `node tools/check-build-artifact.cjs` exit 0; `git diff --check` exit 0.
- Blocker: rotasi live tetap owner-only.

#### T-S02 — Central auth policy, login, SSO
- Files: `backend/services/api_entry_policy.php`, `backend/config/database.php`, `backend/api/login.php`, `backend/api/sso_login.php`, `backend/api/jwt.php`, `backend/services/employee_directory.php`.
- Acceptance: tidak ada bypass `CREATIVA_TEST_ROUTER`; deferred endpoint self-guard atau read-only; login tidak membuat/menimpa user sebelum `password_verify`; SSO secret dari env dan signature palsu ditolak.
- Verification: failing case di `backend/tests/security_regression_test.php` + `tools/release-http-check.cjs`; `npm run test:php` dan HTTP check merah sebelum fix, hijau sesudah.
- Blocker: reachability SSO tanpa session tetap owner-validated.

#### T-S03 — Retire skrip maintenance dari release
- Files: `perbaiki_hostinger.php`, `clean_reset_production.php`, `backend/api/finance_audit_fix.php`, `backend/create_admin_now.php`, `backend/create_dummy.php`, `perbaiki_role_karyawan.php`, `export_fintrack_juni_oktober.php`, `automation/check_participant_remote.php`, `copy-backend.js`.
- Acceptance: tidak ada file terlarang di `dist`; artifact check gagal bila ada konstanta bypass/kunci reset statis.
- Verification: extend `tools/release-artifact-check.cjs`; `npm run build` + artifact check exit 0, nol denied file.
- Blocker: menghapus dari repo butuh ACC terpisah; menghapus copy terdeploy butuh owner.

#### T-S04 — Finance automation
- Files: `backend/api/automation_status.php`, `backend/api/webhook_registration.php`, `backend/services/rpa_automation.php`.
- Acceptance: prepared statements; `test_smtp` butuh session privileged; secret hanya `X-Webhook-Secret`; `due_installments` PII butuh auth; GET docs tanpa secret.
- Verification: failing case `' OR 1=1--`, `?secret=` ditolak, `test_smtp` 401, secret absen di GET; `node tools/security-regression-check.cjs` + HTTP check merah→hijau.
- Blocker: deliverability SMTP tetap deployment-validated.

#### T-S05 — Upload/LMS/finance-audit guards
- Files: `backend/api/lms_upload.php`, `backend/api/lms_academic.php`, `backend/api/finance_audit_fix.php`, `backend/services/api_entry_policy.php`, `backend/services/relationships.php`.
- Acceptance: unauthenticated upload, PII siswa, pembuatan sensei, penulisan kaiwa, dan mutasi finance-audit → 401/403; upload session/CSRF/MIME/kuota; tidak ada `CREATIVA_TEST_ROUTER` suppress.
- Verification: failing unauthenticated assertion di HTTP check + PHP regression; merah→hijau.
- Blocker: enforcement `.htaccess` static upload tetap owner-validated.

#### T-S06 — SSRF/TLS/worker/automation
- Files: `backend/api/sync_students_web.php`, `backend/api/jisho_proxy.php`, `backend/api/takoboto_proxy.php`, `automation/playwright-pdf-worker.mjs`, `automation/docker-compose.yml`, `automation/setup-vps.sh`, `automation/.env.example`, `automation/Caddyfile`, `automation/README.md`.
- Acceptance: allowlist scheme+host+port+path; TLS ON; redirect dibatasi; Chromium sandbox aktif; `/health` redacted; `services:` bukan `rservices:`; n8n secure defaults; bootstrap verifikasi installer dan `.env` sebagai data.
- Verification: failing fixture di regression runner untuk `127.0.0.1:5678`, TLS-off, `rservices:`, `/health` disclosure; merah→hijau; tanpa live network.
- Blocker: reachable internal service/compose aktif tetap owner-validated.

#### T-S07 — Browser-side
- Files: `src/pages/ga/DetailAset.jsx`, `src/pages/ga/FormAset.jsx`, `public/.htaccess`, `backend/.htaccess`, `backend/api/automation_status.php`, `backend/api/webhook_registration.php`, `backend/api/lms_upload.php`, `src/utils/logoutUser.js`, `src/App.jsx`, `src/services/realFinancialService.js`.
- Acceptance: field aset di-escape; CSP `default-src`/`script-src`; logout bersihkan `finance_*`/`saved_custom_*`/`billing_pembayaran_custom`; CORS origin allowlist.
- Verification: failing source/DOM assertion; `npm run lint`, `npm run build`, regression runner merah→hijau.
- Blocker: CSP benar-benar terkirim ke SPA tetap owner-validated.

#### T-S08 — Audit & credential delivery
- Files: `backend/api/login.php`, `automation/check_participant_remote.php`, `backend/services/rpa_automation.php`, `backend/api/sync_students_web.php`.
- Acceptance: IP audit trusted-proxy/REMOTE_ADDR; tidak ada secret di query URL; kredensial portal siswa per-user/random atau one-time link.
- Verification: failing source-pattern/fixture assertion; regression runner merah→hijau.
- Blocker: provisioning portal eksternal di luar repo.

#### T-S09 — Regression suite + evidence
- Files: baru `tools/security-regression-check.cjs`, `backend/tests/security_regression_test.php`; diperluas `tools/release-http-check.cjs`, `tools/check-build-artifact.cjs`, `tools/release-artifact-check.cjs`, `package.json`, `docs/SECURITY_TEST.md`, `.agents/REVIEW.md`, `docs/QA_FORM/RUNBOOK.md`.
- Acceptance: satu command lokal menghasilkan bukti JSON untuk setiap SEC; dokumen ini punya kolom retest; REVIEW mencatat command/exit code/blocker owner.
- Verification: jalankan `node tools/security-regression-check.cjs`, `npm run test:php`, HTTP check, lint, build, artifact check, `git diff --check`; catat exit code. Tidak ada temuan ditutup tanpa bukti regresi.
- Blocker: bergantung T-S02..T-S08.

#### T-S10 — Owner deployment validation
- Files: `docs/SECURITY_TEST.md` bagian F, `.agents/REVIEW.md`, `docs/audit/PRODUCTION_RUNBOOK.md`.
- Acceptance: tiap `NEEDS VALIDATION` punya bukti owner-observed atau penerimaan tertulis; gate diperbarui hanya dari evidence.
- Verification: checklist staging dari owner untuk rotasi live, docroot/`.htaccess`, compose/n8n exposure, private upload dir, CSP delivery, portal eksternal; agent tidak melakukan live probing.
- Blocker: staging URL, akun QA, kredensial owner belum ada.

### H.4 Handoff & ACC

- Current task: T-S01 (In Progress).
- Next ready task: selesaikan T-S01, lalu T-S02/T-S03/T-S06/T-S07/T-S08 sesuai dependensi.
- Latest verification: ACC tercatat; RED regression runner akan dijalankan pada T-S01.
- Remaining blockers: rotasi kredensial live, staging/akun QA, fakta deployment bagian F.
- Catatan ACC: pengguna menyetujui pada 2026-11-27 melalui "commit dan push di branch security dan lanjutkan kr acc rev2"; status Revision 2 menjadi `Approved` dan T-S01 dimulai tanpa menimpa baseline Revision 1. Commit/push/deploy tetap perlu perintah terpisah.

---

## I. Catatan konsolidasi

- Dokumen ini sekarang memuat **hasil audit (A–G)** sekaligus **rencana perbaikannya (H)** dan **catatan konsolidasi (I)** dalam satu file.
- `.agents/1-PRD-UTUH.md` tetap menyimpan baseline Revision 1 dan status ACC Revision 2 (kini Approved), tetapi tidak lagi menduplikasi A/B/C.
- `docs/QA_FORM/` tetap berisi dokumen serah terima QA; dokumen ini khusus security test + rencana security.
- Tidak ada nilai kredensial yang ditulis ulang di bagian mana pun.
