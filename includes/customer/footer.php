<?php
$customerRoot = $customerRoot ?? '';
$pageScripts = $pageScripts ?? [];
?>
<footer class="site-footer">
  <div class="site-wrap footer-wrap">
    <span>&copy; <?= date('Y') ?> IDEARE</span>
    <span>Prototype website</span>
  </div>
</footer>
<script src="<?= $customerRoot ?>assets/js/theme-icons.js"></script>
<script src="<?= $customerRoot ?>assets/js/site.js"></script>
<?php foreach ($pageScripts as $script): ?>
<script src="<?= htmlspecialchars($customerRoot . ltrim($script, '/')) ?>"></script>
<?php endforeach; ?>
</body></html>
