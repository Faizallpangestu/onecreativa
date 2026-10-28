<?php
// Images are served through the authenticated RAB endpoint, never by their filesystem path.
function budget_attachment_dir(): string {
    return defined('BUDGET_ATTACHMENT_DIR') ? BUDGET_ATTACHMENT_DIR : __DIR__ . '/../storage/budget-attachments';
}

function budget_attachment_path(string $key): string {
    if (!preg_match('/^[a-f0-9]{32}$/D', $key)) budget_fail('Gambar lampiran tidak ditemukan.', 404);
    return budget_attachment_dir() . '/' . $key . '.bin';
}

function budget_update_attachment(mysqli $db, int $id, array $data, ?array $upload, ?array $current, ?string &$newFile): void {
    $mode = $data['attachment_action'] ?? 'keep';
    if (!in_array($mode, ['keep', 'remove', 'upload'], true)) budget_fail('Pilihan lampiran tidak valid.');
    $key = $current['attachment_key'] ?? null;
    $name = $current['attachment_name'] ?? null;
    $link = array_key_exists('attachment_link', $data)
        ? budget_text($data['attachment_link'], 'Link referensi', 2048, false) : ($current['attachment_link'] ?? '');
    if ($link !== '' && (!filter_var($link, FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($link, PHP_URL_SCHEME) ?? ''), ['http', 'https'], true)
        || parse_url($link, PHP_URL_USER) !== null || parse_url($link, PHP_URL_PASS) !== null)) budget_fail('Link referensi harus berupa URL http:// atau https:// yang valid.');
    if ($mode === 'keep' && !$current && !empty($data['copy_attachment_from'])) {
        $source = budget_read($db, (int)$data['copy_attachment_from']);
        if (!in_array($source['status'], ['rejected', 'cancelled'], true)) budget_fail('Gambar hanya dapat disalin dari RAB yang ditolak atau dibatalkan.');
        $key = $source['attachment_key']; $name = $source['attachment_name'];
    }
    if ($mode === 'remove') { $key = null; $name = null; }
    if ($mode !== 'upload' && $upload) budget_fail('Pilihan unggah gambar tidak sesuai.');
    if ($mode === 'upload') {
        if (!$upload || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) budget_fail('Gambar gagal diunggah. Pilih JPG, PNG, atau WebP maksimal 2 MB.');
        $temporary = $upload['tmp_name'] ?? '';
        if (!is_uploaded_file($temporary) || filesize($temporary) < 1 || filesize($temporary) > 2 * 1024 * 1024) budget_fail('Ukuran gambar harus antara 1 byte dan 2 MB.');
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($temporary);
        $image = @getimagesize($temporary);
        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true) || !$image || $image['mime'] !== $mime) budget_fail('Lampiran harus berupa gambar JPG, PNG, atau WebP yang valid.');
        $name = budget_text(basename(str_replace('\\', '/', $upload['name'] ?? 'gambar')), 'Nama gambar', 255);
        if (!is_dir(budget_attachment_dir()) && !mkdir(budget_attachment_dir(), 0750, true) && !is_dir(budget_attachment_dir())) throw new RuntimeException('Cannot create attachment directory');
        $key = bin2hex(random_bytes(16));
        $newFile = budget_attachment_path($key);
        if (!move_uploaded_file($temporary, $newFile)) throw new RuntimeException('Cannot store RAB image');
    }
    budget_query($db, 'UPDATE budget_requests SET attachment_key=?,attachment_name=?,attachment_link=? WHERE id=?', 'sssi', [$key, $name, $link ?: null, $id]);
}

function budget_serve_attachment(mysqli $db, int $id, string $key): void {
    $path = budget_attachment_path($key);
    $request = budget_read($db, $id);
    $found = $request['attachment_key'] === $key;
    foreach ($request['history'] as $event) {
        $snapshot = json_decode($event['snapshot_json'], true);
        if (($snapshot['attachment_key'] ?? null) === $key) $found = true;
    }
    if (!$found || !is_file($path)) budget_fail('Gambar lampiran tidak ditemukan.', 404);
    header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->file($path));
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($path));
    readfile($path);
}
