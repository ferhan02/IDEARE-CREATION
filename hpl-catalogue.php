<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/catalogue/catalogue-tools.php';

$pageTitle = 'HPL Catalogue | IDEARE';

$products = [];
$suppliers = [];
$categories = [];
$seriesRows = [];
$supplierCounts = [];
$totalProducts = 0;
$filteredTotal = 0;
$catalogueError = null;

$q = trim((string)($_GET['q'] ?? ''));
$supplier = trim((string)($_GET['supplier'] ?? ''));
$category = trim((string)($_GET['category'] ?? ''));
$series = trim((string)($_GET['series'] ?? ''));
$sort = trim((string)($_GET['sort'] ?? 'name'));
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 24;
$totalPages = 1;

try {
    $pdo = staff_db();
    $baseSql = catalogue_build_hpl_base($pdo);

    $totalProducts = catalogue_count_from_base($pdo, $baseSql);

    $supplierCounts = $pdo->query("
        SELECT supplier, COUNT(*) total
        FROM ({$baseSql}) catalogue
        GROUP BY supplier
        ORDER BY supplier
    ")->fetchAll();

    $suppliers = $pdo->query("
        SELECT DISTINCT supplier FROM ({$baseSql}) catalogue
        WHERE supplier IS NOT NULL AND supplier <> ''
        ORDER BY supplier
    ")->fetchAll(PDO::FETCH_COLUMN);

    $categories = $pdo->query("
        SELECT DISTINCT category FROM ({$baseSql}) catalogue
        WHERE category IS NOT NULL AND category <> ''
        ORDER BY category
    ")->fetchAll(PDO::FETCH_COLUMN);

    $seriesRows = $pdo->query("
        SELECT DISTINCT series FROM ({$baseSql}) catalogue
        WHERE series IS NOT NULL AND series <> ''
        ORDER BY series
    ")->fetchAll(PDO::FETCH_COLUMN);

    $where = [];
    $params = [];

    if ($q !== '') {
        $like = '%' . $q . '%';
        $where[] = '(product_code LIKE :q1 OR product_name LIKE :q2 OR finish_code LIKE :q3 OR brand LIKE :q4 OR supplier LIKE :q5 OR category LIKE :q6 OR series LIKE :q7)';
        foreach (range(1, 7) as $i) $params[':q' . $i] = $like;
    }

    if ($supplier !== '') {
        $where[] = 'supplier = :supplier';
        $params[':supplier'] = $supplier;
    }

    if ($category !== '') {
        $where[] = 'category = :category';
        $params[':category'] = $category;
    }

    if ($series !== '') {
        $where[] = 'series = :series';
        $params[':series'] = $series;
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $sortMap = [
        'name' => 'product_name ASC, product_code ASC',
        'code' => 'product_code ASC, product_name ASC',
        'supplier' => 'supplier ASC, product_name ASC',
        'category' => 'category ASC, series ASC, product_name ASC',
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
    $catalogueError = 'The HPL catalogue is temporarily unavailable.';
}

$showingFrom = $filteredTotal > 0 ? (($page - 1) * $perPage) + 1 : 0;
$showingTo = min($filteredTotal, $page * $perPage);

require __DIR__ . '/includes/customer/header.php';
?>
<link rel="stylesheet" href="assets/css/material-catalogue.css">
<link rel="stylesheet" href="assets/css/material-library.css">

<main class="material-catalogue-page">
    <section class="catalogue-hero">
        <div class="site-wrap catalogue-hero-grid">
            <div>
                <div class="catalogue-breadcrumbs">
                    <a href="material-catalogue.php">Materials</a><span>›</span><b>HPL</b>
                </div>
                <p class="eyebrow">Cabinet finishes</p>
                <h1>HPL Catalogue</h1>
                <p class="lead">Explore Topmix and DGtango HPL finishes without mixing them with countertop stone products.</p>
                <div class="catalogue-hero-actions">
                    <a class="btn primary" href="designer/index.php">Open Cabinet Designer</a>
                    <a class="btn" href="stone-catalogue.php">Browse Stone Catalogue</a>
                </div>
                <p class="catalogue-note">Screen colours can differ from physical laminate samples. Confirm the final finish before production.</p>
            </div>

            <aside class="catalogue-summary-card">
                <span class="catalogue-summary-number"><?= number_format($totalProducts) ?></span>
                <strong>active HPL finishes</strong>
                <div class="supplier-summary">
                    <?php foreach ($supplierCounts as $row): ?>
                        <a class="supplier-summary-row" href="?<?= catalogue_h(http_build_query(['supplier' => $row['supplier']])) ?>">
                            <span><?= catalogue_h($row['supplier']) ?></span>
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
                        <label for="catalogueSearch">Search HPL</label>
                        <div class="catalogue-search-control">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                            <input id="catalogueSearch" type="search" name="q" value="<?= catalogue_h($q) ?>" placeholder="Code, name, finish, brand..." autocomplete="off">
                        </div>
                    </div>

                    <label>Supplier
                        <select name="supplier" data-auto-submit>
                            <option value="">All suppliers</option>
                            <?php foreach ($suppliers as $item): ?><option value="<?= catalogue_h($item) ?>" <?= $supplier === $item ? 'selected' : '' ?>><?= catalogue_h($item) ?></option><?php endforeach; ?>
                        </select>
                    </label>

                    <label>Category
                        <select name="category" data-auto-submit>
                            <option value="">All categories</option>
                            <?php foreach ($categories as $item): ?><option value="<?= catalogue_h($item) ?>" <?= $category === $item ? 'selected' : '' ?>><?= catalogue_h($item) ?></option><?php endforeach; ?>
                        </select>
                    </label>

                    <label>Series
                        <select name="series" data-auto-submit>
                            <option value="">All series</option>
                            <?php foreach ($seriesRows as $item): ?><option value="<?= catalogue_h($item) ?>" <?= $series === $item ? 'selected' : '' ?>><?= catalogue_h($item) ?></option><?php endforeach; ?>
                        </select>
                    </label>

                    <label>Sort by
                        <select name="sort" data-auto-submit>
                            <option value="name" <?= $sort === 'name' ? 'selected' : '' ?>>Name A–Z</option>
                            <option value="code" <?= $sort === 'code' ? 'selected' : '' ?>>Product code</option>
                            <option value="supplier" <?= $sort === 'supplier' ? 'selected' : '' ?>>Supplier</option>
                            <option value="category" <?= $sort === 'category' ? 'selected' : '' ?>>Category</option>
                        </select>
                    </label>

                    <div class="catalogue-filter-actions">
                        <button class="btn primary" type="submit">Search</button>
                        <a class="btn" href="hpl-catalogue.php">Clear</a>
                    </div>
                </form>

                <div class="catalogue-results-head">
                    <div><p class="eyebrow">Browse HPL</p><h2><?= number_format($filteredTotal) ?> finish<?= $filteredTotal === 1 ? '' : 'es' ?></h2></div>
                    <span><?= $filteredTotal ? 'Showing ' . number_format($showingFrom) . '–' . number_format($showingTo) : 'No results' ?></span>
                </div>

                <?php if (!$products): ?>
                    <div class="catalogue-empty"><div class="catalogue-empty-icon">◇</div><h2>No HPL finishes found</h2><p>Try a different search term or clear the filters.</p><a class="btn primary" href="hpl-catalogue.php">View all HPL</a></div>
                <?php else: ?>
                    <div class="material-grid">
                        <?php foreach ($products as $product): ?>
                            <?php
                            $image = catalogue_image_url($product['image_path'] ?? '');
                            $payload = [
                                'supplier' => (string)($product['supplier'] ?? ''),
                                'brand' => (string)($product['brand'] ?? ''),
                                'code' => (string)($product['product_code'] ?? ''),
                                'name' => (string)($product['product_name'] ?? ''),
                                'finish' => (string)($product['finish_code'] ?? ''),
                                'category' => (string)($product['category'] ?? ''),
                                'series' => (string)($product['series'] ?? ''),
                                'image' => $image,
                            ];
                            $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_APOS | JSON_HEX_QUOT);
                            ?>
                            <article class="material-card">
                                <div class="material-image-wrap">
                                    <?php if ($image !== ''): ?>
                                        <img src="<?= catalogue_h($image) ?>" alt="<?= catalogue_h(($product['product_name'] ?? '') . ' ' . ($product['product_code'] ?? '')) ?>" loading="lazy" onerror="this.hidden=true; this.nextElementSibling.hidden=false;">
                                        <div class="material-image-fallback" hidden><span>Image unavailable</span></div>
                                    <?php else: ?><div class="material-image-fallback"><span>Image unavailable</span></div><?php endif; ?>
                                    <span class="material-supplier-badge"><?= catalogue_h($product['supplier'] ?? '') ?></span>
                                </div>
                                <div class="material-card-body">
                                    <div class="material-code"><?= catalogue_h($product['product_code'] ?? '') ?></div>
                                    <h3><?= catalogue_h($product['product_name'] ?: 'Unnamed finish') ?></h3>
                                    <div class="material-meta">
                                        <?php if (!empty($product['category'])): ?><span><?= catalogue_h($product['category']) ?></span><?php endif; ?>
                                        <?php if (!empty($product['series'])): ?><span><?= catalogue_h($product['series']) ?></span><?php endif; ?>
                                        <?php if (!empty($product['finish_code'])): ?><span><?= catalogue_h($product['finish_code']) ?></span><?php endif; ?>
                                    </div>
                                    <button type="button" class="material-view-btn" data-material="<?= catalogue_h($payloadJson ?: '{}') ?>">View finish <span aria-hidden="true">↗</span></button>
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
        <button class="material-dialog-close" type="button" data-dialog-close aria-label="Close material details">×</button>
        <div class="material-dialog-image"><img id="dialogMaterialImage" alt=""><div id="dialogImageFallback" class="material-image-fallback" hidden><span>Image unavailable</span></div></div>
        <div class="material-dialog-content">
            <div class="material-dialog-topline"><span id="dialogSupplier" class="material-dialog-supplier"></span><span id="dialogBrand" class="material-dialog-brand"></span></div>
            <div id="dialogMaterialCode" class="material-code"></div>
            <h2 id="materialDialogTitle"></h2>
            <dl class="material-detail-list">
                <div><dt>Category</dt><dd id="dialogCategory">—</dd></div>
                <div><dt>Series</dt><dd id="dialogSeries">—</dd></div>
                <div><dt>Finish</dt><dd id="dialogFinish">—</dd></div>
            </dl>
            <p class="material-dialog-note">Use the product code when discussing this finish with the IdeaRE team.</p>
            <div class="material-dialog-actions"><button class="btn primary" type="button" id="copyMaterialCode">Copy product code</button><a class="btn" href="pages/book-appointment.php">Book consultation</a></div>
        </div>
    </div>
</dialog>

<script src="assets/js/material-catalogue.js"></script>
<?php require __DIR__ . '/includes/customer/footer.php'; ?>
