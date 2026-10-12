<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/catalogue/catalogue-tools.php';

$pageTitle = 'Stone Catalogue | IDEARE';

$products = [];
$stoneTypes = [];
$surfaces = [];
$thicknesses = [];
$typeCounts = [];
$totalProducts = 0;
$filteredTotal = 0;
$catalogueError = null;

$q = trim((string)($_GET['q'] ?? ''));
$stoneType = trim((string)($_GET['stone_type'] ?? ''));
$surface = trim((string)($_GET['surface'] ?? ''));
$thickness = trim((string)($_GET['thickness'] ?? ''));
$sort = trim((string)($_GET['sort'] ?? 'name'));
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 24;
$totalPages = 1;

try {
    $pdo = staff_db();
    $baseSql = catalogue_build_stone_base($pdo);

    $totalProducts = catalogue_count_from_base($pdo, $baseSql);

    $typeCounts = $pdo->query("
        SELECT stone_type, COUNT(*) total
        FROM ({$baseSql}) catalogue
        GROUP BY stone_type
        ORDER BY stone_type
    ")->fetchAll();

    $stoneTypes = $pdo->query("SELECT DISTINCT stone_type FROM ({$baseSql}) catalogue ORDER BY stone_type")->fetchAll(PDO::FETCH_COLUMN);
    $surfaces = $pdo->query("SELECT DISTINCT surface FROM ({$baseSql}) catalogue WHERE surface IS NOT NULL AND surface <> '' ORDER BY surface")->fetchAll(PDO::FETCH_COLUMN);
    $thicknesses = $pdo->query("SELECT DISTINCT thickness FROM ({$baseSql}) catalogue WHERE thickness IS NOT NULL AND thickness <> '' ORDER BY thickness")->fetchAll(PDO::FETCH_COLUMN);

    $where = [];
    $params = [];

    if ($q !== '') {
        $like = '%' . $q . '%';
        $where[] = '(product_code LIKE :q1 OR product_name LIKE :q2 OR surface LIKE :q3 OR thickness LIKE :q4 OR slab_size LIKE :q5 OR series LIKE :q6 OR category LIKE :q7 OR brand LIKE :q8)';
        foreach (range(1, 8) as $i) $params[':q' . $i] = $like;
    }

    if ($stoneType !== '') {
        $where[] = 'stone_type = :stone_type';
        $params[':stone_type'] = $stoneType;
    }

    if ($surface !== '') {
        $where[] = 'surface = :surface';
        $params[':surface'] = $surface;
    }

    if ($thickness !== '') {
        $where[] = 'thickness = :thickness';
        $params[':thickness'] = $thickness;
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $sortMap = [
        'name' => 'product_name ASC, product_code ASC',
        'code' => 'product_code ASC, product_name ASC',
        'type' => 'stone_type ASC, product_name ASC',
        'surface' => 'surface ASC, product_name ASC',
    ];
    if (!isset($sortMap[$sort])) $sort = 'name';

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM ({$baseSql}) catalogue {$whereSql}");
    $countStmt->execute($params);
    $filteredTotal = (int)$countStmt->fetchColumn();

    $totalPages = max(1, (int)ceil($filteredTotal / $perPage));
    $page = min($page, $totalPages);
    $offset = ($page - 1) * $perPage;

    $stmt = $pdo->prepare("
        SELECT * FROM ({$baseSql}) catalogue
        {$whereSql}
        ORDER BY {$sortMap[$sort]}
        LIMIT {$perPage} OFFSET {$offset}
    ");
    $stmt->execute($params);
    $products = $stmt->fetchAll();
} catch (Throwable $e) {
    $catalogueError = 'The stone catalogue is temporarily unavailable.';
}

$showingFrom = $filteredTotal > 0 ? (($page - 1) * $perPage) + 1 : 0;
$showingTo = min($filteredTotal, $page * $perPage);

require __DIR__ . '/includes/customer/header.php';
?>
<link rel="stylesheet" href="assets/css/material-catalogue.css">
<link rel="stylesheet" href="assets/css/material-library.css">

<main class="material-catalogue-page stone-catalogue-page">
    <section class="catalogue-hero stone-catalogue-hero">
        <div class="site-wrap catalogue-hero-grid">
            <div>
                <div class="catalogue-breadcrumbs">
                    <a href="material-catalogue.php">Materials</a><span>›</span><b>Stone</b>
                </div>
                <p class="eyebrow">Countertop &amp; surface materials</p>
                <h1>Stone Catalogue</h1>
                <p class="lead">Browse Casero sintered stone and quartz products independently from the HPL finish catalogue.</p>
                <div class="catalogue-hero-actions">
                    <a class="btn primary" href="pages/book-appointment.php">Book a consultation</a>
                    <a class="btn" href="hpl-catalogue.php">Browse HPL Catalogue</a>
                </div>
                <p class="catalogue-note">Confirm final slab size, thickness, surface and physical appearance with the IdeaRE team before ordering.</p>
            </div>

            <aside class="catalogue-summary-card">
                <span class="catalogue-summary-number"><?= number_format($totalProducts) ?></span>
                <strong>active stone products</strong>
                <div class="supplier-summary">
                    <?php foreach ($typeCounts as $row): ?>
                        <a class="supplier-summary-row" href="?<?= catalogue_h(http_build_query(['stone_type' => $row['stone_type']])) ?>">
                            <span><?= catalogue_h($row['stone_type']) ?></span>
                            <b><?= number_format((int)$row['total']) ?></b>
                        </a>
                    <?php endforeach; ?>
                </div>
            </aside>
        </div>
    </section>

    <section class="catalogue-browser">
        <div class="site-wrap">
            <?php if ($catalogueError): ?>
                <div class="catalogue-message catalogue-message-error"><strong>Catalogue unavailable</strong><span><?= catalogue_h($catalogueError) ?></span></div>
            <?php else: ?>
                <form class="catalogue-filter-panel" method="get" id="catalogueFilters">
                    <div class="catalogue-search-field">
                        <label for="catalogueSearch">Search stone</label>
                        <div class="catalogue-search-control">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                            <input id="catalogueSearch" type="search" name="q" value="<?= catalogue_h($q) ?>" placeholder="Code, name, surface, size..." autocomplete="off">
                        </div>
                    </div>

                    <label>Stone type
                        <select name="stone_type" data-auto-submit>
                            <option value="">All stone</option>
                            <?php foreach ($stoneTypes as $item): ?><option value="<?= catalogue_h($item) ?>" <?= $stoneType === $item ? 'selected' : '' ?>><?= catalogue_h($item) ?></option><?php endforeach; ?>
                        </select>
                    </label>

                    <label>Surface
                        <select name="surface" data-auto-submit>
                            <option value="">All surfaces</option>
                            <?php foreach ($surfaces as $item): ?><option value="<?= catalogue_h($item) ?>" <?= $surface === $item ? 'selected' : '' ?>><?= catalogue_h($item) ?></option><?php endforeach; ?>
                        </select>
                    </label>

                    <label>Thickness
                        <select name="thickness" data-auto-submit>
                            <option value="">All thicknesses</option>
                            <?php foreach ($thicknesses as $item): ?><option value="<?= catalogue_h($item) ?>" <?= $thickness === $item ? 'selected' : '' ?>><?= catalogue_h($item) ?></option><?php endforeach; ?>
                        </select>
                    </label>

                    <label>Sort by
                        <select name="sort" data-auto-submit>
                            <option value="name" <?= $sort === 'name' ? 'selected' : '' ?>>Name A–Z</option>
                            <option value="code" <?= $sort === 'code' ? 'selected' : '' ?>>Product code</option>
                            <option value="type" <?= $sort === 'type' ? 'selected' : '' ?>>Stone type</option>
                            <option value="surface" <?= $sort === 'surface' ? 'selected' : '' ?>>Surface</option>
                        </select>
                    </label>

                    <div class="catalogue-filter-actions">
                        <button class="btn primary" type="submit">Search</button>
                        <a class="btn" href="stone-catalogue.php">Clear</a>
                    </div>
                </form>

                <div class="catalogue-results-head">
                    <div><p class="eyebrow">Browse stone</p><h2><?= number_format($filteredTotal) ?> product<?= $filteredTotal === 1 ? '' : 's' ?></h2></div>
                    <span><?= $filteredTotal ? 'Showing ' . number_format($showingFrom) . '–' . number_format($showingTo) : 'No results' ?></span>
                </div>

                <?php if (!$products): ?>
                    <div class="catalogue-empty"><div class="catalogue-empty-icon">◇</div><h2>No stone products found</h2><p>Try a different search term or clear the filters.</p><a class="btn primary" href="stone-catalogue.php">View all stone</a></div>
                <?php else: ?>
                    <div class="material-grid">
                        <?php foreach ($products as $product): ?>
                            <?php
                            $image = catalogue_image_url($product['image_path'] ?? '');
                            $displayName = trim((string)($product['product_name'] ?? '')) ?: trim((string)($product['product_code'] ?? '')) ?: 'Stone product';
                            $payload = [
                                'supplier' => (string)($product['stone_type'] ?? 'Stone'),
                                'brand' => (string)($product['brand'] ?? 'Casero Stone'),
                                'code' => (string)($product['product_code'] ?? ''),
                                'name' => $displayName,
                                'finish' => (string)($product['thickness'] ?? ''),
                                'category' => (string)($product['stone_type'] ?? ''),
                                'series' => trim(implode(' · ', array_filter([
                                    (string)($product['surface'] ?? ''),
                                    (string)($product['slab_size'] ?? ''),
                                ]))),
                                'image' => $image,
                            ];
                            $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_APOS | JSON_HEX_QUOT);
                            ?>
                            <article class="material-card stone-material-card">
                                <div class="material-image-wrap">
                                    <?php if ($image !== ''): ?>
                                        <img src="<?= catalogue_h($image) ?>" alt="<?= catalogue_h($displayName) ?>" loading="lazy" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
                                        <div class="material-image-fallback" hidden><span>Image unavailable</span></div>
                                    <?php else: ?><div class="material-image-fallback"><span>Image unavailable</span></div><?php endif; ?>
                                    <span class="material-supplier-badge"><?= catalogue_h($product['stone_type'] ?? 'Stone') ?></span>
                                </div>
                                <div class="material-card-body">
                                    <div class="material-code"><?= catalogue_h($product['product_code'] ?? '') ?></div>
                                    <h3><?= catalogue_h($displayName) ?></h3>
                                    <div class="material-meta">
                                        <?php if (!empty($product['surface'])): ?><span><?= catalogue_h($product['surface']) ?></span><?php endif; ?>
                                        <?php if (!empty($product['thickness'])): ?><span><?= catalogue_h($product['thickness']) ?></span><?php endif; ?>
                                        <?php if (!empty($product['slab_size'])): ?><span><?= catalogue_h($product['slab_size']) ?></span><?php endif; ?>
                                    </div>
                                    <button type="button" class="material-view-btn" data-material="<?= catalogue_h($payloadJson ?: '{}') ?>">View stone <span aria-hidden="true">↗</span></button>
                                </div>
                            </article>
                        <?php endforeach; ?>
                    </div>

                    <?php if ($totalPages > 1): ?>
                    <nav class="catalogue-pagination" aria-label="Catalogue pages">
                        <?php if ($page > 1): ?><a href="<?= catalogue_h(catalogue_page_url($page - 1)) ?>">← Previous</a><?php endif; ?>
                        <div class="catalogue-pagination-pages">
                            <?php for ($i = max(1, $page - 2); $i <= min($totalPages, $page + 2); $i++): ?>
                                <a <?= $i === $page ? 'class="active" aria-current="page"' : '' ?> href="<?= catalogue_h(catalogue_page_url($i)) ?>"><?= $i ?></a>
                            <?php endfor; ?>
                        </div>
                        <?php if ($page < $totalPages): ?><a href="<?= catalogue_h(catalogue_page_url($page + 1)) ?>">Next →</a><?php endif; ?>
                    </nav>
                    <?php endif; ?>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </section>
</main>

<dialog class="material-dialog" id="materialDialog" aria-labelledby="materialDialogTitle">
    <div class="material-dialog-shell">
        <button class="material-dialog-close" type="button" data-dialog-close aria-label="Close stone details">×</button>
        <div class="material-dialog-image"><img id="dialogMaterialImage" alt=""><div id="dialogImageFallback" class="material-image-fallback" hidden><span>Image unavailable</span></div></div>
        <div class="material-dialog-content">
            <div class="material-dialog-topline"><span id="dialogSupplier" class="material-dialog-supplier"></span><span id="dialogBrand" class="material-dialog-brand"></span></div>
            <div id="dialogMaterialCode" class="material-code"></div>
            <h2 id="materialDialogTitle"></h2>
            <dl class="material-detail-list">
                <div><dt>Stone type</dt><dd id="dialogCategory">—</dd></div>
                <div><dt>Surface / slab</dt><dd id="dialogSeries">—</dd></div>
                <div><dt>Thickness</dt><dd id="dialogFinish">—</dd></div>
            </dl>
            <p class="material-dialog-note">Confirm the exact slab specification with the IdeaRE team before final selection.</p>
            <div class="material-dialog-actions"><button class="btn primary" type="button" id="copyMaterialCode">Copy product code</button><a class="btn" href="pages/book-appointment.php">Book consultation</a></div>
        </div>
    </div>
</dialog>

<script src="assets/js/material-catalogue.js"></script>
<?php require __DIR__ . '/includes/customer/footer.php'; ?>
