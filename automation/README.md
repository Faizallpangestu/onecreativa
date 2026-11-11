# RPA Invoice & Receipt Automation — Fase 1 & Fase 2 (n8n + Playwright + OneCreativa API)

Paket ini berisi orchestrator **n8n** dan worker headless **Playwright PDF Renderer** untuk otomasi **Zero-Touch**:
- **Fase 1**: Saat kandidat submit Form Pendaftaran di `creativabridging.com`, sistem melakukan screening otomatis, menerbitkan Invoice resmi (`TGCJYYMMXXXX`), merender PDF A4, mengirim via WhatsApp + Email, dan mencatat status pengiriman.
- **Fase 2**: Saat pembayaran diverifikasi Finance (`billing.php?action=approve_payment`), sistem menerbitkan **Receipt resmi (`RCT-YYMM-XXXX`)**, merender PDF A4, mengirim Receipt ke WhatsApp + Email, memantau **Status Pendaftaran Kandidat (`/status-pendaftaran`)**, serta mengirim **Pengingat Cicilan H-3** otomatis via Cron n8n.

---

## Arsitektur End-to-End (Fase 1 & Fase 2)

1. **Website (`creativabridging.com`)**:
   - Form Konsultasi menjalankan **Rule Engine Screening** otomatis (`screeningRules.js`) dan *Auto-fill* ke Form Pendaftaran.
   - Saat Form Pendaftaran di-submit (`POST /api/index.php?table=participants`), server memanggil `webhook_registration.php` untuk menerbitkan invoice resmi (`TGCJYYMMXXXX`), `public_token`, `invoice_url`, dan `status_url` (`/status-pendaftaran`), lalu memicu n8n jika `N8N_INVOICE_WEBHOOK_URL` dikonfigurasi.
   - Halaman publik **`/status-pendaftaran?inv=...&token=...`** menampilkan checklist 6 tahap (Konsultasi → Screening → Pendaftaran → Invoice → Pembayaran → Receipt), jadwal termin cicilan, serta tombol **Lihat Invoice** & **Unduh Receipt**.

2. **n8n Workflows**:
   - **`n8n-phase1-invoice-workflow.json`** (`POST /webhook/creativa-phase1-invoice`):
     Webhook Pendaftaran → Normalisasi → `webhook_registration.php` → cek `needs_delivery || invoice_created_now` → Playwright render `/render-invoice-pdf` → WhatsApp + Email → callback `automation_status.php` (`mark_delivery`).
   - **`n8n-phase2-receipt-workflow.json`** (`POST /webhook/creativa-phase2-receipt`):
     Webhook Pembayaran Terverifikasi (dipicu oleh `billing.php` `approve_payment`) → Playwright render `/render-receipt-pdf` → WhatsApp + Email → callback `automation_status.php` (`mark_receipt_delivery`).
   - **`n8n-phase2-installment-reminder-workflow.json`** (Cron harian 09:00 WIB):
     Ambil daftar jatuh tempo `GET /api/automation_status.php?action=due_installments&days=3` → kirim pengingat WA + Email → catat log anti-duplikat `mark_installment_reminder`.

3. **Playwright PDF Worker (`playwright-pdf-worker.mjs`)**:
   - `GET /health`
   - `POST /render-invoice-pdf?format=binary` (merender `/api/invoice_document.php?id=...&token=...`)
   - `POST /render-receipt-pdf?format=binary` (merender `/api/receipt_document.php?payment_id=...&token=...`)
   - `POST /render-document-pdf?format=binary` (generik `document_type: 'invoice' | 'receipt'`)

---

## Cara Menjalankan Playwright PDF Worker

```bash
cd automation
cp .env.example .env
npm install
npx playwright install chromium
npm start
```

Header otentikasi worker: `X-Worker-Secret: <WORKER_SECRET>` (default: `CREATIVA_SYNC_SECRET_2026`).

---

## Cara Import Workflow ke n8n

1. Buka dashboard n8n → **Import from File** → import ketiga file berikut:
   - `n8n-phase1-invoice-workflow.json`
   - `n8n-phase2-receipt-workflow.json`
   - `n8n-phase2-installment-reminder-workflow.json`
2. Atur Environment Variables di n8n:
   - `ONECREATIVA_BASE_URL=https://one.creativabridging.com`
   - `ONECREATIVA_WEBHOOK_SECRET=CREATIVA_SYNC_SECRET_2026`
   - `PLAYWRIGHT_WORKER_URL=http://<host-worker>:3100`
   - `WA_API_URL` & `WA_API_TOKEN` (Fonnte / Wablas / WAHA)
3. Hubungkan node email di ketiga workflow dengan credential SMTP `finance@creativabridging.com`.
4. Pasang konstanta URL webhook production n8n di server:
   - Di `creativabridging.com/api/config.php` (`creativa-main`):
     ```php
     define('N8N_INVOICE_WEBHOOK_URL', 'https://<host-n8n>/webhook/creativa-phase1-invoice');
     ```
   - Di server `one.creativabridging.com` (env server / config PHP jika ingin auto-trigger Fase 2 saat verifikasi bayar):
     ```php
     define('N8N_RECEIPT_WEBHOOK_URL', 'https://<host-n8n>/webhook/creativa-phase2-receipt');
     ```
