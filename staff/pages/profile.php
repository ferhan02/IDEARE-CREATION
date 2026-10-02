<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_login();
verify_csrf();

$pdo=staff_db();
$staff=current_staff();

if($_SERVER['REQUEST_METHOD']==='POST'){
    $action=$_POST['action']??'';

    if($action==='profile'){
        $pdo->prepare("
            UPDATE staff
            SET phone=?,address=?,emergency_contact_name=?,emergency_contact_phone=?
            WHERE id=?
        ")->execute([
            trim($_POST['phone']??''),
            trim($_POST['address']??''),
            trim($_POST['emergency_contact_name']??''),
            trim($_POST['emergency_contact_phone']??''),
            $staff['id']
        ]);

        flash('success','Profile updated.');
        staff_redirect('staff/pages/profile.php');
    }

    if($action==='password'){
        $q=$pdo->prepare("SELECT password_hash FROM staff WHERE id=?");
        $q->execute([$staff['id']]);
        $hash=$q->fetchColumn();

        if(
            password_verify($_POST['current_password']??'',$hash)
            && strlen($_POST['new_password']??'')>=8
            && ($_POST['new_password']??'')===($_POST['confirm_password']??'')
        ){
            $pdo->prepare("UPDATE staff SET password_hash=? WHERE id=?")
                ->execute([
                    password_hash($_POST['new_password'],PASSWORD_DEFAULT),
                    $staff['id']
                ]);

            flash('success','Password changed.');
            staff_redirect('staff/pages/profile.php');
        }

        flash('error','Password change failed.');
        staff_redirect('staff/pages/profile.php');
    }
}

$passkeys=[];
$passkeyTableReady=false;

try {
    $pdo->query("SELECT 1 FROM staff_passkeys LIMIT 1");
    $passkeyTableReady=true;

    $passStmt=$pdo->prepare("
        SELECT id,label,transports,created_at,last_used_at
        FROM staff_passkeys
        WHERE staff_id=?
        ORDER BY created_at DESC
    ");
    $passStmt->execute([$staff['id']]);
    $passkeys=$passStmt->fetchAll();
} catch (PDOException $e) {
    $passkeyTableReady=false;
}

$pageTitle='My Profile';
require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content">
<div class="page-head">
  <div>
    <p class="eyebrow">Account</p>
    <h1>My profile</h1>
  </div>
</div>

<div class="split-grid">
<section class="staff-panel">
  <div class="profile-summary">
      <span class="avatar xl"><?= h(strtoupper(substr($staff['first_name'],0,1))) ?></span>

      <div>
          <h2><?= h(trim($staff['first_name'].' '.$staff['last_name'])) ?></h2>
          <p><?= h($staff['staff_code']) ?> · <?= h($staff['role_name']) ?></p>
      </div>
  </div>

  <form method="post">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="profile">

      <label>
          Email
          <input value="<?= h($staff['email']) ?>" disabled>
      </label>

      <label>
          Phone
          <input name="phone" value="<?= h($staff['phone']) ?>">
      </label>

      <label>
          Address
          <textarea name="address"><?= h($staff['address']) ?></textarea>
      </label>

      <div class="two">
          <label>
              Emergency contact
              <input
                  name="emergency_contact_name"
                  value="<?= h($staff['emergency_contact_name']) ?>"
              >
          </label>

          <label>
              Emergency phone
              <input
                  name="emergency_contact_phone"
                  value="<?= h($staff['emergency_contact_phone']) ?>"
              >
          </label>
      </div>

      <button class="btn primary">Save profile</button>
  </form>
</section>

<section class="staff-panel">
  <h2>Change password</h2>

  <form method="post">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="password">

      <label>
          Current password
          <input
              type="password"
              name="current_password"
              autocomplete="current-password"
              required
          >
      </label>

      <label>
          New password
          <input
              type="password"
              name="new_password"
              minlength="8"
              autocomplete="new-password"
              required
          >
      </label>

      <label>
          Confirm
          <input
              type="password"
              name="confirm_password"
              minlength="8"
              autocomplete="new-password"
              required
          >
      </label>

      <button class="btn">Change password</button>
  </form>
</section>
</div>

<section class="staff-panel passkey-management">
  <div class="section-title">
    <div>
      <p class="eyebrow">Passwordless sign-in</p>
      <h2>Passkeys</h2>

      <p class="muted">
        Register Windows Hello, a phone, security key,
        or another passkey-capable device.
      </p>
    </div>

    <?php if($passkeyTableReady): ?>
      <button type="button" class="btn primary" id="addPasskeyBtn">
        Add passkey
      </button>
    <?php endif; ?>
  </div>

  <?php if(!$passkeyTableReady): ?>
      <div class="inline-error" style="margin-top:15px">
          Passkey support has not been installed in the database yet.
          <br><br>
          Open
          <a href="<?= h(ideare_root_url('setup/install-passkeys.php')) ?>">
              setup/install-passkeys.php
          </a>
          once to create the required table.
      </div>
  <?php else: ?>

      <p id="passkeyManageStatus" class="muted"></p>

      <div class="passkey-list">
      <?php if(!$passkeys): ?>
          <p class="empty-text">No passkeys registered yet.</p>
      <?php endif; ?>

      <?php foreach($passkeys as $pk): ?>
          <article class="passkey-item">
              <div class="passkey-item-icon">⌘</div>

              <div class="passkey-item-copy">
                  <b><?= h($pk['label'] ?: 'Passkey') ?></b>

                  <small>
                      Added <?= h(date('j M Y',strtotime($pk['created_at']))) ?>

                      <?php if($pk['last_used_at']): ?>
                          · Last used
                          <?= h(date('j M Y, g:i A',strtotime($pk['last_used_at']))) ?>
                      <?php endif; ?>
                  </small>
              </div>

              <form
                  method="post"
                  action="<?= h(ideare_root_url('auth/passkey/delete.php')) ?>"
                  onsubmit="return confirm('Remove this passkey?')"
              >
                  <?= csrf_field() ?>

                  <input
                      type="hidden"
                      name="passkey_id"
                      value="<?= (int)$pk['id'] ?>"
                  >

                  <button class="btn danger">Remove</button>
              </form>
          </article>
      <?php endforeach; ?>
      </div>

  <?php endif; ?>
</section>
</main>

<?php if($passkeyTableReady): ?>
<script>
window.IDEARE_ROOT = <?= json_encode(ideare_root_url()) ?>;
</script>

<script src="<?= h(ideare_root_url('assets/js/passkeys-register.js')) ?>"></script>
<?php endif; ?>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
