<?php
require_once __DIR__ . '/auth.php';
$staff = current_staff();
$pageTitle = $pageTitle ?? 'IDEARE Staff Portal';
$flash = pull_flash();
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h($pageTitle) ?> · IDEARE</title>
<link rel="stylesheet" href="<?= h(base_url('assets/css/staff.css')) ?>">
<link rel="stylesheet" href="<?= h(base_url('assets/css/ui-polish.css')) ?>">
</head>
<body>
<div class="app-shell">
<?php if ($staff): require __DIR__ . '/sidebar.php'; endif; ?>
<div class="<?= $staff ? 'app-main' : 'auth-main' ?>">
<?php if ($staff): ?>
<header class="topbar">
  <button class="menu-btn" id="menuBtn" aria-label="Toggle menu">☰</button>
  <div class="topbar-spacer"></div>
  <a class="top-icon" href="<?= h(base_url('staff/pages/notifications.php')) ?>">Notifications</a>

  <div class="profile-menu">
    <button
      type="button"
      class="user-pill profile-trigger"
      aria-haspopup="true"
      aria-expanded="false"
      aria-label="Open account menu"
    >
      <span class="avatar"><?= h(strtoupper(substr($staff['first_name'],0,1))) ?></span>
      <span class="profile-trigger-copy">
        <b><?= h($staff['first_name']) ?></b>
        <small><?= h(($staff['job_title']??'') ?: $staff['role_name']) ?></small>
      </span>
      <span class="profile-caret" aria-hidden="true">⌄</span>
    </button>

    <div class="profile-dropdown" role="menu">
      <a role="menuitem" href="<?= h(base_url('staff/pages/profile.php')) ?>">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        Manage profile
      </a>

      <a role="menuitem" class="sign-out" href="<?= h(base_url('auth/logout.php')) ?>">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 5H5v14h5M14 8l4 4-4 4m4-4H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Sign out
      </a>
    </div>
  </div>
</header>
<?php endif; ?>
<?php if ($flash): ?>
<div class="flash <?= h($flash['type']) ?>"><?= h($flash['message']) ?></div>
<?php endif; ?>
