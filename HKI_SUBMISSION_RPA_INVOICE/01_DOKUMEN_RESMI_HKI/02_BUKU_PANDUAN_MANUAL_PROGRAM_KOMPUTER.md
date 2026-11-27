# BUKU PANDUAN PENGOPERASIAN & ARSITEKTUR TEKNIS SISTEM
## Sistem Otomasi Penerbitan Invoice, Kwitansi Digital, dan Rekonsiliasi Pembayaran Berbasis Robotic Process Automation (RPA) dan Payment Gateway

---

### BAB 1: PENDAHULUAN & LATAR BELAKANG
Pengelolaan administrasi keuangan pada lembaga pendidikan dan pelatihan kerja internasional melibatkan ribuan transaksi penagihan biaya pendidikan, skema cicilan termin, penerbitan tanda bukti bayar (kwitansi), dan verifikasi mutasi rekening. Pendekatan konvensional yang mengandalkan pembuatan invoice dan kwitansi manual memiliki kerentanan tinggi terhadap human error, keterlambatan penerbitan dokumen, serta kendala rekonsiliasi pembayaran.

Program Komputer ini diciptakan sebagai solusi otomatisasi menyeluruh (Zero-Touch Invoicing & Financial Settlement) yang menyatukan alur pendaftaran siswa, mesin kalkulasi termin, robot perender dokumen PDF resmi, gateway multi-kanal, dan payment gateway QRIS/Virtual Account ke dalam satu sistem terpadu.

---

### BAB 2: ARSITEKTUR SISTEM & 3 FASE UTAMA
Sistem beroperasi melalui 3 Fase Otomasi Utama:

```
[Form Pendaftaran / Siswa]
           │
           ▼ (Webhook HTTP)
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: Penerbitan Invoice Otomatis (RPA Screening & n8n)    │
│  - Screening aturan kualifikasi kandidat                     │
│  - Kalkulasi termin pembayaran (Full / Cicilan 3-6x)        │
│  - Penomoran unik invoice resmi (TGCJYYMMXXXX)              │
│  - Headless Browser Playwright: Render PDF Invoice A4       │
│  - Distribusi otomatis: WhatsApp Gateway + Email SMTP       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ FASE 3: Payment Gateway & Rekonsiliasi Real-Time (Midtrans) │
│  - Siswa buka tautan publik status pendaftaran               │
│  - Pilihan metode bayar: QRIS (GoPay/ShopeePay) / VA Bank   │
│  - Webhook Notification Handler (SHA-512 Signature Check)    │
│  - Idempotent execution (Anti double-credit transaksi)      │
│  - Update status otomatis: Unpaid -> Partially Paid -> Paid │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ FASE 2: Penerbitan Kwitansi Digital & Reminder Cicilan      │
│  - Terbitkan Kwitansi Resmi (RCT-YYMM-XXXX)                 │
│  - Konversi Terbilang Bahasa Indonesia Otomatis             │
│  - QR Code & Digital Signature Verification                  │
│  - Kirim PDF Kwitansi ke WhatsApp & Email Siswa             │
│  - Cron Scheduler Harian (09:00 WIB): Reminder Cicilan H-3   │
└─────────────────────────────────────────────────────────────┘
```

---

### BAB 3: FITUR DAN MODUL SISTEM
1. **Orkestrator n8n Workflows**:
   - `n8n-phase1-invoice-workflow.json`: Workflow penerbitan dan pengiriman invoice.
   - `n8n-phase2-receipt-workflow.json`: Workflow penerbitan dan pengiriman kwitansi.
   - `n8n-phase2-installment-reminder-workflow.json`: Workflow pengingat jatuh tempo H-3.
2. **Headless PDF Worker (Playwright)**:
   - Menghasilkan dokumen A4 dengan tata letak pixel-perfect, barcode/QR Code, stempel resmi digital, dan header surat resmi.
3. **Engine Backend & Webhooks**:
   - `services/rpa_automation.php`: Core logic otomasi, fungsi konversi terbilang, builder URL terproteksi token, dan logging.
   - `api/midtrans_payment.php` & `api/midtrans_webhook.php`: Penanganan transaksi dan rekonsiliasi perbankan.
4. **Dasbor ERP Keuangan**:
   - Dasbor penagihan, manajemen termin, buku besar (general ledger), dan rekap riwayat pengiriman robot RPA.

---

### BAB 4: PANDUAN PENGOPERASIAN
1. **Penerbitan Otomatis**:
   - Sistem berjalan secara otonom di latar belakang setiap kali ada data pendaftaran baru atau pelunasan tagihan.
2. **Pemantauan oleh Staf Keuangan**:
   - Masuk ke menu **Keuangan -> Invoice & Penagihan**.
   - Buka tab **Riwayat RPA & QRIS** untuk melihat status pengiriman WhatsApp, Email, dan respon webhook.
3. **Penerbitan Manual (Bila Diperlukan)**:
   - Staf dapat mengklik **+ Buat Tagihan Baru** untuk memilih siswa dan mengatur tanggal jatuh tempo secara custom.

---

### BAB 5: SPESIFIKASI TEKNIS
- **Bahasa Pemrograman**: PHP 8.1+, JavaScript (Node.js 18+, React 18)
- **Database**: MariaDB / MySQL 8.0+
- **RPA & Headless Engine**: n8n Automation Engine, Microsoft Playwright
- **Kriptografi**: SHA-512 Webhook Signature, Token Hash 128-bit
- **Protokol Komunikasi**: HTTPS RESTful API, Webhook Event JSON
