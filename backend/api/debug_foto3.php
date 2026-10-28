<?php
require_once 'cors.php';
require_once '../config/database.php';

$query = mysqli_query($conn, "DESCRIBE users");
$data = [];
while ($row = mysqli_fetch_assoc($query)) {
    $data[] = $row;
}
echo json_encode($data);
