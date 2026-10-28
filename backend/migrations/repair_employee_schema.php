<?php
/**
 * Repair script for Employee & Positions Schema and Relations.
 * Can be run via CLI: php backend/migrations/repair_employee_schema.php
 * Or via browser by authenticated Super Admin.
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/accounting_core.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== STARTING REPAIR & SCHEMA MIGRATION ===\n\n";

// 1. Ensure positions columns exist
$positionCols = [
    'department_id' => 'INT NULL',
    'base_salary'   => 'DECIMAL(15,2) DEFAULT 0',
    'level'         => "VARCHAR(50) DEFAULT 'Staff'",
    'tunjangan'     => 'DECIMAL(15,2) DEFAULT 0',
    'is_active'     => 'TINYINT(1) DEFAULT 1',
    'description'   => 'TEXT NULL'
];

foreach ($positionCols as $col => $def) {
    $exists = ac_one($conn, "SHOW COLUMNS FROM positions LIKE '$col'");
    if (!$exists) {
        $conn->query("ALTER TABLE positions ADD COLUMN $col $def");
        echo "✅ Added column '$col' to positions.\n";
    } else {
        echo "ℹ️ Column '$col' already exists in positions.\n";
    }
}

// 2. Ensure roles.label column exists
$roleLabelExists = ac_one($conn, "SHOW COLUMNS FROM roles LIKE 'label'");
if (!$roleLabelExists) {
    $conn->query("ALTER TABLE roles ADD COLUMN label VARCHAR(100) DEFAULT '' AFTER name");
    echo "✅ Added column 'label' to roles.\n";
} else {
    echo "ℹ️ Column 'label' already exists in roles.\n";
}

$adminUser = ac_one($conn, "SELECT id, email FROM users WHERE email = 'admin@onecreativa.com' LIMIT 1");
if ($adminUser) {
    ac_query($conn, "UPDATE employees SET full_name = 'Administrator' WHERE user_id = ? AND employee_code <> '2260005'", [(int)$adminUser['id']]);
    echo "✅ Synchronized Administrator profile for {$adminUser['email']}.\n";
}

// 3. Fix orphaned employee records
$orphans = ac_rows($conn, "SELECT e.id, e.employee_code, e.full_name, e.user_id FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE u.id IS NULL");
echo "\nChecking orphaned employees (total found: " . count($orphans) . ")...\n";

foreach ($orphans as $emp) {
    $eid = (int)$emp['id'];
    $name = $emp['full_name'];
    $oldUid = $emp['user_id'];
    echo "Processing orphan employee ID: $eid ($name), previous user_id: $oldUid\n";

    // If it's Muhammad Faizal, connect to his own karyawan account
    if (stripos($name, 'Faizal') !== false || $emp['employee_code'] === '2260005') {
        $karyawanRole = ac_one($conn, "SELECT id FROM roles WHERE name = 'karyawan' LIMIT 1");
        $kRoleId = $karyawanRole ? (int)$karyawanRole['id'] : 6;
        $faizalUser = ac_one($conn, "SELECT id, email FROM users WHERE email = 'muhammadfaizal.mf10@gmail.com' LIMIT 1");
        if ($faizalUser) {
            $newUid = (int)$faizalUser['id'];
            ac_query($conn, "UPDATE users SET role_id = ?, is_active = 1 WHERE id = ?", [$kRoleId, $newUid]);
        } else {
            $pwdHash = password_hash('creativa2026', PASSWORD_DEFAULT);
            ac_query($conn, "INSERT INTO users(email, password_hash, role_id, is_active, created_at, updated_at) VALUES ('muhammadfaizal.mf10@gmail.com', ?, ?, 1, NOW(), NOW())", [$pwdHash, $kRoleId]);
            $newUid = (int)$conn->insert_id;
        }
        ac_query($conn, "UPDATE employees SET user_id = ?, full_name = 'Muhammad Faizal' WHERE id = ?", [$newUid, $eid]);
        echo "  -> Linked employee Muhammad Faizal (ID $eid) to karyawan user muhammadfaizal.mf10@gmail.com (ID $newUid).\n";
        continue;
    }

    // Try finding by name or email in other tables, or create fresh user
    $karyawanRole = ac_one($conn, "SELECT id FROM roles WHERE name = 'karyawan' LIMIT 1");
    $roleId = $karyawanRole ? (int)$karyawanRole['id'] : 6;
    $genEmail = 'emp_' . $eid . '@onecreativa.com';
    $pwdHash = password_hash('creativa2026', PASSWORD_DEFAULT);

    ac_query($conn, "INSERT INTO users(email, password_hash, role_id, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())", [$genEmail, $pwdHash, $roleId]);
    $newUid = (int)$conn->insert_id;
    ac_query($conn, "UPDATE employees SET user_id = ? WHERE id = ?", [$newUid, $eid]);
    echo "  -> Created new user $genEmail (ID $newUid) and linked to employee $name (ID $eid).\n";
}

echo "\n=== REPAIR COMPLETE ===\n";
