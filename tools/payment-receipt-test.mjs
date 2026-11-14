import assert from 'node:assert/strict';
import axios from 'axios';
import {paymentResultMessage,reconcilePayment} from '../src/utils/paymentReceipt.js';

const result={payment_id:42,receipt_number:'RCT-2611-0042',payment_status:'Verified'};
let checks=0;
for(const [extra,expected] of [
  [{email_status:'SMTP Accepted'},'Receipt diterima SMTP'],
  [{email_status:'Failed'},'Pengiriman email gagal'],
  [{email_status:'Pending'},'belum pasti'],
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
console.log(`PASS: ${checks} receipt outcome/reconciliation utility scenarios.`);
