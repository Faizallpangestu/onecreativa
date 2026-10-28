// Real browser/API checks; every mutation uses a disposable synthetic database.
const { fs, path, crypto, root, connect, snapshot, assertPreserved, safeTestDatabase } = require('./local-database.cjs');
const { spawn, execFileSync } = require('node:child_process');
const net = require('node:net');
const assert = require('node:assert/strict');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function port() { return new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); }); }
async function ready(url) { for (let i = 0; i < 100; i++) { try { await fetch(url); return; } catch {} await delay(200); } throw Error('Server did not start: ' + url); }
class Browser {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) { const p = this.pending.get(message.id); this.pending.delete(message.id); if (message.error) p?.reject(Error(message.error.message)); else p?.resolve(message.result); }
      if (message.method === 'Page.javascriptDialogOpening') void this.send('Page.handleJavaScriptDialog', { accept: true }, message.sessionId);
    });
  }
  send(method, params = {}, sessionId) { return new Promise((resolve, reject) => { const id = ++this.id; this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }); }
  async page() {
    const { browserContextId } = await this.send('Target.createBrowserContext');
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    await this.send('Runtime.enable', {}, sessionId); await this.send('Page.enable', {}, sessionId);
    return new Page(this, sessionId);
  }
}
class Page {
  constructor(browser, id) { this.browser = browser; this.id = id; }
  async eval(expression) { const result = await this.browser.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }, this.id); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; }
  async wait(expression) { for (let i = 0; i < 300; i++) { try { if (await this.eval(expression)) return; } catch {} await delay(100); } throw Error('UI timeout: ' + expression + '; ' + (await this.eval('document.body.innerText')).slice(-900)); }
  async goto(url) { await this.browser.send('Page.navigate', { url }, this.id); await this.wait('document.readyState !== "loading"'); }
  async text(value) { await this.wait('document.body.innerText.toLowerCase().includes(' + JSON.stringify(value.toLowerCase()) + ')'); }
  async click(selector) { await this.wait(`!!document.querySelector(${JSON.stringify(selector)}) && !document.querySelector(${JSON.stringify(selector)}).disabled`); await this.eval(`document.querySelector(${JSON.stringify(selector)}).click()`); }
  async button(value) { await this.eval(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(value)}).click()`); }
  async fill(label, value) { await this.eval(`(()=>{const l=Array.from(document.querySelectorAll('label')).find(l=>l.textContent.trim().startsWith(${JSON.stringify(label)}));const e=l?.querySelector('input,select');if(!e)throw Error('Missing field');const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`); }
  async login(origin, email) {
    await this.goto(origin + '/login'); await this.text('Masuk');
    const result = await this.eval(`fetch('/api/login.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:${JSON.stringify(email)},password:'synthetic-test-only'})}).then(r=>r.json())`);
    assert.equal(result.status, 'success');
    await this.eval('localStorage.setItem("user",' + JSON.stringify(JSON.stringify(result.user)) + ')');
  }
}
async function main() {
  const { db, configured } = await connect(); const before = await snapshot(db);
  const name = 'one_creativa_release_test_' + crypto.randomBytes(8).toString('hex'); safeTestDatabase(name, configured);
  const dir = path.join(root, 'backend/storage/qa', name); fs.mkdirSync(path.join(dir, 'sessions'), { recursive: true });
  let browser, created = false; const processes = []; const checks = [];
  const check = (value, label) => { assert(value, label); checks.push(label); console.log('PASS: ' + label); };
  try {
    await db.query('CREATE DATABASE `' + name + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'); created = true;
    await db.query('USE `' + name + '`'); await db.query('SET FOREIGN_KEY_CHECKS=0');
    for (const table of Object.values(before)) await db.query(table.schema);
    await db.query('SET FOREIGN_KEY_CHECKS=1');
    if (!(await db.query("SHOW COLUMNS FROM users LIKE 'deleted_at'"))[0].length) await db.query('ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL');
    await db.query("INSERT INTO roles(id,name,label) VALUES(1,'super_admin','Admin'),(2,'peserta_intensif','Siswa'),(3,'lpk','LPK')");
    const hash = execFileSync('C:/Muhammadfaizal/php/php.exe', ['-r', "echo password_hash('synthetic-test-only',PASSWORD_DEFAULT);"], { encoding: 'utf8' });
    for (const [id, role, email] of [[101,1,'admin@example.test'],[201,2,'history@example.test'],[202,2,'clean@example.test'],[203,2,'orphan@example.test'],[301,3,'lpk@example.test']]) await db.execute('INSERT INTO users(id,email,password_hash,role_id,is_active) VALUES(?,?,?,?,1)', [id,email,hash,role]);
    await db.query("INSERT INTO employees(id,user_id,employee_code,full_name,position,join_date) VALUES(10,101,'ADMIN-TEST','Synthetic Admin','ADMIN','2026-01-01'),(20,201,'HISTORY-TEST','History Learner','PESERTA_INTENSIF','2026-01-01'),(30,202,'CLEAN-TEST','Clean Learner','PESERTA_INTENSIF','2026-01-01')");
    await db.query("INSERT INTO peserta_intensif(id,user_id,nama_lengkap,email,no_wa,level,batch) VALUES(50,201,'History Learner','history@example.test','','N5','Test Batch'),(60,202,'Clean Learner','clean@example.test','','N5','Test Batch')");
    await db.query("INSERT INTO attendance_logs(employee_id,date,check_in_at,status) VALUES(20,'2026-01-02','2026-01-02 09:00:00','present')");
    const apiPort = await port(), uiPort = await port(), chromePort = await port();
    const env = { ...process.env, CREATIVA_PRIVATE_UPLOAD_DIR: path.join(dir,'uploads'), CREATIVA_RELEASE_TEST_DB: name, CREATIVA_API_TARGET: 'http://127.0.0.1:' + apiPort };
    const start = (exe, args) => { const log = fs.openSync(path.join(dir,'process-' + processes.length + '.log'), 'a'); const p = spawn(exe,args,{cwd:root,env,windowsHide:true,stdio:['ignore',log,log]}); processes.push(p); fs.closeSync(log); };
    start('C:/Muhammadfaizal/php/php.exe',['-d','session.save_path=' + path.join(dir,'sessions'),'-S','127.0.0.1:' + apiPort,'backend/tests/release_test_router.php']);
    start(process.execPath,['node_modules/vite/bin/vite.js',...(process.argv.includes('--preview')?['preview']:[]),'--host','127.0.0.1','--port',String(uiPort),'--strictPort']);
    start('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--disable-gpu','--disable-extensions','--disable-component-extensions-with-background-pages','--no-first-run','--no-default-browser-check','--remote-debugging-address=127.0.0.1','--remote-debugging-port=' + chromePort,'--user-data-dir=' + path.join(dir,'chrome'),'about:blank']);
    const origin = 'http://127.0.0.1:' + uiPort;
    await Promise.all([ready(origin),ready('http://127.0.0.1:' + apiPort + '/api/session.php'),ready('http://127.0.0.1:' + chromePort + '/json/version')]);
    const ws = new WebSocket((await fetch('http://127.0.0.1:' + chromePort + '/json/version').then(r=>r.json())).webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});}); browser = new Browser(ws);
    const admin = await browser.page(), student = await browser.page(), unauth = await browser.page();
    await unauth.goto(origin + '/access-rights-siswa'); await unauth.wait('location.pathname === "/login"'); check(true,'Unauthenticated access redirects to login');
    await student.login(origin,'history@example.test');
    await student.eval('localStorage.setItem("user",JSON.stringify({id:201,role_name:"super_admin",name:"Forged admin"}))');
    await student.goto(origin + '/access-rights-siswa'); await student.wait('location.pathname === "/dashboard-siswa-intensif"');
    check((await student.eval('JSON.parse(localStorage.getItem("user")).role_name')) === 'peserta_intensif','Server role overrides forged browser role and blocks account management');
    await admin.login(origin,'admin@example.test');
    await admin.eval('localStorage.setItem("cached_access_accounts_lms",JSON.stringify([{id:999,user_id:999,name:"Stale Account",role_name:"peserta_intensif"}]))');
    await admin.goto(origin + '/access-rights-siswa'); await admin.text('History Learner');
    check(!(await admin.eval('document.body.innerText')).includes('Stale Account'),'Old cached account list is discarded');
    await admin.click('button[aria-label="Hapus akun Clean Learner"]'); await admin.text('Akun LMS berhasil dihapus dari database.');
    await admin.wait('!document.querySelector(\'button[aria-label="Hapus akun Clean Learner"]\')');
    check(!(await db.query('SELECT id FROM users WHERE id=202'))[0].length,'UI deletion removes correct user ID despite different employee ID');
    await admin.click('button[aria-label="Hapus akun orphan@example.test"]'); await admin.wait('!document.querySelector(\'button[aria-label="Hapus akun orphan@example.test"]\')');
    check(!(await db.query('SELECT id FROM users WHERE id=203'))[0].length,'UI can delete account with no employee profile');
    await admin.click('button[aria-label="Hapus akun History Learner"]'); await admin.text('Riwayat pembelajaran dan transaksi tetap tersimpan.');
    await admin.goto(origin + '/access-rights-siswa'); await admin.text('Belum Ada Akun Siswa');
    check((await db.query('SELECT id FROM attendance_logs WHERE employee_id=20'))[0].length === 1,'Archived deletion stays absent after reload and preserves attendance');
    await student.eval('window.dispatchEvent(new Event("focus"))'); await student.wait('location.pathname === "/login"');
    check((await student.eval('localStorage.getItem("user")')) === null,'Deleted access revokes open browser session');
    await admin.button('Buat Akun Siswa'); await admin.text('Nama Pemegang Akun');
    for (const [label,value] of [['Nama Pemegang Akun','New Learner'],['Email Login','new@example.test'],['Password','synthetic-test-only'],['Level','N5'],['Batch','New Batch']]) await admin.fill(label,value);
    await admin.click('button[type="submit"]'); await admin.text('Akun New Learner berhasil dibuat.'); await admin.text('New Learner');
    const newAccount = (await db.query("SELECT id,is_active FROM users WHERE email='new@example.test'"))[0][0]; check(!!newAccount,'New login account persists through UI');
    await admin.click('button[aria-label="Edit akun New Learner"]'); await admin.text('Edit Akun LMS'); await admin.fill('Status Login','0'); await admin.click('button[type="submit"]'); await admin.text('Akun New Learner berhasil diperbarui.');
    check((await db.query('SELECT is_active FROM users WHERE id=?',[newAccount.id]))[0][0].is_active === 0,'UI status update disables login');
    const rejected = await admin.eval("fetch('/api/login.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'new@example.test',password:'synthetic-test-only'})}).then(r=>r.status)"); check(rejected === 401,'Inactive account login is denied');
    await admin.button('Logout'); await admin.wait('location.pathname === "/login"'); await admin.text('Masuk'); await delay(1000);
    check((await admin.eval('location.pathname')) === '/login','Logout completes before session check and stays on login');
    if (process.argv.includes('--attendance')) {
      await db.query("INSERT INTO roles(id,name,label) VALUES(4,'karyawan','Karyawan')");
      await db.execute('INSERT INTO users(id,email,password_hash,role_id,is_active) VALUES(401,?,?,4,1)',['worker@example.test',hash]);
      await db.query("INSERT INTO employees(id,user_id,employee_code,full_name,position,join_date,work_type) VALUES(40,401,'WORKER-TEST','Synthetic Worker','Staff','2026-01-01','WFH')");
      await db.query("INSERT INTO settings(id,office_latitude,office_longitude,office_radius) VALUES(1,'-6.2088','106.8456',50)");
      if (!(await db.query("SHOW TABLES LIKE 'face_enrollments'"))[0].length) await db.query('CREATE TABLE face_enrollments(employee_id INT,descriptors LONGTEXT,quality_score FLOAT,is_active INT)');
      const worker = await browser.page();
      await browser.send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:success=>success({coords:{latitude:-6.2088,longitude:106.8456}})}})"},worker.id);
      await worker.goto(origin+'/login?redirect=//example.invalid'); await worker.text('Masuk');
      await worker.eval('navigator.serviceWorker.ready.then(()=>true)');
      await worker.goto(origin+'/login?redirect=//example.invalid'); await worker.text('Masuk');
      check((await worker.eval('document.querySelector(\'script[type="module"]\').src')).includes('/assets/login-'),'Service worker keeps repeat login visits on lightweight public entry');
      await worker.wait('!document.querySelector(\'button[type="submit"]\').disabled');
      await worker.click('button[aria-label="Tampilkan password"]'); await worker.wait('document.getElementById("password").type === "text"');
      await worker.click('button[aria-label="Sembunyikan password"]'); await worker.wait('document.getElementById("password").type === "password"');
      check(true,'Public login password toggle has accessible names and works');
      await worker.eval("(()=>{document.getElementById('email').value='worker@example.test';document.getElementById('password').value='synthetic-test-only';})()");
      await worker.click('button[type="submit"]'); await worker.wait('location.pathname === "/menu-karyawan"');
      check((await worker.eval('location.origin'))===origin,'Public login authenticates and rejects external redirect');
      await worker.eval('localStorage.removeItem("user")');
      await worker.goto(origin + '/face-clock'); await worker.text('Mode: WFH');
      check((await worker.eval('JSON.parse(localStorage.getItem("user")).employee_id'))===40,'Server restores employee ID when local login cache is missing');
      const directoryCode = await worker.eval("fetch('/api/employees.php').then(r=>r.status)"); check(directoryCode===403,'Ordinary worker remains blocked from full employee directory');
      await worker.click('button[aria-label="Absen masuk"]'); await worker.text('Berhasil!');
      check((await db.query('SELECT id FROM attendance_logs WHERE employee_id=40 AND check_in_at IS NOT NULL'))[0].length===1,'Real UI clock in sends CSRF token and persists own attendance');
      await worker.button('TUTUP'); await worker.click('button[aria-label="Absen pulang"]'); await worker.text('Sampai jumpa');
      check((await db.query('SELECT id FROM attendance_logs WHERE employee_id=40 AND check_out_at IS NOT NULL'))[0].length===1,'Real UI clock out sends CSRF token and persists');
      await db.query("UPDATE employees SET work_type='WFO' WHERE id=40");
      await worker.goto(origin+'/face-clock'); await worker.text('Mode: WFO'); check(true,'Working mode refreshes from own profile instead of stale cache');
      await db.query('UPDATE users SET is_active=0 WHERE id=401'); await worker.eval('window.dispatchEvent(new Event("focus"))'); await worker.wait('location.pathname === "/login"');
      await worker.goto(origin+'/login'); await worker.text('Masuk');
      await worker.eval("(()=>{for(const [id,value]of [['email','worker@example.test'],['password','synthetic-test-only']]){const e=document.getElementById(id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}})()");
      await worker.click('button[type="submit"]'); await worker.text('Akun Anda nonaktif'); check(true,'Login UI explains inactive account after correct password');
    }
    console.log('PASS: ' + checks.length + ' browser access/login/attendance checks.');
  } finally {
    if (browser) { try { await browser.send('Browser.close'); } catch {} browser.ws.close(); }
    for (const p of processes) p.kill(); await delay(500);
    await db.query('USE ' + db.escapeId(configured)); assertPreserved(before,await snapshot(db));
    if (created) { safeTestDatabase(name,configured); await db.query('DROP DATABASE `' + name + '`'); }
    await db.end();
    fs.writeFileSync(path.join(root,'docs/audit/access-rights-verification.json'),JSON.stringify({synthetic_data_only:true,original_rows_unchanged:true,checks},null,2));
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
