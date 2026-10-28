<?php
require_once __DIR__.'/employee_directory.php';
function ot_mutate(mysqli $db,array $a,array $d,string $method):array{
 return ac_atomic($db,function()use($db,$a,$d,$method){
  if($method==='POST'){
   $employee=ac_id($d['employee_id']??null);$row=ac_one($db,'SELECT e.id,e.user_id,u.is_active FROM employees e JOIN users u ON u.id=e.user_id WHERE e.id=? FOR UPDATE',[$employee]);if(!$row||!$row['is_active'])ac_fail('Employee aktif diperlukan.');
   if(!ed_hr($a)&&(int)$row['user_id']!==(int)$a['id'])ac_fail('Data employee berada di luar akses.',403);
   $date=ac_date($d['date']??'');if($date>date('Y-m-d'))ac_fail('Lembur memerlukan tanggal yang sudah terjadi.');$minutes=ac_id($d['overtime_minutes']??null);if($minutes>1440)ac_fail('Durasi lembur tidak valid.');$reason=ac_text($d['reason']??'','Alasan lembur',2000);
   $attendance=empty($d['attendance_id'])?null:ac_id($d['attendance_id']);if($attendance&&!ac_one($db,'SELECT id FROM attendance_logs WHERE id=? AND employee_id=? AND date=?',[$attendance,$employee,$date]))ac_fail('Attendance tidak cocok dengan employee dan tanggal.');
   if(ac_one($db,"SELECT id FROM overtime_requests WHERE employee_id=? AND date=? AND status<>'rejected' FOR UPDATE",[$employee,$date]))ac_fail('Request lembur tanggal ini sudah ada.',409);
   ac_query($db,'INSERT INTO overtime_requests(employee_id,attendance_id,date,overtime_minutes,reason) VALUES(?,?,?,?,?)',[$employee,$attendance,$date,$minutes,$reason]);$id=$db->insert_id;ac_audit($db,$a,'overtime_request',(string)$id,'submitted');return ['id'=>$id];
  }
  if($method!=='PUT')ac_fail('Metode tidak diizinkan.',405);
  if(!in_array($a['role'],['super_admin','manager'],true))ac_fail('Approval lembur hanya reviewer yang diizinkan.',403);
  $id=ac_id($d['id']??null);$action=$d['action']??'';if(!in_array($action,['approve','reject'],true))ac_fail('Keputusan tidak valid.');$r=ac_one($db,'SELECT o.*,e.user_id FROM overtime_requests o JOIN employees e ON e.id=o.employee_id WHERE o.id=? FOR UPDATE',[$id]);if(!$r)ac_fail('Request tidak ditemukan.',404);if((int)$r['user_id']===(int)$a['id'])ac_fail('Reviewer tidak dapat menyetujui request sendiri.',403);if($r['status']!=='pending')ac_fail('Request telah diputuskan.',409);
  $note=ac_text($d['reject_reason']??'','Alasan penolakan',2000,$action==='reject');$attendance=$r['attendance_id'];
  if($action==='approve'){$att=ac_one($db,'SELECT id,check_in_at,check_out_at FROM attendance_logs WHERE employee_id=? AND date=? FOR UPDATE',[(int)$r['employee_id'],$r['date']]);if(!$att||!$att['check_in_at']||!$att['check_out_at']||($attendance&&(int)$attendance!==(int)$att['id'])||strtotime($att['check_out_at'])-strtotime($att['check_in_at'])<(int)$r['overtime_minutes']*60)ac_fail('Approval membutuhkan bukti attendance dengan durasi yang mencukupi.',409);$attendance=(int)$att['id'];}
  $status=$action==='approve'?'approved':'rejected';ac_query($db,'UPDATE overtime_requests SET attendance_id=?,status=?,approved_by=?,approved_at=NOW(),reject_reason=? WHERE id=?',[$attendance,$status,(int)$a['id'],$note,$id]);ac_audit($db,$a,'overtime_request',(string)$id,$status);return ['id'=>$id,'status'=>$status];
 });
}
