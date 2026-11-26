<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$p=dirname(__DIR__).'/index.php';$s=@file_get_contents($p);if($s===false){fwrite(STDERR,"Root index.php not found.\n");exit(1);}
$include="<?php require __DIR__ . '/home-configurator/homepage-section.php'; ?>";
if(str_contains($s,$include)){echo "Homepage already patched.\n";exit;}
$start='<section class="section home-section home-designer" id="cabinet-designer">';$a=strpos($s,$start);$b=$a===false?false:strpos($s,'</section>',$a);if($a===false||$b===false||!str_contains(substr($s,$a,$b-$a),'designer/index.php')){fwrite(STDERR,"Homepage section differs from checked repository. No changes made.\n");exit(1);}
$backup=$p.'.home-configurator-backup';if(file_exists($backup)){fwrite(STDERR,"Backup already exists; move it outside web root before retrying.\n");exit(1);}
// Backup outside the document root, or use system temporary folder.
$backup=tempnam(sys_get_temp_dir(),'ideare-index-');if(!$backup||file_put_contents($backup,$s)===false){fwrite(STDERR,"Backup failed.\n");exit(1);}
$new=substr($s,0,$a).$include.substr($s,$b+strlen('</section>'));if(file_put_contents($p,$new,LOCK_EX)===false){fwrite(STDERR,"Write failed. Backup: $backup\n");exit(1);}echo "Homepage patched. Backup: $backup\n";
