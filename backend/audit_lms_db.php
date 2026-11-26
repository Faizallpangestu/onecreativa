<?php
require_once __DIR__ . '/config/database.php';

$tables = ['lms_submissions', 'lms_gradebook_items', 'lms_gradebook_grades', 'lms_kaiwa_sessions', 'lms_kaiwa_scenarios', 'lms_meetings', 'lms_teaching_assignments', 'lms_competencies', 'lms_activities'];

foreach ($tables as $t) {
    echo PHP_EOL . "=== TABLE: $t ===" . PHP_EOL;
    $q = $conn->query("DESCRIBE `$t`");
    if ($q) {
        while ($r = $q->fetch_assoc()) {
            echo "  " . str_pad($r['Field'], 24) . " " . str_pad($r['Type'], 20) . " " . $r['Null'] . " " . $r['Key'] . PHP_EOL;
        }
    } else {
        echo "  Table does not exist" . PHP_EOL;
    }
}
