import { useRef, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import InvoiceEmailButton from './InvoiceEmailButton';
import { reconcilePayment, showPaymentResult, officialReceiptUrl, receiptEmailLabel } from '../utils/paymentReceipt';

const requests=new Map();
const active=new Set();

export default function PaymentReceiptActions({payment,recipient,onRefresh}) {
  const [busy,setBusy]=useState(false);
  const clicked=useRef(false);
  const identity=payment.submission_id ? `submission:${payment.submission_id}` : `payment:${payment.id}`;
  const verified=['terverifikasi','verified'].includes(String(payment.statusVerif).trim().toLowerCase());
  const receipt=payment.receipt;
  const verify=async()=>{
    if(clicked.current || active.has(identity))return;
    clicked.current=true;let acquired=false;
    try {
      const confirm=await Swal.fire({icon:'question',title:'Verify pembayaran ini?',text:`Pastikan bukti pembayaran invoice ${payment.noInv} sudah direview. Nominal dan tanggal mengikuti record server.`,showCancelButton:true,confirmButtonText:'Ya, Verify',cancelButtonText:'Batal'});
      if(!confirm.isConfirmed || active.has(identity))return;
      acquired=true;active.add(identity);setBusy(true);
      let request=requests.get(identity);
      if(!request){request={action:'verify_payment',invoice_id:payment.noInv,request_id:crypto.randomUUID(),...(payment.submission_id?{submission_id:payment.submission_id}:{payment_id:payment.id})};requests.set(identity,request);}
      let result=await reconcilePayment(request.request_id);
      if(!result){const response=await axios.post('/api/billing.php',request);if(response.data?.status!=='success' || response.data?.data?.payment_status!=='Verified')throw new Error(response.data?.message || 'Verifikasi belum dikonfirmasi.');result=response.data.data;}
      requests.delete(identity);await showPaymentResult(result);
    } catch(error) {
      const request=requests.get(identity);let result=null;
      if(request){try{result=await reconcilePayment(request.request_id);if(!result && error.response?.status<500)requests.delete(identity);}catch{/* Retain stable request while persistence is uncertain. */}}
      if(result){requests.delete(identity);await showPaymentResult(result);}
      else await Swal.fire({icon:'error',title:'Verifikasi belum dikonfirmasi',text:(error.response?.data?.message || error.message)+' Periksa data server sebelum retry; request yang sama dipertahankan bila hasil belum pasti.'});
    } finally {clicked.current=false;if(acquired){active.delete(identity);setBusy(false);await onRefresh();}}
  };
  return <div className="flex flex-wrap items-center gap-2 text-xs">
    {!verified && <button type="button" disabled={busy || !payment.proof_url || payment.accounting_reviewed} onClick={verify} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold disabled:opacity-50">{busy?'Memverifikasi…':'Verify'}</button>}
    {verified && <><span>#{payment.id} · {receipt?.receipt_number || payment.receipt_error || 'Receipt perlu review'}</span>
      {receipt && officialReceiptUrl(payment) && <a className="text-blue-700 underline" href={officialReceiptUrl(payment)} target="_blank" rel="noreferrer">Buka / Unduh Receipt PDF</a>}
      <span>Email: {receiptEmailLabel(receipt || {})}</span>
      {receipt && <InvoiceEmailButton paymentId={payment.id} invoiceId={payment.noInv} recipient={recipient} latestAttempt={receipt.email?.attempt} onRefresh={onRefresh} />}</>}
  </div>;
}
