const fs = require('fs');
let content = fs.readFileSync('src/pages/LpkAttendance.jsx', 'utf8');

// 1. Add Helmet or document.title for SEO
if (!content.includes('document.title =')) {
  content = content.replace(
    'const pageTitle = role === "SENSEI" ? "Absensi Sensei" : role === "SISWA" ? "Absensi Siswa" : "Absensi LPK";',
    `const pageTitle = role === "SENSEI" ? "Absensi Sensei" : role === "SISWA" ? "Absensi Siswa" : "Absensi LPK";\n  useEffect(() => {\n    document.title = \`\${pageTitle} | ONE Creativa\`;\n    const metaDesc = document.querySelector('meta[name="description"]');\n    if (metaDesc) {\n      metaDesc.setAttribute("content", \`Data \${pageTitle} terintegrasi untuk LPK ONE Creativa.\`);\n    }\n  }, [pageTitle]);`
  );
}

// 2. Add htmlFor and id to inputs for a11y
content = content.replace(
  /<label className="text-\[11px\] font-bold text-slate-500 uppercase tracking-wider">Start From<\/label>\s*<input type="date"/g,
  '<label htmlFor="startDate" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Start From</label>\n                    <input id="startDate" type="date" aria-label="Start Date"'
);
content = content.replace(
  /<label className="text-\[11px\] font-bold text-slate-500 uppercase tracking-wider">End From<\/label>\s*<input type="date"/g,
  '<label htmlFor="endDate" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">End From</label>\n                    <input id="endDate" type="date" aria-label="End Date"'
);

// Search input a11y
content = content.replace(
  /<input type="text" placeholder="" value=\{tableSearch\}/g,
  '<input id="tableSearch" aria-label="Search records" type="text" placeholder="" value={tableSearch}'
);
content = content.replace(
  /Search: <\/span>\s*<div className="relative">/g,
  'Search: </label>\n                  <div className="relative">'
);
content = content.replace(
  /<span className="text-\[13px\] font-bold text-slate-600">Search:/g,
  '<label htmlFor="tableSearch" className="text-[13px] font-bold text-slate-600">Search:'
);

// Image / icon a11y (alt tags, aria-labels for buttons)
content = content.replace(
  /onClick=\{\(\) => \{ setAppliedStart\(startDate\); setAppliedEnd\(endDate\); setCurrentPage\(1\); \}\}/g,
  'onClick={() => { setAppliedStart(startDate); setAppliedEnd(endDate); setCurrentPage(1); }} aria-label="Search filter"'
);
content = content.replace(
  /onClick=\{\(\) => \{ setStartDate\(''\); setEndDate\(''\); setAppliedStart\(''\); setAppliedEnd\(''\); setTableSearch\(''\); setCurrentPage\(1\); \}\}/g,
  'onClick={() => { setStartDate(\'\'); setEndDate(\'\'); setAppliedStart(\'\'); setAppliedEnd(\'\'); setTableSearch(\'\'); setCurrentPage(1); }} aria-label="Reset filter"'
);
content = content.replace(
  /onClick=\{handleExportExcel\}/g,
  'onClick={handleExportExcel} aria-label="Export to Excel"'
);
content = content.replace(
  /onClick=\{\(\) => setCurrentPage\(p\)\}/g,
  'onClick={() => setCurrentPage(p)} aria-label={`Go to page ${p}`}'
);
content = content.replace(
  /onClick=\{\(\) => setCurrentPage\(p => Math\.max\(1, p - 1\)\)\}/g,
  'onClick={() => setCurrentPage(p => Math.max(1, p - 1))} aria-label="Previous page"'
);
content = content.replace(
  /onClick=\{\(\) => setCurrentPage\(p => Math\.min\(totalPages, p \+ 1\)\)\}/g,
  'onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} aria-label="Next page"'
);


// 3. Performance & Best Practices
// Wrap inline objects/arrays in useMemo if applicable, but for this component, table data is already nicely wrapped in useMemo.

fs.writeFileSync('src/pages/LpkAttendance.jsx', content);
