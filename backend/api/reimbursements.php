<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

function respond($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

// =======================
// GET: Ambil Data Klaim
// =======================
if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $role = isset($_GET['role']) ? $_GET['role'] : 'karyawan';

    // Jika Finance / Admin, kembalikan semua data
    if (in_array($role, ['finance', 'admin', 'super_admin'])) {
        $sql = "SELECT r.*, e.full_name as employee_name, e.employee_code 
                FROM reimbursements r 
                LEFT JOIN users u ON r.user_id = u.id 
                LEFT JOIN employees e ON u.id = e.user_id 
                ORDER BY r.created_at DESC";
        $query = mysqli_query($conn, $sql);
    } else {
        // Jika Karyawan biasa, kembalikan hanya miliknya
        if ($user_id === 0) {
            respond(400, ["status" => "error", "message" => "Missing user_id"]);
        }
        $sql = "SELECT * FROM reimbursements WHERE user_id = $user_id ORDER BY created_at DESC";
        $query = mysqli_query($conn, $sql);
    }

    $data = [];
    while ($row = mysqli_fetch_assoc($query)) {
        $data[] = $row;
    }
    respond(200, ["status" => "success", "data" => $data]);
}

// ==================================
// POST: Ajukan Klaim (Upload Foto)
// ==================================
if ($method === 'POST') {
    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $category = $_POST['category'] ?? '';
    $amount = $_POST['amount'] ?? 0;
    $description = $_POST['description'] ?? '';

    // Validasi input
    if ($user_id === 0 || empty($category) || empty($amount) || empty($description)) {
        respond(400, ["status" => "error", "message" => "Harap isi semua field (Nominal, Kategori, Deskripsi)"]);
    }

    // Validasi file upload
    if (!isset($_FILES['receipt']) || $_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
        respond(400, ["status" => "error", "message" => "Gagal mengunggah foto struk. Pastikan file dipilih."]);
    }

    // Buat direktori jika belum ada
    $uploadDir = '../uploads/receipts/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Ekstensi file
    $fileExt = strtolower(pathinfo($_FILES['receipt']['name'], PATHINFO_EXTENSION));
    $allowedExt = ['jpg', 'jpeg', 'png', 'pdf'];
    if (!in_array($fileExt, $allowedExt)) {
        respond(400, ["status" => "error", "message" => "Format file tidak valid. Harap unggah format JPG, PNG, atau PDF."]);
    }

    // Generate nama file unik agar tidak bentrok
    $fileName = time() . '_' . rand(1000, 9999) . '.' . $fileExt;
    $targetPath = $uploadDir . $fileName;

    // Pindahkan file ke server
    if (!move_uploaded_file($_FILES['receipt']['tmp_name'], $targetPath)) {
        respond(500, ["status" => "error", "message" => "Gagal menyimpan file ke server."]);
    }

    // Simpan ke DB
    $receipt_path = 'uploads/receipts/' . $fileName;
    $categoryEsc = mysqli_real_escape_string($conn, $category);
    $descEsc = mysqli_real_escape_string($conn, $description);
    $amountFloat = floatval($amount);

    $sql = "INSERT INTO reimbursements (user_id, category, amount, description, receipt_path, status) 
            VALUES ($user_id, '$categoryEsc', $amountFloat, '$descEsc', '$receipt_path', 'pending')";

    if (mysqli_query($conn, $sql)) {
        respond(200, ["status" => "success", "message" => "Klaim reimbursement berhasil diajukan!"]);
    } else {
        respond(500, ["status" => "error", "message" => "Gagal menyimpan data ke database: " . mysqli_error($conn)]);
    }
}

// ==================================
// PUT: Finance Approve / Reject
// ==================================
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = isset($data['id']) ? intval($data['id']) : 0;
    $status = isset($data['status']) ? $data['status'] : '';
    $finance_notes = isset($data['finance_notes']) ? $data['finance_notes'] : '';

    if ($id === 0 || !in_array($status, ['approved', 'rejected'])) {
        respond(400, ["status" => "error", "message" => "Data tidak lengkap atau status tidak valid."]);
    }

    $notesEsc = mysqli_real_escape_string($conn, $finance_notes);
    $statusEsc = mysqli_real_escape_string($conn, $status);

    $sql = "UPDATE reimbursements SET status='$statusEsc', finance_notes='$notesEsc' WHERE id=$id";
    if (mysqli_query($conn, $sql)) {
        respond(200, ["status" => "success", "message" => "Status reimbursement berhasil diperbarui."]);
    } else {
        respond(500, ["status" => "error", "message" => "Gagal mengubah status: " . mysqli_error($conn)]);
    }
}

// Method tidak didukung
respond(405, ["status" => "error", "message" => "Method not allowed"]);
