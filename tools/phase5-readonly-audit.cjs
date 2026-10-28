const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const root = path.resolve(__dirname, '..');
const config = path.join(root, 'backend/config');
const configFile = fs.existsSync(path.join(config, 'db_env.php')) ? 'db_env.php' : 'database.php';
const source = fs.readFileSync(path.join(config, configFile), 'utf8');
function literal(name) {
  const match = source.match(new RegExp('\\$' + name + '\\s*=\\s*([\x27\x22])([^\x27\x22]*)\\1\\s*;'));
  if (!match) throw Error('Unsupported local configuration');
  return match[2];
}
async function main() {
  const host = literal('DB_HOST');
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) throw Error('Local database required');
  const db = await mysql.createConnection({host, user:literal('DB_USER'), password:literal('DB_PASS'), database:literal('DB_NAME'),dateStrings:true,supportBigNumbers:true,bigNumberStrings:true});
  try {
    await db.query('SET NAMES utf8mb4 COLLATE utf8mb4_general_ci');
    await db.query('START TRANSACTION READ ONLY');
    const query = async sql => (await db.query(sql))[0];
    const report = {audited_at:new Date().toISOString(),mode:'read-only; SELECT/SHOW only, configuration PHP not executed',environment:{host,database:literal('DB_NAME'),config_file:configFile,...(await query('SELECT VERSION() AS version, @@session.time_zone AS session_timezone, @@system_time_zone AS system_timezone, NOW() AS database_now'))[0]},tables:{},issues:[],roles:await query('SELECT r.id,r.name,r.label,COUNT(u.id) AS accounts,SUM(u.is_active=1) AS active_accounts FROM roles r LEFT JOIN users u ON u.role_id=r.id GROUP BY r.id ORDER BY r.id')};
    const tables = await query('SHOW FULL TABLES WHERE Table_type=\'BASE TABLE\'');
    for (const record of tables) {
      const name = Object.values(record)[0];
      const rows = await query('SELECT * FROM ' + mysql.escapeId(name));
      const normalized = rows.map(row=>Object.values(row).map(mysql.escape).join(',')).sort();
      report.tables[name] = {count:rows.length,row_sha256:crypto.createHash('sha256').update(normalized.join('\n')).digest('hex')};
    }
    report.employee_groups = await query('SELECT r.name AS role,u.is_active,COUNT(*) AS count FROM employees e LEFT JOIN users u ON u.id=e.user_id LEFT JOIN roles r ON r.id=u.role_id GROUP BY r.name,u.is_active');
    report.employee_visible_default = (await query("SELECT COUNT(*) AS count FROM employees e JOIN users u ON u.id=e.user_id JOIN roles r ON r.id=u.role_id WHERE LOWER(TRIM(r.name)) IN ('karyawan','employee')"))[0].count;
    report.other_databases_with_employee_table = await query("SELECT TABLE_SCHEMA AS database_name,TABLE_ROWS AS estimated_count FROM information_schema.TABLES WHERE TABLE_NAME='employees' AND TABLE_SCHEMA<>DATABASE()");
    const employeeSource = fs.readFileSync(path.join(root,'backend/api/employees.php'),'utf8');
    const queryMatch = employeeSource.match(/\$query = mysqli_query\(\$conn, "\s*(SELECT[\s\S]*?)"\);/);
    if (queryMatch) {
      const sql = queryMatch[1].replace('$accountJoin','FROM employees e JOIN users u ON e.user_id=u.id').replace('$whereClause',"WHERE LOWER(TRIM(r.name)) IN ('karyawan','employee')");
      try { report.employee_api_query = {success:true,rows:(await query(sql)).length}; }
      catch (error) { report.employee_api_query = {success:false,code:error.code,errno:error.errno,sql_state:error.sqlState,message:error.sqlMessage}; }
    } else report.employee_api_query = {success:null,reason:'Legacy query no longer present; verify new service through isolated HTTP tests'};
    const checks = [
      ['employee_orphan_user','employees','SELECT COUNT(*) AS count FROM employees e LEFT JOIN users u ON u.id=e.user_id WHERE u.id IS NULL'],
      ['employee_missing_department','employees','SELECT COUNT(*) AS count FROM employees e LEFT JOIN departments d ON d.id=e.department_id WHERE e.department_id IS NOT NULL AND d.id IS NULL'],
      ['duplicate_employee_user','employees','SELECT COUNT(*) AS count FROM (SELECT user_id FROM employees WHERE user_id IS NOT NULL GROUP BY user_id HAVING COUNT(*)>1) x'],
      ['duplicate_employee_code','employees',"SELECT COUNT(*) AS count FROM (SELECT employee_code FROM employees WHERE employee_code IS NOT NULL AND employee_code<>'' GROUP BY employee_code HAVING COUNT(*)>1) x"],
      ['user_orphan_role','users','SELECT COUNT(*) AS count FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE r.id IS NULL'],
      ['student_without_account','peserta_intensif','SELECT COUNT(*) AS count FROM peserta_intensif p LEFT JOIN users u ON u.id=p.user_id WHERE u.id IS NULL'],
      ['duplicate_student_email','peserta_intensif',"SELECT COUNT(*) AS count FROM (SELECT email FROM peserta_intensif WHERE email<>'' GROUP BY email HAVING COUNT(*)>1) x"],
      ['meeting_missing_teacher','lms_meetings','SELECT COUNT(*) AS count FROM lms_meetings m LEFT JOIN users u ON u.id=m.sensei_id WHERE u.id IS NULL'],
      ['submission_missing_user','lms_submissions','SELECT COUNT(*) AS count FROM lms_submissions s LEFT JOIN users u ON u.id=s.siswa_id WHERE u.id IS NULL'],
      ['duplicate_attendance','lms_attendance','SELECT COUNT(*) AS count FROM (SELECT meeting_id,siswa_id FROM lms_attendance GROUP BY meeting_id,siswa_id HAVING COUNT(*)>1) x'],
      ['duplicate_submissions','lms_submissions','SELECT COUNT(*) AS count FROM (SELECT task_id,siswa_id FROM lms_submissions GROUP BY task_id,siswa_id HAVING COUNT(*)>1) x'],
      ['duplicate_matching_email','lpk_matching_job',"SELECT COUNT(*) AS count FROM (SELECT email FROM lpk_matching_job WHERE email<>'' GROUP BY email HAVING COUNT(*)>1) x"],
      ['attendance_orphan_employee','attendance_logs','SELECT COUNT(*) AS count FROM attendance_logs a LEFT JOIN employees e ON e.id=a.employee_id WHERE e.id IS NULL'],
      ['payroll_orphan_employee','payroll','SELECT COUNT(*) AS count FROM payroll p LEFT JOIN employees e ON e.id=p.employee_id WHERE e.id IS NULL'],
      ['unbalanced_posted_journal','journal_entries',"SELECT COUNT(*) AS count FROM (SELECT j.id FROM journal_entries j LEFT JOIN journal_lines l ON l.journal_entry_id=j.id WHERE j.status='posted' GROUP BY j.id HAVING COALESCE(SUM(l.debit),0)<>COALESCE(SUM(l.credit),0)) x"],
    ];
    for (const [issue,module,sql] of checks) {
      try { report.issues.push({issue,module,count:Number((await query(sql))[0].count)}); }
      catch (error) { report.issues.push({issue,module,count:null,error_code:error.code}); }
    }
    report.relationship_gaps = ['No class/enrollment/teaching-assignment table in existing schema','lms_grades uses peserta_intensif id; submissions/attendance use users id','billing_invoices and invoice_clients have no student_id foreign key','lpk_matching_job has no student_id foreign key','employees has no manager/employment_type/status columns'];
    const outputFlag=process.argv.indexOf('--output');
    const output=outputFlag<0?path.join(root,'docs/audit/phase5-readonly.json'):path.resolve(root,process.argv[outputFlag+1]);
    if(!output.startsWith(path.join(root,'docs/audit')+path.sep))throw Error('Audit output must stay in docs/audit');
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
    await db.query('ROLLBACK');
    console.log(JSON.stringify({database:report.environment.database,employees:report.tables.employees.count,default_visible:report.employee_visible_default,employee_query:report.employee_api_query,issues:report.issues.filter(x=>x.count!==0)}));
  } finally { await db.end(); }
}
main().catch(error=>{console.error('Read-only audit failed: '+(error.code||error.message));process.exitCode=1;});
