<?php
/** Keep older service links working while using the canonical customer Services page. */
$query = isset($_SERVER['QUERY_STRING']) && is_string($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== ''
    ? '?' . $_SERVER['QUERY_STRING'] : '';
header('Location: ../public/pages/services.php' . $query, true, 302);
exit;
