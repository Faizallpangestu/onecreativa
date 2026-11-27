const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const php = process.env.PHP_BIN || 'php';
const testDir = path.join(root, 'backend', 'tests');
const outputDir = path.join(root, 'docs', 'QA_FORM', 'evidence');
const files = fs.readdirSync(testDir).filter((name) => name.endsWith('_test.php')).sort();
const results = [];

fs.mkdirSync(outputDir, { recursive: true });

for (const file of files) {
  const started = Date.now();
  try {
    const stdout = execFileSync(php, [path.join(testDir, file)], {
      cwd: root,
      encoding: 'utf8',
      timeout: 180000,
      env: process.env,
    });
    results.push({ file, status: 'Pass', exit_code: 0, duration_ms: Date.now() - started, stdout: stdout.trim() });
    console.log('PASS ' + file);
  } catch (error) {
    results.push({
      file,
      status: 'Fail',
      exit_code: error.status === undefined ? null : error.status,
      duration_ms: Date.now() - started,
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || error.message || '').trim(),
    });
    console.log('FAIL ' + file + ' (exit ' + (error.status === undefined ? 'n/a' : error.status) + ')');
  }
}

const summary = {
  verified_at: new Date().toISOString(),
  php,
  scope: 'Local backend integration tests using isolated synthetic databases only',
  total: results.length,
  passed: results.filter((item) => item.status === 'Pass').length,
  failed: results.filter((item) => item.status === 'Fail').length,
  results,
};
fs.writeFileSync(path.join(outputDir, 'php-tests.json'), JSON.stringify(summary, null, 2));
console.log('Backend tests: ' + summary.passed + '/' + summary.total + ' passed; evidence docs/QA_FORM/evidence/php-tests.json');
if (summary.failed > 0) process.exitCode = 1;
