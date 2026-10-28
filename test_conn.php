<?php
$conn = mysqli_connect('localhost', 'root', '');
if ($conn) {
    $result = mysqli_query($conn, "SHOW DATABASES");
    while ($row = mysqli_fetch_row($result)) {
        echo $row[0] . "\n";
    }
} else {
    echo mysqli_connect_error();
}
?>
