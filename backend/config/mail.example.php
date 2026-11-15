<?php
// Copy to mail.local.php on the server. That file is ignored by Git and builds.
// Alternatively configure the CREATIVA_SMTP_* environment variables.
return [
    'host' => '',
    'port' => 587,
    'encryption' => 'tls', // tls (STARTTLS) or ssl (SMTPS)
    'username' => '',
    'password' => '',
    'from_email' => '',
    'from_name' => 'Finance Creativa',
    'ca_file' => '', // Optional path to a trusted CA bundle; TLS verification stays enabled.
    // Enable php ONLY after disabling the invoice email branch in the active n8n workflow.
    // Leave empty to disable invoice email; use n8n when that workflow owns email.
    'invoice_email_sender' => '', // php | n8n | empty
    'receipt_email_sender' => '', // php | n8n | empty; disable live n8n receipt email before enabling php.
    'invoice_cc_tiffa' => '', // Bu Tiffa's verified email, supplied privately by Finance.
    'invoice_cc_alfin' => '', // Pak Alfin's verified email, supplied privately by Finance.
    'invoice_api_base_url' => '', // Public HTTPS API base, e.g. https://your-domain/api
    'invoice_pdf_worker_url' => '', // Existing worker base, e.g. http://127.0.0.1:3100
    'invoice_pdf_worker_secret' => '', // Must match the existing worker's WORKER_SECRET.
    'invoice_pdf_required' => true, // false explicitly permits link-only if worker is unavailable.
];
