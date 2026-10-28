<?php
function start_app_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('ONE_CREATIVA_SESSION');
    session_set_cookie_params([
        'lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    if (!session_start()) throw new RuntimeException('Sesi login gagal dimulai.');
}

function session_actor(mysqli $db): ?array {
    start_app_session();
    $id = (int)($_SESSION['user_id'] ?? 0);
    if (!$id) return null;
    $statement = $db->prepare("SELECT u.id,u.email, r.name AS role, COALESCE(NULLIF(e.full_name, ''), u.email) AS name,
        e.id AS employee_id,e.employee_code,e.position,e.gender,e.photo_url AS photo
        FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN employees e ON e.user_id=u.id
        WHERE u.id=? AND u.is_active=1 LIMIT 1");
    $statement->bind_param('i', $id);
    $statement->execute();
    $actor = $statement->get_result()->fetch_assoc();
    $statement->close();
    if ($actor) $actor['role'] = strtolower(trim($actor['role']));
    return $actor;
}
