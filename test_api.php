<?php
$data = array(
    "employee_id" => 7,
    "type" => "clock_in",
    "confidence" => 1.0,
    "snapshot" => null,
    "latitude" => null,
    "longitude" => null
);
$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    )
);
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8001/face_clock.php', false, $context);
if ($result === FALSE) {
    echo "Error";
} else {
    echo $result;
}
?>
