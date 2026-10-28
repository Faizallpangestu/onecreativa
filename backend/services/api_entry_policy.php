<?php
// Shared entry policy for legacy endpoints, before any business query or runtime DDL.
require_once __DIR__.'/employee_directory.php';
function api_entry_policy(mysqli $db):void{
 $endpoint=basename($_SERVER['SCRIPT_NAME']??'');
 if(in_array($endpoint,['login.php'],true))return;
 if(preg_match('/^(test|debug|check|fix_|schema_dump|show_tables|migrate|db_|add_status_col|assets_migrate|resolve_map)/i',$endpoint)){http_response_code(404);exit;}
 $deferred=['accounting.php','budgets.php','salaries.php','salary_slips.php','finance.php','finance_dashboard.php','billing.php','invoice.php','reimbursements.php','employees.php','employee_stats.php','profile.php','upload_photo.php','positions.php','attendance.php','leaves.php','session.php','logout.php','dashboard_stats.php','dashboard_karyawan.php','payroll.php','save_payroll.php','publish_payroll.php','relationships.php','student_billing.php','lpk_matching.php'];
 if(in_array($endpoint,$deferred,true)||str_starts_with($endpoint,'lms_')||str_starts_with($endpoint,'lpk_')||$endpoint==='sensei_dashboard_stats.php')return;
 $a=ed_start($db);$method=$_SERVER['REQUEST_METHOD'];$hr=ed_hr($a);$admin=in_array($a['role'],['admin','super_admin'],true);
 if(in_array($endpoint,['daily_reports.php','overtime.php','face_clock.php','face_enroll.php'],true)){
  ed_personal_scope($db,$a);$d=json_decode(file_get_contents('php://input'),true)??$_POST;
  if(!$hr){$own=ac_one($db,'SELECT id FROM employees WHERE user_id=?',[(int)$a['id']]);if(isset($d['employee_id'])&&(int)$d['employee_id']!==(int)$own['id'])ac_fail('Tidak dapat mengubah data employee lain.',403);if($endpoint==='overtime.php'&&$method==='PUT')ac_fail('Approval lembur hanya reviewer.',403);}
  if($method==='DELETE')ac_fail('Histori modul dipertahankan. Gunakan status nonaktif atau pembatalan.',409);
  $_GET['role']=$hr?'admin':'karyawan';$GLOBALS['verified_api_actor']=$a;return;
 }
 $allowed=match($endpoint){
  'assets.php','asset_histories.php','maintenance.php'=>['admin','super_admin','ga'],
  'rfid.php','rfid_scan.php'=>['admin','super_admin','hr','hrd','hr_admin','manager'],
  'departments.php','finance_dashboard.php'=>['admin','super_admin','hr','hrd','hr_admin','manager','finance','finance_admin','ga','director','direktur'],
  'settings.php'=>$method==='GET'?[$a['role']]:['admin','super_admin','hr','hrd','hr_admin','manager'],
  default=>['admin','super_admin']
 };
 if(!in_array($a['role'],$allowed,true))ac_fail('Akses modul tidak diizinkan.',403);
 if($method==='DELETE')ac_fail('Histori modul dipertahankan. Gunakan status nonaktif atau pembatalan.',409);
 $GLOBALS['verified_api_actor']=$a;
}
