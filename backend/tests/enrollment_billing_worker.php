<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$database = $argv[1] ?? ''; $inputFile = $argv[2] ?? ''; $barrier = $argv[3] ?? '';
if (!preg_match('/^one_creativa_accounting_test_[a-f0-9]{12}$/D', $database)) exit(1);
foreach ([$inputFile, $barrier, getenv('CREATIVA_PRICING_TEST_FILE')] as $file) if (!$file || realpath(dirname($file)) !== realpath(sys_get_temp_dir()) || !str_starts_with(basename($file), $database.'_')) exit(1);
[$host, $name] = (static function () { $DB_HOST='localhost'; $DB_NAME='one-creativa'; if (is_file(__DIR__.'/../config/db_env.php')) require __DIR__.'/../config/db_env.php'; return [$DB_HOST,$DB_NAME]; })();
if (!in_array($host, ['localhost','127.0.0.1','::1'], true) || !preg_match('/(?:_dev|_test)$/D', $name)) exit(1);
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/billing_invoice.php';
require_once __DIR__.'/../services/registration_sync.php';
$conn->select_db($database);
define('STUDENT_PRICING_RULES_FILE', getenv('CREATIVA_PRICING_TEST_FILE'));
$input = json_decode(file_get_contents($inputFile), true, 512, JSON_THROW_ON_ERROR);
for ($i=0; $i<100 && !is_file($barrier); $i++) usleep(50000);
if (!is_file($barrier)) exit(1);
try {
    $actor = ['id'=>1,'role'=>'finance','name'=>'Isolated worker'];
    if ($input['mode'] === 'webhook') {
        $result = registration_process($conn, $actor, $input['body'], 'webhook', function ($context) use ($conn,$actor) {
            if ($context['pricing']['status'] !== 'approved') ac_fail('Worker pricing not approved.',409);
            foreach (ac_rows($conn,'SELECT * FROM enrollment_charges WHERE enrollment_id=?',[(int)$context['enrollment']['id']]) as $charge) {
                $policy=eb_snapshot($charge['policy_snapshot'],$charge['policy_hash']); if (!$policy['webhook_issue']) continue;
                $schedule=sp_schedule(['status'=>'approved','rule'=>$policy],'2026-11-13');
                $context['issued']=billing_issue_charge($conn,$actor,['student_id'=>(int)$context['student']['id'],'enrollment_id'=>(int)$context['enrollment']['id'],'charge_id'=>(int)$charge['id'],'bank_account_id'=>$policy['bank_account_id'],'tanggal'=>'2026-11-13','jatuhTempo'=>$schedule[0]['jatuhTempo'],'total'=>$policy['amount']],true);
            }
            return $context;
        })['issued'];
    } else $result=billing_create_invoice($conn,$actor,$input['body']);
    echo eb_json(['code'=>200,'data'=>$result]);
} catch (Throwable $error) { echo eb_json(['code'=>$error instanceof AccountingException?$error->getCode():500,'error'=>$error->getMessage()]); exit(1); }
