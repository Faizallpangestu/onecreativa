<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__.'/../services/salary_slip.php';
$fixtureDir=sys_get_temp_dir().'/creativa-smtp-test-'.bin2hex(random_bytes(6));
mkdir($fixtureDir); $server=null;
try {
    $configPath=$fixtureDir.'/openssl.cnf';
    file_put_contents($configPath,"[req]\ndistinguished_name=dn\n[dn]\n[server]\nsubjectAltName=DNS:localhost\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n");
    $key=openssl_pkey_new(['config'=>$configPath,'private_key_bits'=>2048,'private_key_type'=>OPENSSL_KEYTYPE_RSA]);
    $csr=openssl_csr_new(['commonName'=>'localhost'],$key,['config'=>$configPath,'digest_alg'=>'sha256']);
    $cert=openssl_csr_sign($csr,null,$key,1,['config'=>$configPath,'x509_extensions'=>'server','digest_alg'=>'sha256']);
    if (!$cert) throw new RuntimeException('Cannot create local TLS test certificate');
    openssl_x509_export($cert,$certText); openssl_pkey_export($key,$keyText,null,['config'=>$configPath]);
    file_put_contents($fixtureDir.'/ca.pem',$certText); file_put_contents($fixtureDir.'/server.pem',$certText.$keyText);
    $server=proc_open([PHP_BINARY,__DIR__.'/salary_smtp_fixture.php',$fixtureDir],[['pipe','r'],['file',$fixtureDir.'/server.log','a'],['file',$fixtureDir.'/server.log','a']],$pipes);
    fclose($pipes[0]);
    for ($i=0;$i<100 && !file_exists($fixtureDir.'/ready.json');$i++) usleep(100000);
    if (!file_exists($fixtureDir.'/ready.json')) throw new RuntimeException('Local SMTP receiver did not start');
    $port=json_decode(file_get_contents($fixtureDir.'/ready.json'),true)['port'];
    $snapshot=['id'=>1,'month'=>'2026-09','employee_code'=>'TEST001','employee_name'=>'Karyawan Uji','position_name'=>'Staff','work_days'=>4,'recipient_email'=>'employee@example.test',
        'base_salary'=>'3000000.25','meal_rate'=>'30000.00','transport_rate'=>'20000.00','meal_allowance'=>'120000.00','transport_allowance'=>'80000.00','total_salary'=>'3200000.25',
        'bank_name'=>'Bank Uji','account_number'=>'001234','account_name'=>'Karyawan Uji','bpjs_tk_number'=>'0011223344','bpjs_kes_number'=>'0009988776','payment_status'=>'approved','payday'=>'2026-10-04',
        'paid_date'=>null,'transfer_reference'=>null,'reviewed_by_name'=>'Admin Uji','reviewed_at'=>'2026-10-01 10:00:00'];
    salary_mail_send($snapshot,salary_slip_html($snapshot),'<creativa-local-test@example.test>',[
        'host'=>'localhost','port'=>$port,'encryption'=>'ssl','username'=>'fixture-user','password'=>'fixture-password','from_email'=>'finance@example.test','from_name'=>'Finance Uji','ca_file'=>$fixtureDir.'/ca.pem']);
    $exitCode=proc_close($server); $server=null;
    if ($exitCode!==0 || !file_exists($fixtureDir.'/received.json')) throw new RuntimeException('Local receiver failed');
    $received=json_decode(file_get_contents($fixtureDir.'/received.json'),true); $message=$received['message'];
    if (!str_contains($received['recipient'],'employee@example.test') || !str_contains($message,'multipart/mixed') || !str_contains($message,'Slip_Gaji_2026-09.html') || !str_contains($message,'creativa-local-test@example.test')) throw new RuntimeException('Mail recipient, multipart attachment or stable message ID incorrect');
    preg_match_all('/Content-Transfer-Encoding: base64\r?\n(?:[^\r\n]+\r?\n)*\r?\n([A-Za-z0-9+\/=\r\n]+)/',$message,$blocks);
    $decoded=''; foreach ($blocks[1] as $block) $decoded.=base64_decode(preg_replace('/\s/','',$block));
    if (!str_contains($decoded,'0011223344') || !str_contains($decoded,'3200000.25') || !str_contains($decoded,'Transfer belum dicatat')) throw new RuntimeException('Mail body or attachment lost salary, BPJS or payment status');
    echo "PASS: SMTP TLS, authentication, recipient, UTF-8 message, printable attachment and delivery status verified on local receiver. No external email sent.\n";
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    // Only remove the explicitly named files created in this validated temporary directory.
    foreach (['openssl.cnf','ca.pem','server.pem','server.log','ready.json','received.json'] as $file) if (is_file($fixtureDir.'/'.$file)) unlink($fixtureDir.'/'.$file);
    rmdir($fixtureDir);
}
