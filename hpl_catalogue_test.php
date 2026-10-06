<?php
declare(strict_types=1);

$dbHost = '127.0.0.1';
$dbName = 'ideare_db';
$dbUser = 'root';
$dbPass = '';
$baseUrl = '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die('<div style="font-family:Arial;padding:24px;background:#111;color:#fff"><h2>Database connection failed</h2><p>'
        . htmlspecialchars($e->getMessage())
        . '</p><p>Edit the database settings at the top of <strong>hpl_catalogue_test.php</strong>.</p></div>');
}

function e(?string $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function imageUrl(array $product, string $baseUrl): string {
    $path = trim((string)($product['image_path'] ?? ''));
    if ($path === '') return '';
    $path = str_replace('\\', '/', $path);
    $path = ltrim($path, '/');
    return rtrim($baseUrl, '/') . '/' . $path;
}

$search   = trim((string)($_GET['q'] ?? ''));
$category = trim((string)($_GET['category'] ?? ''));
$series   = trim((string)($_GET['series'] ?? ''));
$status   = trim((string)($_GET['active'] ?? '1'));

$where = [];
$params = [];

if ($search !== '') {
    $where[] = '(product_code LIKE :search OR product_name LIKE :search OR finish_code LIKE :search)';
    $params[':search'] = '%' . $search . '%';
}
if ($category !== '') {
    $where[] = 'category = :category';
    $params[':category'] = $category;
}
if ($series !== '') {
    $where[] = 'series = :series';
    $params[':series'] = $series;
}
if ($status === '1') $where[] = 'is_active = 1';
elseif ($status === '0') $where[] = 'is_active = 0';

$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$sql = "SELECT id,supplier,brand,product_code,product_name,finish_code,category,series,
               image_filename,image_path,is_active
        FROM material_catalogue
        {$whereSql}
        ORDER BY category, series, product_name, product_code";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

$categoryRows = $pdo->query("SELECT DISTINCT category FROM material_catalogue
    WHERE category IS NOT NULL AND category <> '' ORDER BY category")->fetchAll(PDO::FETCH_COLUMN);

$seriesRows = $pdo->query("SELECT DISTINCT series FROM material_catalogue
    WHERE series IS NOT NULL AND series <> '' ORDER BY series")->fetchAll(PDO::FETCH_COLUMN);

$totalProducts = (int)$pdo->query("SELECT COUNT(*) FROM material_catalogue")->fetchColumn();
$activeProducts = (int)$pdo->query("SELECT COUNT(*) FROM material_catalogue WHERE is_active = 1")->fetchColumn();
$withImages = (int)$pdo->query("SELECT COUNT(*) FROM material_catalogue
    WHERE image_path IS NOT NULL AND image_path <> ''")->fetchColumn();
$missingImages = max(0, $totalProducts - $withImages);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>IdeaRE HPL Catalogue Test</title>
<style>
:root{--bg:#0d0f12;--panel:#15181d;--panel2:#1b1f25;--line:#2a3038;--text:#f4f6f8;--muted:#9da7b3;--accent:#7c5cff;--accent2:#967fff;--success:#45d483;--warning:#ffcc66;--shadow:0 18px 50px rgba(0,0,0,.24)}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at top right,rgba(124,92,255,.12),transparent 28rem),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.wrap{width:min(1500px,calc(100% - 32px));margin:0 auto;padding:32px 0 56px}.hero{margin-bottom:24px}.eyebrow{color:var(--accent2);font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}h1{margin:0 0 8px;font-size:clamp(30px,4vw,48px);line-height:1.05}.subtitle{margin:0;color:var(--muted);max-width:820px;line-height:1.6}
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}.stat{background:rgba(21,24,29,.88);border:1px solid var(--line);border-radius:18px;padding:18px 20px;box-shadow:var(--shadow)}.stat .label{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.stat .value{margin-top:8px;font-size:30px;font-weight:800}
.filters{display:grid;grid-template-columns:minmax(220px,2fr) repeat(3,minmax(160px,1fr)) auto auto;gap:12px;background:rgba(21,24,29,.88);border:1px solid var(--line);border-radius:18px;padding:16px;margin-bottom:22px;box-shadow:var(--shadow)}
input,select,button,a.button{width:100%;min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);padding:0 13px;font:inherit;outline:none}input:focus,select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,92,255,.14)}button,a.button{cursor:pointer;background:linear-gradient(135deg,var(--accent),var(--accent2));border:0;font-weight:800;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding-inline:18px}a.button.secondary{background:var(--panel2);border:1px solid var(--line)}
.results-head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin:14px 2px}.results-head strong{font-size:18px}.results-head span{color:var(--muted);font-size:14px}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.card{overflow:hidden;background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);transition:.16s ease}.card:hover{transform:translateY(-3px);border-color:#444c58}
.image-wrap{position:relative;aspect-ratio:4/2.55;background:#20242b;display:grid;place-items:center;overflow:hidden}.image-wrap img{width:100%;height:100%;object-fit:cover;display:block}.no-image{text-align:center;color:var(--muted);font-size:13px;padding:20px}.badge{position:absolute;right:10px;top:10px;padding:6px 9px;border-radius:999px;background:rgba(13,15,18,.86);border:1px solid rgba(255,255,255,.1);font-size:11px;font-weight:800}
.body{padding:17px}.code{font-size:13px;color:var(--accent2);font-weight:900;letter-spacing:.04em}.name{margin-top:5px;font-weight:800;font-size:17px;min-height:42px;line-height:1.25}.meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.pill{border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:5px 8px;color:var(--muted);font-size:11px}.path{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);color:#74808d;font-size:10px;word-break:break-all;line-height:1.4}.empty{grid-column:1/-1;background:var(--panel);border:1px dashed var(--line);border-radius:18px;padding:56px 20px;text-align:center;color:var(--muted)}
@media(max-width:1150px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.filters{grid-template-columns:repeat(2,minmax(0,1fr))}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.wrap{width:min(100% - 20px,1500px);padding-top:20px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.filters{grid-template-columns:1fr}}@media(max-width:500px){.grid{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<div class="wrap">
<header class="hero">
<div class="eyebrow">IdeaRE / Catalogue Test</div>
<h1>Topmix HPL Catalogue</h1>
<p class="subtitle">Temporary testing page for the records stored in <strong>material_catalogue</strong>. Use it to verify imported product data and image paths before integrating the catalogue into the main website.</p>
</header>

<section class="stats">
<div class="stat"><div class="label">Database records</div><div class="value"><?= number_format($totalProducts) ?></div></div>
<div class="stat"><div class="label">Active products</div><div class="value"><?= number_format($activeProducts) ?></div></div>
<div class="stat"><div class="label">With image path</div><div class="value"><?= number_format($withImages) ?></div></div>
<div class="stat"><div class="label">Missing image path</div><div class="value" style="color:<?= $missingImages>0?'var(--warning)':'var(--success)' ?>"><?= number_format($missingImages) ?></div></div>
</section>

<form class="filters" method="get">
<input type="search" name="q" value="<?= e($search) ?>" placeholder="Search code, name or finish...">
<select name="category"><option value="">All categories</option><?php foreach($categoryRows as $item): ?><option value="<?= e($item) ?>" <?= $category===$item?'selected':'' ?>><?= e($item) ?></option><?php endforeach; ?></select>
<select name="series"><option value="">All series</option><?php foreach($seriesRows as $item): ?><option value="<?= e($item) ?>" <?= $series===$item?'selected':'' ?>><?= e($item) ?></option><?php endforeach; ?></select>
<select name="active"><option value="" <?= $status===''?'selected':'' ?>>All statuses</option><option value="1" <?= $status==='1'?'selected':'' ?>>Active only</option><option value="0" <?= $status==='0'?'selected':'' ?>>Inactive only</option></select>
<button type="submit">Apply</button><a class="button secondary" href="<?= e($_SERVER['PHP_SELF']) ?>">Reset</a>
</form>

<div class="results-head"><strong><?= number_format(count($products)) ?> products shown</strong><span>Images load using the database <code>image_path</code>.</span></div>

<main class="grid">
<?php if(!$products): ?><div class="empty"><h3>No catalogue products found</h3><p>Reset the filters or check your database import.</p></div><?php endif; ?>

<?php foreach($products as $product): $img=imageUrl($product,$baseUrl); ?>
<article class="card">
<div class="image-wrap">
<?php if($img!==''): ?>
<img src="<?= e($img) ?>" alt="<?= e($product['product_name']) ?>" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
<div class="no-image" style="display:none">Image failed to load.<br>Check <strong>image_path</strong>.</div>
<?php else: ?><div class="no-image">No image path stored.</div><?php endif; ?>
<div class="badge"><?= ((int)$product['is_active']===1)?'ACTIVE':'INACTIVE' ?></div>
</div>

<div class="body">
<div class="code"><?= e($product['product_code']) ?></div>
<div class="name"><?= e($product['product_name']) ?></div>
<div class="meta">
<?php if(!empty($product['finish_code'])): ?><span class="pill">Finish: <?= e($product['finish_code']) ?></span><?php endif; ?>
<?php if(!empty($product['category'])): ?><span class="pill"><?= e($product['category']) ?></span><?php endif; ?>
<?php if(!empty($product['series'])): ?><span class="pill"><?= e($product['series']) ?></span><?php endif; ?>
<?php if(!empty($product['brand'])): ?><span class="pill"><?= e($product['brand']) ?></span><?php endif; ?>
</div>
<div class="path">ID <?= (int)$product['id'] ?><br><?= e($product['image_path']) ?></div>
</div>
</article>
<?php endforeach; ?>
</main>
</div>
</body>
</html>
