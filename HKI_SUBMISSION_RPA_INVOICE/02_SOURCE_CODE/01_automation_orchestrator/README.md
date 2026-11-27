# RPA Invoice, Receipt & Midtrans Auto-Reconcile — Fase 1, 2 & 3 (n8n + Playwright + Wablas + SMTP + Midtrans)

Paket ini berisi orchestrator **n8n** dan worker headless **Playwright PDF Renderer** untuk otomasi **Zero-Touch**:
- **Fase 1**: Saat kandidat submit Form Pendaftaran di `creativabridging.com`, sistem melakukan screening otomatis, menerbitkan Invoice resmi (`TGCJYYMMXXXX`), merender PDF A4, mengirim via **WhatsApp (Wablas)** + **Email SMTP**, dan mencatat status pengiriman.
- **Fase 2**: Saat pembayaran diverifikasi (baik manual oleh Finance di `billing.php?action=approve_payment` maupun otomatis oleh Midtrans di Fase 3), sistem menerbitkan **Receipt resmi (`RCT-YYMM-XXXX`)**, merender PDF A4, mengirim Receipt ke **WhatsApp (Wablas)** + **Email SMTP**, memantau **Status Pendaftaran Kandidat (`/status-pendaftaran`)**, serta mengirim **Pengingat Cicilan H-3** otomatis via Cron n8n.
- **Fase 3**: Kandidat bisa membayar langsung lewat tombol **Bayar Sekarang (QRIS / Virtual Account)** di `/status-pendaftaran` (`midtrans_payment.php`). Saat pembayaran berhasil (`settlement`/`capture`), webhook `midtrans_webhook.php` memverifikasi signature SHA-512, mencatat pembayaran `Terverifikasi` secara idempoten, mengubah status invoice (`Unpaid` → `Partially Paid` / `Paid`), dan langsung memicu RPA Fase 2 untuk menerbitkan + mengirim **Receipt PDF** ke WA & Email kandidat.

---

## Arsitektur End-to-End (Fase 1, Fase 2 & Fase 3)

1. **Website (`creativabridging.com`)**:
   - Form Konsultasi menjalankan **Rule Engine Screening** otomatis (`screeningRules.js`) dan *Auto-fill* ke Form Pendaftaran.
   - Saat Form Pendaftaran di-submit (`POST /api/index.php?table=participants`), server memanggil `webhook_registration.php` untuk menerbitkan invoice resmi (`TGCJYYMMXXXX`), `public_token`, `invoice_url`, dan `status_url` (`/status-pendaftaran`), lalu memicu n8n jika `N8N_INVOICE_WEBHOOK_URL` dikonfigurasi.
   - Halaman publik **`/status-pendaftaran?inv=...&token=...`** menampilkan checklist 6 tahap (Konsultasi → Screening → Pendaftaran → Invoice → Pembayaran → Receipt), jadwal termin cicilan, tombol **Bayar Sekarang (QRIS / VA)** (`POST /api/midtrans_payment.php`), serta tombol **Lihat Invoice** & **Unduh Receipt**.

2. **n8n Workflows (Terintegrasi Wablas + SMTP)**:
   - **`n8n-phase1-invoice-workflow.json`** (`POST /webhook/creativa-phase1-invoice`):
     Webhook Pendaftaran → Normalisasi → `webhook_registration.php` → cek `needs_delivery || invoice_created_now` → Playwright render `/render-invoice-pdf` → Wablas `/api/send-document-from-local` (`phone`, `caption`, `document`) + Email SMTP → merge → callback `automation_status.php` (`mark_delivery`).
   - **`n8n-phase2-receipt-workflow.json`** (`POST /webhook/creativa-phase2-receipt`):
     Webhook Pembayaran Terverifikasi (dipicu `rpa_trigger_receipt_automation()` dari `billing.php` maupun `midtrans_webhook.php`) → Playwright render `/render-receipt-pdf` → Wablas `/api/send-document-from-local` (`phone`, `caption`, `document`) + Email SMTP → merge → callback `automation_status.php` (`mark_receipt_delivery`).
   - **`n8n-phase2-installment-reminder-workflow.json`** (Cron harian 09:00 WIB):
     Ambil daftar jatuh tempo `GET /api/automation_status.php?action=due_installments&days=3` → Wablas `/api/send-message` (`phone`, `message`) + Email SMTP → merge → catat log anti-duplikat `mark_installment_reminder`.

3. **Playwright PDF Worker (`playwright-pdf-worker.mjs`)**:
   - `GET /health`
   - `POST /render-invoice-pdf?format=binary` (merender `/api/invoice_document.php?id=...&token=...`)
   - `POST /render-receipt-pdf?format=binary` (merender `/api/receipt_document.php?payment_id=...&token=...`)
   - `POST /render-document-pdf?format=binary` (generik `document_type: 'invoice' | 'receipt'`)

4. **Payment Gateway Auto-Reconcile (`Midtrans Snap + Webhook`)**:
   - **`backend/api/midtrans_payment.php`**: Membuat tautan pembayaran QRIS / Virtual Account (`gopay`, `other_qris`, `shopeepay`, `bca_va`, `bni_va`, `bri_va`, `permata_va`, `echannel`, `cimb_va`) sesuai nominal termin berjalan atau pelunasan total.
   - **`backend/api/midtrans_webhook.php`**: Webhook Notification Handler resmi yang memvalidasi `signature_key` SHA-512, mencegah double-credit (`billing_pembayaran.external_ref`), memperbarui status invoice & audit trail, lalu otomatis memicu workflow Receipt Fase 2.
   - **`creativa-main/public/api/payment_webhook.php`**: Handler webhook web yang mendukung validasi signature Midtrans dan forwarding ke `ONE_CREATIVA_MIDTRANS_WEBHOOK_URL`.

---

## Panduan Go-Live Opsi 3 + Midtrans QRIS

### Langkah 1 — Jalankan n8n & Playwright PDF Worker (VPS / Docker)
Salin folder `automation/` ke VPS Ubuntu/Linux Anda:
```bash
cd automation
cp .env.example .env
# Edit .env: isi N8N_DOMAIN (mis. rpa.creativabridging.com), N8N_PUBLIC_URL, N8N_ENCRYPTION_KEY, dan WABLAS_TOKEN
bash setup-vps.sh
```
*(Script `setup-vps.sh` otomatis menjalankan Docker Compose + **Caddy SSL HTTPS** melalui `Caddyfile` jika `N8N_DOMAIN` terisi. Untuk testing lokal sementara di Windows tanpa Docker: jalankan `.\start-local-rpa.ps1` di PowerShell untuk menyalakan Playwright Worker di port `3100` + `npx n8n` di port `5678`.)*

> **Catatan n8n Env**: `N8N_BLOCK_ENV_ACCESS_IN_NODE="false"` pada `docker-compose.yml` wajib aktif agar ekspresi `{{$env.WABLAS_TOKEN}}`, `{{$env.WABLAS_DOMAIN}}`, dan `{{$env.ONECREATIVA_BASE_URL}}` dapat dibaca oleh node workflow.

### Langkah 2 — Import 3 Workflow & Hubungkan SMTP di n8n
1. Buka dashboard n8n (`http://<ip-atau-domain>:5678` / `N8N_PUBLIC_URL`) → **Import from File** → import ketiga file:
   - `n8n-phase1-invoice-workflow.json`
   - `n8n-phase2-receipt-workflow.json`
   - `n8n-phase2-installment-reminder-workflow.json`
2. Pada setiap node **Send Email** (`6b`, `4b`), pilih atau buat Credential **SMTP** menggunakan akun email `finance@creativabridging.com` (SMTP host dari hPanel Hostinger Email, port `465` SSL/TLS atau `587` STARTTLS).
3. **Activate** (nyalakan toggle aktif) ketiga workflow tersebut, lalu salin **Production Webhook URL** dari node `1` pada workflow Fase 1 dan Fase 2.

### Langkah 3 — Pasang Konfigurasi n8n & Midtrans di Server Hostinger (Aman Saat Deploy)
1. **Di server `creativabridging.com`** (`public_html/api/`):
   - Salin `config.rpa.local.example.php` menjadi `config.rpa.local.php`, lalu isi `N8N_INVOICE_WEBHOOK_URL` dan `ONE_CREATIVA_MIDTRANS_WEBHOOK_URL`.
2. **Di server `one.creativabridging.com`** (`public_html/config/`):
   - Salin `config/rpa.local.example.php` menjadi `config/rpa.local.php`, lalu isi:
     - `N8N_RECEIPT_WEBHOOK_URL`: URL webhook **Production** workflow Fase 2 Receipt n8n.
     - `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY` dari Midtrans Dashboard (`Settings → Access Keys`).
     - `MIDTRANS_IS_PRODUCTION`: `false` saat uji coba **Sandbox**, ubah ke `true` saat **Production**.
   - File `rpa.local.php` dan `config.rpa.local.php` otomatis diabaikan saat build/deploy agar konfigurasi rahasia server tidak tertimpa.

### Langkah 4 — Set Payment Notification URL di Midtrans Dashboard
1. Masuk ke **Midtrans Dashboard** (`Sandbox` saat testing, `Production` saat live).
2. Buka **Settings → Configuration → Payment Notification URL**, isi:
   ```text
   https://one.creativabridging.com/api/midtrans_webhook.php
   ```
3. Pastikan channel **QRIS** dan **Virtual Account (BCA/BNI/BRI/Mandiri/Permata)** aktif di menu **Snap Preferences**.
4. Monitoring seluruh eksekusi RPA (Fase 1, Fase 2, Reminder H-3, Snap QRIS, dan Webhook Auto-Reconcile) dapat dipantau langsung di **One-Creativa ERP → Invoice & Penagihan → Tab `Riwayat RPA & QRIS`**.
