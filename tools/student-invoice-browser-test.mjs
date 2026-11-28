import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const root = process.cwd();
const fixturePath = path.join(root, '.be012-ui.html');
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'be012-browser-'));
const browserPath = process.env.BE012_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const data = { status: 'success', permissions: { prepare: true }, data: {
  students: [
    { id: 17, nis: 'NIS-901', web_id: 9001, name: 'Siswa Database', program: 'Program Resmi', total_biaya: '15000000.01', metode_pembayaran: 'Full Payment', email: '', no_wa: '' },
    { id: 18, nis: 'NIS-902', name: 'Siswa Cicilan', program: 'Program Cicilan', total_biaya: '18000000.00', metode_pembayaran: 'Cicilan' },
  ], enrollment_schema_ready: true,
  enrollments: [
    { id: 71, student_id: 17, external_enrollment_id: 'enroll-first', program: 'Program Resmi', cohort: '2026-A', payment_scheme: 'full', enrollment_status: 'approved', review_reason: '' },
    { id: 72, student_id: 18, external_enrollment_id: 'enroll-cicilan', program: 'Program Cicilan', cohort: '2026-B', payment_scheme: 'cicilan', enrollment_status: 'approved', review_reason: '' },
    { id: 73, student_id: 17, external_enrollment_id: 'enroll-second', program: 'Program Kedua', cohort: '2027-C', payment_scheme: 'full', enrollment_status: 'approved', review_reason: '' },
  ], charges: [
    { id: 81, enrollment_id: 71, charge_type: 'program_fee', charge_key: 'tuition', label: 'Program fee', amount: '15000000.01', scheme: 'full', installments: [{ label: 'Full Payment', amount: '15000000.01', due_days: 7 }] },
    { id: 82, enrollment_id: 72, charge_type: 'program_fee', charge_key: 'tuition', label: 'Program fee', amount: '18000000.00', scheme: 'cicilan', installments: [{ label: 'DP', amount: '5000000.01', due_days: 7 }, { label: 'Pelunasan', amount: '12999999.99', due_days: 37 }] },
    { id: 83, enrollment_id: 73, charge_type: 'program_fee', charge_key: 'tuition', label: 'Program kedua', amount: '500.01', scheme: 'full', installments: [{ label: 'Full Payment', amount: '500.01', due_days: 7 }] },
  ], accounts: [{ id: 45, is_active: 1, report_class: 'cash' }],
  banks: [{ id: 3, account_id: 45, is_active: 1, name: 'Rekening Resmi', bank_name: 'Bank Uji', account_number: '000123', account_holder: 'Pemilik Terverifikasi', code: '1120' }],
} };
const fixture = `<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react'; import {createRoot} from 'react-dom/client'; import axios from 'axios'; import Swal from 'sweetalert2';
import Wizard from '/src/components/BuatInvoiceWizardModal.jsx'; import '/src/index.css';
const original=${JSON.stringify(data)}; const root=createRoot(document.getElementById('root')); let key=0;
Swal.fire=async options=>{window.__alerts.push(options);return {isConfirmed:false}};
axios.defaults.adapter=async config=>{
 const body=typeof config.data==='string'?JSON.parse(config.data):config.data;window.__requests.push({method:config.method,url:config.url,body});
 const response=data=>({data,status:200,statusText:'OK',headers:{},config});
 if(config.url.endsWith('session.php'))return response({status:'success',csrf_token:'mock-csrf'});
 if(config.url.endsWith('accounting.php'))return response(window.__lookup);
 if(config.url.endsWith('sync_students_web.php'))return response({status:'success',data:[{id:999999,web_id:999999}]});
 if(config.method==='get'&&config.url.endsWith('billing.php')){
  if(window.__mode==='offline')throw new Error('Offline');
  return response({status:'success',data:{invoice:window.__mode==='committed'?{id:'TGCJ26110001',student_id:17,enrollment_id:71,charge_id:81,status:'Unpaid'}:null}});
 }
 if(config.method==='post'&&config.url.endsWith('billing.php')){
  window.__lastId=body.id;
  if(window.__mode==='network'||window.__mode==='offline'||window.__mode==='committed')throw new Error('Network Error');
  if(window.__mode==='mismatch'||window.__mode==='bank'||window.__mode==='conflict'){
   const error=new Error('API rejected');error.response={status:window.__mode==='mismatch'?422:409,data:{status:'error',message:window.__mode==='mismatch'?'Total tidak sama dengan biaya resmi':window.__mode==='bank'?'Data rekening resmi belum lengkap':'Nomor invoice sudah digunakan'}};throw error;
  }
  return response({status:'success',data:{id:'TGCJ26110001',student_id:body.student_id,enrollment_id:body.enrollment_id,charge_id:body.charge_id,created_now:true,status:'Unpaid'}});
 }
 throw new Error('Unexpected API '+config.url);
};
window.__reset=(mode='success',missingHolder=false)=>{
 window.__mode=mode;window.__requests=[];window.__alerts=[];window.__success=0;window.__closed=0;window.__lookup=structuredClone(original);
 if(missingHolder)delete window.__lookup.data.banks[0].account_holder;
 if(mode==='no-enrollment')window.__lookup.data.enrollments=[];
 if(mode==='no-approval')window.__lookup.data.charges=[];
 localStorage.setItem('saved_custom_invoices','[{"id":"POISON","total":1}]');
 root.render(React.createElement(Wizard,{key:++key,onSuccess:()=>window.__success++,onClose:()=>{window.__closed++;root.render(null)}}));
};window.__reset();
</script></body></html>`;

let server, browser, socket;
let checks = 0;
try {
  await fs.writeFile(fixturePath, fixture);
  server = await createServer({ logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  let browserLog = '';
  browser = spawn(browserPath, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-extensions', '--disable-sync', 'about:blank'], { stdio: ['ignore','ignore','pipe'], windowsHide: true });
  browser.stderr.on('data', chunk => { browserLog = (browserLog + chunk).slice(-2000); });
  let active;
  for (let i = 0; i < 200; i++) { try { active = (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).trim().split('\n'); break; } catch { await delay(100); } }
  if (!active) throw new Error('Headless browser did not start');
  let version;
  for (let i = 0; i < 50; i++) { try { version = await fetch(`http://127.0.0.1:${active[0].trim()}/json/version`).then(response => response.json()); break; } catch { await delay(100); } }
  if (!version) throw new Error(`Browser DevTools unavailable (exit ${browser.exitCode}): ${browserLog}`);
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', event => reject(new Error(event.message || event.error?.message || 'DevTools socket failed')), { once: true }); });
  let sequence = 0; const pending = new Map();
  socket.addEventListener('message', event => { const message = JSON.parse(event.data); const call = pending.get(message.id); if (call) { pending.delete(message.id); if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result); } });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression, label = expression) => {
    for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await delay(100); }
    throw new Error(`UI timeout: ${label}; ${(await evaluate('document.body.innerText')).slice(0, 1800)}`);
  };
  const click = text => evaluate(`Array.from(document.querySelectorAll('button')).find(button=>button.textContent.trim()===${JSON.stringify(text)}).click()`);
  const select = (index, value) => evaluate(`(()=>{const el=document.querySelectorAll('select')[${index}];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const issueEnabled = `Array.from(document.querySelectorAll('button')).find(button=>button.textContent.trim()==='Terbitkan Invoice')?.disabled===false`;
  const ready = async (mode = 'success', missing = false) => {
    await evaluate(`window.__reset(${JSON.stringify(mode)},${missing})`);
    await wait(`Array.from(document.querySelectorAll('select')[0]?.options||[]).some(option=>option.value==='17')`);
    await select(0, '17');
    if (!['no-enrollment','no-approval'].includes(mode)) { await select(1, '71'); await select(2, '81'); }
    if (!missing && !['no-enrollment','no-approval'].includes(mode)) { await select(3, '3'); await wait(issueEnabled); }
  };
  const pass = label => { checks++; console.log(`PASS: ${label}`); };
  await send('Page.navigate', { url: `${server.resolvedUrls.local[0]}.be012-ui.html` }, sessionId);
  await wait(`typeof window.__reset==='function'`);
  await ready();
  assert.equal(await evaluate(`document.body.innerText.includes('Rp 15.000.000,01')`), true);
  assert.equal(await evaluate(`document.querySelectorAll('input[type=number]').length`), 0);
  assert.equal(await evaluate(`document.querySelectorAll('input[readonly]').length>=4`), true);
  await click('Preview Invoice'); await wait(`document.body.innerText.includes('PRATINJAU')`);
  assert.equal(await evaluate(`document.body.innerText.includes('Pemilik Terverifikasi')`), true);
  // Close the preview using its upper close action, leaving the invoice form open.
  await evaluate(`document.querySelectorAll('.fixed')[1].querySelector('button[title]')?.click()`);
  await ready();
  await click('Simpan Draft');
  assert.equal(await evaluate(`window.__alerts.at(-1).title`), 'Penyimpanan Draft Belum Tersedia');
  assert.equal(await evaluate('window.__closed+window.__success'), 0);
  assert.equal(await evaluate(`localStorage.getItem('saved_custom_invoices')`), '[{"id":"POISON","total":1}]');
  pass('Read-only official fields, exact preview and honest draft behavior; no local invoice write');
  await click('+ Tambah Siswa Baru');
  await wait(`!(${issueEnabled})`);
  assert.equal(await evaluate(`document.body.innerText.includes('Siswa harus terdaftar di database')`), true);
  pass('Manual student UI remains visible and cannot publish');
  await ready(); await click('Tarik Siswa dari Web Pendaftaran');
  await wait(`window.__requests.some(row=>row.url.includes('sync_students_web.php'))&&window.__requests.filter(row=>row.url.includes('accounting.php')).length>=2`);
  assert.equal(await evaluate(`document.querySelector('select').value`), '17');
  assert.equal(await evaluate(`Array.from(document.querySelector('select').options).some(option=>option.value==='999999')`), false);
  pass('Student sync reloads database IDs and keeps the selected official identity');
  for (const mode of ['mismatch','bank','conflict','network','offline']) {
    await ready(mode);
    await click('Terbitkan Invoice'); await wait('Boolean(document.querySelector("[role=alert]"))');
    assert.equal(await evaluate('window.__success+window.__closed'), 0);
    if (mode === 'bank') assert.equal(await evaluate('document.body.innerText.includes("Finance/DB PIC")'), true);
    if (mode === 'offline') {
      await click('Terbitkan Invoice'); await delay(200);
      assert.equal(await evaluate('window.__requests.filter(row=>row.method==="post"&&row.url.endsWith("billing.php")).length'), 1);
    }
    const posted = await evaluate('window.__requests.find(row=>row.method==="post"&&row.url.endsWith("billing.php")).body');
    assert.equal(posted.id, undefined); assert.equal(posted.enrollment_id, 71); assert.equal(posted.charge_id, 81);
    pass('API '+mode+': form retained without false success; stable charge identity retained');
  }
  await ready('success', true);
  assert.equal(await evaluate(issueEnabled), false);
  assert.equal(await evaluate('document.body.innerText.includes("account_holder")'), true);
  pass('Missing official account holder still blocks publishing');
  for (const mode of ['no-enrollment','no-approval']) {
    await ready(mode); assert.equal(await evaluate(issueEnabled), false);
    assert.equal(await evaluate('document.body.innerText.includes("Finance/DB PIC")'), true);
    pass(mode+' explains missing enrollment/charge approval and blocks issuance');
  }
  await ready(); await select(1, '73'); await select(2, '83'); await wait(issueEnabled);
  assert.equal(await evaluate('document.body.innerText.includes("Rp 500,01")'), true);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('td')).some(cell=>cell.textContent==='2027-C')`), true);
  await click('Terbitkan Invoice'); await wait('window.__success===1');
  let posted = await evaluate('window.__requests.find(row=>row.method==="post"&&row.url.endsWith("billing.php")).body');
  assert.equal(posted.student_id, 17); assert.equal(posted.enrollment_id, 73); assert.equal(posted.total, '500.01');
  pass('Same student selects second program/cohort with separate official charge price');
  await ready(); await select(0, '18'); await select(1, '72'); await select(2, '82'); await wait(issueEnabled);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('input[aria-label="Nominal termin"]')).every(el=>el.readOnly)`), true);
  await click('Terbitkan Invoice'); await wait('window.__success===1');
  posted = await evaluate('window.__requests.find(row=>row.method==="post"&&row.url.endsWith("billing.php")).body');
  assert.equal(posted.student_id, 18); assert.equal(posted.skema, 'cicilan');
  assert.deepEqual(posted.installments.map(row => row.nominal), ['5000000.01', '12999999.99']);
  pass('Approved cicilan schedule stays read-only with exact decimal terms and no extra invoice');
  await ready('committed'); await click('Terbitkan Invoice'); await wait('window.__success===1&&window.__closed===1');
  assert.equal(await evaluate('window.__alerts.at(-1).text.includes("sudah tersedia di server")'), true);
  assert.equal(await evaluate('window.__requests.filter(row=>row.method==="post"&&row.url.endsWith("billing.php")).length'), 1);
  pass('Lost response reconciles the exact committed charge without issuing another invoice');
  await ready(); await click('Terbitkan Invoice'); await wait('window.__success===1&&window.__closed===1');
  posted = await evaluate('window.__requests.find(row=>row.method==="post"&&row.url.endsWith("billing.php")).body');
  assert.equal(posted.id, undefined); assert.equal(posted.student_id, 17); assert.equal(posted.bank_account_id, 3); assert.equal(posted.enrollment_id, 71); assert.equal(posted.charge_id, 81); assert.equal(posted.account_holder, undefined);
  assert.equal(await evaluate('window.__alerts.at(-1).text.includes("TGCJ26110001")'), true);
  pass('Confirmed backend number alone completes issuance and refreshes parent');
  console.log(`PASS: ${checks} headless browser integration scenarios using mock API (not backend E2E).`);
} finally {
  socket?.close(); browser?.kill(); await server?.close();
  await fs.rm(fixturePath, { force: true });
  // Only this test's randomly created OS temp profile may be removed.
  if (profile.startsWith(path.join(os.tmpdir(), 'be012-browser-'))) {
    for (let i = 0; i < 20; i++) { try { await fs.rm(profile, { recursive: true, force: true }); break; } catch { await delay(100); } }
  }
}
