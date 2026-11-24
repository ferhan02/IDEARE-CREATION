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
 __DIR__.'/../assets/js/designer-enhancements-v4.js',
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
// The original studio declares commitNew inside an IIFE. Promote only that
// binding to the combined module so the v4 placement wrapper and existing
// add, duplicate and drop handlers all use the same function.
$parts[1]=preg_replace('/\bfunction\s+commitNew\s*\(c\)\s*\{/', 'commitNew = function(c){', $parts[1], 1, $promoted);
if ($promoted!==1) {
 http_response_code(500);
 echo 'document.querySelector("#canvas-loader").textContent="Studio source version mismatch. Restore designer-studio.js from the repository."; throw new Error("IDEARE: commitNew binding not found");';
 exit;
}
echo $parts[0], "\n;\nlet commitNew;\n", implode("\n;\n",array_slice($parts,1)), "\n;\nboot().catch(error=>{ console.error(error); const loader=document.querySelector(\"#canvas-loader\"); if(loader){loader.hidden=false;loader.textContent=\"Unable to start designer: \"+error.message;} });\n";
