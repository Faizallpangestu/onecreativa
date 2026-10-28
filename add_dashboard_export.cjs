const fs = require('fs');

let dashboard = fs.readFileSync('src/pages/DashboardFinance.jsx', 'utf8');

// 1. Ensure xlsx-js-style is imported
if (!dashboard.includes('xlsx-js-style')) {
  dashboard = dashboard.replace(/import axios from "axios";/, 'import axios from "axios";\nimport * as XLSX from "xlsx-js-style";');
}

// 2. Add Export function
const exportFn = `
  const handleExportAll = () => {
    const workbook = XLSX.utils.book_new();

    const GREEN = "4CAF50";
    const DARK_GREEN = "388E3C";
    const WHITE = "FFFFFF";
    const LIGHT_GREY = "F5F5F5";
    const BORDER_COLOR = "BDBDBD";

    const thin = { style: "thin", color: { rgb: BORDER_COLOR } };
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };

    const createStyledSheet = (title, headersList, dataRows, colWidths) => {
      const sheetData = [
        [title],
        [\`Tanggal Export: \${new Date().toLocaleDateString("id-ID")}\`],
        [], // blank separator
        headersList,
        ...dataRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      const setStyle = (r, c, style) => {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) ws[ref] = { v: "", t: "s" };
        ws[ref].s = style;
      };

      // Title
      setStyle(0, 0, {
        font: { bold: true, sz: 14, color: { rgb: DARK_GREEN } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "E8F5E9" } },
      });
      // Subtitle
      setStyle(1, 0, {
        font: { sz: 10, color: { rgb: "616161" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "F1F8E9" } },
      });

      for (let c = 0; c < headersList.length; c++) {
        setStyle(3, c, {
          font: { bold: true, sz: 11, color: { rgb: WHITE } },
          fill: { fgColor: { rgb: GREEN } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderAll,
        });
      }

      for (let i = 0; i < dataRows.length; i++) {
        const r = 4 + i;
        const bgColor = i % 2 === 0 ? WHITE : LIGHT_GREY;
        for (let c = 0; c < headersList.length; c++) {
          setStyle(r, c, {
            font: { sz: 10 },
            fill: { fgColor: { rgb: bgColor } },
            alignment: { horizontal: c===0 ? "center" : "left", vertical: "center" },
            border: borderAll,
          });
        }
      }

      ws["!cols"] = colWidths;
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headersList.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headersList.length - 1 } },
      ];
      ws["!freeze"] = { xSplit: 0, ySplit: 4 };

      return ws;
    };

    // 1. Pemasukan
    const incomeData = allData.filter(r => r.type === "income").map((r, i) => [
      i + 1, new Date(r.transaction_date).toLocaleDateString("id-ID"), r.category || "-", r.source || "-", r.description || "-", parseFloat(r.amount || 0)
    ]);
    const wsIncome = createStyledSheet("LAPORAN TRANSAKSI PEMASUKAN", ["NO", "TANGGAL", "KATEGORI", "SUMBER", "DESKRIPSI", "NOMINAL (Rp)"], incomeData, [{wch:5}, {wch:15}, {wch:22}, {wch:22}, {wch:40}, {wch:20}]);
    XLSX.utils.book_append_sheet(workbook, wsIncome, "Pemasukan");

    // 2. Pengeluaran
    const expenseData = allData.filter(r => r.type === "expense").map((r, i) => [
      i + 1, new Date(r.transaction_date).toLocaleDateString("id-ID"), r.category || "-", r.recipient || "-", r.description || "-", parseFloat(r.amount || 0)
    ]);
    const wsExpense = createStyledSheet("LAPORAN TRANSAKSI PENGELUARAN", ["NO", "TANGGAL", "KATEGORI", "PENERIMA", "DESKRIPSI", "NOMINAL (Rp)"], expenseData, [{wch:5}, {wch:15}, {wch:22}, {wch:22}, {wch:40}, {wch:20}]);
    XLSX.utils.book_append_sheet(workbook, wsExpense, "Pengeluaran");

    // 3. Profit
    const profitData = allData.map((r, i) => [
      i + 1, new Date(r.transaction_date).toLocaleDateString("id-ID"), r.type==='income'?'Pemasukan':'Pengeluaran', r.category || "-", r.description || "-", parseFloat(r.amount || 0)
    ]);
    const wsProfit = createStyledSheet("LAPORAN LABA RUGI (PROFIT)", ["NO", "TANGGAL", "JENIS", "KATEGORI", "DESKRIPSI", "NOMINAL (Rp)"], profitData, [{wch:5}, {wch:15}, {wch:15}, {wch:22}, {wch:40}, {wch:20}]);
    XLSX.utils.book_append_sheet(workbook, wsProfit, "Laba Rugi");

    // 4. Anggaran Biaya
    let anggaranData = [];
    try {
      const saved = localStorage.getItem("anggaran_data");
      if (saved) {
        anggaranData = JSON.parse(saved).map((r, i) => [
           i + 1, new Date().toLocaleDateString("id-ID"), r.category || "-", r.description || "-", r.status || "-", parseFloat(r.total || 0)
        ]);
      }
    } catch(e) {}
    const wsAnggaran = createStyledSheet("LAPORAN ANGGARAN & BIAYA", ["NO", "TANGGAL", "KATEGORI", "DESKRIPSI", "STATUS", "NOMINAL (Rp)"], anggaranData, [{wch:5}, {wch:15}, {wch:22}, {wch:40}, {wch:15}, {wch:20}]);
    XLSX.utils.book_append_sheet(workbook, wsAnggaran, "Keuangan");

    XLSX.writeFile(workbook, \`Master_Laporan_Finance_\${new Date().getTime()}.xlsx\`);
  };
`;

// Insert before return
dashboard = dashboard.replace(/return \(\s*<Layout>/, `${exportFn}\n  return (\n    <Layout>`);

// 3. Add button in Header
const headerRegex = /<span className="text-sm font-bold text-slate-600">Periode:<\/span>\s*<select[\s\S]*?<\/select>/;
dashboard = dashboard.replace(headerRegex, (m) => {
  return `${m}\n              <button onClick={handleExportAll} className="ml-4 h-10 px-4 bg-green-600 text-white font-bold text-[13px] rounded-xl hover:bg-green-700 transition flex items-center gap-2 shadow-sm"><FileDown className="w-4 h-4"/> Export Semua Laporan (Excel)</button>`;
});

fs.writeFileSync('src/pages/DashboardFinance.jsx', dashboard);
