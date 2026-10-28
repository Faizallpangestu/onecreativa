<?php
require_once __DIR__.'/../vendor/phpmailer/src/Exception.php';
require_once __DIR__.'/../vendor/phpmailer/src/PHPMailer.php';
require_once __DIR__.'/../vendor/phpmailer/src/SMTP.php';

function salary_mail_config(): array {
    $config = ['host'=>'','port'=>587,'encryption'=>'tls','username'=>'','password'=>'','from_email'=>'','from_name'=>'Finance Creativa','ca_file'=>''];
    $local = __DIR__.'/../config/mail.local.php';
    if (is_file($local)) $config = array_replace($config, require $local);
    foreach (array_keys($config) as $key) {
        $value = getenv('CREATIVA_SMTP_'.strtoupper($key));
        if ($value !== false) $config[$key]=$value;
    }
    if (defined('SALARY_DISABLE_EXTERNAL_EMAIL') && SALARY_DISABLE_EXTERNAL_EMAIL && PHP_SAPI === 'cli-server') $config['host']='';
    return $config;
}
function salary_mail_configured(?array $config = null): bool {
    $config = $config ?? salary_mail_config();
    return trim($config['host']) !== '' && filter_var($config['from_email'],FILTER_VALIDATE_EMAIL)
        && in_array($config['encryption'],['tls','ssl'],true)
        && (int)$config['port'] > 0 && (int)$config['port'] <= 65535
        && (($config['username'] ?? '') === '' || ($config['password'] ?? '') !== '');
}
function salary_mail_send(array $snapshot, string $html, string $messageId, ?array $config = null): void {
    $config = $config ?? salary_mail_config();
    if (!salary_mail_configured($config)) throw new RuntimeException('SMTP belum dikonfigurasi.');
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP(); $mail->Host=$config['host']; $mail->Port=(int)$config['port'];
    $mail->SMTPAuth=$config['username'] !== ''; $mail->Username=$config['username']; $mail->Password=$config['password'];
    $mail->SMTPSecure=$config['encryption']; $mail->Timeout=15; $mail->Timelimit=30; $mail->SMTPDebug=0;
    if (!empty($config['ca_file'])) $mail->SMTPOptions=['ssl'=>['cafile'=>$config['ca_file'],'verify_peer'=>true,'verify_peer_name'=>true]];
    $mail->CharSet='UTF-8'; $mail->Encoding='base64';
    $mail->setFrom($config['from_email'],$config['from_name']);
    $mail->addAddress($snapshot['recipient_email'],$snapshot['employee_name']);
    $mail->Subject='Slip Gaji '.$snapshot['month'].' — '.$snapshot['employee_name'];
    $mail->MessageID=$messageId;
    $mail->isHTML(true); $mail->Body=$html;
    $logoPath=__DIR__.'/../resources/salary-logo.png';
    if (is_file($logoPath)) {
        $mail->addEmbeddedImage($logoPath,'creativa-salary-logo','logo.png','base64','image/png');
        $mail->Body=str_replace('data:image/png;base64,'.base64_encode(file_get_contents($logoPath)),'cid:creativa-salary-logo',$html);
    }
    $paid=$snapshot['payment_status']==='paid';
    $snapshot=salary_normalize_totals($snapshot);
    $mail->AltBody="Slip gaji {$snapshot['month']}\nKaryawan: {$snapshot['employee_name']}\nGaji pokok: Rp {$snapshot['base_salary']}\nUang makan: Rp {$snapshot['meal_allowance']}\nUang transport: Rp {$snapshot['transport_allowance']}\nTHR: Rp {$snapshot['thr_amount']}\nJumlah pendapatan: Rp {$snapshot['gross_salary']}\nKasbon: Rp {$snapshot['kasbon_deduction']}\nBPJS Ketenagakerjaan: Rp {$snapshot['bpjs_tk_deduction']}\nBPJS Kesehatan: Rp {$snapshot['bpjs_kes_deduction']}\nIzin / Sakit: Rp {$snapshot['leave_deduction']}\nJumlah potongan: Rp {$snapshot['total_deductions']}\nGaji bersih: Rp {$snapshot['total_salary']}\n".
        ($paid ? 'Transfer telah dicatat pada '.$snapshot['paid_date'] : 'Gaji telah disetujui Admin. Transfer belum dicatat. Jadwal: '.$snapshot['payday'])."\nSlip juga tersedia pada dashboard karyawan.";
    $mail->addStringAttachment($html,'Slip_Gaji_'.$snapshot['month'].'.html','base64','text/html');
    $mail->send(); // Success means accepted by SMTP, not proof of arrival in the inbox.
}
