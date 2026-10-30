<?php
class SalaryWorkflowException extends RuntimeException {}
function salary_fail(string $message, int $code = 422): void { throw new SalaryWorkflowException($message, $code); }
function salary_audit_table_exists(mysqli $db): bool {
    return (bool)$db->query("SHOW TABLES LIKE 'accounting_audit_logs'")?->num_rows;
}
function salary_last_audit_hash(mysqli $db): string {
    $row = $db->query("SELECT hash_self FROM accounting_audit_logs ORDER BY id DESC LIMIT 1")?->fetch_assoc();
    return $row['hash_self'] ?? '';
}
function salary_query(mysqli $db, string $sql, string $types = '', array $params = []): mysqli_stmt {
    $statement = $db->prepare($sql);
    if ($types !== '') $statement->bind_param($types, ...$params);
    $statement->execute(); return $statement;
}
function salary_text($value, string $label, int $max, bool $required = true): string {
    if (!is_string($value)) salary_fail("$label tidak valid.");
    $value = trim($value);
    if (($required && $value === '') || mb_strlen($value) > $max) salary_fail("$label wajib diisi dan maksimal $max karakter.");
    return $value;
}
function salary_today(): string { return (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d'); }
function salary_period($month): array {
    if (!is_string($month) || !preg_match('/^(19|20|21|22)\d{2}-(0[1-9]|1[0-2])$/D', $month)) salary_fail('Periode absensi harus berupa bulan dan tahun yang valid.');
    $start = new DateTimeImmutable($month . '-01', new DateTimeZone('Asia/Jakarta'));
    return ['month'=>$month, 'period_start'=>$start->format('Y-m-d'), 'period_end'=>$start->format('Y-m-t'), 'payday'=>$start->modify('+1 month')->format('Y-m-04')];
}
function salary_cents($amount): int {
    if (!is_scalar($amount) || !preg_match('/^\d{1,13}(\.\d{1,2})?$/D', (string)$amount)) salary_fail('Nominal gaji pokok tidak valid. Perbarui data karyawan.');
    $parts = explode('.', (string)$amount);
    return (int)$parts[0]*100 + (int)str_pad($parts[1] ?? '', 2, '0');
}
function salary_decimal(int $cents): string { return intdiv($cents, 100) . '.' . str_pad((string)($cents%100), 2, '0', STR_PAD_LEFT); }

/**
 * Standar Nasional BPJS Ketenagakerjaan (PP 44/2015 & PP 45/2015):
 * - JHT (Jaminan Hari Tua) Pekerja: 2.0% dari Gaji Pokok / Upah Tetap.
 * - JP (Jaminan Pensiun) Pekerja: 1.0% dari Gaji Pokok (Batas upah maksimal nasional Rp 10.042.300).
 * - Total Potongan Pekerja BPJS TK = 3.0%.
 */
function salary_calculate_bpjs_tk(float $baseSalary): array {
    $jhtEmployee = round($baseSalary * 0.02);
    $jhtEmployer = round($baseSalary * 0.037);
    $cappedJP = min($baseSalary, 10042300.0);
    $jpEmployee = round($cappedJP * 0.01);
    $jpEmployer = round($cappedJP * 0.02);
    $jkkEmployer = round($baseSalary * 0.0024);
    $jkmEmployer = round($baseSalary * 0.0030);
    return [
        'jht_employee' => $jhtEmployee,
        'jp_employee' => $jpEmployee,
        'total_employee' => $jhtEmployee + $jpEmployee,
        'jht_employer' => $jhtEmployer,
        'jp_employer' => $jpEmployer,
        'jkk_employer' => $jkkEmployer,
        'jkm_employer' => $jkmEmployer,
        'total_employer' => $jhtEmployer + $jpEmployer + $jkkEmployer + $jkmEmployer,
    ];
}

/**
 * Standar Nasional BPJS Kesehatan (Perpres 64/2020):
 * - Pekerja: 1.0% dari Upah Tetap (Batas upah maksimal nasional Rp 12.000.000).
 * - Perusahaan / Pemberi Kerja: 4.0%.
 */
function salary_calculate_bpjs_kes(float $baseSalary): array {
    $cappedBase = min($baseSalary, 12000000.0);
    $kesEmployee = round($cappedBase * 0.01);
    $kesEmployer = round($cappedBase * 0.04);
    return [
        'total_employee' => $kesEmployee,
        'total_employer' => $kesEmployer,
    ];
}

/**
 * Standar Perpajakan Nasional PPh 21 TER (Tarif Efektif Rata-Rata Bulanan - PP 58/2023 & PMK 168/2023)
 * Kategori TER A (TK/0: 54jt, TK/1: 58.5jt, K/0: 58.5jt)
 * Kategori TER B (TK/2: 63jt, TK/3: 67.5jt, K/1: 63jt, K/2: 67.5jt)
 * Kategori TER C (K/3: 72jt)
 */
function salary_calculate_pph21_ter(float $grossSalary, string $status = 'TK/0'): array {
    $clean = strtoupper(trim($status));
    $category = 'A';
    if (in_array($clean, ['TK/2', 'TK/3', 'K/1', 'K/2', 'MENIKAH 1', 'MENIKAH 2', 'MARRIED-1', 'MARRIED-2'], true)) {
        $category = 'B';
    } elseif (in_array($clean, ['K/3', 'MENIKAH 3', 'MARRIED-3'], true)) {
        $category = 'C';
    }

    $rate = 0.0;
    if ($category === 'A') {
        if ($grossSalary <= 5400000) $rate = 0.0;
        elseif ($grossSalary <= 5650000) $rate = 0.0025;
        elseif ($grossSalary <= 5950000) $rate = 0.0050;
        elseif ($grossSalary <= 6300000) $rate = 0.0075;
        elseif ($grossSalary <= 6750000) $rate = 0.0100;
        elseif ($grossSalary <= 7500000) $rate = 0.0125;
        elseif ($grossSalary <= 8550000) $rate = 0.0150;
        elseif ($grossSalary <= 9650000) $rate = 0.0175;
        elseif ($grossSalary <= 10050000) $rate = 0.0200;
        elseif ($grossSalary <= 10350000) $rate = 0.0225;
        elseif ($grossSalary <= 10700000) $rate = 0.0250;
        elseif ($grossSalary <= 11050000) $rate = 0.0300;
        elseif ($grossSalary <= 11600000) $rate = 0.0350;
        elseif ($grossSalary <= 12500000) $rate = 0.0400;
        elseif ($grossSalary <= 13750000) $rate = 0.0500;
        elseif ($grossSalary <= 15100000) $rate = 0.0600;
        elseif ($grossSalary <= 16950000) $rate = 0.0700;
        elseif ($grossSalary <= 19750000) $rate = 0.0800;
        elseif ($grossSalary <= 24150000) $rate = 0.0900;
        else $rate = 0.1000;
    } elseif ($category === 'B') {
        if ($grossSalary <= 6200000) $rate = 0.0;
        elseif ($grossSalary <= 6500000) $rate = 0.0025;
        elseif ($grossSalary <= 6850000) $rate = 0.0050;
        elseif ($grossSalary <= 7300000) $rate = 0.0075;
        elseif ($grossSalary <= 9200000) $rate = 0.0100;
        elseif ($grossSalary <= 10750000) $rate = 0.0150;
        elseif ($grossSalary <= 12550000) $rate = 0.0200;
        elseif ($grossSalary <= 14150000) $rate = 0.0300;
        elseif ($grossSalary <= 16150000) $rate = 0.0400;
        else $rate = 0.0500;
    } else {
        if ($grossSalary <= 6600000) $rate = 0.0;
        elseif ($grossSalary <= 6950000) $rate = 0.0025;
        elseif ($grossSalary <= 7350000) $rate = 0.0050;
        elseif ($grossSalary <= 7800000) $rate = 0.0075;
        elseif ($grossSalary <= 8850000) $rate = 0.0100;
        elseif ($grossSalary <= 9800000) $rate = 0.0125;
        elseif ($grossSalary <= 10950000) $rate = 0.0150;
        elseif ($grossSalary <= 12050000) $rate = 0.0200;
        else $rate = 0.0300;
    }
    $pph21Amount = round($grossSalary * $rate);
    return [
        'category' => $category,
        'rate' => $rate,
        'rate_percentage' => ($rate * 100) . '%',
        'amount' => $pph21Amount,
    ];
}

function salary_manual_fields(): array {
    return [
        'thr_amount' => 'THR / Bonus',
        'bpjs_tk_deduction' => 'BPJS Ketenagakerjaan (3%)',
        'bpjs_kes_deduction' => 'BPJS Kesehatan (1%)',
        'pph21_deduction' => 'PPh 21 (Pajak TER)',
        'kasbon_deduction' => 'Kasbon / Pinjaman',
        'leave_deduction' => 'Izin / Sakit / Potongan Kehadiran',
    ];
}
function salary_normalize_totals(array $row): array {
    foreach (salary_manual_fields() as $key=>$label) $row[$key]=$row[$key] ?? '0.00';
    $row['gross_salary']=$row['gross_salary'] ?? salary_decimal(salary_cents($row['base_salary'])+salary_cents($row['meal_allowance'])+salary_cents($row['transport_allowance'])+salary_cents($row['thr_amount']));
    $row['total_deductions']=$row['total_deductions'] ?? '0.00';
    $row['adjustment_note']=$row['adjustment_note'] ?? '';
    return $row;
}
function salary_apply_adjustments(array $calculation, array $data = [], ?array $previous = null): array {
    $deductions=0;
    $baseNum = (float)($calculation['base_salary'] ?? 0);
    $grossInitial = salary_cents($calculation['base_salary'] ?? 0) + salary_cents($calculation['meal_allowance'] ?? 0) + salary_cents($calculation['transport_allowance'] ?? 0);
    $thrVal = array_key_exists('thr_amount', $data) ? $data['thr_amount'] : ($previous['thr_amount'] ?? '0');
    $grossTotal = ($grossInitial + salary_cents($thrVal)) / 100;

    // Perhitungan acuan Standar Nasional Otomatis
    $natTk = salary_calculate_bpjs_tk($baseNum);
    $natKes = salary_calculate_bpjs_kes($baseNum);
    $natPph = salary_calculate_pph21_ter($grossTotal, (string)($calculation['marital_status'] ?? 'TK/0'));

    foreach (salary_manual_fields() as $key=>$label) {
        if (array_key_exists($key, $data)) {
            $value = $data[$key];
        } elseif ($previous !== null && array_key_exists($key, $previous)) {
            $value = $previous[$key];
        } else {
            // Nilai default awal saat draft baru disiapkan mengikuti regulasi resmi nasional
            if ($key === 'bpjs_tk_deduction') $value = (string)$natTk['total_employee'];
            elseif ($key === 'bpjs_kes_deduction') $value = (string)$natKes['total_employee'];
            elseif ($key === 'pph21_deduction') $value = (string)$natPph['amount'];
            else $value = '0';
        }
        if (!is_scalar($value) || is_bool($value) || !preg_match('/^\d{1,13}(\.\d{1,2})?$/D',(string)$value)) salary_fail("Nominal $label harus berupa angka rupiah positif atau nol, maksimal 2 desimal.");
        $cents=salary_cents($value); $calculation[$key]=salary_decimal($cents);
        if ($key!=='thr_amount') $deductions+=$cents;
    }
    $gross=salary_cents($calculation['base_salary'])+salary_cents($calculation['meal_allowance'])+salary_cents($calculation['transport_allowance'])+salary_cents($calculation['thr_amount']);
    if ($gross>999999999999999 || $deductions>999999999999999) salary_fail('Jumlah pendapatan atau potongan melebihi batas penyimpanan.');
    if ($deductions>$gross) salary_fail('Jumlah potongan tidak boleh melebihi jumlah pendapatan.');
    $calculation['gross_salary']=salary_decimal($gross);
    $calculation['total_deductions']=salary_decimal($deductions);
    $calculation['total_salary']=salary_decimal($gross-$deductions);
    $calculation['adjustment_note']=salary_text($data['adjustment_note'] ?? $previous['adjustment_note'] ?? '', 'Catatan pendapatan / potongan',2000,false);
    return $calculation;
}
function salary_permissions(array $actor): array {
    return ['can_prepare'=>$actor['role']==='finance', 'can_approve'=>in_array($actor['role'], ['admin','super_admin'], true), 'actor_id'=>(int)$actor['id']];
}
function salary_require_access(array $actor): void {
    if (!in_array($actor['role'], ['finance','admin','super_admin'], true)) salary_fail('Penggajian hanya dapat dikelola Finance dan Admin.', 403);
}
function salary_employee_sql(): string {
    return "SELECT e.id AS employee_id,e.employee_code,e.full_name AS employee_name,e.position AS position_name,e.join_date,e.bank_name,e.bank_account AS account_number,
        e.full_name AS account_name,COALESCE(NULLIF(e.base_salary,0),(SELECT p.base_salary FROM positions p WHERE p.name=e.position ORDER BY p.id LIMIT 1),0) AS base_salary,
        IF(e.base_salary>0,'employee','position') AS salary_source,
        e.marital_status, e.npwp, e.bpjs_tk AS bpjs_tk_number, e.bpjs_kes AS bpjs_kes_number
        FROM employees e JOIN users u ON u.id=e.user_id JOIN roles r ON r.id=u.role_id
        WHERE u.is_active=1 AND LOWER(r.name) IN ('karyawan','employee','staff')";
}
function salary_apply_base_rate(mysqli $db, array $employee, string $month, bool $lock = false): array {
    $rate = salary_query($db, 'SELECT * FROM salary_base_rates WHERE employee_id=? AND effective_month<=? ORDER BY effective_month DESC,id DESC LIMIT 1'.($lock ? ' FOR UPDATE' : ''), 'is', [(int)$employee['employee_id'],$month])->get_result()->fetch_assoc();
    $employee['base_salary_rate_id'] = $rate ? (int)$rate['id'] : null;
    $employee['base_salary_effective_month'] = $rate['effective_month'] ?? null;
    $employee['bpjs_tk_deduction_rate'] = $rate ? $rate['bpjs_tk_deduction'] : null;
    $employee['bpjs_kes_deduction_rate'] = $rate ? $rate['bpjs_kes_deduction'] : null;
    $employee['pph21_deduction_rate'] = $rate ? $rate['pph21_deduction'] : null;
    $employee['kasbon_deduction_rate'] = $rate ? $rate['kasbon_deduction'] : '0.00';
    if ($rate) {
        $employee['base_salary'] = $rate['amount'];
        $employee['salary_source'] = 'master';
        if (!empty($rate['ptkp_status'])) $employee['marital_status'] = $rate['ptkp_status'];
        if (!empty($rate['bpjs_tk_number'])) $employee['bpjs_tk_number'] = $rate['bpjs_tk_number'];
        if (!empty($rate['bpjs_kes_number'])) $employee['bpjs_kes_number'] = $rate['bpjs_kes_number'];
        if (!empty($rate['npwp'])) $employee['npwp'] = $rate['npwp'];
    }
    return $employee;
}
function salary_base_settings(mysqli $db, string $month): array {
    salary_period($month);
    $employees = salary_query($db, salary_employee_sql().' ORDER BY e.full_name,e.id')->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($employees as &$employee) {
        $employee['baseline_salary'] = $employee['base_salary'];
        $employee = salary_apply_base_rate($db, $employee, $month);
        $employee['history'] = salary_query($db, 'SELECT * FROM salary_base_rates WHERE employee_id=? ORDER BY id DESC', 'i', [(int)$employee['employee_id']])->get_result()->fetch_all(MYSQLI_ASSOC);
        $employee['revision'] = (int)($employee['history'][0]['id'] ?? 0);

        // Hitung estimasi potongan standar nasional untuk tampilan master gaji & potongan
        $baseNum = (float)$employee['base_salary'];
        $tkCalc = salary_calculate_bpjs_tk($baseNum);
        $kesCalc = salary_calculate_bpjs_kes($baseNum);
        $pphCalc = salary_calculate_pph21_ter($baseNum, (string)($employee['marital_status'] ?? 'TK/0'));

        $employee['standard_tk'] = $employee['bpjs_tk_deduction_rate'] !== null ? (float)$employee['bpjs_tk_deduction_rate'] : (float)$tkCalc['total_employee'];
        $employee['standard_kes'] = $employee['bpjs_kes_deduction_rate'] !== null ? (float)$employee['bpjs_kes_deduction_rate'] : (float)$kesCalc['total_employee'];
        $employee['standard_pph21'] = $employee['pph21_deduction_rate'] !== null ? (float)$employee['pph21_deduction_rate'] : (float)$pphCalc['amount'];
        $employee['standard_kasbon'] = (float)($employee['kasbon_deduction_rate'] ?? 0);
        $employee['total_standard_deductions'] = $employee['standard_tk'] + $employee['standard_kes'] + $employee['standard_pph21'] + $employee['standard_kasbon'];
        $employee['standard_thp'] = max(0, $baseNum - $employee['total_standard_deductions']);
        $employee['ptkp_status'] = $employee['marital_status'] ?: 'TK/0';

        unset($employee['bank_name'],$employee['account_name'],$employee['account_number']);
    } unset($employee);
    return ['employees'=>$employees,'month'=>$month];
}
function salary_set_base_rate(mysqli $db, array $actor, array $data): array {
    salary_require_access($actor);
    $employeeId = (int)($data['employee_id'] ?? 0);
    $month = salary_period($data['effective_month'] ?? '')['month'];
    $amount = salary_cents($data['amount'] ?? '');
    if ($amount <= 0) salary_fail('Gaji pokok harus lebih dari Rp0.');
    $reason = salary_text($data['reason'] ?? '', 'Alasan pengaturan gaji', 1000);

    $db->begin_transaction();
    try {
        salary_query($db, 'SELECT id FROM employees WHERE id=? FOR UPDATE', 'i', [$employeeId]);
        $employee = salary_query($db, salary_employee_sql().' AND e.id=?', 'i', [$employeeId])->get_result()->fetch_assoc();
        if (!$employee) salary_fail('Karyawan aktif tidak ditemukan.', 404);
        $latest = salary_query($db, 'SELECT id FROM salary_base_rates WHERE employee_id=? ORDER BY id DESC LIMIT 1 FOR UPDATE', 'i', [$employeeId])->get_result()->fetch_assoc();
        if (!isset($data['revision']) || (int)$data['revision'] !== (int)($latest['id'] ?? 0)) salary_fail('Pengaturan gaji telah berubah. Muat ulang sebelum menyimpan.', 409);
        $next = salary_query($db, 'SELECT effective_month FROM salary_base_rates WHERE employee_id=? AND effective_month>? ORDER BY effective_month LIMIT 1', 'is', [$employeeId,$month])->get_result()->fetch_assoc();
        $until = $next['effective_month'] ?? '2300-01';
        $locked = salary_query($db, "SELECT month FROM salary_requests WHERE employee_id=? AND month>=? AND month<? AND status IN ('submitted','approved','paid') ORDER BY month LIMIT 1 FOR UPDATE", 'iss', [$employeeId,$month,$until])->get_result()->fetch_assoc();
        $legacy = salary_query($db, "SELECT month FROM payslips WHERE employee_id=? AND month>=? AND month<? AND status='published' ORDER BY month LIMIT 1 FOR UPDATE", 'iss', [$employeeId,$month,$until])->get_result()->fetch_assoc();
        if ($locked || $legacy) salary_fail('Periode '.($locked['month'] ?? $legacy['month']).' sudah dikunci. Pilih bulan berlaku setelah periode tersebut atau revisi pengajuan yang ditolak.', 409);

        // Process deduction settings
        $bpjsTk = isset($data['bpjs_tk_deduction']) && $data['bpjs_tk_deduction'] !== '' ? salary_decimal(salary_cents($data['bpjs_tk_deduction'])) : null;
        $bpjsKes = isset($data['bpjs_kes_deduction']) && $data['bpjs_kes_deduction'] !== '' ? salary_decimal(salary_cents($data['bpjs_kes_deduction'])) : null;
        $pph21 = isset($data['pph21_deduction']) && $data['pph21_deduction'] !== '' ? salary_decimal(salary_cents($data['pph21_deduction'])) : null;
        $kasbon = isset($data['kasbon_deduction']) && $data['kasbon_deduction'] !== '' ? salary_decimal(salary_cents($data['kasbon_deduction'])) : '0.00';
        $ptkp = trim($data['ptkp_status'] ?? ($employee['marital_status'] ?? 'TK/0'));
        $bpjsTkNo = trim($data['bpjs_tk_number'] ?? ($employee['bpjs_tk_number'] ?? ''));
        $bpjsKesNo = trim($data['bpjs_kes_number'] ?? ($employee['bpjs_kes_number'] ?? ''));
        $npwpNo = trim($data['npwp'] ?? ($employee['npwp'] ?? ''));

        salary_query($db, 'INSERT INTO salary_base_rates(employee_id,effective_month,amount,bpjs_tk_deduction,bpjs_kes_deduction,pph21_deduction,kasbon_deduction,ptkp_status,bpjs_tk_number,bpjs_kes_number,npwp,reason,actor_id,actor_name,actor_role)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            'isssssssssssiss',
            [$employeeId,$month,salary_decimal($amount),$bpjsTk,$bpjsKes,$pph21,$kasbon,$ptkp,$bpjsTkNo,$bpjsKesNo,$npwpNo,$reason,(int)$actor['id'],$actor['name'],$actor['role']]);
        
        $insertId = (int)$db->insert_id;

        // Sync with employee master profile
        salary_query($db, 'UPDATE employees SET base_salary=?, marital_status=?, npwp=?, bpjs_tk=?, bpjs_kes=? WHERE id=?',
            'sssssi', [salary_decimal($amount), $ptkp, $npwpNo, $bpjsTkNo, $bpjsKesNo, $employeeId]);

        $result = [
            'id' => $insertId,
            'employee_id' => $employeeId,
            'effective_month' => $month,
            'amount' => salary_decimal($amount),
            'bpjs_tk_deduction' => $bpjsTk,
            'bpjs_kes_deduction' => $bpjsKes,
            'pph21_deduction' => $pph21,
            'kasbon_deduction' => $kasbon,
            'ptkp_status' => $ptkp,
            'bpjs_tk_number' => $bpjsTkNo,
            'bpjs_kes_number' => $bpjsKesNo,
            'npwp' => $npwpNo
        ];
        $db->commit(); return $result;
    } catch (Throwable $error) { $db->rollback(); throw $error; }
}
function salary_attendance(mysqli $db, int $employeeId, array $period, string $joinDate): array {
    // One allowance per distinct work date. Leave/absence never becomes attendance just because it has a timestamp.
    return salary_query($db, "SELECT id,date,status,check_in_at,check_out_at FROM attendance_logs
        WHERE employee_id=? AND date>=? AND date<=? AND date>=?
        AND (LOWER(status) IN ('present','late','dinas') OR ((status IS NULL OR status='') AND check_in_at IS NOT NULL)) ORDER BY date,id",
        'isss', [$employeeId,$period['period_start'],$period['period_end'],$joinDate])->get_result()->fetch_all(MYSQLI_ASSOC);
}
function salary_calculate(mysqli $db, array $employee, array $period, bool $lock = false): array {
    $employee = salary_apply_base_rate($db, $employee, $period['month'], $lock);
    $attendance = salary_attendance($db, (int)$employee['employee_id'], $period, $employee['join_date']);
    $days = count(array_unique(array_column($attendance, 'date')));
    $base = salary_cents($employee['base_salary']);
    $meal = $days * 30000 * 100; $transport = $days * 20000 * 100;
    if ($base + $meal + $transport > 999999999999999) salary_fail('Total gaji melebihi batas penyimpanan. Perbarui gaji pokok.');
    $legacy = salary_query($db, "SELECT id FROM payslips WHERE employee_id=? AND month=? AND status='published' LIMIT 1", 'is', [(int)$employee['employee_id'],$period['month']])->get_result()->fetch_assoc();
    return salary_apply_adjustments($period + $employee + ['work_days'=>$days, 'meal_rate'=>'30000.00', 'transport_rate'=>'20000.00',
        'meal_allowance'=>salary_decimal($meal), 'transport_allowance'=>salary_decimal($transport), 'total_salary'=>salary_decimal($base+$meal+$transport),
        'attendance'=>$attendance, 'legacy_published'=>(bool)$legacy, 'can_prepare'=>$base>0 && !$legacy,
        'issue'=>$legacy ? 'Slip gaji periode ini sudah dipublikasikan pada sistem lama.' : ($base<=0 ? 'Gaji pokok belum diisi. Atur melalui tab Gaji Pokok.' : '')]);
}
function salary_preview(mysqli $db, string $month): array {
    $period = salary_period($month);
    $employees = salary_query($db, salary_employee_sql() . ' AND e.join_date<=? ORDER BY e.full_name,e.id', 's', [$period['period_end']])->get_result()->fetch_all(MYSQLI_ASSOC);
    return array_map(fn($employee) => salary_calculate($db, $employee, $period), $employees);
}
function salary_read(mysqli $db, int $id): array {
    $request = salary_query($db, 'SELECT s.*,f.id AS finance_record_id FROM salary_requests s LEFT JOIN finance_records f ON f.salary_request_id=s.id WHERE s.id=?', 'i', [$id])->get_result()->fetch_assoc();
    if (!$request) salary_fail('Pengajuan penggajian tidak ditemukan.', 404);
    $request['attendance'] = json_decode($request['attendance_json'], true, 512, JSON_THROW_ON_ERROR); unset($request['attendance_json']);
    $request['history'] = salary_query($db, 'SELECT * FROM salary_request_history WHERE salary_request_id=? ORDER BY id DESC', 'i', [$id])->get_result()->fetch_all(MYSQLI_ASSOC);
    $request['slip'] = salary_query($db, 'SELECT id,published_by_name,published_at,recipient_email,email_status,email_attempts,email_sent_at,email_error FROM salary_slips WHERE salary_request_id=?', 'i', [$id])->get_result()->fetch_assoc() ?: null;
    return salary_normalize_totals($request);
}
function salary_history(mysqli $db, int $id, array $actor, string $action, string $note = ''): void {
    $snapshot = salary_read($db, $id); unset($snapshot['history']);
    salary_query($db, 'INSERT INTO salary_request_history(salary_request_id,action,actor_id,actor_name,actor_role,note,snapshot_json) VALUES(?,?,?,?,?,?,?)',
        'isissss', [$id,$action,(int)$actor['id'],$actor['name'],$actor['role'],$note,json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
}
function salary_store_calculation(mysqli $db, int $id, array $calculation, array $data, ?array $previous = null): void {
    $calculation=salary_apply_adjustments($calculation,$data,$previous);
    $bank = salary_text($data['bank_name'] ?? (($previous['bank_name'] ?? '') ?: ($calculation['bank_name'] ?? '')), 'Nama bank', 100, false);
    $name = salary_text($data['account_name'] ?? (($previous['account_name'] ?? '') ?: ($calculation['account_name'] ?? '')), 'Pemilik rekening', 150, false);
    $account = salary_text($data['account_number'] ?? (($previous['account_number'] ?? '') ?: ($calculation['account_number'] ?? '')), 'Nomor rekening', 100, false);
    salary_query($db, 'UPDATE salary_requests SET employee_code=?,employee_name=?,position_name=?,period_start=?,period_end=?,payday=?,base_salary=?,salary_source=?,work_days=?,meal_rate=?,transport_rate=?,meal_allowance=?,transport_allowance=?,total_salary=?,attendance_json=?,bank_name=?,account_name=?,account_number=? WHERE id=?',
        'ssssssssisssssssssi', [$calculation['employee_code'],$calculation['employee_name'],$calculation['position_name'],$calculation['period_start'],$calculation['period_end'],$calculation['payday'],
        $calculation['base_salary'],$calculation['salary_source'],$calculation['work_days'],$calculation['meal_rate'],$calculation['transport_rate'],$calculation['meal_allowance'],$calculation['transport_allowance'],
        $calculation['total_salary'],json_encode($calculation['attendance'], JSON_THROW_ON_ERROR),$bank,$name,$account,$id]);
    salary_query($db, 'UPDATE salary_requests SET base_salary_rate_id=?,base_salary_effective_month=? WHERE id=?', 'isi', [$calculation['base_salary_rate_id'],$calculation['base_salary_effective_month'],$id]);
    salary_query($db,'UPDATE salary_requests SET employee_join_date=?,thr_amount=?,kasbon_deduction=?,bpjs_tk_deduction=?,bpjs_kes_deduction=?,pph21_deduction=?,leave_deduction=?,gross_salary=?,total_deductions=?,adjustment_note=? WHERE id=?',
        'ssssssssssi',[$calculation['join_date'],$calculation['thr_amount'],$calculation['kasbon_deduction'],$calculation['bpjs_tk_deduction'],$calculation['bpjs_kes_deduction'],$calculation['pph21_deduction'],$calculation['leave_deduction'],$calculation['gross_salary'],$calculation['total_deductions'],$calculation['adjustment_note'],$id]);
}
function salary_mutate(mysqli $db, array $actor, array $data): array {
    salary_require_access($actor);
    $action = $data['action'] ?? '';
    if (!in_array($action, ['prepare','refresh','submit','approve','reject','reopen','pay'], true)) salary_fail('Aksi penggajian tidak valid.');
    $permissions = salary_permissions($actor);
    if (in_array($action, ['approve','reject'], true) ? !$permissions['can_approve'] : !$permissions['can_prepare']) salary_fail('Anda tidak berhak melakukan aksi penggajian ini.', 403);
    // Resolve the immutable owner before starting the transaction, so a waiting
    // writer does not retain a read snapshot from before the employee lock.
    $owner = null;
    if ($action !== 'prepare') {
        $owner = salary_query($db, 'SELECT employee_id FROM salary_requests WHERE id=?', 'i', [(int)($data['id'] ?? 0)])->get_result()->fetch_assoc();
        if (!$owner) salary_fail('Pengajuan penggajian tidak ditemukan.', 404);
    }
    $db->begin_transaction();
    try {
        if ($action === 'prepare') {
            $period = salary_period($data['month'] ?? '');
            $employeeId = (int)($data['employee_id'] ?? 0);
            salary_query($db, 'SELECT id FROM employees WHERE id=? FOR UPDATE', 'i', [$employeeId]);
            $existing = salary_query($db, 'SELECT id FROM salary_requests WHERE employee_id=? AND month=?', 'is', [$employeeId,$period['month']])->get_result()->fetch_assoc();
            if ($existing) { $result = salary_read($db, (int)$existing['id']); $db->commit(); return $result; }
            $employee = salary_query($db, salary_employee_sql().' AND e.id=? AND e.join_date<=? FOR UPDATE', 'is', [$employeeId,$period['period_end']])->get_result()->fetch_assoc();
            if (!$employee) salary_fail('Karyawan aktif tidak ditemukan pada periode ini.', 404);
            $calculation = salary_calculate($db, $employee, $period, true);
            if (!$calculation['can_prepare']) salary_fail($calculation['issue'], 409);
            // Insert a complete draft; server-computed amounts replace all client amounts.
            salary_query($db, "INSERT INTO salary_requests(employee_id,month,employee_code,employee_name,position_name,period_start,period_end,payday,base_salary,salary_source,work_days,meal_rate,transport_rate,meal_allowance,transport_allowance,total_salary,attendance_json,created_by,created_by_name)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,30000,20000,?,?,?, ?,?,?)", 'isssssssssissssis',
                [$employeeId,$period['month'],$calculation['employee_code'],$calculation['employee_name'],$calculation['position_name'],$period['period_start'],$period['period_end'],$period['payday'],$calculation['base_salary'],$calculation['salary_source'],$calculation['work_days'],$calculation['meal_allowance'],$calculation['transport_allowance'],$calculation['total_salary'],json_encode($calculation['attendance'], JSON_THROW_ON_ERROR),(int)$actor['id'],$actor['name']]);
            $id = (int)$db->insert_id;
            salary_store_calculation($db, $id, $calculation, $data);
            salary_history($db, $id, $actor, 'prepare');
        } else {
            $id = (int)($data['id'] ?? 0);
            // All payroll/master writers lock employee first, then the request.
            salary_query($db, 'SELECT id FROM employees WHERE id=? FOR UPDATE', 'i', [(int)$owner['employee_id']]);
            $request = salary_query($db, 'SELECT * FROM salary_requests WHERE id=? FOR UPDATE', 'i', [$id])->get_result()->fetch_assoc();
            if (!$request) salary_fail('Pengajuan penggajian tidak ditemukan.', 404);
            if (($action==='approve' && $request['status']==='approved') || ($action==='pay' && $request['status']==='paid')) {
                $result = salary_read($db, $id); $db->commit(); return $result;
            }
            if ((int)($data['version'] ?? 0) !== (int)$request['version']) salary_fail('Data penggajian telah berubah. Muat ulang rincian.', 409);
            if (in_array($action, ['refresh','reopen'], true)) {
                if ($request['status'] !== ($action==='refresh' ? 'draft' : 'rejected')) salary_fail('Hanya draft atau pengajuan ditolak yang dapat dihitung ulang.', 409);
                salary_query($db, 'SELECT id FROM employees WHERE id=? FOR UPDATE', 'i', [(int)$request['employee_id']]);
                $employee = salary_query($db, salary_employee_sql().' AND e.id=? FOR UPDATE', 'i', [(int)$request['employee_id']])->get_result()->fetch_assoc();
                if (!$employee) salary_fail('Karyawan sudah tidak aktif.', 409);
                $calculation = salary_calculate($db, $employee, salary_period($request['month']), true);
                if (!$calculation['can_prepare']) salary_fail($calculation['issue'], 409);
                salary_store_calculation($db, $id, $calculation, $data, $request);
                salary_query($db, "UPDATE salary_requests SET status='draft',version=version+1 WHERE id=?", 'i', [$id]);
            } elseif ($action === 'submit') {
                if ($request['status'] !== 'draft') salary_fail('Hanya draft dapat diajukan.', 409);
                if (salary_today() <= $request['period_end']) salary_fail('Pengajuan baru dapat dilakukan setelah periode absensi berakhir.', 409);
                if (!$request['bank_name'] || !$request['account_name'] || !$request['account_number']) salary_fail('Lengkapi bank, pemilik rekening, dan nomor rekening sebelum mengajukan.');
                $employee = salary_query($db, salary_employee_sql().' AND e.id=? FOR UPDATE', 'i', [(int)$request['employee_id']])->get_result()->fetch_assoc();
                if (!$employee) salary_fail('Karyawan sudah tidak aktif.', 409);
                $current = salary_apply_adjustments(salary_calculate($db, $employee, salary_period($request['month']), true),[],$request);
                if (!$current['can_prepare']) salary_fail($current['issue'], 409);
                $normalized=salary_normalize_totals($request);
                foreach (['base_salary','work_days','total_salary','gross_salary','total_deductions','base_salary_rate_id','base_salary_effective_month'] as $field) if ((string)$current[$field] !== (string)$normalized[$field]) salary_fail('Absensi atau gaji pokok telah berubah. Perbarui perhitungan sebelum mengajukan.', 409);
                if (json_encode($current['attendance'], JSON_THROW_ON_ERROR) !== $request['attendance_json']) salary_fail('Rincian absensi berubah. Perbarui perhitungan sebelum mengajukan.', 409);
                salary_query($db, "UPDATE salary_requests SET status='submitted',submitted_by=?,submitted_by_name=?,submitted_at=NOW(),version=version+1 WHERE id=?", 'isi', [(int)$actor['id'],$actor['name'],$id]);
            } elseif (in_array($action, ['approve','reject'], true)) {
                if ($request['status'] !== 'submitted') salary_fail('Hanya pengajuan yang menunggu Admin dapat diputuskan.', 409);
                if ((int)$request['submitted_by'] === (int)$actor['id'] || (int)$request['created_by'] === (int)$actor['id']) salary_fail('Pengaju tidak dapat menyetujui penggajian sendiri.', 403);
                $note = salary_text($data['note'] ?? '', 'Catatan keputusan', 2000, $action==='reject');
                salary_query($db, 'UPDATE salary_requests SET status=?,reviewed_by=?,reviewed_by_name=?,reviewed_at=NOW(),review_note=?,version=version+1 WHERE id=?', 'sissi', [$action==='approve'?'approved':'rejected',(int)$actor['id'],$actor['name'],$note,$id]);
            } elseif ($action === 'pay') {
                if ($request['status'] !== 'approved') salary_fail('Transfer hanya dapat dicatat untuk gaji yang disetujui Admin.', 409);
                $date = salary_text($data['paid_date'] ?? '', 'Tanggal transfer', 10);
                $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
                if (!$parsed || $parsed->format('Y-m-d') !== $date || $date < $request['payday'] || $date > salary_today() || $date < substr($request['reviewed_at'],0,10)) salary_fail('Tanggal transfer harus pada/setelah jadwal gajian dan persetujuan Admin, serta tidak di masa depan.');
                $reference = salary_text($data['transfer_reference'] ?? '', 'Referensi transfer bank', 180);

                // ── P0-003: Employer BPJS Contributions (PP 44/45/2015 & Perpres 64/2020) ──
                $baseSalary    = (float)($request['base_salary'] ?? 0);
                $empTkContrib  = salary_calculate_bpjs_tk($baseSalary);
                $empKesContrib = salary_calculate_bpjs_kes($baseSalary);
                $totalEmployerBpjsTk  = (float)($empTkContrib['total_employer']);  // JHT 3.7% + JP 2% + JKK 0.24% + JKM 0.30%
                $totalEmployerBpjsKes = (float)($empKesContrib['total_employer']); // Kes 4.0%
                $totalEmployerBpjs    = $totalEmployerBpjsTk + $totalEmployerBpjsKes;

                // Catat pembayaran gaji bersih ke karyawan
                salary_query($db, "INSERT INTO finance_records(type,category,amount,description,source,transaction_date,created_by,bank_name,account_name,account_number,salary_request_id)
                    VALUES('expense','Penggajian Karyawan',?,?,?,?,?,?,?,?,?)", 'ssssisssi',
                    [$request['total_salary'],'Gaji '.$request['month'].' — '.$request['employee_name'].' ('.$reference.')','Persetujuan Admin: '.$request['reviewed_by_name'],$date,(int)$actor['id'],$request['bank_name'],$request['account_name'],$request['account_number'],$id]);

                // Catat iuran BPJS Ketenagakerjaan Perusahaan (Beban Perusahaan)
                if ($totalEmployerBpjsTk > 0) {
                    salary_query($db, "INSERT INTO finance_records(type,category,amount,description,source,transaction_date,created_by,salary_request_id)
                        VALUES('expense','BPJS Ketenagakerjaan Perusahaan',?,?,?,?,?,?)", 'ssssisi',
                        [$totalEmployerBpjsTk,
                         'Iuran BPJS TK Perusahaan — '.$request['employee_name'].' ('.$request['month'].') JHT 3.7%+JP 2%+JKK 0.24%+JKM 0.3%',
                         'PP 44/45/2015 — Kontribusi Pemberi Kerja',
                         $date, (int)$actor['id'], $id]);
                }

                // Catat iuran BPJS Kesehatan Perusahaan (Beban Perusahaan)
                if ($totalEmployerBpjsKes > 0) {
                    salary_query($db, "INSERT INTO finance_records(type,category,amount,description,source,transaction_date,created_by,salary_request_id)
                        VALUES('expense','BPJS Kesehatan Perusahaan',?,?,?,?,?,?)", 'ssssisi',
                        [$totalEmployerBpjsKes,
                         'Iuran BPJS Kesehatan Perusahaan — '.$request['employee_name'].' ('.$request['month'].') Kes 4%',
                         'Perpres 64/2020 — Kontribusi Pemberi Kerja',
                         $date, (int)$actor['id'], $id]);
                }

                // Simpan employer BPJS ke salary_requests untuk slip gaji & laporan
                $db->query("ALTER TABLE salary_requests ADD COLUMN IF NOT EXISTS bpjs_tk_employer DECIMAL(12,2) DEFAULT 0.00");
                $db->query("ALTER TABLE salary_requests ADD COLUMN IF NOT EXISTS bpjs_kes_employer DECIMAL(12,2) DEFAULT 0.00");
                $db->query("ALTER TABLE salary_requests ADD COLUMN IF NOT EXISTS total_employer_bpjs DECIMAL(12,2) DEFAULT 0.00");
                salary_query($db, "UPDATE salary_requests SET bpjs_tk_employer=?,bpjs_kes_employer=?,total_employer_bpjs=? WHERE id=?",
                    'sssi', [$totalEmployerBpjsTk, $totalEmployerBpjsKes, $totalEmployerBpjs, $id]);

                // Auto-insert audit log
                if (salary_audit_table_exists($db)) {
                    $ip   = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
                    $ip   = trim(explode(',', $ip)[0]);
                    $prevHash = salary_last_audit_hash($db);
                    $details  = json_encode([
                        'actor_role'    => 'Finance & Payroll Admin',
                        'amount'        => (float)$request['total_salary'],
                        'employee_name' => $request['employee_name'],
                        'period'        => $request['month'],
                        'bpjs_tk_employer'  => $totalEmployerBpjsTk,
                        'bpjs_kes_employer' => $totalEmployerBpjsKes,
                        'total_employer_bpjs' => $totalEmployerBpjs,
                        'transfer_reference' => $reference,
                    ], JSON_UNESCAPED_UNICODE);
                    $stmt2 = $db->prepare("INSERT INTO accounting_audit_logs(entity_type,entity_id,action,actor_id,actor_name,details_json,ip_address,hash_prev) VALUES('payroll',?,?,?,?,?,?,?)");
                    $entityId = 'PAYROLL-'.$id;
                    $stmt2->bind_param('ssissss', $entityId,'PAY',(int)$actor['id'],$actor['name'],$details,$ip,$prevHash);
                    $stmt2->execute();
                    $insertedLogId = (int)$db->insert_id;
                    $selfHash = hash('sha256', $prevHash.$insertedLogId.'payroll'.$entityId.'PAY'.$actor['id'].$date);
                    $db->query("UPDATE accounting_audit_logs SET hash_self='$selfHash' WHERE id=$insertedLogId");
                    $stmt2->close();
                }

                salary_query($db, "UPDATE salary_requests SET status='paid',paid_by=?,paid_by_name=?,paid_at=NOW(),paid_date=?,transfer_reference=?,version=version+1 WHERE id=?", 'isssi', [(int)$actor['id'],$actor['name'],$date,$reference,$id]);
            }
            salary_history($db, $id, $actor, $action, $data['note'] ?? '');
        }
        $result = salary_read($db, $id); $db->commit(); return $result;
    } catch (Throwable $error) { $db->rollback(); throw $error; }
}
