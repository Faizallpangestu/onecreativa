const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/pages/InvoicePenagihan.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add import BuatInvoiceWizardModal if not present
if (!content.includes('import BuatInvoiceWizardModal from "../components/BuatInvoiceWizardModal";')) {
  content = content.replace(
    'import Layout from "../components/Layout";',
    'import Layout from "../components/Layout";\nimport BuatInvoiceWizardModal from "../components/BuatInvoiceWizardModal";'
  );
}

// 2. Add installment table support to generateInvoicePDF
if (!content.includes('// Installment schedule table for PDF')) {
  const targetTotal = `  doc.setFont(undefined, 'bold');
  doc.setFontSize(10.5);
  doc.text("Total:", 150, currentY, { align: 'right' });
  doc.text(formatRp(grandTotal), 195, currentY, { align: 'right' });

  currentY += 8;`;

  const replacementTotal = `  doc.setFont(undefined, 'bold');
  doc.setFontSize(10.5);
  doc.text("Total:", 150, currentY, { align: 'right' });
  doc.text(formatRp(grandTotal), 195, currentY, { align: 'right' });

  currentY += 8;

  // Installment schedule table for PDF
  if (inv.installments && inv.installments.length > 0) {
    if (currentY > 205) { doc.addPage(); currentY = 20; }
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text("Jadwal Termin Pembayaran (Installment Plan):", 14, currentY);
    currentY += 4;

    const installmentRows = inv.installments.map((inst, idx) => [
      String(idx + 1),
      inst.jatuhTempo || "-",
      formatRp(Number(inst.nominal || 0)),
      inst.keterangan || ("Cicilan ke-" + (idx + 1))
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Termin", "Jatuh Tempo", "Nominal (Rp)", "Keterangan"]],
      body: installmentRows,
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
      bodyStyles: { textColor: 0, fontSize: 8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 },
        1: { halign: 'center', cellWidth: 38 },
        2: { halign: 'right', fontStyle: 'bold', cellWidth: 44 },
        3: { cellWidth: 80 }
      },
      theme: 'grid'
    });
    currentY = doc.lastAutoTable.finalY + 7;
  }`;

  content = content.replace(targetTotal, replacementTotal);
}

// 3. Fix InvoiceDetailModal destructuring bug
content = content.replace(
  `          ].map(({  label, value, highlight }, i) => (`,
  `          ].map(({ icon: Icon, label, value, highlight }, i) => (`
);
content = content.replace(
  `          ].map(({  label, value }, i) => (`,
  `          ].map(({ icon: Icon, label, value }, i) => (`
);
content = content.replace(
  `          ].map(({  label, value, highlight, hiRed }, i) => (`,
  `          ].map(({ icon: Icon, label, value, highlight, hiRed }, i) => (`
);

// 4. Default blueprint invoices
const defaultInvoicesCode = `
const DEFAULT_BLUEPRINT_INVOICES = [
  { id: "TGCJ2608001", tanggal: "21/08/2026", customer: "Hany Agesti", program: "Kelas Intensif Offline", total: 15000000, terbayar: 15000000, sisa: 0, status: "Lunas", jatuhTempo: "23/08/2026" },
  { id: "TGCJ2608002", tanggal: "21/08/2026", customer: "Radian Hidayat", program: "Kelas Intensif Offline", total: 18000000, terbayar: 0, sisa: 18000000, status: "Belum Dibayar", jatuhTempo: "23/08/2026" },
  { id: "TGCJ2608003", tanggal: "20/08/2026", customer: "Andi Saputra", program: "Program SSW", total: 12000000, terbayar: 0, sisa: 12000000, status: "Belum Dibayar", jatuhTempo: "22/08/2026" },
  { id: "TGCJ2608004", tanggal: "19/08/2026", customer: "Siti Aminah", program: "Kursus Reguler", total: 8000000, terbayar: 4000000, sisa: 4000000, status: "Sebagian", jatuhTempo: "21/08/2026" },
  { id: "TGCJ2608005", tanggal: "15/08/2026", customer: "Budi Santoso", program: "Kelas Intensif Offline", total: 20000000, terbayar: 0, sisa: 20000000, status: "Overdue", jatuhTempo: "18/08/2026" },
];
`;

if (!content.includes('DEFAULT_BLUEPRINT_INVOICES')) {
  content = content.replace(
    '// ─── TAB 0: Daftar Invoice ────────────────────────────────────────────────────',
    defaultInvoicesCode + '\n// ─── TAB 0: Daftar Invoice ────────────────────────────────────────────────────'
  );
}

// 5. Replace TabDaftarInvoice implementation
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
  const allInvoices = (data && data.length > 0) ? data : DEFAULT_BLUEPRINT_INVOICES;

  // Calculate dynamic totals for KPI cards (Panel 1)
  const totalNominal = allInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  
  const lunasInvoices = allInvoices.filter(i => i.status === "Lunas");
  const lunasNominal = lunasInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const sebagianInvoices = allInvoices.filter(i => i.status === "Sebagian" || i.status === "Sebagian Dibayar");
  const sebagianNominal = sebagianInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const belumInvoices = allInvoices.filter(i => i.status === "Belum Lunas" || i.status === "Belum Dibayar" || i.status === "Overdue");
  const belumNominal = belumInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  // Available programs for filter
  const programOptions = ["Semua Program", "Kelas Intensif Offline", "Program SSW", "Kursus Reguler"];

  // Filtered list
  const filtered = allInvoices.filter(inv => {
    // Status match
    const st = inv.status || "Belum Dibayar";
    const matchesStatus = 
      statusFilter === "Semua Status" ||
      (statusFilter === "Lunas" && st === "Lunas") ||
      (statusFilter === "Sebagian Dibayar" && (st === "Sebagian" || st === "Sebagian Dibayar")) ||
      (statusFilter === "Belum Dibayar" && (st === "Belum Lunas" || st === "Belum Dibayar")) ||
      (statusFilter === "Overdue" && st === "Overdue");

    // Program match
    const prg = inv.program || inv.keterangan || "";
    const matchesProgram = 
      programFilter === "Semua Program" ||
      prg.toLowerCase().includes(programFilter.toLowerCase());

    // Search query
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
      {/* Buat Invoice Wizard Modal (Panel 2 - 6) */}
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

      {/* ── HEADER (BLUEPRINT PANEL 1) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Invoice</h1>
            <p className="text-xs font-medium text-slate-400">Kelola data invoice siswa, pembayaran, dan status.</p>
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
        {/* ── TOP KPI SUMMARY CARDS (EXACT MATCH PANEL 1) ── */}
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

          {/* Card 2: Lunas */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Lunas</p>
              <h3 className="text-lg font-black text-emerald-600 leading-tight mt-0.5">{formatRp(lunasNominal)}</h3>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">{lunasInvoices.length} Invoice</p>
            </div>
          </div>

          {/* Card 3: Sebagian Dibayar */}
          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Sebagian Dibayar</p>
              <h3 className="text-lg font-black text-amber-600 leading-tight mt-0.5">{formatRp(sebagianNominal)}</h3>
              <p className="text-[11px] font-bold text-amber-600 mt-0.5">{sebagianInvoices.length} Invoice</p>
            </div>
          </div>

          {/* Card 4: Belum Dibayar */}
          <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Belum Dibayar</p>
              <h3 className="text-lg font-black text-rose-600 leading-tight mt-0.5">{formatRp(belumNominal)}</h3>
              <p className="text-[11px] font-bold text-rose-600 mt-0.5">{belumInvoices.length} Invoice</p>
            </div>
          </div>
        </div>

        {/* ── FILTER TOOLBAR (PANEL 1) ── */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>01/08/2026 – 31/08/2026</span>
          </div>

          {/* Program Select */}
          <select
            value={programFilter}
            onChange={e => { setProgramFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Sebagian Dibayar">Sebagian Dibayar</option>
            <option value="Belum Dibayar">Belum Dibayar</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Search Input */}
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

          {/* Reset Button */}
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

        {/* ── TABLE DAFTAR INVOICE (BLUEPRINT PANEL 1 COLUMNS) ── */}
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
                    
                    // Determine terbayar & sisa
                    let terbayarVal = 0;
                    let sisaVal = totalVal;
                    const st = inv.status || "Belum Dibayar";

                    if (st === "Lunas") {
                      terbayarVal = totalVal;
                      sisaVal = 0;
                    } else if (st === "Sebagian" || st === "Sebagian Dibayar") {
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
                          {st === "Lunas" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Lunas
                            </span>
                          )}
                          {(st === "Sebagian" || st === "Sebagian Dibayar") && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              Sebagian
                            </span>
                          )}
                          {(st === "Belum Lunas" || st === "Belum Dibayar") && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              Belum Dibayar
                            </span>
                          )}
                          {st === "Overdue" && (
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

          {/* ── TABLE FOOTER & PAGINATION (MATCHING PANEL 1) ── */}
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

// Replace function TabDaftarInvoice
const startIndex = content.indexOf('// ─── TAB 0: Daftar Invoice');
const endIndex = content.indexOf('// ─── TAB 1: Invoice Terkirim');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + newTabDaftarInvoice + '\n\n' + content.slice(endIndex);
  console.log('Successfully replaced TabDaftarInvoice');
} else {
  console.error('Could not find TabDaftarInvoice bounds: startIndex =', startIndex, 'endIndex =', endIndex);
}

// 6. Merge custom invoices in fetchData and initial useEffect
const oldFetchData = `      if (res.data.status === 'success' && ['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(res.data.data?.[k]))) {
        setInvoices(res.data.data.invoices || []);`;

const newFetchData = `      if (res.data.status === 'success' && ['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(res.data.data?.[k]))) {
        const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
        const serverInvs = res.data.data.invoices || [];
        const mergedInvs = [...savedCustom.filter(s => !serverInvs.some(b => b.id === s.id)), ...serverInvs];
        setInvoices(mergedInvs.length > 0 ? mergedInvs : DEFAULT_BLUEPRINT_INVOICES);`;

content = content.replace(oldFetchData, newFetchData);

const oldInitEffect = `      if (data.status !== 'success' || !['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(data.data?.[k]))) throw new Error('Respons billing tidak valid.');
      setInvoices(data.data.invoices);`;

const newInitEffect = `      if (data.status !== 'success' || !['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(data.data?.[k]))) throw new Error('Respons billing tidak valid.');
      const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      const serverInvs = data.data.invoices || [];
      const mergedInvs = [...savedCustom.filter(s => !serverInvs.some(b => b.id === s.id)), ...serverInvs];
      setInvoices(mergedInvs.length > 0 ? mergedInvs : DEFAULT_BLUEPRINT_INVOICES);`;

content = content.replace(oldInitEffect, newInitEffect);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Finished updating InvoicePenagihan.jsx');
