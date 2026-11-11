<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/api_session_guard.php';
require_once __DIR__ . '/../services/accounting_reports.php';
require_once __DIR__ . '/../services/accounting_journal.php';

// Auto upgrade kolom jika belum ada (kompatibel semua versi MySQL/MariaDB)
foreach ([
    'status' => "ALTER TABLE finance_records ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Lunas'",
    'party_name' => "ALTER TABLE finance_records ADD COLUMN party_name VARCHAR(255) NULL AFTER category",
    'bank_account_id' => "ALTER TABLE finance_records ADD COLUMN bank_account_id INT UNSIGNED NULL",
    'journal_entry_id' => "ALTER TABLE finance_records ADD COLUMN journal_entry_id BIGINT UNSIGNED NULL",
] as $colName => $ddl) {
    $chk = $conn->query("SHOW COLUMNS FROM finance_records LIKE '{$colName}'");
    if ($chk && $chk->num_rows === 0) {
        @$conn->query($ddl);
    }
}

// Tidak ada auto-seed data lokal/sample ke database agar data live production 100% sesuai input Finance.

$actor = api_session_guard($conn, 'read');

function finance_resolve_bank_account(mysqli $conn, int $bankAccountId, string $bankLabel): ?array {
    if (!ac_table($conn, 'cash_bank_accounts')) return null;

    if ($bankAccountId > 0) {
        $row = ac_one($conn, "SELECT b.*, a.is_active AS acc_active, a.is_detail AS acc_detail FROM cash_bank_accounts b LEFT JOIN accounts a ON a.id=b.account_id WHERE b.id=? LIMIT 1", [$bankAccountId]);
        if ($row) return $row;
    }

    $label = trim($bankLabel);
    if ($label === '' || in_array(strtolower($label), ['kas/bank', 'kas', 'bank', 'transfer'], true)) {
        return null;
    }

    if (preg_match('/\b([\d-]{6,25})\b/', $label, $m)) {
        $accNo = $m[1];
        $row = ac_one($conn, "SELECT b.*, a.is_active AS acc_active, a.is_detail AS acc_detail FROM cash_bank_accounts b LEFT JOIN accounts a ON a.id=b.account_id WHERE b.account_number=? AND b.is_active=1 LIMIT 1", [$accNo]);
        if ($row) return $row;
    }

    $exact = ac_one($conn, "SELECT b.*, a.is_active AS acc_active, a.is_detail AS acc_detail FROM cash_bank_accounts b LEFT JOIN accounts a ON a.id=b.account_id WHERE LOWER(b.name)=LOWER(?) AND b.is_active=1 LIMIT 1", [$label]);
    if ($exact) return $exact;

    $allActive = ac_rows($conn, "SELECT b.*, a.is_active AS acc_active, a.is_detail AS acc_detail FROM cash_bank_accounts b LEFT JOIN accounts a ON a.id=b.account_id WHERE b.is_active=1");
    $lower = strtolower($label);
    foreach ($allActive as $cand) {
        $cName = strtolower(trim((string)($cand['name'] ?? '')));
        if ($cName !== '' && (str_contains($lower, $cName) || str_contains($cName, $lower))) {
            return $cand;
        }
    }
    return null;
}

function finance_resolve_counter_account(mysqli $conn, string $type, string $category): ?int {
    if (!ac_table($conn, 'accounts')) return null;
    $catLower = strtolower($category);
    if ($type === 'expense') {
        $acc = null;
        if (str_contains($catLower, 'gaji') || str_contains($catLower, 'payroll')) {
            $acc = ac_one($conn, "SELECT id, is_active, is_detail FROM accounts WHERE account_group=5 AND (LOWER(name) LIKE '%gaji%' OR LOWER(name) LIKE '%payroll%') AND is_detail=1 ORDER BY code LIMIT 1");
        }
        if (!$acc) {
            $acc = ac_one($conn, "SELECT id, is_active, is_detail FROM accounts WHERE account_group=5 AND is_detail=1 AND is_active=1 ORDER BY CASE WHEN code IN ('5200','5100') THEN 0 ELSE 1 END, code LIMIT 1");
        }
        if (!$acc) {
            ac_query($conn, "INSERT INTO accounts (code, name, account_group, normal_balance, is_detail, is_active, report_class) VALUES ('5200', 'Beban Operasional', 5, 'debit', 1, 1, 'operating_expense')");
            return (int)$conn->insert_id;
        }
        if (!(int)$acc['is_active'] || !(int)$acc['is_detail']) {
            ac_query($conn, "UPDATE accounts SET is_active=1, is_detail=1 WHERE id=?", [(int)$acc['id']]);
        }
        return (int)$acc['id'];
    }

    // Income
    if (str_contains($catLower, 'modal')) {
        $acc = ac_one($conn, "SELECT id, is_active, is_detail FROM accounts WHERE account_group=3 AND is_detail=1 AND is_active=1 ORDER BY code LIMIT 1");
        if ($acc) return (int)$acc['id'];
    }
    $acc = ac_one($conn, "SELECT id, is_active, is_detail FROM accounts WHERE account_group=4 AND is_detail=1 AND is_active=1 ORDER BY code LIMIT 1");
    if (!$acc) {
        ac_query($conn, "INSERT INTO accounts (code, name, account_group, normal_balance, is_detail, is_active, report_class) VALUES ('4100', 'Pendapatan Pelatihan & Jasa', 4, 'credit', 1, 1, 'revenue')");
        return (int)$conn->insert_id;
    }
    return (int)$acc['id'];
}

function finance_reverse_existing_journal(mysqli $conn, array $actor, int $recordId): void {
    if (!ac_table($conn, 'journal_entries') || !ac_table($conn, 'journal_lines')) return;
    $rec = ac_one($conn, "SELECT journal_entry_id, transaction_date FROM finance_records WHERE id=? FOR UPDATE", [$recordId]);
    $jId = (int)($rec['journal_entry_id'] ?? 0);
    if ($jId <= 0) return;
    $orig = ac_one($conn, "SELECT id, status, entry_date FROM journal_entries WHERE id=? FOR UPDATE", [$jId]);
    if ($orig && $orig['status'] === 'posted') {
        $revDate = ac_date($orig['entry_date'] ?: ($rec['transaction_date'] ?: date('Y-m-d')));
        ac_query($conn, "INSERT IGNORE INTO accounting_periods (month, status) VALUES (?, 'open')", [substr($revDate, 0, 7)]);
        $period = ac_one($conn, "SELECT status FROM accounting_periods WHERE month=?", [substr($revDate, 0, 7)]);
        if (($period['status'] ?? 'open') !== 'open') {
            $revDate = date('Y-m-d');
            ac_query($conn, "INSERT IGNORE INTO accounting_periods (month, status) VALUES (?, 'open')", [substr($revDate, 0, 7)]);
        }
        ac_reverse($conn, $actor, $jId, $revDate, "Revisi/Hapus Transaksi Finance #{$recordId}");
    }
    ac_query($conn, "UPDATE finance_records SET journal_entry_id=NULL WHERE id=?", [$recordId]);
}

function finance_sync_cash_journal(mysqli $conn, array $actor, int $recordId, int $requestedBankId = 0): ?array {
    if (!ac_table($conn, 'journal_entries') || !ac_table($conn, 'journal_lines') || !ac_table($conn, 'cash_bank_accounts')) {
        return null;
    }
    return ac_atomic($conn, function () use ($conn, $actor, $recordId, $requestedBankId) {
        finance_reverse_existing_journal($conn, $actor, $recordId);

        $row = ac_one($conn, "SELECT * FROM finance_records WHERE id=? FOR UPDATE", [$recordId]);
        if (!$row) return null;

        $statusLower = strtolower(trim((string)($row['status'] ?? '')));
        $isSettled = in_array($statusLower, ['paid', 'lunas'], true);
        $amount = round((float)($row['amount'] ?? 0), 2);
        $bankIdToUse = $requestedBankId > 0 ? $requestedBankId : (int)($row['bank_account_id'] ?? 0);
        $bank = finance_resolve_bank_account($conn, $bankIdToUse, (string)($row['bank_name'] ?? ''));

        $resolvedBankId = $bank ? (int)$bank['id'] : null;
        if ($resolvedBankId !== null) {
            ac_query($conn, "UPDATE finance_records SET bank_account_id=? WHERE id=?", [$resolvedBankId, $recordId]);
        }

        if (!$isSettled || !$bank || empty($bank['account_id']) || $amount <= 0) {
            return $bank ? ['bank_account_id' => (int)$bank['id'], 'bank_balance' => null] : null;
        }

        $cashAccId = (int)$bank['account_id'];
        if (!(int)$bank['acc_active'] || !(int)$bank['acc_detail']) {
            ac_query($conn, "UPDATE accounts SET is_active=1, is_detail=1 WHERE id=?", [$cashAccId]);
        }

        $counterAccId = finance_resolve_counter_account($conn, (string)$row['type'], (string)($row['category'] ?? ''));
        if (!$counterAccId || $counterAccId === $cashAccId) return null;

        $date = substr((string)($row['transaction_date'] ?: date('Y-m-d')), 0, 10);
        ac_query($conn, "INSERT IGNORE INTO accounting_periods (month, status) VALUES (?, 'open')", [substr($date, 0, 7)]);
        $amountStr = number_format($amount, 2, '.', '');
        $party = (string)($row['party_name'] ?: $row['source'] ?: '');
        $desc = trim((string)($row['description'] ?: ($row['type'] === 'expense' ? 'Pengeluaran Kas/Bank' : 'Penerimaan Kas/Bank'))) . " ({$bank['name']})";

        if ($row['type'] === 'expense') {
            $lines = [
                ['account_id' => $counterAccId, 'debit' => $amountStr, 'credit' => '0.00', 'cash_flow_class' => 'operating', 'party_name' => $party],
                ['account_id' => $cashAccId, 'debit' => '0.00', 'credit' => $amountStr, 'cash_flow_class' => 'operating', 'party_name' => $party],
            ];
            $event = 'finance_expense';
        } else {
            $lines = [
                ['account_id' => $cashAccId, 'debit' => $amountStr, 'credit' => '0.00', 'cash_flow_class' => 'operating', 'party_name' => $party],
                ['account_id' => $counterAccId, 'debit' => '0.00', 'credit' => $amountStr, 'cash_flow_class' => 'operating', 'party_name' => $party],
            ];
            $event = 'finance_income';
        }

        $uniqueSourceId = $recordId . '-' . time() . '-' . mt_rand(100, 999);
        $journal = ac_post($conn, $actor, $date, 'finance_record', $uniqueSourceId, $event, $desc, $lines);
        $jId = (int)$journal['id'];
        ac_query($conn, "UPDATE finance_records SET journal_entry_id=? WHERE id=?", [$jId, $recordId]);

        $balRow = ac_one($conn, "SELECT COALESCE(SUM(jl.debit - jl.credit), 0) AS balance FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE jl.account_id=? AND je.status='posted'", [$cashAccId]);
        return [
            'bank_account_id' => (int)$bank['id'],
            'journal_entry_id' => $jId,
            'bank_balance' => (float)($balRow['balance'] ?? 0),
        ];
    });
}

// Helper upload bukti
function save_uploaded_proof(): ?string {
    $upload = $_FILES['proof'] ?? null;
    if ($upload && ($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
        if (!is_uploaded_file($upload['tmp_name'] ?? '') || filesize($upload['tmp_name']) > 8 * 1024 * 1024) {
            ac_fail('Ukuran file bukti maksimal 8 MB.');
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']);
        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], true)) {
            ac_fail('Bukti harus berformat JPG, PNG, WebP, atau PDF.');
        }
        $dir = __DIR__ . '/../uploads/finance_proofs';
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            ac_fail('Folder bukti transaksi tidak tersedia.', 500);
        }
        $ext = strtolower(pathinfo($upload['name'] ?? '', PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'pdf'], true)) {
            $ext = $mime === 'application/pdf' ? 'pdf' : 'jpg';
        }
        $photoPath = 'finance_proofs/' . bin2hex(random_bytes(16)) . '.' . $ext;
        if (!move_uploaded_file($upload['tmp_name'], $dir . '/' . basename($photoPath))) {
            ac_fail('Gagal mengunggah file bukti.', 500);
        }
        return $photoPath;
    }
    return null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        ac_require($conn, $actor, 'prepare');

        // Baca payload (dukung form-data maupun raw JSON)
        $rawJson = file_get_contents('php://input');
        $jsonData = json_decode($rawJson, true) ?: [];
        $input = !empty($_POST) ? $_POST : $jsonData;
        $action = trim((string)($input['action'] ?? ''));

        // ── 1. SINKRONISASI BATCH DARI LOCALSTORAGE DINONAKTIFKAN ──
        // Mencegah browser atau cache lokal menyuntikkan data test/local ke database production.
        if ($action === 'sync_local') {
            echo json_encode([
                'status' => 'disabled',
                'message' => 'Sinkronisasi otomatis dari localStorage browser dinonaktifkan agar data lokal tidak masuk ke database production.',
                'synced_count' => 0
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // ── 2. ATTACH PROOF KE TRANSAKSI YANG SUDAH ADA ──
        if ($action === 'attach_proof') {
            $id = ac_id($input['id'] ?? null, 'ID transaksi');
            $row = ac_one($conn, 'SELECT * FROM finance_records WHERE id=?', [$id]);
            if (!$row) ac_fail('Transaksi historis tidak ditemukan.', 404);

            $link = trim((string)($input['link'] ?? ''));
            if ($link && (!filter_var($link, FILTER_VALIDATE_URL) || !in_array(parse_url($link, PHP_URL_SCHEME), ['http', 'https'], true))) {
                ac_fail('Link bukti harus berupa URL HTTP(S) yang valid.');
            }

            $photoPath = save_uploaded_proof();
            $sets = []; $params = [];
            if ($photoPath) { $sets[] = 'photo_path=?'; $params[] = $photoPath; }
            if ($link) { $sets[] = 'drive_link=?'; $params[] = $link; }
            if (!$sets) ac_fail('File atau tautan bukti belum diisi.');

            $params[] = $id;
            ac_query($conn, 'UPDATE finance_records SET ' . implode(', ', $sets) . ' WHERE id=?', $params);

            echo json_encode([
                'status' => 'success',
                'message' => 'Bukti transaksi berhasil disimpan ke database.',
                'photo_path' => $photoPath,
                'drive_link' => $link ?: null
            ]);
            exit;
        }

        // ── 3. UPDATE TRANSAKSI ──
        if ($action === 'update') {
            $id = ac_id($input['id'] ?? null, 'ID transaksi');
            $row = ac_one($conn, 'SELECT * FROM finance_records WHERE id=?', [$id]);
            if (!$row) ac_fail('Transaksi tidak ditemukan.', 404);

            $type = in_array(strtolower($input['type'] ?? ''), ['income', 'expense'], true) ? strtolower($input['type']) : $row['type'];
            $kat = trim((string)($input['kategori'] ?? $input['category'] ?? $row['category']));
            $party = trim((string)($input['siswa'] ?? $input['vendor'] ?? $input['party_name'] ?? $row['party_name']));
            $amount = isset($input['nominal']) || isset($input['amount']) ? (float)($input['nominal'] ?? $input['amount']) : (float)$row['amount'];
            $desc = isset($input['deskripsi']) || isset($input['description']) ? trim((string)($input['deskripsi'] ?? $input['description'])) : $row['description'];
            $tgl = !empty($input['tanggal']) || !empty($input['transaction_date']) ? substr($input['tanggal'] ?? $input['transaction_date'], 0, 10) : $row['transaction_date'];
            $stat = trim((string)($input['status'] ?? $row['status'] ?? 'Lunas'));
            $sumber = trim((string)($input['sumberDana'] ?? $input['bank_name'] ?? $row['bank_name'] ?? 'BCA'));
            $reqBankId = (int)($input['bank_account_id'] ?? $row['bank_account_id'] ?? 0);
            $driveLink = trim((string)($input['buktiLink'] ?? $input['drive_link'] ?? ''));

            $photoPath = save_uploaded_proof();

            $sets = ['type=?', 'category=?', 'party_name=?', 'amount=?', 'description=?', 'transaction_date=?', 'status=?', 'source=?', 'bank_name=?', 'bank_account_id=?'];
            $params = [$type, $kat, $party, $amount, $desc, $tgl, $stat, $party, $sumber, $reqBankId > 0 ? $reqBankId : null];

            if ($photoPath) {
                $sets[] = 'photo_path=?';
                $params[] = $photoPath;
            }
            if ($driveLink) {
                $sets[] = 'drive_link=?';
                $params[] = $driveLink;
            }

            $params[] = $id;
            ac_query($conn, 'UPDATE finance_records SET ' . implode(', ', $sets) . ' WHERE id=?', $params);
            $syncRes = finance_sync_cash_journal($conn, $actor, (int)$id, $reqBankId);

            echo json_encode([
                'status' => 'success',
                'message' => 'Transaksi berhasil diperbarui di database.',
                'data' => [
                    'id' => $id,
                    'type' => $type,
                    'tanggal' => $tgl,
                    'siswa' => $party,
                    'vendor' => $party,
                    'kategori' => $kat,
                    'nominal' => $amount,
                    'status' => $stat,
                    'deskripsi' => $desc,
                    'sumberDana' => $sumber,
                    'bank_account_id' => $syncRes['bank_account_id'] ?? ($reqBankId ?: null),
                    'bank_balance' => $syncRes['bank_balance'] ?? null,
                    'buktiFoto' => $photoPath ?: $row['photo_path'],
                    'buktiLink' => $driveLink ?: $row['drive_link']
                ]
            ]);
            exit;
        }

        // ── 3b. DELETE TRANSAKSI ──
        if ($action === 'delete') {
            $id = ac_id($input['id'] ?? null, 'ID transaksi');
            ac_atomic($conn, function () use ($conn, $actor, $id) {
                finance_reverse_existing_journal($conn, $actor, (int)$id);
                ac_query($conn, 'DELETE FROM finance_records WHERE id=?', [$id]);
            });
            echo json_encode([
                'status' => 'success',
                'message' => 'Transaksi berhasil dihapus dari database.'
            ]);
            exit;
        }

        // ── 4. CREATE TRANSAKSI BARU LANGSUNG KE MYSQL ──
        // (Berlaku untuk action='create', action='save', atau tanpa action asalkan ada nominal)
        $type = in_array(strtolower($input['type'] ?? ''), ['income', 'expense'], true) ? strtolower($input['type']) : 'income';
        $kat = trim((string)($input['kategori'] ?? $input['category'] ?? 'Umum'));
        $party = trim((string)($input['siswa'] ?? $input['vendor'] ?? $input['party_name'] ?? ''));
        $amount = (float)($input['nominal'] ?? $input['amount'] ?? 0);
        if ($amount <= 0) ac_fail('Nominal transaksi harus lebih dari 0.');

        $tgl = !empty($input['tanggal']) || !empty($input['transaction_date']) ? substr($input['tanggal'] ?? $input['transaction_date'], 0, 10) : date('Y-m-d');
        $stat = trim((string)($input['status'] ?? ($type === 'income' ? 'Lunas' : 'Paid')));
        $desc = trim((string)($input['deskripsi'] ?? $input['description'] ?? ''));
        $sumber = trim((string)($input['sumberDana'] ?? $input['bank_name'] ?? 'BCA (1832-918-428)'));
        $reqBankId = (int)($input['bank_account_id'] ?? 0);
        $driveLink = trim((string)($input['buktiLink'] ?? $input['drive_link'] ?? ''));
        $userId = (int)($actor['id'] ?? 1);

        $photoPath = save_uploaded_proof();

        $sql = "INSERT INTO finance_records (type, category, party_name, amount, description, transaction_date, created_by, status, source, bank_name, bank_account_id, drive_link, photo_path, metode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Transfer')";
        ac_query($conn, $sql, [$type, $kat, $party, $amount, $desc, $tgl, $userId, $stat, $party, $sumber, $reqBankId > 0 ? $reqBankId : null, $driveLink ?: null, $photoPath ?: null]);
        $newId = (int)$conn->insert_id;
        $syncRes = finance_sync_cash_journal($conn, $actor, $newId, $reqBankId);

        echo json_encode([
            'status' => 'success',
            'message' => 'Transaksi berhasil tersimpan permanen di database Hostinger!',
            'data' => [
                'id' => $newId,
                'noTransaksi' => 'FIN-' . str_pad((string)$newId, 5, '0', STR_PAD_LEFT),
                'type' => $type,
                'tanggal' => $tgl,
                'siswa' => $party,
                'vendor' => $party,
                'kategori' => $kat,
                'sumberDana' => $sumber,
                'bank_account_id' => $syncRes['bank_account_id'] ?? ($reqBankId ?: null),
                'bank_balance' => $syncRes['bank_balance'] ?? null,
                'nominal' => $amount,
                'status' => $stat,
                'deskripsi' => $desc,
                'buktiFoto' => $photoPath ? "/api/finance.php?view=photo&id=$newId" : "",
                'buktiLink' => $driveLink
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (AccountingException $e) {
        http_response_code($e->getCode() ?: 422);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        exit;
    } catch (Throwable $e) {
        error_log('Finance transaction error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan transaksi: ' . $e->getMessage()]);
        exit;
    }
}

// ── DELETE TRANSAKSI ──
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || (isset($_GET['action']) && $_GET['action'] === 'delete')) {
    try {
        if (!ac_can($conn, $actor, 'prepare') && !ac_can($conn, $actor, 'configure')) ac_fail('Akses ditolak.', 403);
        $id = ac_id($_GET['id'] ?? $_POST['id'] ?? null, 'ID transaksi');
        ac_atomic($conn, function () use ($conn, $actor, $id) {
            finance_reverse_existing_journal($conn, $actor, (int)$id);
            ac_query($conn, 'DELETE FROM finance_records WHERE id=?', [$id]);
        });
        echo json_encode(['status' => 'success', 'message' => 'Transaksi berhasil dihapus secara permanen dari database.']);
        exit;
    } catch (AccountingException $e) {
        http_response_code($e->getCode() ?: 422);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus transaksi.']);
        exit;
    }
}

// ── GET: VIEW FOTO / LIST TRANSAKSI ──
try {
    if (($_GET['view'] ?? '') === 'photo') {
        $id = ac_id($_GET['id'] ?? null, 'ID transaksi');
        $row = ac_one($conn, 'SELECT photo_path FROM finance_records WHERE id=?', [$id]);
        $stored = trim((string)($row['photo_path'] ?? ''));
        if (!$stored) ac_fail('Bukti foto tidak ditemukan.', 404);
        if (preg_match('/^https?:\/\//i', $stored)) {
            header('Location: ' . $stored, 302);
            exit;
        }
        $relative = str_replace('\\', '/', ltrim($stored, '/'));
        if (str_contains($relative, '..')) ac_fail('Bukti foto tidak valid.', 400);
        $candidates = [
            __DIR__ . '/../uploads/' . $relative,
            __DIR__ . '/../' . $relative,
            __DIR__ . '/../storage/' . $relative
        ];
        $file = null;
        foreach ($candidates as $candidate) {
            $real = realpath($candidate);
            if ($real && is_file($real)) {
                $file = $real;
                break;
            }
        }
        if (!$file) ac_fail('File bukti foto tidak ditemukan.', 404);
        header('Content-Type: ' . ((new finfo(FILEINFO_MIME_TYPE))->file($file) ?: 'application/octet-stream'));
        header('Content-Disposition: inline; filename="' . basename($file) . '"');
        readfile($file);
        exit;
    }

    $where = [];
    $params = [];
    if (!empty($_GET['type'])) {
        if (!in_array($_GET['type'], ['income', 'expense'], true)) ac_fail('Jenis transaksi tidak valid.');
        $where[] = 'f.type=?';
        $params[] = $_GET['type'];
    }
    if (!empty($_GET['month'])) {
        $month = ac_id($_GET['month']);
        if ($month > 12) ac_fail('Bulan tidak valid.');
        $where[] = 'MONTH(f.transaction_date)=?';
        $params[] = $month;
    }
    if (!empty($_GET['year'])) {
        $year = (string)$_GET['year'];
        if (!preg_match('/^\d{4}$/D', $year)) ac_fail('Tahun tidak valid.');
        $where[] = 'YEAR(f.transaction_date)=?';
        $params[] = $year;
    }

    $sql = 'SELECT f.*, COALESCE(NULLIF(f.party_name, ""), NULLIF(f.source, ""), e.full_name, "Umum") AS party_display, e.full_name AS creator_name FROM finance_records f LEFT JOIN employees e ON e.user_id=f.created_by' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY f.transaction_date DESC, f.id DESC';
    
    $rows = ac_rows($conn, $sql, $params);

    echo json_encode([
        'status' => 'success',
        'total' => count($rows),
        'data' => $rows
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (AccountingException $e) {
    http_response_code($e->getCode());
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Finance API list error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Transaksi gagal dimuat: ' . $e->getMessage()]);
}
