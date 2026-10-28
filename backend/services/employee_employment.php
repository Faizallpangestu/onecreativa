<?php
require_once __DIR__.'/accounting_core.php';
function ee_save(mysqli $db,array $a,int $id,array $d,int $active):void{
 $keys=['manager_employee_id','employment_type','employment_status','resignation_date'];
 $hasVal = false;
 foreach ($keys as $k) {
  if (isset($d[$k]) && trim((string)$d[$k]) !== '') {
   $hasVal = true;
   break;
  }
 }
 if(!$hasVal) return;
 if(!ac_table($db,'employee_employment')) {
  // If table doesn't exist yet, don't crash saving normal employee data
  return;
 }
 if(!ed_hr($a))ac_fail('Atribut employment hanya dikelola HRD.',403);
 ac_one($db,'SELECT id FROM roles ORDER BY id LIMIT 1 FOR UPDATE');$old=ac_one($db,'SELECT * FROM employee_employment WHERE employee_id=? FOR UPDATE',[$id]);
 $manager=$d['manager_employee_id']??$old['manager_employee_id']??null;if($manager==='')$manager=null;if($manager!==null)$manager=ac_id($manager);if($manager===$id)ac_fail('Employee tidak dapat menjadi manager dirinya sendiri.');
 if($manager&&!ac_one($db,"SELECT e.id FROM employees e JOIN users u ON u.id=e.user_id JOIN roles r ON r.id=u.role_id WHERE e.id=? AND u.is_active=1 AND r.name NOT LIKE 'peserta_%'",[$manager]))ac_fail('Manager harus merupakan staff dengan akun aktif.');
 $seen=[$id];$next=$manager;while($next){if(in_array($next,$seen,true))ac_fail('Hubungan manager tidak boleh membentuk siklus.');$seen[]=$next;$parent=ac_one($db,'SELECT manager_employee_id FROM employee_employment WHERE employee_id=?',[$next]);$next=empty($parent['manager_employee_id'])?null:(int)$parent['manager_employee_id'];}
 $type=ac_text($d['employment_type']??$old['employment_type']??'','Jenis employment',50,false);$status=ac_text($d['employment_status']??$old['employment_status']??'','Status employment',50,false);$resign=$d['resignation_date']??$old['resignation_date']??null;if($resign==='')$resign=null;if($resign!==null)$resign=ac_date($resign);if($resign&&$resign<=date('Y-m-d')&&$active)ac_fail('Nonaktifkan akun untuk resignation yang telah berlaku.');
 ac_query($db,'INSERT INTO employee_employment(employee_id,manager_employee_id,employment_type,employment_status,resignation_date,updated_by) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE manager_employee_id=VALUES(manager_employee_id),employment_type=VALUES(employment_type),employment_status=VALUES(employment_status),resignation_date=VALUES(resignation_date),updated_by=VALUES(updated_by),updated_at=NOW()',[$id,$manager,$type?:null,$status?:null,$resign,(int)$a['id']]);
}
