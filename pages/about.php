<?php
// Keep the older About URL working while serving the customer-facing About page.
header('Location: ../public/pages/about.php', true, 302);
exit;
