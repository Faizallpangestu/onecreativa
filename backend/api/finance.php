<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
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

// GET: Fetch finance records
if ($method === 'GET') {
    $where = [];
    if (!empty($_GET['type'])) {
        $type = mysqli_real_escape_string($conn, $_GET['type']);
        $where[] = "type = '$type'";
    }
    if (!empty($_GET['month']) && !empty($_GET['year'])) {
        $month = (int)$_GET['month'];
        $year = (int)$_GET['year'];
        $where[] = "MONTH(transaction_date) = $month AND YEAR(transaction_date) = $year";
    }

    $whereStr = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $query = "SELECT f.*, e.full_name as creator_name 
              FROM finance_records f 
              LEFT JOIN employees e ON f.created_by = e.user_id 
              $whereStr 
              ORDER BY f.transaction_date DESC, f.id DESC";
              
    $result = mysqli_query($conn, $query);
    if (!$result) {
        respond(500, ["status" => "error", "message" => mysqli_error($conn)]);
    }

    $data = [];
    $total_income = 0;
    $total_expense = 0;

    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
        if ($row['type'] === 'income') $total_income += (float)$row['amount'];
        if ($row['type'] === 'expense') $total_expense += (float)$row['amount'];
    }

    respond(200, [
        "status" => "success", 
        "data" => $data,
        "summary" => [
            "total_income" => $total_income,
            "total_expense" => $total_expense,
            "profit" => $total_income - $total_expense
        ]
    ]);
}

// POST: Add new record
if ($method === 'POST') {
    $rawBody = file_get_contents("php://input");
    $data = json_decode($rawBody, true);

    if (!$data && !empty($_POST)) {
        $data = $_POST;
    }

    $type = $data['type'] ?? '';
    $category = $data['category'] ?? 'Lainnya';
    $amount = (float)($data['amount'] ?? 0);
    $description = $data['description'] ?? '';
    $transaction_date = $data['transaction_date'] ?? date('Y-m-d');
    $created_by = (int)($data['user_id'] ?? 0); // Assuming user_id is sent

    if (!in_array($type, ['income', 'expense']) || $amount <= 0) {
        respond(400, ["status" => "error", "message" => "Tipe transaksi atau nominal tidak valid"]);
    }

    $safeCat = mysqli_real_escape_string($conn, $category);
    $safeDesc = mysqli_real_escape_string($conn, $description);
    $safeDate = mysqli_real_escape_string($conn, $transaction_date);

    $creatorSql = $created_by > 0 ? $created_by : "NULL";

    $sql = "INSERT INTO finance_records (type, category, amount, description, transaction_date, created_by) 
            VALUES ('$type', '$safeCat', $amount, '$safeDesc', '$safeDate', $creatorSql)";

    if (mysqli_query($conn, $sql)) {
        respond(201, ["status" => "success", "message" => "Transaksi berhasil ditambahkan"]);
    } else {
        respond(500, ["status" => "error", "message" => "Gagal menyimpan transaksi: " . mysqli_error($conn)]);
    }
}

// DELETE: Remove record
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        respond(400, ["status" => "error", "message" => "ID tidak valid"]);
    }

    $sql = "DELETE FROM finance_records WHERE id = $id";
    if (mysqli_query($conn, $sql)) {
        respond(200, ["status" => "success", "message" => "Transaksi dihapus"]);
    } else {
        respond(500, ["status" => "error", "message" => "Gagal menghapus: " . mysqli_error($conn)]);
    }
}

respond(405, ["status" => "error", "message" => "Method not allowed"]);
