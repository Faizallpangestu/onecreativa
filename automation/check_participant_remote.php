<?php
$res = @file_get_contents("https://creativabridging.com/api_peserta.php?api_key=CREATIVA_SYNC_SECRET_2026");
$d = json_decode($res, true);
$list = $d['data'] ?? [];
echo "Count from api_peserta: " . count($list) . PHP_EOL;
foreach ($list as $p) {
    $id = $p['id'] ?? '-';
    $name = $p['nama'] ?? $p['name'] ?? $p['namaLengkap'] ?? '-';
    $program = $p['program'] ?? $p['programMinat'] ?? '-';
    $status = $p['status'] ?? '-';
    $feeStatus = $p['fee_status'] ?? '-';
    $feeAmt = $p['fee_amount'] ?? 0;
    echo "ID: $id | $name | Prog: $program | Stat: $status | FeeStat: $feeStatus | FeeAmt: $feeAmt" . PHP_EOL;
}
