<?php
require_once __DIR__.'/../includes/staff/auth.php';

if(current_staff()) {
    staff_redirect('staff/index.php');
}

$error='';

$lastEmail=$_COOKIE['ideare_last_staff_email']??'';
$lastName=$_COOKIE['ideare_last_staff_name']??'';

if($_SERVER['REQUEST_METHOD']==='POST'){
    verify_csrf();

    if(($_POST['action']??'')==='forget_account'){
        forget_last_staff_account();
        staff_redirect('auth/login.php');
    }

    $email=trim($_POST['email']??'');
    $password=$_POST['password']??'';

    $stmt=staff_db()->prepare("
        SELECT *
        FROM staff
        WHERE email=? AND is_active=1
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $row=$stmt->fetch();

    if(
        $row
        && (!$row['locked_until'] || strtotime($row['locked_until'])<=time())
        && password_verify($password,$row['password_hash'])
    ){
        session_regenerate_id(true);

        $_SESSION['staff_id']=$row['id'];
        $_SESSION['csrf_token']=bin2hex(random_bytes(32));

        staff_db()->prepare("
            UPDATE staff
            SET failed_login_attempts=0,
                locked_until=NULL,
                last_login_at=NOW()
            WHERE id=?
        ")->execute([$row['id']]);

        remember_last_staff_account($row);

        log_activity(
            'staff.login.password',
            'staff',
            (string)$row['id'],
            'Staff logged in with password.'
        );

        staff_redirect('staff/index.php');
    }

    if($row){
        $attempts=(int)$row['failed_login_attempts']+1;
        $locked=$attempts>=5
            ? date('Y-m-d H:i:s',time()+900)
            : null;

        staff_db()->prepare("
            UPDATE staff
            SET failed_login_attempts=?,
                locked_until=?
            WHERE id=?
        ")->execute([
            $attempts,
            $locked,
            $row['id']
        ]);
    }

    $error='Invalid email or password.';
}

$pageTitle='Staff Login';
require __DIR__.'/../includes/staff/header.php';
?>

<main class="login-page">
<section class="login-card passkey-login-card">

    <div class="login-brand">
        <a class="login-logo-link" href="<?= h(ideare_root_url('index.php')) ?>" aria-label="IDEARE home">
            <img
                class="brand-logo-image login-brand-logo"
                src="<?= h(ideare_root_url('assets/images/ideare-logo.png')) ?>"
                alt="IDEARE"
            >
        </a>
        <span>Staff Portal</span>
    </div>

    <p class="eyebrow">Secure Staff Access</p>

    <h1>Sign in.</h1>

    <p class="login-intro">
        Use your password or a passkey.
    </p>

    <?php if($lastEmail): ?>
    <div class="remembered-account-card">
        <div class="remembered-avatar">
            <?= h(strtoupper(substr($lastName ?: $lastEmail,0,1))) ?>
        </div>

        <div class="remembered-account-copy">
            <small>Last signed-in account</small>
            <strong><?= h($lastName ?: $lastEmail) ?></strong>
            <span><?= h($lastEmail) ?></span>
        </div>

        <form method="post" class="remembered-account-action">
            <?= csrf_field() ?>

            <input
                type="hidden"
                name="action"
                value="forget_account"
            >

            <button
                type="submit"
                class="forget-account-btn"
                aria-label="Forget remembered account"
            >
                Forget
            </button>
        </form>
    </div>
    <?php endif; ?>

    <?php if($error): ?>
    <div
        class="inline-error"
        id="loginInlineError"
        data-login-error="<?= h($error) ?>"
    >
        <?= h($error) ?>
    </div>
    <?php endif; ?>

    <button
        type="button"
        id="passkeyLoginBtn"
        class="login-action-btn passkey-login-btn"
    >
        <span class="login-btn-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M7 8a5 5 0 1 1 9.58 2H22v4h-2v2h-2v2h-3.42A5 5 0 1 1 7 8Zm5-3a3 3 0 1 0 0 6a3 3 0 0 0 0-6ZM5 15a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z"/>
            </svg>
        </span>

        <span>Sign in with a passkey</span>

        <span class="login-btn-arrow" aria-hidden="true">→</span>
    </button>

    <p
        class="passkey-status"
        id="passkeyStatus"
        aria-live="polite"
    ></p>

    <div class="login-divider">
        <span>or use your password</span>
    </div>

    <form method="post" id="passwordLoginForm">
        <?= csrf_field() ?>

        <input
            type="hidden"
            name="action"
            value="password"
        >

        <label class="login-field">
            <span>Email</span>

            <input
                type="email"
                name="email"
                id="loginEmail"
                value="<?= h($lastEmail) ?>"
                required
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                placeholder="you@ideare.com"
            >
        </label>

        <label class="login-field">
            <span>Password</span>

            <input
                type="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="Enter your password"
            >
        </label>

        <button
            class="login-action-btn password-login-btn"
            type="submit"
        >
            <span>Sign in</span>
            <span class="login-btn-arrow" aria-hidden="true">→</span>
        </button>
    </form>

    <div class="login-security-note">
        <span class="security-dot"></span>

        <p>
            IDEARE remembers only the last account name and email.
            Passwords stay protected by your browser/password manager.
        </p>
    </div>

    <a
        class="back-to-site"
        href="<?= h(ideare_root_url('index.php')) ?>"
    >
        ← Back to customer site
    </a>

</section>
</main>

<script>
window.IDEARE_ROOT = <?= json_encode(ideare_root_url()) ?>;
</script>

<script src="<?= h(ideare_root_url('assets/js/passkeys-login.js')) ?>"></script>

<?php require __DIR__.'/../includes/staff/footer.php'; ?>
