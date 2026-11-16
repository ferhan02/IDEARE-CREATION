<?php
/**
 * IDEARE cabinet inspirations — compact 3D style discovery and style collections.
 * Uses the existing /api/concepts.php feed and /api/inspiration.php extras.
 * Homepage links to ?style=<slug> remain supported.
 */
$pageTitle = 'Cabinet Inspirations | IDEARE Creation';
$pageStyles = ['assets/css/concept-orbit.css'];
$pageScripts = ['assets/js/concept-orbit.js'];
require __DIR__ . '/../includes/customer/header.php';
?>
<main class="ci-page" id="main-content">
  <div id="ci-app" class="ci-app">
    <div class="ci-shell ci-loading" role="status">
      <p>IDEARE / CABINET INSPIRATION</p>
      <h1>Explore designs. Discover possibilities.</h1>
      <span>Loading your inspiration collection…</span>
      <p><a href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>index.php#inspiration">← Back to homepage</a></p>
    </div>
  </div>
</main>
<?php require __DIR__ . '/../includes/customer/footer.php'; ?>
