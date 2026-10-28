<?php
if(PHP_SAPI!=='cli')exit;
require_once __DIR__.'/../backend/services/employee_directory.php';
$config=__DIR__.'/../backend/config/';$file=is_file($config.'db_env.php')?'db_env.php':'database.php';$source=file_get_contents($config.$file);$values=[];
foreach(['DB_HOST','DB_USER','DB_PASS','DB_NAME']as $key){if(!preg_match('/\$'.preg_quote($key,'/').'\s*=\s*([\x27\x22])([^\x27\x22]*)\1\s*;/',$source,$match))throw new RuntimeException('Unsupported config');$values[$key]=$match[2];}
if(!in_array($values['DB_HOST'],['localhost','127.0.0.1','::1'],true))throw new RuntimeException('Local database required');
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);$db=new mysqli($values['DB_HOST'],$values['DB_USER'],$values['DB_PASS'],$values['DB_NAME']);$db->set_charset('utf8mb4');$db->query('START TRANSACTION READ ONLY');
try{
 $actor=ac_one($db,"SELECT u.id,r.name AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='super_admin' AND u.is_active=1 LIMIT 1");if(!$actor)throw new RuntimeException('No local administrator to check read permissions');
 $rows=ed_rows($db,$actor,'');$orphans=count(array_filter($rows,fn($r)=>(int)$r['account_missing']===1));$expected=(int)ac_one($db,"SELECT COUNT(*) AS n FROM employees e LEFT JOIN users u ON u.id=e.user_id LEFT JOIN roles r ON r.id=u.role_id WHERE r.name IS NULL OR LOWER(r.name) NOT LIKE 'peserta_%'")['n'];
 if(count($rows)!==$expected)throw new RuntimeException('Directory scope mismatch');foreach($rows as $r)if(isset($r['password_hash'])||isset($r['pin_hash']))throw new RuntimeException('Secret serialization');
 $meta=ed_meta($db,$actor,'');echo 'PASS: real read-only directory returns '.count($rows).' staff profiles including '.$orphans.' orphan; '.count($meta['departments']).' departments and '.count($meta['positions'])." positions load; no recovery or business data update.\n";
}finally{$db->rollback();$db->close();}
