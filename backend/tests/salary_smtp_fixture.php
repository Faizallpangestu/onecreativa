<?php
// Local TLS SMTP receiver for testing only. It never forwards messages.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$fixtureDir=$argv[1] ?? '';
if (realpath(dirname($fixtureDir))!==realpath(sys_get_temp_dir()) || !preg_match('/^creativa-smtp-test-[a-f0-9]{12}$/D',basename($fixtureDir))) exit(1);
$context=stream_context_create(['ssl'=>['local_cert'=>$fixtureDir.'/server.pem','verify_peer'=>false]]);
$server=stream_socket_server('tcp://127.0.0.1:0',$errno,$error,STREAM_SERVER_BIND|STREAM_SERVER_LISTEN,$context);
if (!$server) throw new RuntimeException('Cannot bind local SMTP test server');
$address=stream_socket_get_name($server,false);
file_put_contents($fixtureDir.'/ready.json',json_encode(['port'=>(int)substr($address,strrpos($address,':')+1)]));
$client=stream_socket_accept($server,20);
if (!$client) throw new RuntimeException('SMTP test client did not connect');
stream_set_timeout($client,15);
if (!stream_socket_enable_crypto($client,true,STREAM_CRYPTO_METHOD_TLS_SERVER)) throw new RuntimeException('Local SMTP TLS handshake failed');
fwrite($client,"220 localhost Test SMTP\r\n"); $message=''; $recipient='';
while (($line=fgets($client))!==false) {
    $line=rtrim($line,"\r\n");
    if (str_starts_with($line,'EHLO') || str_starts_with($line,'HELO')) fwrite($client,"250-localhost\r\n250-AUTH LOGIN\r\n250 SIZE 2000000\r\n");
    elseif (str_starts_with($line,'AUTH LOGIN')) {
        fwrite($client,"334 VXNlcm5hbWU6\r\n"); $user=trim(fgets($client));
        fwrite($client,"334 UGFzc3dvcmQ6\r\n"); $password=trim(fgets($client));
        if (base64_decode($user)!=='fixture-user' || base64_decode($password)!=='fixture-password') throw new RuntimeException('Fixture authentication failed');
        fwrite($client,"235 Authentication accepted\r\n");
    } elseif (str_starts_with($line,'MAIL FROM:')) fwrite($client,"250 Sender accepted\r\n");
    elseif (str_starts_with($line,'RCPT TO:')) { $recipient=$line; fwrite($client,"250 Recipient accepted\r\n"); }
    elseif ($line==='DATA') {
        fwrite($client,"354 End with dot\r\n");
        while (($data=fgets($client))!==false && rtrim($data,"\r\n")!=='.') $message.=$data;
        file_put_contents($fixtureDir.'/received.json',json_encode(['recipient'=>$recipient,'message'=>$message]));
        fwrite($client,"250 Message accepted by local fixture\r\n");
    } elseif ($line==='QUIT') { fwrite($client,"221 Bye\r\n"); break; }
    elseif ($line==='RSET' || $line==='NOOP') fwrite($client,"250 OK\r\n");
    else throw new RuntimeException('Unexpected SMTP command');
}
fclose($client); fclose($server);
