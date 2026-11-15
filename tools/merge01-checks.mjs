import assert from 'node:assert/strict';
import fs from 'node:fs';
import Swal from 'sweetalert2';
import { buildStudentInvoice, studentScheme } from '../src/utils/studentInvoice.js';
import { officialReceiptUrl, openOfficialReceipt } from '../src/utils/paymentReceipt.js';

let checks = 0;
function check(label, run) { run(); checks++; console.log(`PASS: ${label}`); }
const page = fs.readFileSync('src/pages/InvoicePenagihan.jsx', 'utf8');
const notices = [], links = [];
const waHelper = page.slice(page.indexOf('function openInvoiceWhatsApp('), page.indexOf('export function formatRpNoDecimals('));
const openWa = new Function('Swal', 'window', `${waHelper}; return openInvoiceWhatsApp;`)(
  { fire: value => { notices.push(value); } }, { open: (...args) => { links.push(args); } });
check('WhatsApp missing official document is blocked', () => {
  openWa({ id: 'fixture' }, '08000'); assert.equal(links.length, 0); assert.equal(notices.length, 1);
});
check('WhatsApp uses saved official URL and preserves its token', () => {
  openWa({ id: 'fixture', customer: 'Synthetic', invoice_url: 'https://example.invalid/invoice?token=synthetic' }, '08000');
  const url = new URL(links[0][0]); assert.equal(url.searchParams.get('phone'), '628000');
  assert.ok(url.searchParams.get('text').includes('https://example.invalid/invoice?token=synthetic'));
  assert.equal(links[0][2], 'noopener,noreferrer');
});
check('SOURCE CONTRACT: all three WhatsApp controls use the same safe helper', () => {
  assert.equal((page.match(/openInvoiceWhatsApp\(/g) || []).length, 4);
  assert.ok(!page.includes('1832-918-428')); assert.ok(!page.includes('2x24'));
});
if (process.argv.includes('--whatsapp-only')) {
  console.log(`${checks} WhatsApp-only checks passed; window mocked, no messages sent.`); process.exit(0);
}
const base = {
  students: [{ databaseId: '17' }], banks: [{ databaseId: '3' }],
  enrollments: [{ id: 71, student_id: 17, enrollment_status: 'approved', review_reason: '' }],
  studentId: '17', enrollmentId: '71', chargeId: '81', bankId: '3', date: '2026-11-15',
};
for (const count of [1, 3, 6]) {
  const charge = { id: 81, enrollment_id: 71, label: 'Synthetic fee', amount: '6.03', scheme: count === 1 ? 'full' : 'cicilan', installment_count: count,
    installments: Array.from({ length: count }, (_, index) => ({ label: `Term ${index + 1}`, due_days: 7 + 30 * index,
      amount: count === 1 ? '6.03' : count === 3 ? '2.01' : index === 5 ? '1.03' : '1.00' })) };
  const payload = buildStudentInvoice({ ...base, charges: [charge] });
  check(`${count}-term official payload preserves decimal total and authoritative identity`, () => {
    assert.equal(payload.total, '6.03'); assert.equal(payload.installment_count, count);
    assert.equal(payload.installments.length, count); assert.equal(payload.student_id, 17);
    assert.equal(payload.status, 'Unpaid'); assert.equal(payload.id, undefined);
  });
  check(`${count}-term count mismatch rejected`, () => assert.throws(() => buildStudentInvoice({ ...base, charges: [{ ...charge, installment_count: 99 }] }), /Jumlah termin/));
  check(`${count}-term forged enrollment owner rejected`, () => assert.throws(() => buildStudentInvoice({ ...base, charges: [charge], enrollments: [{ ...base.enrollments[0], student_id: 18 }] }), /milik siswa/));
}
check('3/6-term aliases retain the conceptual cicilan scheme', () => {
  for (const value of ['Cicilan 3 Termin', 'Angsuran 6 Termin', 'DP']) assert.equal(studentScheme(value), 'cicilan');
});
const rows = [
  { id: 42, noInv: 'fixture-invoice', statusVerif: 'Verified', receipt_number: 'RCT-fixture-42', jumlah: '2.01', tglBayar: '2026-11-15' },
  { id: 43, noInv: 'fixture-invoice', statusVerif: 'Verified', receipt_number: 'RCT-fixture-43', jumlah: '4.02', tglBayar: '2026-12-15' },
];
let opened, dialog;
globalThis.window = { open: url => { opened = url; } };
Swal.fire = async options => { dialog = options; return { isConfirmed: true, value: '43' }; };
await openOfficialReceipt([rows[0]], 'fixture-invoice');
check('One verified payment opens its exact server PDF', () => assert.equal(opened, '/api/billing.php?view=receipt_pdf&payment_id=42'));
await openOfficialReceipt(rows, 'fixture-invoice');
check('Multiple receipts require exact selection with number/date/amount', () => {
  assert.equal(dialog.input, 'select'); assert.match(dialog.inputOptions['43'], /RCT-fixture-43.*2026-12-15.*4.02/);
  assert.equal(opened, '/api/billing.php?view=receipt_pdf&payment_id=43');
});
check('Unverified payment never produces an official receipt URL', () => assert.equal(officialReceiptUrl({ id: 44, statusVerif: 'Pending' }), null));
opened = null; await openOfficialReceipt(rows, 'different-invoice');
check('Another invoice cannot supply an official receipt', () => assert.equal(opened, null));
const wizard = fs.readFileSync('src/components/BuatInvoiceWizardModal.jsx', 'utf8');
check('SOURCE CONTRACT: official receipt and payment Verify wiring retained', () => {
  const actions = fs.readFileSync('src/components/PaymentReceiptActions.jsx', 'utf8');
  assert.ok(page.includes('openOfficialReceipt(')); assert.ok(page.includes('<PaymentReceiptActions '));
  assert.ok(actions.includes("action:'verify_payment'")); assert.ok(actions.includes('payment_id:payment.id'));
  assert.ok(!page.includes('generateReceiptPDF')); assert.ok(!page.includes('previewReceiptPDF'));
});
check('SOURCE CONTRACT: no removed invoice controls or unconditional six-term renderer', () => {
  assert.ok(!page.includes('Kelas Mulai')); assert.ok(!wizard.includes('Kelas Mulai'));
  assert.ok(!/>\s*Qty\s*</.test(wizard)); assert.ok(!wizard.includes('Pilih Program'));
  assert.ok(!page.includes('computeOfficialCicilanDates'));
});
console.log(`${checks} focused checks passed; dialogs/window mocked, no browser or network.`);
