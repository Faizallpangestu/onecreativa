<?php
require 'backend/config/database.php';
$q = mysqli_query($conn, "SELECT * FROM attendance_logs WHERE date BETWEEN '2026-06-23' AND '2026-06-26'");
while($r=mysqli_fetch_assoc($q)) echo json_encode($r)."\n";
