<?php
require_once __DIR__ . '/cors.php';
handle_cors();

$keyword = isset($_GET['keyword']) ? $_GET['keyword'] : '#jlpt-n5';
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;

$url = "https://jisho.org/api/v1/search/words?keyword=" . urlencode($keyword) . "&page=" . $page;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json; charset=utf-8');

if ($response === false || $httpCode !== 200) {
    http_response_code($httpCode ?: 500);
    echo json_encode(['error' => 'Failed to fetch from Jisho', 'meta' => ['status' => 500], 'data' => []]);
    exit;
}

echo $response;
