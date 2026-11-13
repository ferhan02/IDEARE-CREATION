<?php
/** IDEARE 3D designer display fix installer; safe to run multiple times. */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit("Run using XAMPP PHP from the command line.\n"); }
$root = __DIR__;
$index = $root . DIRECTORY_SEPARATOR . 'designer' . DIRECTORY_SEPARATOR . 'index.php';
$css = $root . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'designer-3d-compact-theme.css';
if (!is_file($index) || !is_file($css)) { fwrite(STDERR, "ERROR: Extract this ZIP into the IDEARE CREATION project root first.\n"); exit(1); }
$before = file_get_contents($index);
if ($before === false) { fwrite(STDERR, "ERROR: Could not read designer/index.php\n"); exit(1); }
if (strpos($before, "assets/css/designer-3d-compact-theme.css") !== false) { echo "Already installed. No changes required.\n"; exit(0); }
$old = "\$pageStyles=['assets/css/designer-3d.css'];";
$new = "\$pageStyles=['assets/css/designer-3d.css','assets/css/designer-3d-compact-theme.css'];";
if (substr_count($before, $old) !== 1) { fwrite(STDERR, "ERROR: Designer stylesheet declaration differs from the reviewed GitHub version. No changes made.\n"); exit(1); }
$backup = $index . '.before-compact-theme.bak';
if (!is_file($backup) && file_put_contents($backup, $before) === false) { fwrite(STDERR, "ERROR: Unable to create backup.\n"); exit(1); }
$after = str_replace($old, $new, $before);
if (file_put_contents($index, $after) === false) { fwrite(STDERR, "ERROR: Could not update designer/index.php\n"); exit(1); }
echo "SUCCESS: Designer layout and dark-mode stylesheet registered.\nBackup: designer/index.php.before-compact-theme.bak\nRefresh with Ctrl+F5.\n";
