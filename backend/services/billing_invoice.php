<?php
require_once __DIR__.'/accounting_core.php';
require_once __DIR__.'/student_pricing.php';

function billing_invoice_bank(mysqli $db, array $body): array {
    $bankId = ac_id($body['bank_account_id'] ?? null, 'ID rekening resmi');
    if (!ac_table($db, 'cash_bank_accounts') || !ac_table($db, 'accounts')) {
        ac_fail('Master rekening resmi belum tersedia.', 409);
    }
    $bank = ac_one($db, 'SELECT * FROM cash_bank_accounts WHERE id=? FOR UPDATE', [$bankId]);
    if (!$bank || (int)($bank['is_active'] ?? 0) !== 1) ac_fail('Rekening resmi tidak tersedia atau nonaktif.');
    $account = ac_one($db, 'SELECT * FROM accounts WHERE id=? FOR UPDATE', [(int)$bank['account_id']]);
    if (!$account || (int)($account['is_active'] ?? 0) !== 1 || ($account['report_class'] ?? '') !== 'cash') {
        ac_fail('Rekening harus terhubung ke COA kas/bank yang aktif.', 409);
    }
    $meta = ['bank_account_id' => $bankId];
    foreach (['bank_name' => 100, 'account_number' => 100, 'account_holder' => 255] as $key => $max) {
        // The display label `name` is not proof of the legal account holder.
        if (!is_string($bank[$key] ?? null) || trim($bank[$key]) === '') {
            ac_fail('Data rekening resmi belum lengkap (bank, nomor, dan pemilik terverifikasi diperlukan).', 409);
        }
        $meta[$key] = ac_text($bank[$key], $key, $max);
        if (array_key_exists($key, $body) && ac_text($body[$key], $key, $max) !== $meta[$key]) {
            ac_fail('Metadata rekening harus sama dengan master rekening resmi.');
        }
    }
    return $meta;
}

// BE-01 has one authoritative fee, not an item pricing catalog.
function billing_invoice_meta(array $body, array $student, int $total, string $date, string $due): array {
    $amount = ac_decimal($total);
    if (array_key_exists('subtotal', $body) && ac_cents($body['subtotal']) !== $total) {
        ac_fail('Subtotal harus sama dengan total biaya siswa.');
    }
    if (array_key_exists('discount', $body)) {
        $discount = $body['discount'];
        if (is_array($discount)) {
            if (!array_key_exists('amount', $discount)) ac_fail('Nominal diskon tidak valid.');
            foreach (['amount', 'value'] as $key) {
                if (array_key_exists($key, $discount) && ac_cents($discount[$key]) !== 0) ac_fail('Diskon belum didukung untuk invoice siswa.');
            }
        } elseif (ac_cents($discount) !== 0) {
            ac_fail('Diskon belum didukung untuk invoice siswa.');
        }
    }
    if (array_key_exists('items', $body)) {
        if (!is_array($body['items']) || !array_is_list($body['items']) || count($body['items']) !== 1 || !is_array($body['items'][0])) {
            ac_fail('Invoice siswa harus memiliki satu item biaya resmi.');
        }
        $item = $body['items'][0];
        if (array_key_exists('qty', $item) && ac_id($item['qty'], 'Kuantitas') !== 1) ac_fail('Kuantitas biaya siswa harus satu.');
        if ((!array_key_exists('harga', $item) && !array_key_exists('price', $item)) ||
            (!array_key_exists('jumlah', $item) && !array_key_exists('amount', $item))) ac_fail('Nominal item tidak lengkap.');
        foreach (['harga', 'price', 'jumlah', 'amount'] as $key) {
            if (array_key_exists($key, $item) && ac_cents($item[$key]) !== $total) ac_fail('Nominal item harus sama dengan total biaya siswa.');
        }
        foreach (['diskon', 'discount'] as $key) {
            if (array_key_exists($key, $item) && ac_cents($item[$key]) !== 0) ac_fail('Diskon item belum didukung untuk invoice siswa.');
        }
    }

    $installments = [];
    if (array_key_exists('installments', $body)) {
        if (!is_array($body['installments']) || !array_is_list($body['installments']) || count($body['installments']) < 1 || count($body['installments']) > 120) {
            ac_fail('Daftar termin tidak valid.');
        }
        $sum = 0;
        $previousDate = $date;
        foreach ($body['installments'] as $index => $installment) {
            if (!is_array($installment)) ac_fail('Termin tidak valid.');
            $value = ac_cents($installment['nominal'] ?? null);
            $deadline = ac_date($installment['jatuhTempo'] ?? null);
            if ($value === 0 || $deadline < $previousDate || ($index === 0 && $deadline !== $due)) {
                ac_fail('Nominal atau jatuh tempo termin tidak konsisten.');
            }
            $sum = ac_add($sum, $value);
            $previousDate = $deadline;
            // Never persist client payment/status fields inside installment metadata.
            $label = ac_text($installment['deskripsi'] ?? $installment['keterangan'] ?? 'Termin '.($index + 1), 'Deskripsi termin', 255);
            $installments[] = ['id' => $index + 1, 'deskripsi' => $label, 'keterangan' => $label, 'jatuhTempo' => $deadline, 'nominal' => ac_decimal($value)];
        }
        if ($sum !== $total) ac_fail('Jumlah seluruh termin harus sama dengan total biaya siswa.');
    } else {
        $installments[] = ['id' => 1, 'deskripsi' => 'Full Payment', 'keterangan' => 'Full Payment', 'jatuhTempo' => $due, 'nominal' => $amount];
    }
    $scheme = count($installments) > 1 ? 'cicilan' : 'full';
    if (array_key_exists('skema', $body) && $body['skema'] !== $scheme) ac_fail('Skema tidak sesuai dengan daftar termin.');

    $program = ac_text($student['program'] ?? '', 'Program siswa', 150, false);
    $title = $program !== '' ? $program : 'Biaya program siswa';
    $meta = [
        'student_id' => (int)$student['id'], 'amount_source' => 'peserta_intensif.total_biaya',
        'program' => $program, 'lokasi' => ac_text($student['kota'] ?? '', 'Lokasi siswa', 100, false),
        'skema' => $scheme, 'subtotal' => $amount, 'discount' => ['amount' => '0.00'],
        'items' => [[
            'id' => 1, 'name' => $title, 'deskripsi' => $title, 'qty' => 1,
            'harga' => $amount, 'price' => $amount, 'diskon' => '0.00', 'jumlah' => $amount, 'amount' => $amount,
        ]],
        'installments' => $installments,
    ];
    foreach (['durasi' => 100, 'salesCode' => 100, 'notes' => 10000] as $key => $max) {
        if (array_key_exists($key, $body)) $meta[$key] = ac_text($body[$key], $key, $max, false);
    }
    foreach (['includes', 'excludes'] as $key) {
        if (!array_key_exists($key, $body)) continue;
        if (!is_array($body[$key]) || !array_is_list($body[$key]) || count($body[$key]) > 100) ac_fail("$key tidak valid.");
        $meta[$key] = array_map(fn($value) => ac_text($value, $key, 2000), $body[$key]);
    }
    return $meta;
}

function billing_create_invoice(mysqli $db, array $actor, array $body): array {
    ac_require($db, $actor, 'prepare');
    $studentId = ac_id($body['student_id'] ?? null, 'student_id peserta_intensif');
    if (array_key_exists('status', $body) && $body['status'] !== 'Unpaid') ac_fail('Invoice baru harus berstatus Unpaid.');
    $id = ac_text($body['id'] ?? '', 'Nomor invoice', 50);
    $date = ac_date($body['tanggal'] ?? null);
    $due = ac_date($body['jatuhTempo'] ?? null);
    if ($due < $date) ac_fail('Jatuh tempo harus setelah tanggal invoice.');
    $clientTotal = ac_cents($body['total'] ?? null);
    $description = ac_text($body['keterangan'] ?? '', 'Keterangan', 10000, false);

    try {
        return ac_atomic($db, function () use ($db, $actor, $body, $studentId, $id, $date, $due, $clientTotal, $description) {
            ac_one($db, 'SELECT id FROM users WHERE id=? FOR UPDATE', [(int)$actor['id']]);
            if (!ac_table($db, 'peserta_intensif')) ac_fail('Data siswa resmi belum tersedia.', 409);
            $student = ac_one($db, 'SELECT * FROM peserta_intensif WHERE id=? FOR UPDATE', [$studentId]);
            if (!$student) ac_fail('Siswa tidak ditemukan.', 404);
            // Missing operational pricing fails closed; never invent a default price.
            $total = ac_cents($student['total_biaya'] ?? null);
            if ($total === 0 || $clientTotal !== $total) ac_fail('Total invoice harus sama dengan total biaya resmi siswa yang positif.');
            // The primary key also rejects races; avoid gap locks on unused numbers.
            if (ac_one($db, 'SELECT id FROM billing_invoices WHERE id=?', [$id])) ac_fail('Nomor invoice sudah digunakan.', 409);
            [$pricing, $validatedBody] = sp_invoice_pricing($student, $body, $date, $due);
            $meta = billing_invoice_meta($validatedBody, $student, $total, $date, $due);
            $meta['pricing'] = sp_proof($pricing);
            $meta = array_merge($meta, billing_invoice_bank($db, $body));
            $column = ac_one($db, "SHOW COLUMNS FROM billing_invoices LIKE 'meta_json'");
            if (!$column) ac_fail('Penyimpanan metadata invoice belum tersedia.', 409);
            $name = ac_text($student['nama_lengkap'] ?? '', 'Nama siswa', 255);
            $email = ac_text($student['email'] ?? '', 'Email siswa', 255, false);
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) ac_fail('Email siswa tidak valid.');
            $phone = ac_text($student['no_wa'] ?? '', 'Telepon siswa', 50, false);
            $amount = ac_decimal($total);
            ac_query($db, "INSERT INTO billing_invoices(id,tanggal,customer,email,phone,total,status,jatuhTempo,keterangan,meta_json) VALUES(?,?,?,?,?,?,'Unpaid',?,?,?)", [
                $id, $date, $name, $email, $phone, $amount, $due, $description,
                json_encode($meta, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            ]);
            ac_audit($db, $actor, 'billing_invoice', $id, 'created', ['amount' => $amount, 'student_id' => $studentId, 'amount_source' => $meta['amount_source'], 'pricing' => $meta['pricing'], 'status' => 'Unpaid']);
            return ['id' => $id];
        });
    } catch (mysqli_sql_exception $error) {
        if ($error->getCode() === 1062) ac_fail('Nomor invoice sudah digunakan.', 409);
        throw $error;
    }
}
