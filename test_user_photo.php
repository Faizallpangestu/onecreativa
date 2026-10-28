<?php
require 'backend/config/database.php';
$q=mysqli_query($conn, "SELECT id, full_name, photo_url FROM employees WHERE full_name LIKE '%faizal%'");
while($r=mysqli_fetch_assoc($q)) {
    print_r($r);
}
