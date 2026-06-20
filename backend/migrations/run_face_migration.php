<?php
// run_face_migration.php
// Jalankan: http://localhost/hris-creativa/backend/migrations/run_face_migration.php

header("Content-Type: text/html; charset=utf-8");
require '../config/database.php';

$sql = file_get_contents(__DIR__ . '/face_attendance_migration.sql');

// Hapus komentar, split per statement
$statements = [];
$lines = explode("\n", $sql);
$current = "";
foreach ($lines as $line) {
    $line = trim($line);
    if (str_starts_with($line, "--") || $line === "") continue;
    $current .= " " . $line;
    if (str_ends_with(rtrim($line), ";")) {
        $stmt = trim($current);
        if ($stmt !== ";") $statements[] = $stmt;
        $current = "";
    }
}

$results = [];
$errors  = [];

foreach ($statements as $stmt) {
    $stmt = trim($stmt, " ;");
    if (empty($stmt)) continue;
    
    $ok = mysqli_query($conn, $stmt);
    if ($ok) {
        $results[] = "✅ OK: " . substr($stmt, 0, 80) . "...";
    } else {
        $err = mysqli_error($conn);
        // Ignore "Duplicate column" dan "already exists" errors (migration idempotent)
        if (strpos($err, "Duplicate column") !== false || strpos($err, "already exists") !== false) {
            $results[] = "⚠️ Skip (sudah ada): " . substr($stmt, 0, 60);
        } else {
            $errors[] = "❌ ERROR: $err | SQL: " . substr($stmt, 0, 80);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head><title>Face Migration</title>
<style>
  body { font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 24px; }
  h1 { color: #60a5fa; }
  .ok { color: #4ade80; margin: 4px 0; }
  .skip { color: #facc15; margin: 4px 0; }
  .error { color: #f87171; margin: 4px 0; }
  .done { background: #14532d; border: 1px solid #16a34a; padding: 16px; border-radius: 8px; margin-top: 20px; }
  .has-error { background: #450a0a; border: 1px solid #dc2626; padding: 16px; border-radius: 8px; margin-top: 20px; }
</style>
</head>
<body>
<h1>🚀 Face Attendance Migration</h1>
<p style="color:#94a3b8">Database: <b style="color:#fff">hris_creativa</b></p>
<hr style="border-color:#334155;margin:16px 0">

<?php foreach ($results as $r): ?>
  <p class="<?= str_starts_with($r, '⚠️') ? 'skip' : 'ok' ?>"><?= htmlspecialchars($r) ?></p>
<?php endforeach; ?>

<?php foreach ($errors as $e): ?>
  <p class="error"><?= htmlspecialchars($e) ?></p>
<?php endforeach; ?>

<?php if (empty($errors)): ?>
  <div class="done">
    <p style="font-size:18px;margin:0">✅ Migration selesai tanpa error!</p>
    <p style="margin:8px 0 0;color:#86efac">Tabel yang dibuat: face_enrollments, face_attendance_logs, work_schedules</p>
    <p style="margin:8px 0 0;color:#86efac">Kolom baru di attendance: check_in_method, check_out_method, face_confidence, face_snapshot</p>
    <br>
    <a href="http://localhost/hris-creativa/frontend/" style="color:#60a5fa">→ Buka Aplikasi HRIS</a>
  </div>
<?php else: ?>
  <div class="has-error">
    <p style="font-size:18px;margin:0">⚠️ Ada <?= count($errors) ?> error. Cek output di atas.</p>
  </div>
<?php endif; ?>

</body>
</html>
