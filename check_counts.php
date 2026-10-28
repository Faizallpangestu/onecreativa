<?php
require 'backend/config/database.php';

$res = mysqli_query($conn, 'SELECT id FROM employees');
echo "ALL EMPLOYEES: " . mysqli_num_rows($res) . "\n";

$res2 = mysqli_query($conn, 'SELECT e.id FROM employees e JOIN users u ON e.user_id = u.id');
echo "EMPLOYEES WITH USER: " . mysqli_num_rows($res2) . "\n";

$res3 = mysqli_query($conn, 'SELECT e.id FROM employees e JOIN users u ON e.user_id = u.id WHERE u.is_active = 1');
echo "EMPLOYEES WITH ACTIVE USER: " . mysqli_num_rows($res3) . "\n";

// Let's also check if api/employees.php returns different numbers
$res4 = mysqli_query($conn, 'SELECT e.id FROM employees e JOIN users u ON e.user_id = u.id JOIN roles r ON u.role_id = r.id');
echo "EMPLOYEES WITH USER AND ROLE: " . mysqli_num_rows($res4) . "\n";
