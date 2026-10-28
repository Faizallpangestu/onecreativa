// Compare all original row values with the private pre-change SQL snapshot.
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const mysql=require('mysql2/promise');
const root=path.resolve(__dirname,'..');const backup=path.join(root,'backend','storage','backups','phase2-1791778079699','database.sql');
const configDir=path.join(root,'backend','config');const config=fs.readFileSync(path.join(configDir,fs.existsSync(path.join(configDir,'db_env.php'))?'db_env.php':'database.php'),'utf8');
const literal=name=>{const m=config.match(new RegExp('\\$'+name+'\\s*=\\s*([\x27\x22])([^\x27\x22]*)\\1\\s*;'));if(!m)throw new Error('Unsupported configuration');return m[2];};
if(!['localhost','127.0.0.1','::1'].includes(literal('DB_HOST')))throw new Error('Local database required');
const digest=rows=>crypto.createHash('sha256').update(rows.sort().join('\n')).digest('hex');
async function main(){
  const dump=fs.readFileSync(backup,'utf8');const tables=new Map();
  for(const m of dump.matchAll(/CREATE TABLE `([A-Za-z0-9_]+)` \(\r?\n([\s\S]*?)\) ENGINE=/g))tables.set(m[1],{columns:[...m[2].matchAll(/^\s+`([A-Za-z0-9_]+)` /gm)].map(c=>c[1]),rows:[]});
  for(const line of dump.split(/\r?\n/)){const m=line.match(/^INSERT INTO `([A-Za-z0-9_]+)` \(([^)]+)\) VALUES \((.*)\);$/);if(m)tables.get(m[1]).rows.push(m[3]);}
  if(tables.size!==45)throw new Error('Incomplete original snapshot');
  const db=await mysql.createConnection({host:literal('DB_HOST'),user:literal('DB_USER'),password:literal('DB_PASS'),database:literal('DB_NAME'),dateStrings:true,supportBigNumbers:true,bigNumberStrings:true});
  try{await db.query('START TRANSACTION READ ONLY');const result=[];
    for(const [name,original] of tables){const [rows]=await db.query('SELECT '+original.columns.map(mysql.escapeId).join(',')+' FROM '+mysql.escapeId(name));const serialized=rows.map(row=>Object.values(row).map(mysql.escape).join(','));const unchanged=digest(serialized)===digest(original.rows);result.push({table:name,rows_before:original.rows.length,rows_after:rows.length,original_values_unchanged:unchanged});if(!unchanged)throw new Error('Original data mismatch in '+name);}
    await db.query('ROLLBACK');const before=JSON.parse(fs.readFileSync(path.join(root,'docs/finance/phase2-before.json'),'utf8'));const after=JSON.parse(fs.readFileSync(path.join(root,'docs/finance/phase2-after.json'),'utf8'));if(JSON.stringify(before.quality)!==JSON.stringify(after.quality))throw new Error('Financial aggregates changed');
    fs.writeFileSync(path.join(root,'docs/finance/phase2-data-integrity.json'),JSON.stringify({verified_at:new Date().toISOString(),original_tables_checked:result.length,all_original_values_unchanged:true,financial_aggregates_unchanged:true,tables:result},null,2)+'\n');console.log('PASS: all original row values in 45 tables and financial aggregates are unchanged.');
  }finally{await db.end();}
}
main().catch(e=>{console.error('Integrity verification failed: '+(e.code||e.message));process.exitCode=1;});
