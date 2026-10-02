<?php
require_once __DIR__ . '/auth.php';
$staff = current_staff();
$pageTitle = $pageTitle ?? 'IdeaRE Staff Portal';
$flash = pull_flash();
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h($pageTitle) ?> · IdeaRE</title>
<link rel="stylesheet" href="<?= h(base_url('assets/css/staff.css')) ?>">
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
  <div class="user-pill">
    <span class="avatar"><?= h(strtoupper(substr($staff['first_name'],0,1))) ?></span>
    <span><b><?= h($staff['first_name']) ?></b><small><?= h($staff['role_name']) ?></small></span>
  </div>
</header>
<?php endif; ?>
<?php if ($flash): ?>
<div class="flash <?= h($flash['type']) ?>"><?= h($flash['message']) ?></div>
<?php endif; ?>
