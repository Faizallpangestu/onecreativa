// Local CLI only. No historical data is changed or inferred by this migration.
const {fs,path,crypto,mysql,root,hash,connect,snapshot,assertPreserved,normalizeSchema,safeTestDatabase} = require('./local-database.cjs');
async function main() {
  const apply = process.argv.includes('--apply-local');
  const {db, configured} = await connect();
  const testName = 'one_creativa_release_test_' + crypto.randomBytes(8).toString('hex');
  safeTestDatabase(testName, configured);
  const version = process.argv.includes('--overtime')?'20261012_overtime_requests':process.argv.includes('--student-payments')?'20261012_student_payments':(process.argv.includes('--attendance-sessions')?'20261012_attendance_sessions':'20261012_relationships');
  const sqlPath = path.join(root, 'backend/migrations',version+'.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql.replace(/^--.*$/gm, '').split(';').map(s=>s.trim()).filter(Boolean);
  if (statements.length !== (version==='20261012_relationships'?9:1) || statements.some(s=>!/^CREATE TABLE [a-z_]+ \(/.test(s))) throw Error('Unexpected migration scope');
  const names = statements.map(s=>s.match(/^CREATE TABLE ([a-z_]+)/)[1]);
  const backupDir = path.join(root, 'backend/storage/backups', 'release-' + Date.now());
  fs.mkdirSync(backupDir, {recursive:true});
  let test;
  let createdTest = false;
  try {
    if ((await db.query("SELECT GET_LOCK('creativa_relationships_release',0) AS locked"))[0][0].locked !== 1) throw Error('Another release process is running');
    // The backup is a consistent read. Live writes are checked again before applying.
    await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    const before = await snapshot(db);
    const triggers = [];
    for (const t of (await db.query('SHOW TRIGGERS'))[0]) {
      const detail = (await db.query('SHOW CREATE TRIGGER ' + mysql.escapeId(t.Trigger)))[0][0];
      triggers.push(detail['SQL Original Statement'].replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, ''));
    }
    const views = (await db.query("SHOW FULL TABLES WHERE Table_type='VIEW'"))[0];
    if (views.length) throw Error('Views require an extended backup procedure before applying');
    await db.query('COMMIT');
    const dump = ['SET NAMES utf8mb4;', 'SET FOREIGN_KEY_CHECKS=0;'];
    for (const [name, t] of Object.entries(before)) {
      dump.push(t.schema + ';');
      for (const row of t.rows) dump.push('INSERT INTO ' + mysql.escapeId(name) + ' (' + Object.keys(row).map(mysql.escapeId).join(',') + ') VALUES (' + Object.values(row).map(mysql.escape).join(',') + ');');
    }
    // Triggers are separate statements so compound trigger bodies need no SQL splitting.
    dump.push('SET FOREIGN_KEY_CHECKS=1;');
    fs.writeFileSync(path.join(backupDir,'database.sql'), dump.join('\n') + '\n');
    fs.writeFileSync(path.join(backupDir,'triggers.json'), JSON.stringify(triggers));
    fs.writeFileSync(path.join(backupDir,'snapshot.json'), JSON.stringify(before));
    for (const dir of ['uploads','storage']) {
      const from = path.join(root, 'backend', dir);
      if (!fs.existsSync(from)) continue;
      for (const entry of fs.readdirSync(from)) {
        if (dir==='storage' && entry==='backups') continue;
        fs.cpSync(path.join(from,entry), path.join(backupDir,dir,entry), {recursive:true, filter:p=>!fs.lstatSync(p).isSymbolicLink()});
      }
    }
    await db.query('CREATE DATABASE ' + mysql.escapeId(testName) + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
    createdTest = true;
    test = (await connect(testName)).db;
    await test.query('SET FOREIGN_KEY_CHECKS=0');
    const storedBackup = JSON.parse(fs.readFileSync(path.join(backupDir,'snapshot.json'),'utf8'), (key,value)=>value && value.type==='Buffer' && Array.isArray(value.data)?Buffer.from(value.data):value);
    for (const [name, t] of Object.entries(storedBackup)) {
      await test.query(t.schema);
      for (const row of t.rows) await test.query('INSERT INTO ' + mysql.escapeId(name) + ' SET ?', row);
    }
    await test.query('SET FOREIGN_KEY_CHECKS=1');
    for (const trigger of JSON.parse(fs.readFileSync(path.join(backupDir,'triggers.json'),'utf8'))) await test.query(trigger);
    const restored = await snapshot(test);
    assertPreserved(before, restored);
    for (const name of Object.keys(before)) if (normalizeSchema(before[name].schema)!==normalizeSchema(restored[name].schema)) throw Error('Restored schema differs: ' + name);
    if ((await test.query('SHOW TRIGGERS'))[0].length !== triggers.length) throw Error('Trigger restore mismatch');
    const expectedSchemas = {};
    for (let i=0;i<statements.length;i++) {
      if (restored[names[i]]) {
        const comparisonName='release_expected_'+names[i];
        await test.query(statements[i].replace('CREATE TABLE '+names[i]+' (','CREATE TABLE '+comparisonName+' ('));
        const actual=(await test.query('SHOW CREATE TABLE '+mysql.escapeId(comparisonName)))[0][0]['Create Table'];
        expectedSchemas[names[i]]=actual.replaceAll('`'+comparisonName+'`','`'+names[i]+'`');
      } else {
        await test.query(statements[i]);
        expectedSchemas[names[i]]=(await test.query('SHOW CREATE TABLE '+mysql.escapeId(names[i])))[0][0]['Create Table'];
      }
    }
    const expected = await snapshot(test);
    assertPreserved(before, expected);
    // Verify checks and foreign keys with actual server metadata.
    for (const name of names) {
      if (!expected[name] || !expected[name].schema.includes('FOREIGN KEY')) throw Error('Missing relationship constraint');
    }
    const preflight = await snapshot(db);
    assertPreserved(before, preflight);
    for (const name of names) if (preflight[name] && normalizeSchema(preflight[name].schema)!==normalizeSchema(expectedSchemas[name])) throw Error('Existing incompatible relationship schema: ' + name);
    const applied = [];
    if (apply) {
      for (let i=0;i<names.length;i++) {
        if (!preflight[names[i]]) { await db.query(statements[i]); applied.push(names[i]); }
      }
    }
    const after = await snapshot(db);
    assertPreserved(before, after);
    if (apply) for (const name of names) if (normalizeSchema(after[name].schema)!==normalizeSchema(expectedSchemas[name])) throw Error('Applied schema mismatch: ' + name);
    const report = {verified_at:new Date().toISOString(),database:configured,local_only:true,migration:version,migration_sha256:hash(sql),mode:apply?'applied-local':'dry-run',backup:path.relative(root,backupDir).replaceAll('\\','/'),backup_sha256:hash(fs.readFileSync(path.join(backupDir,'database.sql'))),restore_verified:true,triggers_restored:triggers.length,original_tables:Object.keys(before).length,original_rows_unchanged:true,tables:names,created:applied,historical_recovery_executed:false};
    fs.writeFileSync(path.join(backupDir,'manifest.json'),JSON.stringify(report,null,2)+'\n');
    fs.writeFileSync(path.join(root,'docs/audit/'+version+'-'+(apply?'applied':'dry-run')+'.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
  } finally {
    if(test)await test.end();
    if(createdTest){safeTestDatabase(testName,configured);await db.query('DROP DATABASE '+mysql.escapeId(testName));}
    await db.query("SELECT RELEASE_LOCK('creativa_relationships_release')");
    await db.end();
  }
}
main().catch(e=>{console.error('Release failed: '+(e.code || e.message));process.exitCode=1;});
