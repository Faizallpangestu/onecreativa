// Phase 1 only: SELECT/SHOW queries inside a read-only transaction.
// Does not execute database.php (that file performs DDL on connection).
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const root = path.resolve(__dirname, '..');
const flagIndex = process.argv.indexOf('--output');
const outputPath = flagIndex>=0 ? path.resolve(root, process.argv[flagIndex+1]) : path.join(root,'docs','finance','database-audit.json');
if(!outputPath.startsWith(path.join(root,'docs','finance')+path.sep))throw new Error('Audit output must stay within docs/finance.');
const configDir = path.join(root, 'backend', 'config');
const configPath = fs.existsSync(path.join(configDir, 'db_env.php'))
  ? path.join(configDir, 'db_env.php') : path.join(configDir, 'database.php');
const source = fs.readFileSync(configPath, 'utf8');
function literal(name) {
  const match = source.match(new RegExp('\\$' + name + '\\s*=\\s*([\x27\x22])([^\x27\x22]*)\\1\\s*;'));
  if (!match) throw new Error('Unsupported configuration: use literal DB_* values for this audit.');
  return match[2];
}
const relevant = ['accounts','cash_bank_accounts','accounting_periods','journal_entries','journal_lines','accounting_transactions','accounting_source_documents','payment_allocations','accounting_audit_logs','budget_commitments','budget_realizations','vendors','vendor_bills','finance_role_permissions','schema_migrations','finance_records', 'transactions', 'invoice_clients', 'invoice_records',
  'billing_siswa', 'billing_invoices', 'billing_pembayaran', 'billing_terkirim',
  'budget_requests', 'budget_request_items', 'budget_request_history',
  'salary_requests', 'salary_request_history', 'salary_base_rates', 'salary_slips',
  'salary_slip_events', 'payroll', 'payslips', 'reimbursements', 'assets',
  'asset_histories', 'users', 'roles', 'employees', 'departments', 'peserta_intensif',
  'lpk_matching_job', 'accounts', 'journal_entries', 'journal_lines',
  'accounting_periods', 'cash_bank_accounts', 'cash_transactions', 'invoices', 'invoice_items',
  'payments', 'payment_allocations', 'vendors', 'vendor_bills', 'budgets', 'budget_items',
  'budget_approvals', 'budget_realizations', 'fixed_assets', 'audit_logs',
  'bank_statement_lines', 'programs', 'batches'];
async function main() {
  const host = literal('DB_HOST');
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error('This audit is limited to the configured local database.');
  }
  const db = await mysql.createConnection({host, user: literal('DB_USER'),
    password: literal('DB_PASS'), database: literal('DB_NAME'), connectTimeout: 5000,
    supportBigNumbers: true, bigNumberStrings: true, dateStrings: true,
    decimalNumbers: false, multipleStatements: false});
  try {
    await db.query('START TRANSACTION READ ONLY');
    const query = async (sql, params = []) => (await db.execute(sql, params))[0];
    const snapshot = {audited_at: new Date().toISOString(), mode: 'read-only',
      scope: 'configured local database; no customer/employee names, credentials or bank details exported',
      server: (await query('SELECT VERSION() AS version, @@sql_mode AS sql_mode, @@time_zone AS time_zone'))[0]};
    snapshot.tables = await query('SELECT TABLE_NAME AS name, ENGINE AS engine, TABLE_COLLATION AS collation FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME');
    const names = new Set(snapshot.tables.map(t => t.name));
    snapshot.absent_entities = [...new Set(relevant)].filter(t => !names.has(t));
    snapshot.schema = {};
    for (const table of [...names].sort()) {
      const columns = await query('SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS default_value, COLUMN_KEY AS column_key, EXTRA AS extra FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION', [table]);
      const indexes = await query('SELECT INDEX_NAME AS name, NON_UNIQUE AS non_unique, SEQ_IN_INDEX AS position, COLUMN_NAME AS column_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY INDEX_NAME,SEQ_IN_INDEX', [table]);
      const foreignKeys = await query('SELECT k.CONSTRAINT_NAME AS name,k.COLUMN_NAME AS column_name,k.REFERENCED_TABLE_NAME AS target_table,k.REFERENCED_COLUMN_NAME AS target_column,r.UPDATE_RULE AS update_rule,r.DELETE_RULE AS delete_rule FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL', [table]);
      const [{count}] = await query('SELECT COUNT(*) AS count FROM `' + table + '`');
      snapshot.schema[table] = {count, columns, indexes, foreign_keys: foreignKeys};
    }
    const hasColumn = (table, column) => snapshot.schema[table]?.columns.some(c => c.name === column);
    snapshot.quality = {};
    const quality = snapshot.quality;
    if (names.has('finance_records')) {
      quality.finance_categories = await query('SELECT type,category,COUNT(*) AS count,CAST(SUM(amount) AS CHAR) AS total FROM finance_records GROUP BY type,category ORDER BY type,category');
      quality.finance_dates = (await query('SELECT MIN(transaction_date) AS first_date,MAX(transaction_date) AS last_date,SUM(amount<=0) AS nonpositive_amounts,SUM(created_by IS NULL) AS missing_creator FROM finance_records'))[0];
      if (hasColumn('finance_records','photo_path') && hasColumn('finance_records','drive_link')) quality.finance_missing_evidence = (await query("SELECT COUNT(*) AS count FROM finance_records WHERE COALESCE(photo_path,'')='' AND COALESCE(drive_link,'')=''"))[0];
      quality.finance_duplicate_candidates = await query('SELECT type,category,transaction_date,CAST(amount AS CHAR) AS amount,COUNT(*) AS count FROM finance_records GROUP BY type,category,transaction_date,amount,description HAVING COUNT(*)>1');
      if (hasColumn('finance_records','budget_request_id')) quality.budget_finance_links = await query('SELECT type,category,COUNT(*) AS count,CAST(SUM(amount) AS CHAR) AS total FROM finance_records WHERE budget_request_id IS NOT NULL GROUP BY type,category');
      if (hasColumn('finance_records','salary_request_id')) quality.salary_finance_links = await query('SELECT type,category,COUNT(*) AS count,CAST(SUM(amount) AS CHAR) AS total FROM finance_records WHERE salary_request_id IS NOT NULL GROUP BY type,category');
    }
    if (names.has('budget_requests')) {
      quality.budget_statuses = await query('SELECT status,COUNT(*) AS count,CAST(SUM(total_amount) AS CHAR) AS total FROM budget_requests GROUP BY status');
      quality.budget_item_mismatches = (await query('SELECT COUNT(*) AS count FROM budget_requests b LEFT JOIN (SELECT budget_request_id,SUM(total_amount) AS total FROM budget_request_items GROUP BY budget_request_id) i ON i.budget_request_id=b.id WHERE b.total_amount<>COALESCE(i.total,0)'))[0];
    }
    if (names.has('invoice_clients') && names.has('invoice_records')) quality.invoice_client_balances = (await query('SELECT COUNT(*) AS clients,CAST(SUM(c.total_biaya) AS CHAR) AS total_biaya,CAST(SUM(COALESCE(p.paid,0)) AS CHAR) AS recorded_paid,SUM(COALESCE(p.paid,0)>c.total_biaya) AS overpaid_clients FROM invoice_clients c LEFT JOIN (SELECT client_id,SUM(jumlah) AS paid FROM invoice_records GROUP BY client_id) p ON p.client_id=c.id'))[0];
    if (names.has('billing_invoices')) quality.billing_statuses = await query('SELECT status,COUNT(*) AS count,CAST(SUM(total) AS CHAR) AS total FROM billing_invoices GROUP BY status');
    if (names.has('billing_pembayaran')) {
      quality.billing_payment_statuses = await query('SELECT statusVerif,COUNT(*) AS count,CAST(SUM(jumlah) AS CHAR) AS total FROM billing_pembayaran GROUP BY statusVerif');
      if (names.has('billing_invoices')) quality.billing_orphan_payments = (await query('SELECT COUNT(*) AS count FROM billing_pembayaran p LEFT JOIN billing_invoices i ON i.id=p.noInv WHERE i.id IS NULL'))[0];
    }
    if (names.has('salary_requests')) quality.salary_statuses = await query('SELECT status,COUNT(*) AS count,CAST(SUM(total_salary) AS CHAR) AS total FROM salary_requests GROUP BY status');
    if (names.has('reimbursements')) quality.reimbursement_statuses = await query('SELECT status,COUNT(*) AS count,CAST(SUM(amount) AS CHAR) AS total FROM reimbursements GROUP BY status');
    await db.query('ROLLBACK');
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2) + '\n');
    console.log(JSON.stringify({server: snapshot.server, table_count: snapshot.tables.length,
      row_counts: Object.fromEntries(Object.entries(snapshot.schema).map(([k,v]) => [k,v.count])),
      absent_entities: snapshot.absent_entities, quality, artifact: path.relative(root,outputPath)}, null, 2));
  } finally { await db.end(); }
}
main().catch(error => {
  // Avoid logging messages that could contain connection secrets or personal data.
  console.error('Audit failed: ' + (error.code || error.name));
  process.exitCode = 1;
});
