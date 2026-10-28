<?php
// Only used by the CLI test runner with a temporary database; never exposed by Apache.
if (PHP_SAPI !== 'cli-server') { http_response_code(404); exit; }
$database = getenv('CREATIVA_RAB_TEST_DB');
if (!preg_match('/^one_creativa_(rab|salary|accounting|employee)_test_[a-f0-9]{12}$/D', $database ?: '')) { http_response_code(404); exit; }
$endpoint = basename(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (in_array($endpoint, ['face_clock.php','settings.php'], true)) {
 define('CREATIVA_TEST_ROUTER',true);
 require_once __DIR__.'/../config/database.php';
 $conn->select_db($database);
 $_SERVER['SCRIPT_NAME']='/api/'.$endpoint;
 require_once __DIR__.'/../services/api_entry_policy.php';
 api_entry_policy($conn);
 require __DIR__.'/../api/'.$endpoint;
 exit;
}
if (!in_array($endpoint, ['lpk_matching.php','attendance.php','leaves.php','positions.php','employees.php','employee_stats.php','profile.php','upload_photo.php','reimbursements.php','dashboard_stats.php','lms_meetings.php','lms_tasks.php','lms_submissions.php','lms_attendance.php','sensei_dashboard_stats.php','lms_dashboard_stats.php','lms_grades.php','accounting.php','session.php','login.php', 'logout.php', 'budgets.php', 'finance.php', 'salaries.php', 'salary_slips.php', 'payroll.php', 'save_payroll.php', 'publish_payroll.php', 'dashboard_karyawan.php'], true)) { http_response_code(404); exit; }
define('CREATIVA_TEST_ROUTER',true);
require_once __DIR__ . '/../config/database.php';
$conn->select_db($database);
define('BUDGET_ATTACHMENT_DIR', sys_get_temp_dir() . '/' . $database . '_images');
define('SALARY_DISABLE_EXTERNAL_EMAIL', true);
define('ACCOUNTING_PROOF_DIR',sys_get_temp_dir().'/'.$database.'_proofs');
define('EMPLOYEE_PHOTO_DIR',sys_get_temp_dir().'/'.$database.'_photos');
require __DIR__ . '/../api/' . $endpoint;
