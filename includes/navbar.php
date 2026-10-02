<?php
$root = str_contains($_SERVER['PHP_SELF'], '/pages/') ? '../' : '';
?>
<header class="site-header">
    <div class="container nav-wrap">
        <a class="brand" href="<?= $root ?>index.php">IdeaRE</a>

        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
            ☰
        </button>

        <nav class="site-nav">
            <a href="<?= $root ?>index.php">Home</a>
            <a href="<?= $root ?>pages/about.php">About</a>
            <a href="<?= $root ?>pages/services.php">Services</a>
            <a href="<?= $root ?>pages/portfolio.php">Portfolio</a>
            <a href="<?= $root ?>pages/contact.php">Contact</a>
        </nav>
    </div>
</header>
