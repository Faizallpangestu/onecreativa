import assert from 'node:assert/strict';
import axios from 'axios';
import Swal from 'sweetalert2';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {paymentResultMessage,reconcilePayment,officialReceiptUrl,openOfficialReceipt,receiptEmailLabel} from '../src/utils/paymentReceipt.js';

const result={payment_id:42,receipt_number:'RCT-2611-0042',payment_status:'Verified'};
let checks=0;
for(const [extra,expected] of [
  [{email_status:'SMTP Accepted'},'Receipt diterima SMTP'],
  [{email_status:'Failed'},'Pengiriman email gagal'],
  [{email_status:'Pending'},'Pending'],
  [{email_status:'Failed',email:{attempt:{delivery_uncertain:true}}},'belum pasti'],
  [{email_status:'Not Attempted'},'Receipt tetap tersedia'],
]){
  const text=paymentResultMessage({...result,...extra});
  assert.ok(text.includes('Pembayaran #42 terverifikasi'));assert.ok(text.includes('RCT-2611-0042'));assert.ok(text.includes(expected));checks++;
}
let request;
axios.defaults.adapter=async config=>{request=config;return {status:200,data:{status:'success',data:{payment:result}},headers:{},config};};
assert.deepEqual(await reconcilePayment('stable-key-42'),result);assert.equal(request.method,'get');assert.equal(request.params.request_id,'stable-key-42');checks++;
axios.defaults.adapter=async config=>({status:200,data:{status:'success',data:{payment:null}},headers:{},config});
assert.equal(await reconcilePayment('not-committed'),null);checks++;
axios.defaults.adapter=async config=>({status:200,data:{status:'success',data:{}},headers:{},config});
await assert.rejects(()=>reconcilePayment('unknown'),/belum dapat diperiksa/);checks++;
axios.defaults.adapter=async()=>{throw new Error('Offline');};
await assert.rejects(()=>reconcilePayment('unknown'),/Offline/);checks++;
const opened=[];globalThis.window={open:(...args)=>opened.push(args)};
const first={id:11,noInv:'INV-1',statusVerif:'Terverifikasi',tglBayar:'2026-11-01',jumlah:'300.10',receipt:{receipt_number:'RCT-2611-0011'}};
const second={...first,id:22,tglBayar:'2026-11-02',jumlah:'700.15',receipt:{receipt_number:'RCT-2611-0022'}};
let modal;let selected='22';let confirmed=true;
Swal.fire=async options=>{modal=options;return {isConfirmed:confirmed,value:selected};};
assert.equal(await openOfficialReceipt([first],'INV-1'),'/api/billing.php?view=receipt_pdf&payment_id=11');assert.equal(opened.length,1);checks++;
assert.equal(await openOfficialReceipt([first,second],'INV-1'),'/api/billing.php?view=receipt_pdf&payment_id=22');
assert.equal(modal.input,'select');assert.equal(modal.inputValue,'');assert.match(modal.inputOptions['22'],/RCT-2611-0022.*2026-11-02.*700.15/);assert.ok(modal.inputValidator(''));checks++;
selected='11';assert.equal(await openOfficialReceipt([second,first],'INV-1'),'/api/billing.php?view=receipt_pdf&payment_id=11');checks++;
confirmed=false;let before=opened.length;assert.equal(await openOfficialReceipt([first,second],'INV-1'),null);assert.equal(opened.length,before);checks++;
confirmed=true;selected='999';assert.equal(await openOfficialReceipt([first,second],'INV-1'),null);assert.equal(opened.length,before);checks++;
for(const row of [{...first,statusVerif:'Menunggu'},{...first,id:'PAY-11'}, {...first,id:0}])assert.equal(officialReceiptUrl(row),null);checks++;
assert.equal(await openOfficialReceipt([{...first,statusVerif:'Menunggu'}],'INV-1'),null);assert.equal(opened.length,before);assert.match(modal.text,/terverifikasi/);checks++;
assert.equal(await openOfficialReceipt([first],'OTHER'),null);assert.equal(opened.length,before);checks++;
assert.equal(officialReceiptUrl({payment_id:23,payment_status:'Verified'}),'/api/billing.php?view=receipt_pdf&payment_id=23');checks++;
for(const status of ['Not Attempted','Pending','Failed','SMTP Accepted']){assert.equal(receiptEmailLabel({email_status:status}),status);checks++;}
assert.match(receiptEmailLabel({email_status:'Failed',email:{attempt:{delivery_uncertain:true}}}),/Failed.*Delivery Uncertain/);checks++;
assert.match(paymentResultMessage({...result,email_status:'Not Attempted'}),/Email belum dicoba/);assert.doesNotMatch(paymentResultMessage({...result,email_status:'Not Attempted'}),/gagal|Pending/);checks++;
assert.match(receiptEmailLabel({email_status:null,email:{history_available:false}}),/belum dapat diperiksa/);checks++;
const page=fs.readFileSync('src/pages/InvoicePenagihan.jsx','utf8');const wizard=fs.readFileSync('src/components/BuatInvoiceWizardModal.jsx','utf8');
assert.doesNotMatch(page,/generateReceiptPDF|previewReceiptPDF|Kelas Mulai|kelasMulai/);assert.match(page,/generateInvoicePDF/);assert.match(page,/new jsPDF/);checks++;
assert.match(page,/handleReceiptClick = inv => openOfficialReceipt\(inv.payments/);assert.match(page,/openOfficialReceipt\(\[item\]/);assert.match(page,/openOfficialReceipt\(\[p\]/);checks++;
assert.doesNotMatch(wizard,/Qty|Pilih Program|Kelas Mulai/);assert.match(wizard,/<input readOnly value=\{programInfo.program/);assert.match(wizard,/<td[^>]*>\{formatRp\(item.harga\)\}/);assert.match(wizard,/<td[^>]*>\{formatRp\(item.diskon\)\}/);checks++;
const portal=fs.readFileSync('src/components/StudentBilling.jsx','utf8');assert.match(portal,/Billing Verification/);assert.match(portal,/Accounting Review/);assert.match(portal,/outstanding akuntansi \(posted\)/);assert.match(portal,/Billing Verified; Accounting Review Pending/);checks++;
const sender='src/components/InvoiceEmailButton.jsx';assert.equal(fs.readFileSync(sender,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','HEAD:'+sender],{encoding:'utf8'}).replace(/\r\n/g,'\n'));checks++;
console.log(`PASS: ${checks} focused receipt selection/status/UI checks (mock dialog/window, no browser/SMTP/worker).`);
