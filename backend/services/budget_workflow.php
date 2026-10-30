<?php
class BudgetWorkflowException extends RuntimeException {}
require_once __DIR__ . '/budget_attachments.php';
require_once __DIR__ . '/accounting_core.php';

function budget_fail(string $message, int $status = 422): void { throw new BudgetWorkflowException($message, $status); }

function budget_query(mysqli $db, string $sql, string $types = '', array $params = []): mysqli_stmt {
    $statement = $db->prepare($sql);
    if ($types !== '') $statement->bind_param($types, ...$params);
    $statement->execute();
    return $statement;
}

function budget_permissions(array $actor, ?mysqli $db = null): array {
    $canSubmit = $db ? (ac_can($db,$actor,'prepare') || in_array($actor['role'], ['finance', 'admin', 'super_admin', 'director', 'direktur'], true)) : in_array($actor['role'], ['finance', 'admin', 'super_admin', 'director', 'direktur'], true);
    $canApprove = $db ? (ac_can($db,$actor,'approve') || in_array($actor['role'], ['admin', 'super_admin','director','direktur'], true)) : in_array($actor['role'], ['admin', 'super_admin','director','direktur'], true);
    return ['can_submit' => $canSubmit,
        'can_approve' => $canApprove,
        'actor_id' => (int)$actor['id'], 'actor_name' => $actor['name']];
}

function budget_require_access(array $actor, ?mysqli $db = null): void {
    if ($db ? !ac_can($db,$actor,'read') : !in_array($actor['role'], ['finance', 'admin', 'super_admin','director','direktur'], true)) budget_fail('Anda tidak memiliki izin mengakses RAB.', 403);
}

function budget_text($value, string $label, int $max, bool $required = true): string {
    if (!is_string($value)) budget_fail("$label tidak valid.");
    $value = trim($value);
    if (($required && $value === '') || mb_strlen($value) > $max) budget_fail("$label wajib diisi dan maksimal $max karakter.");
    return $value;
}

function budget_decimal(int $cents): string { return intdiv($cents, 100) . '.' . str_pad((string)($cents % 100), 2, '0', STR_PAD_LEFT); }

function budget_validate(array $data): array {
    $title = budget_text($data['title'] ?? '', 'Judul RAB', 180);
    $period = $data['period'] ?? '';
    if (!is_string($period) || !preg_match('/^(19|20|21|22)\d{2}-(0[1-9]|1[0-2])$/D', $period)) budget_fail('Periode RAB harus berupa bulan dan tahun yang valid.');
    $notes = budget_text($data['notes'] ?? '', 'Catatan', 2000, false);
    $rows = $data['items'] ?? null;
    if (!is_array($rows) || count($rows) < 1 || count($rows) > 200) budget_fail('RAB harus memiliki 1–200 rincian kebutuhan.');
    $items = []; $total = 0; $max = 999999999999999;
    foreach ($rows as $row) {
        if (!is_array($row)) budget_fail('Rincian RAB tidak valid.');
        if (!is_scalar($row['quantity'] ?? null) || is_bool($row['quantity']) || !is_scalar($row['unit_price'] ?? null) || is_bool($row['unit_price'])) budget_fail('Jumlah atau harga kebutuhan tidak valid.');
        $quantity = (string)$row['quantity'];
        $price = (string)$row['unit_price'];
        if (!preg_match('/^[1-9]\d{0,5}$/D', $quantity)) budget_fail('Jumlah kebutuhan harus bilangan bulat positif, maksimal 999999.');
        if (!preg_match('/^\d{1,13}(\.\d{1,2})?$/D', $price)) budget_fail('Harga satuan harus berupa angka dengan maksimal dua desimal.');
        $parts = explode('.', $price);
        $cents = (int)$parts[0] * 100 + (int)str_pad($parts[1] ?? '', 2, '0');
        $qty = (int)$quantity;
        if ($cents <= 0 || $cents > intdiv($max - $total, $qty)) budget_fail('Nominal RAB harus positif dan tidak melebihi batas penyimpanan.');
        $lineTotal = $cents * $qty;
        $items[] = ['category' => budget_text($row['category'] ?? '', 'Kategori', 100),
            'description' => budget_text($row['description'] ?? '', 'Kebutuhan', 500),
            'quantity' => $qty, 'unit' => budget_text($row['unit'] ?? '', 'Satuan', 40),
            'unit_price' => budget_decimal($cents), 'total_amount' => budget_decimal($lineTotal)];
        $total += $lineTotal;
    }
    return ['title' => $title, 'period' => $period . '-01', 'notes' => $notes, 'items' => $items, 'total_amount' => budget_decimal($total)];
}

function budget_read(mysqli $db, int $id): array {
    $request = budget_query($db, "SELECT b.*, f.id AS finance_record_id FROM budget_requests b
        LEFT JOIN finance_records f ON f.budget_request_id=b.id WHERE b.id=?", 'i', [$id])->get_result()->fetch_assoc();
    if (!$request) budget_fail('Pengajuan RAB tidak ditemukan.', 404);
    $request['items'] = budget_query($db, 'SELECT * FROM budget_request_items WHERE budget_request_id=? ORDER BY id', 'i', [$id])->get_result()->fetch_all(MYSQLI_ASSOC);
    $request['history'] = budget_query($db, 'SELECT * FROM budget_request_history WHERE budget_request_id=? ORDER BY id DESC', 'i', [$id])->get_result()->fetch_all(MYSQLI_ASSOC);
    if (ac_table($db,'budget_realizations')) {
        $request['commitments']=ac_rows($db,'SELECT c.* FROM budget_commitments c JOIN budget_request_items i ON i.id=c.budget_item_id WHERE i.budget_request_id=? ORDER BY c.id',[$id]);
        $request['realizations']=ac_rows($db,'SELECT r.*,t.number,t.approval_status,t.payment_status,t.journal_status FROM budget_realizations r LEFT JOIN accounting_transactions t ON t.id=r.transaction_id WHERE r.budget_request_id=? ORDER BY r.id',[$id]);
        $committed=0;$realized=0;
        foreach($request['items'] as &$item){$c=ac_one($db,"SELECT COALESCE(SUM(amount),0) AS total FROM budget_commitments WHERE budget_item_id=? AND status='open'",[(int)$item['id']]);$r=ac_one($db,"SELECT COALESCE(SUM(amount),0) AS total FROM budget_realizations WHERE budget_item_id=? AND status='recorded'",[(int)$item['id']]);$item['committed_amount']=$c['total'];$item['realized_amount']=$r['total'];$item['remaining_amount']=$item['approved_amount']===null?null:ac_decimal(ac_cents($item['approved_amount'])-ac_cents($c['total'])-ac_cents($r['total']));$committed+=ac_cents($c['total']);$realized+=ac_cents($r['total']);}unset($item);
        $request['committed_amount']=ac_decimal($committed);$request['realized_amount']=ac_decimal($realized);$request['remaining_amount']=$request['approved_amount']===null?null:ac_decimal(ac_cents($request['approved_amount'])-$committed-$realized);
    }
    return $request;
}

function budget_replace_items(mysqli $db, int $id, array $items): void {
    budget_query($db, 'DELETE FROM budget_request_items WHERE budget_request_id=?', 'i', [$id]);
    foreach ($items as $item) budget_query($db, 'INSERT INTO budget_request_items
        (budget_request_id,category,description,quantity,unit,unit_price,total_amount) VALUES(?,?,?,?,?,?,?)',
        'ississs', [$id, $item['category'], $item['description'], $item['quantity'], $item['unit'], $item['unit_price'], $item['total_amount']]);
}

function budget_history(mysqli $db, int $id, array $actor, string $action, ?string $from, string $to, string $note = ''): void {
    $snapshot = budget_read($db, $id);
    unset($snapshot['history']);
    budget_query($db, 'INSERT INTO budget_request_history
        (budget_request_id,action,from_status,to_status,actor_id,actor_name,actor_role,note,snapshot_json) VALUES(?,?,?,?,?,?,?,?,?)',
        'isssissss', [$id, $action, $from, $to, (int)$actor['id'], $actor['name'], $actor['role'], $note, json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
}

function budget_mutate(mysqli $db, array $actor, array $data, ?array $upload = null): array {
    budget_require_access($actor,$db);
    $action = $data['action'] ?? '';
    if (!in_array($action, ['create', 'save', 'submit', 'cancel', 'approve', 'reject','review','return_revision'], true)) budget_fail('Aksi RAB tidak valid.');
    $permissions = budget_permissions($actor,$db);
    if (in_array($action, ['approve', 'reject','review','return_revision'], true) ? !$permissions['can_approve'] : !$permissions['can_submit']) budget_fail('Anda tidak berhak melakukan aksi ini.', 403);
    $validated = in_array($action, ['create', 'save'], true) ? budget_validate($data) : null;
    if (!$validated && ($upload || isset($data['attachment_action']) || isset($data['attachment_link']))) budget_fail('Lampiran hanya dapat diubah saat membuat atau mengedit draft RAB.', 409);
    $newFile = null;
    $db->begin_transaction();
    try {
        if ($action === 'create') {
            $key = $data['request_key'] ?? '';
            if (!is_string($key) || !preg_match('/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/Di', $key)) budget_fail('Identitas pengajuan tidak valid.');
            // Serialize create retries per Finance account, including simultaneous requests.
            budget_query($db, 'SELECT id FROM users WHERE id=? FOR UPDATE', 'i', [(int)$actor['id']]);
            $existing = budget_query($db, 'SELECT id,created_by FROM budget_requests WHERE request_key=?', 's', [$key])->get_result()->fetch_assoc();
            if ($existing) {
                if ((int)$existing['created_by'] !== (int)$actor['id']) budget_fail('Identitas pengajuan sudah digunakan.', 409);
                $result = budget_read($db, (int)$existing['id']); $db->commit(); return $result;
            }
            $submit = ($data['submit'] ?? false) === true;
            budget_query($db, 'INSERT INTO budget_requests (request_key,title,period,notes,total_amount,created_by,created_by_name) VALUES(?,?,?,?,?,?,?)',
                'sssssis', [$key, $validated['title'], $validated['period'], $validated['notes'], $validated['total_amount'], (int)$actor['id'], $actor['name']]);
            $id = (int)$db->insert_id;
            if(ac_table($db,'budget_realizations')){
                $department=ac_id($data['department_id']??null,'Departemen');
                if($department&&!ac_one($db,'SELECT id FROM departments WHERE id=?',[$department]))budget_fail('Departemen tidak ditemukan.');
                ac_query($db,'UPDATE budget_requests SET department_id=? WHERE id=?',[$department,$id]);
            }
            budget_update_attachment($db, $id, $data, $upload, null, $newFile);
            budget_replace_items($db, $id, $validated['items']);
            budget_history($db, $id, $actor, 'create', null, 'draft');
            if ($submit) {
                budget_query($db, "UPDATE budget_requests SET status='submitted',submitted_at=NOW(),version=version+1 WHERE id=?", 'i', [$id]);
                budget_history($db, $id, $actor, 'submit', 'draft', 'submitted');
            }
        } else {
            $id = (int)($data['id'] ?? 0);
            $request = budget_query($db, 'SELECT * FROM budget_requests WHERE id=? FOR UPDATE', 'i', [$id])->get_result()->fetch_assoc();
            if (!$request) budget_fail('Pengajuan RAB tidak ditemukan.', 404);
            if (!$permissions['can_approve'] && (int)$request['created_by'] !== (int)$actor['id']) budget_fail('Hanya pengaju yang dapat mengubah RAB ini.', 403);
            if ($action === 'approve' && $request['status'] === 'approved') { $result = budget_read($db, $id); $db->commit(); return $result; }
            if ((int)($data['version'] ?? 0) !== (int)$request['version']) budget_fail('RAB telah berubah. Muat ulang rincian sebelum melanjutkan.', 409);
            $from = $request['status'];
            if ($action === 'save') {
                if ($from !== 'draft') budget_fail('Hanya draft yang dapat diedit. RAB yang diajukan dikunci.', 409);
                budget_query($db, 'UPDATE budget_requests SET title=?,period=?,notes=?,total_amount=?,version=version+1 WHERE id=?',
                    'ssssi', [$validated['title'], $validated['period'], $validated['notes'], $validated['total_amount'], $id]);
                budget_replace_items($db, $id, $validated['items']);
                if(ac_table($db,'budget_realizations')){
                    $department=ac_id($data['department_id']??null,'Departemen');
                    if($department&&!ac_one($db,'SELECT id FROM departments WHERE id=?',[$department]))budget_fail('Departemen tidak ditemukan.');
                    ac_query($db,'UPDATE budget_requests SET department_id=? WHERE id=?',[$department,$id]);
                }
                budget_update_attachment($db, $id, $data, $upload, $request, $newFile);
                budget_history($db, $id, $actor, 'save', $from, $from);
            } else {
                $targets = ['submit' => 'submitted', 'cancel' => 'cancelled', 'approve' => 'approved', 'reject' => 'rejected','review'=>'under_review','return_revision'=>'draft'];
                $to = $targets[$action];
                $allowed = $action === 'submit' ? $from === 'draft' : ($action === 'cancel' ? in_array($from, ['draft', 'submitted'], true) : in_array($from,['submitted','under_review'],true));
                if (!$allowed) budget_fail('Status RAB tidak mengizinkan aksi ini.', 409);
                $note = budget_text($data['note'] ?? '', 'Catatan keputusan', 2000, in_array($action,['reject','return_revision'],true));
                if (in_array($action, ['approve', 'reject','review','return_revision'], true)) {
                    if ((int)$request['created_by'] === (int)$actor['id']) budget_fail('Pengaju tidak dapat menyetujui RAB sendiri.', 403);
                    if ($action === 'approve') {
                        // Approval authorizes a budget; it never moves cash or posts a journal.
                        if(ac_table($db,'budget_realizations')){
                            $items=ac_rows($db,'SELECT * FROM budget_request_items WHERE budget_request_id=? ORDER BY id FOR UPDATE',[$id]);$total=0;$provided=$data['approved_items']??null;
                            if($provided!==null&&!is_array($provided))budget_fail('Nominal item approval tidak valid.');
                            foreach($items as $item){$value=$provided===null?$item['total_amount']:($provided[(string)$item['id']]??null);$cents=ac_cents($value);if($cents>ac_cents($item['total_amount']))budget_fail('Approval tidak boleh melebihi nominal pengajuan.');$total=ac_add($total,$cents);ac_query($db,'UPDATE budget_request_items SET approved_amount=? WHERE id=?',[ac_decimal($cents),(int)$item['id']]);}
                            if(!$total)budget_fail('Total approval harus positif.');ac_query($db,'UPDATE budget_requests SET approved_amount=? WHERE id=?',[ac_decimal($total),$id]);
                        }
                    }
                    budget_query($db, 'UPDATE budget_requests SET status=?,reviewed_by=?,reviewed_by_name=?,review_note=?,reviewed_at=NOW(),version=version+1 WHERE id=?',
                        'sissi', [$to, (int)$actor['id'], $actor['name'], $note, $id]);
                } else {
                    $submittedSql = $action === 'submit' ? ',submitted_at=NOW()' : '';
                    budget_query($db, "UPDATE budget_requests SET status=?,version=version+1 $submittedSql WHERE id=?", 'si', [$to, $id]);
                }
                budget_history($db, $id, $actor, $action, $from, $to, $note);
            }
        }
        $result = budget_read($db, $id);
        $db->commit();
        return $result;
    } catch (Throwable $error) {
        $db->rollback();
        if ($newFile && is_file($newFile)) unlink($newFile);
        throw $error;
    }
}
