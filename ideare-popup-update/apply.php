<?php
// CLI-only, exact anchors from current IDEARE main. Never overwrite the full designer module.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
function readSource($path){$s=@file_get_contents($path);if($s===false)throw new RuntimeException('Cannot read '.$path);return $s;}
function replaceOne(&$s,$a,$b,$label){if(substr_count($s,$a)!==1)throw new RuntimeException('Unexpected source: '.$label.'. No existing files changed.');$s=str_replace($a,$b,$s);}
$root=dirname(__DIR__);
try{
 $jsPath=$root.'/assets/js/designer.js';$headerPath=$root.'/includes/customer/header.php';
 $oldJs=readSource($jsPath);$oldHeader=readSource($headerPath);$js=$oldJs;$header=$oldHeader;
 foreach(['assets/js/designer-item-previews.js','assets/js/design-studio-popups.js','assets/css/design-studio-popups.css'] as $f)if(!is_file($root.'/'.$f))throw new RuntimeException('Missing update asset: '.$f);
 if(!str_contains($js,'/* IDEARE cabinet refinement v2: module-shared state */'))throw new RuntimeException('Install the previous cabinet startup fix first. No existing files changed.');
 if(!str_contains($js,'/* IDEARE item preview bridge v1')){
  replaceOne($js, "b.onclick=()=>selectPanel(p);list.append(b);", "b.dataset.selectSplash=p.id;b.onclick=()=>selectPanel(p);list.append(b);", 'backsplash row identifier');
  replaceOne($js,'w=Math.min(310,window.innerWidth-16);items.style.width', 'w=Math.min(350,window.innerWidth-16);items.style.width','items popup width');
  $entry='Promise.resolve().then(()=>boot()).catch(ideareStartupError);';
  replaceOne($js,$entry,readSource(__DIR__.'/bridge.js')."\n".$entry,'module entry');
 }
 if(!str_contains($header,'assets/js/design-studio-popups.js')){
  $anchor='<?php if (in_array($idearePage, [\'designer\',\'home-configurator\'], true)): ?>';
  $tags=<<<'HTML'
<link rel="stylesheet" href="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/css/design-studio-popups.css?v=20261127-popup1">
<script defer src="<?= htmlspecialchars($customerRoot, ENT_QUOTES, 'UTF-8') ?>assets/js/design-studio-popups.js?v=20261127-popup1"></script>
HTML;
  replaceOne($header,$anchor,$anchor."\n".$tags,'shared studio assets');
 }
 $files=[$jsPath=>[$oldJs,$js],$headerPath=>[$oldHeader,$header]];
 if($js===$oldJs&&$header===$oldHeader){echo "Items and popup update already installed.\n";exit;}
 $backup=sys_get_temp_dir().DIRECTORY_SEPARATOR.'ideare-popups-'.date('Ymd-His').'-'.bin2hex(random_bytes(3));
 if(!mkdir($backup,0700))throw new RuntimeException('Cannot create backup.');
 foreach($files as $path=>[$old,$new]){if(!is_writable($path)||file_put_contents($backup.'/'.basename($path),$old,LOCK_EX)!==strlen($old))throw new RuntimeException('Backup failed: '.$path);}
 $written=[];try{foreach($files as $path=>[$old,$new]){if($old===$new)continue;$written[]=$path;if(file_put_contents($path,$new,LOCK_EX)!==strlen($new))throw new RuntimeException('Cannot write '.$path);}}catch(Throwable $e){foreach($written as $path)@file_put_contents($path,$files[$path][0],LOCK_EX);throw $e;}
 echo "Items previews and popup layers installed.\nBackup: $backup\nRefresh with Ctrl+F5.\n";
}catch(Throwable $e){fwrite(STDERR,$e->getMessage()."\n");exit(1);}
