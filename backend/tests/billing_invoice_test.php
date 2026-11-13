<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
// Refuse production/remote configuration before database.php can connect or fall back.
[$host, $database] = (static function () {
    $DB_HOST = 'localhost'; $DB_NAME = 'one-creativa';
    $file = __DIR__.'/../config/db_env.php';
    if (is_file($file)) require $file;
    return [$DB_HOST, $DB_NAME];
})();
if (!in_array($host, ['localhost', '127.0.0.1', '::1'], true) || !preg_match('/(?:_dev|_test)$/D', $database)) {
    throw new RuntimeException('Billing tests require a local development/test database configuration.');
}
$_SERVER['HTTP_HOST'] = '127.0.0.1';
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/billing_invoice.php';
$original = ac_one($conn, 'SELECT DATABASE() AS name')['name'];
$testName = 'one_creativa_accounting_test_'.bin2hex(random_bytes(6));
$conn->query("CREATE DATABASE `$testName` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
$conn->select_db($testName);
$checks = 0; $server = null; $log = null;
function billing_check(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException('FAILED: '.$message);
    $GLOBALS['checks']++;
    echo "PASS: $message\n";
}
try {
    $conn->query('CREATE TABLE roles(id TINYINT UNSIGNED PRIMARY KEY,name VARCHAR(50)) ENGINE=InnoDB');
    $conn->query('CREATE TABLE users(id INT UNSIGNED PRIMARY KEY,email VARCHAR(191),password_hash VARCHAR(255),role_id TINYINT UNSIGNED,is_active TINYINT DEFAULT 1) ENGINE=InnoDB');
    $conn->query('CREATE TABLE employees(id INT UNSIGNED PRIMARY KEY,user_id INT UNSIGNED,full_name VARCHAR(150),employee_code VARCHAR(20),position VARCHAR(100),gender VARCHAR(20),photo_url VARCHAR(255)) ENGINE=InnoDB');
    $conn->query('CREATE TABLE peserta_intensif(id INT PRIMARY KEY,nama_lengkap VARCHAR(255),email VARCHAR(255),no_wa VARCHAR(50),total_biaya DECIMAL(15,2),program VARCHAR(150),kota VARCHAR(100),nis VARCHAR(50),source VARCHAR(50),status VARCHAR(50)) ENGINE=InnoDB');
    $conn->query("CREATE TABLE billing_invoices(id VARCHAR(50) PRIMARY KEY,tanggal VARCHAR(50),customer VARCHAR(255),email VARCHAR(255),phone VARCHAR(50),total DECIMAL(15,2),status VARCHAR(50),jatuhTempo VARCHAR(50),keterangan TEXT,meta_json LONGTEXT,public_token VARCHAR(64),created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    $conn->query('CREATE TABLE billing_pembayaran(id INT AUTO_INCREMENT PRIMARY KEY,noInv VARCHAR(50),tglBayar VARCHAR(50),customer VARCHAR(255),metode VARCHAR(50),jumlah DECIMAL(15,2),sisa DECIMAL(15,2),statusVerif VARCHAR(50),proof_path VARCHAR(255),created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    $conn->query('CREATE TABLE billing_terkirim(id VARCHAR(50),created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    $conn->query('CREATE TABLE accounting_audit_logs(id BIGINT AUTO_INCREMENT PRIMARY KEY,entity_type VARCHAR(50),entity_id VARCHAR(100),action VARCHAR(50),actor_id INT,actor_name VARCHAR(255),details_json LONGTEXT,ip_address VARCHAR(50),hash_prev VARCHAR(64),hash_self VARCHAR(64),created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    $conn->query('CREATE TABLE finance_role_permissions(role_name VARCHAR(50),permission VARCHAR(50),allowed TINYINT,PRIMARY KEY(role_name,permission)) ENGINE=InnoDB');
    $conn->query("INSERT INTO roles VALUES(1,'finance'),(2,'sensei'),(3,'finance_admin')");
    $conn->query("INSERT INTO users(id,email,role_id) VALUES(1,'finance@test',1),(2,'sensei@test',2),(3,'finance-admin@test',3)");
    ac_query($conn, 'UPDATE users SET password_hash=?', [password_hash('isolated-test-only', PASSWORD_DEFAULT)]);
    $conn->query("INSERT INTO peserta_intensif VALUES(1,'Siswa Resmi','student@test.invalid','0812345678',15000000.50,'Intensif','Cianjur','NIS-1','manual','Aktif'),(2,'Siswa Resmi','student@test.invalid','0899999999',18000000,'Intensif','Cianjur','NIS-2','manual','Aktif')");
    foreach (['Paid', 'Lunas', 'Unpaid'] as $index => $status) {
        ac_query($conn, 'INSERT INTO billing_invoices(id,tanggal,customer,email,phone,total,status,jatuhTempo,keterangan,meta_json,public_token) VALUES(?,?,?,?,?,?,?,?,?,?,?)', ['OLD-'.$index, '2026-01-01', 'Legacy', '', '', '1000.00', $status, '2026-01-10', 'Legacy', '{"discount":{"amount":100},"items":[{"price":1100}]}', str_repeat((string)($index + 1), 32)]);
    }
    $conn->query("INSERT INTO billing_pembayaran(noInv,jumlah,statusVerif) VALUES('OLD-2',200,'Terverifikasi')");
    $legacy = ac_rows($conn, "SELECT * FROM billing_invoices WHERE id LIKE 'OLD-%' ORDER BY id");

    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
    if (!$socket) throw new RuntimeException('Test port unavailable');
    $address = stream_socket_get_name($socket, false); fclose($socket);
    $port = (int)substr($address, strrpos($address, ':') + 1);
    putenv('CREATIVA_RAB_TEST_DB='.$testName);
    $log = tempnam(sys_get_temp_dir(), 'billing-http-');
    $server = proc_open([PHP_BINARY, '-d', 'session.save_path="'.str_replace('\\', '/', sys_get_temp_dir()).'"', '-S', '127.0.0.1:'.$port, __DIR__.'/budget_test_router.php'], [['pipe','r'],['file',$log,'a'],['file',$log,'a']], $pipes, dirname(__DIR__, 2));
    if (!is_resource($server)) throw new RuntimeException('Cannot start isolated HTTP tests');
    fclose($pipes[0]);
    for ($i = 0; $i < 60; $i++) {
        $ready = @stream_socket_client('tcp://127.0.0.1:'.$port, $errno, $errstr, .1);
        if ($ready) { fclose($ready); break; }
        usleep(100000);
    }
    $send = function (string $endpoint, ?array $body = null, string $cookie = '', string $csrf = '') use ($port): array {
        $headers = ['Content-Type: application/json'];
        if ($cookie) $headers[] = 'Cookie: '.$cookie;
        if ($csrf) $headers[] = 'X-CSRF-Token: '.$csrf;
        $context = stream_context_create(['http' => ['method' => $body === null ? 'GET' : 'POST', 'header' => implode("\r\n", $headers), 'content' => $body === null ? '' : json_encode($body), 'ignore_errors' => true, 'timeout' => 15]]);
        $raw = file_get_contents('http://127.0.0.1:'.$port.'/'.$endpoint, false, $context);
        $responseHeaders = $http_response_header ?? [];
        preg_match('/\s(\d{3})\s/', $responseHeaders[0] ?? '', $match);
        $session = '';
        foreach ($responseHeaders as $header) if (str_starts_with(strtolower($header), 'set-cookie:')) $session = explode(';', trim(substr($header, 11)))[0];
        return ['code' => (int)($match[1] ?? 0), 'json' => json_decode($raw, true), 'cookie' => $session];
    };
    $base = ['action' => 'add_invoice', 'id' => 'INV-VALID', 'student_id' => 1, 'tanggal' => '2026-11-13', 'jatuhTempo' => '2026-11-20', 'total' => '15000000.50', 'status' => 'Unpaid'];
    billing_check($send('billing.php', $base)['code'] === 401, 'Anonymous creation returns 401');
    $login = $send('login.php', ['email' => 'finance@test', 'password' => 'isolated-test-only']);
    billing_check($login['code'] === 200 && $login['cookie'] !== '', 'Login establishes a real session');
    $cookie = $login['cookie'];
    $csrf = $send('session.php', null, $cookie)['json']['csrf_token'];
    billing_check($send('billing.php', $base, $cookie)['code'] === 403, 'Missing CSRF returns 403');
    $create = fn(array $patch) => $send('billing.php', array_replace($base, ['id' => 'INV-'.bin2hex(random_bytes(5))], $patch), $cookie, $csrf);
    $valid = $create(['id' => 'INV-VALID', 'customer' => 'Spoofed', 'email' => 'fake@test.invalid', 'phone' => 'fake', 'program' => 'Fake program', 'meta_json' => '{"total":1}']);
    billing_check($valid['code'] === 200 && $valid['json'] === ['status' => 'success', 'data' => ['id' => 'INV-VALID']], 'Official amount creates invoice with existing success envelope');
    $stored = ac_one($conn, "SELECT * FROM billing_invoices WHERE id='INV-VALID'");
    $meta = json_decode($stored['meta_json'], true);
    billing_check($stored['status'] === 'Unpaid' && $stored['total'] === '15000000.50' && $stored['customer'] === 'Siswa Resmi' && $stored['email'] === 'student@test.invalid' && $stored['phone'] === '0812345678', 'Identity and amount come from student_id, ignoring spoofed contact data');
    billing_check($meta['student_id'] === 1 && $meta['program'] === 'Intensif' && $meta['subtotal'] === '15000000.50' && $meta['items'][0]['harga'] === '15000000.50' && $meta['discount']['amount'] === '0.00', 'Financial metadata is rebuilt from official fee');
    $audit = ac_one($conn, "SELECT * FROM accounting_audit_logs WHERE entity_type='billing_invoice' AND entity_id='INV-VALID'");
    billing_check((int)$audit['actor_id'] === 1 && json_decode($audit['details_json'], true)['student_id'] === 1 && strlen($audit['hash_self']) === 64, 'Creation retains actor audit and student amount provenance');

    $cases = [
        'Amount manipulation' => ['total' => '1.00'], 'Zero amount' => ['total' => '0'],
        'Negative amount' => ['total' => '-1'], 'Localized amount' => ['total' => '15.000.000,50'],
        'Exponent amount' => ['total' => '1.5e7'], 'Excess precision' => ['total' => '15000000.501'],
        'Float amount' => ['total' => 15000000.5], 'Missing amount' => ['total' => null],
        'Paid status' => ['status' => 'Paid'], 'Partial status' => ['status' => 'Partially Paid'],
        'Legacy paid alias' => ['status' => 'Lunas'], 'Legacy partial alias' => ['status' => 'Sebagian'],
        'Overdue at creation' => ['status' => 'Overdue'], 'Null status' => ['status' => null],
        'Unauthorized discount' => ['discount' => ['value' => 1, 'amount' => 1, 'type' => 'Rp']],
        'Hidden discount value' => ['discount' => ['value' => 10, 'amount' => 0, 'type' => '%']],
        'Missing discount amount' => ['discount' => ['value' => 0]], 'Negative discount' => ['discount' => '-1'],
        'Inconsistent subtotal' => ['subtotal' => '16000000.50'],
        'Inconsistent item' => ['items' => [['harga' => '15000000.50', 'jumlah' => '1']]],
        'Conflicting item aliases' => ['items' => [['harga' => '15000000.50', 'price' => 1, 'jumlah' => '15000000.50']]],
        'Item discount' => ['items' => [['harga' => '15000000.50', 'jumlah' => '15000000.50', 'diskon' => 1]]],
        'Unsupported item split' => ['items' => [['price' => 1, 'amount' => 1], ['price' => '14999999.50', 'amount' => '14999999.50']]],
        'Empty items' => ['items' => []], 'Wrong item quantity' => ['items' => [['qty' => 2, 'price' => '15000000.50', 'amount' => '15000000.50']]],
        'Inconsistent installments' => ['installments' => [['nominal' => 1, 'jatuhTempo' => '2026-11-20']]],
        'Empty installments' => ['installments' => []], 'Zero installment' => ['installments' => [['nominal' => 0, 'jatuhTempo' => '2026-11-20']]],
        'Wrong first due date' => ['installments' => [['nominal' => '15000000.50', 'jatuhTempo' => '2026-11-21']]],
        'Invalid installment date' => ['installments' => [['nominal' => '15000000.50', 'jatuhTempo' => '2026-02-30']]],
        'Wrong scheme' => ['skema' => 'cicilan'], 'Due date before invoice' => ['jatuhTempo' => '2026-11-12'],
        'Missing student_id' => ['student_id' => null], 'Web ID is not student identity' => ['student_id' => null, 'web_id' => 1],
        'Manual flag cannot bypass student validation' => ['student_id' => null, 'invoice_type' => 'manual'],
        'Malformed metadata' => ['includes' => ['bad' => 'value']],
    ];
    $before = ac_one($conn, 'SELECT COUNT(*) AS n FROM billing_invoices')['n'];
    $auditBefore = ac_one($conn, "SELECT COUNT(*) AS n FROM accounting_audit_logs WHERE entity_type='billing_invoice'")['n'];
    foreach ($cases as $label => $patch) {
        $response = $create($patch);
        billing_check($response['code'] === 422 && $response['json']['status'] === 'error' && is_string($response['json']['message']), "$label returns 422");
    }
    billing_check($create(['student_id' => 999])['code'] === 404, 'Unknown student returns 404');
    billing_check($create(['student_id' => 2])['code'] === 422, 'Duplicate names/emails never select another student fee');
    billing_check($create(['id' => 'INV-VALID'])['code'] === 409, 'Duplicate invoice number including identical replay returns 409');
    foreach ([null, '0', '-1'] as $fee) {
        ac_query($conn, 'UPDATE peserta_intensif SET total_biaya=? WHERE id=1', [$fee]);
        billing_check($create([])['code'] === 422, 'Unavailable/nonpositive official fee is rejected: '.var_export($fee, true));
    }
    $conn->query('UPDATE peserta_intensif SET total_biaya=15000000.50 WHERE id=1');
    billing_check(ac_one($conn, 'SELECT COUNT(*) AS n FROM billing_invoices')['n'] === $before && ac_one($conn, "SELECT COUNT(*) AS n FROM accounting_audit_logs WHERE entity_type='billing_invoice'")['n'] === $auditBefore, 'Rejected requests persist neither invoices nor creation audits');

    $schedule = [['nominal' => '5000000.25', 'jatuhTempo' => '2026-11-20', 'status' => 'Paid', 'terbayar' => 5000000], ['nominal' => '10000000.25', 'jatuhTempo' => '2026-12-20']];
    $plan = $create(['id' => 'INV-PLAN', 'skema' => 'cicilan', 'subtotal' => '15000000.50', 'discount' => ['value' => 0, 'amount' => 0], 'items' => [['harga' => '15000000.50', 'jumlah' => '15000000.50', 'diskon' => 0]], 'installments' => $schedule]);
    billing_check($plan['code'] === 200, 'Valid decimal installments and wizard item format accepted');
    $planMeta = json_decode(ac_one($conn, "SELECT meta_json FROM billing_invoices WHERE id='INV-PLAN'")['meta_json'], true);
    billing_check(!isset($planMeta['installments'][0]['status']) && !isset($planMeta['installments'][0]['terbayar']), 'Unvalidated installment payment metadata is discarded');
    billing_check($create(['items' => [['name' => 'Legacy', 'qty' => 1, 'price' => '15000000.50', 'amount' => '15000000.50']]])['code'] === 200, 'Legacy item shape accepted with official amount and student_id');
    $descending = $schedule; $descending[1]['jatuhTempo'] = '2026-11-19';
    billing_check($create(['installments' => $descending])['code'] === 422, 'Out-of-order installment dates rejected');
    $sensei = $send('login.php', ['email' => 'sensei@test', 'password' => 'isolated-test-only'])['cookie'];
    $senseiCsrf = $send('session.php', null, $sensei)['json']['csrf_token'];
    billing_check($send('billing.php', $base, $sensei, $senseiCsrf)['code'] === 403, 'User without prepare permission returns 403');
    $conn->query("INSERT INTO finance_role_permissions VALUES('finance','prepare',0)");
    billing_check($create([])['code'] === 403, 'Configured permission denial overrides finance role defaults');
    $conn->query("DELETE FROM finance_role_permissions WHERE role_name='finance'");
    $financeAdmin = $send('login.php', ['email' => 'finance-admin@test', 'password' => 'isolated-test-only'])['cookie'];
    $financeAdminCsrf = $send('session.php', null, $financeAdmin)['json']['csrf_token'];
    billing_check($send('billing.php', array_replace($base, ['id' => 'INV-ADMIN']), $financeAdmin, $financeAdminCsrf)['code'] === 200, 'Existing finance_admin alias retains creation permission');

    $conn->query('ALTER TABLE peserta_intensif CHANGE total_biaya unavailable_fee DECIMAL(15,2)');
    billing_check($create([])['code'] === 422, 'Missing official fee column fails closed without default pricing');
    $conn->query('ALTER TABLE peserta_intensif CHANGE unavailable_fee total_biaya DECIMAL(15,2)');
    $conn->query('ALTER TABLE billing_invoices CHANGE meta_json unavailable_meta LONGTEXT');
    billing_check($create([])['code'] === 409, 'Missing metadata storage fails closed without runtime migration');
    $conn->query('ALTER TABLE billing_invoices CHANGE unavailable_meta meta_json LONGTEXT');
    $conn->query('RENAME TABLE accounting_audit_logs TO unavailable_audit');
    billing_check($create(['id' => 'INV-ROLLBACK'])['code'] === 500 && !ac_one($conn, "SELECT id FROM billing_invoices WHERE id='INV-ROLLBACK'"), 'Audit failure rolls back invoice insert');
    $conn->query('RENAME TABLE unavailable_audit TO accounting_audit_logs');

    $read = $send('billing.php', null, $cookie);
    billing_check($read['code'] === 200 && $read['json']['status'] === 'success', 'Existing billing GET response still works');
    $old = array_column($read['json']['data']['invoices'], null, 'id');
    billing_check($old['OLD-0']['status'] === 'Paid' && $old['OLD-1']['status'] === 'Paid' && $old['OLD-2']['status'] === 'Partially Paid' && $old['OLD-2']['terbayar'] === '200.00' && $old['OLD-2']['sisa'] === '800.00', 'Legacy Paid/Lunas and verified partial payment balances retain behavior');
    billing_check(ac_rows($conn, "SELECT * FROM billing_invoices WHERE id LIKE 'OLD-%' ORDER BY id") === $legacy, 'Existing invoice rows and legacy metadata remain unchanged');
    echo "PASS: $checks billing invoice integration checks.\n";
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    putenv('CREATIVA_RAB_TEST_DB');
    if ($log && is_file($log)) unlink($log);
    $conn->select_db($original);
    $conn->query("DROP DATABASE `$testName`");
}
