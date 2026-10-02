<?php
$pageTitle = "IdeaRE | Portfolio";
include __DIR__ . "/../includes/header.php";
?>

<main class="section">
    <div class="container">
        <p class="eyebrow">Portfolio</p>
        <h1>Selected projects</h1>
        <p>This page can later be connected to MySQL so projects are loaded dynamically.</p>

        <div class="card-grid">
            <article class="card project-card">
                <div class="project-placeholder">Project Image</div>
                <h2>Modern Kitchen</h2>
                <p>Example placeholder project description.</p>
            </article>
            <article class="card project-card">
                <div class="project-placeholder">Project Image</div>
                <h2>Wardrobe System</h2>
                <p>Example placeholder project description.</p>
            </article>
            <article class="card project-card">
                <div class="project-placeholder">Project Image</div>
                <h2>Living Space Storage</h2>
                <p>Example placeholder project description.</p>
            </article>
        </div>
    </div>
</main>

<?php include __DIR__ . "/../includes/footer.php"; ?>
