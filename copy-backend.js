import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    if (['mail.local.php','db_env.php','backups','tests'].includes(entry.name)) continue;
    if (src === path.join(__dirname,'backend','api') && /^(test|debug|check|fix_|schema_dump|show_tables|migrate|db_|add_status_col|assets_migrate|profile_debug|resolve_map|jwt|cors)/i.test(entry.name)) continue;
    if (src === path.join(__dirname,'backend') && entry.isFile() && entry.name.endsWith('.php')) continue; // Configure SMTP separately on each server.
    if (src === path.join(__dirname,'backend','migrations') && !['.htaccess','repair_employee_schema.php','lms_account_deletion.php','finance_traceability.php','budget_workflow.php','salary_workflow.php','fix_collations.php','20261014_matching_jobs.sql','20261012_relationships.sql','20261012_attendance_sessions.sql','20261012_student_payments.sql','20261012_overtime_requests.sql','20261031_finance_production_master_seed.sql','hostinger_complete_migration.sql'].includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name === '.htaccess' && src === path.join(__dirname, 'backend')) continue; // Preserve the public root rules; copy directory protection rules.
    if (src === path.join(__dirname,'backend') && entry.name === 'storage') {
      fs.mkdirSync(destPath,{recursive:true});
      if(fs.existsSync(path.join(srcPath,'.htaccess')))fs.copyFileSync(path.join(srcPath,'.htaccess'),path.join(destPath,'.htaccess'));
      continue;
    }
    if(src === path.join(__dirname,'backend') && entry.name === 'uploads') {
      const copyProtection=(from,to)=>{
        fs.mkdirSync(to,{recursive:true});
        for(const item of fs.readdirSync(from,{withFileTypes:true})) {
          if(item.isDirectory())copyProtection(path.join(from,item.name),path.join(to,item.name));
          else if(item.name==='.htaccess')fs.copyFileSync(path.join(from,item.name),path.join(to,item.name));
        }
      };
      copyProtection(srcPath,destPath);
      continue;
    }
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const srcDir = path.join(__dirname, 'backend');
  const destDir = process.env.CREATIVA_RELEASE_OUT ? path.resolve(__dirname,process.env.CREATIVA_RELEASE_OUT) : path.join(__dirname, 'dist');
  if(!destDir.startsWith(__dirname+path.sep))throw new Error('Release output must be within the workspace');
  
  console.log('📦 Menyalin folder backend ke dalam dist...');
  copyDir(srcDir, destDir);
  if (fs.existsSync(path.join(__dirname, 'perbaiki_hostinger.php'))) {
    fs.copyFileSync(path.join(__dirname, 'perbaiki_hostinger.php'), path.join(destDir, 'perbaiki_hostinger.php'));
  }
  const distConfigDir = path.join(destDir, 'config');
  if (!fs.existsSync(distConfigDir)) fs.mkdirSync(distConfigDir, { recursive: true });
  fs.writeFileSync(
    path.join(distConfigDir, 'db_env.php'),
    "<?php\n$DB_HOST = 'localhost';\n$DB_USER = 'u260890310_one';\n$DB_PASS = 'Creativa4321!';\n$DB_NAME = 'u260890310_one';\n"
  );
  console.log('✅ Berhasil! Folder dist sekarang sudah berisi frontend & backend secara utuh.');

  console.log('📦 Membuat zip deploy otomatis: One-creativa-dist-production.zip...');
  try {
    const { execSync } = await import('child_process');
    execSync('powershell -Command "Compress-Archive -Path \'dist\\*\' -DestinationPath \'One-creativa-dist-production.zip\' -Force"', { stdio: 'inherit' });
    console.log('🎉 Selesai! File One-creativa-dist-production.zip siap di-upload ke Hostinger.');
  } catch (zErr) {
    console.warn('Pembuatan zip opsional:', zErr.message);
  }
} catch (err) {
  console.error('❌ Gagal menyalin backend:', err);
  process.exitCode=1;
}
