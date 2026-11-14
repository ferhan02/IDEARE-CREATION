<?php
/** IDEARE style-first cabinet inspiration showroom. Published staff designs remain available below. */
$pageTitle = 'Cabinet Inspiration | IDEARE Creation';
$pageScripts = ['assets/js/concept-showroom.js'];
require __DIR__ . '/../includes/customer/header.php';
?>
<main class="cs-page" id="main-content">
  <div class="cs-page-context cs-shell site-wrap">
    <a class="cs-back" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>index.php#inspiration">← Back to homepage</a>
    <p class="cs-eyebrow">IDEARE / CABINET INSPIRATION</p>
    <h1 class="cs-page-title">Explore designs. Discover possibilities.</h1>
    <p class="cs-page-subtitle">Discover cabinetry ideas through five distinct design styles. Choose the look that speaks to you, then explore kitchen, media wall and wardrobe concepts.</p>
  </div>
  <div data-inspiration-page="all" class="cs-shell site-wrap" aria-live="polite">
    <p class="ic-loading-message">Preparing the design gallery…</p>
    <p><a href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>designer/index.php">Or start your own cabinet design</a></p>
  </div>
</main>
<?php require __DIR__ . '/../includes/customer/footer.php'; ?>
