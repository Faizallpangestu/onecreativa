import axios from 'axios';
import Swal from 'sweetalert2';

export function paymentResultMessage(result) {
  const email=result.email?.attempt;
  const outcome=result.email_status==='SMTP Accepted' ? 'Receipt diterima SMTP. Status inbox/baca belum diketahui.'
    : email?.delivery_uncertain || result.email_status==='Pending' ? 'Status email belum pasti; periksa riwayat sebelum mengirim ulang.'
    : 'Pengiriman email gagal/belum aktif. Receipt tetap tersedia dan dapat dikirim ulang.';
  return `Pembayaran #${result.payment_id} terverifikasi. Receipt ${result.receipt_number}. ${outcome}`;
}

export async function showPaymentResult(result) {
  const response=await Swal.fire({icon:'success',title:'Pembayaran Terverifikasi',text:paymentResultMessage(result),
    showCancelButton:!!result.receipt_pdf_url,confirmButtonText:result.receipt_pdf_url?'Buka Receipt PDF':'Selesai',cancelButtonText:'Tutup'});
  if(response.isConfirmed && result.receipt_pdf_url) window.open(result.receipt_pdf_url,'_blank','noopener,noreferrer');
}

export async function reconcilePayment(requestId) {
  const {data}=await axios.get('/api/billing.php',{params:{view:'payment_request',request_id:requestId}});
  if(data?.status!=='success' || !data.data || !Object.hasOwn(data.data,'payment')) throw new Error('Hasil pembayaran belum dapat diperiksa.');
  return data.data.payment;
}
