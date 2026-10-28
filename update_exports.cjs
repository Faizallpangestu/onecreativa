const fs = require('fs');

function styleExportSnippet(title, headers, rowMapLogic) {
  return `
    const workbook = XLSX.utils.book_new();
    const sheetData = [
      ["${title}"],
      [\`Tanggal Export: \${new Date().toLocaleDateString("id-ID")}\`],
      [], // blank separator
      ${headers},
      ...filtered.map((r, i) => ${rowMapLogic})
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

    const headersList = ${headers};
    for (let c = 0; c < headersList.length; c++) {
      setStyle(3, c, {
        font: { bold: true, sz: 11, color: { rgb: WHITE } },
        fill: { fgColor: { rgb: GREEN } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderAll,
      });
    }

    const dataLength = filtered.length;
    for (let i = 0; i < dataLength; i++) {
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

    ws["!cols"] = headersList.map(() => ({ wch: 20 }));
    ws["!cols"][0] = { wch: 5 }; // NO column

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headersList.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headersList.length - 1 } },
    ];
    ws["!freeze"] = { xSplit: 0, ySplit: 4 };

    XLSX.utils.book_append_sheet(workbook, ws, "Laporan");
    XLSX.writeFile(workbook, \`Laporan_\${new Date().getTime()}.xlsx\`);
  `;
}

// 1. TransaksiPemasukan
let pemasukan = fs.readFileSync('src/pages/TransaksiPemasukan.jsx', 'utf8');
pemasukan = pemasukan.replace(/import \* as XLSX from "xlsx";/, 'import * as XLSX from "xlsx-js-style";');
const pemasukanExportRegex = /const handleExcelExport = \(\) => \{[\s\S]*?XLSX\.writeFile\(wb, .*?\.xlsx`\);\s*\};/;
pemasukan = pemasukan.replace(
  pemasukanExportRegex, 
  `const handleExcelExport = () => { ${styleExportSnippet('LAPORAN TRANSAKSI PEMASUKAN', '["NO", "TANGGAL", "KATEGORI", "SUMBER", "DESKRIPSI", "NOMINAL (Rp)"]', `[i + 1, new Date(r.transaction_date).toLocaleDateString("id-ID"), r.category || "-", r.source || "-", r.description || "-", parseFloat(r.amount || 0)]`)} };`
);
fs.writeFileSync('src/pages/TransaksiPemasukan.jsx', pemasukan);

// 2. TransaksiPengeluaran
let pengeluaran = fs.readFileSync('src/pages/TransaksiPengeluaran.jsx', 'utf8');
pengeluaran = pengeluaran.replace(/import \* as XLSX from "xlsx";/, 'import * as XLSX from "xlsx-js-style";');
const pengeluaranExportRegex = /const handleExcelExport = \(\) => \{[\s\S]*?XLSX\.writeFile\(wb, .*?\.xlsx`\);\s*\};/;
pengeluaran = pengeluaran.replace(
  pengeluaranExportRegex, 
  `const handleExcelExport = () => { ${styleExportSnippet('LAPORAN TRANSAKSI PENGELUARAN', '["NO", "TANGGAL", "KATEGORI", "PENERIMA", "DESKRIPSI", "NOMINAL (Rp)"]', `[i + 1, new Date(r.transaction_date).toLocaleDateString("id-ID"), r.category || "-", r.recipient || "-", r.description || "-", parseFloat(r.amount || 0)]`)} };`
);
fs.writeFileSync('src/pages/TransaksiPengeluaran.jsx', pengeluaran);

// 3. AnggaranBiaya
let anggaran = fs.readFileSync('src/pages/AnggaranBiaya.jsx', 'utf8');
anggaran = anggaran.replace(/import \* as XLSX from "xlsx";/, 'import * as XLSX from "xlsx-js-style";');
const anggaranExportRegex = /const handleExcelExport = \(\) => \{[\s\S]*?XLSX\.writeFile\(wb, .*?\.xlsx`\);\s*\};/;
anggaran = anggaran.replace(
  anggaranExportRegex, 
  `const handleExcelExport = () => { ${styleExportSnippet('LAPORAN ANGGARAN & BIAYA', '["NO", "TANGGAL", "KATEGORI", "DESKRIPSI", "STATUS", "NOMINAL (Rp)"]', `[i + 1, new Date(r.date || r.transaction_date).toLocaleDateString("id-ID"), r.category || "-", r.description || "-", r.status || "-", parseFloat(r.amount || 0)]`)} };`
);
fs.writeFileSync('src/pages/AnggaranBiaya.jsx', anggaran);

console.log("Done updating exports!");
