<?php
require_once 'cors.php';
require_once '../config/database.php';

// Check if category column exists, if not add it
$checkCol = mysqli_query($conn, "SHOW COLUMNS FROM lms_tasks LIKE 'category'");
if (mysqli_num_rows($checkCol) == 0) {
    mysqli_query($conn, "ALTER TABLE lms_tasks ADD COLUMN category VARCHAR(50) DEFAULT 'tugas'");
}

// Check if grade_type column exists in lms_submissions, wait, the grade is already there. No need for grade_type because submission links to task.
echo "Migrated";
