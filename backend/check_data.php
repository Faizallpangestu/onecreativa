<?php
require_once __DIR__ . '/config/database.php';

echo "=== LMS QUIZZES TABLE ===" . PHP_EOL;
$res = $conn->query("SELECT id, title, class_id, class_name, bab, level, quiz_type, total_questions, duration_minutes, status FROM lms_quizzes");
if ($res) {
    while ($r = $res->fetch_assoc()) {
        echo json_encode($r, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
    }
}

echo "=== LMS MATERIALS TABLE ===" . PHP_EOL;
$mRes = $conn->query("SELECT id, class_id, title, chapter_bab, level, file_name, file_size FROM lms_materials");
if ($mRes) {
    while ($m = $mRes->fetch_assoc()) {
        echo json_encode($m, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
    }
}

echo "=== LMS CLASSES TABLE ===" . PHP_EOL;
$cRes = $conn->query("SELECT id, name, level, batch_id, status FROM lms_classes LIMIT 10");
if ($cRes) {
    while ($c = $cRes->fetch_assoc()) {
        echo json_encode($c, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
    }
}
