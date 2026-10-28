<?php
class SalaryWorkflowException extends RuntimeException {}
function salary_fail(string $message, int $code = 422): void { throw new SalaryWorkflowException($message, $code); }
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
function salary_manual_fields(): array {
    return ['thr_amount'=>'THR', 'kasbon_deduction'=>'Kasbon', 'bpjs_tk_deduction'=>'BPJS Ketenagakerjaan', 'bpjs_kes_deduction'=>'BPJS Kesehatan', 'leave_deduction'=>'Izin / Sakit'];
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
    foreach (salary_manual_fields() as $key=>$label) {
        $value=array_key_exists($key,$data) ? $data[$key] : ($previous[$key] ?? '0');
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
        IF(e.base_salary>0,'employee','position') AS salary_source
        FROM employees e JOIN users u ON u.id=e.user_id JOIN roles r ON r.id=u.role_id
        WHERE u.is_active=1 AND LOWER(r.name) IN ('karyawan','employee','staff')";
}
function salary_apply_base_rate(mysqli $db, array $employee, string $month, bool $lock = false): array {
    $rate = salary_query($db, 'SELECT id,amount,effective_month FROM salary_base_rates WHERE employee_id=? AND effective_month<=? ORDER BY effective_month DESC,id DESC LIMIT 1'.($lock ? ' FOR UPDATE' : ''), 'is', [(int)$employee['employee_id'],$month])->get_result()->fetch_assoc();
    $employee['base_salary_rate_id'] = $rate ? (int)$rate['id'] : null;
    $employee['base_salary_effective_month'] = $rate['effective_month'] ?? null;
    if ($rate) { $employee['base_salary']=$rate['amount']; $employee['salary_source']='master'; }
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
        salary_query($db, 'INSERT INTO salary_base_rates(employee_id,effective_month,amount,reason,actor_id,actor_name,actor_role) VALUES(?,?,?,?,?,?,?)', 'isssiss', [$employeeId,$month,salary_decimal($amount),$reason,(int)$actor['id'],$actor['name'],$actor['role']]);
        $result = ['id'=>(int)$db->insert_id,'employee_id'=>$employeeId,'effective_month'=>$month,'amount'=>salary_decimal($amount)];
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
    salary_query($db,'UPDATE salary_requests SET employee_join_date=?,thr_amount=?,kasbon_deduction=?,bpjs_tk_deduction=?,bpjs_kes_deduction=?,leave_deduction=?,gross_salary=?,total_deductions=?,adjustment_note=? WHERE id=?',
        'sssssssssi',[$calculation['join_date'],$calculation['thr_amount'],$calculation['kasbon_deduction'],$calculation['bpjs_tk_deduction'],$calculation['bpjs_kes_deduction'],$calculation['leave_deduction'],$calculation['gross_salary'],$calculation['total_deductions'],$calculation['adjustment_note'],$id]);
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
                salary_query($db, "INSERT INTO finance_records(type,category,amount,description,source,transaction_date,created_by,bank_name,account_name,account_number,salary_request_id)
                    VALUES('expense','Penggajian Karyawan',?,?,?,?,?,?,?,?,?)", 'ssssisssi',
                    [$request['total_salary'],'Gaji '.$request['month'].' — '.$request['employee_name'].' ('.$reference.')','Persetujuan Admin: '.$request['reviewed_by_name'],$date,(int)$actor['id'],$request['bank_name'],$request['account_name'],$request['account_number'],$id]);
                salary_query($db, "UPDATE salary_requests SET status='paid',paid_by=?,paid_by_name=?,paid_at=NOW(),paid_date=?,transfer_reference=?,version=version+1 WHERE id=?", 'isssi', [(int)$actor['id'],$actor['name'],$date,$reference,$id]);
            }
            salary_history($db, $id, $actor, $action, $data['note'] ?? '');
        }
        $result = salary_read($db, $id); $db->commit(); return $result;
    } catch (Throwable $error) { $db->rollback(); throw $error; }
}
