// Local backup only. Private dump stays under storage/backups, denied over HTTP.
const fs=require('node:fs'), path=require('node:path'), mysql=require('mysql2/promise');
const root=path.resolve(__dirname,'..');
async function main(){
 const configDir=path.join(root,'backend/config');
 const source=fs.readFileSync(path.join(configDir,fs.existsSync(path.join(configDir,'db_env.php'))?'db_env.php':'database.php'),'utf8');
 const value=name=>{const m=source.match(new RegExp('\\$'+name+'\\s*=\\s*([\x27\x22])([^\x27\x22]*)\\1\\s*;'));if(!m)throw Error('Unsupported config');return m[2];};
 if(!['localhost','127.0.0.1','::1'].includes(value('DB_HOST')))throw Error('Local database required');
 const destination=path.join(root,'backend/storage/backups','phase2-'+Date.now());fs.mkdirSync(destination,{recursive:true});
 fs.writeFileSync(path.join(root,'backend/storage/backups/.htaccess'),'Require all denied\n');
 const db=await mysql.createConnection({host:value('DB_HOST'),user:value('DB_USER'),password:value('DB_PASS'),database:value('DB_NAME'),dateStrings:true,supportBigNumbers:true,bigNumberStrings:true});
 let dump='SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n';
 try{await db.query('START TRANSACTION READ ONLY');const[tables]=await db.query('SHOW FULL TABLES WHERE Table_type=\'BASE TABLE\'');for(const row of tables){const table=Object.values(row)[0];const[ddl]=await db.query('SHOW CREATE TABLE '+mysql.escapeId(table));dump+=ddl[0]['Create Table']+';\n';const[rows]=await db.query('SELECT * FROM '+mysql.escapeId(table));for(const record of rows)dump+='INSERT INTO '+mysql.escapeId(table)+' ('+Object.keys(record).map(mysql.escapeId).join(',')+') VALUES ('+Object.values(record).map(mysql.escape).join(',')+');\n';}await db.query('ROLLBACK');fs.writeFileSync(path.join(destination,'database.sql'),dump+'SET FOREIGN_KEY_CHECKS=1;\n');
 const files=['backend/services/budget_workflow.php','backend/api/budgets.php','backend/api/finance.php','backend/api/billing.php','backend/api/invoice.php','backend/api/reimbursements.php','backend/api/sensei_dashboard_stats.php','backend/api/lms_dashboard_stats.php','backend/api/lms_grades.php','src/App.jsx','src/pages/Profit.jsx','src/pages/DashboardFinance.jsx','src/pages/AnggaranBiaya.jsx','src/components/BudgetRequestDetail.jsx','src/components/BudgetRequestForm.jsx','src/utils/budgetApi.js','src/utils/financeNavigation.js','src/pages/DashboardSensei.jsx','src/pages/lms/LmsDashboard.jsx','vite.config.js','copy-backend.js'];
 for(const file of files){const target=path.join(destination,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
 console.log('Local backup created: '+path.relative(root,destination));
 }finally{await db.end();}
}
main().catch(e=>{console.error('Backup failed: '+(e.code||e.name));process.exitCode=1;});
