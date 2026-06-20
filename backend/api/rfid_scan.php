<?php
header("Content-Type: application/json");
require '../config/database.php';

// ambil UID terakhir dari log (simulasi)
$query = mysqli_query($conn, "
SELECT * FROM attendance_logs 
ORDER BY id DESC LIMIT 1
");

$data = mysqli_fetch_assoc($query);

echo json_encode([
  "status" => "success",
  "rfid_uid" => $data['rfid_uid'] ?? null
]);