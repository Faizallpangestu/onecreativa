<?php
header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/employee_directory.php';
$actor=ed_start($conn);ed_scope($actor,'');if($_SERVER['REQUEST_METHOD']!=='GET')ac_fail('Method tidak didukung.',405);
$today=(new DateTimeImmutable('now',new DateTimeZone('Asia/Jakarta')))->format('Y-m-d');$month=substr($today,0,7);
$staff="SELECT e.id FROM employees e LEFT JOIN users u ON u.id=e.user_id LEFT JOIN roles r ON r.id=u.role_id WHERE r.name IS NULL OR LOWER(r.name) NOT LIKE 'peserta_%'";
$total=ac_one($conn,'SELECT COUNT(*) AS n FROM ('.$staff.') s')['n'];
$active=ac_one($conn,'SELECT COUNT(DISTINCT a.employee_id) AS n FROM attendance_logs a JOIN ('.$staff.') s ON s.id=a.employee_id WHERE a.date=? AND a.check_in_at IS NOT NULL',[$today])['n'];
$new=ac_one($conn,'SELECT COUNT(*) AS n FROM employees e JOIN ('.$staff.') s ON s.id=e.id WHERE DATE_FORMAT(e.join_date,\'%Y-%m\')=?',[$month])['n'];
$leave=ac_one($conn,'SELECT COUNT(DISTINCT l.employee_id) AS n FROM leaves l JOIN ('.$staff.') s ON s.id=l.employee_id WHERE LOWER(l.status)=\'approved\' AND ? BETWEEN l.start_date AND l.end_date',[$today])['n'];
ed_respond(200,['status'=>'success','data'=>['total'=>(int)$total,'active_today'=>(int)$active,'new_employees'=>(int)$new,'on_leave'=>(int)$leave],'timezone'=>'Asia/Jakarta']);
