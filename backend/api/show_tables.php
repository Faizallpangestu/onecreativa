<?php require __DIR__ . '/../config.php'; $res = $conn->query('SHOW TABLES'); while($row = $res->fetch_array()) echo $row[0] . PHP_EOL;
