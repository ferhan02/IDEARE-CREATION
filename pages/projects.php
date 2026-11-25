<?php
require_once __DIR__.'/../includes/customer/public-tools.php';
$rows = [];
try { $rows = public_db()->query('SELECT * FROM project_gallery_entries WHERE is_published=1 ORDER BY is_featured DESC,sort_order,completion_date DESC')->fetchAll(PDO::FETCH_ASSOC); }
catch (Throwable $e) { error_log('IDEARE public projects: '.$e->getMessage()); }
$pageTitle = 'IDEARE | Our Projects';
$pageStyles = ['assets/css/customer-projects.css'];
$customerRoot = '../';
require __DIR__.'/../includes/customer/header.php';
?>
<main class="customer-projects">
  <header class="customer-projects-heading"><p class="eyebrow">IDEARE PROJECTS</p><h1>Our projects</h1><p>Selected cabinetry and interior projects completed by IDEARE.</p></header>
  <?php if ($rows): ?>
  <div class="customer-projects-grid">
    <?php foreach($rows as $r): ?>
    <article class="customer-project-card">
      <?php if (!empty($r['cover_image'])): ?><img src="<?= h(ideare_root_url((string)$r['cover_image'])) ?>" alt="<?= h($r['title'] ?? 'Project') ?>" loading="lazy"><?php endif; ?>
      <div class="customer-project-copy"><small><?= h($r['category'] ?? 'Project') ?></small><h2><?= h($r['title'] ?? '') ?></h2><p><?= h($r['short_description'] ?? '') ?></p><small><?= h($r['location_label'] ?? '') ?> <?= h($r['completion_date'] ?? '') ?></small></div>
    </article>
    <?php endforeach; ?>
  </div>
  <?php else: ?><p>Explore our curated portfolio on the homepage.</p><?php endif; ?>
  <a class="btn" href="../index.php#portfolio">View our portfolio</a>
</main>
<?php require __DIR__.'/../includes/customer/footer.php'; ?>
