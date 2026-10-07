<?php
require_once __DIR__.'/auth.php';
$staff=current_staff();
$pageTitle=$pageTitle??'IDEARE Staff Portal';
$flash=pull_flash();
$taskManagementAssets=$taskManagementAssets??false;

$scriptPath=str_replace('\\','/',$_SERVER['PHP_SELF']??'');
$costingQuotationAssets=$costingQuotationAssets??(
    str_contains($scriptPath,'/quotation-') ||
    str_ends_with($scriptPath,'/quotations.php') ||
    str_ends_with($scriptPath,'/material-calculator.php')
);
$quotationCentreAssets=$quotationCentreAssets??(
    str_ends_with($scriptPath,'/quotation-centre.php') ||
    str_ends_with($scriptPath,'/quotation-rate-book.php')
);
$quotationCreateAssets=$quotationCreateAssets??(
    str_ends_with($scriptPath,'/quotation-create.php') ||
    str_ends_with($scriptPath,'/quotation-view.php') ||
    str_ends_with($scriptPath,'/quotation-rate-book.php')
);
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h($pageTitle) ?> · IDEARE</title>
<script>(function(){try{document.documentElement.dataset.theme=localStorage.getItem('ideare-theme')==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();</script>
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/staff.css')) ?>">
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/staff-alerts.css')) ?>">
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/staff-login-polish.css')) ?>">
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/crm-projects.css')) ?>">
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/ui-polish.css')) ?>">
<?php if($costingQuotationAssets): ?>
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/costing-quotation.css')) ?>">
<?php endif; ?>
<?php if($quotationCentreAssets): ?>
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/quotation-centre.css')) ?>">
<?php endif; ?>
<?php if($quotationCreateAssets): ?>
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/quotation-create.css')) ?>">
<?php endif; ?>
<?php if($taskManagementAssets): ?>
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/task-management.css')) ?>">
<?php endif; ?>
<link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/theme-icons.css')) ?>">
</head>
<body>
<div class="app-shell">
<?php if($staff): require __DIR__.'/sidebar.php'; endif; ?>
<div class="<?= $staff?'app-main':'auth-main' ?>">
<?php if($staff): ?>
<header class="topbar">
    <button id="menuBtn" class="menu-btn" aria-label="Toggle navigation">☰</button>
    <form action="<?= h(ideare_root_url('staff/pages/search.php')) ?>" method="get" class="top-search">
        <input name="q" placeholder="Search customers, projects..." aria-label="Global search">
    </form>
    <div class="topbar-spacer"></div>
    <a class="top-icon" href="<?= h(ideare_root_url('staff/pages/notifications.php')) ?>">Notifications</a>
    <a class="top-icon" href="<?= h(ideare_root_url('index.php')) ?>">Customer Site</a>
    <button class="theme-toggle staff-theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" title="Switch to dark mode">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4"/><path d="M8.2 14.7A7 7 0 1 1 15.8 14.7C14.7 15.5 14 16.5 14 18h-4c0-1.5-.7-2.5-1.8-3.3Z"/></svg>
    </button>
    <div class="profile-menu">
        <button type="button" class="user-pill profile-trigger" aria-haspopup="true" aria-expanded="false" aria-label="Open account menu">
            <span class="avatar"><?= h(strtoupper(substr($staff['first_name'],0,1))) ?></span>
            <span class="profile-trigger-copy"><b><?= h($staff['first_name']) ?></b><small><?= h(($staff['job_title']??'') ?: $staff['role_name']) ?></small></span>
            <span class="profile-caret" aria-hidden="true">⌄</span>
        </button>
        <div class="profile-dropdown" role="menu">
            <a role="menuitem" href="<?= h(ideare_root_url('staff/pages/profile.php')) ?>"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Manage profile</a>
            <a role="menuitem" class="sign-out" href="<?= h(ideare_root_url('auth/logout.php')) ?>"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4m4-4H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Sign out</a>
        </div>
    </div>
</header>
<?php endif; ?>
<?php if($flash): ?>
<div class="flash <?= h($flash['type']) ?>" data-ideare-flash data-flash-type="<?= h($flash['type']) ?>" data-flash-message="<?= h($flash['message']) ?>"><?= h($flash['message']) ?></div>
<?php endif; ?>
