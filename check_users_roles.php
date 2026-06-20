<?php
require 'backend/config/database.php';
echo "--- users ---\n";
$res = mysqli_query($conn, "DESCRIBE users");
while($row = mysqli_fetch_assoc($res)) echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . "\n";

echo "--- roles ---\n";
$res = mysqli_query($conn, "DESCRIBE roles");
while($row = mysqli_fetch_assoc($res)) echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . "\n";
