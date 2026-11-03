import fs from 'fs';
import mysql from 'mysql2/promise';

async function generate() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'one-creativa' });
  const [tables] = await conn.query('SHOW TABLES');
  const tblNames = tables.map(t => Object.values(t)[0]);

  let sql = `-- ============================================================================
-- ONE CREATIVA - MASTER DATABASE INSTALLATION PRODUKSI (HOSTINGER)
-- Clean Slate: Memulai dari 0, Tanpa Data Transaksi Dummy/Test Lama
-- Tanggal Pembuatan: 02 November 2026
-- Target Hostinger DB: u260890310_one
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. STRUKTUR SELURUH TABEL SISTEM
-- ============================================================================

`;

  for (const t of tblNames) {
    const [createRes] = await conn.query('SHOW CREATE TABLE `' + t + '`');
    let createSql = createRes[0]['Create Table'];
    createSql = createSql.replace(/^CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ');
    sql += createSql + ';\n\n';
  }

  // Tambahkan ALTER TABLE untuk kolom baru pada tabel yang mungkin sudah ada versi lamanya
  sql += `-- Penyesuaian kolom tabel yang sudah ada sebelumnya
ALTER TABLE \`peserta_intensif\`
  ADD COLUMN IF NOT EXISTS \`no_ktp\` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS \`user_id\` INT(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS \`level\` VARCHAR(50) DEFAULT 'N5',
  ADD COLUMN IF NOT EXISTS \`batch\` VARCHAR(100) DEFAULT 'Batch 2',
  ADD COLUMN IF NOT EXISTS \`nis\` VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS \`affiliator\` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS \`alamat\` TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS \`kota\` VARCHAR(100) DEFAULT 'Kab. Cianjur',
  ADD COLUMN IF NOT EXISTS \`provinsi\` VARCHAR(100) DEFAULT 'Jawa Barat',
  ADD COLUMN IF NOT EXISTS \`kode_pos\` VARCHAR(20) DEFAULT '43211',
  ADD COLUMN IF NOT EXISTS \`negara\` VARCHAR(50) DEFAULT 'Indonesia',
  ADD COLUMN IF NOT EXISTS \`program\` VARCHAR(150) DEFAULT 'Program Pelatihan Jepang',
  ADD COLUMN IF NOT EXISTS \`status\` VARCHAR(50) DEFAULT 'Aktif',
  ADD COLUMN IF NOT EXISTS \`web_id\` INT(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS \`source\` VARCHAR(50) DEFAULT NULL;

`;

  sql += `-- ============================================================================
-- 2. BERSIHKAN DATA TRANSAKSI LAMA (START DARI 0 UNTUK SISTEM BARU)
-- ============================================================================

`;

  const txTables = [
    'accounting_transactions',
    'journal_entries',
    'journal_lines',
    'accounting_source_documents',
    'payment_allocations',
    'student_payment_submissions',
    'student_invoice_links',
    'billing_invoices',
    'billing_pembayaran',
    'billing_terkirim',
    'billing_siswa',
    'budget_commitments',
    'budget_realizations',
    'budget_request_items',
    'budget_request_history',
    'budget_requests',
    'salary_slips',
    'salary_slip_events',
    'salary_requests',
    'salary_request_history',
    'payroll',
    'payslips',
    'reimbursements',
    'vendor_bills',
    'finance_records',
    'invoice_records',
    'invoice_clients',
    'financial_report_adjustments',
    'accounting_audit_logs',
    'accounting_idempotency'
  ];

  for (const t of txTables) {
    if (tblNames.includes(t)) {
      sql += `TRUNCATE TABLE \`${t}\`;\n`;
    }
  }
  sql += '\n';

  sql += `-- ============================================================================
-- 3. MASTER DATA INTI (ROLES, USERS, AKUN COA, BANK, PERMISSIONS)
-- ============================================================================

`;

  // Master roles
  const [roles] = await conn.query('SELECT * FROM roles ORDER BY id ASC');
  for (const r of roles) {
    const label = (r.label || '').replace(/'/g, "\\'");
    sql += `INSERT IGNORE INTO \`roles\` (\`id\`, \`name\`, \`label\`) VALUES (${r.id}, '${r.name}', '${label}');\n`;
  }
  sql += '\n';

  // Master users (super_admin, finance, & operational staff)
  const [users] = await conn.query("SELECT * FROM users WHERE id IN (2, 4, 5, 10, 33, 37)");
  for (const u of users) {
    sql += `INSERT INTO \`users\` (\`id\`, \`email\`, \`password_hash\`, \`role_id\`, \`is_active\`) VALUES (${u.id}, '${u.email}', '${u.password_hash}', ${u.role_id}, 1) ON DUPLICATE KEY UPDATE \`password_hash\`=VALUES(\`password_hash\`), \`role_id\`=VALUES(\`role_id\`), \`is_active\`=1;\n`;
  }
  sql += '\n';

  // Master employees (admin, finance, & operational staff)
  const [emps] = await conn.query("SELECT * FROM employees WHERE id IN (1, 2, 3, 7, 77, 81)");
  for (const e of emps) {
    const fullName = (e.full_name || '').replace(/'/g, "\\'");
    const pos = (e.position || '').replace(/'/g, "\\'");
    const deptId = e.department_id ? e.department_id : 'NULL';
    const joinDate = e.join_date ? `'${new Date(e.join_date).toISOString().slice(0, 10)}'` : 'NULL';
    sql += `INSERT INTO \`employees\` (\`id\`, \`user_id\`, \`employee_code\`, \`full_name\`, \`position\`, \`department_id\`, \`base_salary\`, \`join_date\`) VALUES (${e.id}, ${e.user_id}, '${e.employee_code}', '${fullName}', '${pos}', ${deptId}, ${e.base_salary || 0}, ${joinDate}) ON DUPLICATE KEY UPDATE \`full_name\`=VALUES(\`full_name\`), \`position\`=VALUES(\`position\`), \`base_salary\`=VALUES(\`base_salary\`), \`join_date\`=VALUES(\`join_date\`);\n`;
  }
  sql += '\n';

  // Master accounting periods
  const [periods] = await conn.query('SELECT * FROM accounting_periods ORDER BY month ASC');
  for (const p of periods) {
    sql += `INSERT IGNORE INTO \`accounting_periods\` (\`month\`, \`status\`) VALUES ('${p.month}', '${p.status}');\n`;
  }
  sql += '\n';

  // Master accounts / COA Standar PSAK Indonesia
  sql += `-- Master Chart of Accounts (COA) Standar PSAK Indonesia
INSERT IGNORE INTO \`accounts\` (\`code\`, \`name\`, \`account_group\`, \`normal_balance\`, \`report_class\`, \`is_detail\`, \`is_active\`) VALUES
('1100', 'Kas / Bank (Induk)', 1, 'debit', 'cash', 0, 1),
('1200', 'Piutang Usaha', 1, 'debit', 'receivable', 1, 1),
('1300', 'Persediaan', 1, 'debit', 'inventory', 1, 1),
('1400', 'Aset Tetap', 1, 'debit', 'fixed_asset', 1, 1),
('1500', 'Uang Muka', 1, 'debit', 'prepayment', 1, 1),
('2100', 'Utang Usaha', 2, 'credit', 'payable', 1, 1),
('2200', 'Utang Gaji', 2, 'credit', 'payroll_payable', 1, 1),
('2300', 'Utang Pinjaman', 2, 'credit', 'loan', 1, 1),
('2400', 'Pendapatan Diterima di Muka', 2, 'credit', 'deferred_revenue', 1, 1),
('2500', 'Utang Reimbursement', 2, 'credit', 'reimbursement_payable', 1, 1),
('2600', 'Utang Pajak / Potongan (PPh 21 & BPJS)', 2, 'credit', 'tax_payable', 1, 1),
('3100', 'Modal Disetor', 3, 'credit', 'capital', 1, 1),
('3200', 'Laba Ditahan', 3, 'credit', 'retained_earnings', 1, 1),
('4100', 'Pendapatan Pelatihan', 4, 'credit', 'revenue', 1, 1),
('4200', 'Pendapatan Lain-lain', 4, 'credit', 'other_income', 1, 1),
('5100', 'Biaya Layanan Pendidikan', 5, 'debit', 'cost_of_services', 1, 1),
('5200', 'Beban Operasional Umum', 5, 'debit', 'operating_expense', 1, 1),
('5300', 'Beban Gaji Karyawan', 5, 'debit', 'operating_expense', 1, 1),
('5400', 'Beban Bunga / Administrasi Bank', 5, 'debit', 'other_expense', 1, 1),
('5500', 'Beban Pajak Penghasilan', 5, 'debit', 'income_tax', 1, 1);

INSERT INTO \`accounts\` (\`code\`, \`name\`, \`account_group\`, \`normal_balance\`, \`report_class\`, \`parent_id\`, \`is_detail\`, \`is_active\`)
SELECT '1110', 'Petty Cash / Kas Tunai', 1, 'debit', 'cash', id, 1, 1 FROM \`accounts\` WHERE \`code\`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`is_active\`=1;

INSERT INTO \`accounts\` (\`code\`, \`name\`, \`account_group\`, \`normal_balance\`, \`report_class\`, \`parent_id\`, \`is_detail\`, \`is_active\`)
SELECT '1120', 'Bank BCA (1832-918-428)', 1, 'debit', 'cash', id, 1, 1 FROM \`accounts\` WHERE \`code\`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`is_active\`=1;

INSERT INTO \`accounts\` (\`code\`, \`name\`, \`account_group\`, \`normal_balance\`, \`report_class\`, \`parent_id\`, \`is_detail\`, \`is_active\`)
SELECT '1130', 'Bank Mandiri Cadangan', 1, 'debit', 'cash', id, 1, 1 FROM \`accounts\` WHERE \`code\`='1100' LIMIT 1
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`is_active\`=1;

-- Master Rekening Kas & Bank Operasional (BCA, Kas Tunai, Mandiri)
INSERT INTO \`cash_bank_accounts\` (\`id\`, \`name\`, \`account_id\`, \`bank_name\`, \`account_number\`, \`is_active\`)
SELECT 13, 'CREATIVA BRIDGING INTERN', id, 'Bank BCA', '1832-918-428', 1 FROM \`accounts\` WHERE \`code\`='1120' LIMIT 1
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`bank_name\`=VALUES(\`bank_name\`), \`account_number\`=VALUES(\`account_number\`), \`is_active\`=1;

INSERT INTO \`cash_bank_accounts\` (\`id\`, \`name\`, \`account_id\`, \`bank_name\`, \`account_number\`, \`is_active\`)
SELECT 14, 'Petty Cash (Kas Kecil Tunai)', id, 'Kas Tunai Kasir', 'CASH-01', 1 FROM \`accounts\` WHERE \`code\`='1110' LIMIT 1
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`bank_name\`=VALUES(\`bank_name\`), \`account_number\`=VALUES(\`account_number\`), \`is_active\`=1;

INSERT INTO \`cash_bank_accounts\` (\`id\`, \`name\`, \`account_id\`, \`bank_name\`, \`account_number\`, \`is_active\`)
SELECT 18, 'Rekening Cadangan Mandiri', id, 'Bank Mandiri', '130-0019283', 1 FROM \`accounts\` WHERE \`code\`='1130' LIMIT 1
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`bank_name\`=VALUES(\`bank_name\`), \`account_number\`=VALUES(\`account_number\`), \`is_active\`=1;

-- Saldo Awal Kas & Bank (CREATIVA BRIDGING INTERN Rp 40.000.000)
INSERT INTO \`journal_entries\` (\`id\`, \`number\`, \`entry_date\`, \`period_id\`, \`source_type\`, \`source_id\`, \`event\`, \`description\`, \`status\`, \`created_by\`, \`posted_at\`)
SELECT 1, 'JRN-2026-INIT000013', '2026-06-17', (SELECT id FROM \`accounting_periods\` WHERE \`month\`='2026-06' LIMIT 1), 'bank_opening', '13', 'opening_balance', 'Saldo Awal Pembukaan Rekening CREATIVA BRIDGING INTERN', 'draft', 2, NULL
ON DUPLICATE KEY UPDATE \`description\`=VALUES(\`description\`);

INSERT INTO \`journal_lines\` (\`id\`, \`journal_entry_id\`, \`account_id\`, \`debit\`, \`credit\`, \`cash_flow_class\`)
SELECT 1, 1, (SELECT id FROM \`accounts\` WHERE \`code\`='1120' LIMIT 1), 40000000.00, 0.00, 'financing'
ON DUPLICATE KEY UPDATE \`debit\`=40000000.00, \`credit\`=0.00;

INSERT INTO \`journal_lines\` (\`id\`, \`journal_entry_id\`, \`account_id\`, \`debit\`, \`credit\`, \`cash_flow_class\`)
SELECT 2, 1, (SELECT id FROM \`accounts\` WHERE \`code\`='3100' LIMIT 1), 0.00, 40000000.00, 'noncash'
ON DUPLICATE KEY UPDATE \`debit\`=0.00, \`credit\`=40000000.00;

UPDATE \`journal_entries\` SET \`status\`='posted', \`posted_at\`=NOW() WHERE \`id\`=1;\n`;

  // Master permissions
  const [perms] = await conn.query('SELECT * FROM finance_role_permissions');
  for (const p of perms) {
    sql += `INSERT IGNORE INTO \`finance_role_permissions\` (\`role_name\`, \`permission\`, \`allowed\`) VALUES ('${p.role_name}', '${p.permission}', ${p.allowed});\n`;
  }
  sql += '\n';

  // Master departments
  const [depts] = await conn.query('SELECT * FROM departments');
  for (const d of depts) {
    const dName = (d.name || '').replace(/'/g, "\\'");
    sql += `INSERT IGNORE INTO \`departments\` (\`id\`, \`name\`) VALUES (${d.id}, '${dName}');\n`;
  }
  sql += '\n';

  // Master positions
  const [positions] = await conn.query('SELECT * FROM positions');
  for (const pos of positions) {
    const pName = (pos.name || '').replace(/'/g, "\\'");
    sql += `INSERT IGNORE INTO \`positions\` (\`id\`, \`name\`, \`department_id\`, \`base_salary\`, \`level\`) VALUES (${pos.id}, '${pName}', ${pos.department_id || 'NULL'}, ${pos.base_salary || 0}, '${pos.level || 'Staff'}');\n`;
  }
  sql += '\n';

  // Section 4: Riwayat Absensi & Laporan Kerja Karyawan
  sql += `-- ============================================================================
-- 4. RIWAYAT ABSENSI & LAPORAN KERJA OPERASIONAL KARYAWAN
-- ============================================================================

`;

  const [attendance] = await conn.query('SELECT * FROM attendance_logs ORDER BY date ASC, id ASC');
  for (const a of attendance) {
    const checkIn = a.check_in_at ? `'${new Date(a.check_in_at).toISOString().replace('T', ' ').slice(0, 19)}'` : 'NULL';
    const checkOut = a.check_out_at ? `'${new Date(a.check_out_at).toISOString().replace('T', ' ').slice(0, 19)}'` : 'NULL';
    const inLat = a.check_in_lat ? `'${a.check_in_lat}'` : 'NULL';
    const inLng = a.check_in_lng ? `'${a.check_in_lng}'` : 'NULL';
    const outLat = a.check_out_lat ? `'${a.check_out_lat}'` : 'NULL';
    const outLng = a.check_out_lng ? `'${a.check_out_lng}'` : 'NULL';
    const notes = a.notes ? `'${a.notes.replace(/'/g, "\\'")}'` : 'NULL';
    const dateStr = new Date(a.date).toISOString().slice(0, 10);
    const createdAt = a.created_at ? `'${new Date(a.created_at).toISOString().replace('T', ' ').slice(0, 19)}'` : 'NOW()';
    sql += `INSERT IGNORE INTO \`attendance_logs\` (\`id\`,\`employee_id\`,\`date\`,\`check_in_at\`,\`check_out_at\`,\`check_in_lat\`,\`check_in_lng\`,\`check_out_lat\`,\`check_out_lng\`,\`face_verified\`,\`geo_verified\`,\`status\`,\`notes\`,\`created_at\`) VALUES (${a.id},${a.employee_id},'${dateStr}',${checkIn},${checkOut},${inLat},${inLng},${outLat},${outLng},${a.face_verified || 0},${a.geo_verified || 0},'${a.status || 'present'}',${notes},${createdAt});\n`;
  }
  sql += '\n';

  const [reports] = await conn.query('SELECT * FROM daily_reports ORDER BY report_date ASC, id ASC');
  for (const r of reports) {
    const tasks = (r.tasks || '').replace(/'/g, "\\'");
    const rDate = new Date(r.report_date).toISOString().slice(0, 10);
    const notes = r.notes ? `'${r.notes.replace(/'/g, "\\'")}'` : 'NULL';
    const createdAt = r.created_at ? `'${new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19)}'` : 'NOW()';
    const updatedAt = r.updated_at ? `'${new Date(r.updated_at).toISOString().replace('T', ' ').slice(0, 19)}'` : 'NOW()';
    sql += `INSERT IGNORE INTO \`daily_reports\` (\`id\`,\`employee_id\`,\`report_date\`,\`tasks\`,\`notes\`,\`created_at\`,\`updated_at\`) VALUES (${r.id},${r.employee_id},'${rDate}','${tasks}',${notes},${createdAt},${updatedAt});\n`;
  }
  sql += '\n';

  sql += `SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================================
-- SETUP SELESAI. SISTEM SIAP DIGUNAKAN DI PRODUKSI DENGAN STATUS BERSIH.
-- ============================================================================
`;

  fs.writeFileSync('ONE_CREATIVA_HOSTINGER_BERSIH_2026.sql', sql, 'utf8');
  fs.writeFileSync('backend/migrations/ONE_CREATIVA_HOSTINGER_BERSIH_2026.sql', sql, 'utf8');
  console.log('✅ File ONE_CREATIVA_HOSTINGER_BERSIH_2026.sql berhasil dibuat!');
  console.log('Ukuran file:', (sql.length / 1024).toFixed(2), 'KB');
  await conn.end();
}

generate().catch(err => {
  console.error('Error generating clean SQL:', err);
  process.exit(1);
});
