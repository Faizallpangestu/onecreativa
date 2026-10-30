<?php
// Shared accounting primitives. Decimal values stay strings at API/SQL boundaries.
class AccountingException extends RuntimeException {}
function ac_fail(string $message, int $status = 422): never { throw new AccountingException($message, $status); }
function ac_query(mysqli $db, string $sql, array $params = []): mysqli_stmt {
    $stmt = $db->prepare($sql);
    if ($params) { $types = ''; foreach ($params as $p) $types .= is_int($p) ? 'i' : 's'; $stmt->bind_param($types, ...$params); }
    $stmt->execute(); return $stmt;
}
function ac_rows(mysqli $db, string $sql, array $params = []): array { return ac_query($db, $sql, $params)->get_result()->fetch_all(MYSQLI_ASSOC); }
function ac_one(mysqli $db, string $sql, array $params = []): ?array { return ac_query($db, $sql, $params)->get_result()->fetch_assoc(); }
function ac_text($value, string $label, int $max = 255, bool $required = true): string {
    if (!is_string($value) || mb_strlen(trim($value)) > $max || ($required && trim($value) === '')) ac_fail("$label tidak valid.");
    return trim($value);
}
function ac_id($value, string $label = 'ID'): int {
    if ((!is_int($value) && !is_string($value)) || !preg_match('/^[1-9]\d{0,9}$/D', (string)$value)) ac_fail("$label tidak valid.");
    return (int)$value;
}
function ac_cents($value): int {
    if ((!is_string($value) && !is_int($value)) || !preg_match('/^\d{1,13}(\.\d{1,2})?$/D', (string)$value)) ac_fail('Nominal harus berupa decimal positif, maksimal dua desimal.');
    $parts = explode('.', (string)$value); return (int)$parts[0]*100+(int)str_pad($parts[1]??'', 2, '0');
}
function ac_decimal(int $cents): string { return ($cents<0?'-':'').intdiv(abs($cents),100).'.'.str_pad((string)(abs($cents)%100),2,'0',STR_PAD_LEFT); }
function ac_add(int $a, int $b): int {
    if ($a > 999999999999999-$b || $a < -999999999999999-$b) ac_fail('Jumlah melebihi batas nominal.'); return $a+$b;
}
function ac_date($value): string {
    if (!is_string($value)) ac_fail('Tanggal tidak valid.');
    $parsed=DateTimeImmutable::createFromFormat('!Y-m-d',$value);
    if (!$parsed || $parsed->format('Y-m-d')!==$value) ac_fail('Tanggal harus YYYY-MM-DD.'); return $value;
}
function ac_table(mysqli $db, string $table): bool {
    return (bool)ac_one($db,'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',[$table]);
}
function ac_ready(mysqli $db): void {
    if (!ac_table($db,'accounting_transactions')) ac_fail('Fondasi akuntansi belum diaktifkan. Hubungi administrator sebelum mencatat transaksi.',503);
}
function ac_can(mysqli $db, array $actor, string $permission): bool {
    $permissionRole=$actor['role']==='finance_admin'?'finance':$actor['role'];
    if (ac_table($db,'finance_role_permissions')) {
        $row=ac_one($db,'SELECT allowed FROM finance_role_permissions WHERE role_name=? AND permission=?',[$actor['role'],$permission]);
        if ($row) return (bool)$row['allowed'];
        if($permissionRole!==$actor['role']){$row=ac_one($db,'SELECT allowed FROM finance_role_permissions WHERE role_name=? AND permission=?',[$permissionRole,$permission]);if($row)return (bool)$row['allowed'];}
    }
    $defaults=['read'=>['finance','admin','super_admin','director','direktur'], 'prepare'=>['finance'],
        'approve'=>['admin','super_admin','director','direktur'], 'post'=>['finance'], 'configure'=>['super_admin','admin']];
    return in_array($permissionRole,$defaults[$permission]??[],true);
}
function ac_require(mysqli $db, array $actor, string $permission): void { if (!ac_can($db,$actor,$permission)) ac_fail('Anda tidak berhak melakukan aksi ini.',403); }
function ac_audit(mysqli $db,array $actor,string $entity,string $id,string $action,array $details=[]):void {
    $actorName = (string)($actor['name'] ?? $actor['full_name'] ?? $actor['email'] ?? $actor['username'] ?? 'System');
    $actorId   = (int)($actor['id'] ?? 0);
    // Real IP (handles Cloudflare, nginx proxy)
    $ip  = trim(explode(',', ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'))[0]);
    // Hash chain: fetch last hash_self
    $prevRow  = ac_one($db, 'SELECT hash_self FROM accounting_audit_logs ORDER BY id DESC LIMIT 1');
    $prevHash = $prevRow['hash_self'] ?? '';
    $detailsJson = json_encode($details, JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
    ac_query($db,'INSERT INTO accounting_audit_logs(entity_type,entity_id,action,actor_id,actor_name,details_json,ip_address,hash_prev) VALUES(?,?,?,?,?,?,?,?)',
        [$entity,$id,$action,$actorId,$actorName,$detailsJson,$ip,$prevHash]);
    $logId    = (int)$db->insert_id;
    $ts       = date('Y-m-d H:i:s');
    $selfHash = hash('sha256', $prevHash.$logId.$entity.$id.$action.$actorId.$ts);
    $db->query("UPDATE accounting_audit_logs SET hash_self='$selfHash' WHERE id=$logId");
}
function ac_atomic(mysqli $db, callable $call) { $db->begin_transaction(); try { $result=$call(); $db->commit(); return $result; } catch(Throwable $error) { $db->rollback(); throw $error; } }
function ac_key($value): string { $key=ac_text($value,'Idempotency key',100); if (!preg_match('/^[a-zA-Z0-9_-]{8,100}$/D',str_replace('-','_',$key))) ac_fail('Idempotency key tidak valid.'); return $key; }
function ac_retry(mysqli $db,array $actor,string $key,string $operation,array $payload):?array {
    // Caller owns the transaction. Serialize per actor before any document locks.
    ac_query($db,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$actor['id']]);
    $hash=hash('sha256',json_encode($payload,JSON_THROW_ON_ERROR));
    $row=ac_one($db,'SELECT * FROM accounting_idempotency WHERE request_key=? FOR UPDATE',[$key]);
    if ($row) {
        if ((int)$row['actor_id']!==(int)$actor['id'] || $row['operation']!==$operation || $row['payload_hash']!==$hash) ac_fail('Key sudah dipakai untuk permintaan berbeda.',409);
        return json_decode($row['result_json'],true,512,JSON_THROW_ON_ERROR);
    }
    return null;
}
function ac_remember(mysqli $db,array $actor,string $key,string $operation,array $payload,array $result):void {
    ac_query($db,'INSERT INTO accounting_idempotency(request_key,actor_id,operation,payload_hash,result_json) VALUES(?,?,?,?,?)',
        [$key,(int)$actor['id'],$operation,hash('sha256',json_encode($payload,JSON_THROW_ON_ERROR)),json_encode($result,JSON_THROW_ON_ERROR)]);
}
