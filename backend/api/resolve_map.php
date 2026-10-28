<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$body = json_decode(file_get_contents("php://input"), true);
$url = $body['url'] ?? '';

if (empty($url)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "URL kosong"]);
    exit;
}

// Gunakan stream context agar get_headers mengikuti redirect
$context = stream_context_create([
    'http' => [
        'method' => 'HEAD',
        'follow_location' => 0 // Jangan ikuti redirect otomatis, biarkan kita baca header Location
    ]
]);

$headers = @get_headers($url, 1, $context);
$final_url = $url;

if (isset($headers['Location'])) {
    $final_url = is_array($headers['Location']) ? end($headers['Location']) : $headers['Location'];
} else {
    // Coba ikuti redirect menggunakan cURL jika get_headers gagal
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    $response = curl_exec($ch);
    
    if(preg_match('/^Location: (.+)$/im', $response, $matches)){
        $final_url = trim($matches[1]);
    }
    curl_close($ch);
}

// Cari koordinat dari URL
preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $final_url, $matches_at);
preg_match('/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/', $final_url, $matches_bang);

$lat = null;
$lon = null;

// !3d !4d lebih presisi (pin point), dahulukan
if (!empty($matches_bang)) {
    $lat = $matches_bang[1];
    $lon = $matches_bang[2];
} elseif (!empty($matches_at)) {
    $lat = $matches_at[1];
    $lon = $matches_at[2];
}

if ($lat && $lon) {
    echo json_encode([
        "status" => "success",
        "latitude" => $lat,
        "longitude" => $lon,
        "final_url" => $final_url
    ]);
} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Tidak dapat mengekstrak koordinat dari link tersebut", 
        "final_url" => $final_url,
        "headers" => $headers
    ]);
}
