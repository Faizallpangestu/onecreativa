import { useRef, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Mail } from 'lucide-react';

// Retain the same request across uncertain network results and component refreshes.
const pendingRequests = new Map();
const inFlight = new Set();

export default function InvoiceEmailButton({ invoiceId, recipient, latestAttempt, onRefresh, resend = false, paymentId = null }) {
  const [sending, setSending] = useState(false);
  const identity=paymentId ? `receipt:${paymentId}` : invoiceId;
  const noun=paymentId ? 'receipt' : 'invoice';
  const historyParams=paymentId ? {view:'receipt_email_attempts',payment_id:paymentId} : {view:'email_attempts',invoice_id:invoiceId};
  const clicked = useRef(false);
  const send = async () => {
    if (clicked.current || inFlight.has(identity)) return;
    clicked.current = true;
    let active = false;
    try {
      const confirmation = await Swal.fire({ icon: 'question', title: `Kirim ${resend || latestAttempt ? 'ulang ' : ''}email ${noun}?`,
        text: `${paymentId ? 'Receipt pembayaran #'+paymentId : 'Invoice '+invoiceId} dikirim ke email tersimpan: ${recipient || 'belum tersedia'}. CC mengikuti konfigurasi Finance.`,
        showCancelButton: true, confirmButtonText: 'Ya, kirim email', cancelButtonText: 'Batal' });
      if (!confirmation.isConfirmed) return;
      if (inFlight.has(identity)) return;
      inFlight.add(identity); active = true; setSending(true);
      const history = await axios.get('/api/billing.php', { params: historyParams });
      if (history.data?.status !== 'success' || !Array.isArray(history.data?.data?.attempts)) throw new Error('Riwayat email belum dapat diperiksa.');
      const attempts = history.data.data.attempts;
      let request = pendingRequests.get(identity);
      const saved = request && attempts.find(attempt => attempt.request_id === request.request_id);
      if (saved) {
        if (saved.status !== 'Pending' && !saved.delivery_uncertain) pendingRequests.delete(identity);
        await Swal.fire({ icon: saved.status === 'SMTP Accepted' ? 'success' : 'info', title: 'Hasil pengiriman server',
          text: saved.status === 'SMTP Accepted' ? 'Email diterima SMTP. Tidak dikirim dua kali.' : saved.error_message || 'Pengiriman masih Pending. Periksa SMTP sebelum mengirim ulang.' });
        return;
      }
      if (!request) {
        const latest = attempts[0];
        if (latest && (latest.status === 'Pending' || latest.delivery_uncertain)) throw new Error('Hasil SMTP sebelumnya belum pasti. Pengelola server perlu memeriksa riwayat sebelum pengiriman ulang.');
        // Refuse a newly discovered attempt that was not part of the confirmation.
        if ((latest?.id ?? null) !== (latestAttempt?.id ?? null)) throw new Error('Riwayat email berubah. Muat ulang dan konfirmasi kembali.');
        request = { ...(paymentId ? {action:'send_receipt_email',payment_id:paymentId} : {action:'send_invoice_email',invoice_id:invoiceId}), request_id: crypto.randomUUID(), previous_attempt_id: latest?.id ?? null };
        pendingRequests.set(identity, request);
      }
      const response = await axios.post('/api/billing.php', request);
      if (response.data?.status !== 'success' || response.data?.data?.attempt?.status !== 'SMTP Accepted') throw new Error(response.data?.message || 'SMTP belum menerima pengiriman.');
      pendingRequests.delete(identity);
      await Swal.fire({ icon: 'success', title: 'SMTP Accepted', text: 'Email diterima server SMTP. Status inbox dan baca belum diketahui.' });
    } catch (error) {
      let message = error.response?.data?.message || error.message;
      const request = pendingRequests.get(identity);
      if (request) {
        try {
          const response = await axios.get('/api/billing.php', { params: historyParams });
          if (response.data?.status !== 'success' || !Array.isArray(response.data?.data?.attempts)) throw new Error('Riwayat tidak valid');
          const attempt = response.data.data.attempts.find(item => item.request_id === request.request_id);
          if (attempt?.status === 'SMTP Accepted') {
            pendingRequests.delete(identity);
            await Swal.fire({ icon: 'success', title: 'SMTP Accepted', text: 'Hasil dikonfirmasi melalui riwayat server. Email tidak dikirim ulang.' });
            return;
          }
          if (attempt) {
            message = attempt.error_message || 'Percobaan masih Pending. Periksa SMTP sebelum pengiriman ulang.';
            if (attempt.status === 'Failed' && !attempt.delivery_uncertain) pendingRequests.delete(identity);
          } else if (error.response?.status === 409) pendingRequests.delete(identity);
          else message += ' Hasil belum pasti. Coba lagi untuk memeriksa request yang sama.';
        } catch {
          message += ' Riwayat belum dapat dimuat. Request yang sama dipertahankan untuk pemeriksaan berikutnya.';
        }
      }
      await Swal.fire({ icon: 'error', title: 'Email belum berhasil dikonfirmasi', text: message });
    } finally {
      if (active) inFlight.delete(identity);
      clicked.current = false; setSending(false);
      if (active && onRefresh) await onRefresh();
    }
  };
  return <button type="button" onClick={send} disabled={sending || !recipient} title={recipient ? `Email ke ${recipient}` : 'Email resmi invoice belum tersedia'}
    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1">
    <Mail className="w-4 h-4" />{sending ? 'Mengirim...' : paymentId ? (resend || latestAttempt ? 'Kirim Ulang Receipt' : 'Kirim Receipt') : resend || latestAttempt ? 'Kirim Ulang Email' : 'Kirim Email'}
  </button>;
}
