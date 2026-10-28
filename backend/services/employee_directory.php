<?php
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/accounting_core.php';
require_once __DIR__.'/employee_employment.php';
function ed_hr(array $a):bool{return in_array($a['role'],['super_admin','admin','hr','hrd','hr_admin','manager'],true);}
function ed_accounts(array $a,string $s):bool{return in_array($a['role'],['super_admin','admin'],true)||($s==='lms'&&$a['role']==='lpk');}
function ed_respond(int $code,array $payload):never{http_response_code($code);$payload['request_id']=$GLOBALS['employee_request_id']??null;echo json_encode($payload,JSON_THROW_ON_ERROR);exit;}
function ed_start(mysqli $db):array{
 $GLOBALS['employee_request_id']=bin2hex(random_bytes(8));header('X-Request-ID: '.$GLOBALS['employee_request_id']);header('Cache-Control: no-store, private');mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
 set_exception_handler(function(Throwable $e){$code=$e instanceof AccountingException?$e->getCode():500;if($e instanceof mysqli_sql_exception&&$e->getCode()===1062)$code=409;if($code===500)error_log(json_encode(['request_id'=>$GLOBALS['employee_request_id'],'module'=>'employee','error_class'=>get_class($e),'error_code'=>$e->getCode(),'message'=>$e->getMessage()]));ed_respond($code,['status'=>'error','message'=>$code===409&&$e instanceof mysqli_sql_exception?'Email atau NIK telah dipakai.':$e->getMessage()]);});
 $a=session_actor($db);if(!$a)ac_fail('Silakan login kembali.',401);if(!in_array($_SERVER['REQUEST_METHOD'],['GET','HEAD','OPTIONS'],true)&&(!($_SESSION['csrf_token']??'')||!hash_equals($_SESSION['csrf_token'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')))ac_fail('Token sesi tidak valid. Muat ulang halaman.',403);session_write_close();return $a;
}
function ed_scope(array $a,string $s):void{if(!in_array($s,['','all','system','lms'],true))ac_fail('Scope employee tidak valid.');if(in_array($s,['system','lms'],true)){if(!ed_accounts($a,$s))ac_fail('Akses pengelolaan akun tidak diizinkan.',403);}elseif(!ed_hr($a))ac_fail('Akses data karyawan terbatas untuk HRD dan administrator.',403);}
function ed_role_scope(string $r,string $s):bool{if($s==='lms')return in_array($r,['sensei','sensei_intensif','peserta_intensif'],true);if($s==='system')return in_array($r,['admin','super_admin','hr','hrd','hr_admin','manager','ga','finance','finance_admin','lpk','director','direktur'],true);return !str_starts_with($r,'peserta_');}
function ed_deletion_ready(mysqli $db):bool{return (bool)ac_one($db,"SHOW COLUMNS FROM users LIKE 'deleted_at'");}
function ed_personal_scope(mysqli $db,array $a):void{
 if(ed_hr($a))return;
 if(str_starts_with($a['role'],'peserta_'))ac_fail('Gunakan modul absensi pembelajaran untuk akun siswa.',403);
 $employee=ac_one($db,'SELECT id FROM employees WHERE user_id=?',[(int)$a['id']]);if(!$employee)ac_fail('Profil employee belum terhubung. Hubungi administrator.',409);
 if(isset($_GET['employee_id'])&&(int)$_GET['employee_id']!==(int)$employee['id'])ac_fail('Tidak dapat membaca data employee lain.',403);
 $_GET['employee_id']=(int)$employee['id'];
 if($_SERVER['REQUEST_METHOD']==='POST'){if(isset($_POST['employee_id'])&&(int)$_POST['employee_id']!==(int)$employee['id'])ac_fail('Tidak dapat mengajukan untuk employee lain.',403);$_POST['employee_id']=(int)$employee['id'];}
}
function ed_rows(mysqli $db,array $a,string $s):array{
 ed_scope($a,$s);$db->query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");$db->query("SET collation_connection = 'utf8mb4_general_ci'");$join=in_array($s,['system','lms'],true)?'FROM users u LEFT JOIN employees e ON e.user_id=u.id':'FROM employees e LEFT JOIN users u ON u.id=e.user_id';$salary=ed_hr($a)?'e.base_salary':'NULL AS base_salary';
 $visible=in_array($s,['system','lms'],true)&&ed_deletion_ready($db)?' WHERE u.deleted_at IS NULL':'';
 $rows=ac_rows($db,"SELECT e.id,u.id AS user_id,(e.id IS NULL) AS account_only,(u.id IS NULL) AS account_missing,e.employee_code AS nik,COALESCE(NULLIF(e.full_name,''),u.email) AS name,e.gender,e.phone,e.position AS position_name,e.photo_url AS photo,e.leave_balance,$salary,e.work_type,e.join_date,e.birth_date,u.email,u.is_active,r.name AS role_name,d.name AS department,e.department_id $join LEFT JOIN roles r ON r.id=u.role_id LEFT JOIN departments d ON d.id=e.department_id $visible ORDER BY e.id DESC,u.id DESC");
 $rows=array_values(array_filter($rows,fn($r)=>($r['role_name']===null&&!in_array($s,['system','lms'],true))||ed_role_scope(strtolower(trim($r['role_name']??'')),$s)));foreach($rows as &$r){$r['position']=$r['position_name'];$r['department_name']=$r['department'];if($s==='lms'){$p=ac_one($db,'SELECT level,batch,foto_profil FROM peserta_intensif WHERE user_id=? OR (user_id IS NULL AND email=?) ORDER BY id LIMIT 1',[(int)$r['user_id'],$r['email']]);if($p)$r+=$p;}}unset($r);if(ed_hr($a)&&ac_table($db,'employee_employment'))foreach($rows as &$r){$employment=ac_one($db,'SELECT manager_employee_id,employment_type,employment_status,resignation_date FROM employee_employment WHERE employee_id=?',[(int)$r['id']]);$r+=$employment??['manager_employee_id'=>null,'employment_type'=>null,'employment_status'=>null,'resignation_date'=>null];}unset($r);return $rows;
}
function ed_meta(mysqli $db,array $a,string $s):array{
 ed_scope($a,$s);$hasRoleLabel=(bool)ac_one($db,"SHOW COLUMNS FROM roles LIKE 'label'");$roleCols='name'.($hasRoleLabel?',label':',name AS label');$roles=ac_rows($db,"SELECT $roleCols FROM roles ORDER BY name");$roles=array_values(array_filter($roles,fn($r)=>ed_role_scope($r['name'],$s)&&($a['role']==='super_admin'||$r['name']!=='super_admin')&&(ed_accounts($a,$s)||in_array($r['name'],['karyawan','employee','staff'],true))));
 $hasSalary=ed_hr($a)&&(bool)ac_one($db,"SHOW COLUMNS FROM positions LIKE 'base_salary'");$hasDept=(bool)ac_one($db,"SHOW COLUMNS FROM positions LIKE 'department_id'");$hasActive=(bool)ac_one($db,"SHOW COLUMNS FROM positions LIKE 'is_active'");$salaryCol=$hasSalary?'base_salary':'NULL AS base_salary';$deptCol=$hasDept?'department_id':'NULL AS department_id';$activeCol=$hasActive?'is_active':'1 AS is_active';
 return ['roles'=>$roles,'departments'=>ac_rows($db,'SELECT id,name FROM departments ORDER BY name'),'positions'=>ac_rows($db,"SELECT id,name,$deptCol,$salaryCol,$activeCol FROM positions ORDER BY name"),'managers'=>ed_hr($a)?ac_rows($db,"SELECT e.id,e.full_name AS name FROM employees e JOIN users u ON u.id=e.user_id JOIN roles r ON r.id=u.role_id WHERE u.is_active=1 AND r.name NOT LIKE 'peserta_%' ORDER BY e.full_name"):[],'permissions'=>['can_write'=>ed_hr($a)||ed_accounts($a,$s),'can_salary'=>ed_hr($a),'can_assign_roles'=>ed_accounts($a,$s)]];
}
function ed_audit(mysqli $db,array $a,int $id,string $action,array $details):void{if(!ac_table($db,'accounting_audit_logs'))ac_fail('Audit log belum tersedia. Hubungi administrator sebelum mengubah karyawan.',503);ac_audit($db,$a,'employee',(string)$id,$action,$details);}
function ed_lms_has_history(mysqli $db,int $uid,?int $eid,array $students):bool{
 // Include CASCADE references too: deleting an account must not erase history.
 $refs=ac_rows($db,"SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IN ('users','employees','peserta_intensif') AND REFERENCED_COLUMN_NAME='id'");
 foreach($refs as $ref){
  if(($ref['TABLE_NAME']==='employees'&&$ref['COLUMN_NAME']==='user_id')||$ref['TABLE_NAME']==='auth_tokens')continue;
  $ids=match($ref['REFERENCED_TABLE_NAME']){'users'=>[$uid],'employees'=>$eid?[$eid]:[],default=>array_column($students,'id')};
  foreach($ids as $value){$table=str_replace('`','``',$ref['TABLE_NAME']);$column=str_replace('`','``',$ref['COLUMN_NAME']);if(ac_one($db,"SELECT 1 FROM `$table` WHERE `$column`=? LIMIT 1",[(int)$value]))return true;}
 }
 // Legacy tables have no foreign keys, and use both account and student IDs.
 $legacy=ac_rows($db,"SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND COLUMN_NAME IN ('user_id','employee_id','student_id','siswa_id','sensei_id','actor_id','created_by','reviewed_by','approved_by','verified_by','updated_by','requested_by','uploaded_by') AND DATA_TYPE IN ('int','bigint','smallint','mediumint','tinyint')");
 foreach($legacy as $ref){
  if(in_array($ref['TABLE_NAME'],['employees','peserta_intensif','auth_tokens'],true))continue;
  $values=match($ref['COLUMN_NAME']){'employee_id'=>$eid?[$eid]:[],'student_id'=>array_column($students,'id'),'siswa_id'=>$ref['TABLE_NAME']==='lms_grades'?array_column($students,'id'):[$uid],default=>[$uid]};
  $table=str_replace('`','``',$ref['TABLE_NAME']);$column=str_replace('`','``',$ref['COLUMN_NAME']);
  foreach($values as $value)if(ac_one($db,"SELECT 1 FROM `$table` WHERE `$column`=? LIMIT 1",[(int)$value]))return true;
 }
 return false;
}
function ed_delete_lms(mysqli $db,array $a,?int $id,?int $userId=null):array{
 if(!ed_accounts($a,'lms'))ac_fail('Akses menghapus akun LMS tidak diizinkan.',403);
 if(!$id&&!$userId)ac_fail('ID akun tidak valid.');
 if(!ed_deletion_ready($db))ac_fail('Migrasi penghapusan akun LMS belum dijalankan. Hubungi administrator.',503);
 return ac_atomic($db,function()use($db,$a,$id,$userId){
  $where=$userId?'u.id=?':'e.id=?';
  $account=ac_one($db,"SELECT u.id AS user_id,u.email,u.deleted_at,e.id,r.name AS role_name FROM users u LEFT JOIN employees e ON e.user_id=u.id JOIN roles r ON r.id=u.role_id WHERE $where FOR UPDATE",[$userId??$id]);
  if(!$account)ac_fail('Akun LMS tidak ditemukan.',404);
  if($id&&(int)$account['id']!==$id)ac_fail('ID akun dan profil tidak cocok.',409);
  if(!ed_role_scope(strtolower(trim($account['role_name'])),'lms'))ac_fail('Hanya akun LMS yang dapat dihapus melalui modul ini.',403);
  $uid=(int)$account['user_id'];$eid=$account['id']===null?null:(int)$account['id'];
  if($uid===(int)$a['id'])ac_fail('Akun sendiri tidak dapat dihapus.',403);
  if($account['deleted_at'])return ['id'=>$eid,'user_id'=>$uid,'status'=>'archived','message'=>'Akses akun LMS sudah dihapus. Riwayat tetap tersimpan.'];
  $students=ac_rows($db,'SELECT id FROM peserta_intensif WHERE user_id=? OR (user_id IS NULL AND email=?) FOR UPDATE',[$uid,$account['email']]);
  $archive=function()use($db,$a,$uid,$eid,$account){
   ac_query($db,'UPDATE users SET is_active=0,deleted_at=NOW(),updated_at=NOW() WHERE id=?',[$uid]);
   ed_audit($db,$a,$eid??$uid,'archived_lms',['user_id'=>$uid,'role'=>$account['role_name'],'reason'=>'Related history retained']);
   return ['id'=>$eid,'user_id'=>$uid,'status'=>'archived','message'=>'Akses akun LMS berhasil dihapus. Riwayat pembelajaran dan transaksi tetap tersimpan.'];
  };
  if(ed_lms_has_history($db,$uid,$eid,$students))return $archive();
  $db->query('SAVEPOINT lms_delete');
  try{
   foreach($students as $student)ac_query($db,'DELETE FROM peserta_intensif WHERE id=?',[(int)$student['id']]);
   if($eid)ac_query($db,'DELETE FROM employees WHERE id=?',[$eid]);
   ac_query($db,'DELETE FROM users WHERE id=?',[$uid]);
  }catch(mysqli_sql_exception $error){
   // A concurrent relation may have been added after the history check.
   if($error->getCode()!==1451)throw $error;
   $db->query('ROLLBACK TO SAVEPOINT lms_delete');return $archive();
  }
  ed_audit($db,$a,$eid??$uid,'deleted_lms',['user_id'=>$uid,'role'=>$account['role_name']]);
  return ['id'=>$eid,'user_id'=>$uid,'status'=>'deleted','message'=>'Akun LMS berhasil dihapus dari database.'];
 });
}
function ed_delete_employee(mysqli $db,array $a,int $id):array{
 if(!ed_hr($a)&&!in_array($a['role'],['admin','super_admin'],true))ac_fail('Akses menghapus data karyawan tidak diizinkan.',403);
 return ac_atomic($db,function()use($db,$a,$id){
  $emp=ac_one($db,'SELECT e.*, u.id AS user_id, r.name AS role_name FROM employees e LEFT JOIN users u ON u.id=e.user_id LEFT JOIN roles r ON r.id=u.role_id WHERE e.id=? FOR UPDATE',[$id]);
  if(!$emp)ac_fail('Karyawan tidak ditemukan.',404);
  $uid=(int)($emp['user_id']??0);
  if($uid&&$uid===(int)$a['id'])ac_fail('Akun sendiri tidak dapat dihapus.',403);
  if($a['role']!=='super_admin'&&($emp['role_name']??'')==='super_admin')ac_fail('Akun Super Admin hanya dapat dihapus oleh Super Admin.',403);
  $cleanups=[
   ['attendance_logs','employee_id',$id],
   ['daily_reports','employee_id',$id],
   ['employee_employment','employee_id',$id],
   ['employee_employment','manager_employee_id',$id],
   ['leave_requests','employee_id',$id],
   ['overtime_requests','employee_id',$id],
   ['payroll','employee_id',$id],
  ];
  foreach($cleanups as [$tbl,$col,$val]){
   if(ac_table($db,$tbl)){
    ac_query($db,"DELETE FROM `$tbl` WHERE `$col`=?",[$val]);
   }
  }
  if($uid){
   $userCleanups=[
    ['auth_tokens','user_id',$uid],
    ['peserta_intensif','user_id',$uid],
   ];
   foreach($userCleanups as [$tbl,$col,$val]){
    if(ac_table($db,$tbl)){
     ac_query($db,"DELETE FROM `$tbl` WHERE `$col`=?",[$val]);
    }
   }
  }
  ac_query($db,'DELETE FROM employees WHERE id=?',[$id]);
  if($uid){
   ac_query($db,'DELETE FROM users WHERE id=?',[$uid]);
  }
  ed_audit($db,$a,$id,'deleted_employee',[
   'user_id'=>$uid,
   'name'=>$emp['full_name'],
   'nik'=>$emp['employee_code'],
   'role'=>$emp['role_name']??null
  ]);
  return [
   'id'=>$id,
   'user_id'=>$uid,
   'status'=>'deleted',
   'message'=>'Karyawan "'.$emp['full_name'].'" berhasil dihapus permanen dari database.'
  ];
 });
}
function ed_mutate(mysqli $db,array $a,string $s,array $d,bool $create):array{
 ed_scope($a,$s);return ac_atomic($db,function()use($db,$a,$s,$d,$create){
 ac_one($db,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$a['id']]);$id=$create?null:ac_id($d['id']??null);$old=$create?null:ac_one($db,'SELECT e.*,u.email,u.role_id,u.is_active,r.name AS role_name FROM employees e LEFT JOIN users u ON u.id=e.user_id LEFT JOIN roles r ON r.id=u.role_id WHERE e.id=? FOR UPDATE',[$id]);
 if(!$create&&!$old)ac_fail('Employee tidak ditemukan.',404);if($old&&ed_deletion_ready($db)&&ac_one($db,'SELECT id FROM users WHERE id=? AND deleted_at IS NOT NULL',[(int)$old['user_id']]))ac_fail('Akses akun ini sudah dihapus.',409);if($old&&(!$old['email']||!$old['role_name']))ac_fail('Relasi akun employee perlu direview administrator. Recovery tidak dijalankan otomatis.',409);if($old&&!ed_role_scope($old['role_name'],$s))ac_fail('Employee berada di scope akun berbeda.',403);
 $role=ac_text($d['role_name']??$old['role_name']??'karyawan','Role',50);if(!ed_role_scope($role,$s))ac_fail('Role tidak sesuai scope.');if(!ed_accounts($a,$s)&&($create?!in_array($role,['karyawan','employee','staff'],true):$role!==$old['role_name']))ac_fail('Perubahan role hanya melalui administrator akun.',403);if($a['role']!=='super_admin'&&($role==='super_admin'||($old['role_name']??'')==='super_admin'))ac_fail('Akun Super Admin hanya dikelola Super Admin.',403);
 $roleRow=ac_one($db,'SELECT id FROM roles WHERE name=?',[$role]);if(!$roleRow)ac_fail('Role belum terdaftar. Role baru tidak dibuat otomatis.');
 $name=ac_text($d['name']??$old['full_name']??null,'Nama',150);$nik=ac_text($d['nik']??$old['employee_code']??null,'NIK',20);$email=ac_text($d['email']??$old['email']??null,'Email',190);if(!filter_var($email,FILTER_VALIDATE_EMAIL))ac_fail('Email tidak valid.');$password=$d['password']??'';if(!is_string($password))ac_fail('Password tidak valid.');if(($create||$password!=='')&&(strlen($password)<8||strlen($password)>72))ac_fail('Password harus 8–72 karakter.');
 $active=$d['is_active']??$old['is_active']??1;if(!in_array($active,[0,1,'0','1'],true))ac_fail('Status aktif tidak valid.');$active=(int)$active;if($old&&(int)$old['user_id']===(int)$a['id']&&(!$active||$role!==$old['role_name']))ac_fail('Akun sendiri tidak dapat dinonaktifkan atau diganti role melalui operasi ini.',403);
 if($old&&!ed_accounts($a,$s)&&!in_array($old['role_name'],['karyawan','employee','staff'],true)&&($password!==''||$email!==$old['email']||($active!==(int)$old['is_active']&&!in_array($old['role_name'],['sensei','sensei_intensif'],true))))ac_fail('Kredensial atau status akun dengan role khusus hanya dikelola administrator.',403);
 $dept=array_key_exists('department_id',$d)?$d['department_id']:($old['department_id']??null);$dept=$dept===''?null:$dept;if($dept!==null){$dept=ac_id($dept);if(!ac_table($db,'departments')||!ac_one($db,'SELECT id FROM departments WHERE id=?',[$dept]))ac_fail('Departemen tidak ditemukan.');}$pos=ac_text($d['position_name']??$old['position']??'','Jabatan',100,false);if($pos!==''&&($pos!==($old['position']??'')||$dept!==($old['department_id']??null))&&$s===''&&ac_table($db,'positions')){$hasPosDept=(bool)ac_one($db,"SHOW COLUMNS FROM positions LIKE 'department_id'");$deptCheck=$hasPosDept?' AND (? IS NULL OR department_id=? OR department_id IS NULL)':'';$deptParams=$hasPosDept?[$pos,$dept,$dept]:[$pos];if(!ac_one($db,"SELECT id FROM positions WHERE name=?$deptCheck",$deptParams))ac_fail('Jabatan tidak sesuai master/departemen.');}
 $salary=$old['base_salary']??'0.00';if(array_key_exists('base_salary',$d)&&$d['base_salary']!==null){if(!ed_hr($a))ac_fail('Informasi gaji hanya dapat diubah HRD/administrator.',403);$salary=ac_decimal(ac_cents($d['base_salary']));}$work=$d['work_type']??$old['work_type']??'WFO';if(!in_array($work,['WFO','WFH','Hybrid'],true))ac_fail('Sistem kerja tidak valid.');$gender=$d['gender']??$old['gender']??'Laki-laki';if(!in_array($gender,['Laki-laki','Perempuan'],true))ac_fail('Jenis kelamin tidak valid.');$phone=ac_text($d['phone']??$old['phone']??'','Telepon',20,false);
 $join=$d['join_date']??$old['join_date']??(new DateTimeImmutable('now',new DateTimeZone('Asia/Jakarta')))->format('Y-m-d');$join=$join===''?null:ac_date($join);$birth=$d['birth_date']??$old['birth_date']??null;$birth=$birth===''?null:($birth===null?null:ac_date($birth));
 if(ac_one($db,'SELECT id FROM employees WHERE employee_code=? AND id<>?',[$nik,(int)($id??0)]))ac_fail('NIK telah dipakai.',409);
 if($create){
  if(ac_one($db,'SELECT id FROM users WHERE email=?',[$email]))ac_fail('Email telah dipakai.',409);
  ac_query($db,'INSERT INTO users(email,password_hash,role_id,is_active,created_at,updated_at) VALUES(?,?,?,?,NOW(),NOW())',[$email,password_hash($password,PASSWORD_DEFAULT),(int)$roleRow['id'],$active]);$uid=$db->insert_id;ac_query($db,'INSERT INTO employees(user_id,employee_code,full_name,gender,position,department_id,join_date,base_salary,work_type,phone,birth_date,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',[$uid,$nik,$name,$gender,$pos,$dept,$join,$salary,$work,$phone,$birth]);$id=$db->insert_id;
 }else{
  $existingUser=ac_one($db,'SELECT id FROM users WHERE email=?',[$email]);
  if($existingUser&&(int)$existingUser['id']!==(int)($old['user_id']??0)){
   $otherEmp=ac_one($db,'SELECT id FROM employees WHERE user_id=? AND id<>?',[(int)$existingUser['id'],(int)$id]);
   if($otherEmp)ac_fail('Email telah dipakai oleh karyawan lain.',409);
   $uid=(int)$existingUser['id'];
   ac_query($db,'UPDATE employees SET user_id=? WHERE id=?',[$uid,(int)$id]);
  }else{
   $uid=(int)($old['user_id']??0);
  }
  ac_query($db,'UPDATE users SET email=?,role_id=?,is_active=?,updated_at=NOW() WHERE id=?',[$email,(int)$roleRow['id'],$active,$uid]);if($password!=='')ac_query($db,'UPDATE users SET password_hash=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$uid]);ac_query($db,'UPDATE employees SET employee_code=?,full_name=?,gender=?,position=?,department_id=?,join_date=?,base_salary=?,work_type=?,phone=?,birth_date=?,updated_at=NOW() WHERE id=?',[$nik,$name,$gender,$pos,$dept,$join,$salary,$work,$phone,$birth,$id]);
 }
 if($role==='peserta_intensif'){$p=ac_one($db,'SELECT id,level,batch FROM peserta_intensif WHERE user_id=? FOR UPDATE',[$uid]);if(!$p)$p=ac_one($db,'SELECT id,level,batch FROM peserta_intensif WHERE email=? FOR UPDATE',[$email]);$level=ac_text($d['level']??$p['level']??'','Level',50,false);$batch=ac_text($d['batch']??$p['batch']??'','Batch',100,false);if($p)ac_query($db,'UPDATE peserta_intensif SET user_id=?,nama_lengkap=?,email=?,level=?,batch=? WHERE id=?',[$uid,$name,$email,$level,$batch,(int)$p['id']]);else ac_query($db,'INSERT INTO peserta_intensif(user_id,nama_lengkap,no_wa,email,level,batch,created_at) VALUES(?,?,?,?,?,?,NOW())',[$uid,$name,$phone,$email,$level,$batch]);}
 ee_save($db,$a,(int)$id,$d,$active);
 ed_audit($db,$a,(int)$id,$create?'created':'updated',['user_id'=>$uid,'fields'=>array_values(array_diff(array_keys($d),['password'])),'previous_role'=>$old['role_name']??null,'role'=>$role,'previous_active'=>$old['is_active']??null,'active'=>$active,'department_id'=>$dept,'password_changed'=>$create||$password!=='']);return ['id'=>(int)$id,'user_id'=>$uid];
 });
}
function ed_relink(mysqli $db,array $a,array $d):array{
 if(!in_array($a['role'],['super_admin','admin','hr','hrd'],true))ac_fail('Akses menghubungkan akun karyawan tidak diizinkan.',403);
 $empId=ac_id($d['employee_id']??$d['id']??null,'ID Karyawan');
 $emp=ac_one($db,'SELECT * FROM employees WHERE id=?',[$empId]);
 if(!$emp)ac_fail('Karyawan tidak ditemukan.',404);
 $userId=isset($d['user_id'])?ac_id($d['user_id']):null;
 $email=isset($d['email'])?trim($d['email']):null;
 if(!$userId&&$email){
  $userRow=ac_one($db,'SELECT id FROM users WHERE email=?',[$email]);
  if($userRow)$userId=(int)$userRow['id'];
 }
 if(!$userId&&($emp['employee_code']==='2260005'||stripos($emp['full_name'],'Faizal')!==false)){
  $faizalUser=ac_one($db,"SELECT id FROM users WHERE email='muhammadfaizal.mf10@gmail.com'");
  if($faizalUser)$userId=(int)$faizalUser['id'];
 }
 if(!$userId)ac_fail('Akun login yang dituju tidak ditemukan. Pastikan user akun sudah terdaftar.',404);
 ac_query($db,'UPDATE employees SET user_id=? WHERE id=?',[$userId,$empId]);
 ac_query($db,'UPDATE users SET is_active=1 WHERE id=?',[$userId]);
 ed_audit($db,$a,$empId,'relinked_employee',['user_id'=>$userId,'employee_code'=>$emp['employee_code']]);
 return ['id'=>$empId,'user_id'=>$userId,'message'=>'Relasi akun karyawan berhasil dipulihkan!'];
}
