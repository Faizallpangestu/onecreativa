import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Layout from '../components/Layout';
import { financeMoney as money } from '../utils/accountingApi';
import axios from 'axios';
import './DashboardFinance.css';
import financeHero from '../assets/finance_3d_bg.webp';

// ── Helpers ──────────────────────────────────────────────────
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6'];

function Sparkline({ values, color }) {
  const nums = values.map(value => Number(value) || 0);
  const max = Math.max(...nums, 1);
  const min = Math.min(...nums, 0);
  const span = max - min || 1;
  const points = nums.map((value, index) => {
    const x = nums.length < 2 ? 50 : (index / (nums.length - 1)) * 100;
    const y = 26 - ((value - min) / span) * 20;
    return `${x},${y}`;
  }).join(' ');
  return <svg className="fd-kpi-sparkline" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

const shortMoney = (v) => {
  const n = Number(v) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}M`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}Jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}Rb`;
  return n.toLocaleString('id-ID');
};

const sourceLabels = {
  invoice_payment: 'Pembayaran Client',
  billing_payment: 'Pembayaran Faktur',
  cash_transaction: 'Penerimaan/Pembayaran',
  salary: 'Payroll',
  reimbursement: 'Reimbursement',
  vendor_bill: 'Tagihan Vendor',
  budget_realization: 'Realisasi RAB',
  legacy_finance: 'Transaksi Historis',
};

// ── SVG Icons ────────────────────────────────────────────────
// ── SVG Icons ────────────────────────────────────────────────
const Icon = ({ d, children, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children || (d ? <path d={d} /> : null)}
  </svg>
);
const ChevronLeft = (p) => <Icon d="M15 18l-6-6 6-6" {...p} />;
const ChevronRight = (p) => <Icon d="M9 18l6-6-6-6" {...p} />;
const XIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrendUp = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const TrendDown = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>;
const DollarSign = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const BarChart3 = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 20V10M12 20V4M6 20v-6" /></svg>;
const Search = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const FileCheck = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" /></svg>;
const WalletIcon = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>;
const ColumnsIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);
const LayersIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
const Sparkles = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

// ── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '12px 16px',
      border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
      fontSize: 11, minWidth: 160
    }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
            <i style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            {p.name}
          </span>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatter ? formatter(p.value) : money(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Audit Detail Modal ───────────────────────────────────────
function AuditModal({ item, related, onClose, onSwitchTab, currentTab }) {
  if (!item) return null;
  const diff = Number(item.amount || 0) - Number(related?.amount || 0);
  const isBalanced = related && Math.abs(diff) < 1;
  const isSelisih = related && Math.abs(diff) >= 1;

  const projItem = currentTab === 'projection' ? item : related;
  const realItem = currentTab === 'realization' ? item : related;

  return (
    <div className="fd-modal-overlay" onClick={onClose}>
      <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fd-modal-header">
          <h2>
            <Search style={{ width: 18, height: 18, marginRight: 8, verticalAlign: 'middle' }} />
            Audit Analitik — {item.number || `#${item.id}`}
          </h2>
          <button className="fd-modal-close" onClick={onClose}><XIcon /></button>
        </div>
        <div className="fd-modal-body">
          <div className="fd-detail-grid">
            <div className="fd-detail-item">
              <label>Nomor Transaksi</label>
              <span>{item.number || '-'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Tanggal</label>
              <span>{item.transaction_date || '-'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Jenis</label>
              <span>{item.type === 'income' ? 'Pemasukan (Income)' : 'Pengeluaran (Expense)'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Nominal</label>
              <span>{money(item.amount)}</span>
            </div>
            <div className="fd-detail-item">
              <label>Pihak / Rekanan</label>
              <span>{item.party_name || '-'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Sumber / Dokumen</label>
              <span>{sourceLabels[item.source_type] || item.source_type || '-'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Kategori</label>
              <span>{item.classification || '-'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Rekening Bank / Kas</label>
              <span>{(() => {
                if (item.source_type === 'invoice_billing' || item.type === 'income') {
                  const acc = String(item.account_number || item.cash_account_name || item.rekening || '');
                  if (acc.toLowerCase().includes('mandiri')) return 'Mandiri (130-0019283)';
                  if (acc.toLowerCase().includes('bni')) return 'BNI (088-771122)';
                  return 'BCA (1832-918-428)';
                }
                return item.cash_account_name || 'BCA (1832-918-428)';
              })()}</span>
            </div>
            <div className="fd-detail-item">
              <label>Status Persetujuan</label>
              <span>{item.approval_status || '-'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Status Pembayaran</label>
              <span>{item.payment_status === 'overdue' ? '⚠ Lewat Jatuh Tempo (Overdue)' : item.payment_status === 'unpaid' ? '⏳ Belum Dibayar (Unpaid)' : '✓ Sudah Dibayar (Paid)'}</span>
            </div>
            {item.paid_at && (
              <div className="fd-detail-item">
                <label>Tanggal / Waktu Bayar</label>
                <span>{item.paid_at}</span>
              </div>
            )}
            {item.reference && (
              <div className="fd-detail-item">
                <label>Referensi / Metode</label>
                <span>{item.reference}</span>
              </div>
            )}
          </div>

          <div className="fd-audit-match">
            {/* Kartu Proyeksi */}
            <div className="fd-audit-card fd-audit-card--projection">
              <h3>
                <i style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                Data Proyeksi (Expected)
              </h3>
              {projItem ? (
                <>
                  <div className="fd-detail-item">
                    <label>Nominal Diproyeksikan</label>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#1e40af' }}>{money(projItem.amount)}</span>
                  </div>
                  <div className="fd-detail-item" style={{ marginTop: 8 }}>
                    <label>Nomor Dokumen</label>
                    <span>{projItem.number || '-'}</span>
                  </div>
                  <div className="fd-detail-item" style={{ marginTop: 8 }}>
                    <label>Status</label>
                    <span className="fd-tag fd-tag--projection">
                      {projItem.payment_status === 'unpaid' ? 'Belum Dibayar' : 'Terjadwal'}
                    </span>
                  </div>
                  {currentTab === 'realization' && onSwitchTab && (
                    <button
                      type="button"
                      className="fd-btn-switch"
                      onClick={() => onSwitchTab('projection', projItem)}
                    >
                      <Search /> Lihat di Tab Proyeksi →
                    </button>
                  )}
                </>
              ) : (
                <div className="fd-empty" style={{ padding: '20px 10px' }}>
                  <p>Tidak ada proyeksi terkait</p>
                </div>
              )}
            </div>

            {/* Kartu Realisasi */}
            <div className="fd-audit-card fd-audit-card--realization">
              <h3>
                <i style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                Data Realisasi (Actual Paid)
              </h3>
              {realItem ? (
                <>
                  <div className="fd-detail-item">
                    <label>Nominal Terealisasi</label>
                    <span style={{ fontSize: 18, fontWeight: 800, color: Number(realItem.amount) > 0 ? '#065f46' : '#94a3b8' }}>
                      {money(realItem.amount)}
                    </span>
                    {(realItem.is_pending_realization || Number(realItem.amount) === 0) && (
                      <div style={{ fontSize: 11, color: realItem.payment_status === 'overdue' ? '#dc2626' : '#d97706', marginTop: 2 }}>
                        (Belum terealisasi — Tagihan: {money(realItem.expected_amount || realItem.amount)})
                      </div>
                    )}
                  </div>
                  <div className="fd-detail-item" style={{ marginTop: 8 }}>
                    <label>Status Realisasi</label>
                    <span className={`fd-tag ${realItem.payment_status === 'overdue' ? 'fd-tag--selisih' : realItem.payment_status === 'unpaid' ? 'fd-tag--projection' : 'fd-tag--realization'}`}>
                      {realItem.payment_status === 'overdue' ? '⚠ Overdue' : realItem.payment_status === 'unpaid' ? '⏳ Unpaid' : '✓ Paid (Lunas)'}
                    </span>
                  </div>
                  <div className="fd-detail-item" style={{ marginTop: 8 }}>
                    <label>Tanggal / Waktu Bayar</label>
                    <span>{realItem.paid_at || (realItem.is_pending_realization ? 'Menunggu Pembayaran' : realItem.transaction_date || '-')}</span>
                  </div>
                  <div className="fd-detail-item" style={{ marginTop: 8 }}>
                    <label>Rekening</label>
                    <span>{(() => {
                      if (realItem.source_type === 'invoice_billing' || realItem.type === 'income') {
                        const acc = String(realItem.account_number || realItem.cash_account_name || realItem.rekening || '');
                        if (acc.toLowerCase().includes('mandiri')) return 'Mandiri (130-0019283)';
                        if (acc.toLowerCase().includes('bni')) return 'BNI (088-771122)';
                        return 'BCA (1832-918-428)';
                      }
                      return realItem.cash_account_name || 'BCA (1832-918-428)';
                    })()}</span>
                  </div>
                  {currentTab === 'projection' && onSwitchTab && (
                    <button
                      type="button"
                      className="fd-btn-switch"
                      style={{ background: '#059669' }}
                      onClick={() => onSwitchTab('realization', realItem)}
                    >
                      <Search /> Buka di Tab Realisasi →
                    </button>
                  )}
                </>
              ) : (
                <div className="fd-empty" style={{ padding: '20px 10px' }}>
                  <p>Belum ada realisasi terkait</p>
                </div>
              )}
            </div>
          </div>

          <div className={`fd-audit-result ${isBalanced ? 'fd-audit-result--balanced' : isSelisih ? 'fd-audit-result--selisih' : ''}`}
               style={{ marginTop: 16 }}>
            <span className={`fd-tag ${isBalanced ? 'fd-tag--balanced' : isSelisih ? 'fd-tag--selisih' : 'fd-tag--projection'}`} style={{ fontSize: 12 }}>
              {isBalanced ? '✓ BALANCED' : isSelisih ? '⚠ ADA SELISIH' : '⏳ BELUM TEREALISASI'}
            </span>
            <strong style={{ color: isBalanced ? '#047857' : isSelisih ? '#b45309' : '#1e40af' }}>
              {isBalanced
                ? 'Proyeksi = Realisasi (Sinkron & Balance)'
                : isSelisih
                ? `Selisih: ${money(Math.abs(diff))}`
                : 'Menunggu proses realisasi pembayaran'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DashboardFinance() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [globalPeriod, setGlobalPeriod] = useState(String(new Date().getFullYear())); // '2026', 'all', 'Q1', 'Q2', etc.
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [incomePeriod, setIncomePeriod] = useState('all'); // 'all', 'Q1'..'Q4', '1'..'12'
  const [isIncomePeriodOpen, setIsIncomePeriodOpen] = useState(false);
  const [expensePeriod, setExpensePeriod] = useState('all'); // 'all', 'Q1'..'Q4', '1'..'12'
  const [isExpensePeriodOpen, setIsExpensePeriodOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditTab, setAuditTab] = useState('projection');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [auditModal, setAuditModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [cashflowView, setCashflowView] = useState('chart');
  const [hoveredMatchKey, setHoveredMatchKey] = useState(null);
  const [flowFilter, setFlowFilter] = useState('income'); // default 'income' for student billing focus, or 'all' / 'expense'

  // Close dropdowns on outside click
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setIsPeriodMenuOpen(false);
        setIsIncomePeriodOpen(false);
        setIsExpensePeriodOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const matchPeriod = useCallback((dateStr, periodKey) => {
    if (!dateStr || periodKey === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const m = d.getMonth() + 1; // 1-12
    if (periodKey === 'Q1') return m >= 1 && m <= 3;
    if (periodKey === 'Q2') return m >= 4 && m <= 6;
    if (periodKey === 'Q3') return m >= 7 && m <= 9;
    if (periodKey === 'Q4') return m >= 10 && m <= 12;
    const targetMonth = Number(periodKey);
    if (!isNaN(targetMonth) && targetMonth >= 1 && targetMonth <= 12) {
      return m === targetMonth;
    }
    return true;
  }, []);

  const getPeriodLabel = useCallback((p) => {
    if (p === 'all') return 'Semua Periode';
    if (p.startsWith('Q')) return `Kuartal ${p.slice(1)}`;
    const m = Number(p);
    if (!isNaN(m) && m >= 1 && m <= 12) return MONTHS_ID[m - 1];
    return p;
  }, []);

  // ── Fetch data ──────────────────────────────────────────────
  const fetchData = useCallback(async (y) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/finance_dashboard.php', { params: { year: y, _t: Date.now() } });
      if (res.data?.status === 'success') {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Gagal memuat data.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Koneksi gagal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(year); }, [year, fetchData]);

  // ── Derived activeData (Merges server data with issued local invoices in real-time) ──
  const activeData = useMemo(() => {
    if (!data) return null;
    const cloned = JSON.parse(JSON.stringify(data));
    try {
      const rawCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      let hasFixedBank = false;
      const savedCustom = (Array.isArray(rawCustom) ? rawCustom : []).map(inv => {
        // Sanitize bank name: Invoices for training/tuition are officially collected through Bank BCA (1832-918-428)
        if (inv.bank_name === 'BRI' || String(inv.bank_name || '').toLowerCase().includes('bri') || !inv.bank_name || inv.account_number === '1832-918-428' || String(inv.rekening || '').includes('1832-918-428') || !inv.account_number) {
          if (inv.bank_name !== 'Mandiri' && inv.bank_name !== 'BNI') {
            inv.bank_name = 'BCA';
            inv.account_number = '1832-918-428';
            inv.account_holder = 'PT CREATIVA BRIDGING INTERN';
            inv.rekening = 'BCA (1832-918-428 a/n PT CREATIVA BRIDGING INTERN)';
            hasFixedBank = true;
          }
        }
        return inv;
      });
      if (hasFixedBank) {
        try {
          localStorage.setItem('saved_custom_invoices', JSON.stringify(savedCustom));
        } catch (e) {}
      }

      if (Array.isArray(savedCustom) && savedCustom.length > 0) {
        // Collect existing IDs in projection_items to prevent duplication
        const existingIds = new Set((cloned.projection_items || []).map(p => String(p.id || p.number)));

        savedCustom.forEach(inv => {
          const invId = String(inv.id || inv.nomor || '');
          if (!invId || existingIds.has(invId)) return;
          existingIds.add(invId);

          const invDate = inv.tanggal || new Date().toISOString().split('T')[0];
          let d = new Date(invDate);
          if (isNaN(d.getTime()) && typeof invDate === 'string' && invDate.includes('/')) {
            const parts = invDate.split('/');
            if (parts.length === 3) {
              d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
            }
          }
          if (isNaN(d.getTime())) return;
          const invYear = d.getFullYear();
          const invMonth = d.getMonth() + 1; // 1-12

          // ── KONDISI A: INVOICE DENGAN SKEMA CICILAN (INSTALLMENTS PLAN) ──
          if (Array.isArray(inv.installments) && inv.installments.length > 0) {
            let cumulativePaid = Number(inv.terbayar || 0);

            // 1. Proyeksi: Dipetakan per termin ke bulan jatuh tempo masing-masing
            inv.installments.forEach((inst, idx) => {
              const instNominal = Number(inst.nominal || 0);
              const instDate = inst.jatuhTempo || invDate;
              let dInst = new Date(instDate);
              if (isNaN(dInst.getTime()) && typeof instDate === 'string' && instDate.includes('/')) {
                const parts = instDate.split('/');
                if (parts.length === 3) {
                  dInst = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
                }
              }
              if (isNaN(dInst.getTime())) return;
              const instYear = dInst.getFullYear();
              const instMonth = dInst.getMonth() + 1;

              // Cek apakah termin ini sudah tertutup oleh pembayaran yang masuk
              const isTerminPaid = cumulativePaid >= instNominal;
              if (isTerminPaid) {
                cumulativePaid -= instNominal;
              } else {
                cumulativePaid = 0;
              }

              // Masukkan ke proyeksi:
              // Tampilkan jika sesuai tahun aktif ATAU jika tahun terbit invoice adalah tahun aktif (agar seluruh rencana cicilan invoice terlihat utuh oleh CFO)
              const isCurrentInvoicePlan = (invYear === Number(year));
              if (instYear === Number(year) || isCurrentInvoicePlan) {
                const termProjItem = {
                  id: `${invId}-T${idx + 1}`,
                  number: `${invId}-T${idx + 1}`,
                  transaction_date: instDate,
                  type: 'income',
                  amount: instNominal,
                  party_name: inv.customer || 'Siswa',
                  description: `${inv.customer || 'Siswa'} - ${inst.keterangan || ('Cicilan ke-' + (idx + 1))}${instYear !== Number(year) ? ` (${instYear})` : ''}`,
                  source_type: 'invoice_billing',
                  classification: 'Pemasukan Pelatihan (Cicilan)',
                  approval_status: 'approved',
                  payment_status: isTerminPaid ? 'paid' : 'unpaid',
                  cash_account_name: inv.bank_name ? `${inv.bank_name} (${inv.account_number || ''})` : 'BCA (1832-918-428)',
                  jatuh_tempo: inst.jatuhTempo || instDate,
                  termin_info: `Termin ${idx + 1}/${inv.installments.length}`
                };
                if (!cloned.projection_items) cloned.projection_items = [];
                cloned.projection_items.unshift(termProjItem);

                if (cloned.months && instYear === Number(year) && cloned.months[instMonth - 1]) {
                  cloned.months[instMonth - 1].projection = (
                    Number(cloned.months[instMonth - 1].projection || 0) + instNominal
                  ).toFixed(2);
                }
              }
            });

            // 2. Realisasi: Periksa setiap termin cicilan (paid atau pending Unpaid/Overdue)
            inv.installments.forEach((inst, idx) => {
              const instNominal = Number(inst.nominal || 0);
              const instDate = inst.jatuhTempo || invDate;
              let dInst = new Date(instDate);
              if (isNaN(dInst.getTime()) && typeof instDate === 'string' && instDate.includes('/')) {
                const parts = instDate.split('/');
                if (parts.length === 3) dInst = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
              }
              const instYear = !isNaN(dInst.getTime()) ? dInst.getFullYear() : invYear;
              const instMonth = !isNaN(dInst.getTime()) ? dInst.getMonth() + 1 : invMonth;
              const termProjId = `${invId}-T${idx + 1}`;
              const isCurrentInvoicePlan = (invYear === Number(year));

              // Cari apakah ada bukti pembayaran untuk termin ini
              const matchingPayment = Array.isArray(inv.payments)
                ? inv.payments.find(p => Number(p.termin) === (idx + 1) || p.terminName === `Termin ${idx + 1}` || p.terminName === `Termin ke-${idx + 1}`)
                : null;

              // Alternatif fallback jika belum ada termin spesifik di payment object
              const isPaidByCumulative = (Number(inv.terbayar || 0) >= (idx + 1) * instNominal && instNominal > 0);
              const isPaid = Boolean(matchingPayment) || isPaidByCumulative;

              if (isPaid) {
                const payAmount = matchingPayment ? (Number(matchingPayment.jumlah) || instNominal) : instNominal;
                const payDate = matchingPayment?.tglBayar || inv.paid_at || instDate;
                let dPay = new Date(payDate);
                if (isNaN(dPay.getTime()) && typeof payDate === 'string' && payDate.includes('/')) {
                  const parts = payDate.split('/');
                  if (parts.length === 3) dPay = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
                }
                const payYear = !isNaN(dPay.getTime()) ? dPay.getFullYear() : instYear;
                const payMonth = !isNaN(dPay.getTime()) ? dPay.getMonth() + 1 : instMonth;

                if (payYear === Number(year) || isCurrentInvoicePlan) {
                  const realItem = {
                    id: matchingPayment?.id || `FIN-${invId}-T${idx + 1}`,
                    number: matchingPayment?.receiptNo || `FIN-${invId}-T${idx + 1}`,
                    transaction_date: payDate,
                    type: 'income',
                    amount: payAmount,
                    party_name: inv.customer || 'Siswa',
                    description: matchingPayment?.catatan || `Pembayaran ${inst.keterangan || ('Termin ' + (idx + 1))} - ${inv.customer || ''}`,
                    source_type: 'invoice_billing',
                    classification: 'Pemasukan Pelatihan (Cicilan)',
                    approval_status: 'approved',
                    payment_status: 'paid',
                    cash_account_name: matchingPayment?.metode ? `${matchingPayment.metode} (${matchingPayment.rekening || ''})` : 'BCA (1832-918-428)',
                    paid_at: payDate,
                    related_proj_id: termProjId,
                    related_proj_number: termProjId,
                  };
                  if (!cloned.realization_items) cloned.realization_items = [];
                  cloned.realization_items.unshift(realItem);

                  if (cloned.months && payYear === Number(year) && cloned.months[payMonth - 1]) {
                    cloned.months[payMonth - 1].realization = (
                      Number(cloned.months[payMonth - 1].realization || 0) + payAmount
                    ).toFixed(2);
                    cloned.months[payMonth - 1].income = (
                      Number(cloned.months[payMonth - 1].income || 0) + payAmount
                    ).toFixed(2);
                  }
                }
              } else {
                // Termin belum dibayar -> masukkan baris rekonsiliasi Realisasi (Unpaid / Overdue)
                if (instYear === Number(year) || isCurrentInvoicePlan) {
                  const todayIso = new Date().toISOString().split('T')[0];
                  const isOverdue = todayIso > instDate;
                  const pendingRealItem = {
                    id: `PENDING-${termProjId}`,
                    number: `MENUNGGU-${termProjId}`,
                    transaction_date: instDate,
                    type: 'income',
                    amount: 0,
                    expected_amount: instNominal,
                    party_name: inv.customer || 'Siswa',
                    description: `[Belum Bayar] ${inv.customer || 'Siswa'} - ${inst.keterangan || ('Cicilan ke-' + (idx + 1))}${instYear !== Number(year) ? ` (${instYear})` : ''}`,
                    source_type: 'invoice_billing',
                    classification: 'Pemasukan Pelatihan (Cicilan)',
                    approval_status: 'approved',
                    payment_status: isOverdue ? 'overdue' : 'unpaid',
                    cash_account_name: inv.bank_name ? `${inv.bank_name} (${inv.account_number || ''})` : 'BCA (1832-918-428)',
                    paid_at: null,
                    is_pending_realization: true,
                    related_proj_id: termProjId,
                    related_proj_number: termProjId,
                  };
                  if (!cloned.realization_items) cloned.realization_items = [];
                  cloned.realization_items.unshift(pendingRealItem);
                }
              }
            });
          } else {
            // ── KONDISI B: INVOICE FULL PAYMENT (NON-CICILAN) ──
            if (invYear === Number(year)) {
              const amount = Number(inv.total) || 0;
              const paidAmount = Number(inv.terbayar || 0);
              const isPaid = ['paid', 'lunas'].includes(String(inv.status || '').toLowerCase()) || (paidAmount >= amount && amount > 0);
              const realizedAmount = isPaid ? amount : paidAmount;

              // 1. Proyeksi kas masuk
              const projItem = {
                id: invId,
                number: invId,
                transaction_date: invDate,
                type: 'income',
                amount: amount,
                party_name: inv.customer || 'Siswa',
                description: inv.keterangan || `Tagihan Siswa - ${inv.customer || ''}`,
                source_type: 'invoice_billing',
                classification: 'Pemasukan Pelatihan',
                approval_status: 'approved',
                payment_status: isPaid ? 'paid' : 'unpaid',
                cash_account_name: inv.bank_name ? `${inv.bank_name} (${inv.account_number || ''})` : 'BCA (1832-918-428)',
                jatuh_tempo: inv.jatuhTempo,
              };
              if (!cloned.projection_items) cloned.projection_items = [];
              cloned.projection_items.unshift(projItem);

              if (cloned.months && cloned.months[invMonth - 1]) {
                cloned.months[invMonth - 1].projection = (
                  Number(cloned.months[invMonth - 1].projection || 0) + amount
                ).toFixed(2);
              }

              // 2. Realisasi (Jika sudah bayar -> Paid, jika belum bayar -> Unpaid/Overdue baris pasangan)
              if (realizedAmount > 0) {
                const realItem = {
                  ...projItem,
                  number: 'FIN-' + invId,
                  amount: realizedAmount,
                  payment_status: 'paid',
                  paid_at: inv.paid_at || invDate,
                  related_proj_id: invId,
                  related_proj_number: invId,
                };
                if (!cloned.realization_items) cloned.realization_items = [];
                cloned.realization_items.unshift(realItem);

                if (cloned.months && cloned.months[invMonth - 1]) {
                  cloned.months[invMonth - 1].realization = (
                    Number(cloned.months[invMonth - 1].realization || 0) + realizedAmount
                  ).toFixed(2);
                  cloned.months[invMonth - 1].income = (
                    Number(cloned.months[invMonth - 1].income || 0) + realizedAmount
                  ).toFixed(2);
                }
              } else {
                const todayIso = new Date().toISOString().split('T')[0];
                const isOverdue = todayIso > (inv.jatuhTempo || invDate);
                const pendingRealItem = {
                  ...projItem,
                  id: `PENDING-${invId}`,
                  number: `MENUNGGU-${invId}`,
                  transaction_date: inv.jatuhTempo || invDate,
                  amount: 0,
                  expected_amount: amount,
                  payment_status: isOverdue ? 'overdue' : 'unpaid',
                  paid_at: null,
                  is_pending_realization: true,
                  related_proj_id: invId,
                  related_proj_number: invId,
                };
                if (!cloned.realization_items) cloned.realization_items = [];
                cloned.realization_items.push(pendingRealItem);
              }
            }
          }
        });

        // ── KONDISI C: TRANSAKSI PENGELUARAN & PENGGAJIAN LOKAL (finance_expense_data) ──
        try {
          const rawExpenses = JSON.parse(localStorage.getItem('finance_expense_data') || '[]');
          const deletedExpenseIds = new Set(JSON.parse(localStorage.getItem('finance_expense_deleted_ids') || '[]').map(String));
          if (Array.isArray(rawExpenses) && rawExpenses.length > 0) {
            const existingExpIds = new Set((cloned.projection_items || []).map(p => String(p.id || p.number)));
            (cloned.realization_items || []).forEach(r => {
              if (r.id) existingExpIds.add(String(r.id));
              if (r.number) existingExpIds.add(String(r.number));
              if (r.salary_request_id) existingExpIds.add(`sal_${r.salary_request_id}`);
            });

            rawExpenses.forEach(exp => {
              const expIdStr = String(exp.id);
              if (deletedExpenseIds.has(expIdStr)) return;
              const docNum = exp.nomor || (expIdStr.startsWith('PAYROLL-') ? expIdStr : `EXP-${expIdStr.padStart(4, '0')}`);
              if (existingExpIds.has(docNum) || existingExpIds.has(expIdStr)) return;
              if (exp.salary_request_id && existingExpIds.has(`sal_${exp.salary_request_id}`)) return;
              existingExpIds.add(docNum);
              existingExpIds.add(expIdStr);

              const expDate = exp.tanggal || new Date().toISOString().split('T')[0];
              const d = new Date(expDate);
              if (isNaN(d.getTime())) return;
              const expYear = d.getFullYear();
              const expMonth = d.getMonth() + 1;
              if (expYear !== Number(year)) return;

              const amount = Number(exp.nominal) || 0;
              const isPaid = (exp.status || '').toLowerCase() === 'paid';
              const isSalary = (exp.kategori || '').toLowerCase().includes('gaji') ||
                               (exp.kategori || '').toLowerCase().includes('payroll') ||
                               (exp.deskripsi || '').toLowerCase().includes('gaji');

              // 1. Proyeksi Kas Keluar
              const projExpItem = {
                id: docNum,
                number: docNum,
                transaction_date: expDate,
                type: 'expense',
                amount: amount,
                party_name: exp.vendor || (isSalary ? 'Karyawan LPK' : 'Pihak Ketiga'),
                description: exp.deskripsi || `${exp.kategori || 'Beban Operasional'} - ${exp.vendor || ''}`,
                source_type: isSalary ? 'salary' : 'expense_record',
                classification: isSalary ? 'Penggajian Karyawan' : (exp.kategori || 'Beban Operasional'),
                approval_status: 'approved',
                payment_status: isPaid ? 'paid' : 'unpaid',
                cash_account_name: exp.sumberDana ? `${exp.sumberDana}` : 'BCA (1832-918-428)',
                jatuh_tempo: expDate,
                salary_request_id: exp.salary_request_id || null,
              };
              if (!cloned.projection_items) cloned.projection_items = [];
              cloned.projection_items.unshift(projExpItem);

              if (cloned.months && cloned.months[expMonth - 1]) {
                cloned.months[expMonth - 1].projection = (
                  Number(cloned.months[expMonth - 1].projection || 0) + amount
                ).toFixed(2);
              }

              // 2. Realisasi Kas Keluar (Paid) atau Pasangan Reconciled (Unpaid/Overdue)
              if (isPaid) {
                const realExpItem = {
                  ...projExpItem,
                  number: 'FIN-' + docNum,
                  payment_status: 'paid',
                  paid_at: expDate,
                  related_proj_id: docNum,
                  related_proj_number: docNum,
                };
                if (!cloned.realization_items) cloned.realization_items = [];
                cloned.realization_items.unshift(realExpItem);

                if (cloned.months && cloned.months[expMonth - 1]) {
                  cloned.months[expMonth - 1].realization = (
                    Number(cloned.months[expMonth - 1].realization || 0) + amount
                  ).toFixed(2);
                  cloned.months[expMonth - 1].expense = (
                    Number(cloned.months[expMonth - 1].expense || 0) + amount
                  ).toFixed(2);
                }
              } else {
                const todayIso = new Date().toISOString().split('T')[0];
                const isOverdue = todayIso > expDate;
                const pendingExpItem = {
                  ...projExpItem,
                  id: `PENDING-${docNum}`,
                  number: `MENUNGGU-${docNum}`,
                  amount: 0,
                  expected_amount: amount,
                  payment_status: isOverdue ? 'overdue' : 'unpaid',
                  paid_at: null,
                  is_pending_realization: true,
                  related_proj_id: docNum,
                  related_proj_number: docNum,
                };
                if (!cloned.realization_items) cloned.realization_items = [];
                cloned.realization_items.push(pendingExpItem);
              }
            });
          }
        } catch (errExp) {
          console.warn('Gagal sinkronisasi data expense lokal:', errExp);
        }

        // ── 3. UNIVERSAL RECONCILIATION: Pastikan semua transaksi di Proyeksi memiliki baris di Realisasi ──
        const existingRealKeys = new Set();
        (cloned.realization_items || []).forEach(r => {
          if (r.related_proj_id) existingRealKeys.add(String(r.related_proj_id));
          if (r.related_proj_number) existingRealKeys.add(String(r.related_proj_number));
          if (r.salary_request_id) existingRealKeys.add(`sal_${r.salary_request_id}`);
          if (r.budget_request_id) existingRealKeys.add(`bud_${r.budget_request_id}`);
          if (r.id) existingRealKeys.add(String(r.id));
          if (r.number) {
            existingRealKeys.add(String(r.number));
            const numClean = String(r.number).replace(/^(FIN-|PROJ-|PAYROLL-|MENUNGGU-)/, '');
            if (numClean) existingRealKeys.add(numClean);
          }
        });

        (cloned.projection_items || []).forEach(p => {
          const pId = String(p.id || '');
          const pNum = String(p.number || '');
          const pNumClean = pNum.replace(/^(PROJ-|FIN-|PAYROLL-|MENUNGGU-)/, '');
          const salKey = p.salary_request_id ? `sal_${p.salary_request_id}` : null;
          const budKey = p.budget_request_id ? `bud_${p.budget_request_id}` : null;

          const hasReal = existingRealKeys.has(pId) ||
                          existingRealKeys.has(pNum) ||
                          (pNumClean && existingRealKeys.has(pNumClean)) ||
                          (salKey && existingRealKeys.has(salKey)) ||
                          (budKey && existingRealKeys.has(budKey));

          if (!hasReal) {
            const todayIso = new Date().toISOString().split('T')[0];
            const isOverdue = todayIso > (p.jatuh_tempo || p.transaction_date);
            const pendingItem = {
              ...p,
              id: `PENDING-${p.id || p.number}`,
              number: `MENUNGGU-${p.number || p.id}`,
              amount: 0,
              expected_amount: Number(p.amount) || 0,
              payment_status: isOverdue ? 'overdue' : 'unpaid',
              paid_at: null,
              is_pending_realization: true,
              related_proj_id: p.id,
              related_proj_number: p.number,
            };
            if (!cloned.realization_items) cloned.realization_items = [];
            cloned.realization_items.push(pendingItem);
          }
        });

        // Recalculate Totals
        if (cloned.totals) {
          const totalProj = (cloned.projection_items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const totalReal = (cloned.realization_items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          cloned.totals.projection = totalProj.toFixed(2);
          cloned.totals.realization = totalReal.toFixed(2);

          let totalInc = 0;
          let totalExp = 0;
          (cloned.months || []).forEach(m => {
            totalInc += Number(m.income) || 0;
            totalExp += Number(m.expense) || 0;
          });
          cloned.totals.income = totalInc.toFixed(2);
          cloned.totals.expense = totalExp.toFixed(2);
          cloned.totals.balance = (totalInc - totalExp).toFixed(2);
        }
      }
    } catch (e) {
      console.warn('Gagal sinkronisasi invoice lokal ke audit keuangan', e);
    }
    return cloned;
  }, [data, year]);

  const chartData = useMemo(() => {
    if (!activeData?.months) return [];
    return activeData.months.map((m, i) => ({
      name: MONTHS_ID[i],
      month: m.month,
      proyeksi: Number(m.projection) || 0,
      realisasi: Number(m.realization) || 0,
      pemasukan: Number(m.income) || 0,
      pengeluaran: Number(m.expense) || 0,
    }));
  }, [activeData]);

  const findRelated = useCallback((item, forTab) => {
    if (!activeData) return null;
    const tab = forTab || auditTab;
    const items = tab === 'projection' ? activeData.realization_items : activeData.projection_items;
    if (!items || !items.length) return null;

    // 1. Explicit direct link first
    if (item.related_proj_id) {
      const match = items.find(r => String(r.id) === String(item.related_proj_id) || String(r.number) === String(item.related_proj_id));
      if (match) return match;
    }
    if (item.related_proj_number) {
      const match = items.find(r => String(r.number) === String(item.related_proj_number) || String(r.id) === String(item.related_proj_number));
      if (match) return match;
    }
    const revMatch = items.find(r => String(r.related_proj_id) === String(item.id) || String(r.related_proj_number) === String(item.number));
    if (revMatch) return revMatch;

    // 2. Specific IDs
    if (item.salary_request_id) {
      const match = items.find(r => String(r.salary_request_id) === String(item.salary_request_id));
      if (match) return match;
    }
    if (item.budget_request_id) {
      const match = items.find(r => String(r.budget_request_id) === String(item.budget_request_id));
      if (match) return match;
    }
    if (item.source_id) {
      const match = items.find(r => String(r.source_id) === String(item.source_id));
      if (match) return match;
    }

    // 3. Normalized document number matching
    if (item.number) {
      const numClean = String(item.number).replace(/^(PROJ-|FIN-|PAYROLL-|MENUNGGU-)/, '').trim();
      const match = items.find(r => {
        if (!r.number) return false;
        if (r.number === item.number) return true;
        const rClean = String(r.number).replace(/^(PROJ-|FIN-|PAYROLL-|MENUNGGU-)/, '').trim();
        return rClean && rClean === numClean;
      });
      if (match) return match;
    }

    // 4. Party and amount/expected_amount matching
    if (item.party_name && item.party_name !== '-' && item.party_name !== 'Internal') {
      const targetNom = Number(item.amount) || Number(item.expected_amount) || 0;
      const match = items.find(r =>
        r.party_name &&
        r.party_name.toLowerCase().trim() === item.party_name.toLowerCase().trim() &&
        (Math.abs(Number(r.amount) - targetNom) < 1 || Math.abs(Number(r.expected_amount || 0) - targetNom) < 1)
      );
      if (match) return match;
    }

    return null;
  }, [activeData, auditTab]);

  const filterItems = useCallback((items) => {
    if (!items) return [];
    return items.filter(i => {
      if (flowFilter === 'income' && i.type !== 'income') return false;
      if (flowFilter === 'expense' && i.type !== 'expense') return false;
      if (globalPeriod.startsWith('Q')) {
        const d = new Date(i.transaction_date);
        if (!isNaN(d.getTime())) {
          const m = d.getMonth() + 1;
          if (globalPeriod === 'Q1' && !(m >= 1 && m <= 3)) return false;
          if (globalPeriod === 'Q2' && !(m >= 4 && m <= 6)) return false;
          if (globalPeriod === 'Q3' && !(m >= 7 && m <= 9)) return false;
          if (globalPeriod === 'Q4' && !(m >= 10 && m <= 12)) return false;
        }
      }
      if (selectedMonth !== null) {
        const d = new Date(i.transaction_date);
        if (d.getMonth() + 1 !== selectedMonth) return false;
      }
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const num = (i.number || '').toLowerCase();
        const party = (i.party_name || '').toLowerCase();
        const desc = (i.description || '').toLowerCase();
        const cls = (i.classification || '').toLowerCase();
        const acc = (i.cash_account_name || '').toLowerCase();
        if (!num.includes(s) && !party.includes(s) && !desc.includes(s) && !cls.includes(s) && !acc.includes(s)) {
          return false;
        }
      }
      return true;
    });
  }, [selectedMonth, searchTerm, flowFilter, globalPeriod]);

  const filteredProjectionItems = useMemo(() => {
    return filterItems(activeData?.projection_items);
  }, [activeData?.projection_items, filterItems]);

  const filteredRealizationItems = useMemo(() => {
    return filterItems(activeData?.realization_items);
  }, [activeData?.realization_items, filterItems]);

  const getMatchKey = useCallback((item) => {
    if (!item) return null;
    if (item.related_proj_id) return `ref_${item.related_proj_id}`;
    if (item.related_proj_number) return `ref_${item.related_proj_number}`;
    if (item.salary_request_id) return `sal_${item.salary_request_id}`;
    if (item.budget_request_id) return `bud_${item.budget_request_id}`;
    if (item.source_id) return `src_${item.source_id}`;
    if (item.number) {
      const clean = String(item.number).replace(/^(PROJ-|FIN-|PAYROLL-|MENUNGGU-)/, '').trim();
      if (clean) return `ref_${clean}`;
    }
    if (item.id) {
      const cleanId = String(item.id).replace(/^(PENDING-)/, '').trim();
      if (cleanId) return `ref_${cleanId}`;
    }
    if (item.party_name && item.party_name !== '-' && item.party_name !== 'Internal') {
      return `party_${item.party_name.trim().toLowerCase()}_${Math.round(Number(item.amount || item.expected_amount) || 0)}`;
    }
    return `item_${item.id || item.number}`;
  }, []);

  const monthStats = useMemo(() => {
    const projIncome = filteredProjectionItems.filter(x => x.type === 'income').reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const projExpense = filteredProjectionItems.filter(x => x.type === 'expense').reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const projNet = projIncome - projExpense;

    const realIncome = filteredRealizationItems.filter(x => x.type === 'income').reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const realExpense = filteredRealizationItems.filter(x => x.type === 'expense').reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const realNet = realIncome - realExpense;

    const projTotal = flowFilter === 'income' ? projIncome : flowFilter === 'expense' ? projExpense : projNet;
    const realTotal = flowFilter === 'income' ? realIncome : flowFilter === 'expense' ? realExpense : realNet;

    const diff = projTotal - realTotal;
    const isBalanced = Math.abs(diff) < 1;
    return {
      projTotal,
      realTotal,
      projIncome,
      projExpense,
      realIncome,
      realExpense,
      projNet,
      realNet,
      diff,
      isBalanced,
      projCount: filteredProjectionItems.length,
      realCount: filteredRealizationItems.filter(x => !x.is_pending_realization && Number(x.amount) > 0).length,
    };
  }, [filteredProjectionItems, filteredRealizationItems, flowFilter]);

  const activePeriodLabel = useMemo(() => {
    if (globalPeriod === 'all') {
      return selectedMonth !== null
        ? `${MONTHS_ID[selectedMonth - 1]} (Semua Periode)`
        : 'Semua Periode (All Time)';
    }
    if (globalPeriod.startsWith('Q')) {
      return selectedMonth !== null
        ? `${MONTHS_ID[selectedMonth - 1]} ${year} (${globalPeriod})`
        : `Kuartal ${globalPeriod.slice(1)} ${year}`;
    }
    return selectedMonth !== null
      ? `${MONTHS_ID[selectedMonth - 1]} ${year}`
      : `Semua Bulan ${year}`;
  }, [selectedMonth, year, globalPeriod]);

  const getCashAccountDisplay = useCallback((item) => {
    if (!item) return '-';
    // All student tuition and billing invoices belong to corporate BCA account
    if (item.source_type === 'invoice_billing' || item.classification?.includes('Pemasukan') || item.type === 'income') {
      const acc = String(item.account_number || item.cash_account_name || item.rekening || '');
      if (acc.toLowerCase().includes('mandiri')) return 'Mandiri (130-0019283)';
      if (acc.toLowerCase().includes('bni')) return 'BNI (088-771122)';
      return 'BCA (1832-918-428)';
    }
    const acc = String(item.account_number || item.cash_account_name || item.rekening || '');
    if (acc.includes('1832-918-428') || acc.toLowerCase().includes('bca')) {
      return 'BCA (1832-918-428)';
    }
    if (item.bank_name && item.bank_name !== 'BRI') {
      return `${item.bank_name} (${item.account_number || ''})`;
    }
    if (item.cash_account_name && !item.cash_account_name.startsWith('BRI')) {
      return item.cash_account_name;
    }
    return item.cash_account_name || 'BCA (1832-918-428)';
  }, []);

  const handleAuditClick = useCallback((item) => {
    const related = findRelated(item);
    setAuditModal({ item, related });
    setHighlightedId(item.id || item.number);
  }, [findRelated]);

  const handleSwitchTab = useCallback((targetTab, targetItem) => {
    setAuditModal(null);
    setAuditTab(targetTab);
    const idKey = targetItem.id || targetItem.number;
    setHighlightedId(idKey);
    setTimeout(() => {
      const el = document.getElementById(`audit-row-${idKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, []);

  // ── Pie data ────────────────────────────────────────────────
  const incomePieData = useMemo(() => {
    // 1. Dynamic aggregation from activeData.realization_items where type === 'income'
    if (activeData?.realization_items?.length) {
      const filtered = activeData.realization_items.filter(item => {
        if (item.type !== 'income' || Number(item.amount) <= 0) return false;
        return matchPeriod(item.transaction_date || item.paid_at, incomePeriod);
      });

      if (filtered.length > 0) {
        const byClass = {};
        filtered.forEach(item => {
          const cls = item.classification || 'Pemasukan Pelatihan';
          byClass[cls] = (byClass[cls] || 0) + (Number(item.amount) || 0);
        });
        return Object.entries(byClass).map(([name, value], i) => ({
          name,
          value,
          color: COLORS[i % COLORS.length]
        }));
      }
    }

    // Fallback: if incomePeriod is 'all', show activeData.income_by_classification/source if any
    if (incomePeriod === 'all' && (activeData?.income_by_source?.length || activeData?.income_by_classification?.length)) {
      const src = activeData.income_by_classification?.length ? activeData.income_by_classification : activeData.income_by_source;
      return (src || []).map((s, i) => ({
        name: s.classification || s.account_name || 'Lainnya',
        value: Number(s.total) || 0,
        color: COLORS[i % COLORS.length]
      }));
    }

    return [];
  }, [activeData, incomePeriod, matchPeriod]);

  const expensePieData = useMemo(() => {
    // 1. Dynamic aggregation from activeData.realization_items where type === 'expense'
    if (activeData?.realization_items?.length) {
      const filtered = activeData.realization_items.filter(item => {
        if (item.type !== 'expense' || Number(item.amount) <= 0) return false;
        return matchPeriod(item.transaction_date || item.paid_at, expensePeriod);
      });

      if (filtered.length > 0) {
        const byClass = {};
        filtered.forEach(item => {
          const cls = item.classification || 'Beban Operasional';
          byClass[cls] = (byClass[cls] || 0) + (Number(item.amount) || 0);
        });
        return Object.entries(byClass).map(([name, value], i) => ({
          name,
          value,
          color: COLORS[(i + 3) % COLORS.length]
        }));
      }
    }

    // Fallback: if expensePeriod is 'all', show activeData.expense_by_source/classification if any
    if (expensePeriod === 'all' && (activeData?.expense_by_source?.length || activeData?.expense_by_classification?.length)) {
      const src = activeData.expense_by_classification?.length ? activeData.expense_by_classification : activeData.expense_by_source;
      return (src || []).map((s, i) => ({
        name: s.classification || s.account_name || 'Lainnya',
        value: Number(s.total) || 0,
        color: COLORS[(i + 3) % COLORS.length]
      }));
    }

    return [];
  }, [activeData, expensePeriod, matchPeriod]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <Layout appearance="finance">
      <div className="fd-root px-1 sm:px-2">
        {/* ── Hero / Header Card ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 lg:p-7 relative overflow-hidden mb-6">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              {/* Kicker tag */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 mb-3">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tracking-wider uppercase">KEUANGAN CREATIVA</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
                Dashboard Keuangan
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-0">
                Pantau arus kas, proyek, dan realisasi bisnis dalam satu tampilan yang lebih jelas dan mudah dipahami.
              </p>
            </div>

            {/* Right Top Controls */}
            <div className="flex items-center gap-2.5 self-start md:self-center z-20">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1.5 py-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    const prevYear = year - 1;
                    setYear(prevYear);
                    setGlobalPeriod(String(prevYear));
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  title="Tahun sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-bold text-slate-800 tracking-tight whitespace-nowrap">
                  {globalPeriod === 'all' ? 'Semua Periode' : globalPeriod.startsWith('Q') ? `${globalPeriod} ${year}` : year}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextYear = year + 1;
                    setYear(nextYear);
                    setGlobalPeriod(String(nextYear));
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  title="Tahun berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dropdown Menu Pilih Periode */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsPeriodMenuOpen(v => !v)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer ${
                    globalPeriod === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Pilih filter periode komparasi"
                >
                  <svg className={`w-3.5 h-3.5 ${globalPeriod === 'all' ? 'text-white' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>
                    {globalPeriod === 'all' ? 'Semua Periode' : globalPeriod.startsWith('Q') ? `Kuartal ${globalPeriod.slice(1)} ${year}` : 'Pilih Periode'}
                  </span>
                  <svg className={`w-3 h-3 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {isPeriodMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-xs">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cakupan Periode</div>
                    <button
                      type="button"
                      onClick={() => {
                        setGlobalPeriod('all');
                        setSelectedMonth(null);
                        setIsPeriodMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${globalPeriod === 'all' ? 'font-bold text-blue-600 bg-blue-50/70' : 'text-slate-700'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Semua Periode (All Time)
                      </span>
                      {globalPeriod === 'all' && <span className="font-bold text-blue-600">✓</span>}
                    </button>

                    <div className="border-t border-slate-100 my-1.5" />
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Anggaran</div>
                    {[2027, 2026, 2025, 2024].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setYear(y);
                          setGlobalPeriod(String(y));
                          setSelectedMonth(null);
                          setIsPeriodMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${globalPeriod === String(y) ? 'font-bold text-blue-600 bg-blue-50/70' : 'text-slate-700'}`}
                      >
                        <span>Tahun {y} {y === 2026 && <span className="text-[10px] text-slate-400 font-normal">(Aktif)</span>}</span>
                        {globalPeriod === String(y) && <span className="font-bold text-blue-600">✓</span>}
                      </button>
                    ))}

                    <div className="border-t border-slate-100 my-1.5" />
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kuartal {year}</div>
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setGlobalPeriod(q);
                          setSelectedMonth(null);
                          setIsPeriodMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${globalPeriod === q ? 'font-bold text-blue-600 bg-blue-50/70' : 'text-slate-700'}`}
                      >
                        <span>Kuartal {idx + 1} ({['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Okt-Des'][idx]})</span>
                        {globalPeriod === q && <span className="font-bold text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div>
          {loading ? (
            <div className="fd-loading"><div className="fd-spinner" />Memuat data keuangan...</div>
          ) : error ? (
            <div className="fd-panel">
              <div className="fd-error">
                {error}
                <br /><button onClick={() => fetchData(year)}>Coba Lagi</button>
              </div>
            </div>
          ) : activeData ? (
            <>
              {/* ── CFO Alerts & Early Warning Banner ── */}
              {Array.isArray(activeData.alerts) && activeData.alerts.length > 0 && (
                <div className="mb-6 space-y-2.5">
                  {activeData.alerts.map((al, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                        al.type === 'danger'
                          ? 'bg-rose-50/90 border-rose-200 text-rose-900 shadow-2xs'
                          : 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${al.type === 'danger' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 shadow-2xs">
                          {al.code}
                        </span>
                        <span className="text-xs font-semibold">{al.message}</span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {al.code === 'UNPOSTED' && (
                          <a
                            href="/finance/journal"
                            className="text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3 py-1 rounded-xl transition"
                          >
                            Buka Jurnal →
                          </a>
                        )}
                        {al.code === 'OVERDUE_AR' && (
                          <a
                            href="/finance/invoice"
                            className="text-xs font-bold text-rose-900 bg-rose-200/70 hover:bg-rose-200 px-3 py-1 rounded-xl transition"
                          >
                            Buka Invoice →
                          </a>
                        )}
                        {al.code?.startsWith('BUDGET') && (
                          <a
                            href="/finance/realisasi-anggaran"
                            className="text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3 py-1 rounded-xl transition"
                          >
                            Cek Realisasi →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── KPI Cards (4 Column Grid) ───────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* 1: TOTAL PROYEKSI */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <TrendUp className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">TOTAL PROYEKSI</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                        {activeData.projection_items?.length || 0} trx
                      </span>
                    </div>
                    <div className="text-[22px] font-black text-[#1a73e8] tracking-tight mb-3">
                      {money(activeData.totals.projection)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400 font-medium">Dana belum masuk</span>
                    <div className="w-20 h-6">
                      <Sparkline values={chartData.map(m => m.proyeksi)} color="#2563eb" />
                    </div>
                  </div>
                </div>

                {/* 2: TOTAL REALISASI */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">TOTAL REALISASI</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                        {activeData.realization_items?.length || 0} trx
                      </span>
                    </div>
                    <div className="text-[22px] font-black text-emerald-600 tracking-tight mb-3">
                      {money(activeData.totals.realization)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-xs font-semibold flex items-center gap-1 ${Math.abs(Number(activeData.totals.projection) - Number(activeData.totals.realization)) < 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {Math.abs(Number(activeData.totals.projection) - Number(activeData.totals.realization)) < 1 ? '✓ Balanced' : '⚠ Piutang Berjalan'}
                    </span>
                    <div className="w-20 h-6">
                      <Sparkline values={chartData.map(m => m.realisasi)} color="#059669" />
                    </div>
                  </div>
                </div>

                {/* 3: TOTAL PEMASUKAN */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">TOTAL PEMASUKAN</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-600">
                        Kas Masuk
                      </span>
                    </div>
                    <div className="text-[22px] font-black text-purple-700 tracking-tight mb-3">
                      {money(activeData.totals.income)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400 font-medium">Tahun {year}</span>
                    <div className="w-20 h-6">
                      <Sparkline values={chartData.map(m => m.pemasukan)} color="#7c3aed" />
                    </div>
                  </div>
                </div>

                {/* 4: TOTAL PENGELUARAN */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <TrendDown className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">TOTAL PENGELUARAN</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
                        Kas Keluar
                      </span>
                    </div>
                    <div className="text-[22px] font-black text-rose-600 tracking-tight mb-3">
                      {money(activeData.totals.expense)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-rose-600">
                      Saldo: {Number(activeData.totals.balance) < 0 ? `- ${money(Math.abs(activeData.totals.balance))}` : money(activeData.totals.balance)}
                    </span>
                    <div className="w-20 h-6">
                      <Sparkline values={chartData.map(m => m.pengeluaran)} color="#e11d48" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2 Charts Row ───────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                {/* Left Chart: Proyeksi vs Realisasi */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 leading-tight">Proyeksi vs Realisasi</h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">Perbandingan dana yang diproyeksikan dan terealisasi per bulan</p>
                      </div>
                    </div>
                    {/* Legend Top-Right */}
                    <div className="flex items-center gap-4 text-xs shrink-0">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        Proyeksi (Belum Dibayar)
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Realisasi (Sudah Dibayar)
                      </span>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        onClick={(e) => {
                          if (e && e.activePayload && e.activePayload[0]) {
                            const m = e.activePayload[0].payload.month;
                            setSelectedMonth(prev => prev === m ? null : m);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <defs>
                          <linearGradient id="gradProyeksi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="gradRealisasi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={shortMoney} width={50} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="proyeksi" name="Proyeksi" stroke="#2563eb" strokeWidth={2.5}
                          fill="url(#gradProyeksi)" dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 5.5, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }} />
                        <Area type="monotone" dataKey="realisasi" name="Realisasi" stroke="#10b981" strokeWidth={2.5}
                          fill="url(#gradRealisasi)" dot={{ r: 3.5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 5.5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right Chart: Pemasukan & Pengeluaran */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <TrendDown className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">Pemasukan & Pengeluaran</h2>
                    </div>
                    {/* Switcher Grafik / Tabel */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCashflowView('chart')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition ${cashflowView === 'chart' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Grafik
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashflowView('table')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition ${cashflowView === 'table' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Tabel
                      </button>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    {cashflowView === 'chart' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          barGap={4}
                          onClick={(e) => {
                            if (e && e.activePayload && e.activePayload[0]) {
                              const m = e.activePayload[0].payload.month;
                              setSelectedMonth(prev => prev === m ? null : m);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={shortMoney} width={50} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="pemasukan" name="Pemasukan" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={18} />
                          <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-semibold text-left">
                              <th className="py-2">Bulan</th>
                              <th className="py-2 text-right">Pemasukan</th>
                              <th className="py-2 text-right">Pengeluaran</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {chartData.map(row => (
                              <tr key={row.month} className="hover:bg-slate-50">
                                <td className="py-2 font-medium text-slate-700">{row.name}</td>
                                <td className="py-2 text-right font-bold text-purple-600">{money(row.pemasukan)}</td>
                                <td className="py-2 text-right font-bold text-rose-600">{money(row.pengeluaran)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Bottom Legend */}
                  <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      Pemasukan
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      Pengeluaran
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Donut Charts Row ───────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                {/* Sumber Pemasukan */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendUp className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">Sumber Pemasukan</h2>
                    </div>
                    <div className="relative dropdown-container">
                      <button
                        type="button"
                        onClick={() => {
                          setIsIncomePeriodOpen(v => !v);
                          setIsExpensePeriodOpen(false);
                          setIsPeriodMenuOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer transition"
                      >
                        <span>{getPeriodLabel(incomePeriod)}</span>
                        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isIncomePeriodOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>

                      {isIncomePeriodOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs">
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Rentang</div>
                          <button
                            type="button"
                            onClick={() => { setIncomePeriod('all'); setIsIncomePeriodOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${incomePeriod === 'all' ? 'font-bold text-emerald-600 bg-emerald-50/60' : 'text-slate-700'}`}
                          >
                            <span>Semua Periode</span>
                            {incomePeriod === 'all' && <span>✓</span>}
                          </button>

                          <div className="border-t border-slate-100 my-1" />
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kuartal</div>
                          {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => { setIncomePeriod(q); setIsIncomePeriodOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${incomePeriod === q ? 'font-bold text-emerald-600 bg-emerald-50/60' : 'text-slate-700'}`}
                            >
                              <span>Kuartal {idx + 1} ({['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Okt-Des'][idx]})</span>
                              {incomePeriod === q && <span>✓</span>}
                            </button>
                          ))}

                          <div className="border-t border-slate-100 my-1" />
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulan</div>
                          <div className="grid grid-cols-3 gap-1 px-2 py-1">
                            {MONTHS_ID.map((m, idx) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => { setIncomePeriod(String(idx + 1)); setIsIncomePeriodOpen(false); }}
                                className={`px-2 py-1 text-center rounded text-[11px] cursor-pointer ${incomePeriod === String(idx + 1) ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-600'}`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {incomePieData.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                      <div className="w-36 h-36 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={incomePieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={3}
                              strokeWidth={0}
                            >
                              {incomePieData.map((entry, i) => (
                                <Cell key={i} fill={entry.color || '#2563eb'} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex-1 w-full flex flex-col gap-3">
                        {(() => {
                          const totalIncome = incomePieData.reduce((acc, x) => acc + (Number(x.value) || 0), 0);
                          return incomePieData.map((item, i) => {
                            const pct = totalIncome > 0 ? Math.round((item.value / totalIncome) * 100) : 0;
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || '#2563eb' }} />
                                  <span className="font-semibold text-slate-700">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <span className="font-bold text-slate-900">{money(item.value)}</span>
                                  <span className="text-slate-500 font-semibold w-12 text-right">{pct}%</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">Belum ada data pemasukan</div>
                  )}
                </div>

                {/* Sumber Pengeluaran */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        <TrendDown className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">Sumber Pengeluaran</h2>
                    </div>
                    <div className="relative dropdown-container">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpensePeriodOpen(v => !v);
                          setIsIncomePeriodOpen(false);
                          setIsPeriodMenuOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer transition"
                      >
                        <span>{getPeriodLabel(expensePeriod)}</span>
                        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpensePeriodOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>

                      {isExpensePeriodOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs">
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Rentang</div>
                          <button
                            type="button"
                            onClick={() => { setExpensePeriod('all'); setIsExpensePeriodOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${expensePeriod === 'all' ? 'font-bold text-rose-600 bg-rose-50/60' : 'text-slate-700'}`}
                          >
                            <span>Semua Periode</span>
                            {expensePeriod === 'all' && <span>✓</span>}
                          </button>

                          <div className="border-t border-slate-100 my-1" />
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kuartal</div>
                          {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => { setExpensePeriod(q); setIsExpensePeriodOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer ${expensePeriod === q ? 'font-bold text-rose-600 bg-rose-50/60' : 'text-slate-700'}`}
                            >
                              <span>Kuartal {idx + 1} ({['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Okt-Des'][idx]})</span>
                              {expensePeriod === q && <span>✓</span>}
                            </button>
                          ))}

                          <div className="border-t border-slate-100 my-1" />
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulan</div>
                          <div className="grid grid-cols-3 gap-1 px-2 py-1">
                            {MONTHS_ID.map((m, idx) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => { setExpensePeriod(String(idx + 1)); setIsExpensePeriodOpen(false); }}
                                className={`px-2 py-1 text-center rounded text-[11px] cursor-pointer ${expensePeriod === String(idx + 1) ? 'bg-rose-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-600'}`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {expensePieData.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                      <div className="w-36 h-36 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expensePieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={3}
                              strokeWidth={0}
                            >
                              {expensePieData.map((entry, i) => (
                                <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex-1 w-full flex flex-col gap-3">
                        {(() => {
                          const totalExpense = expensePieData.reduce((acc, x) => acc + (Number(x.value) || 0), 0);
                          return expensePieData.map((item, i) => {
                            const color = i === 0 ? '#ef4444' : i === 1 ? '#f97316' : item.color;
                            const pct = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                  <span className="font-semibold text-slate-700">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <span className="font-bold text-slate-900">{money(item.value)}</span>
                                  <span className="text-slate-500 font-semibold w-12 text-right">{pct}%</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">Belum ada data pengeluaran</div>
                  )}
                </div>
              </div>

              {/* ── Data Analitik Card ─────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">Data Analitik — Audit Proyeksi & Realisasi</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">Layar komparasi data proyeksi (kiri) vs realisasi (kanan) setiap bulannya</p>
                    </div>
                  </div>

                  {/* Toggle View: Analitik vs Mode Tab */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('split')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewMode === 'split' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <ColumnsIcon />
                      <span>Analitik</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('tabs')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewMode === 'tabs' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <LayersIcon />
                      <span>Mode Tab</span>
                    </button>
                  </div>
                </div>

                {/* Month Pills, Flow Filter, and Search Input */}
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 mb-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Month Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                      <button
                        onClick={() => setSelectedMonth(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${selectedMonth === null ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        Semua Bulan
                      </button>
                      {MONTHS_ID.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedMonth(selectedMonth === i + 1 ? null : i + 1)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${selectedMonth === i + 1 ? 'bg-blue-600 text-white shadow-2xs font-semibold' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Flow Filter (Kas Masuk / Kas Keluar / Semua) */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setFlowFilter('income')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            flowFilter === 'income'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Hanya menampilkan arus kas masuk / piutang & tagihan siswa"
                        >
                          <span className={`w-2 h-2 rounded-full ${flowFilter === 'income' ? 'bg-white' : 'bg-emerald-500'}`} />
                          Kas Masuk (Inflow)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlowFilter('expense')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            flowFilter === 'expense'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Hanya menampilkan arus kas keluar / beban & gaji"
                        >
                          <span className={`w-2 h-2 rounded-full ${flowFilter === 'expense' ? 'bg-white' : 'bg-rose-500'}`} />
                          Kas Keluar (Outflow)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlowFilter('all')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            flowFilter === 'all'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Tampilkan seluruh arus kas (Net Cashflow)"
                        >
                          Semua Arus Kas
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="relative shrink-0">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari transaksi, pihak, rekening..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 w-56 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Summary Banner for selected month */}
                  <div className="fd-split-banner">
                    <div className="fd-split-banner-info">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: monthStats.isBalanced ? '#10b981' : '#f59e0b' }} />
                      <h4>
                        Periode Audit: <span style={{ color: '#1e40af' }}>{activePeriodLabel}</span>
                        {flowFilter === 'income' && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">Fokus: Tagihan Siswa (Inflow)</span>}
                        {flowFilter === 'expense' && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">Fokus: Beban & Gaji (Outflow)</span>}
                        {flowFilter === 'all' && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">Net Cashflow</span>}
                      </h4>
                    </div>
                    <div className="fd-split-banner-stats">
                      <div className="fd-split-stat fd-split-stat--proj">
                        <span>{flowFilter === 'income' ? 'Total Tagihan:' : flowFilter === 'expense' ? 'Total Rencana Beban:' : 'Net Proyeksi:'}</span>
                        <strong>{money(monthStats.projTotal)}</strong>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>({monthStats.projCount} trx)</span>
                      </div>
                      <div style={{ color: '#cbd5e1' }}>•</div>
                      <div className="fd-split-stat fd-split-stat--real">
                        <span>{flowFilter === 'income' ? 'Total Diterima:' : flowFilter === 'expense' ? 'Total Terbayar:' : 'Net Realisasi:'}</span>
                        <strong>{money(monthStats.realTotal)}</strong>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>({monthStats.realCount} trx)</span>
                      </div>
                      <div style={{ color: '#cbd5e1' }}>•</div>
                      <div className="fd-split-stat">
                        <span>Status Audit:</span>
                        {monthStats.projCount === 0 && monthStats.realCount === 0 ? (
                          <span className="fd-tag" style={{ background: '#f1f5f9', color: '#64748b' }}>Belum Ada Data</span>
                        ) : monthStats.isBalanced ? (
                          <span className="fd-tag fd-tag--balanced">✓ Balanced (Sinkron 100%)</span>
                        ) : (
                          <span className="fd-tag fd-tag--selisih">⚠ Selisih {money(Math.abs(monthStats.diff))}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Dual Screen Mode (Split Screen) ── */}
                  {viewMode === 'split' ? (
                    <div className="fd-split-grid">
                      {/* LAYAR KIRI: PROYEKSI */}
                      <div className="fd-bs-card" style={{ borderTop: '3px solid #3b82f6' }}>
                        <div className="fd-bs-header">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded p-1.5 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: '#eff6ff', color: '#2563eb' }}>
                              <BarChart3 style={{ width: 17, height: 17 }} />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Proyeksi Arus Kas</h4>
                              <span style={{ fontSize: 10, color: '#64748b' }}>Rencana penerimaan & pengeluaran tagihan</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <span style={{ fontSize: 9.5, textTransform: 'uppercase', fontWeight: 700, color: '#64748b', display: 'block' }}>
                              {flowFilter === 'income' ? 'Total Tagihan (Inflow)' : flowFilter === 'expense' ? 'Total Rencana Beban' : 'Net Proyeksi Kas'}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8' }}>{money(monthStats.projTotal)}</span>
                          </div>
                        </div>

                        <div className="fd-bs-table-wrap">
                          <table className="fd-bs-table">
                            <thead>
                              <tr>
                                <th style={{ width: '20%' }}>No. Dokumen</th>
                                <th style={{ width: '13%' }}>Tanggal</th>
                                <th style={{ width: '18%' }}>Pihak / Rekanan</th>
                                <th style={{ width: '13%' }}>Klasifikasi</th>
                                <th style={{ width: '14%' }}>Nominal</th>
                                <th style={{ width: '12%' }}>Rekening</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProjectionItems.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
                                  Tidak ada data proyeksi untuk periode {activePeriodLabel}.
                                </td></tr>
                              ) : (
                                filteredProjectionItems.map((item, i) => {
                                  const related = findRelated(item, 'projection');
                                  const isBalanced = related && Math.abs(Number(item.amount) - Number(related.amount)) < 1;
                                  const mKey = getMatchKey(item);
                                  const isHovered = hoveredMatchKey && hoveredMatchKey === mKey;
                                  const isHigh = highlightedId === (item.id || item.number);
                                  return (
                                    <tr
                                      key={item.id || item.number || i}
                                      id={`audit-row-${item.id || item.number}`}
                                      className={`fd-row-clickable ${isHovered ? 'fd-row-linked-active-blue' : ''} ${isHigh ? 'fd-row-highlighted' : ''}`}
                                      onMouseEnter={() => setHoveredMatchKey(mKey)}
                                      onMouseLeave={() => setHoveredMatchKey(null)}
                                      onClick={() => handleAuditClick(item)}
                                      title="Arahkan kursor untuk menyorot pasangan di layar Realisasi. Klik untuk detail audit."
                                    >
                                      <td>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.number || `#${item.id}`}</div>
                                        {item.termin_info && (
                                          <span className="badge-bs badge-bs-secondary" style={{ fontSize: 9, padding: '1px 5px', marginTop: 2 }}>
                                            {item.termin_info}
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ whiteSpace: 'nowrap' }}>
                                        <div style={{ color: '#334155' }}>{item.transaction_date}</div>
                                        {item.jatuh_tempo && item.jatuh_tempo !== item.transaction_date && (
                                          <div style={{ fontSize: 9, color: '#94a3b8' }}>JT: {item.jatuh_tempo}</div>
                                        )}
                                      </td>
                                      <td style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: '#1e293b' }}>
                                        {item.party_name || '-'}
                                      </td>
                                      <td>
                                        <span className={`badge-bs ${item.type === 'income' ? 'badge-bs-success' : 'badge-bs-danger'}`}>
                                          {item.classification === 'Penggajian Karyawan' || item.source_type === 'salary' ? 'Penggajian' : (item.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                                        </span>
                                      </td>
                                      <td style={{ fontWeight: 700, color: item.type === 'income' ? '#0f766e' : '#be123c', whiteSpace: 'nowrap' }}>
                                        {money(item.amount)}
                                      </td>
                                      <td>
                                        <span className="badge-bs badge-bs-secondary" style={{ whiteSpace: 'nowrap' }}>
                                          {getCashAccountDisplay(item)}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        {(() => {
                                          if (related && (related.payment_status === 'paid' || Number(related.amount) > 0)) {
                                            if (isBalanced) {
                                              return <span className="badge-bs badge-bs-success">✓ Paid</span>;
                                            }
                                            return (
                                              <span className="badge-bs badge-bs-primary">
                                                ⚡ Partial ({money(related.amount)})
                                              </span>
                                            );
                                          }
                                          const todayIso = new Date().toISOString().split('T')[0];
                                          const isOverdue = todayIso > (item.jatuh_tempo || item.transaction_date);
                                          if (isOverdue) {
                                            return <span className="badge-bs badge-bs-danger">⚠ Overdue</span>;
                                          }
                                          return <span className="badge-bs badge-bs-warning">⏳ Unpaid</span>;
                                        })()}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* LAYAR KANAN: REALISASI */}
                      <div className="fd-bs-card" style={{ borderTop: '3px solid #10b981' }}>
                        <div className="fd-bs-header">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded p-1.5 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: '#ecfdf5', color: '#059669' }}>
                              <FileCheck style={{ width: 17, height: 17 }} />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Realisasi Arus Kas</h4>
                              <span style={{ fontSize: 10, color: '#64748b' }}>Realisasi aktual penerimaan tagihan & beban operasional</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <span style={{ fontSize: 9.5, textTransform: 'uppercase', fontWeight: 700, color: '#64748b', display: 'block' }}>
                              {flowFilter === 'income' ? 'Total Diterima (Inflow)' : flowFilter === 'expense' ? 'Total Terbayar' : 'Net Realisasi Kas'}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#047857' }}>{money(monthStats.realTotal)}</span>
                          </div>
                        </div>

                        <div className="fd-bs-table-wrap">
                          <table className="fd-bs-table">
                            <thead>
                              <tr>
                                <th style={{ width: '20%' }}>No. Dokumen</th>
                                <th style={{ width: '13%' }}>Tanggal</th>
                                <th style={{ width: '18%' }}>Pihak / Rekanan</th>
                                <th style={{ width: '13%' }}>Klasifikasi</th>
                                <th style={{ width: '14%' }}>Nominal</th>
                                <th style={{ width: '12%' }}>Rekening</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRealizationItems.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
                                  Tidak ada data realisasi untuk periode {activePeriodLabel}.
                                </td></tr>
                              ) : (
                                filteredRealizationItems.map((item, i) => {
                                  const related = findRelated(item, 'realization');
                                  const isBalanced = related && Math.abs(Number(item.amount) - Number(related.amount)) < 1;
                                  const mKey = getMatchKey(item);
                                  const isHovered = hoveredMatchKey && hoveredMatchKey === mKey;
                                  const isHigh = highlightedId === (item.id || item.number);
                                  const isPending = item.is_pending_realization || Number(item.amount) === 0;
                                  return (
                                    <tr
                                      key={item.id || item.number || i}
                                      id={`audit-row-${item.id || item.number}`}
                                      className={`fd-row-clickable ${isHovered ? 'fd-row-linked-active' : ''} ${isHigh ? 'fd-row-highlighted' : ''}`}
                                      onMouseEnter={() => setHoveredMatchKey(mKey)}
                                      onMouseLeave={() => setHoveredMatchKey(null)}
                                      onClick={() => handleAuditClick(item)}
                                      title="Arahkan kursor untuk menyorot pasangan di layar Proyeksi. Klik untuk detail audit."
                                    >
                                      <td>
                                        {isPending ? (
                                          <div>
                                            <div style={{ fontWeight: 700, color: '#334155' }}>
                                              {item.related_proj_number || item.number}
                                            </div>
                                            <span className="badge-bs badge-bs-secondary" style={{ fontSize: 9, padding: '1px 5px', marginTop: 2 }}>
                                              {item.payment_status === 'overdue' ? 'Lewat Jatuh Tempo' : 'Menunggu Bayar'}
                                            </span>
                                          </div>
                                        ) : (
                                          <div style={{ fontWeight: 700, color: '#047857' }}>{item.number || `#${item.id}`}</div>
                                        )}
                                      </td>
                                      <td style={{ whiteSpace: 'nowrap' }}>
                                        <div style={{ color: '#334155' }}>{item.transaction_date}</div>
                                        {item.paid_at && <div style={{ fontSize: 9, color: '#059669', fontWeight: 600 }}>Bayar: {item.paid_at}</div>}
                                      </td>
                                      <td style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: '#1e293b' }}>
                                        {item.party_name || '-'}
                                      </td>
                                      <td>
                                        <span className={`badge-bs ${item.type === 'income' ? 'badge-bs-success' : 'badge-bs-danger'}`}>
                                          {item.classification === 'Penggajian Karyawan' || item.source_type === 'salary' ? 'Penggajian' : (item.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                                        </span>
                                      </td>
                                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {isPending ? (
                                          <div>
                                            <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>Rp 0</span>
                                            <div style={{ fontSize: 9, color: item.payment_status === 'overdue' ? '#dc2626' : '#d97706', fontWeight: 500 }}>
                                              {item.type === 'expense' ? 'Rencana: ' : 'Tagihan: '}{money(item.expected_amount || item.amount)}
                                            </div>
                                          </div>
                                        ) : (
                                          <span style={{ color: item.type === 'income' ? '#047857' : '#be123c' }}>
                                            {money(item.amount)}
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        <span className="badge-bs badge-bs-secondary" style={{ whiteSpace: 'nowrap' }}>
                                          {getCashAccountDisplay(item)}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        {isPending ? (
                                          item.payment_status === 'overdue' ? (
                                            <span className="badge-bs badge-bs-danger">⚠ Overdue</span>
                                          ) : (
                                            <span className="badge-bs badge-bs-warning">⏳ Unpaid</span>
                                          )
                                        ) : related ? (
                                          <span className="badge-bs badge-bs-success">
                                            {isBalanced ? '✓ Paid' : `⚡ Partial (${money(item.amount)})`}
                                          </span>
                                        ) : (
                                          <span className="badge-bs badge-bs-success">✓ Paid</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Mode Tab Standar ── */
                    <div className="fd-table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
                      <table className="fd-bs-table">
                        <thead>
                          <tr>
                            <th style={{ width: '20%' }}>No. Dokumen</th>
                            <th style={{ width: '13%' }}>Tanggal</th>
                            <th style={{ width: '18%' }}>Pihak / Rekanan</th>
                            <th style={{ width: '13%' }}>Klasifikasi</th>
                            <th style={{ width: '14%' }}>Nominal</th>
                            <th style={{ width: '12%' }}>Rekening</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(auditTab === 'projection' ? filteredProjectionItems : filteredRealizationItems).length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                              {searchTerm ? 'Tidak ada data yang cocok dengan pencarian.' : `Tidak ada data ${auditTab === 'projection' ? 'proyeksi' : 'realisasi'} untuk periode ini.`}
                            </td></tr>
                          ) : (
                            (auditTab === 'projection' ? filteredProjectionItems : filteredRealizationItems).map((item, i) => {
                              const related = findRelated(item);
                              const isBalanced = related && Math.abs(Number(item.amount) - Number(related.amount)) < 1;
                              const idKey = item.id || item.number || i;
                              const isHigh = highlightedId === (item.id || item.number);
                              const isPending = item.is_pending_realization || Number(item.amount) === 0;
                              return (
                                <tr
                                  key={idKey}
                                  id={`audit-row-${item.id || item.number}`}
                                  className={`fd-row-clickable ${isHigh ? 'fd-row-highlighted' : ''}`}
                                  onClick={() => handleAuditClick(item)}
                                >
                                  <td style={{ fontWeight: 600 }}>
                                    {isPending ? (
                                      <div>
                                        <div style={{ color: '#334155', fontWeight: 700 }}>
                                          {item.related_proj_number || item.number}
                                        </div>
                                        <span className="badge-bs badge-bs-secondary" style={{ fontSize: 9, padding: '1px 5px', marginTop: 2 }}>
                                          {item.payment_status === 'overdue' ? 'Lewat Jatuh Tempo' : 'Menunggu Bayar'}
                                        </span>
                                      </div>
                                    ) : (
                                      item.number || `#${item.id}`
                                    )}
                                  </td>
                                  <td>{item.transaction_date}</td>
                                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{item.party_name || '-'}</td>
                                  <td>
                                    <span className={`badge-bs ${item.type === 'income' ? 'badge-bs-success' : 'badge-bs-danger'}`}>
                                      {item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                    </span>
                                  </td>
                                  <td style={{ fontWeight: 700, color: item.type === 'income' ? '#0f766e' : '#be123c' }}>
                                    {isPending ? (
                                      <div>
                                        <span style={{ color: '#94a3b8', fontSize: 11 }}>Rp 0</span>
                                        <div style={{ fontSize: 8.5, color: '#d97706' }}>Tagihan: {money(item.expected_amount || item.amount)}</div>
                                      </div>
                                    ) : (
                                      money(item.amount)
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge-bs badge-bs-secondary">{getCashAccountDisplay(item)}</span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {isPending ? (
                                      item.payment_status === 'overdue' ? (
                                        <span className="badge-bs badge-bs-danger">⚠ Overdue</span>
                                      ) : (
                                        <span className="badge-bs badge-bs-warning">⏳ Unpaid</span>
                                      )
                                    ) : (
                                      <span className="badge-bs badge-bs-success">✓ Paid</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
            </>
          ) : null}
        </div>

        {/* ── Audit Modal ────────────────────────────────────── */}
        {auditModal && (
          <AuditModal
            item={auditModal.item}
            related={auditModal.related}
            onClose={() => setAuditModal(null)}
            onSwitchTab={handleSwitchTab}
            currentTab={auditTab}
          />
        )}
      </div>
    </Layout>
  );
}
