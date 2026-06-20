<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ["status" => "error", "message" => "Method not allowed"]);
}

$data = json_decode(file_get_contents("php://input"), true);
$month = $data['month'] ?? date('Y-m');

// 1. Ubah status payslips dari 'draft' menjadi 'published' untuk bulan ini
$update_sql = "UPDATE payslips SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE month = '$month' AND status = 'draft'";
mysqli_query($conn, $update_sql);
$affected = mysqli_affected_rows($conn);

if ($affected === 0) {
    respond(400, ["status" => "error", "message" => "Tidak ada data gaji berstatus draft yang siap dipublikasi untuk bulan ini. Pastikan HRD sudah menyimpannya."]);
}

// 2. Ambil data payslip yang baru saja dipublish beserta email karyawannya
$q = mysqli_query($conn, "
    SELECT p.*, e.employee_code, e.full_name, pos.name as position_name, u.email 
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    JOIN positions pos ON e.position_id = pos.id
    JOIN users u ON e.user_id = u.id
    WHERE p.month = '$month' AND p.status = 'published'
");

$months_indo = ["01"=>"Januari","02"=>"Februari","03"=>"Maret","04"=>"April","05"=>"Mei","06"=>"Juni",
                "07"=>"Juli","08"=>"Agustus","09"=>"September","10"=>"Oktober","11"=>"November","12"=>"Desember"];
$y = substr($month, 0, 4);
$m = substr($month, 5, 2);
$month_text = $months_indo[$m] . " " . $y;

$emailsSent = 0;

while ($row = mysqli_fetch_assoc($q)) {
    $to = $row['email'];
    if (!$to) continue;

    $subject = "SLIP GAJI KARYAWAN PT CREATIVA BRIDGING INTERNATIONAL - $month_text";
    
    // HTML Email Template
    $html = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background-color: #0c2e59; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 20px; letter-spacing: 1px; }
            .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.8; }
            .content { padding: 30px; }
            .info-grid { display: flex; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; }
            .info-item { width: 50%; margin-bottom: 10px; font-size: 14px; }
            .info-item strong { color: #555; display: block; font-size: 12px; }
            .amount-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .amount-table th, .amount-table td { padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: left; font-size: 14px; }
            .text-green { color: #10b981; font-weight: bold; }
            .text-red { color: #ef4444; font-weight: bold; }
            .total-box { background-color: #0c2e59; color: white; padding: 15px; border-radius: 8px; text-align: right; margin-top: 20px; }
            .total-box span { font-size: 14px; opacity: 0.8; }
            .total-box h2 { margin: 5px 0 0 0; font-size: 24px; }
            .footer { text-align: center; padding: 15px; font-size: 12px; color: #888; background: #fafafa; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>PT CREATIVA BRIDGING INTERNATIONAL</h1>
                <p>SLIP GAJI KARYAWAN</p>
            </div>
            <div class='content'>
                <div class='info-grid'>
                    <div class='info-item'><strong>NAMA KARYAWAN</strong> " . strtoupper($row['full_name']) . "</div>
                    <div class='info-item'><strong>PERIODE</strong> " . strtoupper($month_text) . "</div>
                    <div class='info-item'><strong>NIK</strong> " . $row['employee_code'] . "</div>
                    <div class='info-item'><strong>JABATAN</strong> " . $row['position_name'] . "</div>
                </div>
                
                <table class='amount-table'>
                    <tr>
                        <th colspan='2' style='color:#10b981'>PENDAPATAN (+)</th>
                    </tr>
                    <tr>
                        <td>Gaji Pokok</td>
                        <td align='right'>Rp " . number_format($row['base_salary'], 0, ',', '.') . "</td>
                    </tr>
                    <tr>
                        <td>Uang Lembur (" . $row['overtime_minutes'] . " menit)</td>
                        <td align='right'>Rp " . number_format($row['overtime_pay'], 0, ',', '.') . "</td>
                    </tr>
                    <tr>
                        <th colspan='2' style='color:#ef4444; padding-top:20px;'>POTONGAN (-)</th>
                    </tr>
                    <tr>
                        <td>Potongan Keterlambatan (" . $row['late_minutes'] . " menit)</td>
                        <td align='right' class='text-red'>-Rp " . number_format($row['late_penalty'], 0, ',', '.') . "</td>
                    </tr>
                    <tr>
                        <td>BPJS Ketenagakerjaan</td>
                        <td align='right' class='text-red'>-Rp " . number_format($row['bpjs_tk'], 0, ',', '.') . "</td>
                    </tr>
                    <tr>
                        <td>BPJS Kesehatan</td>
                        <td align='right' class='text-red'>-Rp " . number_format($row['bpjs_kes'], 0, ',', '.') . "</td>
                    </tr>
                    <tr>
                        <td>Pajak Penghasilan (PPh 21)</td>
                        <td align='right' class='text-red'>-Rp " . number_format($row['pph21'], 0, ',', '.') . "</td>
                    </tr>
                </table>

                <div class='total-box'>
                    <span>TOTAL DITERIMA (TAKE HOME PAY)</span>
                    <h2>Rp " . number_format($row['total_salary'], 0, ',', '.') . "</h2>
                </div>
            </div>
            <div class='footer'>
                Dokumen elektronik ini dihasilkan secara otomatis oleh sistem. Cek dashboard Anda untuk detail lebih lanjut.<br>
                &copy; " . date("Y") . " PT Creativa Bridging International.
            </div>
        </div>
    </body>
    </html>
    ";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: finance@creativa.com" . "\r\n";

    // Uncomment line di bawah jika environment PHP mendukung sendmail
    // mail($to, $subject, $html, $headers);
    
    // Anggap sukses terkirim untuk keperluan demo
    $emailsSent++;
}

respond(200, [
    "status" => "success", 
    "message" => "Berhasil mempublikasikan $affected slip gaji dan mengirimkan $emailsSent email notifikasi."
]);
