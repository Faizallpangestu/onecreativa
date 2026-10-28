<?php
function budget_http_checks(mysqli $db, string $testName): void {
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
    if (!$socket) throw new RuntimeException('Cannot allocate test port');
    $address = stream_socket_get_name($socket, false); fclose($socket);
    $port = (int)substr($address, strrpos($address, ':') + 1);
    putenv("CREATIVA_RAB_TEST_DB=$testName");
    $logPath = tempnam(sys_get_temp_dir(), 'rab-http-');
    $server = proc_open([PHP_BINARY, '-d', 'session.save_path=' . sys_get_temp_dir(), '-d', 'upload_tmp_dir=' . sys_get_temp_dir(), '-S', "127.0.0.1:$port", __DIR__ . '/budget_test_router.php'],
        [['pipe','r'],['file',$logPath,'a'],['file',$logPath,'a']], $pipes, dirname(__DIR__, 2));
    if (!is_resource($server)) throw new RuntimeException('Cannot start test API');
    fclose($pipes[0]);
    $baseUrl = "http://127.0.0.1:$port/";
    try {
        for ($attempt = 0; $attempt < 60; $attempt++) {
            $ready = @stream_socket_client("tcp://127.0.0.1:$port", $errno, $errstr, .1);
            if ($ready) { fclose($ready); break; }
            usleep(100000);
        }
        $send = function (string $endpoint, string $method = 'GET', ?array $data = null, string $cookie = '', string $csrf = '', ?string $image = null, string $filename = 'reference.png') use ($baseUrl): array {
            $headers = ['Content-Type: application/json'];
            $content = $data === null ? '' : json_encode($data);
            if ($image !== null) {
                $boundary = 'rabtest' . bin2hex(random_bytes(8));
                $headers = ['Content-Type: multipart/form-data; boundary=' . $boundary];
                $content = "--$boundary\r\nContent-Disposition: form-data; name=\"payload\"\r\n\r\n" . json_encode($data)
                    . "\r\n--$boundary\r\nContent-Disposition: form-data; name=\"attachment\"; filename=\"$filename\"\r\nContent-Type: image/png\r\n\r\n$image\r\n--$boundary--\r\n";
            }
            if ($cookie) $headers[] = "Cookie: $cookie";
            if ($csrf) $headers[] = "X-CSRF-Token: $csrf";
            $context = stream_context_create(['http' => ['method' => $method, 'header' => implode("\r\n", $headers),
                'content' => $content, 'ignore_errors' => true, 'timeout' => 10]]);
            $body = file_get_contents($baseUrl . $endpoint, false, $context);
            $responseHeaders = $http_response_header ?? [];
            preg_match('/\s(\d{3})\s/', $responseHeaders[0] ?? '', $match);
            $resultCookie = '';
            foreach ($responseHeaders as $header) if (stripos($header, 'Set-Cookie:') === 0) $resultCookie = explode(';', trim(substr($header, 11)))[0];
            $json = json_decode($body, true);
            if (!is_array($json) && !str_contains($endpoint, 'image=')) throw new RuntimeException('Invalid test API JSON: ' . substr($body, 0, 300));
            return ['code' => (int)($match[1] ?? 0), 'json' => $json, 'cookie' => $resultCookie, 'body' => $body, 'headers' => $responseHeaders];
        };
        verify($send('budgets.php')['code'] === 401, 'Unauthenticated RAB API denied');
        $login = $send('login.php', 'POST', ['email'=>'finance@test','password'=>'isolated-test-only']);
        verify($login['json']['status'] === 'success' && $login['cookie'] !== '', 'Login establishes server session');
        $financeCookie = $login['cookie'];
        $list = $send('budgets.php', 'GET', null, $financeCookie);
        verify($list['json']['permissions']['can_submit'] && !$list['json']['permissions']['can_approve'], 'Finance receives submit-only API permissions');
        $financeCsrf = $list['json']['csrf_token'];
        $input = submission('66666666-6666-6666-6666-666666666666', true, '2026-12');
        verify($send('budgets.php', 'POST', $input, $financeCookie)['code'] === 403, 'Mutation without CSRF denied');
        $created = $send('budgets.php', 'POST', $input + ['user_id'=>2,'role'=>'admin'], $financeCookie, $financeCsrf);
        verify($created['code'] === 200 && (int)$created['json']['data']['created_by'] === 1, 'Actor spoof ignored: submission belongs to actual Finance');
        $request = $created['json']['data'];
        $decision = ['action'=>'approve','id'=>$request['id'],'version'=>$request['version']];
        verify($send('budgets.php', 'POST', $decision + ['role'=>'admin'], $financeCookie, $financeCsrf)['code'] === 403, 'Finance approval rejected through API');
        $adminLogin = $send('login.php', 'POST', ['email'=>'admin@test','password'=>'isolated-test-only']);
        $adminCookie = $adminLogin['cookie'];
        $adminList = $send('budgets.php', 'GET', null, $adminCookie);
        verify($adminList['json']['permissions']['can_approve'] && !$adminList['json']['permissions']['can_submit'], 'Admin receives decision-only API permissions');
        $approved = $send('budgets.php', 'POST', $decision, $adminCookie, $adminList['json']['csrf_token']);
        verify($approved['code'] === 200 && $approved['json']['data']['status'] === 'approved', 'Admin approves through authenticated API');
        $incomeId = $approved['json']['data']['finance_record_id'];
        verify($send('finance.php?id='.$incomeId, 'PUT', ['amount'=>1],$financeCookie,$financeCsrf)['code'] === 409, 'Approved RAB income cannot be edited through finance API');
        verify($send('finance.php?id='.$incomeId, 'DELETE',null,$financeCookie,$financeCsrf)['code'] === 409, 'Approved RAB income cannot be deleted through finance API');
        $income = $send('finance.php?type=income','GET',null,$financeCookie)['json']['data'];
        verify(count(array_filter($income, fn($row) => (int)$row['budget_request_id'] === (int)$request['id'])) === 0, 'Approval absent from cash income list');
        $monthly = $send('budgets.php?month=2026-12', 'GET', null, $adminCookie)['json']['data'];
        verify(count($monthly) === 1 && $monthly[0]['id'] === $request['id'], 'API RAB month filter works');
        $submittedMonth = $send('budgets.php?month='.date('Y-m').'&month_by=submitted', 'GET', null, $adminCookie)['json']['data'];
        verify(count(array_filter($submittedMonth, fn($row) => $row['id'] === $request['id'])) === 1, 'API submission month filter uses actual submission timestamp');
        $history = $send('budgets.php?id='.$request['id'], 'GET', null, $adminCookie)['json']['data']['history'];
        verify(count($history) === 3 && $history[0]['actor_name'] === 'admin@test', 'API returns complete audit history with verified reviewer');
        budget_attachment_http_checks($send, $db, $testName, $financeCookie, $financeCsrf, $adminCookie);
        verify($send('logout.php', 'POST', [], $adminCookie, $adminList['json']['csrf_token'])['code'] === 200 && $send('budgets.php', 'GET', null, $adminCookie)['code'] === 401, 'Logout invalidates server session');
        $db->query('UPDATE users SET is_active=1 WHERE id=3');
        $gaLogin = $send('login.php', 'POST', ['email'=>'ga@test','password'=>'isolated-test-only']);
        verify($send('budgets.php', 'GET', null, $gaLogin['cookie'])['code'] === 403, 'Other authenticated roles cannot access RAB API');
    } finally {
        proc_terminate($server); proc_close($server);
        unlink($logPath);
        putenv('CREATIVA_RAB_TEST_DB');
        $imageDirectory = sys_get_temp_dir() . '/' . $testName . '_images';
        foreach (glob($imageDirectory . '/*.bin') ?: [] as $imageFile) {
            if (preg_match('/^[a-f0-9]{32}\.bin$/D', basename($imageFile))) unlink($imageFile);
        }
        if (is_dir($imageDirectory)) rmdir($imageDirectory);
    }
}

function budget_attachment_http_checks(callable $send, mysqli $db, string $testName, string $cookie, string $csrf, string $adminCookie): void {
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN2kAAAAASUVORK5CYII=');
    $input = submission('77777777-7777-7777-7777-777777777777');
    $input['attachment_action'] = 'upload'; $input['attachment_link'] = 'https://example.com/penawaran?barang=kertas';
    $created = $send('budgets.php', 'POST', $input, $cookie, $csrf, $png);
    verify($created['code'] === 200 && $created['json']['data']['attachment_key'] !== null, 'Real multipart PNG upload stored with RAB');
    $request = $created['json']['data']; $key = $request['attachment_key'];
    verify($request['attachment_name'] === 'reference.png' && $request['attachment_link'] === $input['attachment_link'], 'Image name and optional reference link stored together');
    $snapshot = json_decode($request['history'][0]['snapshot_json'], true);
    verify($snapshot['attachment_key'] === $key && $snapshot['attachment_link'] === $input['attachment_link'], 'Attachment included in audit snapshot');
    $url = 'budgets.php?id=' . $request['id'] . '&image=' . $key;
    $image = $send($url, 'GET', null, $adminCookie);
    verify($image['code'] === 200 && $image['body'] === $png && in_array('Content-Type: image/png', $image['headers']), 'Admin can view the exact uploaded image');
    verify($send($url)['code'] === 401, 'Unauthenticated image access denied');
    verify($send('budgets.php?id=1&image='.$key, 'GET', null, $cookie)['code'] === 404, 'Image cannot be read through an unrelated RAB');
    verify($send('budgets.php?id='.$request['id'].'&image=../../config/database.php', 'GET', null, $cookie)['code'] === 404, 'Image endpoint rejects path traversal');
    $save = ['action'=>'save', 'id'=>$request['id'], 'version'=>$request['version']] + $input;
    $replacement = $send('budgets.php', 'POST', $save, $cookie, $csrf, $png, 'replacement.png');
    verify($replacement['code'] === 200 && $replacement['json']['data']['attachment_key'] !== $key, 'Draft image can be replaced');
    verify($send($url, 'GET', null, $adminCookie)['body'] === $png, 'Old image remains available for audit history');
    $request = $replacement['json']['data'];
    $directory = sys_get_temp_dir() . '/' . $testName . '_images';
    $count = count(glob($directory.'/*.bin') ?: []);
    verify($send('budgets.php', 'POST', $save, $cookie, $csrf, $png)['code'] === 409 && count(glob($directory.'/*.bin') ?: []) === $count, 'Stale upload does not leave orphaned image');
    $bad = $input; $bad['request_key'] = '88888888-8888-8888-8888-888888888888';
    verify($send('budgets.php', 'POST', $bad, $cookie, $csrf, '<svg xmlns="http://www.w3.org/2000/svg"></svg>')['code'] === 422, 'Fake PNG/SVG upload rejected based on file content');
    verify($send('budgets.php', 'POST', $bad, $cookie, $csrf, str_repeat('x', 2*1024*1024+1))['code'] === 422, 'Image larger than 2 MB rejected');
    $bad['attachment_action'] = 'keep';
    foreach (['javascript:alert(1)', 'file:///etc/passwd', 'https://user:password@example.com', 'not a URL'] as $badLink) {
        $bad['attachment_link'] = $badLink;
        verify($send('budgets.php', 'POST', $bad, $cookie, $csrf)['code'] === 422, 'Unsafe or invalid reference URL rejected');
    }
    $db->query("CREATE TRIGGER fail_image_history BEFORE INSERT ON budget_request_history FOR EACH ROW BEGIN IF NEW.action='create' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Attachment rollback test'; END IF; END");
    $failedInput = $input; $failedInput['request_key'] = $bad['request_key'];
    try {
        verify($send('budgets.php', 'POST', $failedInput, $cookie, $csrf, $png)['code'] === 500 && count(glob($directory.'/*.bin') ?: []) === $count, 'Failed database transaction removes newly uploaded file');
    } finally { $db->query('DROP TRIGGER fail_image_history'); }
    $cancelled = $send('budgets.php', 'POST', ['action'=>'cancel','id'=>$request['id'],'version'=>$request['version']], $cookie, $csrf)['json']['data'];
    $copy = submission('99999999-9999-9999-9999-999999999999');
    $copy['copy_attachment_from'] = $cancelled['id'];
    $copy['attachment_link'] = $cancelled['attachment_link'];
    $copied = $send('budgets.php', 'POST', $copy, $cookie, $csrf)['json']['data'];
    verify($copied['attachment_key'] === $cancelled['attachment_key'], 'New submission can retain image from cancelled RAB');
    $remove = ['action'=>'save','id'=>$copied['id'],'version'=>$copied['version'],'attachment_action'=>'remove','attachment_link'=>''] + $copy;
    $removed = $send('budgets.php', 'POST', $remove, $cookie, $csrf)['json']['data'];
    verify($removed['attachment_key'] === null && $removed['attachment_link'] === null, 'Draft image and reference link can be removed');
    verify($send('budgets.php?id='.$removed['id'].'&image='.$copied['attachment_key'], 'GET', null, $adminCookie)['body'] === $png, 'Removed image still accessible from historical snapshot');
    $submitted = $send('budgets.php', 'POST', ['action'=>'submit','id'=>$removed['id'],'version'=>$removed['version']], $cookie, $csrf)['json']['data'];
    verify($send('budgets.php', 'POST', ['version'=>$submitted['version']] + $remove, $cookie, $csrf)['code'] === 409, 'Submitted attachment edits denied');
    $retry = $send('budgets.php', 'POST', $input, $cookie, $csrf, $png)['json']['data'];
    verify($retry['id'] === $created['json']['data']['id'] && count(glob($directory.'/*.bin') ?: []) === $count, 'Retried multipart create produces no extra files or requests');
}
