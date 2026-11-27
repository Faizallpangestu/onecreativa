<?php
/**
 * send_invoice_complete.php
 * All-in-one: Generate Invoice + Kirim Email (Invoice + Syarat & Ketentuan) dalam 1 request
 * 
 * Endpoint: POST /api/send_invoice_complete.php
 * 
 * Body JSON:
 * {
 *   "siswa_id": 1,
 *   "nama_siswa": "Nopela Prasica",
 *   "nomor_wa": "082xxxxxxxxx",
 *   "email": "siswa@gmail.com",
 *   "program": "Intensif",
 *   "batch": "Batch 2 Cianjur",
 *   "tipe_pembayaran": "fullpayment",   // atau "cicilan"
 *   "total_biaya": 12000000,
 *   "dp_amount": 3000000,               // jika cicilan
 *   "sisa_tagihan": 9000000,            // jika cicilan
 *   "cicilan": [...],
 *   "tanggal_invoice": "2024-06-26",
 *   "jatuh_tempo": "2024-07-26",
 *   "include_syarat": true,
 *   "kirim_wa": false                   // opsional kirim WA juga
 * }
 */

require_once 'config.php';
require_once 'database.php';
require_once 'invoice_generator.php';    // reuse fungsi generateInvoiceHTML, generateReceiptHTML, dll
require_once 'send_email_invoice.php';   // reuse fungsi sendEmailWithAttachments, htmlToAttachment, dll
