<?php
declare(strict_types=1);

if(session_status()!==PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__.'/../../config/databases.php';

function ideare_root_url(string $path=''): string
{
    $script=str_replace('\\','/',$_SERVER['SCRIPT_NAME']??'');
    $parts=explode('/',trim($script,'/'));
    $root=isset($parts[0])?'/'.$parts[0]:'';

    return $root.($path?'/'.ltrim($path,'/'):'');
}

function staff_redirect(string $path): never
{
    header('Location: '.ideare_root_url($path));
    exit;
}

function h(?string $v): string
{
    return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');
}

function money($v): string
{
    return 'RM '.number_format((float)$v,2);
}

function current_staff(): ?array
{
    if(empty($_SESSION['staff_id'])) return null;

    static $c=null;
    if($c!==null) return $c;

    $s=staff_db()->prepare("
        SELECT
            s.*,
            r.name role_name,
            r.slug role_slug,
            r.hierarchy_level,
            d.name department_name,
            b.name branch_name
        FROM staff s
        JOIN roles r ON r.id=s.role_id
        LEFT JOIN departments d ON d.id=s.department_id
        LEFT JOIN branches b ON b.id=s.branch_id
        WHERE s.id=? AND s.is_active=1
        LIMIT 1
    ");
    $s->execute([$_SESSION['staff_id']]);
    $c=$s->fetch()?:null;

    return $c;
}

function permission_keys(): array
{
    static $p=null;

    if($p!==null) return $p;

    $st=current_staff();
    if(!$st) return [];

    $pdo=staff_db();

    /*
     * Direct staff overrides take precedence over role permissions.
     * If no override exists, normal role_permissions behavior is preserved.
     */
    $hasOverrides=false;

    try {
        $check=$pdo->query("
            SELECT 1
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA=DATABASE()
              AND TABLE_NAME='staff_permission_overrides'
            LIMIT 1
        ");
        $hasOverrides=(bool)$check->fetchColumn();
    } catch(Throwable $e) {
        $hasOverrides=false;
    }

    if($hasOverrides){
        $s=$pdo->prepare("
            SELECT DISTINCT p.permission_key
            FROM permissions p
            LEFT JOIN role_permissions rp
                ON rp.permission_id=p.id
               AND rp.role_id=?
            LEFT JOIN staff_permission_overrides spo
                ON spo.permission_id=p.id
               AND spo.staff_id=?
            WHERE
                CASE
                    WHEN spo.permission_id IS NOT NULL THEN spo.is_granted
                    WHEN rp.permission_id IS NOT NULL THEN 1
                    ELSE 0
                END = 1
        ");
        $s->execute([$st['role_id'],$st['id']]);
    } else {
        $s=$pdo->prepare("
            SELECT p.permission_key
            FROM role_permissions rp
            JOIN permissions p ON p.id=rp.permission_id
            WHERE rp.role_id=?
        ");
        $s->execute([$st['role_id']]);
    }

    $p=array_column($s->fetchAll(),'permission_key');

    return $p;
}

function can(string $permission): bool
{
    return in_array($permission,permission_keys(),true);
}

function require_login(): void
{
    if(!current_staff()) staff_redirect('auth/login.php');
}

/**
 * Task Management access is now database-driven.
 * Stage 1.1 grants tasks.manage directly only to Hafiz and Hazlin Suraya.
 */
function can_manage_tasks(?array $staff=null): bool
{
    $staff=$staff??current_staff();

    if(!$staff) return false;

    return can('tasks.manage');
}

function render_access_denied(
    string $heading='Access denied',
    string $message='Your account does not have permission to view this page.'
): never {
    http_response_code(403);
    $pageTitle=$heading;

    require __DIR__.'/header.php';

    echo '<main class="staff-content">';
    echo '<section class="staff-panel">';
    echo '<p class="eyebrow">403</p>';
    echo '<h1>'.h($heading).'</h1>';
    echo '<p>'.h($message).'</p>';
    echo '<a class="btn" href="'.h(ideare_root_url('staff/index.php')).'">Back to dashboard</a>';
    echo '</section>';
    echo '</main>';

    require __DIR__.'/footer.php';
    exit;
}

function require_task_manager_access(): void
{
    require_login();

    if(!can_manage_tasks()) {
        render_access_denied(
            'Task Management restricted',
            'Your account has not been granted Task Management access.'
        );
    }
}

function require_permission(string $permission): void
{
    require_login();

    if(!can($permission)) render_access_denied();
}

function csrf_token(): string
{
    if(empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token']=bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="'.h(csrf_token()).'">';
}

function verify_csrf(): void
{
    if($_SERVER['REQUEST_METHOD']==='POST'){
        $t=$_POST['csrf_token']??'';

        if(!$t||!hash_equals($_SESSION['csrf_token']??'',$t)){
            http_response_code(419);
            exit('Invalid CSRF token.');
        }
    }
}

function flash(string $type,string $message): void
{
    $_SESSION['flash']=['type'=>$type,'message'=>$message];
}

function pull_flash(): ?array
{
    $f=$_SESSION['flash']??null;
    unset($_SESSION['flash']);

    return $f;
}

function remember_last_staff_account(array $staff): void
{
    $secure=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off';

    $o=[
        'expires'=>time()+15552000,
        'path'=>'/',
        'secure'=>$secure,
        'httponly'=>true,
        'samesite'=>'Lax'
    ];

    setcookie('ideare_last_staff_email',(string)$staff['email'],$o);
    setcookie(
        'ideare_last_staff_name',
        trim(($staff['first_name']??'').' '.($staff['last_name']??'')),
        $o
    );
}

function forget_last_staff_account(): void
{
    $secure=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off';

    foreach(['ideare_last_staff_email','ideare_last_staff_name'] as $n){
        setcookie(
            $n,
            '',
            [
                'expires'=>time()-3600,
                'path'=>'/',
                'secure'=>$secure,
                'httponly'=>true,
                'samesite'=>'Lax'
            ]
        );
    }
}

function log_activity(
    string $action,
    ?string $entityType=null,
    ?string $entityId=null,
    ?string $description=null
): void {
    $st=current_staff();

    $s=staff_db()->prepare("
        INSERT INTO activity_logs
        (staff_id,action,entity_type,entity_id,description,ip_address,user_agent)
        VALUES(?,?,?,?,?,?,?)
    ");

    $s->execute([
        $st['id']??null,
        $action,
        $entityType,
        $entityId,
        $description,
        $_SERVER['REMOTE_ADDR']??null,
        substr($_SERVER['HTTP_USER_AGENT']??'',0,1000)
    ]);
}
