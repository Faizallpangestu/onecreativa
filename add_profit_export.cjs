const fs = require('fs');
let profit = fs.readFileSync('src/pages/Profit.jsx', 'utf8');

// 1. Add FileDown to lucide-react imports if not there
if (!profit.includes('FileDown')) {
  profit = profit.replace(/import \{.*?\} from "lucide-react";/, (m) => m.replace('}', ', FileDown }'));
}

// 2. Add xlsx-js-style import
if (!profit.includes('xlsx-js-style')) {
  profit = profit.replace(/import axios from "axios";/, 'import axios from "axios";\nimport * as XLSX from "xlsx-js-style";');
}

// 3. Add handleExcelExport inside Profit component, right before return
const exportFn = `
  const handleExcelExport = () => {
    const workbook = XLSX.utils.book_new();
    const sheetData = [
      ["LAPORAN LABA RUGI (PROFIT)"],
      [\`Tanggal Export: \${new Date().toLocaleDateString("id-ID")}\`],
      [], // blank separator
      ["NO", "TANGGAL", "JENIS", "KATEGORI", "DESKRIPSI", "NOMINAL (Rp)"],
      ...filteredRecords.map((r, i) => [
        i + 1,
        new Date(r.transaction_date).toLocaleDateString("id-ID"),
        r.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        r.category || "-",
        r.description || "-",
        parseFloat(r.amount || 0)
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    const GREEN = "4CAF50";
    const DARK_GREEN = "388E3C";
    const WHITE = "FFFFFF";
    const LIGHT_GREY = "F5F5F5";
    const BORDER_COLOR = "BDBDBD";

    const thin = { style: "thin", color: { rgb: BORDER_COLOR } };
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };

    const setStyle = (r, c, style) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = style;
    };

    setStyle(0, 0, {
      font: { bold: true, sz: 14, color: { rgb: DARK_GREEN } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "E8F5E9" } },
    });
    setStyle(1, 0, {
      font: { sz: 10, color: { rgb: "616161" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "F1F8E9" } },
    });

    const headersList = ["NO", "TANGGAL", "JENIS", "KATEGORI", "DESKRIPSI", "NOMINAL (Rp)"];
    for (let c = 0; c < headersList.length; c++) {
      setStyle(3, c, {
        font: { bold: true, sz: 11, color: { rgb: WHITE } },
        fill: { fgColor: { rgb: GREEN } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderAll,
      });
    }

    for (let i = 0; i < filteredRecords.length; i++) {
      const r = 4 + i;
      const bgColor = i % 2 === 0 ? WHITE : LIGHT_GREY;
      for (let c = 0; c < headersList.length; c++) {
        setStyle(r, c, {
          font: { sz: 10 },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: "left", vertical: "center" },
          border: borderAll,
        });
      }
    }

    ws["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 40 }, { wch: 20 }];
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headersList.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headersList.length - 1 } },
    ];
    ws["!freeze"] = { xSplit: 0, ySplit: 4 };

    XLSX.utils.book_append_sheet(workbook, ws, "Laporan Profit");
    XLSX.writeFile(workbook, \`Laporan_Profit_\${new Date().getTime()}.xlsx\`);
  };
`;
profit = profit.replace(/return \(\s*<Layout>/, `${exportFn}\n  return (\n    <Layout>`);

// 4. Add the button to the UI (near search input in the list section)
const searchInputRegex = /<div className="relative w-full max-w-xs">[\s\S]*?<\/div>/;
profit = profit.replace(searchInputRegex, (m) => {
  return `${m}\n                <button onClick={handleExcelExport} className="h-10 px-4 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition flex items-center gap-2"><FileDown className="w-4 h-4"/> Export Excel</button>`;
});

fs.writeFileSync('src/pages/Profit.jsx', profit);
