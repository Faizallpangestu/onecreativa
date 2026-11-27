# SECURITY TEST — OneCreativa

Dokumen ini adalah **satu-satunya** catatan uji keamanan untuk repo ini. Berisi test case, hasil, lokasi file:baris, tingkat kefatalan, dan alasan. **Tidak ada perbaikan yang dilakukan.**

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
| Perbaikan | Tidak ada. Semua temuan hanya dicatat. |
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

Kesimpulan: **tidak aman untuk produksi**. Empat temuan `critical` berhubungan dengan akun privileged yang bisa diambil alih, secret bersama yang bocor lewat endpoint publik, skrip maintenance tanpa auth yang ikut ter-package, dan kredensial produksi yang tertanam di source/release artifact. Temuan ini saling berantai (mis. secret publik → aksi finance destruktif + SQL injection).

---

## C. Matriks test case & hasil

| ID | Skenario uji | Expected aman | Hasil observasi (source) | Status | Ref |
| --- | --- | --- | --- | --- | --- |
| SEC-T-01 | Login dengan email `telu@creativabridging.com` / `admin.lms@*` dan password dari source | Tidak ada auto-provision; password known ditolak | `login.php` membuat/menimpa `users.password_hash`, `role_id`, `is_active=1` sebelum `password_verify` | `FAIL (temuan)` | SEC-01 |
| SEC-T-02 | Admin menonaktifkan/mengganti password akun di atas, lalu login lagi | Akun tetap nonaktif | `UPDATE ... is_active=1, password_hash=...` dijalankan tiap percobaan login | `FAIL (temuan)` | SEC-01 |
| SEC-T-03 | `GET /api/webhook_registration.php` tanpa kredensial | 401/403, tidak ada material rahasia | GET mengembalikan dokumentasi berisi literal `X-Webhook-Secret` dan `sample_payload.secret` | `FAIL (temuan)` | SEC-02 |
| SEC-T-04 | Pakai secret dari SEC-T-03 untuk POST webhook pendaftaran | 401 | Secret sama dipakai sebagai gate POST; endpoint masuk daftar deferred | `FAIL (temuan)` | SEC-02, SEC-07 |
| SEC-T-05 | `GET automation_status.php?action=test_smtp&to=<attacker>` | 401/403 | Cabang `test_smtp` tidak ada pengecekan secret; `$_GET['to']` jadi penerima email SMTP resmi | `FAIL (temuan)` | SEC-05 |
| SEC-T-06 | `GET automation_status.php?action=reset_test_payment&...&invoice_id=' OR 1=1--` | 401 / query parameterized | `invoice_id` diinterpolasi langsung ke `DELETE`/`UPDATE` setelah gate secret | `FAIL (temuan)` | SEC-06 |
| SEC-T-07 | `GET automation_status.php?action=due_installments&secret=...` | 401, tidak ada PII | Mengembalikan nama/email/telepon/nominal seluruh pelanggan | `FAIL (temuan)` | SEC-06 |
| SEC-T-08 | POST multipart 100 MB ke `lms_upload.php` tanpa session/CSRF | 401/403 + kuota | Tidak ada `require database.php`, tidak ada guard; `mkdir(0777)` + `move_uploaded_file` | `FAIL (temuan)` | SEC-08 |
| SEC-T-09 | Ulangi upload berkali-kali | Rate limit / kuota | Tidak ada pembatas jumlah request | `FAIL (temuan)` | SEC-08 |
| SEC-T-10 | `GET lms_academic.php?action=students` tanpa session | 401 | Deferred `lms_*`, tanpa self-guard; mengembalikan NIK/email/telepon/total bayar semua siswa | `FAIL (temuan)` | SEC-09 |
| SEC-T-11 | `POST lms_academic.php?action=save_sensei` tanpa session | 403 | Membuat `users` role `sensei` dengan password statis known | `FAIL (temuan)` | SEC-09 |
| SEC-T-12 | `POST lms_academic.php?action=save_kaiwa_session` dengan `user_id` korban | Nilai terikat ke actor session | `user_id` diambil dari body, tanpa ownership check | `FAIL (temuan)` | SEC-09 |
| SEC-T-13 | `GET /backend/api/finance_audit_fix.php` tanpa session | 401 lewat `api_entry_policy` | File mendefinisikan `CREATIVA_TEST_ROUTER`, sehingga policy dilewati; bisa install schema/seed permission/periode | `FAIL (temuan)` | SEC-10 |
| SEC-T-14 | `GET /perbaiki_hostinger.php` tanpa kredensial | 401/404, tidak ada write | Skrip bypass policy, menulis ulang `db_env.php`/`rpa_settings.json`/`mail.local.php`, seed user dengan password tetap, dan ikut ter-copy ke `dist` | `FAIL (temuan)` | SEC-03 |
| SEC-T-15 | `GET clean_reset_production.php?key=<kunci di dokblok>` | Ditolak; tidak ada TRUNCATE | Kunci statis dicetak di file sendiri; `TRUNCATE` ~30 tabel finance/audit | `FAIL (temuan)` + `NEEDS VALIDATION` | SEC-04 |
| SEC-T-16 | Forge `sig=hash_hmac(email\|time, secret hardcoded)` ke `sso_login.php` | Signature ditolak | Secret hardcoded; email+time attacker-controlled; session dibuat untuk email aktif mana pun | `FAIL (temuan)` | SEC-11 |
| SEC-T-17 | Forge SSO di atas **tanpa** session sama sekali | 401 | `sso_login.php` tidak deferred → `ed_start()` butuh session; hanya eskalasi dari foothold | `NEEDS VALIDATION` | SEC-11 |
| SEC-T-18 | Baca repo / `dist/config/db_env.php` / zip release | Tidak ada plaintext kredensial | `copy-backend.js` menulis password DB ke `dist`; `database.php`, `rpa_config.php`, `rpa_automation.php`, `perbaiki_hostinger.php` memuat kredensial hardcoded | `FAIL (temuan)` | SEC-12 |
| SEC-T-19 | Simulasi gagal koneksi DB produksi | Tidak ada kredensial persist | `database.php` mencoba beberapa password fallback lalu `file_put_contents` kredensial yang berhasil ke `config/db_env.php` | `FAIL (temuan)` | SEC-13 |
| SEC-T-20 | `fetch()` cross-origin ke endpoint secret-gated | CORS ditolak / token tidak terbaca | `ACAO: *` di `.htaccess` dan beberapa endpoint; tanpa `Allow-Credentials`, dampaknya terbatas | `FAIL (temuan)` | SEC-14 |
| SEC-T-21 | Simpan nama aset GA berisi `<img onerror>` lalu admin buka Print QR | Teks di-escape, tidak ada script | `document.write` menyisipkan field aset tanpa HTML escaping; CSP tidak punya `script-src` | `FAIL (temuan)` | SEC-15 |
| SEC-T-22 | Worker PDF render `http://127.0.0.1:5678/...` dengan secret default | Port/path ditolak allowlist | `isAllowedTargetUrl` hanya cek scheme+hostname, abaikan port; Chromium jalan `--no-sandbox` | `FAIL (temuan)` | SEC-16 |
| SEC-T-23 | `GET :3100/health` tanpa secret | Tidak ada konfigurasi internal | Mengembalikan daftar endpoint + `allowedOrigins` | `FAIL (temuan)` | SEC-16 |
| SEC-T-24 | Upstream JSON berisi `fee_proof_url=http://169.254.169.254/...`; jalankan sync | Host/IP allowlist menolak | URL dipakai verbatim, `CURLOPT_SSL_VERIFYPEER=false`, body ditulis ke `uploads/payment_proofs` | `FAIL (temuan)` | SEC-17 |
| SEC-T-25 | MITM upstream `jisho_proxy.php` dengan 302 ke internal | TLS gagal / redirect diblok | `SSL_VERIFYPEER=false` + `FOLLOWLOCATION=true`; host tetap fixed sehingga bukan SSRF langsung | `FAIL (temuan)` | SEC-18 |
| SEC-T-26 | Workflow n8n baca `$env.WABLAS_TOKEN` | `N8N_BLOCK_ENV_ACCESS_IN_NODE` aktif | Compose men-set `false`; encryption key default known; `N8N_SECURE_COOKIE=false` | `FAIL (temuan)` + `NEEDS VALIDATION` | SEC-19 |
| SEC-T-27 | Jalankan `setup-vps.sh` | Installer terverifikasi; `.env` bukan kode | `curl ... | sh` + `source .env` sebagai root | `FAIL (temuan)` | SEC-20 |
| SEC-T-28 | User A logout, user B login di browser sama, buka halaman finance | Tidak ada sisa data A | `logout` tidak menghapus `finance_*`; purge hanya sekali per release tag | `FAIL (temuan)` | SEC-21 |
| SEC-T-29 | Login dengan `X-Forwarded-For: 1.2.3.4` | IP peer asli yang tercatat | Header forwarded dipercaya untuk `login_audit_log`/`accounting_audit_logs` | `FAIL (temuan)` | SEC-22 |
| SEC-T-30 | Set `localStorage.user.role_name=super_admin`, lalu approve leave | 403 | Role diambil dari DB `session_actor()`; `$_GET['role']` ditimpa policy; test `employee_directory_test.php` menegaskan 403 | `PASS (kontrol)` | V-01 |
| SEC-T-31 | `GET /api/test_finance.php` / `debug*.php` tanpa auth | 404 | `api_entry_policy.php:7` mem-blok pola `test|debug|check|fix_|...` | `PASS (kontrol)` | V-02 |
| SEC-T-32 | Upload lewat `rs_upload` / akses `rs_document` | MIME + ukuran + basename + symlink dicek | `relationships.php:132-150` memiliki kontrol tersebut | `PASS (kontrol)` | V-03 |
| SEC-T-33 | `finance.php?view=photo` dengan `photo_path` arbitrer | Path traversal ditolak | `realpath` + tolak `..`; tidak ada jalur write untrusted ke `photo_path` | `PASS (kontrol)` | V-04 |
| SEC-T-34 | Cek konsumen `jwt.php` / injeksi `rpa-auto-watcher.ps1` | Tidak ada boundary yang bisa dicapai | `jwt.php` tidak punya consumer dan excluded dari release; watcher hanya interpolasi konstanta | `PASS (kontrol)` | V-05, V-07 |

Semua test case bersifat **source-only**. Uji dinamis (HTTP live, upload nyata, SMTP, SSRF, browser XSS) tidak dijalankan → baris `NOT RUN` tidak diklaim sebagai bukti perilaku runtime.

---

## D. Temuan detail

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

- Audit ini **hanya membaca source**; tidak ada perbaikan, tidak ada eksekusi target, tidak ada network probing.
- Ditemukan **4 critical**, **9 high**, **7 medium**, **3 low**, **1 informational** temuan source-confirmed/terkondisi, plus 3 kategori `NEEDS VALIDATION`.
- Rantai dampak terbesar: **SEC-02 (secret bocor) → SEC-06/SEC-07 (aksi finance + SQLi)** dan **SEC-01 (akun known-password) → SEC-11 (SSO forgery) → eskalasi**, diperparah **SEC-03/SEC-12 (kredensial & skrip maintenance ikut release)**.
- Status keamanan: **NO-GO** untuk produksi sampai temuan critical/high ditutup dan fakta deployment di bagian F divalidasi.
- Dokumen ini sengaja tidak memuat nilai kredensial; hanya lokasi dan jenisnya.
