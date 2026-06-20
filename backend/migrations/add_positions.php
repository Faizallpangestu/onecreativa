<?php
require '../config/database.php';

$positions = [
    ['General Manager', 0],
    ['Director', 0],
    ['Sensei', 0],
];

$added = 0;
$skipped = 0;

foreach ($positions as [$name, $salary]) {
    $safeName = mysqli_real_escape_string($conn, $name);
    $check = mysqli_query($conn, "SELECT id FROM positions WHERE name = '$safeName'");
    if (mysqli_num_rows($check) > 0) {
        echo "⚠️ '$name' sudah ada, dilewati.<br>";
        $skipped++;
    } else {
        mysqli_query($conn, "INSERT INTO positions (name, base_salary) VALUES ('$safeName', $salary)");
        echo "✅ Jabatan '$name' berhasil ditambahkan!<br>";
        $added++;
    }
}

echo "<br><strong>Selesai! $added ditambahkan, $skipped dilewati.</strong>";
echo "<br><br><a href='javascript:history.back()'>← Kembali</a>";
