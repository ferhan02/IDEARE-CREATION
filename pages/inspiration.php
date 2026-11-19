<?php
if (!isset($_GET['style']) || !is_string($_GET['style']) || trim($_GET['style']) === '') {header('Location: ../index.php#inspiration', true, 302);exit;}
$pageTitle = 'Interior Inspirations | IDEARE Creation';
$pageStyles = ['assets/css/concept-orbit.css'];
$pageScripts = ['assets/js/concept-orbit.js'];
require __DIR__ . '/../includes/customer/header.php';
?>
<main class="ci-page" id="main-content"><div id="ci-app" class="ci-app"><div class="ci-shell ci-loading" role="status"><h1>Interior Inspirations</h1><p>Loading your collection…</p></div></div></main>
<?php require __DIR__ . '/../includes/customer/footer.php'; ?>
