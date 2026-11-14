<?php
$res = file_get_contents('https://creativabridging.com/api/index.php?table=participants');
$data = json_decode($res, true);
if (is_array($data)) {
    foreach ($data as $p) {
        if (stripos($p['name'] ?? '', 'Faizal') !== false) {
            echo "ID: " . $p['id'] . " | Name: " . $p['name'] . " | Email: " . ($p['email'] ?? '') . " | Total Biaya: " . ($p['total_biaya'] ?? '-') . PHP_EOL;
        }
    }
} else {
    echo "Failed to load or not an array\n";
}
