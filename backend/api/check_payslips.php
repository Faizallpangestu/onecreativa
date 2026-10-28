<?php
require '../config/database.php';
$res = mysqli_query($conn, 'SELECT * FROM payslips');
$data = [];
while($r = mysqli_fetch_assoc($res)) { $data[] = $r; }
echo json_encode($data);
?>
