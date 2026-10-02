<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';

function base_url(string $path = ''): string {
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    $parts = explode('/', trim($script, '/'));
    $root = isset($parts[0]) ? '/' . $parts[0] : '';
    return $root . ($path ? '/' . ltrim($path, '/') : '');
}

function redirect(string $path): never {
    header('Location: ' . base_url($path));
    exit;
}

function current_staff(): ?array {
    if (empty($_SESSION['staff_id'])) return null;

    static $cached = null;
    if ($cached !== null) return $cached;

    $pdo = staff_db();
    $stmt = $pdo->prepare("
        SELECT s.*, r.name AS role_name, r.slug AS role_slug, r.hierarchy_level,
               d.name AS department_name, b.name AS branch_name
        FROM staff s
        JOIN roles r ON r.id = s.role_id
        LEFT JOIN departments d ON d.id = s.department_id
        LEFT JOIN branches b ON b.id = s.branch_id
        WHERE s.id = ? AND s.is_active = 1
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['staff_id']]);
    $cached = $stmt->fetch() ?: null;
    return $cached;
}

function permission_keys(): array {
    static $permissions = null;
    if ($permissions !== null) return $permissions;

    $staff = current_staff();
    if (!$staff) return [];

    $stmt = staff_db()->prepare("
        SELECT p.permission_key
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = ?
    ");
    $stmt->execute([$staff['role_id']]);
    $permissions = array_column($stmt->fetchAll(), 'permission_key');
    return $permissions;
}

function can(string $permission): bool {
    return in_array($permission, permission_keys(), true);
}

function require_login(): void {
    if (!current_staff()) redirect('auth/login.php');
}

function require_permission(string $permission): void {
    require_login();
    if (!can($permission)) {
        http_response_code(403);
        $pageTitle = 'Access denied';
        require __DIR__ . '/header.php';
        echo '<main class="content"><div class="panel"><p class="eyebrow">403</p><h1>Access denied</h1><p>Your account does not have permission to view this page.</p><a class="btn" href="' . htmlspecialchars(base_url('staff/index.php')) . '">Back to dashboard</a></div></main>';
        require __DIR__ . '/footer.php';
        exit;
    }
}

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string {
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrf_token()) . '">';
}

function verify_csrf(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = $_POST['csrf_token'] ?? '';
        if (!$token || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
            http_response_code(419);
            exit('Invalid CSRF token.');
        }
    }
}

function flash(string $type, string $message): void {
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function pull_flash(): ?array {
    $f = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $f;
}

function log_activity(string $action, ?string $entityType=null, ?string $entityId=null, ?string $description=null): void {
    $staff = current_staff();
    $stmt = staff_db()->prepare("
        INSERT INTO activity_logs(staff_id, action, entity_type, entity_id, description, ip_address, user_agent)
        VALUES(?,?,?,?,?,?,?)
    ");
    $stmt->execute([
        $staff['id'] ?? null,
        $action,
        $entityType,
        $entityId,
        $description,
        $_SERVER['REMOTE_ADDR'] ?? null,
        substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 1000)
    ]);
}

function h(?string $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function money($value): string {
    return 'RM ' . number_format((float)$value, 2);
}
