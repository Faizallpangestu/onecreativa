<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/budget_schema.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$testName = 'one_creativa_rab_test_' . bin2hex(random_bytes(6));
$original = $conn->query('SELECT DATABASE()')->fetch_row()[0];
if (!preg_match('/^one_creativa_rab_test_[a-f0-9]{12}$/D', $testName) || $testName === $original) throw new RuntimeException('Invalid test database');
$socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
$address = stream_socket_get_name($socket, false); fclose($socket);
$port = (int)substr($address, strrpos($address, ':') + 1);
$readyPath = $argv[1] ?? sys_get_temp_dir() . '/creativa-rab-ui-ready.json';
if (realpath(dirname($readyPath)) !== realpath(sys_get_temp_dir()) || !preg_match('/^creativa-rab-ui-[a-z0-9-]+\.json$/D', basename($readyPath))) throw new RuntimeException('Fixture files must be in temporary directory');
$stopPath = $readyPath . '.stop';
$conn->query("CREATE DATABASE `$testName`");
$conn->select_db($testName);
$server = null;
$logPath = tempnam(sys_get_temp_dir(), 'rab-ui-');
try {
    $conn->query('CREATE TABLE roles(id INT PRIMARY KEY,name VARCHAR(50)) ENGINE=InnoDB');
    $conn->query('CREATE TABLE users(id INT PRIMARY KEY,role_id INT,is_active INT DEFAULT 1,email VARCHAR(100),password_hash VARCHAR(255)) ENGINE=InnoDB');
    $conn->query('CREATE TABLE employees(id INT PRIMARY KEY,user_id INT,full_name VARCHAR(100),gender VARCHAR(20),photo_url VARCHAR(200),employee_code VARCHAR(30),position VARCHAR(100)) ENGINE=InnoDB');
    $conn->query("INSERT INTO roles VALUES(1,'finance'),(2,'admin')");
    $hash = $conn->real_escape_string(password_hash('isolated-test-only', PASSWORD_DEFAULT));
    $conn->query("INSERT INTO users VALUES(1,1,1,'finance@test','$hash'),(2,2,1,'admin@test','$hash')");
    $conn->query("CREATE TABLE finance_records(id INT AUTO_INCREMENT PRIMARY KEY,type ENUM('income','expense'),category VARCHAR(100),amount DECIMAL(15,2),description TEXT,source VARCHAR(255),transaction_date DATE,created_by INT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,bank_name VARCHAR(255),account_name VARCHAR(255),account_number VARCHAR(100)) ENGINE=InnoDB");
    install_budget_schema($conn);
    putenv("CREATIVA_RAB_TEST_DB=$testName");
    $server = proc_open([PHP_BINARY,'-d','session.save_path='.sys_get_temp_dir(),'-d','upload_tmp_dir='.sys_get_temp_dir(),'-S',"127.0.0.1:$port",__DIR__.'/budget_test_router.php'],
        [['pipe','r'],['file',$logPath,'a'],['file',$logPath,'a']], $pipes, dirname(__DIR__,2));
    if (!is_resource($server)) throw new RuntimeException('Fixture server failed');
    fclose($pipes[0]);
    if (file_exists($stopPath)) unlink($stopPath);
    file_put_contents($readyPath,json_encode(['url'=>"http://127.0.0.1:$port/",'stopPath'=>$stopPath]));
    echo "Isolated UI fixture ready.\n";
    $deadline = time()+300;
    while (time()<$deadline && !file_exists($stopPath)) usleep(200000);
} finally {
    if (is_resource($server)) { proc_terminate($server); proc_close($server); }
    unlink($logPath);
    $conn->select_db($original); $conn->query("DROP DATABASE `$testName`");
    $imageDirectory = sys_get_temp_dir() . '/' . $testName . '_images';
    foreach (glob($imageDirectory . '/*.bin') ?: [] as $imageFile) {
        if (preg_match('/^[a-f0-9]{32}\.bin$/D', basename($imageFile))) unlink($imageFile);
    }
    if (is_dir($imageDirectory)) rmdir($imageDirectory);
    if (file_exists($readyPath)) unlink($readyPath);
    if (file_exists($stopPath)) unlink($stopPath);
    echo "Isolated UI fixture removed.\n";
}
