<?php
$installments = [
    ['keterangan' => 'Cicilan 1', 'nominal' => 5000000, 'tanggal' => date('Y-m-d', strtotime('+2 days'))],
    ['keterangan' => 'Cicilan 2', 'nominal' => 3000000, 'tanggal' => '2026-12-15'],
    ['keterangan' => 'Cicilan 3', 'nominal' => 2500000, 'tanggal' => '2027-01-15'],
    ['keterangan' => 'Cicilan 4', 'nominal' => 1500000, 'tanggal' => '2027-02-15'],
    ['keterangan' => 'Cicilan 5', 'nominal' => 1500000, 'tanggal' => '2027-03-15'],
    ['keterangan' => 'Cicilan 6', 'nominal' => 1500000, 'tanggal' => '2027-04-15'],
];

$participantId = 101;
$noInv = 'TGCJ26110002';

// 1. Update participant total_biaya & tipe_pembayaran
$ch = curl_init("https://creativabridging.com/api/index.php?table=participants&id={$participantId}");
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
        'total_biaya' => 15000000,
        'tipe_pembayaran' => 'cicilan',
        'program' => 'Kelas Intensif',
        'fee_status' => 'Pending'
    ])
]);
$resPart = curl_exec($ch);
curl_close($ch);
echo "Update participant result: " . $resPart . PHP_EOL;

// 2. Insert the 6 installment rows
foreach ($installments as $idx => $inst) {
    $itemNo = $idx + 1;
    $payload = [
        'participant_id' => $participantId,
        'nomor_invoice' => "{$noInv}-{$itemNo}",
        'keterangan' => $inst['keterangan'],
        'nominal' => $inst['nominal'],
        'status' => 'Menunggu',
        'tipe' => 'Cicilan',
        'tanggal_tagihan' => $inst['tanggal'],
        'catatan' => $idx === 0 ? 'Tenggat waktu pembayaran 2x24 jam' : 'Pembayaran Termin Ke-' . $itemNo
    ];

    $ch = curl_init("https://creativabridging.com/api/index.php?table=invoices");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    $resInv = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo "Insert {$inst['keterangan']} (HTTP {$code}): {$resInv}" . PHP_EOL;
}
