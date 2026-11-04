<?php
require __DIR__.'/common.php';
require_once __DIR__.'/../../includes/staff/auth.php';
require_login();
$staff=current_staff();$manager=ideare_is_owner_or_manager($staff);
if(!$manager&&!can('design.view_assigned'))id3_json(['ok'=>false,'error'=>'Design permission required.'],403);
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if(!$id)id3_json(['ok'=>false,'error'=>'Invalid design ID.'],400);
$pdo=id3_db();
try{
 $s=$pdo->prepare('SELECT id,design_code,design_name,customer_name,customer_email,customer_phone,property_type,project_location,budget_range,preferred_contact_method,notes,current_revision_no FROM designs WHERE id=? AND designer_version=\'3d-v1\'');$s->execute([$id]);$d=$s->fetch();
 if(!$d)id3_json(['ok'=>false,'error'=>'Design not found.'],404);
 if(!$manager){$s=$pdo->prepare('SELECT COUNT(*) FROM design_assignments WHERE design_id=? AND assigned_to=?');$s->execute([$id,$staff['id']]);if(!(int)$s->fetchColumn())id3_json(['ok'=>false,'error'=>'This design is not assigned to you.'],403);}
 $s=$pdo->prepare('SELECT scene_json,revision_no FROM designer_revisions WHERE design_id=? ORDER BY revision_no DESC LIMIT 1');$s->execute([$id]);$r=$s->fetch();if(!$r)id3_json(['ok'=>false,'error'=>'No 3D scene is stored for this design.'],404);
 id3_json(['ok'=>true,'design_code'=>$d['design_code'],'revision_no'=>$r['revision_no'],'scene'=>json_decode($r['scene_json'],true),'contact'=>['design_name'=>$d['design_name'],'customer_name'=>$d['customer_name'],'customer_email'=>$d['customer_email'],'customer_phone'=>$d['customer_phone'],'property_type'=>$d['property_type'],'project_location'=>$d['project_location'],'budget_range'=>$d['budget_range'],'preferred_contact_method'=>$d['preferred_contact_method'],'notes'=>$d['notes']]]);
}catch(Throwable $e){error_log('IDEARE staff designer scene: '.$e->getMessage());id3_json(['ok'=>false,'error'=>'Unable to load staff preview.'],503);}
