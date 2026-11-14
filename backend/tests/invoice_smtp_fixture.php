<?php
// Local TLS capture only. Never forwards email.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$dir = $argv[1] ?? '';
if (realpath(dirname($dir)) !== realpath(sys_get_temp_dir()) || !preg_match('/^creativa-invoice-smtp-test-[a-f0-9]{12}$/D',basename($dir))) exit(1);
$context = stream_context_create(['ssl'=>['local_cert'=>$dir.'/server.pem','verify_peer'=>false]]);
$server = stream_socket_server('tcp://127.0.0.1:0',$errno,$error,STREAM_SERVER_BIND|STREAM_SERVER_LISTEN,$context);
if (!$server) throw new RuntimeException('Local SMTP capture unavailable');
$address = stream_socket_get_name($server,false);
file_put_contents($dir.'/ready.json', json_encode(['port'=>(int)substr($address,strrpos($address,':')+1)]));
while ($client = @stream_socket_accept($server,120)) {
    stream_set_timeout($client,20);
    if (!@stream_socket_enable_crypto($client,true,STREAM_CRYPTO_METHOD_TLS_SERVER)) { fclose($client); continue; }
    $mode = is_file($dir.'/mode') ? trim(file_get_contents($dir.'/mode')) : 'accepted';
    fwrite($client,"220 localhost SMTP fixture\r\n"); $recipients=[]; $message='';
    while (($line=fgets($client)) !== false) {
        $line=rtrim($line,"\r\n");
        if (str_starts_with($line,'EHLO') || str_starts_with($line,'HELO')) fwrite($client,"250-localhost\r\n250-AUTH LOGIN\r\n250 SIZE 20000000\r\n");
        elseif (str_starts_with($line,'AUTH LOGIN')) {
            fwrite($client,"334 VXNlcm5hbWU6\r\n"); $user=trim(fgets($client));
            fwrite($client,"334 UGFzc3dvcmQ6\r\n"); $password=trim(fgets($client));
            fwrite($client,base64_decode($user)==='fixture-user' && base64_decode($password)==='fixture-password' ? "235 Auth accepted\r\n" : "535 Auth rejected\r\n");
        } elseif (str_starts_with($line,'MAIL FROM:')) fwrite($client,"250 Sender accepted\r\n");
        elseif (str_starts_with($line,'RCPT TO:')) {
            $recipients[]=$line;
            fwrite($client,$mode==='partial' && str_contains($line,'tiffa@example.test') ? "550 CC rejected fixture-password TOKEN_SECRET\r\n" : "250 Recipient accepted\r\n");
        } elseif ($line==='DATA') {
            fwrite($client,"354 End with dot\r\n");
            while (($data=fgets($client)) !== false && rtrim($data,"\r\n")!=='.') $message.=$data;
            file_put_contents($dir.'/received.jsonl',json_encode(['recipients'=>$recipients,'mode'=>$mode,'message'=>$message])."\n",FILE_APPEND);
            if ($mode==='uncertain') break;
            fwrite($client,$mode==='rejected' ? "550 Submission rejected fixture-password TOKEN_SECRET\r\n" : "250 Message accepted\r\n");
        } elseif ($line==='QUIT') { fwrite($client,"221 Bye\r\n"); break; }
        elseif ($line==='RSET' || $line==='NOOP') fwrite($client,"250 OK\r\n");
        else fwrite($client,"500 Unsupported\r\n");
    }
    fclose($client);
}
fclose($server);
