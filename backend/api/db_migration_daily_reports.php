<?php
require '../config/database.php';

$sql = "CREATE TABLE IF NOT EXISTS `daily_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `report_date` date NOT NULL,
  `tasks` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `emp_date` (`employee_id`, `report_date`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";

if (mysqli_query($conn, $sql)) {
    echo "Table daily_reports created successfully.";
} else {
    echo "Error creating table: " . mysqli_error($conn);
}
?>
