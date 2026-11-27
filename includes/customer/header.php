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
    str_contains($currentRoute, '/home-configurator/') => 'home-configurator',
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
    (str_contains($currentScript, '/designer/') || str_contains($currentScript, '/home-configurator/') || str_contains($currentScript, '/pages/') ? '../' : '')
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
<?php if (in_array($idearePage, ['designer','home-configurator'], true)): ?>
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/design-studio-popups.css?v=20261127-popup1">
<script defer src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/design-studio-popups.js?v=20261127-popup1"></script>
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/design-studio-spacing.css?v=20261127-cabinet-repair2">
<?php endif; ?>
<?php if ($idearePage === 'designer'): ?>
<script defer src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/design-studio-compact.js?v=20261127-fullbar"></script>
<?php endif; ?>
<?php if ($idearePage === 'home'): ?>
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/portfolio-showcase.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/portfolio-desktop.css" media="(min-width: 1200px)">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/portfolio-tablet.css" media="(min-width: 768px) and (max-width: 1199px)">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/responsive/portfolio-phone.css" media="(max-width: 767px)">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/portfolio-showcase-overrides.css">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/portfolio-theme.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@1,9..144,550,50,1&amp;display=swap">
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/homepage-editorial-fix.css?v=20261124">
<script defer src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/homepage-editorial-fix.js?v=20261124"></script>
<?php endif; ?>
<!-- Homepage presentation cleanup. These selectors also work when the site opens at /. -->
<style id="ideare-home-cleanup">
/* Remove only the decorative content requested; retain actual titles, cards, and actions. */
.home-hero-kicker,
.home-hero-scroll,
.service-story-topline > span:last-child,
.service-story-opening-side,
.pj-footer,
.portfolio-description,
.portfolio-intro-side,
.portfolio-gallery-counter,
.portfolio-gallery-hint,
.portfolio-photo-counter,
.portfolio-photo-count-static,
.portfolio-exhibition-status .portfolio-status-caption,
.ic-intro .ic-eyebrow,
.ic-hero-corner,
.ic-hero-foot,
.ic-feature-kicker,
.ic-preview-heading,
.ic-feature-controls > span,
.ic-endline,
.ic-results { display: none !important; }
/* Cabinet style orbit: headings and orientation text shown in the latest screenshots. */
.ci-home-landing .ci-masthead,
.ci-home-landing .ci-heading > p,
.ci-home-landing .ci-kicker,
.ci-home-landing .ci-active-subtitle,
.ci-home-landing .ci-wheel-hint,
.ci-home-landing .ci-landing-bottom,
/* Portfolio kicker is constructed in portfolio-showcase.js, not index.php. */
.portfolio-showcase .portfolio-kicker,
/* Keep the style title and actual arrow navigation. */
.ci-home-landing .ci-heading > div > .ci-kicker { display: none !important; }
.ci-home-landing .ci-heading { gap: 0 !important; }
.ci-home-landing .ci-orbit-controls { min-height: 0 !important; }
/* Collapse the empty space left behind by removed captions and metadata. */
.portfolio-intro, .portfolio-gallery-footer, .portfolio-exhibition-footer,
.service-story-opening-grid { min-height: 0; }
.portfolio-intro-side, .service-story-opening-side { margin: 0; padding: 0; }
</style>
<script id="ideare-home-cleanup-script">
/* Also handle decorative labels created dynamically by homepage components. */
(function () {
  'use strict';
  const matches = [
    /^IDEARE\s*\/\s*ARCHITECTURE\s*&\s*INTERIOR\s*DESIGN$/i,
    /^SCROLL TO EXPLORE$/i,
    /^FROM A FIRST DESIGN CONVERSATION TO THE FINAL FINISHING DETAIL,/i,
    /^EIGHT SPECIALTIES\s*[·•-]\s*ONE COORDINATED VISION$/i,
    /^SELECT A STAGE TO EXPLORE$/i,
    /^EXPLORE A PROJECT TO SEE THE FULL COLLECTION OF PHOTOGRAPHS/i,
    /^A SELECTION OF PLACES, INTERIORS AND ENVIRONMENTS SHAPED BY THE IDEARE TEAM/i,
    /^IDEARE\s*\/\s*CABINET INSPIRATIONS?$/i,
    /^DESIGN DIRECTIONS$/i,
    /^DESIGN\s*[·•-]\s*BUILD\s*[·•-]\s*CREATE$/i,
    /^ENDLESS POSSIBILITIES$/i
  ];
  function tidy() {
    const main = document.querySelector('main');
    if (!main) return;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    const toHide = new Set();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = node.textContent.replace(/\s+/g, ' ').trim();
      if (!value || value.length > 350 || !matches.some(r => r.test(value))) continue;
      let el = node.parentElement;
      if (!el) continue;
      /* Hide a decorative caption, never an interactive button or its parent. */
      if (el.closest('button, a, [role="button"], .pj-step')) continue;
      if (el.matches('b, strong, em, small')) el = el.parentElement;
      if (el && !el.matches('main, section, article, header')) toHide.add(el);
    }
    toHide.forEach(el => { if (!el.hidden) { el.hidden = true; el.style.setProperty('display','none','important'); } });
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; tidy(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
  const observer = new MutationObserver(schedule);
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('main')) observer.observe(document.querySelector('main'), {childList:true, subtree:true});
  }, {once:true});
})();
</script>
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
      <a href="<?= $customerRoot ?>designer/index.php">Cabinet Designer</a>
      <a href="<?= $customerRoot ?>index.php#contact">Contact</a>
      <button class="theme-toggle site-theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" title="Switch to dark mode">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4"/><path d="M8.2 14.7A7 7 0 1 1 15.8 14.7C14.7 15.5 14 16.5 14 18h-4c0-1.5-.7-2.5-1.8-3.3Z"/></svg>
      </button>
    </nav>
  </div>
</header>
