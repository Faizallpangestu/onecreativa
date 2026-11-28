import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
const root=process.cwd();
const fixturePath=path.join(root,'.m32-ui.html');
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'m32-browser-'));
const browserPath=process.env.M32_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fixture=`<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import axios from 'axios';import Swal from 'sweetalert2';
import Finance from '/src/pages/InvoicePenagihan.jsx';import '/src/index.css';
const root=createRoot(document.getElementById('root'));let key=0;
Swal.fire=async options=>{window.__alerts.push(options);return {isConfirmed:options.icon==='question'?window.__confirm:false}};
window.fetch=async url=>({ok:true,json:async()=>url.includes('billing.php')?{status:'success',data:{invoices:window.__invoices,pembayaran:window.__payments,terkirim:[]}}:url.includes('session.php')?{status:'success',user:{id:1,role:'finance',name:'Finance Uji'}}:{status:'success',data:[]}});
window.__receipt=(p,attempt=null)=>({payment_id:p.id,invoice_id:p.noInv,payment_status:'Verified',receipt_status:'Available',receipt_number:'RCT-2611-'+p.id,receipt_url:'/api/receipt_document.php?payment_id='+p.id,receipt_pdf_url:'/api/billing.php?view=receipt_pdf&payment_id='+p.id,pdf_status:'Available',status:'Partially Paid',terbayar:p.jumlah,sisa:p.sisa,email_status:attempt?.status||'Not Attempted',email:{attempt}});
axios.defaults.adapter=async config=>{
 const body=typeof config.data==='string'?JSON.parse(config.data):config.data;window.__requests.push({method:config.method,url:config.url,body,params:config.params});const response=data=>({data,status:200,statusText:'OK',headers:{},config});
 if(config.url.includes('session.php'))return response({status:'success',csrf_token:'test-only'});
 if(config.method==='get' && config.url==='/api/billing.php'){
  if(config.params?.view==='payment_request'){
   if(window.__mode==='offline' && window.__verifyPosts)throw new Error('Network Error');
   return response({status:'success',data:{payment:window.__verified[config.params.request_id]||null}});
  }
  if(config.params?.view==='receipt_email_attempts')return response({status:'success',data:{attempts:window.__attempts.filter(a=>a.payment_id===Number(config.params.payment_id))}});
  for(const p of window.__payments)if(p.statusVerif==='Terverifikasi')p.receipt=window.__receipt(p,window.__attempts.find(a=>a.payment_id===p.id));
  return response({status:'success',data:{invoices:window.__invoices,siswa:[],pembayaran:window.__payments,terkirim:[],email_attempts:[],student_submissions:[],automation_logs:[],rpa_status:{}}});
 }
 if(config.method==='post' && config.url==='/api/billing.php'){
  if(body.action==='verify_payment'){
   window.__verifyPosts++;if(window.__mode==='delayed')await new Promise(r=>setTimeout(r,300));
   if(window.__mode==='offline')throw new Error('Network Error');
   const p=window.__payments.find(p=>p.id===body.payment_id);p.statusVerif='Terverifikasi';
   const a={id:1,payment_id:p.id,receipt_number:'RCT-2611-'+p.id,invoice_id:p.noInv,request_id:'receipt-auto-'+p.id,status:window.__mode==='failed'?'Failed':window.__mode==='uncertain'?'Pending':'SMTP Accepted',delivery_uncertain:window.__mode==='uncertain',error_message:'fixture SMTP rejected'};window.__attempts.unshift(a);
   const result=window.__receipt(p,a);window.__verified[body.request_id]=result;
   if(window.__mode==='lost')throw new Error('Network Error');
   return response({status:'success',data:result});
  }
  if(body.action==='send_receipt_email'){
   window.__emailPosts++;const p=window.__payments.find(p=>p.id===Number(body.payment_id));const a={id:window.__attempts.length+1,payment_id:p.id,receipt_number:'RCT-2611-'+p.id,invoice_id:p.noInv,request_id:body.request_id,status:'SMTP Accepted'};window.__attempts.unshift(a);return response({status:'success',data:{attempt:a}});
  }
 }
 return response({status:'success',data:[]});
};
window.__reset=(mode='accepted')=>{
 window.__mode=mode;window.__confirm=true;window.__alerts=[];window.__requests=[];window.__verifyPosts=0;window.__emailPosts=0;window.__attempts=[];window.__verified={};
 const id='RCPT-UI-'+(++key);
 window.__payments=[{id:key*10,noInv:id,customer:'Receipt Uji',jumlah:'300.10',sisa:'700.15',statusVerif:mode==='verified'?'Terverifikasi':'Menunggu',tglBayar:'2026-11-14',metode:'Transfer Bank',proof_url:mode==='missing'?'':'/api/billing.php?view=payment_proof&id='+key*10}];
 if(mode==='two')window.__payments=[...window.__payments.map(p=>({...p,statusVerif:'Terverifikasi'})),{...window.__payments[0],id:key*10+1,statusVerif:'Terverifikasi'}];
 window.__invoices=[{id,customer:'Receipt Uji',email:'receipt@example.test',program:'Program Snapshot',total:'1000.25',tanggal:'2026-11-14',jatuhTempo:'2026-12-01',status:'Partially Paid',terbayar:'0.00',sisa:'1000.25'}];
 localStorage.setItem('user',JSON.stringify({id:1,role:'finance',name:'Finance Uji'}));root.render(React.createElement(BrowserRouter,null,React.createElement(Finance,{key})));
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
  await send('Page.navigate',{url:`${server.resolvedUrls.local[0]}.m32-ui.html`},sessionId);await wait("typeof window.__reset==='function'");
  const ready=async(mode='accepted')=>{await evaluate(`window.__reset(${JSON.stringify(mode)})`);await wait("document.body.innerText.includes('Receipt Uji')");await click('Pembayaran');await wait("document.body.innerText.includes('Daftar Pembayaran')");};
  await ready();assert.equal(await evaluate("!!document.querySelector('button[title=\"Lihat Foto Bukti Transfer\"]')"),true);pass('Pending payment exposes saved evidence and Verify');
  await click('Verify');await wait("window.__alerts.some(a=>a.title==='Pembayaran Terverifikasi')");assert.equal(await evaluate("window.__alerts.at(-1).text.includes('Receipt diterima SMTP')"),true);pass('Verify reports payment persistence and actual email outcome separately');
  await wait("document.body.innerText.includes('Buka / Unduh Receipt PDF')");assert.equal(await evaluate("Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='Buka / Unduh Receipt PDF').href.includes('payment_id='+window.__payments[0].id)"),true);pass('Verified payment exposes its own official receipt PDF');
  assert.equal(await evaluate("window.__requests.find(r=>r.body?.action==='verify_payment').body.payment_id"),await evaluate('window.__payments[0].id'));pass('Verify targets authoritative payment ID and stable request');
  await ready();await evaluate('window.__confirm=false');await click('Verify');await delay(150);assert.equal(await evaluate('window.__verifyPosts'),0);pass('Cancelled Verify does not recognize money');
  await ready('delayed');await evaluate("const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Verify');b.click();b.click()");await wait("window.__alerts.some(a=>a.title==='Pembayaran Terverifikasi')");assert.equal(await evaluate('window.__verifyPosts'),1);pass('Double click verifies once');
  await ready('failed');await click('Verify');await wait("window.__alerts.some(a=>a.title==='Pembayaran Terverifikasi')");assert.equal(await evaluate("window.__alerts.at(-1).text.includes('Pengiriman email gagal')"),true);assert.equal(await evaluate('window.__payments[0].statusVerif'),'Terverifikasi');pass('SMTP failure preserves successful verification and available receipt');
  await wait("document.body.innerText.includes('Kirim Ulang Receipt')");await click('Kirim Ulang Receipt');await wait('window.__emailPosts===1');assert.equal(await evaluate('window.__verifyPosts'),1);pass('Receipt resend calls email-only action without creating/verifying payment');
  await ready('uncertain');await click('Verify');await wait("window.__alerts.some(a=>a.title==='Pembayaran Terverifikasi')");assert.equal(await evaluate("window.__alerts.at(-1).text.includes('belum pasti')"),true);pass('Uncertain SMTP is shown independently of Verified payment');
  await ready('lost');await click('Verify');await wait("window.__alerts.some(a=>a.title==='Pembayaran Terverifikasi')");assert.equal(await evaluate('window.__verifyPosts'),1);pass('Lost Verify response reconciles server result without repeating recognition');
  await ready('offline');await click('Verify');await wait("window.__alerts.some(a=>a.icon==='error')");const request=await evaluate("window.__requests.find(r=>r.body?.action==='verify_payment').body.request_id");await evaluate("window.__mode='accepted'");await click('Verify');await wait("window.__alerts.some(a=>a.title==='Pembayaran Terverifikasi')");assert.equal(await evaluate("window.__requests.filter(r=>r.body?.action==='verify_payment').at(-1).body.request_id"),request);pass('Unknown network result preserves same verification key');
  await ready('missing');assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Verify').disabled"),true);pass('Missing proof disables Verify');
  await ready('verified');await wait("document.body.innerText.includes('Kirim Receipt')");await click('Kirim Receipt');await wait('window.__emailPosts===1');assert.equal(await evaluate('window.__verifyPosts'),0);pass('Previously verified payment with no email can send its existing receipt');
  await ready('two');await wait("Array.from(document.querySelectorAll('button')).filter(b=>b.textContent==='Kirim Receipt').length===2");await evaluate("Array.from(document.querySelectorAll('button')).filter(b=>b.textContent==='Kirim Receipt')[1].click()");await wait('window.__emailPosts===1');assert.equal(await evaluate("window.__requests.find(r=>r.body?.action==='send_receipt_email').body.payment_id"),await evaluate('window.__payments[1].id'));pass('Different receipt controls send the selected payment only');
  console.log(`PASS: ${checks} M3.2 Finance browser scenarios (mock API; no external email).`);
} finally {
 socket?.close();browser?.kill();await server?.close();await fs.rm(fixturePath,{force:true});
 if(profile.startsWith(path.join(os.tmpdir(),'m32-browser-')))for(let i=0;i<20;i++){try{await fs.rm(profile,{recursive:true,force:true});break;}catch{await delay(100);}}
}
