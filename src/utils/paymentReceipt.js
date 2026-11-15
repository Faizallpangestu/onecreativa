import axios from 'axios';
import Swal from 'sweetalert2';

export function officialReceiptUrl(payment) {
  const id=String(payment?.id ?? payment?.payment_id ?? '');
  const status=String(payment?.statusVerif ?? payment?.payment_status ?? '').trim().toLowerCase();
  return /^[1-9]\d{0,9}$/.test(id) && ['verified','terverifikasi'].includes(status)
    ? `/api/billing.php?view=receipt_pdf&payment_id=${id}` : null;
}

export async function openOfficialReceipt(payments = [], invoiceId = null) {
  const eligible=new Map(payments.filter(payment=>officialReceiptUrl(payment) &&
    (invoiceId===null || String(payment.noInv)===String(invoiceId))).map(payment=>[String(payment.id),payment]));
  if(!eligible.size){await Swal.fire({icon:'info',title:'Kwitansi Belum Tersedia',text:'Diperlukan record pembayaran server yang terverifikasi; status Paid invoice saja tidak menghasilkan receipt.'});return null;}
  let payment;
  if(eligible.size===1) payment=eligible.values().next().value;
  else {
    const selection=await Swal.fire({title:'Pilih receipt pembayaran',input:'select',inputValue:'',inputPlaceholder:'Pilih pembayaran terverifikasi',
      inputOptions:Object.fromEntries([...eligible].map(([id,row])=>[id,`${row.receipt?.receipt_number || row.receipt_number || 'Pembayaran #'+id} | ${row.tglBayar} | Rp ${row.jumlah}`])),
      showCancelButton:true,confirmButtonText:'Buka PDF',cancelButtonText:'Batal',inputValidator:value=>eligible.has(value)?undefined:'Pilih receipt pembayaran.'});
    if(!selection.isConfirmed || !eligible.has(String(selection.value)))return null;
    payment=eligible.get(String(selection.value));
  }
  const url=officialReceiptUrl(payment);window.open(url,'_blank','noopener,noreferrer');return url;
}

export function receiptEmailLabel(result) {
  if(result.email?.history_available===false)return 'Riwayat email belum dapat diperiksa';
  const status=result.email_status || 'Not Attempted';
  return result.email?.attempt?.delivery_uncertain ? `${status} — Delivery Uncertain` : status;
}

export function paymentResultMessage(result) {
  const email=result.email?.attempt;
  const outcome=result.email?.history_available===false ? 'Riwayat email belum dapat diperiksa; periksa server sebelum mengirim ulang.'
    : email?.delivery_uncertain ? 'Delivery Uncertain: status SMTP belum pasti; periksa riwayat sebelum mengirim ulang.'
    : result.email_status==='SMTP Accepted' ? 'Receipt diterima SMTP. Status inbox/baca belum diketahui.'
    : result.email_status==='Pending' ? 'Percobaan email masih Pending; periksa riwayat sebelum mengirim ulang.'
    : !result.email_status || result.email_status==='Not Attempted' ? 'Email belum dicoba (Not Attempted). Receipt tetap tersedia.'
    : 'Pengiriman email gagal/belum aktif. Receipt tetap tersedia dan dapat dikirim ulang.';
  return `Pembayaran #${result.payment_id} terverifikasi. Receipt ${result.receipt_number}. ${outcome}`;
}

export async function showPaymentResult(result) {
  const pdfUrl=officialReceiptUrl(result);
  const response=await Swal.fire({icon:'success',title:'Pembayaran Terverifikasi',text:paymentResultMessage(result),
    showCancelButton:!!pdfUrl,confirmButtonText:pdfUrl?'Buka Receipt PDF':'Selesai',cancelButtonText:'Tutup'});
  if(response.isConfirmed && pdfUrl) window.open(pdfUrl,'_blank','noopener,noreferrer');
}

export async function reconcilePayment(requestId) {
  const {data}=await axios.get('/api/billing.php',{params:{view:'payment_request',request_id:requestId}});
  if(data?.status!=='success' || !data.data || !Object.hasOwn(data.data,'payment')) throw new Error('Hasil pembayaran belum dapat diperiksa.');
  return data.data.payment;
}
