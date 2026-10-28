<?php
header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/relationships.php';
$actor=rs_start($conn);
if($_SERVER['REQUEST_METHOD']==='GET'){
 if($actor['role']==='peserta_intensif')rs_student($conn,$actor);
 $data=['classes'=>ac_rows($conn,"SELECT c.*, (SELECT COUNT(DISTINCT p.id) FROM peserta_intensif p LEFT JOIN lms_class_enrollments ce ON ce.student_id=p.id AND ce.class_id=c.id AND ce.status='active' WHERE ce.id IS NOT NULL OR (LOWER(TRIM(p.batch))=LOWER(TRIM(c.batch)) AND c.batch<>'')) AS enrolled_students_count, (SELECT COUNT(DISTINCT m.id) FROM lms_meetings m JOIN lms_meeting_assignments ma ON ma.meeting_id=m.id JOIN lms_teaching_assignments ta ON ta.id=ma.assignment_id WHERE ta.class_id=c.id AND m.meeting_date <= CURDATE() AND m.type='Masuk') AS meeting_logs_count FROM lms_classes c WHERE ".rs_class_filter($actor).' ORDER BY c.name'),'students'=>rs_roster($conn,$actor),'assignments'=>ac_rows($conn,'SELECT ta.*,c.name AS class_name,COALESCE(NULLIF(e.full_name,\'\'),CONCAT(\'Akun Sensei \',u.id)) AS sensei_name FROM lms_teaching_assignments ta JOIN lms_classes c ON c.id=ta.class_id JOIN users u ON u.id=ta.sensei_user_id LEFT JOIN employees e ON e.user_id=u.id WHERE '.rs_class_filter($actor).($actor['role']==='sensei'?' AND ta.sensei_user_id='.(int)$actor['id']:'').' ORDER BY ta.id DESC'),'can_manage'=>rs_admin($actor)];
 if(rs_admin($actor)){$data['students']=ac_rows($conn,'SELECT p.id,p.user_id,p.nama_lengkap AS name,p.level,p.batch,p.email,u.is_active,r.name AS role FROM peserta_intensif p LEFT JOIN users u ON u.id=p.user_id LEFT JOIN roles r ON r.id=u.role_id ORDER BY p.nama_lengkap');$data['senseis']=ac_rows($conn,"SELECT u.id,COALESCE(NULLIF(e.full_name,''),u.email) AS name,u.email,u.is_active FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN employees e ON e.user_id=u.id WHERE r.name IN ('sensei','sensei_intensif') AND u.is_active=1 ORDER BY name");$data['enrollments']=ac_rows($conn,'SELECT ce.*,p.nama_lengkap AS student_name,c.name AS class_name FROM lms_class_enrollments ce JOIN peserta_intensif p ON p.id=ce.student_id JOIN lms_classes c ON c.id=ce.class_id ORDER BY ce.id DESC');$data['available_batches']=array_values(array_filter(array_unique(array_map(fn($r)=>$r['batch'],ac_rows($conn,"SELECT DISTINCT batch FROM peserta_intensif WHERE batch IS NOT NULL AND batch<>''")))));}
 if($actor['role']==='peserta_intensif'){$data['profile']=rs_student($conn,$actor);$data['profile']['name']=$data['profile']['nama_lengkap'];}
 $totalClasses=(int)mysqli_fetch_row(mysqli_query($conn,"SELECT COUNT(*) FROM lms_classes WHERE ".rs_class_filter($actor)))[0];
 $totalActiveClasses=(int)mysqli_fetch_row(mysqli_query($conn,"SELECT COUNT(*) FROM lms_classes WHERE status='active' AND ".rs_class_filter($actor)))[0];
 $totalStudents=(int)mysqli_fetch_row(mysqli_query($conn,"SELECT COUNT(*) FROM peserta_intensif"))[0];
 $totalMeetings=(int)mysqli_fetch_row(mysqli_query($conn,"SELECT COUNT(*) FROM lms_meetings"))[0];
 $totalCompletedMeetings=(int)mysqli_fetch_row(mysqli_query($conn,"SELECT COUNT(*) FROM lms_meetings WHERE meeting_date <= CURDATE()"))[0];
 $totalTasks=(int)mysqli_fetch_row(mysqli_query($conn,"SELECT COUNT(*) FROM lms_tasks"))[0];
 $data['stats']=[
  'total_classes'=>$totalClasses,
  'active_classes'=>$totalActiveClasses,
  'total_students'=>$totalStudents,
  'total_meetings'=>$totalMeetings,
  'completed_meetings'=>$totalCompletedMeetings,
  'total_tasks'=>$totalTasks,
 ];
 ed_respond(200,['status'=>'success','data'=>$data]);
}
if($_SERVER['REQUEST_METHOD']==='POST'){$d=json_decode(file_get_contents('php://input'),true);if(!is_array($d))ac_fail('JSON tidak valid.');ed_respond(200,['status'=>'success','data'=>rs_admin_mutate($conn,$actor,$d)]);}
ac_fail('Metode tidak diizinkan.',405);
