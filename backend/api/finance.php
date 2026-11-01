<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/api_session_guard.php';
require_once __DIR__.'/../services/accounting_reports.php';
$actor=api_session_guard($conn,'read');
if($_SERVER['REQUEST_METHOD']==='POST'){
  try{
    ac_require($conn,$actor,'prepare');
    $action=$_POST['action']??'';
    if($action!=='attach_proof')ac_fail('Aksi finance historis tidak dikenal.',400);
    $id=ac_id($_POST['id']??null,'ID transaksi');
    $row=ac_one($conn,'SELECT * FROM finance_records WHERE id=?',[$id]);
    if(!$row)ac_fail('Transaksi historis tidak ditemukan.',404);
    $hasPhoto=ac_one($conn,"SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='photo_path'")!==null;
    $hasLink=ac_one($conn,"SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='finance_records' AND COLUMN_NAME='drive_link'")!==null;
    if(!$hasPhoto&&!$hasLink)ac_fail('Kolom bukti transaksi belum tersedia di database.',409);
    $link=trim((string)($_POST['link']??''));
    if($link&&(!filter_var($link,FILTER_VALIDATE_URL)||!in_array(parse_url($link,PHP_URL_SCHEME),['http','https'],true)))ac_fail('Link bukti harus HTTP(S).');
    $photoPath=null;
    $upload=$_FILES['proof']??null;
    if($upload&&($upload['error']??UPLOAD_ERR_NO_FILE)===UPLOAD_ERR_OK){
      if(!is_uploaded_file($upload['tmp_name']??'')||filesize($upload['tmp_name'])>5*1024*1024)ac_fail('Bukti maksimal 5 MB.');
      $mime=(new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']);
      if(!in_array($mime,['image/jpeg','image/png','image/webp','application/pdf'],true))ac_fail('Bukti harus JPG/PNG/WebP/PDF.');
      $dir=__DIR__.'/../uploads/finance_proofs';
      if(!is_dir($dir)&&!mkdir($dir,0750,true))ac_fail('Folder bukti transaksi tidak tersedia.',500);
      $ext=strtolower(pathinfo($upload['name']??'',PATHINFO_EXTENSION));
      if(!in_array($ext,['jpg','jpeg','png','webp','pdf'],true))$ext=$mime==='application/pdf'?'pdf':'jpg';
      $photoPath='finance_proofs/'.bin2hex(random_bytes(16)).'.'.$ext;
      if(!move_uploaded_file($upload['tmp_name'],$dir.'/'.basename($photoPath)))ac_fail('Bukti gagal disimpan.',500);
    }
    $sets=[];$params=[];
    if($hasPhoto&&$photoPath){$sets[]='photo_path=?';$params[]=$photoPath;}
    if($hasLink){$sets[]='drive_link=?';$params[]=$link?:null;}
    if(!$sets)ac_fail('Bukti belum diisi.');
    $params[]=$id;ac_query($conn,'UPDATE finance_records SET '.implode(', ',$sets).' WHERE id=?',$params);
    echo json_encode(['status'=>'success','message'=>'Bukti transaksi tersimpan.','photo_path'=>$photoPath,'drive_link'=>$link?:null]);exit;
  }catch(AccountingException $e){http_response_code($e->getCode()?:422);echo json_encode(['status'=>'error','message'=>$e->getMessage()]);exit;}
  catch(Throwable $e){error_log('Finance proof upload: '.$e->getMessage());http_response_code(500);echo json_encode(['status'=>'error','message'=>'Bukti transaksi gagal disimpan.']);exit;}
}
if($_SERVER['REQUEST_METHOD']!=='GET'){http_response_code(409);echo json_encode(['status'=>'error','message'=>'Gunakan Buku Transaksi untuk transaksi baru.']);exit;}
try{
  if(($_GET['view']??'')==='photo'){
    $id=ac_id($_GET['id']??null,'ID transaksi');$row=ac_one($conn,'SELECT photo_path FROM finance_records WHERE id=?',[$id]);$stored=trim((string)($row['photo_path']??''));
    if(!$stored)ac_fail('Bukti foto tidak ditemukan.',404);
    if(preg_match('/^https?:\/\//i',$stored)){header('Location: '.$stored,302);exit;}
    $relative=str_replace('\\','/',ltrim($stored,'/'));
    if(str_contains($relative,'..'))ac_fail('Bukti foto tidak valid.',400);
    $candidates=[__DIR__.'/../uploads/'.$relative,__DIR__.'/../'.$relative,__DIR__.'/../storage/'.$relative];$file=null;
    foreach($candidates as $candidate){$real=realpath($candidate);if($real&&is_file($real)){$file=$real;break;}}
    if(!$file)ac_fail('File bukti foto tidak ditemukan.',404);
    header('Content-Type: '.((new finfo(FILEINFO_MIME_TYPE))->file($file)?:'application/octet-stream'));header('Content-Disposition: inline; filename="'.basename($file).'"');readfile($file);exit;
  }
  $where=[];$params=[];
  if(!empty($_GET['type'])){if(!in_array($_GET['type'],['income','expense'],true))ac_fail('Jenis tidak valid.');$where[]='f.type=?';$params[]=$_GET['type'];}
  if(!empty($_GET['month'])){$month=ac_id($_GET['month']);if($month>12)ac_fail('Bulan tidak valid.');$where[]='MONTH(f.transaction_date)=?';$params[]=$month;}
  if(!empty($_GET['year'])){$year=(string)$_GET['year'];if(!preg_match('/^\d{4}$/D',$year))ac_fail('Tahun tidak valid.');$where[]='YEAR(f.transaction_date)=?';$params[]=$year;}
  $sql='SELECT f.*,e.full_name AS creator_name FROM finance_records f LEFT JOIN employees e ON e.user_id=f.created_by'.($where?' WHERE '.implode(' AND ',$where):'').' ORDER BY f.transaction_date DESC,f.id DESC';
  $summary=null;$coverage=null;
  // The legacy transaction list must remain available even when an optional
  // reporting module has an incomplete production schema. Reporting failure
  // must never hide the historical finance_records rows.
  if(ac_table($conn,'journal_entries')){
    try{
      $reports=ac_reports($conn,$_GET);
      $summary=['revenue'=>$reports['profit_loss']['revenue'],'net_profit'=>$reports['profit_loss']['net_profit'],'cash_bank'=>$reports['balance_sheet']['cash_bank']];
      $coverage=$reports['coverage'];
    }catch(Throwable $reportError){
      error_log('Legacy finance report skipped: '.$reportError->getMessage());
    }
  }
  echo json_encode(['status'=>'success','data'=>ac_rows($conn,$sql,$params),'summary'=>$summary,'coverage'=>$coverage,'notice'=>'Catatan legacy belum otomatis menjadi jurnal. Selisih kas bukan laba akuntansi.']);
}catch(AccountingException $e){http_response_code($e->getCode());echo json_encode(['status'=>'error','message'=>$e->getMessage()]);}
catch(Throwable $e){error_log('Legacy finance: '.$e->getMessage());http_response_code(500);echo json_encode(['status'=>'error','message'=>'Transaksi historis gagal dimuat.']);}
