// Static checks of a generated candidate only. No deployment or database writes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.phase2-build-check');
const entries = [];
function visit(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const full = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), 'Release symlinks require explicit review');
    if (entry.isDirectory()) visit(full);
    else {
      const bytes = fs.readFileSync(full);
      entries.push({file: path.relative(output, full).replaceAll('\\', '/'), bytes: bytes.length,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex')});
    }
  }
}
visit(output);
entries.sort((a, b) => a.file.localeCompare(b.file));
const names = entries.map(entry => entry.file);
for (const file of names) {
  assert(!/(^|\/)(db_env\.php|mail\.local\.php|backups|tests|qa)(\/|$)/i.test(file), 'Private artifact file: ' + file);
  assert(!/^api\/(test|debug|check|fix_|schema_dump|show_tables|migrate|db_|add_status_col|assets_migrate|resolve_map|jwt|cors|profile_debug)/i.test(file), 'Diagnostic artifact API: ' + file);
  assert(!/\.(log|bak|env)$/i.test(file), 'Private config/log in artifact');
  if (/^(uploads|storage)\//.test(file)) assert(file.endsWith('/.htaccess'), 'Personal files packaged');
}
for (const file of ['index.html', 'sw.js', 'api/login.php', 'api/session.php', 'api/relationships.php',
  'api/lms_dashboard_stats.php', 'api/sensei_dashboard_stats.php', 'api/student_billing.php', 'api/lpk_matching.php', 'api/overtime.php',
  'services/document_mutations.php', 'config/.htaccess', 'storage/.htaccess', 'vendor/.htaccess',
  'services/.htaccess', 'migrations/.htaccess', 'uploads/photos/.htaccess', 'uploads/invoice/.htaccess', 'uploads/receipts/.htaccess']) {
  assert(names.includes(file), 'Required artifact file missing: ' + file);
}
const providerSecretPattern = /sk-or-v1-[a-z0-9]{32,}|gsk_[a-zA-Z0-9]{32,}|AIza[a-zA-Z0-9_-]{30,}/;
for (const entry of entries.filter(entry => /\.(js|php|json|html)$/.test(entry.file))) {
  assert(!providerSecretPattern.test(fs.readFileSync(path.join(output, entry.file), 'utf8')), 'Embedded provider secret detected in candidate');
}
fs.writeFileSync(path.join(root, 'docs/audit/release-artifact-manifest.json'), JSON.stringify({
  verified_at: new Date().toISOString(), artifact: '.phase2-build-check', production_gate: 'NO-GO', deployed: false,
  files: entries.length, total_bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
  private_data_excluded: true, diagnostic_apis_excluded: true, private_directory_protections_present: true,
  provider_secret_pattern_scan_passed: true,
  scope: 'Static local artifact verification; target web-server enforcement and business acceptance remain unverified', entries,
}, null, 2));
console.log('PASS: ' + entries.length + ' release files hashed; private data/diagnostics excluded; protections present; provider secret pattern scan passed.');
