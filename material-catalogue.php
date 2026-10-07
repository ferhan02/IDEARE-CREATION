<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/config/databases.php';

$pageTitle = 'Material & Finish Catalogue | IDEARE';

function catalogue_h(?string $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function catalogue_image_url(?string $path): string {
    $path = trim((string)$path);
    if ($path === '') {
        return '';
    }

    $path = str_replace('\\', '/', $path);

    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }

    if (str_starts_with($path, '/')) {
        return $path;
    }

    $path = ltrim($path, '/');

    // Older imports sometimes stored uploads/materials/... instead of
    // public/uploads/materials/...
    if (str_starts_with($path, 'uploads/')) {
        return 'public/' . $path;
    }

    return $path;
}

function catalogue_page_url(int $page): string {
    $params = $_GET;
    $params['page'] = max(1, $page);

    foreach ($params as $key => $value) {
        if ($value === '' || $value === null) {
            unset($params[$key]);
        }
    }

    return '?' . http_build_query($params);
}

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

    $knownTables = [
        'material_catalogue_topmix' => 'Topmix',
        'material_catalogue_dgtango' => 'DGtango',
    ];

    $tableQuery = $pdo->query("
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN ('material_catalogue_topmix', 'material_catalogue_dgtango')
    ");

    $availableTables = array_flip($tableQuery->fetchAll(PDO::FETCH_COLUMN));

    $unionParts = [];

    foreach ($knownTables as $table => $fallbackSupplier) {
        if (!isset($availableTables[$table])) {
            continue;
        }

        // $table and $fallbackSupplier both come from the hard-coded whitelist above.
        $unionParts[] = "
            SELECT
                id,
                COALESCE(NULLIF(supplier, ''), '{$fallbackSupplier}') AS supplier,
                COALESCE(NULLIF(brand, ''), COALESCE(NULLIF(supplier, ''), '{$fallbackSupplier}')) AS brand,
                product_code,
                product_name,
                finish_code,
                category,
                series,
                image_filename,
                image_path,
                is_active
            FROM `{$table}`
            WHERE is_active = 1
        ";
    }

    if (!$unionParts) {
        throw new RuntimeException('No material catalogue tables were found.');
    }

    $baseSql = implode("\nUNION ALL\n", $unionParts);

    $totalProducts = (int)$pdo->query("
        SELECT COUNT(*)
        FROM ({$baseSql}) AS catalogue
    ")->fetchColumn();

    $supplierCounts = $pdo->query("
        SELECT supplier, COUNT(*) AS total
        FROM ({$baseSql}) AS catalogue
        GROUP BY supplier
        ORDER BY supplier
    ")->fetchAll();

    $suppliers = $pdo->query("
        SELECT DISTINCT supplier
        FROM ({$baseSql}) AS catalogue
        WHERE supplier IS NOT NULL AND supplier <> ''
        ORDER BY supplier
    ")->fetchAll(PDO::FETCH_COLUMN);

    $categories = $pdo->query("
        SELECT DISTINCT category
        FROM ({$baseSql}) AS catalogue
        WHERE category IS NOT NULL AND category <> ''
        ORDER BY category
    ")->fetchAll(PDO::FETCH_COLUMN);

    $seriesRows = $pdo->query("
        SELECT DISTINCT series
        FROM ({$baseSql}) AS catalogue
        WHERE series IS NOT NULL AND series <> ''
        ORDER BY series
    ")->fetchAll(PDO::FETCH_COLUMN);

    $where = [];
    $params = [];

    if ($q !== '') {
        $like = '%' . $q . '%';
        $where[] = "(
            product_code LIKE :q_code
            OR product_name LIKE :q_name
            OR finish_code LIKE :q_finish
            OR brand LIKE :q_brand
            OR supplier LIKE :q_supplier
        )";
        $params[':q_code'] = $like;
        $params[':q_name'] = $like;
        $params[':q_finish'] = $like;
        $params[':q_brand'] = $like;
        $params[':q_supplier'] = $like;
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

    if (!isset($sortMap[$sort])) {
        $sort = 'name';
    }

    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM ({$baseSql}) AS catalogue
        {$whereSql}
    ");
    $countStmt->execute($params);
    $filteredTotal = (int)$countStmt->fetchColumn();

    $totalPages = max(1, (int)ceil($filteredTotal / $perPage));
    if ($page > $totalPages) {
        $page = $totalPages;
    }

    $offset = ($page - 1) * $perPage;

    $sql = "
        SELECT *
        FROM ({$baseSql}) AS catalogue
        {$whereSql}
        ORDER BY {$sortMap[$sort]}
        LIMIT {$perPage} OFFSET {$offset}
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

} catch (Throwable $e) {
    $catalogueError = 'The material catalogue is temporarily unavailable. Please try again later.';
}

$staffSignedIn = !empty($_SESSION['staff_id']);
$showingFrom = $filteredTotal > 0 ? (($page - 1) * $perPage) + 1 : 0;
$showingTo = min($filteredTotal, $page * $perPage);

require __DIR__ . '/includes/customer/header.php';
?>

<link rel="stylesheet" href="assets/css/material-catalogue.css">

<main class="material-catalogue-page">
    <section class="catalogue-hero">
        <div class="site-wrap catalogue-hero-grid">
            <div>
                <p class="eyebrow">Material library</p>
                <h1>Material &amp; Finish Catalogue</h1>
                <p class="lead">
                    Explore HPL colours, woodgrains, stones, fabrics and specialty finishes
                    currently available in the IdeaRE material library.
                </p>

                <div class="catalogue-hero-actions">
                    <a class="btn primary" href="pages/book-appointment.php">Book a consultation</a>
                    <a class="btn" href="designer/index.php">Open Cabinet Designer</a>
                    <?php if ($staffSignedIn): ?>
                        <a class="btn" href="staff/index.php">Back to Staff Portal</a>
                    <?php endif; ?>
                </div>

                <p class="catalogue-note">
                    Screen colours may vary from the physical laminate. Confirm final selections
                    using an actual sample before production.
                </p>
            </div>

            <aside class="catalogue-summary-card" aria-label="Catalogue summary">
                <span class="catalogue-summary-number"><?= number_format($totalProducts) ?></span>
                <strong>active finishes</strong>

                <div class="supplier-summary">
                    <?php foreach ($supplierCounts as $row): ?>
                        <a
                            href="?<?= catalogue_h(http_build_query(['supplier' => $row['supplier']])) ?>"
                            class="supplier-summary-row"
                        >
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
                <div class="catalogue-message catalogue-message-error">
                    <strong>Catalogue unavailable</strong>
                    <span><?= catalogue_h($catalogueError) ?></span>
                </div>
            <?php else: ?>

                <form class="catalogue-filter-panel" method="get" id="catalogueFilters">
                    <div class="catalogue-search-field">
                        <label for="catalogueSearch">Search materials</label>
                        <div class="catalogue-search-control">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                                      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <input
                                id="catalogueSearch"
                                type="search"
                                name="q"
                                value="<?= catalogue_h($q) ?>"
                                placeholder="Search product code, name, brand..."
                                autocomplete="off"
                            >
                        </div>
                    </div>

                    <label>
                        Supplier
                        <select name="supplier" data-auto-submit>
                            <option value="">All suppliers</option>
                            <?php foreach ($suppliers as $item): ?>
                                <option value="<?= catalogue_h($item) ?>" <?= $supplier === $item ? 'selected' : '' ?>>
                                    <?= catalogue_h($item) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        Category
                        <select name="category" data-auto-submit>
                            <option value="">All categories</option>
                            <?php foreach ($categories as $item): ?>
                                <option value="<?= catalogue_h($item) ?>" <?= $category === $item ? 'selected' : '' ?>>
                                    <?= catalogue_h($item) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        Series
                        <select name="series" data-auto-submit>
                            <option value="">All series</option>
                            <?php foreach ($seriesRows as $item): ?>
                                <option value="<?= catalogue_h($item) ?>" <?= $series === $item ? 'selected' : '' ?>>
                                    <?= catalogue_h($item) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        Sort by
                        <select name="sort" data-auto-submit>
                            <option value="name" <?= $sort === 'name' ? 'selected' : '' ?>>Name A–Z</option>
                            <option value="code" <?= $sort === 'code' ? 'selected' : '' ?>>Product code</option>
                            <option value="supplier" <?= $sort === 'supplier' ? 'selected' : '' ?>>Supplier</option>
                            <option value="category" <?= $sort === 'category' ? 'selected' : '' ?>>Category</option>
                        </select>
                    </label>

                    <div class="catalogue-filter-actions">
                        <button class="btn primary" type="submit">Search</button>
                        <a class="btn" href="material-catalogue.php">Clear</a>
                    </div>
                </form>

                <?php if ($q !== '' || $supplier !== '' || $category !== '' || $series !== ''): ?>
                    <div class="catalogue-active-filters" aria-label="Active filters">
                        <span>Filtered by</span>
                        <?php if ($q !== ''): ?><b>“<?= catalogue_h($q) ?>”</b><?php endif; ?>
                        <?php if ($supplier !== ''): ?><b><?= catalogue_h($supplier) ?></b><?php endif; ?>
                        <?php if ($category !== ''): ?><b><?= catalogue_h($category) ?></b><?php endif; ?>
                        <?php if ($series !== ''): ?><b><?= catalogue_h($series) ?></b><?php endif; ?>
                    </div>
                <?php endif; ?>

                <div class="catalogue-results-head">
                    <div>
                        <p class="eyebrow">Browse finishes</p>
                        <h2><?= number_format($filteredTotal) ?> material<?= $filteredTotal === 1 ? '' : 's' ?></h2>
                    </div>
                    <span>
                        <?php if ($filteredTotal > 0): ?>
                            Showing <?= number_format($showingFrom) ?>–<?= number_format($showingTo) ?>
                        <?php else: ?>
                            No results
                        <?php endif; ?>
                    </span>
                </div>

                <?php if (!$products): ?>
                    <div class="catalogue-empty">
                        <div class="catalogue-empty-icon">◇</div>
                        <h2>No finishes found</h2>
                        <p>Try a different search term or clear one of the filters.</p>
                        <a class="btn primary" href="material-catalogue.php">View all materials</a>
                    </div>
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
                                $payloadJson = json_encode(
                                    $payload,
                                    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_APOS | JSON_HEX_QUOT
                                );
                            ?>
                            <article class="material-card">
                                <div class="material-image-wrap">
                                    <?php if ($image !== ''): ?>
                                        <img
                                            src="<?= catalogue_h($image) ?>"
                                            alt="<?= catalogue_h(($product['product_name'] ?? '') . ' ' . ($product['product_code'] ?? '')) ?>"
                                            loading="lazy"
                                            onerror="this.hidden=true; this.nextElementSibling.hidden=false;"
                                        >
                                        <div class="material-image-fallback" hidden>
                                            <span>Image unavailable</span>
                                        </div>
                                    <?php else: ?>
                                        <div class="material-image-fallback">
                                            <span>Image unavailable</span>
                                        </div>
                                    <?php endif; ?>

                                    <span class="material-supplier-badge">
                                        <?= catalogue_h($product['supplier'] ?? '') ?>
                                    </span>
                                </div>

                                <div class="material-card-body">
                                    <div class="material-code"><?= catalogue_h($product['product_code'] ?? '') ?></div>
                                    <h3><?= catalogue_h($product['product_name'] ?? 'Unnamed finish') ?></h3>

                                    <div class="material-meta">
                                        <?php if (!empty($product['category'])): ?>
                                            <span><?= catalogue_h($product['category']) ?></span>
                                        <?php endif; ?>
                                        <?php if (!empty($product['series'])): ?>
                                            <span><?= catalogue_h($product['series']) ?></span>
                                        <?php endif; ?>
                                        <?php if (!empty($product['finish_code'])): ?>
                                            <span><?= catalogue_h($product['finish_code']) ?></span>
                                        <?php endif; ?>
                                    </div>

                                    <button
                                        type="button"
                                        class="material-view-btn"
                                        data-material="<?= catalogue_h($payloadJson ?: '{}') ?>"
                                    >
                                        View finish
                                        <span aria-hidden="true">↗</span>
                                    </button>
                                </div>
                            </article>
                        <?php endforeach; ?>
                    </div>

                    <?php if ($totalPages > 1): ?>
                        <nav class="catalogue-pagination" aria-label="Catalogue pages">
                            <?php if ($page > 1): ?>
                                <a href="<?= catalogue_h(catalogue_page_url($page - 1)) ?>">← Previous</a>
                            <?php endif; ?>

                            <div class="catalogue-pagination-pages">
                                <?php
                                    $start = max(1, $page - 2);
                                    $end = min($totalPages, $page + 2);

                                    if ($start > 1) {
                                        echo '<a href="' . catalogue_h(catalogue_page_url(1)) . '">1</a>';
                                        if ($start > 2) {
                                            echo '<span>…</span>';
                                        }
                                    }

                                    for ($i = $start; $i <= $end; $i++) {
                                        $active = $i === $page ? ' class="active" aria-current="page"' : '';
                                        echo '<a' . $active . ' href="' . catalogue_h(catalogue_page_url($i)) . '">' . $i . '</a>';
                                    }

                                    if ($end < $totalPages) {
                                        if ($end < $totalPages - 1) {
                                            echo '<span>…</span>';
                                        }
                                        echo '<a href="' . catalogue_h(catalogue_page_url($totalPages)) . '">' . $totalPages . '</a>';
                                    }
                                ?>
                            </div>

                            <?php if ($page < $totalPages): ?>
                                <a href="<?= catalogue_h(catalogue_page_url($page + 1)) ?>">Next →</a>
                            <?php endif; ?>
                        </nav>
                    <?php endif; ?>

                <?php endif; ?>

            <?php endif; ?>
        </div>
    </section>

    <section class="catalogue-help-section">
        <div class="site-wrap">
            <article class="catalogue-help-card">
                <div>
                    <p class="eyebrow">Need help choosing?</p>
                    <h2>Bring your shortlisted finishes into your consultation.</h2>
                    <p>
                        Note the product code of any finish you like. The IdeaRE team can confirm
                        physical samples, availability and suitability for your project.
                    </p>
                </div>
                <div class="catalogue-help-actions">
                    <a class="btn primary" href="pages/book-appointment.php">Book Appointment</a>
                    <a class="btn" href="public/pages/contact.php">Contact IdeaRE</a>
                </div>
            </article>
        </div>
    </section>
</main>

<dialog class="material-dialog" id="materialDialog" aria-labelledby="materialDialogTitle">
    <div class="material-dialog-shell">
        <button class="material-dialog-close" type="button" data-dialog-close aria-label="Close material details">×</button>

        <div class="material-dialog-image">
            <img id="dialogMaterialImage" alt="">
            <div id="dialogImageFallback" class="material-image-fallback" hidden>
                <span>Image unavailable</span>
            </div>
        </div>

        <div class="material-dialog-content">
            <div class="material-dialog-topline">
                <span id="dialogSupplier" class="material-dialog-supplier"></span>
                <span id="dialogBrand" class="material-dialog-brand"></span>
            </div>

            <div id="dialogMaterialCode" class="material-code"></div>
            <h2 id="materialDialogTitle"></h2>

            <dl class="material-detail-list">
                <div>
                    <dt>Category</dt>
                    <dd id="dialogCategory">—</dd>
                </div>
                <div>
                    <dt>Series</dt>
                    <dd id="dialogSeries">—</dd>
                </div>
                <div>
                    <dt>Finish</dt>
                    <dd id="dialogFinish">—</dd>
                </div>
            </dl>

            <p class="material-dialog-note">
                Use the product code when discussing this finish with the IdeaRE team.
            </p>

            <div class="material-dialog-actions">
                <button class="btn primary" type="button" id="copyMaterialCode">Copy product code</button>
                <a class="btn" href="pages/book-appointment.php">Book consultation</a>
            </div>
        </div>
    </div>
</dialog>

<script src="assets/js/material-catalogue.js"></script>

<?php require __DIR__ . '/includes/customer/footer.php'; ?>
