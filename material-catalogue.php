<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/catalogue/catalogue-tools.php';

$pageTitle = 'Materials | IDEARE';
$hplCount = 0;
$stoneCount = 0;
$hplAvailable = false;
$stoneAvailable = false;

try {
    $pdo = staff_db();

    try {
        $hplBase = catalogue_build_hpl_base($pdo);
        $hplCount = catalogue_count_from_base($pdo, $hplBase);
        $hplAvailable = true;
    } catch (Throwable $e) {}

    try {
        $stoneBase = catalogue_build_stone_base($pdo);
        $stoneCount = catalogue_count_from_base($pdo, $stoneBase);
        $stoneAvailable = true;
    } catch (Throwable $e) {}
} catch (Throwable $e) {}

require __DIR__ . '/includes/customer/header.php';
?>
<link rel="stylesheet" href="assets/css/material-library.css">

<main class="material-library-page">
    <section class="material-library-hero">
        <div class="site-wrap">
            <p class="eyebrow">Material library</p>
            <h1>Choose a material catalogue.</h1>
            <p class="lead">
                Browse laminate finishes separately from stone surfaces so each catalogue stays focused and easier to search.
            </p>
        </div>
    </section>

    <section class="material-library-choices">
        <div class="site-wrap material-library-grid">
            <a class="material-library-card" href="hpl-catalogue.php">
                <div class="material-library-card-top">
                    <span class="material-library-kicker">Cabinet finishes</span>
                    <span class="material-library-arrow" aria-hidden="true">↗</span>
                </div>
                <div>
                    <h2>HPL Catalogue</h2>
                    <p>Browse Topmix and DGtango HPL colours, woodgrains, stones, fabrics and specialty finishes.</p>
                </div>
                <div class="material-library-meta">
                    <span>Topmix + DGtango</span>
                    <b><?= $hplAvailable ? number_format($hplCount) . ' finishes' : 'Catalogue unavailable' ?></b>
                </div>
            </a>

            <a class="material-library-card material-library-card-stone" href="stone-catalogue.php">
                <div class="material-library-card-top">
                    <span class="material-library-kicker">Countertop &amp; surface materials</span>
                    <span class="material-library-arrow" aria-hidden="true">↗</span>
                </div>
                <div>
                    <h2>Stone Catalogue</h2>
                    <p>Browse Casero sintered stone and quartz separately from the HPL finish library.</p>
                </div>
                <div class="material-library-meta">
                    <span>Sintered + Quartz</span>
                    <b><?= $stoneAvailable ? number_format($stoneCount) . ' products' : 'Catalogue unavailable' ?></b>
                </div>
            </a>
        </div>
    </section>

    <section class="material-library-help">
        <div class="site-wrap material-library-help-card">
            <div>
                <p class="eyebrow">Need a physical sample?</p>
                <h2>Shortlist the codes you like.</h2>
                <p class="muted">The IdeaRE team can confirm physical samples, availability and suitability during consultation.</p>
            </div>
            <a class="btn primary" href="pages/book-appointment.php">Book Appointment</a>
        </div>
    </section>
</main>

<?php require __DIR__ . '/includes/customer/footer.php'; ?>
