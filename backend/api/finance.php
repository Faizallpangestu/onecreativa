<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/api_session_guard.php';
require_once __DIR__.'/../services/accounting_reports.php';
$actor=api_session_guard($conn,'read');
if($_SERVER['REQUEST_METHOD']!=='GET'){http_response_code(409);echo json_encode(['status'=>'error','message'=>'Gunakan Buku Transaksi untuk draft, approval, pembayaran, dan reversal. Catatan historis tetap disimpan.']);exit;}
try{
  $where=[];$params=[];
  if(!empty($_GET['type'])){if(!in_array($_GET['type'],['income','expense'],true))ac_fail('Jenis tidak valid.');$where[]='f.type=?';$params[]=$_GET['type'];}
  if(!empty($_GET['month'])){$month=ac_id($_GET['month']);if($month>12)ac_fail('Bulan tidak valid.');$where[]='MONTH(f.transaction_date)=?';$params[]=$month;}
  if(!empty($_GET['year'])){$year=(string)$_GET['year'];if(!preg_match('/^\d{4}$/D',$year))ac_fail('Tahun tidak valid.');$where[]='YEAR(f.transaction_date)=?';$params[]=$year;}
  $sql='SELECT f.*,e.full_name AS creator_name FROM finance_records f LEFT JOIN employees e ON e.user_id=f.created_by'.($where?' WHERE '.implode(' AND ',$where):'').' ORDER BY f.transaction_date DESC,f.id DESC';
  $summary=null;$coverage=null;
  if(ac_table($conn,'journal_entries')){$reports=ac_reports($conn,$_GET);$summary=['revenue'=>$reports['profit_loss']['revenue'],'net_profit'=>$reports['profit_loss']['net_profit'],'cash_bank'=>$reports['balance_sheet']['cash_bank']];$coverage=$reports['coverage'];}
  echo json_encode(['status'=>'success','data'=>ac_rows($conn,$sql,$params),'summary'=>$summary,'coverage'=>$coverage,'notice'=>'Catatan legacy belum otomatis menjadi jurnal. Selisih kas bukan laba akuntansi.']);
}catch(AccountingException $e){http_response_code($e->getCode());echo json_encode(['status'=>'error','message'=>$e->getMessage()]);}
catch(Throwable $e){error_log('Legacy finance: '.$e->getMessage());http_response_code(500);echo json_encode(['status'=>'error','message'=>'Transaksi historis gagal dimuat.']);}
