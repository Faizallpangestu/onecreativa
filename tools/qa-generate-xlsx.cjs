const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('xlsx');

const root = path.resolve(__dirname, '..');
const qaDir = path.join(root, 'docs', 'QA_FORM');
const formFiles = fs.readdirSync(qaDir)
  .filter((name) => /^QA_SERAH_TERIMA_\d{4}-\d{2}-\d{2}_.+\.md$/.test(name))
  .sort();
if (formFiles.length === 0) throw new Error('No filled QA handover form found in docs/QA_FORM');

const formPath = path.join(qaDir, formFiles[formFiles.length - 1]);
const formText = fs.readFileSync(formPath, 'utf8');
const matrixText = formText;

function parseTables(text) {
  const tables = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('|')) {
      const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
      if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
      if (!current) {
        current = [];
        tables.push(current);
      }
      current.push(cells);
    } else if (current && line !== '') {
      current = null;
    }
  }
  return tables;
}

function tablesBySection(text) {
  const result = {};
  let section = null;
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const heading = raw.match(/^##\s+([A-F])\.\s*(.*)$/);
    if (heading) {
      section = heading[1];
      result[section] = [];
      current = null;
    } else if (section && raw.trim().startsWith('|')) {
      const cells = raw.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
      if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
      if (!current) {
        current = [];
        result[section].push(current);
      }
      current.push(cells);
    } else if (section && raw.trim() !== '') {
      current = null;
    }
  }
  return result;
}

function addSheet(book, name, rows, widths) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  if (widths) sheet['!cols'] = widths.map((width) => ({ wch: width }));
  XLSX.utils.book_append_sheet(book, sheet, name);
}

const sections = tablesBySection(formText);
const caseTables = parseTables(matrixText);
const caseTable = caseTables.find((table) => table[0] && table[0].includes('ID') && table[0].some((cell) => cell.includes('Skenario')));
if (!caseTable) throw new Error('Case table not found in TEST_CASE_MATRIX.md');
for (const key of ['A', 'B', 'C', 'E', 'F']) {
  if (!sections[key] || sections[key].length === 0) throw new Error('Missing tables in section ' + key);
}

const identity = sections.A[0];
const rekap = sections.A[1] || [];
const gate = identity.find((row) => row[0] === 'Keputusan gate')?.[1] || 'Unknown';
const ringkasan = [['Field', 'Isi']];
identity.slice(1).forEach((row) => ringkasan.push(row));
ringkasan.push(['Gate (dari form)', gate]);
rekap.slice(1).forEach((row) => ringkasan.push(['Rekap - ' + row[0], row[1]]));

const book = XLSX.utils.book_new();
addSheet(book, 'Ringkasan', ringkasan, [28, 70]);
addSheet(book, 'Gate Otomatis', sections.B[0], [12, 22, 34, 28, 44, 12, 44, 12]);
addSheet(book, 'Matriks Kasus', caseTable, [10, 14, 52, 24, 46, 26, 34, 12, 16]);
addSheet(book, 'UAT Persona', sections.B[2], [24, 28, 42, 12, 44, 16]);
addSheet(book, 'Defect', sections.C[0], [12, 18, 20, 60, 14, 20, 20, 12]);
if (sections.C[1]) addSheet(book, 'Defect Selesai', sections.C[1], [12, 18, 20, 60, 14, 28]);
if (sections.C[2]) addSheet(book, 'Gate Keputusan', sections.C[2], [70, 12]);
addSheet(book, 'Bukti', sections.E[0], [36, 70]);
addSheet(book, 'Persetujuan', sections.F[0], [24, 24, 24, 16]);

const decision = formText.match(/Keputusan penerima:\s*(.+)/)?.[1] || '';
const note = formText.match(/Catatan penerima:\s*(.+)/)?.[1] || '';
addSheet(book, 'Catatan Penerima', [['Field', 'Isi'], ['Keputusan', decision], ['Catatan', note]], [20, 100]);
addSheet(book, 'Form Markdown', formText.split(/\r?\n/).map((line) => [line]), [140]);

const outPath = path.join(qaDir, formFiles[formFiles.length - 1].replace(/\.md$/, '.xlsx'));
XLSX.writeFile(book, outPath);
console.log('Wrote ' + path.relative(root, outPath));
console.log('Sheets: ' + book.SheetNames.join(', '));
console.log('Case rows: ' + (caseTable.length - 1) + '; gate: ' + gate);
