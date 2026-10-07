<?php
$root = str_contains($_SERVER['PHP_SELF'], '/pages/') ? '../' : '';
?>
<header class="site-header">
    <div class="container nav-wrap">
        <a class="brand logo-link" href="<?= $root ?>index.php" aria-label="IDEARE home">
            <img src="<?= $root ?>assets/images/ideare-logo.png" alt="IDEARE" style="display:block;width:156px;max-width:42vw;height:auto;background:#000">
        </a>
        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>
        <nav class="site-nav">
            <a href="<?= $root ?>index.php">Home</a>
            <a href="<?= $root ?>pages/about.php">About</a>
            <a href="<?= $root ?>pages/services.php">Services</a>
            <a href="<?= $root ?>pages/portfolio.php">Portfolio</a>
            <a href="<?= $root ?>pages/contact.php">Contact</a>
            <button class="theme-toggle site-theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" title="Switch to dark mode"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4"/><path d="M8.2 14.7A7 7 0 1 1 15.8 14.7C14.7 15.5 14 16.5 14 18h-4c0-1.5-.7-2.5-1.8-3.3Z"/></svg></button>
        </nav>
    </div>
</header>
