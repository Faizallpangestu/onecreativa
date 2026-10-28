<?php
// Isolated CLI web server for QA only. Packaging excludes this directory.
if(PHP_SAPI!=='cli-server'){http_response_code(404);exit;}
$name=getenv('CREATIVA_RELEASE_TEST_DB');
if(!preg_match('/^one_creativa_release_test_[a-f0-9]{16}$/D',$name?:'')){http_response_code(404);exit;}
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if(!preg_match('#^/api/([a-z_]+\.php)$#D',$path,$match)){http_response_code(404);exit;}
$endpoint=$match[1];
$allowed=['face_clock.php','face_enroll.php','login.php','logout.php','session.php','relationships.php','employees.php','employee_stats.php','profile.php','upload_photo.php','attendance.php','leaves.php','positions.php','departments.php','settings.php','overtime.php','daily_reports.php','lpk_matching.php','lpk_intensif.php','lpk_nenkin.php','lpk_mendang.php','lpk_alumni.php','lms_meetings.php','lms_tasks.php','lms_submissions.php','lms_grades.php','lms_attendance.php','lms_dashboard_stats.php','sensei_dashboard_stats.php','student_billing.php','accounting.php','billing.php','invoice.php','reimbursements.php','lms_announcements.php','lms_leaderboard.php'];
if(!in_array($endpoint,$allowed,true)){http_response_code(404);exit;}
define('CREATIVA_TEST_ROUTER',true);
define('SALARY_DISABLE_EXTERNAL_EMAIL',true);
define('EMPLOYEE_PHOTO_DIR',getenv('CREATIVA_PRIVATE_UPLOAD_DIR').'/photos');
define('FACE_SNAPSHOT_DIR',getenv('CREATIVA_PRIVATE_UPLOAD_DIR').'/snapshots');
require_once __DIR__.'/../config/database.php';
$conn->select_db($name);
$_SERVER['SCRIPT_NAME']='/api/'.$endpoint;
require_once __DIR__.'/../services/api_entry_policy.php';
api_entry_policy($conn);
chdir(__DIR__.'/../api');
require __DIR__.'/../api/'.$endpoint;
