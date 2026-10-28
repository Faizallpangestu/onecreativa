<?php
header('Cache-Control: no-store, private, max-age=0');
header('X-Content-Type-Options: nosniff');
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/../services/salary_slip.php';
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
$conn->query("SET time_zone='+07:00'");
try {
    $actor=session_actor($conn);
    if (!$actor) salary_fail('Silakan masuk kembali untuk mengakses slip gaji.',401);
    $csrf=$_SESSION['csrf_token'];
    if ($_SERVER['REQUEST_METHOD']==='POST') {
        if (!hash_equals($csrf,$_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) salary_fail('Sesi tidak valid. Muat ulang halaman.',403);
        session_write_close();
        $input=json_decode(file_get_contents('php://input'),true,512,JSON_THROW_ON_ERROR);
        if (!is_array($input)) salary_fail('Data slip tidak valid.');
        $id=(int)($input['id'] ?? 0);
        if (($input['action'] ?? '')==='publish') {
            $data=salary_slip_publish($conn,$actor,$input);
            if ($data['created_now']) $data=salary_slip_deliver($conn,$actor,$id);
        } elseif (($input['action'] ?? '')==='retry_email') $data=salary_slip_deliver($conn,$actor,$id);
        else salary_fail('Aksi slip tidak valid.');
    } elseif ($_SERVER['REQUEST_METHOD']==='GET') {
        session_write_close();
        $data=salary_slip_preview($conn,$actor,(int)($_GET['id'] ?? 0));
        if (($_GET['format'] ?? '')==='html') {
            header('Content-Type: text/html; charset=utf-8');
            header("Content-Security-Policy: default-src 'none'; img-src data:; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'");
            echo $data['document_html']; exit;
        }
    } else salary_fail('Method not allowed',405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status'=>'success','data'=>$data,'csrf_token'=>$csrf]);
} catch (SalaryWorkflowException $error) { http_response_code($error->getCode()); header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>$error->getMessage()]); }
catch (JsonException $error) { http_response_code(400); header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>'Format data slip tidak valid.']); }
catch (Throwable $error) { error_log('Salary slip operation failed: '.$error->getMessage()); http_response_code(500); header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>'Slip gagal diproses. Muat ulang untuk memeriksa statusnya.']); }
