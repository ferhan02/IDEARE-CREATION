<?php
/** Customer-facing full inspiration showroom; published records load from the public feed. */
$pageTitle = 'Cabinet Inspiration | IDEARE Creation';
$pageScripts = ['assets/js/inspiration-showroom.js'];
require __DIR__ . '/../includes/customer/header.php';
?>
<main class="ic-page" id="main-content">
  <div class="ic-page-context site-wrap">
    <a class="ic-breadcrumb" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>index.php#inspiration">← Back to homepage</a>
    <p class="ic-page-eyebrow">IDEARE / CABINET INSPIRATIONS</p>
    <h1>Ideas worth making your own.</h1>
    <p>Explore our cabinetry concepts by room. Every inspiration is a starting point — dimensions, finishes and storage arrangements can be tailored to your space.</p>
  </div>
  <div data-inspiration-page="all" class="ic-loading-wrap site-wrap" aria-live="polite">
    <p class="ic-loading-message">Preparing the design gallery…</p>
    <p><a href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>designer/index.php">Or start your own cabinet design</a></p>
  </div>
</main>
<?php require __DIR__ . '/../includes/customer/footer.php'; ?>
