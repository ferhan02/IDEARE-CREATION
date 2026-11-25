<?php
/** Public website utilities; independent of staff sessions, login and permissions. */
declare(strict_types=1);
require_once __DIR__ . '/../../config/databases.php';

if (session_status() === PHP_SESSION_NONE) session_start();
function public_db(): PDO {
    $pdo = customer_db();
    if (!$pdo instanceof PDO) throw new RuntimeException('Customer database unavailable.');
    return $pdo;
}
function h(mixed $value): string { return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function ideare_root_url(string $path = ''): string {
    // Resolve correctly both in XAMPP /IDEARE CREATION/ and at a domain root.
    $root = str_replace('\\', '/', (string)realpath(__DIR__.'/../..'));
    $file = str_replace('\\', '/', (string)realpath($_SERVER['SCRIPT_FILENAME'] ?? ''));
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    $prefix = '';
    if ($root !== '' && strncasecmp($file, $root.'/', strlen($root)+1) === 0) {
        $relative = substr($file, strlen($root));
        if (strlen($script) >= strlen($relative) && strcasecmp(substr($script,-strlen($relative)), $relative) === 0) {
            $prefix = substr($script, 0, strlen($script)-strlen($relative));
        }
    }
    return rtrim($prefix,'/').'/'.ltrim($path,'/');
}
function db_rows(PDO $pdo, string $sql, array $args = []): array {
    $stmt = $pdo->prepare($sql); $stmt->execute($args); return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
function db_one(PDO $pdo, string $sql, array $args = []): ?array {
    $stmt = $pdo->prepare($sql); $stmt->execute($args); return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}
function csrf_token(): string {
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf_token'];
}
function csrf_field(): string { return '<input type="hidden" name="csrf_token" value="'.h(csrf_token()).'">'; }
function verify_csrf(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') return;
    $token = $_POST['csrf_token'] ?? null;
    $expected = $_SESSION['csrf_token'] ?? null;
    if (!is_string($token) || !is_string($expected) || $expected === '' || !hash_equals($expected,$token)) {
        http_response_code(403); exit('Invalid security token. Please reload the appointment form and try again.');
    }
}
function op_code(string $prefix): string {
    return strtoupper($prefix).'-'.date('Y').'-'.str_pad((string)random_int(1,999999),6,'0',STR_PAD_LEFT);
}
