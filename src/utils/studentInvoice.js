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
  return { students, banks, canPrepare: body.permissions?.prepare === true };
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

export function buildStudentInvoice({ students, banks, studentId, bankId, manual, id, date, due, installments, notes = '', salesCode = '' }) {
  if (manual) throw new Error('Siswa baru harus terdaftar di database sebelum invoice dapat diterbitkan.');
  const student = students.find(row => row.databaseId === databaseId(studentId));
  if (!student || !databaseId(studentId)) throw new Error('Pilih siswa dengan ID database resmi dari lookup Finance.');
  const bank = banks.find(row => row.databaseId === databaseId(bankId));
  if (!bank || !databaseId(bankId)) throw new Error('Pilih rekening resmi yang aktif dan lengkap. Finance/DB PIC perlu melengkapi master rekening termasuk pemilik terverifikasi.');
  const total = invoiceDecimal(student.total_biaya);
  if (cents(total) <= 0n) throw new Error('Total biaya resmi siswa belum tersedia atau belum positif. Hubungi Finance.');
  if (typeof id !== 'string' || !id.trim() || id.trim().length > 50) throw new Error('Nomor invoice tidak valid.');
  invoiceDate(date); invoiceDate(due);
  if (due < date) throw new Error('Jatuh tempo tidak boleh mendahului tanggal invoice.');
  const scheme = studentScheme(student.metode_pembayaran);
  if (!scheme) throw new Error('Skema pembayaran siswa belum jelas di database. Konfirmasi dengan Finance; cicilan tidak diubah otomatis menjadi full payment.');
  let schedule;
  if (scheme === 'full') {
    schedule = [{ deskripsi: 'Full Payment', jatuhTempo: due, nominal: total }];
  } else {
    if (!Array.isArray(installments) || installments.length < 2 || installments.length > 120) throw new Error('Lengkapi setidaknya dua termin cicilan; jadwal resmi belum tersedia dari lookup.');
    let sum = 0n, previous = date;
    schedule = installments.map((row, index) => {
      const nominal = invoiceDecimal(row.nominal);
      const deadline = invoiceDate(row.jatuhTempo);
      if (cents(nominal) <= 0n || deadline < previous || (index === 0 && deadline !== due)) throw new Error('Nominal termin harus positif, tanggal berurutan, dan termin pertama sesuai jatuh tempo invoice.');
      previous = deadline; sum += cents(nominal);
      const description = String(row.deskripsi || row.keterangan || `Termin ${index + 1}`).trim();
      if (!description || description.length > 255) throw new Error('Deskripsi termin tidak valid.');
      return { deskripsi: description, jatuhTempo: deadline, nominal };
    });
    if (sum !== cents(total)) throw new Error('Jumlah seluruh termin harus tepat sama dengan total biaya resmi siswa.');
  }
  if (notes.length > 10000 || salesCode.length > 100) throw new Error('Catatan atau sales code terlalu panjang.');
  return {
    action: 'add_invoice', id: id.trim(), student_id: Number(student.databaseId), bank_account_id: Number(bank.databaseId),
    tanggal: date, jatuhTempo: due, total, subtotal: total, discount: { amount: '0.00' }, status: 'Unpaid',
    keterangan: student.program || 'Biaya program siswa', skema: scheme, installments: schedule, notes, salesCode,
  };
}

export async function checkInvoiceNumber(api, id) {
  const { data } = await api.get('/api/billing.php');
  if (data?.status !== 'success' || !Array.isArray(data.data?.invoices)) throw new Error('Data invoice server belum dapat diperiksa.');
  return data.data.invoices.find(invoice => String(invoice.id) === String(id)) || null;
}

export function invoiceError(error) {
  let message = error.response?.data?.message || error.message || 'Invoice belum berhasil disimpan.';
  if (/rekening|pemilik|master|coa/i.test(message)) message += ' Finance/DB PIC perlu memeriksa master rekening resmi dan pemilik terverifikasi.';
  if (error.response?.data?.request_id) message += ` (ID permintaan: ${error.response.data.request_id})`;
  return message;
}

export async function submitStudentInvoice(api, payload, mustCheck = false) {
  if (mustCheck) {
    let exists;
    try { exists = await checkInvoiceNumber(api, payload.id); }
    catch {
      const error = new Error('Hasil request sebelumnya belum dapat dipastikan. Retry diblokir sampai data server dapat diperiksa.');
      error.needsReconciliation = true; throw error;
    }
    if (exists) {
      const error = new Error(`Nomor ${payload.id} sudah ada di server. Periksa invoice tersebut sebelum melakukan tindakan lain; request tidak dikirim ulang.`);
      error.needsReconciliation = true; throw error;
    }
  }
  try {
    const { data } = await api.post('/api/billing.php', payload);
    if (data?.status !== 'success' || String(data.data?.id) !== payload.id) throw new Error(data?.message || 'Konfirmasi penerbitan dari server tidak valid.');
    return data.data;
  } catch (cause) {
    const uncertain = !cause.response || cause.response.status === 409 || cause.response.status >= 500;
    let message = invoiceError(cause);
    if (uncertain) {
      try {
        const existing = await checkInvoiceNumber(api, payload.id);
        message += existing ? ` Nomor ${payload.id} sudah ada di server; periksa invoice tersebut. Tidak ada penerbitan ulang otomatis.`
          : ' Nomor belum ditemukan di server. Periksa kembali sebelum retry dengan nomor yang sama.';
      } catch { message += ' Hasil server belum dapat diperiksa. Retry diblokir sampai pemeriksaan berhasil.'; }
    }
    const error = new Error(message);
    error.needsReconciliation = uncertain;
    throw error;
  }
}

// Enrich only real server rows. Invoice status alone never proves a payment or delivery.
export function serverDeliveryRows(invoices, rows = []) {
  return rows.map(row => {
    const invoice = invoices.find(item => String(item.id) === String(row.noInv ?? row.id));
    return { nominal: invoice?.total, terbayar: invoice?.terbayar, sisa: invoice?.sisa, statusInvoice: invoice?.status, program: invoice?.program, ...row };
  });
}

export function serverPaymentRows(invoices, rows = []) {
  return rows.map(row => ({ program: invoices.find(item => String(item.id) === String(row.noInv))?.program, ...row }));
}
