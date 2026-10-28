const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const build = path.resolve(root, '.phase2-build-check');
const routes = [];
let precache = [];
class NetworkOnly {}
class CacheFirst {}
class NavigationRoute {}
class ExpirationPlugin {}
class CacheableResponsePlugin {}
const workbox = {
  clientsClaim() {}, cleanupOutdatedCaches() {},
  precacheAndRoute(entries) { precache = entries; },
  registerRoute(match, handler) { routes.push({ match, handler }); },
  createHandlerBoundToURL() {}, NetworkOnly, CacheFirst,
  NavigationRoute, ExpirationPlugin, CacheableResponsePlugin,
};
const context = { self: { define() {}, skipWaiting() {} }, define(deps, callback) { callback(workbox); } };
vm.runInNewContext(fs.readFileSync(path.join(build, 'sw.js'), 'utf8'), context);
for (const endpoint of ['accounting.php?view=proof&id=1', 'session.php', 'billing.php', 'finance.php', 'dashboard_stats.php', 'lms_submissions.php', 'employees.php', 'reimbursements.php']) {
  const rule = routes.find(r => typeof r.match?.test === 'function' && r.match.test('https://qa.example/api/' + endpoint));
  assert(rule?.handler instanceof NetworkOnly, 'API must never return cached data: ' + endpoint);
}
assert(precache.length > 0 && precache.every(e => !/(?:\.php|\.sql|backups\/|storage\/|uploads\/)/i.test(e.url)), 'Precache contains private/backend data');

// Exercise the real packaging function against a small synthetic tree.
const fixture = fs.mkdtempSync(path.join(build, 'package-check-'));
try {
  for (const file of ['backend/migrations/populate_positions.php','backend/migrations/create_overtime_requests.sql','backend/uploads/intensif/private.png','backend/uploads/intensif/.htaccess','backend/services/.htaccess','backend/migrations/.htaccess','backend/config/db_env.php', 'backend/config/mail.local.php', 'backend/storage/backups/database.sql', 'backend/storage/.htaccess', 'backend/storage/finance-proofs/private.bin', 'backend/tests/private.php', 'backend/api/debug.php', 'backend/api/accounting.php', 'backend/api/maintenance.php', 'backend/api/resolve_map.php', 'backend/migrations/finance_traceability.php', 'backend/services/accounting_core.php']) {
    const target = path.join(fixture, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'synthetic packaging fixture');
  }
  const source = fs.readFileSync(path.join(root, 'copy-backend.js'), 'utf8');
  const fn = source.slice(source.indexOf('function copyDir('), source.indexOf('\ntry {'));
  const copy = new Function('fs', 'path', '__dirname', fn + '\nreturn copyDir;')(fs, path, fixture);
  const destination = path.join(fixture, 'dist');
  copy(path.join(fixture, 'backend'), destination);
  for (const file of ['migrations/populate_positions.php','migrations/create_overtime_requests.sql','uploads/intensif/private.png','config/db_env.php', 'config/mail.local.php', 'storage/backups/database.sql', 'storage/finance-proofs/private.bin', 'tests/private.php', 'api/debug.php','api/resolve_map.php']) assert(!fs.existsSync(path.join(destination, file)), 'Private/diagnostic file was packaged: ' + file);
  for (const file of ['uploads/intensif/.htaccess','services/.htaccess','migrations/.htaccess','storage/.htaccess', 'api/accounting.php', 'api/maintenance.php', 'migrations/finance_traceability.php', 'services/accounting_core.php']) assert(fs.existsSync(path.join(destination, file)), 'Business/protection file missing: ' + file);
} finally {
  const resolved = path.resolve(fixture);
  assert(path.dirname(resolved) === build && path.basename(resolved).startsWith('package-check-'), 'Unsafe fixture cleanup');
  fs.rmSync(resolved, { recursive: true, force: true });
}
console.log('PASS: generated service worker uses NetworkOnly for API; precache excludes private data; backend packaging preserves business endpoints and excludes private/diagnostic files.');
