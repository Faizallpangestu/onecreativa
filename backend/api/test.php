<?php
require '../config/database.php';

function getTable($conn, $table) {
    echo "TABLE: $table\n";
    $res = mysqli_query($conn, "DESCRIBE $table");
    while($r = mysqli_fetch_assoc($res)) {
        echo $r['Field'] . " - " . $r['Type'] . "\n";
    }
    echo "\n";
}

getTable($conn, 'users');
getTable($conn, 'roles');
getTable($conn, 'employees');
