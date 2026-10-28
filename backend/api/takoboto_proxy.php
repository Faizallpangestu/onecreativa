<?php
require_once __DIR__ . '/cors.php';
handle_cors();

$q = isset($_GET['q']) ? trim($_GET['q']) : 'taberu';
$url = "https://takoboto.jp/?q=" . urlencode($q);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 12);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json; charset=utf-8');

if ($response === false || $httpCode !== 200) {
    http_response_code($httpCode ?: 500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to reach Takoboto.jp', 'results' => []]);
    exit;
}

// Basic parse of ResultDiv entries from Takoboto HTML
$results = [];
if (preg_match_all('/<div class="ResultDiv"[^>]*>(.*?)<\/div>\s*<\/div>/is', $response, $matches)) {
    foreach ($matches[1] as $block) {
        $kanjiKana = '';
        $pos = '';
        $meaning = '';
        $jlpt = '';
        $wordId = '';

        if (preg_match('/ResultWordId\d+\s+value="(\d+)"/i', $block, $wMatch)) {
            $wordId = $wMatch[1];
        }
        if (preg_match('/<div[^>]*lang="ja"[^>]*>(.*?)<\/div>/is', $block, $kkMatch)) {
            $kanjiKana = strip_tags($kkMatch[1]);
        }
        if (preg_match('/<span style="color:#A0A0A0">([^<]+verb|[^<]+noun|[^<]+adjective|[^<]+expression[^<]*)<\/span>/i', $block, $pMatch)) {
            $pos = trim($pMatch[1]);
        }
        if (preg_match('/<span>([^<]{3,80})<\/span>/i', $block, $mMatch)) {
            $meaning = trim($mMatch[1]);
        }
        if (preg_match('/N([1-5])/i', $block, $jlptMatch)) {
            $jlpt = 'N' . $jlptMatch[1];
        }

        if ($kanjiKana) {
            $results[] = [
                'wordId' => $wordId,
                'kanjiKana' => trim($kanjiKana),
                'partOfSpeech' => $pos ?: 'Vocabulary',
                'meaning' => $meaning,
                'jlpt' => $jlpt ?: 'N5',
                'takobotoUrl' => "https://takoboto.jp/?q=" . urlencode($q)
            ];
        }
        if (count($results) >= 10) break;
    }
}

echo json_encode([
    'status' => 'success',
    'query' => $q,
    'source' => 'Takoboto.jp',
    'results' => $results
]);
