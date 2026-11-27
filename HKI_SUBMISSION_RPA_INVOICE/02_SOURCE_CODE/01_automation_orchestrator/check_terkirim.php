<?php
require 'c:/Muhammadfaizal/htdocs/One-creativa/backend/config/database.php';
$r = $conn->query("SELECT * FROM billing_terkirim ORDER BY created_at DESC LIMIT 10");
while ($row = $r->fetch_assoc()) {
    echo json_encode($row, JSON_PRETTY_PRINT) . PHP_EOL;
}
