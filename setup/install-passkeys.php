<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/databases.php';

$remote = $_SERVER['REMOTE_ADDR'] ?? '';
if (!in_array($remote, ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    exit('This installer can only be run from localhost.');
}

$message = '';
$error = '';

try {
    $pdo = staff_db();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS staff_passkeys (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            staff_id INT UNSIGNED NOT NULL,
            credential_id VARCHAR(512) NOT NULL,
            public_key_pem TEXT NOT NULL,
            sign_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
            label VARCHAR(120) NULL,
            transports VARCHAR(255) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_used_at DATETIME NULL,

            UNIQUE KEY uq_staff_passkey_credential (credential_id),
            KEY idx_staff_passkey_staff (staff_id),

            CONSTRAINT fk_staff_passkey_staff
                FOREIGN KEY (staff_id)
                REFERENCES staff(id)
                ON DELETE CASCADE
        )
    ");

    $message = 'Passkey database table is ready.';
} catch (Throwable $e) {
    $error = $e->getMessage();
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>IdeaRE Passkey Setup</title>
<style>
body{font-family:system-ui;background:#f5f2ec;margin:0;padding:40px;color:#1b1916}
.box{max-width:700px;margin:auto;background:#fff;border:1px solid #ddd5c8;border-radius:18px;padding:28px}
.ok{background:#e8f4eb;color:#2f6b48;padding:12px;border-radius:10px}
.err{background:#f7e6e4;color:#9d3c38;padding:12px;border-radius:10px}
code{background:#f1ede6;padding:2px 5px;border-radius:5px}
a{color:#6c5338}
</style>
</head>
<body>
<div class="box">
<h1>IdeaRE Passkey Setup</h1>

<?php if ($message): ?>
<p class="ok"><?= htmlspecialchars($message) ?></p>
<p>You can now return to your staff profile and register a passkey.</p>
<p><a href="../staff/pages/profile.php">Open My Profile</a></p>
<?php else: ?>
<p class="err"><?= htmlspecialchars($error) ?></p>
<p>Check that <code>config/databases.php</code> points to the database containing your <code>staff</code> table.</p>
<?php endif; ?>

<hr>
<p><strong>Important:</strong> delete or rename this installer before a real deployment.</p>
</div>
</body>
</html>
