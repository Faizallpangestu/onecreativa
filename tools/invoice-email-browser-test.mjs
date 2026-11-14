import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
const root=process.cwd();
const fixturePath=path.join(root,'.m31-ui.html');
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'m31-browser-'));
const browserPath=process.env.M31_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fixture=`<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import axios from 'axios';import Swal from 'sweetalert2';
import Finance from '/src/pages/InvoicePenagihan.jsx';import '/src/index.css';
const root=createRoot(document.getElementById('root'));let key=0;
Swal.fire=async options=>{window.__alerts.push(options);return {isConfirmed:window.__confirm}};
window.fetch=async url=>({ok:true,json:async()=>url.includes('billing.php')?{status:'success',data:{invoices:window.__invoices,pembayaran:[],terkirim:[]}}:url.includes('session.php')?{status:'success',user:{id:1,role:'finance',name:'Finance Uji'}}:{status:'success',data:[]}});
axios.defaults.adapter=async config=>{
 const body=typeof config.data==='string'?JSON.parse(config.data):config.data;window.__requests.push({method:config.method,url:config.url,body,params:config.params});
 const response=data=>({data,status:200,statusText:'OK',headers:{},config});
 if(config.url.includes('session.php'))return response({status:'success',csrf_token:'test-only'});
 if(config.method==='get' && config.url==='/api/billing.php'){
  if(config.params?.view==='email_attempts'){
   if(window.__mode==='offline' && window.__posts)throw new Error('Network Error');
   return response({status:'success',data:{attempts:window.__attempts}});
  }
  window.__invoices[0].email_delivery=window.__attempts[0]||null;
  return response({status:'success',data:{invoices:window.__invoices,siswa:[],pembayaran:[],terkirim:[],email_attempts:window.__attempts,automation_logs:[],rpa_status:{}}});
 }
 if(config.method==='post' && config.url==='/api/billing.php'){
  window.__posts++;if(window.__mode==='delayed')await new Promise(resolve=>setTimeout(resolve,350));
  if(window.__mode==='offline')throw new Error('Network Error');
  const failed=['reject','bank','smtp'].includes(window.__mode);
  const attempt={id:window.__attempts.length+1,invoice_id:body.invoice_id,request_id:body.request_id,status:failed?'Failed':'SMTP Accepted',recipient:'student@example.test',created_at:'2026-11-14 12:00:00',error_message:failed?'SMTP konfigurasi / penerima ditolak':''};
  window.__attempts.unshift(attempt);
  if(window.__mode==='lost')throw new Error('Network Error');
  if(failed){const error=new Error('Rejected');error.response={status:502,data:{status:'error',message:attempt.error_message,data:{attempt}}};throw error;}
  return response({status:'success',data:{attempt}});
 }
 return response({status:'success',data:[]});
};
window.__reset=(mode='accepted',existing=false)=>{
 window.__mode=mode;window.__confirm=true;window.__alerts=[];window.__requests=[];window.__posts=0;
 const id='TEST-'+(++key);
 window.__attempts=existing?[{id:1,invoice_id:id,request_id:'previous-test-only',status:mode==='pending'?'Pending':'SMTP Accepted',recipient:'student@example.test',created_at:'2026-11-14 11:00:00'}]:[];
 window.__invoices=[{id,customer:'Siswa Uji',email:mode==='missing'?'':'student@example.test',program:'Program Snapshot Resmi',total:'1000.25',tanggal:'2026-11-14',jatuhTempo:'2026-12-01',status:'Paid',terbayar:'1000.25',sisa:'0.00'}];
 localStorage.setItem('saved_custom_terkirim','[{"id":"FAKE","statusKirim":"Dibaca"}]');
 localStorage.setItem('user',JSON.stringify({id:1,role:'finance',name:'Finance Uji'}));
 root.render(React.createElement(BrowserRouter,null,React.createElement(Finance,{key})));
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
  const errors=[];
  socket.addEventListener('message', event => { const item=JSON.parse(event.data);if(item.method==='Runtime.exceptionThrown')errors.push(item.params.exceptionDetails.exception?.description || item.params.exceptionDetails.text); });
  await send('Runtime.enable',{},sessionId);
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression, label = expression) => {
    for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await delay(100); }
    throw new Error(`UI timeout: ${label}; ${(await evaluate('document.body.innerText')).slice(0, 1800)}; ${errors.join('; ')}`);
  };
  const click = text => evaluate(`Array.from(document.querySelectorAll('button')).find(button=>button.textContent.trim()===${JSON.stringify(text)}).click()`);
  const pass=message=>{checks++;console.log('PASS: '+message)};
  const ready=async(mode='accepted',existing=false)=>{await evaluate(`window.__reset(${JSON.stringify(mode)},${existing})`);await wait("document.body.innerText.includes('Siswa Uji')");};
  const sendButton="Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Kirim Email')";
  await send('Page.navigate',{url:`${server.resolvedUrls.local[0]}.m31-ui.html`},sessionId);
  await wait("typeof window.__reset==='function'");
  await wait("document.body.innerText.includes('Siswa Uji')");
  assert.equal(await evaluate("document.body.innerText.includes('student@example.test')"),true);pass('Finance displays official saved recipient');
  await click('Kirim Email');await wait('window.__posts===1&&window.__alerts.some(a=>a.title==="SMTP Accepted")');
  assert.equal(await evaluate('window.__requests.find(r=>r.method==="post").body.invoice_id'),await evaluate('window.__invoices[0].id'));
  assert.equal(await evaluate('window.__requests.find(r=>r.method==="post").body.action'),'send_invoice_email');pass('Send submits existing invoice only and shows actual acceptance');
  await wait("document.body.innerText.includes('Email: SMTP Accepted')");pass('Finance refreshes persisted SMTP state');
  await ready();await evaluate('window.__confirm=false');await click('Kirim Email');await delay(150);assert.equal(await evaluate('window.__posts'),0);pass('Cancelled confirmation sends nothing');
  await ready('delayed');await evaluate(sendButton+'.click();'+sendButton+'.click()');await wait('window.__posts===1&&window.__alerts.some(a=>a.title==="SMTP Accepted")');assert.equal(await evaluate('window.__posts'),1);pass('Double click submits one request');
  await ready('reject');await click('Kirim Email');await wait("window.__alerts.some(a=>a.icon==='error')");assert.equal(await evaluate("window.__alerts.some(a=>a.title==='SMTP Accepted')"),false);pass('SMTP failure cannot display success');
  await ready('lost');await click('Kirim Email');await wait("window.__alerts.some(a=>a.title==='SMTP Accepted')");assert.equal(await evaluate('window.__posts'),1);pass('Lost response reconciles accepted server attempt without sending twice');
  await ready('offline');await click('Kirim Email');await wait("window.__alerts.some(a=>a.icon==='error')");const key=await evaluate('window.__requests.find(r=>r.method==="post").body.request_id');
  await evaluate("window.__mode='accepted'");await click('Kirim Email');await wait("window.__alerts.some(a=>a.title==='SMTP Accepted')");assert.equal(await evaluate('window.__requests.filter(r=>r.method==="post").at(-1).body.request_id'),key);pass('Uncertain network retry retains stable invoice/request identity');
  await ready('pending',true);await click('Kirim Ulang Email');await wait("window.__alerts.some(a=>a.icon==='error')");assert.equal(await evaluate('window.__posts'),0);pass('Pending attempt blocks duplicate resend');
  await ready('missing');assert.equal(await evaluate(sendButton+'.disabled'),true);pass('Missing official recipient disables send');
  await ready('accepted',true);await click('Invoice Terkirim');await wait("document.body.innerText.includes('Belum diketahui')");assert.equal(await evaluate("document.body.innerText.includes('FAKE')"),false);pass('History uses server attempts and never invents read/local delivery status');
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.title==='Lihat Detail').click()");await wait("document.body.innerText.includes('Kirim Ulang Email')");await click('Kirim Ulang Email');await wait('window.__posts===1');
  assert.equal(await evaluate('window.__requests.find(r=>r.method==="post").body.previous_attempt_id'),1);pass('Resend modal uses same invoice with confirmed previous attempt');
  assert.equal(await evaluate('window.__invoices[0].status'),'Paid');pass('Send/resend preserves paid invoice state');
  console.log(`PASS: ${checks} Finance browser scenarios with mock API; no external email.`);
} finally {
 socket?.close();browser?.kill();await server?.close();await fs.rm(fixturePath,{force:true});
 if(profile.startsWith(path.join(os.tmpdir(),'m31-browser-')))for(let i=0;i<20;i++){try{await fs.rm(profile,{recursive:true,force:true});break;}catch{await delay(100);}}
}
