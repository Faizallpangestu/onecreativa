<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

function respond($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $role = $_GET['role'] ?? 'karyawan';
    $employee_id = isset($_GET['employee_id']) ? intval($_GET['employee_id']) : 0;
    $month = $_GET['month'] ?? date('Y-m'); // format YYYY-MM
    $date = $_GET['date'] ?? ''; // format YYYY-MM-DD
    if($date!=='')ac_date($date);if(!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/D',$month))ac_fail('Periode laporan tidak valid.');
    
    // For admin, if no employee is specified, show all. For employee, show only theirs.
    $where = "WHERE 1=1";
    
    if ($role === 'karyawan' || $employee_id > 0) {
        $where .= " AND dr.employee_id = $employee_id";
    }
    
    if (!empty($date)) {
        $where .= " AND dr.report_date = '$date'";
    } else {
        $where .= " AND dr.report_date LIKE '$month%'";
    }

    $q = mysqli_query($conn, "
        SELECT dr.*, e.employee_code as nik, e.full_name as name, pos.name as position,
               dr.updated_at as submit_time
        FROM daily_reports dr
        JOIN employees e ON dr.employee_id = e.id
        LEFT JOIN positions pos ON e.position = pos.name
        $where
        ORDER BY dr.report_date DESC, e.full_name ASC
    ");

    $data = [];
    while($row = mysqli_fetch_assoc($q)) {
        // Decode JSON tasks if possible, else keep as string
        $tasks = json_decode($row['tasks'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $row['tasks'] = $tasks;
        }
        $data[] = $row;
    }

    respond(200, [
        "status" => "success",
        "data" => $data
    ]);
} 
else if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $employee_id = isset($data['employee_id']) ? intval($data['employee_id']) : 0;
    $report_date = $data['report_date'] ?? date('Y-m-d');
    $tasks = $data['tasks'] ?? '';
    $notes = $data['notes'] ?? '';
    
    if ($employee_id === 0) {
        respond(400, ["status" => "error", "message" => "Employee ID is required"]);
    }
    
    // Convert tasks array to JSON string if it's an array
    if (is_array($tasks)) {
        $tasks = json_encode($tasks, JSON_UNESCAPED_UNICODE);
    }
    
    $tasks = mysqli_real_escape_string($conn, $tasks);
    $notes = mysqli_real_escape_string($conn, $notes);
    $report_date = mysqli_real_escape_string($conn, $report_date);
    
    // Create column notes if it doesn't exist
    // Schema installed separately; never alter tables during a report save.

    $sql = "INSERT INTO daily_reports (employee_id, report_date, tasks, notes) 
            VALUES ($employee_id, '$report_date', '$tasks', '$notes')
            ON DUPLICATE KEY UPDATE tasks = '$tasks', notes = '$notes', updated_at = current_timestamp()";
            
    if (mysqli_query($conn, $sql)) {
        respond(200, ["status" => "success", "message" => "Laporan berhasil disimpan"]);
    } else {
        respond(500, ["status" => "error", "message" => "Database error: " . mysqli_error($conn)]);
    }
} else {
    respond(405, ["status" => "error", "message" => "Method not allowed"]);
}
?>
