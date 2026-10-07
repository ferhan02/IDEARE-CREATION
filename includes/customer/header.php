<?php
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
<link rel="stylesheet" href="<?= $customerRoot ?>assets/css/site.css">
<link rel="stylesheet" href="<?= $customerRoot ?>assets/css/ui-polish.css">
</head>
<body>
<header class="site-header">
  <div class="site-wrap nav-wrap">
    <a class="brand logo-link" href="<?= $customerRoot ?>index.php" aria-label="IDEARE home">
      <img class="brand-logo-image site-brand-logo" src="<?= $customerRoot ?>assets/images/ideare-logo.png" alt="IDEARE">
    </a>

    <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>

    <nav class="site-nav">
      <a href="<?= $customerRoot ?>index.php">Home</a>
      <a href="<?= $customerRoot ?>public/pages/about.php">About</a>
      <a href="<?= $customerRoot ?>public/pages/services.php">Services</a>
      <a href="<?= $customerRoot ?>public/pages/portfolio.php">Portfolio</a>
      <a href="<?= $customerRoot ?>designer/index.php">Cabinet Designer</a>
      <a href="<?= $customerRoot ?>public/pages/contact.php">Contact</a>
      <a class="staff-link" href="<?= $customerRoot ?>auth/login.php">Staff Login</a>
    </nav>
  </div>
</header>
