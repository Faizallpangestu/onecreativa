const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/pages/InvoicePenagihan.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add normalizeFinanceStatus helper if not exists
const normalizeHelper = `
export function normalizeFinanceStatus(status) {
  if (!status) return "Unpaid";
  const s = String(status).trim().toLowerCase();
  if (s === "lunas" || s === "paid") return "Paid";
  if (s === "sebagian" || s === "sebagian dibayar" || s === "partially paid" || s === "partial") return "Partially Paid";
  if (s === "overdue" || s === "lewat jatuh tempo" || s === "past due") return "Overdue";
  return "Unpaid";
}
`;

if (!content.includes('function normalizeFinanceStatus')) {
  content = content.replace(
    'const formatRp = (n) => "Rp " + n.toLocaleString("id-ID");',
    'const formatRp = (n) => "Rp " + n.toLocaleString("id-ID");\n' + normalizeHelper
  );
}

// 2. Update STATUS_INV styling object
const oldStatusInv = `const STATUS_INV   = { "Lunas": "bg-emerald-100 text-emerald-700", "Sebagian": "bg-amber-100 text-amber-700", "Belum Lunas": "bg-red-100 text-red-600" };`;
const newStatusInv = `const STATUS_INV   = {
  "Paid": "bg-emerald-50 text-emerald-600 border border-emerald-200",
  "Partially Paid": "bg-amber-50 text-amber-600 border border-amber-200",
  "Unpaid": "bg-rose-50 text-rose-600 border border-rose-200",
  "Overdue": "bg-red-100 text-red-700 border border-red-300",
  "Lunas": "bg-emerald-50 text-emerald-600 border border-emerald-200",
  "Sebagian": "bg-amber-50 text-amber-600 border border-amber-200",
  "Belum Dibayar": "bg-rose-50 text-rose-600 border border-rose-200",
  "Belum Lunas": "bg-rose-50 text-rose-600 border border-rose-200"
};`;
content = content.replace(oldStatusInv, newStatusInv);

// 3. Update DEFAULT_BLUEPRINT_INVOICES with English finance statuses
const oldBlueprint = `const DEFAULT_BLUEPRINT_INVOICES = [
  { id: "TGCJ2608001", tanggal: "21/08/2026", customer: "Hany Agesti", program: "Kelas Intensif Offline", total: 15000000, terbayar: 15000000, sisa: 0, status: "Lunas", jatuhTempo: "23/08/2026" },
  { id: "TGCJ2608002", tanggal: "21/08/2026", customer: "Radian Hidayat", program: "Kelas Intensif Offline", total: 18000000, terbayar: 0, sisa: 18000000, status: "Belum Dibayar", jatuhTempo: "23/08/2026" },
  { id: "TGCJ2608003", tanggal: "20/08/2026", customer: "Andi Saputra", program: "Program SSW", total: 12000000, terbayar: 0, sisa: 12000000, status: "Belum Dibayar", jatuhTempo: "22/08/2026" },
  { id: "TGCJ2608004", tanggal: "19/08/2026", customer: "Siti Aminah", program: "Kursus Reguler", total: 8000000, terbayar: 4000000, sisa: 4000000, status: "Sebagian", jatuhTempo: "21/08/2026" },
  { id: "TGCJ2608005", tanggal: "15/08/2026", customer: "Budi Santoso", program: "Kelas Intensif Offline", total: 20000000, terbayar: 0, sisa: 20000000, status: "Overdue", jatuhTempo: "18/08/2026" },
];`;

const newBlueprint = `const DEFAULT_BLUEPRINT_INVOICES = [
  { id: "TGCJ2608001", tanggal: "21/08/2026", customer: "Hany Agesti", program: "Kelas Intensif Offline", total: 15000000, terbayar: 15000000, sisa: 0, status: "Paid", jatuhTempo: "23/08/2026" },
  { id: "TGCJ2608002", tanggal: "21/08/2026", customer: "Radian Hidayat", program: "Kelas Intensif Offline", total: 18000000, terbayar: 0, sisa: 18000000, status: "Unpaid", jatuhTempo: "23/08/2026" },
  { id: "TGCJ2608003", tanggal: "20/08/2026", customer: "Andi Saputra", program: "Program SSW", total: 12000000, terbayar: 0, sisa: 12000000, status: "Unpaid", jatuhTempo: "22/08/2026" },
  { id: "TGCJ2608004", tanggal: "19/08/2026", customer: "Siti Aminah", program: "Kursus Reguler", total: 8000000, terbayar: 4000000, sisa: 4000000, status: "Partially Paid", jatuhTempo: "21/08/2026" },
  { id: "TGCJ2608005", tanggal: "15/08/2026", customer: "Budi Santoso", program: "Kelas Intensif Offline", total: 20000000, terbayar: 0, sisa: 20000000, status: "Overdue", jatuhTempo: "18/08/2026" },
];`;
content = content.replace(oldBlueprint, newBlueprint);

// 4. Update TabDaftarInvoice: statuses to Paid, Partially Paid, Unpaid, Overdue
const newTabDaftarInvoice = `// ─── TAB 0: Daftar Invoice (MATCHING BLUEPRINT PANEL 1) ───────────────────────
function TabDaftarInvoice({ data = [], onDelete, dataSiswa = [], onRefresh }) {
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [programFilter, setProgramFilter] = useState("Semua Program");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [viewItem, setViewItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [showBuat, setShowBuat] = useState(false);

  // Normalize data with default fallback
  const deletedIds = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('deleted_invoice_ids') || '[]') : [];
  const validDefaults = DEFAULT_BLUEPRINT_INVOICES.filter(i => !deletedIds.includes(i.id));
  const allInvoices = (data && data.length > 0) ? data.filter(i => !deletedIds.includes(i.id)) : validDefaults;

  // Calculate dynamic totals for KPI cards
  const totalNominal = allInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  
  const paidInvoices = allInvoices.filter(i => normalizeFinanceStatus(i.status) === "Paid");
  const paidNominal = paidInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const partiallyPaidInvoices = allInvoices.filter(i => normalizeFinanceStatus(i.status) === "Partially Paid");
  const partiallyPaidNominal = partiallyPaidInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const unpaidInvoices = allInvoices.filter(i => normalizeFinanceStatus(i.status) === "Unpaid");
  const unpaidNominal = unpaidInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  // Available programs for filter
  const programOptions = ["Semua Program", "Kelas Intensif Offline", "Program SSW", "Kursus Reguler"];
  const statusOptions = ["Semua Status", "Paid", "Partially Paid", "Unpaid", "Overdue"];

  // Filtered list
  const filtered = allInvoices.filter(inv => {
    const stNorm = normalizeFinanceStatus(inv.status);
    const matchesStatus = statusFilter === "Semua Status" || stNorm === statusFilter;

    const prg = inv.program || inv.keterangan || "";
    const matchesProgram = 
      programFilter === "Semua Program" ||
      prg.toLowerCase().includes(programFilter.toLowerCase());

    const query = search.toLowerCase();
    const matchesSearch = 
      !query ||
      (inv.id && inv.id.toLowerCase().includes(query)) ||
      (inv.customer && inv.customer.toLowerCase().includes(query)) ||
      (prg && prg.toLowerCase().includes(query));

    return matchesStatus && matchesProgram && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleDelete = (id) => {
    if (onDelete) onDelete(id);
    setDelItem(null);
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
  };

  const handleDownload = (inv) => {
    generateInvoicePDF(inv);
  };

  return (
    <div className="space-y-6">
      {/* Buat Invoice Wizard Modal */}
      {showBuat && (
        <BuatInvoiceWizardModal
          onClose={() => setShowBuat(false)}
          onSuccess={() => {
            setShowBuat(false);
            if (onRefresh) onRefresh();
          }}
          dataSiswa={dataSiswa}
        />
      )}

      {/* View Detail Modal */}
      {viewItem && <InvoiceDetailModal inv={viewItem} onClose={() => setViewItem(null)} />}

      {/* Confirm Delete Modal */}
      {delItem && (
        <ConfirmDeleteModal
          label={delItem.id}
          onConfirm={() => handleDelete(delItem.id)}
          onCancel={() => setDelItem(null)}
        />
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Invoice</h1>
            <p className="text-xs font-medium text-slate-400">Kelola data invoice siswa, pembayaran, dan status tagihan.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 w-36 sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <button
            type="button"
            title="Bantuan"
            className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowBuat(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Buat Invoice
          </button>
        </div>
      </div>

      <div className="p-6 pt-0 space-y-6">
        {/* ── TOP KPI SUMMARY CARDS (Paid, Partially Paid, Unpaid) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Invoice */}
          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Invoice</p>
              <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{formatRp(totalNominal)}</h3>
              <p className="text-[11px] font-bold text-blue-600 mt-0.5">{allInvoices.length} Invoice</p>
            </div>
          </div>

          {/* Card 2: Paid (Lunas) */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Paid</p>
              <h3 className="text-lg font-black text-emerald-600 leading-tight mt-0.5">{formatRp(paidNominal)}</h3>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">{paidInvoices.length} Invoice</p>
            </div>
          </div>

          {/* Card 3: Partially Paid (Sebagian) */}
          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Partially Paid</p>
              <h3 className="text-lg font-black text-amber-600 leading-tight mt-0.5">{formatRp(partiallyPaidNominal)}</h3>
              <p className="text-[11px] font-bold text-amber-600 mt-0.5">{partiallyPaidInvoices.length} Invoice</p>
            </div>
          </div>

          {/* Card 4: Unpaid (Belum Bayar) */}
          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Unpaid</p>
              <h3 className="text-lg font-black text-rose-600 leading-tight mt-0.5">{formatRp(unpaidNominal)}</h3>
              <p className="text-[11px] font-bold text-rose-600 mt-0.5">{unpaidInvoices.length} Invoice</p>
            </div>
          </div>
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>01/08/2026 – 31/08/2026</span>
          </div>

          <select
            value={programFilter}
            onChange={e => { setProgramFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa, no invoice..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {(search || statusFilter !== "Semua Status" || programFilter !== "Semua Program") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("Semua Status");
                setProgramFilter("Semua Program");
                setPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
            </button>
          )}
        </div>

        {/* ── TABLE DAFTAR INVOICE ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">No. Invoice</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Siswa</th>
                  <th className="py-3.5 px-4">Program</th>
                  <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-right">Terbayar</th>
                  <th className="py-3.5 px-4 text-right">Sisa</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                      Tidak ada data invoice yang sesuai kriteria filter.
                    </td>
                  </tr>
                ) : (
                  rows.map((inv, idx) => {
                    const rowNumber = (currentPage - 1) * perPage + idx + 1;
                    const totalVal = Number(inv.total) || 0;
                    const stNorm = normalizeFinanceStatus(inv.status);
                    
                    let terbayarVal = 0;
                    let sisaVal = totalVal;

                    if (stNorm === "Paid") {
                      terbayarVal = totalVal;
                      sisaVal = 0;
                    } else if (stNorm === "Partially Paid") {
                      terbayarVal = inv.terbayar != null ? Number(inv.terbayar) : Math.round(totalVal * 0.5);
                      sisaVal = Math.max(0, totalVal - terbayarVal);
                    } else {
                      terbayarVal = inv.terbayar != null ? Number(inv.terbayar) : 0;
                      sisaVal = Math.max(0, totalVal - terbayarVal);
                    }

                    return (
                      <tr 
                        key={inv.id || idx}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">{rowNumber}</td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setViewItem(inv)}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline tracking-wide font-mono text-xs"
                          >
                            {inv.id}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{inv.tanggal}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{inv.customer}</td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {inv.program || inv.keterangan || "Kelas Intensif Offline"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {formatRp(totalVal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                          {formatRp(terbayarVal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold">
                          <span className={sisaVal > 0 ? "text-rose-600" : "text-slate-400"}>
                            {formatRp(sisaVal)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {stNorm === "Paid" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Paid
                            </span>
                          )}
                          {stNorm === "Partially Paid" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              Partially Paid
                            </span>
                          )}
                          {stNorm === "Unpaid" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              Unpaid
                            </span>
                          )}
                          {stNorm === "Overdue" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-300">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewItem(inv)}
                              title="Lihat Detail & Preview"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(inv)}
                              title="Unduh PDF Resmi"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDelItem(inv)}
                              title="Hapus Invoice"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── TABLE FOOTER & PAGINATION ── */}
          <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div>
              Menampilkan {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} dari {filtered.length} data
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={\`w-8 h-8 rounded-lg font-bold text-xs transition \${
                        currentPage === pNum
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }\`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value={5}>5 / halaman</option>
                <option value={10}>10 / halaman</option>
                <option value={25}>25 / halaman</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;

const startIndex = content.indexOf('// ─── TAB 0: Daftar Invoice');
const endIndex = content.indexOf('// ─── TAB 1: Invoice Terkirim');
if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + newTabDaftarInvoice + '\n\n' + content.slice(endIndex);
  console.log('Updated TabDaftarInvoice with finance statuses');
}

// 5. Update Sidebar with Paid, Partially Paid, Unpaid, Overdue
const newSidebar = `// ─── SIDEBAR (tab 0 & 1) ──────────────────────────────────────────────────────
function Sidebar({ invoiceData = [] }) {
  const paidCount = invoiceData.filter(i => normalizeFinanceStatus(i.status) === "Paid").length;
  const partialCount = invoiceData.filter(i => normalizeFinanceStatus(i.status) === "Partially Paid").length;
  const unpaidCount = invoiceData.filter(i => normalizeFinanceStatus(i.status) === "Unpaid").length;
  const overdueCount = invoiceData.filter(i => normalizeFinanceStatus(i.status) === "Overdue").length;
  
  const total = invoiceData.length || 1;
  const pie = [
    { label: "Paid",           pct: Math.round(paidCount / total * 100),    color: "#10b981" },
    { label: "Partially Paid", pct: Math.round(partialCount / total * 100), color: "#f59e0b" },
    { label: "Unpaid",         pct: Math.round(unpaidCount / total * 100),  color: "#ef4444" },
    { label: "Overdue",        pct: Math.round(overdueCount / total * 100), color: "#991b1b" },
  ];
  const donutGradient = (() => {
    let parts = [], cum = 0;
    pie.forEach(p => { 
      if (p.pct > 0) {
        parts.push(\`\${p.color} \${cum}% \${cum + p.pct}%\`); 
        cum += p.pct; 
      }
    });
    return parts.length > 0 ? \`conic-gradient(\${parts.join(", ")})\` : 'conic-gradient(#e2e8f0 0% 100%)';
  })();
  
  // Top customers
  const topCustomer = (() => {
    const custs = {};
    invoiceData.forEach(i => {
      if (!custs[i.customer]) custs[i.customer] = 0;
      custs[i.customer] += parseFloat(i.total) || 0;
    });
    return Object.entries(custs)
      .map(([nama, amount]) => ({ nama, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c, i) => ({
        ...c,
        color: i === 0 ? "text-blue-600" : i === 1 ? "text-amber-600" : i === 2 ? "text-emerald-600" : i === 3 ? "text-violet-600" : "text-rose-600"
      }));
  })();

  return (
    <div className="xl:w-72 flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-[13px] font-black text-slate-800 mb-4">Distribusi Invoice</h3>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div style={{ background: donutGradient }} className="w-24 h-24 rounded-full"/>
            <div className="absolute inset-0 flex items-center justify-center"><div className="w-16 h-16 bg-white rounded-full"/></div>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-[10px] font-bold text-slate-400">Total</span>
              <span className="text-[13px] font-black text-slate-700 leading-none">{invoiceData.length}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-[11px] w-full">
            {pie.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }}/>
                  <span className="text-slate-500 font-semibold">{p.label}</span>
                </div>
                <span className="text-slate-700 font-black">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-black text-slate-800">Top Customer</h3>
          <span className="text-[11px] font-bold text-blue-600 cursor-pointer hover:underline">Lihat Semua</span>
        </div>
        <div className="flex flex-col gap-3">
          {topCustomer.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[11px] text-slate-400 font-semibold">Belum ada data</p>
            </div>
          ) : topCustomer.map((c, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={\`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black \${i===0?'bg-blue-100 text-blue-600':i===1?'bg-amber-100 text-amber-600':i===2?'bg-emerald-100 text-emerald-600':i===3?'bg-violet-100 text-violet-600':'bg-rose-100 text-rose-600'}\`}>{i+1}</div>
                <span className="text-[11px] text-slate-600 font-semibold truncate max-w-[100px]">{c.nama}</span>
              </div>
              <span className={\`text-[11px] font-black \${c.color}\`}>{formatRp(c.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-black text-slate-800">Ringkasan Status</h3>
          <span className="text-[11px] font-bold text-blue-600 cursor-pointer hover:underline">Lihat Semua</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
           <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-emerald-50 border border-emerald-100/50">
             <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-emerald-600"/></div>
             <span className="text-[9px] font-bold text-emerald-600 text-center leading-tight">Paid</span>
             <span className="text-[13px] font-black text-slate-800 leading-none">{paidCount}</span>
           </div>
           <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-50 border border-amber-100/50">
             <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-amber-600"/></div>
             <span className="text-[9px] font-bold text-amber-600 text-center leading-tight">Partial</span>
             <span className="text-[13px] font-black text-slate-800 leading-none">{partialCount}</span>
           </div>
           <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-rose-50 border border-rose-100/50">
             <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5 text-rose-600"/></div>
             <span className="text-[9px] font-bold text-rose-600 text-center leading-tight">Unpaid</span>
             <span className="text-[13px] font-black text-slate-800 leading-none">{unpaidCount}</span>
           </div>
           <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-100/60 border border-red-200">
             <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center"><XCircle className="w-3.5 h-3.5 text-red-700"/></div>
             <span className="text-[9px] font-bold text-red-700 text-center leading-tight">Overdue</span>
             <span className="text-[13px] font-black text-slate-800 leading-none">{overdueCount}</span>
           </div>
        </div>
      </div>
    </div>
  );
}`;

const startSidebar = content.indexOf('// ─── SIDEBAR (tab 0 & 1)');
const endSidebar = content.indexOf('export default function InvoicePenagihan');
if (startSidebar !== -1 && endSidebar !== -1) {
  content = content.slice(0, startSidebar) + newSidebar + '\n\n' + content.slice(endSidebar);
  console.log('Updated Sidebar with finance statuses');
}

// 6. Update main handleDelete, fetchData, useEffect
const oldHandleDelete = `  const handleDelete = async (type, id) => {
    try {
      await axios.delete(\`/api/billing.php?type=\${type}&id=\${id}\`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };`;

const newHandleDelete = `  const handleDelete = async (type, id) => {
    // 1. Immediately delete from local state
    if (type === 'invoice') {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      
      // Remove from saved_custom_invoices
      const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      const filteredCustom = savedCustom.filter(s => s.id !== id);
      localStorage.setItem('saved_custom_invoices', JSON.stringify(filteredCustom));

      // Track in deleted_invoice_ids so default blueprint mock items never reappear
      const deletedIds = JSON.parse(localStorage.getItem('deleted_invoice_ids') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('deleted_invoice_ids', JSON.stringify(deletedIds));
      }
    } else if (type === 'terkirim') {
      setTerkirim(prev => prev.filter(t => t.id !== id));
    } else if (type === 'pembayaran') {
      setPembayaran(prev => prev.filter(p => p.id !== id && p.noInv !== id));
    } else if (type === 'siswa') {
      setSiswa(prev => prev.filter(s => s.id !== id && s.nama !== id));
    }

    // 2. Call backend DELETE
    try {
      await axios.delete(\`/api/billing.php?type=\${type}&id=\${id}\`);
    } catch (e) {
      console.warn('Backend delete fallback:', e);
    }

    // 3. Re-sync data
    fetchData();
  };`;

content = content.replace(oldHandleDelete, newHandleDelete);

// Update fetchData and useEffect to filter out deletedIds
const targetFetchData = `      if (res.data.status === 'success' && ['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(res.data.data?.[k]))) {
        const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
        const serverInvs = res.data.data.invoices || [];
        const mergedInvs = [...savedCustom.filter(s => !serverInvs.some(b => b.id === s.id)), ...serverInvs];
        setInvoices(mergedInvs.length > 0 ? mergedInvs : DEFAULT_BLUEPRINT_INVOICES);`;

const replacementFetchData = `      if (res.data.status === 'success' && ['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(res.data.data?.[k]))) {
        const deletedIds = JSON.parse(localStorage.getItem('deleted_invoice_ids') || '[]');
        const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
        const serverInvs = res.data.data.invoices || [];
        const mergedInvs = [
          ...savedCustom.filter(s => !serverInvs.some(b => b.id === s.id)),
          ...serverInvs
        ].filter(inv => !deletedIds.includes(inv.id));
        const validDefaults = DEFAULT_BLUEPRINT_INVOICES.filter(i => !deletedIds.includes(i.id));
        setInvoices(mergedInvs.length > 0 ? mergedInvs : validDefaults);`;

content = content.replace(targetFetchData, replacementFetchData);

const targetInitEffect = `      if (data.status !== 'success' || !['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(data.data?.[k]))) throw new Error('Respons billing tidak valid.');
      const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      const serverInvs = data.data.invoices || [];
      const mergedInvs = [...savedCustom.filter(s => !serverInvs.some(b => b.id === s.id)), ...serverInvs];
      setInvoices(mergedInvs.length > 0 ? mergedInvs : DEFAULT_BLUEPRINT_INVOICES);`;

const replacementInitEffect = `      if (data.status !== 'success' || !['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(data.data?.[k]))) throw new Error('Respons billing tidak valid.');
      const deletedIds = JSON.parse(localStorage.getItem('deleted_invoice_ids') || '[]');
      const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      const serverInvs = data.data.invoices || [];
      const mergedInvs = [
        ...savedCustom.filter(s => !serverInvs.some(b => b.id === s.id)),
        ...serverInvs
      ].filter(inv => !deletedIds.includes(inv.id));
      const validDefaults = DEFAULT_BLUEPRINT_INVOICES.filter(i => !deletedIds.includes(i.id));
      setInvoices(mergedInvs.length > 0 ? mergedInvs : validDefaults);`;

content = content.replace(targetInitEffect, replacementInitEffect);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully saved InvoicePenagihan.jsx');
