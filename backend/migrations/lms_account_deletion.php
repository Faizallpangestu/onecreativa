<?php
// Run once from the command line before enabling LMS account deletion.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../config/database.php';
function install_lms_account_deletion(mysqli $db): void {
    $column = $db->query("SHOW COLUMNS FROM users LIKE 'deleted_at'")->fetch_assoc();
    if (!$column) $db->query('ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL');
}
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    install_lms_account_deletion($conn);
    echo "LMS account deletion schema ready.\n";
}
