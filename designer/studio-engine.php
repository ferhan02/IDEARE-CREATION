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
 __DIR__.'/../assets/js/designer-catalog-v5.js',
 __DIR__.'/../assets/js/designer-finishes-v7.js',
 __DIR__.'/../assets/js/designer-resize-v8.js',
 __DIR__.'/../assets/js/designer-space-v10.js',
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
// Keep the base roomVertices constant. Read a valid saved custom outline directly.
$roomStart='const roomVertices=()=>{let {shape,width:w,depth:d}=model.room;switch(shape){';
$roomNew='const roomVertices=()=>{let {shape,width:w,depth:d}=model.room;const custom=model.room.customOutline;const expected=shape==="angled"?5:["notch","l_open"].includes(shape)?6:4;if(custom?.shape===shape&&Array.isArray(custom.points)&&custom.points.length===expected&&custom.points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=0&&p.x<=1&&p.z>=0&&p.z<=1))return custom.points.map(p=>({x:p.x*w,z:p.z*d}));switch(shape){';
$parts[0]=str_replace($roomStart,$roomNew,$parts[0],$roomPatched);
if($roomPatched!==1){http_response_code(500);echo 'throw new Error("IDEARE room polygon source mismatch.");';exit;}
// Attach cabinet groups before constructing meshes, and isolate individual
// geometry errors so one cabinet cannot hide the entire room's contents.
$oldDraw='addRoom();for(let c of model.cabinets){let g=makeCabinet(c);cabinetGroup.add(g);meshById.set(c.uid,g);}worldGroup.add(cabinetGroup);worldGroup.add(extraGroup);addSharedElements();addExtras();';
$newDraw='addRoom();worldGroup.add(cabinetGroup);worldGroup.add(extraGroup);const failed=[];for(let c of model.cabinets){try{let g=makeCabinet(c);cabinetGroup.add(g);meshById.set(c.uid,g);}catch(error){console.error("IDEARE cabinet geometry:",c.name,c.uid,error);failed.push(c.name||"Cabinet");}}addSharedElements();addExtras();if(failed.length)notify("Could not display: "+failed.join(", ")+". See browser console for details.",true);';
$parts[0]=str_replace($oldDraw,$newDraw,$parts[0],$drawPatched);
if($drawPatched!==1){http_response_code(500);echo 'throw new Error("IDEARE designer render source mismatch.");';exit;}
// The original studio declares commitNew inside an IIFE. Promote only that
// binding to the combined module so the v4 placement wrapper and existing
// add, duplicate and drop handlers all use the same function.
$parts[1]=preg_replace('/\bfunction\s+commitNew\s*\(c\)\s*\{/', 'commitNew = function(c){', $parts[1], 1, $promoted);
if ($promoted!==1) {
 http_response_code(500);
 echo 'document.querySelector("#canvas-loader").textContent="Studio source version mismatch. Restore designer-studio.js from the repository."; throw new Error("IDEARE: commitNew binding not found");';
 exit;
}
// v6 footprint helpers execute before the studio IIFE. Patch only the exact
// geometry hooks verified in the current repository; never move its private
// bindings into the wrong scope.
$geometryPath=__DIR__.'/../assets/js/designer-geometry-v6.js';
$geometry=is_readable($geometryPath)?file_get_contents($geometryPath):false;
if ($geometry===false) { http_response_code(500); echo 'throw new Error("IDEARE v6 geometry file missing.");'; exit; }
$patches=[
 '/^const overlaps=\(a,b\)=>[^\r\n]*;/m'=>'const overlaps=(a,b)=>verticallyOverlaps(a,b)&&v6Overlap(a,b);',
 '/^function fits\(c,poly=roomVertices\(\)\)\{[^\r\n]*\}/m'=>'function fits(c,poly=roomVertices()){return v6Fits(c,poly);}',
 '/^ const available=model\.cabinets\.filter\(c=>c\.category!==\x27wall-cabinets\x27[^\r\n]*;/m'=>" const available=model.cabinets.filter(c=>!v6Special(c)&&c.category!=='wall-cabinets'&&c.category!=='tall-cabinets'&&c.rotation%360===0);",
];
foreach($patches as $pattern=>$replacement){
 $parts[1]=preg_replace($pattern,$replacement,$parts[1],1,$count);
 if($count!==1){http_response_code(500);echo 'throw new Error("IDEARE studio geometry source mismatch. Use the matching v5 repository files.");';exit;}
}
// Reject base-cabinet placement into appliances too, without requiring
// a wall-mounted cabinet to be attached before its wall search runs.
$old="if(others.some(o=>o.uid!==ignore&&overlaps(c,o)))return 'Cabinet overlaps another cabinet.';return '';";
$new="if(others.some(o=>o.uid!==ignore&&overlaps(c,o)))return 'Cabinet overlaps another cabinet.';if(window.IDEAREPlacementV4?.collisionFree&&!window.IDEAREPlacementV4.collisionFree(c))return 'Cabinet overlaps another object or leaves the room.';return '';";
$parts[1]=str_replace($old,$new,$parts[1],$count);
if($count!==1){http_response_code(500);echo 'throw new Error("IDEARE studio placement source mismatch.");';exit;}
// Explicit manual shared runs can contain special cabinet geometry. Do not
// flatten the shaped worktop/plinth into the missing corner.
// Remove shared runs containing corner-shaped units when rendering / saving.
// The corner model always renders its own accurately shaped surface.
$parts[1]=str_replace('const originals=model.shared.filter(run=>!run.auto);','const originals=model.shared.filter(run=>!run.auto&&!model.cabinets.some(c=>v6Special(c)&&run.cabinetUids?.includes(c.uid)));',$parts[1]);
// Backsplashes are now rendered per cabinet with their own finish.
$parts[1]=str_replace("if(part.every(c=>c.backsplash)&&hasSameFinish('worktopMaterial'))","if(false)",$parts[1]);
// Reject room changes that would orphan or crop a backsplash.
$parts[1]=str_replace('const ok=allFit();','const ok=allFit()&&(!window.IDEAREV8||window.IDEAREV8.roomValid())&&(!window.IDEARESpaceV10||window.IDEARESpaceV10.roomValid());',$parts[1]);
// v10 is an optional UI extension. Its synchronous startup must not prevent the main viewer from booting.
$space=array_pop($parts);
$report=<<<'JS'
function ideareStartupError(error){
 console.error("IDEARE designer startup:",error);
 const loader=document.querySelector("#canvas-loader");
 if(loader&&!loader.hidden)loader.textContent="Unable to start designer: "+(error?.message||String(error));
}
window.addEventListener("error",event=>{if(event.error&&document.querySelector("#canvas-loader")&&!document.querySelector("#canvas-loader").hidden)ideareStartupError(event.error);});
window.addEventListener("unhandledrejection",event=>{if(document.querySelector("#canvas-loader")&&!document.querySelector("#canvas-loader").hidden)ideareStartupError(event.reason);});
JS;
// Insert error listeners after the two static imports, before any extension runs.
$parts[0]=preg_replace('/(^import[^\r\n]*;\r?\nimport[^\r\n]*;\r?\n)/', '$1'.$report."\n", $parts[0], 1, $reportPatched);
if($reportPatched!==1){http_response_code(500);echo 'throw new Error("IDEARE engine imports changed.");';exit;}
echo $parts[0], "\n;\n", $geometry, "\n;\nlet commitNew;\n", implode("\n;\n",array_slice($parts,1)), "\n;\n";
echo "try {\n", $space, "\n} catch(error){console.error('IDEARE Define Space startup:',error);const old=document.querySelector('.ideare-environment');if(old)old.hidden=false;try{notify('Define Space upgrade could not initialize. The main designer is still available. See browser console.',true);}catch(_){} }\n;\n";
echo "Promise.resolve().then(()=>boot()).catch(ideareStartupError);\n";
