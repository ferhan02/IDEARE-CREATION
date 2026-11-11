<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$pageTitle = $pageTitle ?? 'IDEARE';
$pageStyles = $pageStyles ?? [];
// Approach A: one PHP document and one set of image assets, with tailored layouts.
// Classify the customer route only; staff pages do not include this header.
$currentRoute = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? $_SERVER['PHP_SELF'] ?? '');
$idearePage = match (true) {
    str_contains($currentRoute, '/designer/') => 'designer',
    str_contains($currentRoute, '/public/pages/about.php') => 'about',
    str_contains($currentRoute, '/public/pages/services.php') => 'services',
    str_contains($currentRoute, '/pages/book-appointment.php') => 'booking',
    str_contains($currentRoute, '/pages/where-we-are.php') => 'location',
    str_ends_with($currentRoute, '/material-catalogue.php'),
    str_ends_with($currentRoute, '/hpl-catalogue.php'),
    str_ends_with($currentRoute, '/stone-catalogue.php') => 'materials',
    str_ends_with($currentRoute, '/index.php') => 'home',
    default => 'general',
};

// Preserve an explicit relative prefix; pages/ is one level below the project root.
$currentScript = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? $_SERVER['PHP_SELF'] ?? '');
$customerRoot = $customerRoot ?? (
    str_contains($currentScript, '/public/pages/') ? '../../' :
    (str_contains($currentScript, '/designer/') || str_contains($currentScript, '/pages/') ? '../' : '')
);
?>
<!doctype html>
<html lang="en" data-ideare-page="<?= htmlspecialchars($idearePage, ENT_QUOTES, 'UTF-8') ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
<script>(function(){try{document.documentElement.dataset.theme=localStorage.getItem('ideare-theme')==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();</script>
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot) ?>assets/css/site.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot) ?>assets/css/ui-polish.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot) ?>assets/css/theme-icons.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot) ?>assets/css/global-ui.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot) ?>assets/css/logo-theme.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot) ?>assets/css/where-we-are.css">
<?php foreach ($pageStyles as $style): ?>
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot . ltrim($style, '/'), ENT_QUOTES, 'UTF-8') ?>">
<?php endforeach; ?>
<!-- Approach A: shared foundations, then ONLY the relevant layout stylesheet. -->
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/base.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/desktop.css" media="(min-width: 1200px)">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/tablet.css" media="(min-width: 768px) and (max-width: 1199px)">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/phone.css" media="(max-width: 767px)">
<?php if ($idearePage === 'home'): ?>
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/portfolio-showcase.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/portfolio-desktop.css" media="(min-width: 1200px)">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/portfolio-tablet.css" media="(min-width: 768px) and (max-width: 1199px)">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/portfolio-phone.css" media="(max-width: 767px)">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/portfolio-showcase-overrides.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/portfolio-theme.css">
<?php endif; ?>
</head>
<body>
<header class="site-header">
  <div class="site-wrap nav-wrap">
    <a class="brand logo-link" href="<?= $customerRoot ?>index.php" aria-label="IDEARE home">
      <img class="brand-logo-image site-brand-logo" src="<?= $customerRoot ?>assets/images/ideare-logo.png" alt="IDEARE">
    </a>

    <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-controls="customer-site-navigation" aria-expanded="false">☰</button>

    <nav class="site-nav" id="customer-site-navigation" aria-label="Customer navigation">
      <a href="<?= $customerRoot ?>index.php">Home</a>
      <a href="<?= $customerRoot ?>public/pages/about.php">About</a>
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
