<?php
$customerRoot = $customerRoot ?? '';
$pageScripts = $pageScripts ?? [];
?>
<footer class="site-footer">
  <div class="site-wrap footer-wrap location-footer-wrap">
    <span class="location-footer-copy">&copy; <?= date('Y') ?> IDEARE</span>
    <a class="footer-location-link" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>pages/where-we-are.php" aria-label="Find our location on Google Maps">
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>
      <span>Find Our Location</span>
      <svg class="footer-location-arrow" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
    </a>
    <span class="location-footer-copy">Architecture &amp; Interior Design</span>
  </div>
</footer>
<script src="<?= $customerRoot ?>assets/js/theme-icons.js"></script>
<script src="<?= $customerRoot ?>assets/js/site.js"></script>
<?php foreach ($pageScripts as $script): ?>
<script src="<?= htmlspecialchars($customerRoot . ltrim($script, '/')) ?>"></script>
<?php endforeach; ?>
</body></html>
