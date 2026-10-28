<?php
require '../config/database.php';
$q = mysqli_query($conn, 'SELECT id, full_name, photo_url FROM employees LIMIT 5');
while($r = mysqli_fetch_assoc($q)){
    echo $r['id'] . " - " . $r['full_name'] . " - " . $r['photo_url'] . "\n";
}
