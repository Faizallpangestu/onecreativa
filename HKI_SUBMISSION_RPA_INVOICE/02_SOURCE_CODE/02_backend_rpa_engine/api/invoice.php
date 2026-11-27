<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/api_session_guard.php';
$actor=api_session_guard($conn,$_SERVER['REQUEST_METHOD']==='GET'?'read':'prepare');
if($_SERVER['REQUEST_METHOD']==='DELETE'){http_response_code(409);echo json_encode(['status'=>'error','message'=>'Dokumen finansial tetap disimpan untuk audit. Gunakan reversal atau pembatalan setelah review.']);exit;}

function respond($code, $payload) { http_response_code($code); echo json_encode($payload); exit; }

$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__.'/../services/relationships.php';
if($method==='GET'&&($_GET['view']??'')==='file'){$row=ac_one($conn,'SELECT file_path FROM invoice_records WHERE id=?',[ac_id($_GET['id']??null)]);if(!$row)ac_fail('Dokumen tidak ditemukan.',404);rs_file('invoice',basename($row['file_path']??''),'invoice');}


if ($method === 'GET') {
  $action = $_GET['action'] ?? '';
  if ($action === 'invoices') {
    $client_id = (int)($_GET['client_id'] ?? 0);
    $res = mysqli_query($conn, "SELECT * FROM invoice_records WHERE client_id = $client_id ORDER BY created_at ASC");
    $rows = [];
    while ($row = mysqli_fetch_assoc($res)){$row['payment_status']='needs_review';$rows[]=$row;}
    respond(200, ['status' => 'success', 'data' => $rows]);
  }
  $program_type = mysqli_real_escape_string($conn, $_GET['program_type'] ?? 'intensif_offline');
  $res = mysqli_query($conn, "SELECT c.*, 
    COALESCE((SELECT SUM(pa.amount) FROM accounting_source_documents doc JOIN payment_allocations pa ON pa.source_document_id=doc.id JOIN accounting_transactions t ON t.id=pa.transaction_id JOIN journal_entries j ON j.id=t.journal_entry_id WHERE doc.source_type='invoice_client' AND doc.source_id=CAST(c.id AS CHAR) AND pa.is_reversed=0 AND t.payment_status='verified' AND t.journal_status='posted' AND j.status='posted'), 0) as total_paid,
    (SELECT COUNT(*) FROM invoice_records WHERE client_id = c.id) as invoice_count
    FROM invoice_clients c WHERE c.program_type = '$program_type' ORDER BY c.created_at DESC");
  $rows = [];
  while ($row = mysqli_fetch_assoc($res)) $rows[] = $row;
  respond(200, ['status' => 'success', 'data' => $rows]);
}

if($method==='POST'){require_once __DIR__.'/../services/document_mutations.php';$result=match($_POST['action']??''){'add_client'=>dm_invoice_client($conn,$actor,$_POST),'add_invoice'=>dm_invoice_receipt($conn,$actor,$_POST),default=>ac_fail('Action tidak dikenali.')};respond(201,['status'=>'success','id'=>$result['id'],'data'=>$result]);}
respond(405, ['status' => 'error', 'message' => 'Method not allowed']);
