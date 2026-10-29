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
              <span>{item.cash_account_name || '-'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Status Persetujuan</label>
              <span>{item.approval_status || '-'}</span>
            </div>
            <div className="fd-detail-item">
              <label>Status Pembayaran</label>
              <span>{item.payment_status === 'unpaid' ? 'Belum Dibayar (Proyeksi)' : 'Sudah Dibayar (Realisasi)'}</span>
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
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#065f46' }}>{money(realItem.amount)}</span>
                  </div>
                  <div className="fd-detail-item" style={{ marginTop: 8 }}>
                    <label>Tanggal / Waktu Bayar</label>
                    <span>{realItem.paid_at || realItem.transaction_date || '-'}</span>
                  </div>
                  <div className="fd-detail-item" style={{ marginTop: 8 }}>
                    <label>Rekening</label>
                    <span>{realItem.cash_account_name || '-'}</span>
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
      const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      if (Array.isArray(savedCustom) && savedCustom.length > 0) {
        // Collect existing IDs in projection_items to prevent duplication
        const existingIds = new Set((cloned.projection_items || []).map(p => String(p.id || p.number)));

        savedCustom.forEach(inv => {
          const invId = String(inv.id || inv.nomor || '');
          if (!invId || existingIds.has(invId)) return;
          existingIds.add(invId);

          const invDate = inv.tanggal || new Date().toISOString().split('T')[0];
          const d = new Date(invDate);
          if (isNaN(d.getTime())) return;
          const invYear = d.getFullYear();
          if (invYear !== Number(year)) return;
          const invMonth = d.getMonth() + 1; // 1-12
          const amount = Number(inv.total) || 0;
          const isPaid = ['paid', 'lunas'].includes(String(inv.status || '').toLowerCase());

          // 1. Proyeksi: Setiap invoice yang terbit wajib masuk proyeksi kas masuk (Piutang Usaha)
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

          // Update monthly projection in cloned.months
          if (cloned.months && cloned.months[invMonth - 1]) {
            cloned.months[invMonth - 1].projection = (
              Number(cloned.months[invMonth - 1].projection || 0) + amount
            ).toFixed(2);
          }

          // 2. Realisasi: Hanya jika siswa sudah melunasi tagihan (Dana Aktual Diterima)
          if (isPaid) {
            const realItem = {
              ...projItem,
              number: 'FIN-' + invId,
              payment_status: 'paid',
              paid_at: invDate,
            };
            if (!cloned.realization_items) cloned.realization_items = [];
            cloned.realization_items.unshift(realItem);

            if (cloned.months && cloned.months[invMonth - 1]) {
              cloned.months[invMonth - 1].realization = (
                Number(cloned.months[invMonth - 1].realization || 0) + amount
              ).toFixed(2);
              cloned.months[invMonth - 1].income = (
                Number(cloned.months[invMonth - 1].income || 0) + amount
              ).toFixed(2);
            }
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

    if (item.number) {
      const numClean = item.number.replace(/^(PROJ-|FIN-|PAYROLL-)/, '');
      const match = items.find(r => {
        if (!r.number) return false;
        if (r.number === item.number) return true;
        const rClean = r.number.replace(/^(PROJ-|FIN-|PAYROLL-)/, '');
        return rClean === numClean;
      });
      if (match) return match;
    }

    if (item.party_name && item.party_name !== '-' && item.party_name !== 'Internal') {
      const match = items.find(r =>
        r.party_name &&
        r.party_name.toLowerCase().trim() === item.party_name.toLowerCase().trim() &&
        Math.abs(Number(r.amount) - Number(item.amount)) < 1
      );
      if (match) return match;
    }

    return items.find(r => Math.abs(Number(r.amount) - Number(item.amount)) < 1) || null;
  }, [activeData, auditTab]);

  const filterItems = useCallback((items) => {
    if (!items) return [];
    return items.filter(i => {
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
  }, [selectedMonth, searchTerm]);

  const filteredProjectionItems = useMemo(() => {
    return filterItems(activeData?.projection_items);
  }, [activeData?.projection_items, filterItems]);

  const filteredRealizationItems = useMemo(() => {
    return filterItems(activeData?.realization_items);
  }, [activeData?.realization_items, filterItems]);

  const getMatchKey = useCallback((item) => {
    if (!item) return null;
    if (item.salary_request_id) return `sal_${item.salary_request_id}`;
    if (item.budget_request_id) return `bud_${item.budget_request_id}`;
    if (item.source_id) return `src_${item.source_id}`;
    if (item.number) {
      const clean = String(item.number).replace(/^(PROJ-|FIN-|PAYROLL-)/, '').trim();
      if (clean) return `num_${clean}`;
    }
    if (item.party_name && item.party_name !== '-' && item.party_name !== 'Internal') {
      return `party_${item.party_name.trim().toLowerCase()}_${Math.round(Number(item.amount) || 0)}`;
    }
    return `item_${item.id || item.number}`;
  }, []);

  const monthStats = useMemo(() => {
    const projTotal = filteredProjectionItems.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const realTotal = filteredRealizationItems.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const diff = projTotal - realTotal;
    const isBalanced = Math.abs(diff) < 1;
    return {
      projTotal,
      realTotal,
      diff,
      isBalanced,
      projCount: filteredProjectionItems.length,
      realCount: filteredRealizationItems.length,
    };
  }, [filteredProjectionItems, filteredRealizationItems]);

  const activePeriodLabel = useMemo(() => {
    return selectedMonth !== null
      ? `${MONTHS_ID[selectedMonth - 1]} ${year}`
      : `Semua Bulan ${year}`;
  }, [selectedMonth, year]);

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
    if (!activeData?.income_by_source?.length && !activeData?.income_by_classification?.length) return [];
    const src = activeData.income_by_classification?.length ? activeData.income_by_classification : activeData.income_by_source;
    return (src || []).map((s, i) => ({
      name: s.classification || s.account_name || 'Lainnya',
      value: Number(s.total) || 0,
      color: COLORS[i % COLORS.length]
    }));
  }, [activeData]);

  const expensePieData = useMemo(() => {
    if (!activeData?.expense_by_source?.length && !activeData?.expense_by_classification?.length) return [];
    const src = activeData.expense_by_classification?.length ? activeData.expense_by_classification : activeData.expense_by_source;
    return (src || []).map((s, i) => ({
      name: s.classification || s.account_name || 'Lainnya',
      value: Number(s.total) || 0,
      color: COLORS[(i + 3) % COLORS.length]
    }));
  }, [activeData]);

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
            <div className="flex items-center gap-2 self-start md:self-center z-10">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1.5 py-1 shadow-2xs">
                <button onClick={() => setYear(y => y - 1)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition" title="Tahun sebelumnya">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-bold text-slate-800 tracking-tight">{year}</span>
                <button onClick={() => setYear(y => y + 1)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition" title="Tahun berikutnya">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition">
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Pilih Periode
              </button>
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
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs">
                      <span>Semua Periode</span>
                      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
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
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs">
                      <span>Semua Periode</span>
                      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
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

                {/* Month Pills and Search Input */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                    <button
                      onClick={() => setSelectedMonth(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${selectedMonth === null ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      Semua Bulan
                    </button>
                    {MONTHS_ID.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedMonth(selectedMonth === i + 1 ? null : i + 1)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${selectedMonth === i + 1 ? 'bg-blue-600 text-white shadow-2xs font-semibold' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="relative shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari transaksi, pihak, rekening..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 w-64 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                  {/* Summary Banner for selected month */}
                  <div className="fd-split-banner">
                    <div className="fd-split-banner-info">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: monthStats.isBalanced ? '#10b981' : '#f59e0b' }} />
                      <h4>Periode Audit: <span style={{ color: '#1e40af' }}>{activePeriodLabel}</span></h4>
                    </div>
                    <div className="fd-split-banner-stats">
                      <div className="fd-split-stat fd-split-stat--proj">
                        <span>Total Proyeksi:</span>
                        <strong>{money(monthStats.projTotal)}</strong>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>({monthStats.projCount} trx)</span>
                      </div>
                      <div style={{ color: '#cbd5e1' }}>•</div>
                      <div className="fd-split-stat fd-split-stat--real">
                        <span>Total Realisasi:</span>
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
                      <div className="fd-screen-col fd-screen-col--projection">
                        <div className="fd-screen-header">
                          <div className="fd-screen-title">
                            <div className="fd-screen-icon fd-screen-icon--blue"><BarChart3 /></div>
                            <div>
                              <h3>Proyeksi</h3>
                              <span>Kewajiban & rencana belum dibayar</span>
                            </div>
                          </div>
                          <div className="fd-screen-kpi-badge">
                            <label>Total Proyeksi</label>
                            <div className="amount">{money(monthStats.projTotal)}</div>
                          </div>
                        </div>

                        <div className="fd-split-table-wrap">
                          <table className="fd-table-compact">
                            <thead>
                              <tr>
                                <th>Nomor</th>
                                <th>Tanggal</th>
                                <th>Pihak / Rekanan</th>
                                <th>Nominal</th>
                                <th>Rekening</th>
                                <th>Audit Match</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProjectionItems.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
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
                                        <div style={{ fontWeight: 700, color: '#1e40af' }}>{item.number || `#${item.id}`}</div>
                                        <span className={`fd-tag ${item.type === 'income' ? 'fd-tag--income' : 'fd-tag--expense'}`} style={{ fontSize: 9, padding: '1px 5px', marginTop: 2 }}>
                                          {item.type === 'income' ? 'Masuk' : 'Keluar'}
                                        </span>
                                      </td>
                                      <td style={{ whiteSpace: 'nowrap' }}>{item.transaction_date}</td>
                                      <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.party_name || '-'}
                                      </td>
                                      <td className={`fd-amount ${item.type === 'income' ? 'fd-amount--income' : 'fd-amount--expense'}`} style={{ fontWeight: 700 }}>
                                        {money(item.amount)}
                                      </td>
                                      <td style={{ fontSize: 10, color: '#64748b' }}>{item.cash_account_name || '-'}</td>
                                      <td>
                                        {related ? (
                                          <span className={`fd-tag ${isBalanced ? 'fd-tag--balanced' : 'fd-tag--selisih'}`} style={{ fontSize: 9 }}>
                                            {isBalanced ? '✓ Balanced' : '⚠ Selisih'}
                                          </span>
                                        ) : (
                                          <span className="fd-tag" style={{ background: '#f8fafc', color: '#94a3b8', fontSize: 9 }}>
                                            ⏳ Menunggu
                                          </span>
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

                      {/* LAYAR KANAN: REALISASI */}
                      <div className="fd-screen-col fd-screen-col--realization">
                        <div className="fd-screen-header">
                          <div className="fd-screen-title">
                            <div className="fd-screen-icon fd-screen-icon--green"><FileCheck /></div>
                            <div>
                              <h3>Realisasi</h3>
                              <span>Dana aktual sudah dibayar / diterima</span>
                            </div>
                          </div>
                          <div className="fd-screen-kpi-badge">
                            <label>Total Realisasi</label>
                            <div className="amount">{money(monthStats.realTotal)}</div>
                          </div>
                        </div>

                        <div className="fd-split-table-wrap">
                          <table className="fd-table-compact">
                            <thead>
                              <tr>
                                <th>Nomor</th>
                                <th>Tanggal</th>
                                <th>Pihak / Rekanan</th>
                                <th>Nominal</th>
                                <th>Rekening</th>
                                <th>Status Audit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRealizationItems.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
                                  Tidak ada data realisasi untuk periode {activePeriodLabel}.
                                </td></tr>
                              ) : (
                                filteredRealizationItems.map((item, i) => {
                                  const related = findRelated(item, 'realization');
                                  const isBalanced = related && Math.abs(Number(item.amount) - Number(related.amount)) < 1;
                                  const mKey = getMatchKey(item);
                                  const isHovered = hoveredMatchKey && hoveredMatchKey === mKey;
                                  const isHigh = highlightedId === (item.id || item.number);
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
                                        <div style={{ fontWeight: 700, color: '#047857' }}>{item.number || `#${item.id}`}</div>
                                        <span className={`fd-tag ${item.type === 'income' ? 'fd-tag--income' : 'fd-tag--expense'}`} style={{ fontSize: 9, padding: '1px 5px', marginTop: 2 }}>
                                          {item.type === 'income' ? 'Masuk' : 'Keluar'}
                                        </span>
                                      </td>
                                      <td style={{ whiteSpace: 'nowrap' }}>{item.transaction_date}</td>
                                      <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.party_name || '-'}
                                      </td>
                                      <td className={`fd-amount ${item.type === 'income' ? 'fd-amount--income' : 'fd-amount--expense'}`} style={{ fontWeight: 700 }}>
                                        {money(item.amount)}
                                      </td>
                                      <td style={{ fontSize: 10, color: '#64748b' }}>{item.cash_account_name || '-'}</td>
                                      <td>
                                        {related ? (
                                          <span className={`fd-tag ${isBalanced ? 'fd-tag--balanced' : 'fd-tag--selisih'}`} style={{ fontSize: 9 }}>
                                            {isBalanced ? '✓ Balanced' : '⚠ Selisih'}
                                          </span>
                                        ) : (
                                          <span className="fd-tag" style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 9 }}>
                                            + Realisasi
                                          </span>
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
                      <table className="fd-table">
                        <thead>
                          <tr>
                            <th>Nomor</th>
                            <th>Tanggal</th>
                            <th>Jenis</th>
                            <th>Pihak / Rekanan</th>
                            <th>Nominal</th>
                            <th>Rekening</th>
                            <th>Status</th>
                            <th>Audit Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(auditTab === 'projection' ? filteredProjectionItems : filteredRealizationItems).length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                              {searchTerm ? 'Tidak ada data yang cocok dengan pencarian.' : `Tidak ada data ${auditTab === 'projection' ? 'proyeksi' : 'realisasi'} untuk periode ini.`}
                            </td></tr>
                          ) : (
                            (auditTab === 'projection' ? filteredProjectionItems : filteredRealizationItems).map((item, i) => {
                              const related = findRelated(item);
                              const isBalanced = related && Math.abs(Number(item.amount) - Number(related.amount)) < 1;
                              const isSelisih = related && Math.abs(Number(item.amount) - Number(related.amount)) >= 1;
                              const idKey = item.id || item.number || i;
                              const isHigh = highlightedId === (item.id || item.number);
                              return (
                                <tr
                                  key={idKey}
                                  id={`audit-row-${item.id || item.number}`}
                                  className={`fd-row-clickable ${isHigh ? 'fd-row-highlighted' : ''}`}
                                  onClick={() => handleAuditClick(item)}
                                >
                                  <td style={{ fontWeight: 600 }}>{item.number || `#${item.id}`}</td>
                                  <td>{item.transaction_date}</td>
                                  <td>
                                    <span className={`fd-tag ${item.type === 'income' ? 'fd-tag--income' : 'fd-tag--expense'}`}>
                                      {item.type === 'income' ? 'Masuk' : 'Keluar'}
                                    </span>
                                  </td>
                                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.party_name || '-'}</td>
                                  <td className={`fd-amount ${item.type === 'income' ? 'fd-amount--income' : 'fd-amount--expense'}`}>
                                    {money(item.amount)}
                                  </td>
                                  <td>{item.cash_account_name || '-'}</td>
                                  <td>
                                    <span className={`fd-tag ${auditTab === 'projection' ? 'fd-tag--projection' : 'fd-tag--realization'}`}>
                                      {auditTab === 'projection' ? (item.payment_status === 'unpaid' ? 'Belum Bayar' : 'Terjadwal') : 'Terbayar'}
                                    </span>
                                  </td>
                                  <td>
                                    {related ? (
                                      <span className={`fd-tag ${isBalanced ? 'fd-tag--balanced' : 'fd-tag--selisih'}`}>
                                        {isBalanced ? '✓ Balanced' : '⚠ Selisih'}
                                      </span>
                                    ) : (
                                      <span className="fd-tag" style={{ background: '#f1f5f9', color: '#94a3b8' }}>Belum Realisasi</span>
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
