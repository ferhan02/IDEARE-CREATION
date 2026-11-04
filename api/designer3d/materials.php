<?php
require __DIR__.'/common.php';
$src=$_GET['source']??'';
if(!in_array($src,['topmix','dgtango','casero_stone_sintered','casero_stone_quartz'],true))id3_json(['ok'=>false,'error'=>'Invalid catalogue.'],400);
$q=id3_str($_GET['q']??'',100);$pdo=id3_db();
try {
  if(in_array($src,['topmix','dgtango'],true)){
    $sql="SELECT id,product_code,product_name,image_path AS image,category,series FROM `$src` WHERE is_active=1 AND (product_code LIKE ? OR product_name LIKE ?) ORDER BY product_name LIMIT 48";
  }elseif($src==='casero_stone_sintered'){
    $sql='SELECT id,product_code,product_name,primary_image AS image,collection AS category,surface_finish AS series FROM casero_stone_sintered WHERE is_active=1 AND (product_code LIKE ? OR product_name LIKE ?) ORDER BY product_name LIMIT 48';
  }else{
    $sql='SELECT quartz_id AS id,sku AS product_code,quartz_name AS product_name,image_file AS image,series_name AS category,finish AS series FROM casero_stone_quartz WHERE available=1 AND (sku LIKE ? OR quartz_name LIKE ?) ORDER BY quartz_name LIMIT 48';
  }
  $s=$pdo->prepare($sql);$like='%'.$q.'%';$s->execute([$like,$like]);
  $rows=$s->fetchAll(); foreach($rows as &$r) { $r['source']=$src; $r['image']=ltrim((string)($r['image']??''),'/'); }unset($r);
  id3_json(['ok'=>true,'items'=>$rows]);
}catch(Throwable $e){error_log('IDEARE designer materials: '.$e->getMessage());id3_json(['ok'=>false,'error'=>'Catalogue could not be loaded.'],503);}
