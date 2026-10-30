<?php
require_once __DIR__.'/salary_workflow.php';
require_once __DIR__.'/salary_mail.php';
require_once __DIR__.'/salary_slip_document.php';

function salary_slip_profile(mysqli $db, int $employeeId, bool $lock = false): array {
    $profile = salary_query($db,'SELECT e.user_id,u.email AS recipient_email,e.bank_name,e.bank_account,e.full_name AS account_name,e.join_date,e.bpjs_tk,e.bpjs_kes,e.npwp,e.marital_status,u.is_active
        FROM employees e JOIN users u ON u.id=e.user_id WHERE e.id=?'.($lock?' FOR UPDATE':''),'i',[$employeeId])->get_result()->fetch_assoc();
    if (!$profile) salary_fail('Profil karyawan tidak ditemukan. Hubungi HRD.',409);
    return $profile;
}
function salary_slip_snapshot(array $request, array $profile): array {
    $request=salary_normalize_totals($request);
    $keys=['id','employee_id','month','employee_code','employee_name','position_name','employee_join_date','period_start','period_end','payday','base_salary','salary_source','base_salary_effective_month','work_days','meal_rate','transport_rate','meal_allowance','transport_allowance','thr_amount','kasbon_deduction','bpjs_tk_deduction','bpjs_kes_deduction','pph21_deduction','leave_deduction','gross_salary','total_deductions','adjustment_note','total_salary','bank_name','account_name','account_number','reviewed_by_name','reviewed_at'];
    $snapshot=array_intersect_key($request,array_flip($keys));
    $snapshot['employee_join_date']=$request['employee_join_date'] ?? $profile['join_date'];
    $snapshot['user_id']=(int)$profile['user_id'];
    $snapshot['recipient_email']=trim($profile['recipient_email']);
    $snapshot['bpjs_tk_number']=trim($profile['bpjs_tk'] ?? '');
    $snapshot['bpjs_kes_number']=trim($profile['bpjs_kes'] ?? '');
    $snapshot['npwp']=trim($profile['npwp'] ?? '');
    $snapshot['marital_status']=trim($profile['marital_status'] ?? '');
    return salary_slip_payment($snapshot,$request);
}
function salary_slip_payment(array $snapshot, array $request): array {
    $snapshot['payment_status']=$request['status'];
    $snapshot['paid_date']=$request['paid_date'] ?? null;
    $snapshot['transfer_reference']=$request['transfer_reference'] ?? null;
    return $snapshot;
}
function salary_slip_publication(mysqli $db, int $requestId): ?array {
    $row=salary_query($db,'SELECT * FROM salary_slips WHERE salary_request_id=?','i',[$requestId])->get_result()->fetch_assoc();
    return $row ?: null;
}
function salary_slip_token(array $snapshot): string { return hash('sha256',json_encode($snapshot,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)); }
function salary_slip_preview(mysqli $db, array $actor, int $requestId): array {
    $request=salary_read($db,$requestId);
    $publication=salary_slip_publication($db,$requestId);
    $manages=in_array($actor['role'],['finance','admin','super_admin'],true);
    if (!$manages && (!$publication || !in_array($actor['role'],['karyawan','employee','staff'],true) || (int)$publication['user_id'] !== (int)$actor['id'])) salary_fail('Anda tidak berhak melihat slip ini.',403);
    if (!in_array($request['status'],['approved','paid'],true)) salary_fail('Slip hanya tersedia setelah Admin menyetujui penggajian.',409);
    $warnings=[];
    if ($publication) {
        $snapshot=salary_slip_payment(json_decode($publication['snapshot_json'],true,512,JSON_THROW_ON_ERROR),$request);
        unset($publication['snapshot_json']);
        $publication['events']=salary_query($db,'SELECT action,actor_name,note,created_at FROM salary_slip_events WHERE salary_slip_id=? ORDER BY id DESC','i',[(int)$publication['id']])->get_result()->fetch_all(MYSQLI_ASSOC);
    } else {
        $profile=salary_slip_profile($db,(int)$request['employee_id']);
        $snapshot=salary_slip_snapshot($request,$profile);
        if ($request['bank_name'] !== ($profile['bank_name'] ?? '') || $request['account_number'] !== ($profile['bank_account'] ?? '') || $request['account_name'] !== $profile['account_name']) $warnings[]='Rekening pada profil terbaru berbeda dari rekening penggajian yang disetujui. Periksa tujuan transfer sebelum menerbitkan slip.';
        if (!(int)$profile['is_active']) $warnings[]='Akun karyawan sudah tidak aktif. Slip belum dapat diterbitkan.';
    }
    $result=['request_id'=>$requestId,'salary_version'=>(int)$request['version'],'snapshot'=>$snapshot,'preview_token'=>salary_slip_token($snapshot),
        'published'=>(bool)$publication,'publication'=>$publication,'profile_warnings'=>$warnings,'document_html'=>salary_slip_html($snapshot)];
    if ($manages) $result['email_configured']=salary_mail_configured();
    return $result;
}
function salary_slip_event(mysqli $db, int $slipId, array $actor, string $action, string $note=''): void {
    salary_query($db,'INSERT INTO salary_slip_events(salary_slip_id,action,actor_id,actor_name,note) VALUES(?,?,?,?,?)','isiss',[$slipId,$action,(int)$actor['id'],$actor['name'],$note]);
}
function salary_slip_publish(mysqli $db, array $actor, array $data): array {
    salary_require_access($actor);
    if ($actor['role'] !== 'finance') salary_fail('Hanya Finance dapat memeriksa dan menerbitkan slip gaji.',403);
    $id=(int)($data['id'] ?? 0);
    $owner=salary_query($db,'SELECT employee_id FROM salary_requests WHERE id=?','i',[$id])->get_result()->fetch_assoc();
    if (!$owner) salary_fail('Penggajian tidak ditemukan.',404);
    $db->begin_transaction();
    try {
        salary_query($db,'SELECT id FROM employees WHERE id=? FOR UPDATE','i',[(int)$owner['employee_id']]);
        $request=salary_query($db,'SELECT * FROM salary_requests WHERE id=? FOR UPDATE','i',[$id])->get_result()->fetch_assoc();
        if (!in_array($request['status'],['approved','paid'],true)) salary_fail('Admin harus menyetujui penggajian sebelum slip diterbitkan.',409);
        if (salary_slip_publication($db,$id)) { $db->commit(); return salary_slip_preview($db,$actor,$id)+['created_now'=>false]; }
        if ((int)($data['version'] ?? 0) !== (int)$request['version']) salary_fail('Penggajian berubah. Buka ulang pratinjau slip.',409);
        if (($data['checked'] ?? false) !== true) salary_fail('Periksa slip dan konfirmasi bahwa datanya sudah benar.');
        $profile=salary_slip_profile($db,(int)$request['employee_id'],true);
        if (!(int)$profile['is_active']) salary_fail('Akun karyawan sudah tidak aktif.',409);
        $snapshot=salary_slip_snapshot($request,$profile);
        if (!filter_var($snapshot['recipient_email'],FILTER_VALIDATE_EMAIL)) salary_fail('Email pada profil karyawan belum valid. Lengkapi melalui data karyawan.');
        if (!is_string($data['preview_token'] ?? null) || !hash_equals(salary_slip_token($snapshot),$data['preview_token'])) salary_fail('Data profil atau penggajian berubah sejak pratinjau dibuka. Periksa ulang slip sebelum menerbitkan.',409);
        salary_query($db,'INSERT INTO salary_slips(salary_request_id,employee_id,user_id,recipient_email,snapshot_json,published_by,published_by_name) VALUES(?,?,?,?,?,?,?)','iiissis',
            [$id,(int)$request['employee_id'],(int)$profile['user_id'],$snapshot['recipient_email'],json_encode($snapshot,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),(int)$actor['id'],$actor['name']]);
        $slipId=(int)$db->insert_id;
        salary_slip_event($db,$slipId,$actor,'publish','Slip diperiksa Finance dan diterbitkan ke dashboard karyawan.');
        salary_query($db,'UPDATE salary_requests SET version=version+1 WHERE id=?','i',[$id]);
        salary_history($db,$id,$actor,'publish_slip');
        $db->commit();
        return salary_slip_preview($db,$actor,$id)+['created_now'=>true];
    } catch (Throwable $error) { $db->rollback(); throw $error; }
}
function salary_slip_deliver(mysqli $db, array $actor, int $requestId, ?callable $transport = null): array {
    salary_require_access($actor);
    if ($actor['role'] !== 'finance') salary_fail('Hanya Finance dapat mengirim email slip gaji.',403);
    $slip=salary_slip_publication($db,$requestId);
    if (!$slip) salary_fail('Periksa dan terbitkan slip dahulu.',409);
    if ($transport === null && !salary_mail_configured()) return salary_slip_preview($db,$actor,$requestId);
    // Atomic claim prevents two clicks/workers from sending the same slip together.
    $claimed=salary_query($db,"UPDATE salary_slips SET email_status='sending',email_attempts=email_attempts+1,email_error=NULL WHERE id=? AND email_status IN ('pending','failed')",'i',[(int)$slip['id']]);
    if (!$claimed->affected_rows) return salary_slip_preview($db,$actor,$requestId);
    salary_slip_event($db,(int)$slip['id'],$actor,'email_attempt','Pengiriman email dimulai.');
    $snapshot=salary_slip_payment(json_decode($slip['snapshot_json'],true,512,JSON_THROW_ON_ERROR),salary_read($db,$requestId));
    $messageId='<creativa-salary-'.$requestId.'-'.$slip['id'].'@one-creativa.local>';
    try {
        if ($transport) $transport($snapshot,salary_slip_html($snapshot),$messageId);
        else salary_mail_send($snapshot,salary_slip_html($snapshot),$messageId);
    } catch (Throwable $error) {
        salary_query($db,"UPDATE salary_slips SET email_status='failed',email_error=? WHERE id=?",'si',['Email gagal dikirim. Periksa konfigurasi SMTP, lalu coba lagi. Jika server sempat menerima pesan, periksa email tujuan terlebih dahulu.',(int)$slip['id']]);
        salary_slip_event($db,(int)$slip['id'],$actor,'email_failed','Pengiriman gagal. Slip tetap tersedia di dashboard karyawan.');
        return salary_slip_preview($db,$actor,$requestId);
    }
    // A crash after SMTP acceptance must not trigger an automatic retry. A row
    // left in "sending" requires checking provider delivery logs first.
    $db->begin_transaction();
    try {
        salary_query($db,"UPDATE salary_slips SET email_status='sent',email_sent_at=NOW(),email_message_id=?,email_error=NULL WHERE id=?",'si',[$messageId,(int)$slip['id']]);
        salary_slip_event($db,(int)$slip['id'],$actor,'email_sent','Email diterima oleh server SMTP.');
        salary_history($db,$requestId,$actor,'send_slip_email'); $db->commit();
    } catch (Throwable $error) { $db->rollback(); throw $error; }
    return salary_slip_preview($db,$actor,$requestId);
}
