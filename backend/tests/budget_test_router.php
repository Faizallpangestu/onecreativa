<?php
// Only used by the CLI test runner with a temporary database; never exposed by Apache.
if (PHP_SAPI !== 'cli-server') { http_response_code(404); exit; }
$database = getenv('CREATIVA_RAB_TEST_DB');
if (!preg_match('/^one_creativa_(rab|salary|accounting|employee)_test_[a-f0-9]{12}$/D', $database ?: '')) { http_response_code(404); exit; }
define('RPA_DISABLE_EXTERNAL_DELIVERY',true);
putenv('CREATIVA_PRIVATE_UPLOAD_DIR='.sys_get_temp_dir().'/'.$database.'_documents');
$endpoint = basename(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (in_array($endpoint, ['invoice_document.php','receipt_document.php','automation_status.php'],true)) {
 define('CREATIVA_TEST_ROUTER',true);
 require_once __DIR__.'/../config/database.php';
 $conn->select_db($database);
 require __DIR__.'/../api/'.$endpoint;
 exit;
}
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
if (!in_array($endpoint, ['webhook_registration.php','sync_students_web.php','student_billing.php','billing.php','lpk_matching.php','attendance.php','leaves.php','positions.php','employees.php','employee_stats.php','profile.php','upload_photo.php','reimbursements.php','dashboard_stats.php','lms_meetings.php','lms_tasks.php','lms_submissions.php','lms_attendance.php','sensei_dashboard_stats.php','lms_dashboard_stats.php','lms_grades.php','accounting.php','session.php','login.php', 'logout.php', 'budgets.php', 'finance.php', 'salaries.php', 'salary_slips.php', 'payroll.php', 'save_payroll.php', 'publish_payroll.php', 'dashboard_karyawan.php'], true)) { http_response_code(404); exit; }
define('CREATIVA_TEST_ROUTER',true);
require_once __DIR__ . '/../config/database.php';
$conn->select_db($database);
foreach (['CREATIVA_PRICING_TEST_FILE' => ['STUDENT_PRICING_RULES_FILE', '_pricing.json'], 'CREATIVA_REGISTRATION_TEST_FILE' => ['CREATIVA_REGISTRATION_SYNC_FIXTURE', '_registration.json']] as $env => [$constant, $suffix]) {
 $file=getenv($env);
 if($file){
  if(basename($file)!==$database.$suffix||realpath(dirname($file))!==realpath(sys_get_temp_dir())||!is_file($file)){http_response_code(404);exit;}
  define($constant,$file);
 }
}
if (getenv('CREATIVA_BILLING_TEST_LOCK_TIMEOUT') === '1' && in_array($endpoint, ['billing.php','student_billing.php'], true)) {
 $conn->query('SET SESSION innodb_lock_wait_timeout=1');
}
define('BUDGET_ATTACHMENT_DIR', sys_get_temp_dir() . '/' . $database . '_images');
$invoiceMailFile = sys_get_temp_dir().'/'.$database.'_invoice_mail.json';
if (is_file($invoiceMailFile)) {
 $mailFixture = json_decode(file_get_contents($invoiceMailFile),true);
 // This router only permits local TLS capture; no external SMTP is possible.
 if (!in_array($mailFixture['host'] ?? '', ['localhost',''],true) || ($mailFixture['encryption'] ?? '') !== 'ssl'
     || !in_array($mailFixture['from_email'] ?? '', ['finance@example.test',''],true)) { http_response_code(404); exit; }
 foreach ($mailFixture as $key=>$value) putenv('CREATIVA_SMTP_'.strtoupper($key).'='.(is_bool($value)?($value?'true':'false'):(string)$value));
 define('SALARY_DISABLE_EXTERNAL_EMAIL', false);
} else define('SALARY_DISABLE_EXTERNAL_EMAIL', true);
define('ACCOUNTING_PROOF_DIR',sys_get_temp_dir().'/'.$database.'_proofs');
define('EMPLOYEE_PHOTO_DIR',sys_get_temp_dir().'/'.$database.'_photos');
require __DIR__ . '/../api/' . $endpoint;
