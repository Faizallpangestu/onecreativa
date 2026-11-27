const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const qaDir = path.join(root, 'docs', 'QA_FORM');
const formFile = fs.readdirSync(qaDir)
  .filter((name) => /^QA_SERAH_TERIMA_\d{4}-\d{2}-\d{2}_.+\.md$/.test(name))
  .sort()
  .pop();
if (!formFile) throw new Error('No filled QA handover form found');

const formPath = path.join(qaDir, formFile);
let text = fs.readFileSync(formPath, 'utf8');

const committed = execFileSync('git', ['show', 'HEAD:docs/QA_FORM/' + formFile], { cwd: root, encoding: 'utf8' });
const gateLines = new Map(
  committed.split(/\r?\n/)
    .filter((line) => /^\| GATE-\d{2} \|/.test(line))
    .map((line) => [line.match(/GATE-\d{2}/)[0], line])
);
text = text.split(/\r?\n/).map((line) => {
  if (!/^\| GATE-\d{2} \|/.test(line)) return line;
  const id = line.match(/GATE-\d{2}/)[0];
  if (id === 'GATE-14') return line;
  return gateLines.get(id) || line;
}).join('\n');

const E_HTTP = 'GATE-06 browser-verification-2026-11-27.json';
const E_BROWSER = 'GATE-07 browser-verification-2026-11-27.json';
const E_ACCESS = 'GATE-08 access-rights-verification.json';
const E_EMP = 'GATE-09 employee-ui-test.mjs';
const E_STU = 'GATE-10 student-invoice-browser-test.mjs';
const E_BUILD = 'GATE-03 build-gates.json (DEF-002)';
const E_UAT = 'uat-blocked.json: staging/akun QA belum tersedia';
const TESTER = 'OpenCode QA / 2026-11-27';

const localPass = {
  'HRD-01': [E_BROWSER + '; ' + E_ACCESS, 'sebagian: daftar karyawan tampil'],
  'HRD-04': [E_ACCESS, 'role spoof ditolak server'],
  'HRD-05': [E_ACCESS, 'session nonaktif/terhapus ditolak'],
  'HRD-06': [E_HTTP, 'privasi gaji Finance'],
  'HRD-07': [E_HTTP, 'upload foto & MIME'],
  'HRD-10': [E_HTTP + '; ' + E_ACCESS, 'spoof/self-approval ditolak'],
  'HRD-11': [E_HTTP, 'approval lembur'],
  'FIN-11': [E_HTTP, 'invoice desimal/retry/conflict; status paid ditolak'],
  'FIN-15': [E_HTTP + '; ' + E_BROWSER, 'owner scope & bukti pending'],
  'FIN-16': [E_HTTP, 'retry idempoten & conflict'],
  'FIN-18': [E_HTTP, 'retry/conflict/akses privat'],
  'LMS-02': [E_HTTP + '; ' + E_BROWSER, 'roster kelas sendiri'],
  'LMS-03': [E_HTTP, 'Sensei tanpa kelas ditolak'],
  'LMS-04': [E_BROWSER, 'tugas diterbitkan lewat UI'],
  'LMS-05': [E_HTTP + '; ' + E_BROWSER, 'QR token/check-in; kamera fisik belum'],
  'LMS-07': [E_HTTP + '; ' + E_BROWSER, 'submission lewat API'],
  'LMS-08': [E_HTTP + '; ' + E_BROWSER, 'draft tersembunyi, publish nol'],
  'LMS-15': [E_HTTP, 'identitas server & foreign denied'],
  'LMS-17': [E_BROWSER + '; ' + E_HTTP, 'tagihan own scope'],
  'MCH-01': [E_HTTP, 'akses role & dokumen privat'],
  'MCH-02': [E_HTTP, 'upload/verifikasi dokumen kandidat'],
  'SEC-01': [E_HTTP + '; ' + E_ACCESS, '401/403/CSRF/session'],
  'SEC-02': [E_ACCESS + '; ' + E_HTTP, 'role spoof ditolak'],
  'SEC-03': [E_HTTP, 'tanpa hash SQL; request ID; no-store'],
  'MOB-01': [E_BROWSER, 'viewport mobile tidak overflow'],
  'MOB-02': [E_STU, 'network/conflict/offline ditangani'],
  'EMP-UI': [E_EMP, 'state/role/error checks'],
};

const localFail = {
  'REL-01': [E_BUILD, 'artifact check gagal karena config/db_env.php ikut paket'],
};

const counts = { pass: 0, fail: 0, blocked: 0, notRun: 0 };
const lines = text.split(/\r?\n/);
const filled = lines.map((line) => {
  const match = line.match(/^\|\s*((?:HRD|GA|FIN|LMS|MCH|RPA|REL|SEC|MOB)-\d{2})\s*\|/);
  if (!match) return line;
  const id = match[1];
  const cells = line.split('|');
  if (cells.length < 10) return line;
  let status = 'Blocked';
  let bukti = E_UAT;
  let catatan = 'UAT staging belum tersedia';
  if (localPass[id]) {
    status = 'Pass (lokal)';
    bukti = localPass[id][0];
    catatan = localPass[id][1];
  } else if (localFail[id]) {
    status = 'Fail';
    bukti = localFail[id][0];
    catatan = localFail[id][1];
  }
  if (catatan) bukti += '; ' + catatan;
  cells[7] = ' ' + bukti + ' ';
  cells[8] = ' ' + status + ' ';
  cells[9] = ' ' + TESTER + ' ';
  counts[status === 'Pass (lokal)' ? 'pass' : status === 'Fail' ? 'fail' : status === 'Blocked' ? 'blocked' : 'notRun'] += 1;
  return cells.join('|');
});
text = filled.join('\n');

text = text.replace(
  /\| Case matriks Pass \/ Fail \/ Blocked \/ Not Run \|[^\n]*\|/,
  `| Case matriks Pass / Fail / Blocked / Not Run | ${counts.pass} / ${counts.fail} / ${counts.blocked} / ${counts.notRun} |`
);
text = text.replace(
  /- Semua 72 case fungsional: Not Run karena tidak ada staging\/akun QA\./,
  `- Case fungsional: ${counts.pass} Pass (lokal), ${counts.fail} Fail, ${counts.blocked} Blocked, ${counts.notRun} Not Run. UAT persona di staging belum tersedia.`
);

fs.writeFileSync(formPath, text);
console.log('Form:', formFile);
console.log('Counts:', JSON.stringify(counts));
