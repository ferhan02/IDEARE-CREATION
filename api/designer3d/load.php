<?php
require __DIR__.'/common.php';
$code=id3_str($_GET['code']??'',50);$token=id3_str($_GET['token']??'',64);
if(!$code||!$token)id3_json(['ok'=>false,'error'=>'A saved-design link is required.'],403);
$pdo=id3_db();
try {
  $s=$pdo->prepare('SELECT * FROM designs WHERE design_code=? LIMIT 1');$s->execute([$code]);$d=$s->fetch();
  if(!$d||!id3_token_owner($pdo,(int)$d['id'],$token))id3_json(['ok'=>false,'error'=>'Design link not found or no longer valid.'],403);
  $s=$pdo->prepare('SELECT scene_json,revision_no FROM designer_revisions WHERE design_id=? ORDER BY revision_no DESC LIMIT 1');$s->execute([$d['id']]);$r=$s->fetch();
  if(!$r)id3_json(['ok'=>false,'error'=>'The saved design has no 3D scene.'],404);
  id3_json(['ok'=>true,'design_code'=>$code,'status'=>$d['status'],'revision_no'=>(int)$r['revision_no'],'scene'=>json_decode($r['scene_json'],true),'contact'=>['design_name'=>$d['design_name'],'customer_name'=>$d['customer_name'],'customer_email'=>$d['customer_email'],'customer_phone'=>$d['customer_phone'],'property_type'=>$d['property_type'],'project_location'=>$d['project_location'],'budget_range'=>$d['budget_range'],'preferred_contact_method'=>$d['preferred_contact_method'],'notes'=>$d['notes']]]);
}catch(Throwable $e){error_log('IDEARE designer load: '.$e->getMessage());id3_json(['ok'=>false,'error'=>'Could not load saved design.'],503);}
