<?php
require 'backend/config/database.php';
$result = mysqli_query($conn, "DESCRIBE employees");
while ($row = mysqli_fetch_assoc($result)) {
    echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . "\n";
}
