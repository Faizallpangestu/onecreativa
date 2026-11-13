import assert from 'node:assert/strict';
import { databaseId, invoiceDecimal, formatInvoiceMoney, studentScheme, chargeSchedule, invoiceLookups, loadInvoiceLookups, buildStudentInvoice, submitStudentInvoice, serverDeliveryRows, serverPaymentRows } from '../src/utils/studentInvoice.js';
import paymentSchemes from '../backend/config/payment_schemes.json' with { type: 'json' };

let checks = 0;
async function test(name, run) { await run(); checks++; console.log(`PASS: ${name}`); }
const source = {
  status: 'success', permissions: { prepare: true }, data: {
    students: [
      { id: 17, nis: 'NIS-901', web_id: 999, name: 'Nama Sama', email: '', no_wa: '', program: 'Program Database', total_biaya: '15000000.01', metode_pembayaran: 'Full Payment' },
      { id: 18, nis: 'NIS-902', web_id: 998, name: 'Nama Sama', email: '', no_wa: '', total_biaya: '18000000.00', metode_pembayaran: 'Cicilan' },
      { id: 'SIS-LOCAL', name: 'Lokal', total_biaya: '1.00' },
    ],
    enrollment_schema_ready: true,
    enrollments: [
      { id: 71, student_id: 17, program: 'Program Database', cohort: '2026-A', enrollment_status: 'approved', review_reason: '' },
      { id: 72, student_id: 18, program: 'Program Cicilan', cohort: '2026-B', enrollment_status: 'approved', review_reason: '' },
      { id: 73, student_id: 17, program: 'Program Kedua', cohort: '2027-C', enrollment_status: 'approved', review_reason: '' },
    ],
    charges: [
      { id: 81, enrollment_id: 71, charge_type: 'program_fee', charge_key: 'tuition', label: 'Program fee', amount: '15000000.01', scheme: 'full', installments: [{ label: 'Full Payment', amount: '15000000.01', due_days: 7 }] },
      { id: 82, enrollment_id: 72, charge_type: 'program_fee', charge_key: 'tuition', label: 'Program fee', amount: '18000000.00', scheme: 'cicilan', installments: [{ label: 'DP', amount: '5000000.01', due_days: 7 }, { label: 'Pelunasan', amount: '12999999.99', due_days: 37 }] },
      { id: 83, enrollment_id: 73, charge_type: 'program_fee', charge_key: 'tuition', label: 'Program kedua', amount: '500.01', scheme: 'full', installments: [{ label: 'Full Payment', amount: '500.01', due_days: 7 }] },
      { id: 84, enrollment_id: 71, charge_type: 'registration_fee', charge_key: 'initial', label: 'Registration fee', amount: '100.25', scheme: 'full', installments: [{ label: 'Biaya pendaftaran', amount: '100.25', due_days: 7 }] },
    ],
    accounts: [{ id: 45, is_active: '1', report_class: 'cash', code: '1120' }, { id: 46, is_active: '0', report_class: 'cash' }, { id: 47, is_active: '1', report_class: 'receivable' }],
    banks: [
      { id: 3, account_id: 45, code: '1120', is_active: '1', name: 'Label rekening', bank_name: 'Bank Uji', account_number: '000123', account_holder: 'Pemilik Terverifikasi' },
      { id: 4, account_id: 45, is_active: 0, bank_name: 'Bank Uji', account_number: '999', account_holder: 'Nonaktif' },
      { id: 5, account_id: 46, is_active: 1, bank_name: 'Bank Uji', account_number: '999', account_holder: 'COA nonaktif' },
      { id: 6, account_id: 47, is_active: 1, bank_name: 'Bank Uji', account_number: '999', account_holder: 'COA nonkas' },
      { id: 7, account_id: 45, is_active: 1, bank_name: 'Bank Uji', account_number: '999', name: 'Bukan pemilik terverifikasi' },
    ],
  },
};
const lookups = invoiceLookups(source);
const input = { ...lookups, studentId: '17', enrollmentId: '71', chargeId: '81', bankId: '3', date: '2026-11-13' };
const payload = buildStudentInvoice(input);
const fail = (status, message) => Object.assign(new Error(message), { response: { status, data: { status: 'error', message, request_id: 'qa-request' } } });
const invoice = { id: 'TGCJ26110001', student_id: 17, enrollment_id: 71, charge_id: 81, status: 'Unpaid' };
const billing = invoice => ({ data: { status: 'success', data: { invoice } } });
const issued = { data: { status: 'success', data: { ...invoice, created_now: true } } };
await test('PHP and FE share all scheme aliases without guessing', () => {
  for (const [scheme, aliases] of Object.entries(paymentSchemes)) for (const alias of aliases) assert.equal(studentScheme(' '+alias.toUpperCase()+' '), scheme);
  for (const unknown of ['', null, 'not full', 'DP khusus 12 bulan']) assert.equal(studentScheme(unknown), '');
});
await test('Database student, enrollment, charge and bank IDs stay separate from NIS/web_id/COA', () => {
  assert.equal(payload.student_id, 17); assert.equal(payload.enrollment_id, 71); assert.equal(payload.charge_id, 81); assert.equal(payload.bank_account_id, 3);
  assert.equal(lookups.students.length, 2); assert.deepEqual(lookups.banks.map(row => row.databaseId), ['3']);
  assert.equal(lookups.students[0].email, ''); assert.equal(lookups.students[0].phone, '');
  assert.equal(payload.id, undefined);
});
await test('Invoice totals and schedule use the selected approved charge, not editable fields', () => {
  const actual = buildStudentInvoice({ ...input, id: 'FAKE', total: '1.00', discount: { amount: '999' }, status: 'Paid', installments: [] });
  assert.equal(actual.id, undefined); assert.equal(actual.total, '15000000.01'); assert.equal(actual.status, 'Unpaid'); assert.deepEqual(actual.discount, { amount: '0.00' });
  assert.equal(actual.installments[0].jatuhTempo, '2026-11-20');
});
await test('Decimal maximum and malformed/float values retain BE-01.2 protection', () => {
  assert.equal(invoiceDecimal('9999999999999.99'), '9999999999999.99'); assert.equal(invoiceDecimal('0.1'), '0.10'); assert.equal(formatInvoiceMoney('15000000.01'), 'Rp 15.000.000,01');
  for (const value of [0.1, '1e7', '-1', '1.001', '15.000,01', '1.00\n', null]) assert.throws(() => invoiceDecimal(value));
  assert.equal(databaseId('NIS-901'), ''); assert.equal(databaseId('17\n'), '');
});
await test('Local/upstream student IDs and forged or cross-student enrollments cannot publish', () => {
  for (const studentId of ['', 'SIS-LOCAL', 'NIS-901', '999']) assert.throws(() => buildStudentInvoice({ ...input, studentId }), /ID database/);
  for (const enrollmentId of ['', '999', '72']) assert.throws(() => buildStudentInvoice({ ...input, enrollmentId }), /enrollment resmi/);
  assert.throws(() => buildStudentInvoice({ ...input, chargeId: '82' }), /charge/);
});
await test('Same person can select another enrollment/program/cohort with its own price', () => {
  const second = buildStudentInvoice({ ...input, enrollmentId: '73', chargeId: '83' });
  assert.equal(second.student_id, payload.student_id); assert.equal(second.enrollment_id, 73); assert.equal(second.total, '500.01');
});
await test('Same enrollment can select a distinct approved charge type without client authorizing a fee', () => {
  const second = buildStudentInvoice({ ...input, chargeId: '84', charge_type: 'additional_fee', charge_key: 'random' });
  assert.equal(second.enrollment_id, payload.enrollment_id); assert.equal(second.total, '100.25'); assert.equal(second.charge_type, undefined); assert.equal(second.charge_key, undefined);
});
await test('Global student price/program changes never reprice an enrollment charge', () => {
  const changed = buildStudentInvoice({ ...input, students: [{ ...lookups.students[0], total_biaya: '1.00', program: 'Other', metode_pembayaran: 'Unknown' }] });
  assert.equal(changed.total, payload.total); assert.equal(changed.skema, 'full');
});
await test('Missing enrollment approval or charge policy blocks publishing clearly', () => {
  assert.throws(() => buildStudentInvoice({ ...input, enrollments: [] }), /enrollment resmi/);
  assert.throws(() => buildStudentInvoice({ ...input, enrollments: [{ ...lookups.enrollments[0], enrollment_status: 'needs_review' }] }), /review/);
  assert.throws(() => buildStudentInvoice({ ...input, charges: [] }), /diotorisasi Finance/);
});
await test('Manual student UI cannot bypass official enrollment and charge', () => assert.throws(() => buildStudentInvoice({ ...input, manual: true }), /terdaftar di database/));
await test('No client bank assertions or synthetic item pricing appear in request', () => {
  for (const key of ['id','bank_name','account_number','account_holder','coa_code','items','qty','customer','email','phone','charge_type','charge_key']) assert.equal(payload[key], undefined);
});
await test('Official bank-holder gap still blocks issue without display-name fallback', () => {
  const missing = invoiceLookups({ ...source, data: { ...source.data, banks: [source.data.banks[4]] } });
  assert.throws(() => buildStudentInvoice({ ...input, banks: missing.banks }), /Finance\/DB PIC/);
});
await test('Approved cicilan is read from server policy with exact terms and no fallback', () => {
  const plan = buildStudentInvoice({ ...input, studentId: '18', enrollmentId: '72', chargeId: '82' });
  assert.equal(plan.skema, 'cicilan'); assert.deepEqual(plan.installments.map(row => row.nominal), ['5000000.01', '12999999.99']); assert.equal(plan.installments[1].jatuhTempo, '2026-12-20');
  assert.throws(() => buildStudentInvoice({ ...input, charges: [{ ...lookups.charges[0], installments: [] }] }), /Jadwal/);
  assert.throws(() => buildStudentInvoice({ ...input, charges: [{ ...lookups.charges[0], installments: [{ label: 'Bad', amount: '1.00', due_days: 7 }] }] }), /Total termin/);
});
await test('Schedule arithmetic handles year/month boundaries and validates policy dates', () => {
  assert.equal(chargeSchedule(lookups.charges[0], '2026-12-31')[0].jatuhTempo, '2027-01-07');
  assert.throws(() => chargeSchedule(lookups.charges[0], '2026-02-30'));
  assert.throws(() => chargeSchedule({ installments: [{ due_days: -1, amount: '1.00' }] }, '2026-11-13'));
});
await test('Sync refreshes authoritative DB lookups instead of adopting upstream IDs', async () => {
  const calls = []; const api = { post: async url => { calls.push(url); return { data: { status: 'success', students: [{ id: 999999 }] } }; }, get: async url => { calls.push(url); return { data: source }; } };
  const refreshed = await loadInvoiceLookups(api, { sync: true }); assert.deepEqual(calls, ['/api/sync_students_web.php', '/api/accounting.php']); assert.equal(refreshed.students[0].databaseId, '17'); assert.equal(refreshed.enrollments.length, 3);
});
await test('Confirmed server response supplies invoice number and validates all identities', async () => {
  assert.equal((await submitStudentInvoice({ post: async () => issued }, payload)).id, invoice.id);
  await assert.rejects(submitStudentInvoice({ post: async () => ({ data: { status: 'success', data: { ...invoice, enrollment_id: 999 } } }), get: async () => billing(null) }, payload), /Konfirmasi/);
});
await test('422 mismatch preserves form error and never fabricates success', async () => {
  await assert.rejects(submitStudentInvoice({ post: async () => { throw fail(422, 'Total mismatch'); } }, payload), error => /Total mismatch/.test(error.message) && !error.needsReconciliation);
});
await test('Incomplete bank 409 explains Finance dependency and checks the same charge', async () => {
  let checked; const api = { post: async () => { throw fail(409, 'Master rekening belum lengkap'); }, get: async (url, config) => { checked = config.params; return billing(null); } };
  await assert.rejects(submitStudentInvoice(api, payload), /Finance\/DB PIC/); assert.equal(checked.charge_id, payload.charge_id); assert.equal(checked.view, 'charge');
});
await test('Lost network response returns success only after server confirms same charge invoice', async () => {
  let posts = 0; const api = { post: async () => { posts++; throw new Error('Network Error'); }, get: async () => billing(invoice) };
  const result = await submitStudentInvoice(api, payload); assert.equal(result.id, invoice.id); assert.equal(result.created_now, false); assert.equal(result.reconciled, true); assert.equal(posts, 1);
});
await test('Existing charge is reused without a repeated POST after uncertain request', async () => {
  let posts = 0; const api = { get: async () => billing({ ...invoice, status: 'Cancelled' }), post: async () => { posts++; } };
  const result = await submitStudentInvoice(api, payload, true); assert.equal(result.id, invoice.id); assert.equal(result.status, 'Cancelled'); assert.equal(posts, 0);
});
await test('Unavailable charge reconciliation blocks retry and does not change charge identity', async () => {
  let posts = 0; const api = { get: async () => { throw new Error('Offline'); }, post: async () => { posts++; } };
  await assert.rejects(submitStudentInvoice(api, payload, true), error => error.needsReconciliation && /Retry diblokir/.test(error.message)); assert.equal(posts, 0);
});
await test('Explicit retry after confirmed absence uses identical student/enrollment/charge and no ID', async () => {
  const calls = []; const api = { get: async (url, config) => { calls.push(config.params.charge_id); return billing(null); }, post: async (url, body) => { calls.push(body); return issued; } };
  await submitStudentInvoice(api, payload, true); assert.equal(calls[0], payload.charge_id); assert.equal(calls[1], payload); assert.equal(calls[1].id, undefined);
});
await test('Reconciliation cannot accept an invoice for a different enrollment/student', async () => {
  await assert.rejects(submitStudentInvoice({ get: async () => billing({ ...invoice, student_id: 18 }) }, payload, true), /Retry diblokir/);
});
await test('Invoice status never manufactures payment or delivery records', () => {
  const invoices = [{ id: 'PAID', status: 'Paid', total: '100.01' }, { id: 'PART', status: 'Partially Paid', total: '200.00' }];
  assert.deepEqual(serverDeliveryRows(invoices, []), []); assert.deepEqual(serverPaymentRows(invoices, []), []);
  const payments = [{ id: 9, noInv: 'PART', jumlah: '0.01', statusVerif: 'Menunggu' }]; assert.equal(serverPaymentRows(invoices, payments)[0].statusVerif, 'Menunggu'); assert.equal(serverPaymentRows(invoices, payments)[0].jumlah, '0.01');
  assert.equal(serverDeliveryRows(invoices, [{ id: 'PAID', statusKirim: 'Gagal', statusBaca: null }])[0].statusKirim, 'Gagal');
});
console.log('PASS: '+checks+' validated student/enrollment invoice regression scenarios (mock API; not production E2E).');
