import assert from 'node:assert/strict';
import { databaseId, invoiceDecimal, formatInvoiceMoney, studentScheme, invoiceLookups, loadInvoiceLookups, buildStudentInvoice, submitStudentInvoice, serverDeliveryRows, serverPaymentRows } from '../src/utils/studentInvoice.js';
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
const input = { ...lookups, studentId: '17', bankId: '3', id: 'TEST-STABLE-ID', date: '2026-11-13', due: '2026-11-20' };
const payload = buildStudentInvoice(input);
const fail = (status, message) => Object.assign(new Error(message), { response: { status, data: { status: 'error', message, request_id: 'qa-request' } } });
const billing = invoices => ({ data: { status: 'success', data: { invoices } } });

await test('Backend and frontend share every scheme alias without guessing unknown schemes', () => {
  for (const [scheme, aliases] of Object.entries(paymentSchemes)) {
    for (const alias of aliases) assert.equal(studentScheme(`  ${alias.toUpperCase()}  `), scheme);
  }
  for (const unknown of ['', null, 'not full', 'DP khusus 12 bulan', 'cicilan tak dikenal']) assert.equal(studentScheme(unknown), '');
  assert.equal(buildStudentInvoice({ ...input, students: [{ ...lookups.students[0], metode_pembayaran: 'Angsuran' }], installments: [
    { nominal: '5000000.01', jatuhTempo: input.due }, { nominal: '10000000.00', jatuhTempo: '2026-12-20' },
  ] }).skema, 'cicilan');
});

await test('Official student and bank IDs stay separate from NIS, web_id and COA', () => {
  assert.equal(payload.student_id, 17); assert.equal(payload.bank_account_id, 3);
  assert.equal(lookups.students.length, 2); assert.deepEqual(lookups.banks.map(row => row.databaseId), ['3']);
  assert.equal(lookups.students[0].email, ''); assert.equal(lookups.students[0].phone, '');
});
await test('Exact decimal totals come from lookup, not editable form overrides', () => {
  const actual = buildStudentInvoice({ ...input, total: '1.00', discount: { amount: '999' }, status: 'Paid' });
  assert.equal(actual.total, '15000000.01'); assert.equal(actual.status, 'Unpaid'); assert.deepEqual(actual.discount, { amount: '0.00' });
  assert.equal(invoiceDecimal('9999999999999.99'), '9999999999999.99'); assert.equal(invoiceDecimal('0.1'), '0.10');
  assert.equal(formatInvoiceMoney('15000000.01'), 'Rp 15.000.000,01');
  for (const value of [0.1, '1e7', '-1', '1.001', '15.000,01', '1.00\n', null]) assert.throws(() => invoiceDecimal(value));
  assert.equal(databaseId('17\n'), ''); assert.equal(databaseId('NIS-901'), '');
});
await test('Invalid, local and upstream student IDs cannot issue', () => {
  for (const studentId of ['', 'SIS-LOCAL', 'NIS-901', '999', '1120']) assert.throws(() => buildStudentInvoice({ ...input, studentId }), /ID database/);
});
await test('Duplicate names do not select another identity or price', () => {
  assert.throws(() => buildStudentInvoice({ ...input, studentId: '18', installments: [] }), /termin cicilan/);
  assert.equal(payload.student_id, 17); assert.equal(payload.total, '15000000.01');
});
await test('Manual mode cannot publish even with valid selected database IDs', () => assert.throws(() => buildStudentInvoice({ ...input, manual: true }), /terdaftar di database/));
await test('No client bank assertions, quantity or independent item pricing in payload', () => {
  for (const field of ['bank_name','account_number','account_holder','coa_code','items','qty','customer','email','phone']) assert.equal(payload[field], undefined);
  assert.equal(payload.installments[0].nominal, payload.total);
});
await test('Missing official bank holder cannot be replaced by account display label', () => {
  const missing = invoiceLookups({ ...source, data: { ...source.data, banks: [source.data.banks[4]] } });
  assert.equal(missing.banks.length, 0); assert.throws(() => buildStudentInvoice({ ...input, banks: missing.banks }), /Finance\/DB PIC/);
});
await test('Missing/nonpositive official fee and unknown scheme fail without defaults', () => {
  for (const total_biaya of [null, '0.00', '-1.00']) assert.throws(() => buildStudentInvoice({ ...input, students: [{ ...lookups.students[0], total_biaya }] }));
  assert.throws(() => buildStudentInvoice({ ...input, students: [{ ...lookups.students[0], metode_pembayaran: '' }] }), /Skema pembayaran/);
});
const terms = [{ deskripsi: 'DP', jatuhTempo: '2026-11-20', nominal: '5000000.01' }, { deskripsi: 'Pelunasan', jatuhTempo: '2026-12-20', nominal: '12999999.99' }];
await test('Installment decimals and dates are preserved without rounding or conversion to full', () => {
  const actual = buildStudentInvoice({ ...input, studentId: '18', installments: terms });
  assert.equal(actual.skema, 'cicilan'); assert.deepEqual(actual.installments, terms);
  assert.throws(() => buildStudentInvoice({ ...input, studentId: '18', installments: [terms[0]] }), /dua termin/);
  assert.throws(() => buildStudentInvoice({ ...input, studentId: '18', installments: [{ ...terms[0], nominal: '1.00' }, terms[1]] }), /tepat sama/);
  assert.throws(() => buildStudentInvoice({ ...input, studentId: '18', installments: [{ ...terms[0], jatuhTempo: '2026-02-30' }, terms[1]] }), /Tanggal/);
});
await test('Sync refreshes database lookups and ignores upstream IDs returned by sync', async () => {
  const calls = [];
  const api = { post: async url => { calls.push(url); return { data: { status: 'success', data: [{ id: 99999, web_id: 99999 }] } }; },
    get: async (url, config) => { calls.push(url); assert.equal(config.params.view, 'lookups'); return { data: source }; } };
  const actual = await loadInvoiceLookups(api, { sync: true });
  assert.deepEqual(calls, ['/api/sync_students_web.php','/api/accounting.php']); assert.equal(actual.students[0].databaseId, '17');
});
await test('Only confirmed server success completes invoice creation', async () => {
  assert.deepEqual(await submitStudentInvoice({ post: async () => ({ data: { status: 'success', data: { id: payload.id } } }) }, payload), { id: payload.id });
});
await test('HTTP 422 total mismatch preserves backend error and never becomes success', async () => {
  let checked = false;
  await assert.rejects(submitStudentInvoice({ post: async () => { throw fail(422, 'Total invoice tidak sama dengan biaya resmi'); }, get: async () => { checked = true; } }, payload), error => /Total invoice/.test(error.message) && /qa-request/.test(error.message) && !error.needsReconciliation);
  assert.equal(checked, false);
});
await test('Bank configuration 409 explains Finance dependency and reconciles before retry', async () => {
  let reads = 0;
  const api = { post: async () => { throw fail(409, 'Data rekening resmi belum lengkap'); }, get: async () => { reads++; return billing([]); } };
  await assert.rejects(submitStudentInvoice(api, payload), error => /Finance\/DB PIC/.test(error.message) && error.needsReconciliation);
  assert.equal(reads, 1);
});
await test('409 existing invoice blocks repeated POST while retaining the same number', async () => {
  let posts = 0, reads = 0;
  const api = { get: async () => { reads++; return billing([{ id: payload.id }]); }, post: async () => { posts++; throw fail(409, 'Nomor invoice sudah digunakan'); } };
  await assert.rejects(submitStudentInvoice(api, payload), /sudah ada di server/);
  await assert.rejects(submitStudentInvoice(api, payload, true), /tidak dikirim ulang/);
  assert.equal(posts, 1); assert.equal(reads, 2); assert.equal(payload.id, 'TEST-STABLE-ID');
});
await test('Lost network response checks server without fabricating success or reposting', async () => {
  let posts = 0;
  const api = { post: async () => { posts++; throw new Error('Network Error'); }, get: async () => billing([{ id: payload.id }]) };
  await assert.rejects(submitStudentInvoice(api, payload), error => error.needsReconciliation && /sudah ada di server/.test(error.message));
  await assert.rejects(submitStudentInvoice(api, payload, true), /tidak dikirim ulang/); assert.equal(posts, 1);
});
await test('Unavailable reconciliation blocks retry until server can be checked', async () => {
  let posts = 0;
  const api = { get: async () => { throw new Error('Offline'); }, post: async () => { posts++; } };
  await assert.rejects(submitStudentInvoice(api, payload, true), /Retry diblokir/); assert.equal(posts, 0);
});
await test('After confirmed absence an explicit retry uses the identical invoice ID', async () => {
  const calls = [];
  const api = { get: async () => { calls.push('check'); return billing([]); }, post: async (url, sent) => { calls.push(sent.id); return { data: { status: 'success', data: { id: sent.id } } }; } };
  await submitStudentInvoice(api, payload, true); assert.deepEqual(calls, ['check', payload.id]);
});
await test('Paid/partial invoice status never manufactures delivery/payment records', () => {
  const invoices = [{ id: 'PAID', status: 'Paid', total: '100.01' }, { id: 'PART', status: 'Partially Paid', total: '200.00' }];
  assert.deepEqual(serverDeliveryRows(invoices, []), []); assert.deepEqual(serverPaymentRows(invoices, []), []);
  const payments = [{ id: 9, noInv: 'PART', jumlah: '0.01', statusVerif: 'Menunggu' }];
  assert.equal(serverPaymentRows(invoices, payments)[0].statusVerif, 'Menunggu'); assert.equal(serverPaymentRows(invoices, payments)[0].jumlah, '0.01');
  const delivery = serverDeliveryRows(invoices, [{ id: 'PAID', statusKirim: 'Gagal', statusBaca: null }])[0];
  assert.equal(delivery.statusKirim, 'Gagal'); assert.equal(delivery.statusBaca, null);
});
console.log(`PASS: ${checks} validated student invoice regression scenarios (mock API; not production E2E).`);
