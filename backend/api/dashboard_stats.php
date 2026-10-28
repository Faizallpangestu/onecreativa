<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/api_session_guard.php';
$actor=api_session_guard($conn,'read');
try{
 $tables=['siswa'=>'peserta_intensif','matching'=>'lpk_matching_job','mendang'=>'lpk_mendang','alumni'=>'lpk_alumni','nenkin'=>'lpk_nenkin'];$counts=[];$available=[];
 foreach($tables as $key=>$table){$available[$key]=ac_table($conn,$table);$counts[$key]=$available[$key]?(int)ac_one($conn,'SELECT COUNT(*) AS n FROM '.$table)['n']:null;}
 $operational=['students'=>$counts['siswa'],'upcoming_meetings'=>(int)ac_one($conn,'SELECT COUNT(*) AS n FROM lms_meetings WHERE meeting_date>=CURDATE()')['n'],'active_sensei'=>(int)ac_one($conn,"SELECT COUNT(*) AS n FROM users u JOIN roles r ON r.id=u.role_id WHERE u.is_active=1 AND LOWER(r.name)='sensei'")['n'],'recent_students'=>(int)ac_one($conn,'SELECT COUNT(*) AS n FROM peserta_intensif WHERE created_at>=DATE_SUB(CURDATE(),INTERVAL 30 DAY)')['n']];
 $students=ac_rows($conn,'SELECT id,nama_lengkap AS name,level,batch,created_at FROM peserta_intensif ORDER BY created_at DESC,id DESC LIMIT 50');
 echo json_encode(['status'=>'success','data'=>$counts,'availability'=>$available,'operational'=>$operational,'students'=>$students]);
}catch(Throwable $e){error_log('Operational dashboard: '.$e->getMessage());http_response_code(500);echo json_encode(['status'=>'error','message'=>'Dashboard operasional gagal dimuat.']);}
