<?php
$root = str_contains($_SERVER['PHP_SELF'], '/pages/') ? '../' : '';
?>
<header class="site-header">
    <div class="container nav-wrap">
        <a class="brand logo-link" href="<?= $root ?>index.php" aria-label="IDEARE home">
            <img
                src="<?= $root ?>assets/images/ideare-logo.png"
                alt="IDEARE"
                style="display:block;width:156px;max-width:42vw;height:auto;background:#000"
            >
        </a>

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
