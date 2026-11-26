<?php
require __DIR__ . '/backend/config/database.php';
$res = $conn->query("SELECT * FROM billing_invoices LIMIT 5");
if ($res && $res->num_rows > 0) {
    while ($r = $res->fetch_assoc()) {
        echo json_encode($r) . PHP_EOL;
    }
} else {
    echo "No invoices or table empty. Error: " . $conn->error . PHP_EOL;
}

