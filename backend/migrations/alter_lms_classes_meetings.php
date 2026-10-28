<?php
require_once __DIR__ . '/../config/database.php';

$sql = "ALTER TABLE lms_classes 
    ADD COLUMN IF NOT EXISTS schedule_days VARCHAR(100) DEFAULT 'Senin & Rabu' AFTER level,
    ADD COLUMN IF NOT EXISTS schedule_time VARCHAR(100) DEFAULT '08:00 - 09:30' AFTER schedule_days,
    ADD COLUMN IF NOT EXISTS total_meetings INT DEFAULT 32 AFTER schedule_time,
    ADD COLUMN IF NOT EXISTS completed_meetings INT DEFAULT 0 AFTER total_meetings";

if ($conn->query($sql)) {
    echo "Columns added to lms_classes successfully." . PHP_EOL;
} else {
    echo "Error: " . $conn->error . PHP_EOL;
}

$res = $conn->query("DESCRIBE lms_classes");
while ($r = $res->fetch_assoc()) {
    echo $r['Field'] . ' (' . $r['Type'] . ')' . PHP_EOL;
}
