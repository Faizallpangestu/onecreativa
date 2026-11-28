<?php
require_once __DIR__.'/accounting_core.php';
require_once __DIR__.'/salary_mail.php';
require_once __DIR__.'/rpa_automation.php';

// Track DATA separately: PHPMailer can throw after partial recipient acceptance.
class InvoiceMailSMTP extends PHPMailer\PHPMailer\SMTP {
    public bool $dataStarted = false;
    public bool $accepted = false;
    public string $failureCode = '';
    public function data($msg_data) {
        $this->dataStarted = true;
        $this->accepted = parent::data($msg_data);
        if (!$this->accepted) $this->failureCode = (string)($this->getError()['smtp_code'] ?? '');
        return $this->accepted;
    }
    public function recipient($address, $dsn = '') {
        $ok = parent::recipient($address, $dsn);
        if (!$ok) $this->failureCode = (string)($this->getError()['smtp_code'] ?? '');
        return $ok;
    }
}

function invoice_mail_attempt(array $row): array {
    $detail = json_decode($row['detail_json'] ?? '{}', true) ?: [];
    return ['id'=>(int)$row['id'], 'invoice_id'=>$row['invoice_id'], 'request_id'=>$detail['request_id'] ?? '',
        'status'=>$row['status'], 'recipient'=>$row['recipient'], 'created_at'=>$row['created_at'],
        'completed_at'=>$detail['completed_at'] ?? null, 'error_message'=>$row['error_message'] ?? '',
        'cc'=>$detail['cc'] ?? [], 'pdf_attached'=>(bool)($detail['pdf_attached'] ?? false),
        'pdf_generated'=>(bool)($detail['pdf_generated'] ?? $detail['pdf_attached'] ?? false),
        'delivery_uncertain'=>(bool)($detail['delivery_uncertain'] ?? false), 'http_code'=>(int)($detail['http_code'] ?? 409),
        'previous_attempt_id'=>$detail['previous_attempt_id'] ?? null,
        'payment_id'=>isset($detail['payment_id'])?(int)$detail['payment_id']:null, 'receipt_number'=>$detail['receipt_number'] ?? null];
}

function invoice_mail_history(mysqli $db, string $id): array {
    return array_map('invoice_mail_attempt', ac_rows($db,
        "SELECT * FROM automation_logs WHERE invoice_id=? AND stage='invoice_email' AND channel='Email' ORDER BY id DESC", [$id]));
}

function invoice_mail_url(array $invoice, array $config): string {
    $base = rtrim(trim((string)$config['invoice_api_base_url']), '/');
    $url = parse_url($base);
    $local = in_array($url['host'] ?? '', ['127.0.0.1','localhost','::1'], true);
    if (!$url || !isset($url['host']) || !in_array($url['scheme'] ?? '', $local ? ['http','https'] : ['https'], true)
        || isset($url['user']) || isset($url['pass']) || isset($url['query']) || isset($url['fragment'])) {
        ac_fail('Konfigurasi URL dokumen invoice resmi belum lengkap. Hubungi pengelola server.', 409);
    }
    if (!preg_match('/^[a-f0-9]{32,64}$/Di', (string)($invoice['public_token'] ?? ''))) {
        ac_fail('Token dokumen invoice belum tersedia. Rekonsiliasi dokumen oleh Finance diperlukan.', 409);
    }
    return $base.'/invoice_document.php?id='.rawurlencode($invoice['id']).'&token='.rawurlencode($invoice['public_token']);
}

function invoice_mail_pdf(array $invoice, string $url, array $config, ?array $receipt = null): ?string {
    $required = filter_var($config['invoice_pdf_required'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($required === null) ac_fail('Konfigurasi kewajiban PDF tidak valid.', 409);
    $worker = rtrim(trim((string)$config['invoice_pdf_worker_url']), '/');
    $target = parse_url($worker);
    if (!$target || !in_array($target['scheme'] ?? '', ['http','https'], true) || empty($target['host'])
        || isset($target['user']) || isset($target['pass']) || isset($target['query']) || isset($target['fragment'])
        || trim((string)$config['invoice_pdf_worker_secret']) === '') {
        if (!$required) return null;
        ac_fail('PDF wajib: URL atau secret worker PDF belum dikonfigurasi.', 409);
    }
    $curl = curl_init($worker.($receipt ? '/render-receipt-pdf' : '/render-invoice-pdf').'?format=binary');
    $payload = $receipt ? ['invoice_id'=>$invoice['id'],'payment_id'=>$receipt['payment_id'],'receipt_number'=>$receipt['receipt_number'],'receipt_url'=>$url] : ['invoice_id'=>$invoice['id'],'invoice_url'=>$url];
    curl_setopt_array($curl, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>json_encode($payload, JSON_THROW_ON_ERROR),
        CURLOPT_HTTPHEADER=>['Content-Type: application/json','X-Worker-Secret: '.$config['invoice_pdf_worker_secret']],
        CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>50, CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_PROTOCOLS=>CURLPROTO_HTTP|CURLPROTO_HTTPS]);
    $pdf = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $type = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
    curl_close($curl);
    $valid = $status === 200 && is_string($pdf) && strlen($pdf) >= 100 && strlen($pdf) <= 15*1024*1024
        && str_starts_with(strtolower((string)$type), 'application/pdf') && str_starts_with($pdf, '%PDF-')
        && str_contains(substr($pdf, -1024), '%%EOF');
    if (!$valid && $required) ac_fail('PDF wajib gagal dirender oleh worker. Email belum dikirim; periksa layanan PDF.', 502);
    return $valid ? $pdf : null;
}

function invoice_mail_content(array $invoice, array $meta, string $url): array {
    $amount = ac_decimal(ac_cents((string)$invoice['total']));
    $plain = "Yth. {$invoice['customer']},\n\nInvoice resmi {$invoice['id']}\nProgram: ".($meta['program'] ?? $invoice['keterangan']).
        "\nJumlah tagihan: Rp $amount\nJatuh tempo: {$invoice['jatuhTempo']}\nSkema: ".($meta['skema'] ?? 'Sesuai dokumen invoice')."\n";
    foreach (($meta['installments'] ?? []) as $term) {
        $plain .= ($term['label'] ?? $term['keterangan'] ?? 'Termin').': Rp '.($term['amount'] ?? $term['nominal'] ?? '').' - '.($term['due_date'] ?? $term['jatuhTempo'] ?? '')."\n";
    }
    $plain .= "\nRekening sesuai invoice: {$meta['bank_name']} / {$meta['account_number']} / {$meta['account_holder']}\n\nDokumen invoice: $url\n\nFinance Creativa\n";
    return ['subject'=>'Invoice '.$invoice['id'].' - Finance Creativa', 'plain'=>$plain,
        'html'=>'<div style="font-family:Arial,sans-serif;line-height:1.6">'.nl2br(htmlspecialchars($plain, ENT_QUOTES, 'UTF-8')).'</div>'];
}

function invoice_mail_send(mysqli $db, array $actor, array $body): array {
    return finance_document_mail_send($db,$actor,$body);
}

function finance_document_mail_send(mysqli $db, array $actor, array $body, ?array $receipt = null): array {
    ac_require($db, $actor, 'prepare');
    $id = ac_text($body['invoice_id'] ?? null, 'Nomor invoice', 50);
    $key = ac_key($body['request_id'] ?? null);
    $previous = isset($body['previous_attempt_id']) ? ac_id($body['previous_attempt_id'], 'Percobaan sebelumnya') : null;
    $persisted = ac_one($db, 'SELECT id FROM billing_invoices WHERE id=?', [$id]);
    if (!$persisted) ac_fail('Invoice tidak ditemukan.', 404);
    // Use the stored ID for the lock even when a legacy DB collation ignores case.
    $id = $persisted['id'];
    if (!ac_table($db, 'automation_logs')) ac_fail('Riwayat automation_logs belum tersedia. Pengelola server perlu menyiapkan skema existing.', 409);
    $stage = $receipt ? 'receipt_email' : 'invoice_email';
    $identity = $receipt ? (string)$receipt['payment_id'] : $id;
    $lock = ($receipt ? 'receipt-email:' : 'invoice-email:').hash('sha256', $identity);
    // MySQL named locks are limited to 64 characters.
    $lock = substr($lock, 0, 64);
    if ((int)(ac_one($db, 'SELECT GET_LOCK(?,0) AS acquired', [$lock])['acquired'] ?? 0) !== 1) {
        ac_fail('Email invoice sedang diproses. Periksa riwayat sebelum mencoba lagi.', 409);
    }
    try {
        $invoice = ac_one($db, 'SELECT * FROM billing_invoices WHERE id=?', [$id]);
        if (!$invoice) ac_fail('Invoice tidak ditemukan.', 404);
        $history = $receipt ? receipt_mail_history($db, (int)$receipt['payment_id']) : invoice_mail_history($db, $id);
        foreach ($history as $attempt) if ($attempt['request_id'] === $key) return ['attempt'=>$attempt, 'replayed'=>true, 'http_code'=>$attempt['http_code']];
        $latest = $history[0] ?? null;
        if (($latest['id'] ?? null) !== $previous) ac_fail('Riwayat email berubah. Muat ulang invoice sebelum mengirim ulang.', 409);
        if ($latest && ($latest['status'] === 'Pending' || $latest['delivery_uncertain'])) {
            ac_fail('Hasil pengiriman sebelumnya belum pasti. Periksa SMTP dengan pengelola server; jangan kirim ulang otomatis.', 409);
        }
        $config = salary_mail_config();
        // Persist Pending before any external work. A crash remains visible and is never automatically retried.
        $receiptIdentity = $receipt ? ['payment_id'=>(int)$receipt['payment_id'],'receipt_number'=>$receipt['receipt_number']] : [];
        $attemptId = ac_atomic($db, function () use ($db, $actor, $id, $invoice, $key, $previous, $stage, $receiptIdentity) {
            $detail = json_encode($receiptIdentity+['request_id'=>$key,'previous_attempt_id'=>$previous,'actor_id'=>(int)$actor['id']], JSON_THROW_ON_ERROR);
            ac_query($db, "INSERT INTO automation_logs(invoice_id,stage,channel,status,recipient,detail_json) VALUES(?,?,'Email','Pending',?,?)", [$id,$stage,$invoice['email'],$detail]);
            $attemptId = (int)$db->insert_id;
            ac_audit($db, $actor, 'billing_invoice', $id, 'email_requested', $receiptIdentity+['stage'=>$stage,'attempt_id'=>$attemptId,'request_id'=>$key]);
            return $attemptId;
        });
        $detail = $receiptIdentity+['request_id'=>$key,'previous_attempt_id'=>$previous,'actor_id'=>(int)$actor['id'],'cc'=>[], 'pdf_attached'=>false, 'delivery_uncertain'=>false];
        $smtp = null; $status = 'Failed'; $error = ''; $httpCode = 502;
        try {
            if ($receipt) {
                $url = receipt_mail_url($invoice,$receipt,$config);
                $pdf = receipt_pdf($db,$receipt,$config);
                $detail['pdf_generated'] = true;
                $content = receipt_mail_content($invoice,$receipt,$url);
            }
            if (!in_array(strtolower(trim($invoice['status'])), ['unpaid','paid','partially paid','overdue','lunas','sebagian','belum lunas','belum dibayar'], true)) ac_fail('Status invoice ini tidak memenuhi syarat pengiriman.', 422);
            if (!filter_var($invoice['email'], FILTER_VALIDATE_EMAIL)) ac_fail('Email penerima pada invoice tidak valid atau belum tersedia. Finance perlu memperbaiki data resmi.', 422);
            if ($config[$receipt ? 'receipt_email_sender' : 'invoice_email_sender'] !== 'php') ac_fail('Pengiriman email PHP belum diaktifkan. Tetapkan satu pengirim resmi dan nonaktifkan cabang email n8n sebelum mengaktifkan PHP.', 409);
            if (!salary_mail_configured($config)) ac_fail('SMTP belum dikonfigurasi dengan lengkap. Hubungi pengelola server.', 409);
            foreach (['invoice_cc_tiffa','invoice_cc_alfin'] as $field) {
                $address = trim((string)$config[$field]);
                if ($address !== '' && !filter_var($address, FILTER_VALIDATE_EMAIL)) ac_fail('Konfigurasi CC Finance tidak valid: '.$field.'.', 409);
                if ($address !== '' && strcasecmp($address, $invoice['email']) !== 0) $detail['cc'][strtolower($address)] = $address;
            }
            $detail['cc'] = array_values($detail['cc']);
            if (!$receipt) {
            $meta = json_decode($invoice['meta_json'] ?? '', true);
            foreach (['bank_name','account_number','account_holder'] as $field) {
                if (!is_array($meta) || !is_string($meta[$field] ?? null) || trim($meta[$field]) === '') ac_fail('Snapshot rekening invoice belum lengkap. Rekonsiliasi Finance diperlukan; rekening tidak diganti dari master saat pengiriman.', 409);
            }
            if (!is_array($meta['installments'] ?? null) || !array_is_list($meta['installments']) || !$meta['installments']) {
                ac_fail('Termin invoice tersimpan belum lengkap. Rekonsiliasi Finance diperlukan; pengiriman tidak membuat skema atau jadwal pengganti.', 409);
            }
            foreach ($meta['installments'] as $term) if (!is_array($term)) ac_fail('Snapshot termin invoice tidak valid. Rekonsiliasi Finance diperlukan.', 409);
            if (ac_cents((string)$invoice['total']) <= 0) ac_fail('Nominal invoice tersimpan tidak valid.', 422);
            $url = invoice_mail_url($invoice, $config);
            $pdf = invoice_mail_pdf($invoice, $url, $config);
            $content = invoice_mail_content($invoice, $meta, $url);
            }
            $mail = salary_mail_transport($config);
            $smtp = new InvoiceMailSMTP(); $mail->setSMTPInstance($smtp);
            $mail->addAddress($invoice['email'], $invoice['customer']);
            foreach ($detail['cc'] as $address) $mail->addCC($address);
            $domain = substr(strrchr($config['from_email'], '@'), 1);
            $mail->MessageID = '<'.$stage.'-'.$attemptId.'-'.substr(hash('sha256',$identity),0,16).'@'.$domain.'>';
            $mail->Subject = $content['subject']; $mail->isHTML(true); $mail->Body = $content['html']; $mail->AltBody = $content['plain'];
            if ($pdf !== null) {
                $mail->addStringAttachment($pdf, ($receipt ? $receipt['receipt_number'] : 'Invoice-'.preg_replace('/[^a-zA-Z0-9_-]/','_', $id)).'.pdf', 'base64', 'application/pdf');
                $detail['pdf_attached'] = true;
            }
            $mail->send();
            if (!$smtp->accepted) throw new RuntimeException('SMTP DATA acceptance not observed');
            $status = 'SMTP Accepted';
        } catch (AccountingException $e) {
            $error = $e->getMessage(); $httpCode = $e->getCode();
        } catch (Throwable $e) {
            // Never log raw SMTP replies, exception text, MIME body, secrets or document token URLs.
            $code = $smtp ? $smtp->failureCode : '';
            $detail['delivery_uncertain'] = $smtp && ($smtp->accepted || ($smtp->dataStarted && !preg_match('/^[45][0-9]{2}$/D', $code)));
            $error = $detail['delivery_uncertain']
                ? 'Pengiriman diterima sebagian atau hasil SMTP belum pasti. Pengelola server harus memeriksa penerima/CC sebelum pengiriman ulang.'
                : 'Pengiriman SMTP gagal'.(preg_match('/^[45][0-9]{2}$/D', $code) ? ' (kode '.$code.')' : '').'. Periksa koneksi, autentikasi, TLS, dan alamat penerima pada konfigurasi server.';
        }
        $detail['completed_at'] = date('Y-m-d H:i:s'); $detail['http_code'] = $status === 'SMTP Accepted' ? 200 : $httpCode;
        try {
            ac_query($db, 'UPDATE automation_logs SET status=?,detail_json=?,error_message=? WHERE id=? AND status=\'Pending\'', [$status,json_encode($detail, JSON_THROW_ON_ERROR),$error,$attemptId]);
        } catch (Throwable $e) {
            ac_fail('Hasil SMTP belum dapat disimpan. Percobaan tetap Pending; periksa riwayat SMTP sebelum tindakan manual.', 409);
        }
        $attempt = invoice_mail_attempt(ac_one($db, 'SELECT * FROM automation_logs WHERE id=?', [$attemptId]));
        return ['attempt'=>$attempt, 'replayed'=>false, 'http_code'=>$detail['http_code']];
    } finally {
        ac_query($db, 'SELECT RELEASE_LOCK(?)', [$lock]);
    }
}
