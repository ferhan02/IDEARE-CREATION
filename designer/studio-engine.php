<?php
// Serve the existing repository's designer engine with the studio extension in the
// same ES module scope. Keep the original designer-3d.js and its backend intact.
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-cache');
header('X-Content-Type-Options: nosniff');
$base=__DIR__.'/../assets/js/designer-3d.js';
$extension=__DIR__.'/../assets/js/designer-studio.js';
$source=is_readable($base)?file_get_contents($base):false;
$addon=is_readable($extension)?file_get_contents($extension):false;
if ($source===false || $addon===false || !preg_match('/\bboot\(\);\s*\z/', $source)) {
    http_response_code(500);
    echo 'document.getElementById("canvas-loader").textContent="Designer engine unavailable. Please restore the original designer-3d.js."; throw new Error("IDEARE studio: engine missing or incompatible");';
    exit;
}
// Invoke the original boot after the extension has installed the interaction overrides.
$source=preg_replace('/\bboot\(\);\s*\z/', '', $source, 1);
echo $source, "\n;\n", $addon, "\nboot();\n";
