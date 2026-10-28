<?php
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/relationships.php';
$a=rs_start($conn);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['message'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Message is required.']);
        exit;
    }

    $userMessage = $input['message'];
    $chatHistory = isset($input['history']) ? $input['history'] : [];
    
    $lowerMessage = strtolower($userMessage);
    
    // FAST PATH: Instant response for common phrases without hitting the API
    $instantJp = null;
    $instantId = null;
    
    if (strpos($lowerMessage, 'ohayou') !== false || strpos($userMessage, 'おはよう') !== false) {
        $instantJp = "Ohayou gozaimasu! Kyou wa genki desu ka?";
        $instantId = "Selamat pagi! Apakah kamu sehat hari ini?";
    } else if (strpos($lowerMessage, 'arigatou') !== false || strpos($userMessage, 'ありがとう') !== false) {
        $instantJp = "Douitashimashite. Itsu demo kiite kudasai ne.";
        $instantId = "Sama-sama. Silakan bertanya kapan saja ya.";
    } else if (strpos($lowerMessage, 'konnichiwa') !== false || strpos($userMessage, 'こんにちは') !== false) {
        $instantJp = "Konnichiwa! Kyou no kaiwa wo hajimemashou ka?";
        $instantId = "Selamat siang! Mari kita mulai percakapan hari ini?";
    } else if (strpos($lowerMessage, 'konbanwa') !== false || strpos($userMessage, 'こんばんは') !== false) {
        $instantJp = "Konbanwa! Kyou no yoru wa nani wo shimasu ka?";
        $instantId = "Selamat malam! Malam ini mau melakukan apa?";
    } else if (strpos($lowerMessage, 'jikoshoukai') !== false || strpos($userMessage, '自己紹介') !== false) {
        $instantJp = "Hajimemashite! Watashi wa Akira-sensei desu. Nihongo no koushi desu. Douzo yoroshiku onegaishimasu!";
        $instantId = "Perkenalkan! Saya Akira-sensei. Saya adalah guru bahasa Jepang. Salam kenal!";
    } else if (strpos($lowerMessage, 'namae') !== false || strpos($userMessage, '名前') !== false) {
        $instantJp = "Watashi no namae wa Akira-sensei desu. Anata no namae wa nan desu ka?";
        $instantId = "Nama saya adalah Akira-sensei. Siapa nama Anda?";
    } else if (strpos($lowerMessage, 'sensei') !== false || strpos($userMessage, '先生') !== false) {
        $instantJp = "Hai, doushita no? Nani ka shitsumon ga arimasu ka?";
        $instantId = "Ya, ada apa? Apakah ada pertanyaan?";
    } else if (strpos($lowerMessage, 'genki') !== false || strpos($userMessage, '元気') !== false) {
        $instantJp = "Watashi wa totemo genki desu! Arigatou.";
        $instantId = "Saya sangat sehat! Terima kasih.";
    } else if (strpos($lowerMessage, 'hai') !== false || strpos($userMessage, 'はい') !== false) {
        $instantJp = "Iidesu ne. Tsugi ni susumimashou.";
        $instantId = "Bagus sekali. Mari kita lanjut ke berikutnya.";
    }

    if ($instantJp) {
        echo json_encode(['japanese' => $instantJp, 'indonesian' => $instantId]);
        exit;
    }

    $apiKey = getenv('CREATIVA_AI_API_KEY') ?: '';
    if($apiKey==='')ac_fail('Layanan kaiwa belum dikonfigurasi administrator.',503);
    
    $systemPrompt = "You are 'Akira-sensei', a Japanese language teacher. Respond to the student in conversational Japanese.
    Crucially, you MUST return your response in purely JSON format exactly like this, without markdown:
    {
      \"japanese\": \"[Your Japanese response strictly in Romaji or Kana/Kanji ONLY, no Indonesian]\",
      \"indonesian\": \"[The Indonesian translation of your response]\"
    }";

    $contents = [];
    foreach ($chatHistory as $msg) {
        $contents[] = [
            'role' => $msg['role'] === 'user' ? 'user' : 'model',
            'parts' => [['text' => $msg['text']]]
        ];
    }
    
    $contents[] = [
        'role' => 'user',
        'parts' => [['text' => $userMessage]]
    ];

    $payload = [
        "system_instruction" => [
            "parts" => [
                ["text" => $systemPrompt]
            ]
        ],
        "contents" => $contents,
        "generationConfig" => [
            "temperature" => 0.7,
            "maxOutputTokens" => 800,
        ]
    ];

    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=" . $apiKey;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        $responseData = json_decode($response, true);
        if (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
            $replyText = $responseData['candidates'][0]['content']['parts'][0]['text'];
            
            // Try to parse JSON from AI response
            $cleanJson = trim(str_replace(['```json', '```'], '', $replyText));
            $parsed = json_decode($cleanJson, true);
            
            if ($parsed && isset($parsed['japanese'])) {
                echo json_encode($parsed);
                exit;
            }
        }
        // If JSON parsing fails but request succeeded
        echo json_encode(['japanese' => 'Sumimasen, mou ichido itte kudasai.', 'indonesian' => 'Maaf, tolong ucapkan sekali lagi.']);
        exit;
    } else {
        // Fallback Mock Response (when API is in high demand / 503)
        $lowerMessage = strtolower($userMessage);
        
        // Intelligent fallback
        $jp = "Sumimasen, ima chotto isogashii desu. Mou ichido itte kudasai.";
        $id = "Maaf, saya sedang agak sibuk sekarang. Tolong ucapkan sekali lagi.";
        
        if (strpos($lowerMessage, 'ohayou') !== false || strpos($userMessage, 'おはよう') !== false) {
            $jp = "Ohayou gozaimasu! Kyou wa genki desu ka?";
            $id = "Selamat pagi! Apakah kamu sehat hari ini?";
        } else if (strpos($lowerMessage, 'arigatou') !== false || strpos($userMessage, 'ありがとう') !== false) {
            $jp = "Douitashimashite. Itsu demo kiite kudasai ne.";
            $id = "Sama-sama. Silakan bertanya kapan saja ya.";
        } else if (strpos($lowerMessage, 'konnichiwa') !== false || strpos($userMessage, 'こんにちは') !== false) {
            $jp = "Konnichiwa! Kyou no kaiwa wo hajimemashou ka?";
            $id = "Selamat siang! Mari kita mulai percakapan hari ini?";
        } else if (strpos($lowerMessage, 'konbanwa') !== false || strpos($userMessage, 'こんばんは') !== false) {
            $jp = "Konbanwa! Kyou no yoru wa nani wo shimasu ka?";
            $id = "Selamat malam! Malam ini mau melakukan apa?";
        } else if (strpos($lowerMessage, 'sensei') !== false || strpos($userMessage, '先生') !== false) {
            $jp = "Hai, doushita no? Nani ka shitsumon ga arimasu ka?";
            $id = "Ya, ada apa? Apakah ada pertanyaan?";
        } else if (strpos($lowerMessage, 'genki') !== false || strpos($userMessage, '元気') !== false) {
            $jp = "Watashi wa totemo genki desu! Arigatou.";
            $id = "Saya sangat sehat! Terima kasih.";
        } else if (strpos($lowerMessage, 'hai') !== false || strpos($userMessage, 'はい') !== false) {
            $jp = "Iidesu ne. Tsugi ni susumimashou.";
            $id = "Bagus sekali. Mari kita lanjut ke berikutnya.";
        }

        echo json_encode(['japanese' => $jp, 'indonesian' => $id]);
        exit;
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
}
