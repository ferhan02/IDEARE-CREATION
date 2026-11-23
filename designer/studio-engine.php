<?php
// IDEARE 3D designer: unchanged original base + scoped studio upgrades.
// Files run in the same ES-module scope so the extensions can reuse the
// repository's catalog, renderer, persistence and validation functions.
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');
$files=[
 __DIR__.'/../assets/js/designer-3d.js',
 __DIR__.'/../assets/js/designer-studio.js',
 __DIR__.'/../assets/js/designer-interactions-v2.js',
 __DIR__.'/../assets/js/designer-catalog-v3.js',
];
$parts=[];
foreach ($files as $file) {
 $source=is_readable($file)?file_get_contents($file):false;
 if ($source===false) {
  http_response_code(500);
  echo 'throw new Error("IDEARE designer files missing. Copy all ZIP files into the website root.");';
  exit;
 }
 $parts[]=$source;
}
if (!preg_match('/\bboot\(\);\s*\z/', $parts[0])) {
 http_response_code(500);
 echo 'throw new Error("IDEARE designer base engine changed. Check designer-3d.js.");';
 exit;
}
$parts[0]=preg_replace('/\bboot\(\);\s*\z/', '', $parts[0], 1);
echo implode("\n;\n",$parts), "\n;\nboot();\n";
