import paymentSchemes from '../../backend/config/payment_schemes.json' with { type: 'json' };

export function databaseId(value) {
  return (typeof value === 'string' || Number.isSafeInteger(value)) && String(value).trim() === String(value) && /^[1-9]\d{0,9}$/.test(String(value)) ? String(value) : '';
}

export function invoiceDecimal(value) {
  if ((typeof value !== 'string' && !Number.isSafeInteger(value)) || String(value).trim() !== String(value) || !/^\d{1,13}(\.\d{1,2})?$/.test(String(value))) {
    throw new Error('Nominal resmi harus berupa decimal valid, maksimal dua angka desimal.');
  }
  const [whole, fraction = ''] = String(value).split('.');
  return `${BigInt(whole)}.${fraction.padEnd(2, '0')}`;
}

const cents = value => BigInt(invoiceDecimal(value).replace('.', ''));

export function formatInvoiceMoney(value) {
  try {
    const [whole, fraction] = invoiceDecimal(value).split('.');
    return `Rp ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction}`;
  } catch { return 'Belum tersedia'; }
}

export function studentScheme(value) {
  if (typeof value !== 'string') return '';
  const key = value.trim().toLowerCase().replace(/\s+/g, ' ');
  return Object.entries(paymentSchemes).find(([, aliases]) => aliases.includes(key))?.[0] || '';
}

export function invoiceLookups(body) {
  if (body?.status !== 'success' || !['students', 'banks', 'accounts'].every(key => Array.isArray(body.data?.[key]))) {
    throw new Error(body?.message || 'Respons lookup Finance tidak valid.');
  }
  const students = body.data.students.filter(row => databaseId(row.id)).map(row => ({
    ...row, databaseId: databaseId(row.id), nama: row.name || '', nis: row.nis || '',
    phone: row.no_wa || '', email: row.email || '', alamat: row.alamat || '',
    metodePembayaran: row.metode_pembayaran || '', totalBiaya: row.total_biaya,
  }));
  const banks = body.data.banks.filter(bank => {
    const account = body.data.accounts.find(row => databaseId(row.id) === databaseId(bank.account_id));
    return databaseId(bank.id) && Number(bank.is_active) === 1 && account && Number(account.is_active) === 1 && account.report_class === 'cash'
      && ['bank_name', 'account_number', 'account_holder'].every(key => typeof bank[key] === 'string' && bank[key].trim());
  }).map(bank => ({
    ...bank, databaseId: databaseId(bank.id), nama: bank.name || '', bank: bank.bank_name,
    noRek: bank.account_number, pemilik: bank.account_holder, kode: bank.code || '', saldo: bank.balance ?? null,
  }));
  const enrollments = (body.data.enrollments || []).filter(row => databaseId(row.id) && databaseId(row.student_id));
  const charges = (body.data.charges || []).filter(row => databaseId(row.id) && databaseId(row.enrollment_id));
  return { students, banks, enrollments, charges, enrollmentSchemaReady: body.data.enrollment_schema_ready === true, canPrepare: body.permissions?.prepare === true };
}

export async function loadInvoiceLookups(api, { sync = false, signal } = {}) {
  if (sync) {
    const { data } = await api.post('/api/sync_students_web.php', {});
    if (data?.status !== 'success') throw new Error(data?.message || 'Sinkronisasi siswa belum berhasil.');
  }
  const { data } = await api.get('/api/accounting.php', { params: { view: 'lookups' }, signal });
  return invoiceLookups(data);
}

function invoiceDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error('Tanggal invoice dan termin harus valid (YYYY-MM-DD).');
  }
  return value;
}

export function chargeSchedule(charge, date) {
  invoiceDate(date);
  if (!charge || !Array.isArray(charge.installments) || !charge.installments.length) throw new Error('Jadwal charge approved belum tersedia. Hubungi Finance.');
  return charge.installments.map((term, index) => {
    if (!Number.isInteger(term.due_days) || term.due_days < 0 || term.due_days > 3660) throw new Error('Jadwal charge approved tidak valid.');
    const deadline = new Date(date + 'T00:00:00Z'); deadline.setUTCDate(deadline.getUTCDate() + term.due_days);
    return { id: index + 1, deskripsi: term.label, jatuhTempo: deadline.toISOString().slice(0, 10), nominal: invoiceDecimal(term.amount) };
  });
}
export function buildStudentInvoice({ students, banks, enrollments = [], charges = [], studentId, enrollmentId, chargeId, bankId, manual, date, notes = '', salesCode = '' }) {
  if (manual) throw new Error('Siswa baru harus terdaftar di database dan memiliki enrollment approved sebelum invoice dapat diterbitkan.');
  const student = students.find(row => row.databaseId === databaseId(studentId));
  if (!student) throw new Error('Pilih siswa dengan ID database resmi dari lookup Finance.');
  const enrollment = enrollments.find(row => databaseId(row.id) === databaseId(enrollmentId));
  if (!enrollment || databaseId(enrollment.student_id) !== student.databaseId) throw new Error('Pilih enrollment resmi milik siswa ini.');
  if (enrollment.enrollment_status !== 'approved' || enrollment.review_reason) throw new Error('Enrollment/pricing belum approved. Hubungi Finance untuk review.');
  const charge = charges.find(row => databaseId(row.id) === databaseId(chargeId) && databaseId(row.enrollment_id) === databaseId(enrollment.id));
  if (!charge) throw new Error('Pilih charge yang telah diotorisasi Finance untuk enrollment ini.');
  const bank = banks.find(row => row.databaseId === databaseId(bankId));
  if (!bank) throw new Error('Pilih rekening resmi yang aktif dan lengkap. Finance/DB PIC perlu melengkapi master rekening termasuk pemilik terverifikasi.');
  const total = invoiceDecimal(charge.amount); const scheme = studentScheme(charge.scheme);
  if (cents(total) <= 0n || !scheme) throw new Error('Nominal/skema charge approved belum valid. Hubungi Finance.');
  const schedule = chargeSchedule(charge, date);
  if ((scheme === 'full' && schedule.length !== 1) || (scheme === 'cicilan' && schedule.length < 2)) throw new Error('Jumlah termin charge approved tidak sesuai skema.');
  let sum = 0n, previous = date;
  for (const term of schedule) {
    if (cents(term.nominal) <= 0n || term.jatuhTempo < previous) throw new Error('Jadwal charge approved tidak konsisten.');
    sum += cents(term.nominal); previous = term.jatuhTempo;
  }
  if (sum !== cents(total)) throw new Error('Total termin tidak sama dengan nominal charge approved.');
  if (notes.length > 10000 || salesCode.length > 100) throw new Error('Catatan atau sales code terlalu panjang.');
  return {
    action: 'add_invoice', student_id: Number(student.databaseId), enrollment_id: Number(enrollment.id), charge_id: Number(charge.id), bank_account_id: Number(bank.databaseId),
    tanggal: date, jatuhTempo: schedule[0].jatuhTempo, total, subtotal: total, discount: { amount: '0.00' }, status: 'Unpaid',
    skema: scheme, installments: schedule, notes, salesCode,
  };
}
export async function checkInvoiceCharge(api, payload) {
  const { data } = await api.get('/api/billing.php', { params: { view: 'charge', student_id: payload.student_id, enrollment_id: payload.enrollment_id, charge_id: payload.charge_id } });
  if (data?.status !== 'success' || !data.data || !Object.hasOwn(data.data, 'invoice')) throw new Error('Data charge server belum dapat diperiksa.');
  const invoice = data.data.invoice;
  if (invoice && (typeof invoice.id !== 'string' || !invoice.id || ['student_id', 'enrollment_id', 'charge_id'].some(key => String(invoice[key]) !== String(payload[key])))) throw new Error('Ownership hasil rekonsiliasi tidak sesuai charge.');
  return invoice;
}

export function invoiceError(error) {
  let message = error.response?.data?.message || error.message || 'Invoice belum berhasil disimpan.';
  if (/rekening|pemilik|master|coa/i.test(message)) message += ' Finance/DB PIC perlu memeriksa master rekening resmi dan pemilik terverifikasi.';
  if (error.response?.data?.request_id) message += ` (ID permintaan: ${error.response.data.request_id})`;
  return message;
}

export async function submitStudentInvoice(api, payload, mustCheck = false) {
  if (mustCheck) {
    let invoice;
    try { invoice = await checkInvoiceCharge(api, payload); }
    catch { const error = new Error('Hasil request sebelumnya belum dapat dipastikan. Retry diblokir sampai charge server dapat diperiksa.'); error.needsReconciliation = true; throw error; }
    if (invoice) return { ...invoice, created_now: false, reconciled: true };
  }
  try {
    const { data } = await api.post('/api/billing.php', payload);
    if (data?.status !== 'success' || !data.data?.id || ['student_id', 'enrollment_id', 'charge_id'].some(key => String(data.data[key]) !== String(payload[key]))) throw new Error(data?.message || 'Konfirmasi penerbitan dari server tidak valid.');
    return data.data;
  } catch (cause) {
    const uncertain = !cause.response || cause.response.status === 409 || cause.response.status >= 500;
    let message = invoiceError(cause);
    if (uncertain) {
      try {
        const invoice = await checkInvoiceCharge(api, payload);
        if (invoice) return { ...invoice, created_now: false, reconciled: true };
        message += ' Belum ada invoice untuk charge ini. Retry eksplisit akan memeriksa charge yang sama.';
      } catch { message += ' Hasil server belum dapat dipastikan; retry diblokir sampai charge dapat diperiksa.'; }
    }
    const error = new Error(message, { cause }); error.needsReconciliation = uncertain; throw error;
  }
}

export function serverDeliveryRows(invoices, rows = []) {
  return rows.map(row => {
    const invoice = invoices.find(item => String(item.id) === String(row.noInv ?? row.id));
    return { nominal: invoice?.total, terbayar: invoice?.terbayar, sisa: invoice?.sisa, statusInvoice: invoice?.status, program: invoice?.program, ...row };
  });
}

export function serverPaymentRows(invoices, rows = []) {
  return rows.map(row => ({ program: invoices.find(item => String(item.id) === String(row.noInv))?.program, ...row }));
}
