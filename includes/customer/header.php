<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$pageTitle = $pageTitle ?? 'IDEARE';
$customerRoot = str_contains(str_replace('\\','/',$_SERVER['PHP_SELF'] ?? ''), '/public/pages/') ? '../../' :
                (str_contains(str_replace('\\','/',$_SERVER['PHP_SELF'] ?? ''), '/designer/') ? '../' : '');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($pageTitle) ?></title>
<script>(function(){try{document.documentElement.dataset.theme=localStorage.getItem('ideare-theme')==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();</script>
<link rel="stylesheet" href="<?= $customerRoot ?>assets/css/site.css">
<link rel="stylesheet" href="<?= $customerRoot ?>assets/css/ui-polish.css">
<link rel="stylesheet" href="<?= $customerRoot ?>assets/css/theme-icons.css">
<link rel="stylesheet" href="<?= $customerRoot ?>assets/css/global-ui.css">
<link rel="stylesheet" href="<?= $customerRoot ?>assets/css/logo-theme.css">
</head>
<body>
<header class="site-header">
  <div class="site-wrap nav-wrap">
    <a class="brand logo-link" href="<?= $customerRoot ?>index.php" aria-label="IDEARE home">
      <img class="brand-logo-image site-brand-logo" src="<?= $customerRoot ?>assets/images/ideare-logo.png" alt="IDEARE">
    </a>

    <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>

    <nav class="site-nav" aria-label="Customer navigation">
      <a href="<?= $customerRoot ?>index.php">Home</a>
      <a href="<?= $customerRoot ?>index.php#about">About</a>
      <a href="<?= $customerRoot ?>public/pages/services.php">Services</a>
      <a href="<?= $customerRoot ?>index.php#portfolio">Portfolio</a>
      <a href="<?= $customerRoot ?>material-catalogue.php">Materials</a>
      <a href="<?= $customerRoot ?>designer/index.php">Cabinet Designer</a>
      <a href="<?= $customerRoot ?>index.php#contact">Contact</a>
      <button class="theme-toggle site-theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" title="Switch to dark mode">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4"/><path d="M8.2 14.7A7 7 0 1 1 15.8 14.7C14.7 15.5 14 16.5 14 18h-4c0-1.5-.7-2.5-1.8-3.3Z"/></svg>
      </button>
    </nav>
  </div>
</header>
