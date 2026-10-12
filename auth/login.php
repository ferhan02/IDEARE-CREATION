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
$pageStyles=['assets/css/staff-login-v2.css'];
require __DIR__.'/../includes/staff/header.php';
?>

<main class="login-page login-page-v2">
    <section class="login-card passkey-login-card login-card-v2" aria-labelledby="loginTitle">

        <div class="login-card-toolbar">
            <a class="back-to-site" href="<?= h(ideare_root_url('index.php')) ?>">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/><path d="M9 12h12"/></svg>
                <span>Back to customer site</span>
            </a>
            <button class="theme-toggle login-theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" title="Switch to dark mode">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4"/><path d="M8.2 14.7A7 7 0 1 1 15.8 14.7C14.7 15.5 14 16.5 14 18h-4c0-1.5-.7-2.5-1.8-3.3Z"/></svg>
            </button>
        </div>

        <div class="login-brand login-brand-v2">
            <img
                class="staff-login-mark"
                src="<?= h(ideare_root_url('assets/images/ideare-staff-login-logo.png')) ?>"
                alt="IDEARE — Architecture and Interior Design"
                width="1254" height="258"
            >
        </div>

        <div class="login-heading-v2">
            <div class="login-portal-label"><span class="login-portal-dot" aria-hidden="true"></span>Staff Portal</div>
            <p class="eyebrow">Secure staff access</p>
            <h1 id="loginTitle">Sign in<span class="login-heading-period">.</span></h1>
            <p class="login-intro">Welcome back. Use your password or passkey to continue.</p>
        </div>

        <?php if($lastEmail): ?>
        <div class="remembered-account-card" aria-label="Last signed-in account">
            <div class="remembered-avatar" aria-hidden="true">
                <?= h(strtoupper(substr($lastName ?: $lastEmail,0,1))) ?>
            </div>
            <div class="remembered-account-copy">
                <small>Last signed-in account</small>
                <strong><?= h($lastName ?: $lastEmail) ?></strong>
                <span><?= h($lastEmail) ?></span>
            </div>
            <form method="post" class="remembered-account-action">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="forget_account">
                <button type="submit" class="forget-account-btn" aria-label="Forget remembered account">Forget</button>
            </form>
        </div>
        <?php endif; ?>

        <?php if($error): ?>
        <div class="inline-error" id="loginInlineError" role="alert" data-login-error="<?= h($error) ?>"><?= h($error) ?></div>
        <?php endif; ?>

        <button type="button" id="passkeyLoginBtn" class="login-action-btn passkey-login-btn">
            <svg class="login-passkey-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="10.5" r="4.5"/><path d="M13 10.5h8v3h-3v3h-3v-3h-2"/><path d="M8.5 10.5h.01"/></svg>
            <span>Sign in with a passkey</span>
            <svg class="login-forward-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>
        </button>
        <p class="passkey-status" id="passkeyStatus" aria-live="polite"></p>

        <div class="login-divider"><span>or continue with password</span></div>

        <form method="post" id="passwordLoginForm">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="password">
            <label class="login-field" for="loginEmail">
                <span>Email address</span>
                <input type="email" name="email" id="loginEmail" value="<?= h($lastEmail) ?>" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="you@ideare.com">
            </label>
            <label class="login-field" for="loginPassword">
                <span>Password</span>
                <span class="login-password-wrap">
                    <input type="password" name="password" id="loginPassword" required autocomplete="current-password" placeholder="Enter your password">
                    <button class="login-password-toggle" type="button" aria-label="Show password" aria-pressed="false" title="Show password">
                        <svg class="login-eye-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.7"/><path class="login-eye-slash" d="m4 4 16 16"/></svg>
                    </button>
                </span>
            </label>
            <button class="login-action-btn password-login-btn" type="submit">
                <span>Sign in</span>
                <svg class="login-forward-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>
            </button>
        </form>

        <div class="login-security-note">
            <span class="security-dot" aria-hidden="true"></span>
            <p>Only your last account name and email are remembered. Your password is never saved by IdeaRE.</p>
        </div>
    </section>
</main>

<script>window.IDEARE_ROOT = <?= json_encode(ideare_root_url(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
<script src="<?= h(ideare_root_url('assets/js/staff-login-v2.js')) ?>"></script>
<script src="<?= h(ideare_root_url('assets/js/passkeys-login.js')) ?>"></script>
<?php require __DIR__.'/../includes/staff/footer.php'; ?>
