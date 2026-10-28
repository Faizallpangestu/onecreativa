import axios from 'axios';
export const ACCOUNTING_API = '/api/accounting.php';
export const financeMoney = value => value == null ? 'Belum tersedia' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(value);
export async function accountingGet(view, params = {}, signal) {
  const { data } = await axios.get(ACCOUNTING_API, { params: { view, ...params, _t: Date.now() }, signal });
  if (data?.status !== 'success' || !data.data) throw new Error('Respons akuntansi tidak valid.');
  return data;
}
export async function accountingMutate(payload, csrf, file) {
  let body = payload;
  if (file) { body = new FormData(); body.append('payload', JSON.stringify(payload)); body.append('proof', file); }
  const { data } = await axios.post(ACCOUNTING_API, body, { headers: { 'X-CSRF-Token': csrf } });
  if (data?.status !== 'success') throw new Error(data?.message || 'Proses akuntansi gagal.');
  return data.data;
}
export function accountingError(error) {
  const response = error.response?.data;
  return `${response?.message || error.message || 'Data tidak dapat dimuat.'}${response?.request_id ? ` (ID: ${response.request_id})` : ''}`;
}
export const sourceLabels = { journal:'Jurnal / Reversal',adjustment:'Adjustment',revenue_release:'Layanan terpenuhi',cash_transaction: 'Dokumen penerimaan/pembayaran', invoice_payment:'Pembayaran client historis',billing_payment:'Pembayaran faktur historis',legacy_finance: 'Transaksi historis', billing_invoice: 'Faktur tagihan', invoice_client: 'Tagihan client legacy', salary: 'Payroll', reimbursement: 'Klaim reimbursement', vendor_bill: 'Tagihan vendor', budget_realization: 'Realisasi RAB', asset: 'Aset', budget_approval_legacy: 'Approval RAB historis (nonkas)' };
export const reportLabels = {cash_history:'Riwayat Kas & Bank', profit_loss: 'Laba Rugi', balance_sheet: 'Neraca', cash_flow: 'Arus Kas', equity_changes: 'Perubahan Ekuitas', aging: 'Umur Piutang / Utang', budget_vs_actual: 'Anggaran vs Realisasi', general_ledger: 'General Ledger', trial_balance: 'Trial Balance', fund_sources: 'Sumber dan Penggunaan Dana' };
