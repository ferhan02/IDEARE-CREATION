<?php
require __DIR__.'/common.php';
$p=id3_request();
$scene=$p['scene']??null; $info=$p['contact']??null;
if(!is_array($scene)||!is_array($info))id3_json(['ok'=>false,'error'=>'Incomplete design data.'],422);
if(count($scene['cabinets']??[])===0 ||count($scene['cabinets']??[])>100)id3_json(['ok'=>false,'error'=>'Please add between 1 and 100 cabinets.'],422);
$name=id3_str($info['customer_name']??'',150);$phone=id3_str($info['customer_phone']??'',50);$email=id3_str($info['customer_email']??'',180);
if(mb_strlen($name)<2||mb_strlen($phone)<7||!filter_var($email,FILTER_VALIDATE_EMAIL))id3_json(['ok'=>false,'error'=>'Please enter a valid name, phone and email.'],422);
if(empty($info['consent']))id3_json(['ok'=>false,'error'=>'Consent is required to save.'],422);
$mode=$p['mode']??'save';if(!in_array($mode,['save','submit'],true))id3_json(['ok'=>false,'error'=>'Invalid save mode.'],422);
$room=$scene['room']??[];
$w=id3_num($room['width']??null,1200,20000,'room width');$d=id3_num($room['depth']??null,1200,20000,'room length');$height=id3_num($room['height']??null,1800,8000,'ceiling height');
$allowedShapes=['rectangle','notch','angled','open','l_open','u_open'];if(!in_array($room['shape']??'', $allowedShapes,true))id3_json(['ok'=>false,'error'=>'Invalid room shape.'],422);
$pdo=id3_db();$now=time();
if(!isset($_SESSION['id3_recent']))$_SESSION['id3_recent']=[];
$_SESSION['id3_recent']=array_values(array_filter($_SESSION['id3_recent'],fn($t)=>$t>$now-60));
if(count($_SESSION['id3_recent'])>=12)id3_json(['ok'=>false,'error'=>'Too many saves. Try again shortly.'],429);
$_SESSION['id3_recent'][]=$now;
$code=id3_str($p['design_code']??'',50);$existing=null;
try {
 $pdo->beginTransaction();
 if($code){
   $q=$pdo->prepare('SELECT * FROM designs WHERE design_code=? FOR UPDATE');$q->execute([$code]);$existing=$q->fetch();
   if(!$existing||!id3_token_owner($pdo,(int)$existing['id'],id3_str($p['edit_token']??'',64)))throw new DomainException('Saved-design link is invalid or expired.');
 }
 $status=($mode==='submit'||($existing&&$existing['status']==='submitted'))?'submitted':'saved';
 if($existing){
   $did=(int)$existing['id'];$revision=(int)$existing['current_revision_no']+1;
   $s=$pdo->prepare('UPDATE designs SET design_name=?,customer_name=?,customer_email=?,customer_phone=?,room_type=?,property_type=?,project_location=?,budget_range=?,preferred_contact_method=?,notes=?,total_width=?,estimated_price=0,status=?,submitted_at=IF(?=\'submitted\',NOW(),submitted_at),staff_review_status=IF(?=\'submitted\',\'pending\',staff_review_status),current_revision_no=? WHERE id=?');
   $s->execute([id3_str($info['design_name']??'Untitled design',150),$name,$email,$phone,id3_str($scene['roomType']??'Kitchen',100),id3_str($info['property_type']??'',80),id3_str($info['project_location']??'',255),id3_str($info['budget_range']??'',80),id3_str($info['preferred_contact_method']??'whatsapp',30),id3_str($info['notes']??'',3000),0,$status,$status,$status,$revision,$did]);
   $pdo->prepare('DELETE FROM designer_validation_findings WHERE design_id=?')->execute([$did]);
   $pdo->prepare('DELETE FROM designer_rooms WHERE design_id=?')->execute([$did]);
   $pdo->prepare('DELETE FROM designer_shared_elements WHERE design_id=?')->execute([$did]);
   $pdo->prepare('DELETE FROM design_items WHERE design_id=?')->execute([$did]);
 }else{
   $revision=1;$code='IDR3D-'.date('ymd').'-'.strtoupper(bin2hex(random_bytes(4)));
   $s=$pdo->prepare('INSERT INTO designs (design_code,design_name,designer_version,customer_name,customer_email,customer_phone,room_type,property_type,project_location,budget_range,preferred_contact_method,notes,total_width,estimated_price,status,submitted_at,staff_review_status,current_revision_no) VALUES (?,?,\'3d-v1\',?,?,?,?,?,?,?,?,?,0,0,?,IF(?=\'submitted\',NOW(),NULL),?,1)');
   $s->execute([$code,id3_str($info['design_name']??'Untitled design',150),$name,$email,$phone,id3_str($scene['roomType']??'Kitchen',100),id3_str($info['property_type']??'',80),id3_str($info['project_location']??'',255),id3_str($info['budget_range']??'',80),id3_str($info['preferred_contact_method']??'whatsapp',30),id3_str($info['notes']??'',3000),$status,$status,$mode==='submit'?'pending':'not_requested']);
   $did=(int)$pdo->lastInsertId();
 }
 // Store ordered polygon as calculated/validated coordinates in millimetres.
 $vertices=$scene['vertices']??[];
 if(!is_array($vertices)||count($vertices)<3||count($vertices)>16)throw new DomainException('Room outline is invalid.');
 $cleanVertices=[];foreach($vertices as $v){if(!is_array($v))throw new DomainException('Room coordinate invalid.');$cleanVertices[]=['x'=>id3_num($v['x']??null,0,20000,'room vertex X'),'z'=>id3_num($v['z']??null,0,20000,'room vertex Z')];}
 $s=$pdo->prepare('INSERT INTO designer_rooms (design_id,room_name,shape_type,ceiling_height_mm,wall_polygon_json,room_metadata_json) VALUES (?,?,?,?,?,?)');
 $s->execute([$did,'Room 1',$room['shape'],$height,json_encode($cleanVertices),json_encode(['width'=>$w,'depth'=>$d,'roomType'=>$scene['roomType']??'Kitchen'])]);$roomId=(int)$pdo->lastInsertId();
 $f=$pdo->prepare('INSERT INTO designer_room_features (room_id,feature_uuid,feature_type,wall_index,pos_x_mm,pos_y_mm,pos_z_mm,width_mm,height_mm,depth_mm,properties_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
 foreach(array_slice((array)($scene['features']??[]),0,40) as $feature){
   $type=$feature['type']??'';if(!in_array($type,['door','window','outlet','plumbing'],true))continue;
   $wall=(int)($feature['wallIndex']??0);$wall=max(0,min(count($cleanVertices)-1,$wall));$offset=max(.05,min(.95,(float)($feature['offset']??.5)));$a=$cleanVertices[$wall];$b=$cleanVertices[($wall+1)%count($cleanVertices)];
   $fx=$a['x']+($b['x']-$a['x'])*$offset;$fz=$a['z']+($b['z']-$a['z'])*$offset;
   $f->execute([$roomId,id3_uuid(),$type,$wall,$fx,id3_num($feature['y']??0,0,8000,'feature y'),$fz,id3_num($feature['width']??150,10,5000,'feature width'),id3_num($feature['height']??100,10,5000,'feature height'),10,json_encode($feature)]);
 }
 $templateRows=$pdo->query('SELECT id,min_width,max_width,min_height,max_height,min_depth,max_depth FROM cabinet_templates WHERE is_active=1')->fetchAll();$validIds=[];foreach($templateRows as $row)$validIds[(int)$row['id']]=$row;
 $savedItemMap=[];
 $finding=$pdo->prepare('INSERT INTO designer_validation_findings (design_id,design_item_id,finding_code,severity,message,state,details_json) VALUES (?,?,?,?,?,\'open\',?)');
 $si=$pdo->prepare('INSERT INTO design_items (design_id,object_uuid,cabinet_template_id,position_order,pos_x_mm,pos_y_mm,pos_z_mm,rotation_y_deg,width,height,depth,carcass_thickness_mm,config_json,validation_state,quantity,item_price) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0)');
 $sc=$pdo->prepare('INSERT INTO designer_components (design_item_id,component_uuid,component_type,component_name,pos_x_mm,pos_y_mm,pos_z_mm,width_mm,height_mm,depth_mm,thickness_mm,is_adjustable,sort_order,properties_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 $sm=$pdo->prepare('INSERT INTO designer_material_selections (design_id,design_item_id,application,source_table,source_row_id,product_code_snapshot,product_name_snapshot,texture_path_snapshot) VALUES (?,?,?,?,?,?,?,?)');
 foreach($scene['cabinets'] as $n=>$c){
   if(!isset($validIds[(int)($c['templateId']??0)]))throw new DomainException('An inactive or unknown cabinet template was selected.');
   $cw=id3_num($c['width']??null,100,10000,'cabinet width');$ch=id3_num($c['height']??null,100,10000,'cabinet height');$cd=id3_num($c['depth']??null,100,10000,'cabinet depth');
   $th=id3_num($c['thickness']??18,10,50,'carcass thickness');$x=id3_num($c['x']??0,-20000,20000,'cabinet x');$z=id3_num($c['z']??0,-20000,20000,'cabinet z');
   $warning=(bool)($c['needsReview']??true);
   $si->execute([$did,id3_uuid(),(int)$c['templateId'],$n+1,$x,0,$z,id3_num($c['rotation']??0,-360,360,'rotation'),$cw,$ch,$cd,$th,json_encode($c),$warning?'review':'unchecked']);
   $iid=(int)$pdo->lastInsertId();
   if(!empty($c['uid'])&&is_string($c['uid']))$savedItemMap[$c['uid']]=$iid;
   $limits=$validIds[(int)$c['templateId']];
   foreach(['width'=>$cw,'height'=>$ch,'depth'=>$cd] as $field=>$value){
     $min=(float)$limits['min_'.$field];$max=(float)$limits['max_'.$field];
     if($value<$min||$value>$max)$finding->execute([$did,$iid,'outside_suggested_'.$field,'review',ucfirst($field).' '.$value.' mm is outside the suggested template band '.$min.'–'.$max.' mm. Staff measurement and construction review required.',json_encode(['entered'=>$value,'suggested_min'=>$min,'suggested_max'=>$max])]);
   }
   // Always record unresolved manufacturing verification; client cannot claim automatic approval.
   $finding->execute([$did,$iid,'workshop_verification_pending','review','Final structure, hardware selection, component clearances and site measurements must be verified by IDEARE staff.',json_encode(['template_id'=>(int)$c['templateId']])]);
   // Derived parametric component records; full editor state also retained in revisions.
   $parts=max(0,min(4,(int)($c['partitions']??0)));$shelves=max(0,min(8,(int)($c['shelves']??0)));$drawers=max(0,min(6,(int)($c['drawers']??0)));
   $effectiveHeight=max(100,$ch-(empty($c['plinth'])?0:(float)($c['plinthHeight']??100)));
   foreach([['Left side',$th,$effectiveHeight,$cd],['Right side',$th,$effectiveHeight,$cd],['Top panel',$cw,$th,$cd],['Bottom panel',$cw,$th,$cd],['Back panel',$cw,$effectiveHeight,$th]] as $k=>$panel){
     $sc->execute([$iid,id3_uuid(),'carcass_panel',$panel[0],0,0,0,$panel[1],$panel[2],$panel[3],$th,0,$k,json_encode(['construction'=>'provisional'])]);
   }
   for($j=0;$j<$parts;$j++)$sc->execute([$iid,id3_uuid(),'partition','Partition '.($j+1),($j+1)*$cw/($parts+1)-$cw/2,0,0,$th,$effectiveHeight-2*$th,$cd-2*$th,$th,0,$j,json_encode(['construction'=>'provisional'])]);
   $shelfY=(array)($c['shelfPositions']??[]);$bayCounts=(array)($c['bayShelves']??[]);
   for($bay=0;$bay<=$parts;$bay++){
     $bayShelves=max(0,min(8,(int)($bayCounts[$bay]??$shelves)));
     for($j=0;$j<$bayShelves;$j++){
       $y=$bayShelves===$shelves&&is_numeric($shelfY[$j]??null)?(float)$shelfY[$j]:($j+1)*($effectiveHeight-2*$th)/($bayShelves+1);
       $sc->execute([$iid,id3_uuid(),'shelf','Shelf '.($j+1).' Bay '.($bay+1),0,$y,0,($cw-($parts+2)*$th)/($parts+1),$th,$cd-2*$th,$th,1,$j,json_encode(['bay_index'=>$bay,'customizable'=>true])]);
     }
   }
   $frontType=$c['front']??'doors';
   if($frontType==='doors'){
     $doorCount=max(1,min(4,(int)($c['doorCount']??2)));
     for($j=0;$j<$doorCount;$j++)$sc->execute([$iid,id3_uuid(),'door','Door '.($j+1),0,0,0,$cw/$doorCount,$effectiveHeight,20,20,1,$j,json_encode(['opening'=>$c['opening']??'swing','doorStyle'=>$c['doorStyle']??null,'handle'=>$c['handle']??null])]);
   }
   for($j=0;$j<$drawers;$j++){
     $sc->execute([$iid,id3_uuid(),'drawer_box','Drawer '.($j+1),0,0,0,$cw-2*$th,null,$cd-2*$th,$th,1,$j,json_encode(['layout'=>$c['drawerLayout']??'equal','ratio'=>$c['drawerRatios'][$j]??null])]);
     if($frontType==='drawers')$sc->execute([$iid,id3_uuid(),'drawer_front','Drawer front '.($j+1),0,0,0,$cw,null,20,20,1,$j,json_encode(['layout'=>$c['drawerLayout']??'equal','ratio'=>$c['drawerRatios'][$j]??null])]);
   }
   $material=$c['material']??null;
   if(is_array($material)&&in_array($material['source']??'', ['topmix','dgtango'],true)&&!empty($material['id'])){
     $sm->execute([$did,$iid,'door',$material['source'],(int)$material['id'],id3_str($material['product_code']??'',100),id3_str($material['product_name']??'',255),id3_str($material['image']??'',500)]);
   }
 }
 // Store cross-cabinet continuous worktops, plinth runs and backsplashes.
 $es=$pdo->prepare('INSERT INTO designer_shared_elements (design_id,room_id,element_uuid,element_type,name,geometry_json,settings_json) VALUES (?,?,?,?,?,?,?)');
 $em=$pdo->prepare('INSERT INTO designer_shared_element_items (element_id,design_item_id) VALUES (?,?)');
 foreach(array_slice((array)($scene['shared']??[]),0,40) as $shared){
   $type=$shared['type']??'';if(!in_array($type,['worktop','plinth','backsplash'],true))continue;
   $links=array_values(array_unique(array_filter(array_map(fn($u)=>$savedItemMap[$u]??null,(array)($shared['cabinetUids']??[])))));
   if(count($links)<2)continue;
   $es->execute([$did,$roomId,id3_uuid(),$type,ucfirst($type).' run',json_encode(['cabinetUids'=>$shared['cabinetUids']??[]]),json_encode($shared)]);
   $sharedId=(int)$pdo->lastInsertId();foreach($links as $linkedItem)$em->execute([$sharedId,$linkedItem]);
 }
 $snapshot=json_encode($scene,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
 $sr=$pdo->prepare('INSERT INTO designer_revisions (design_id,revision_no,scene_json,change_summary,author_type) VALUES (?,?,?,?,\'customer\')');
 $sr->execute([$did,$revision,$snapshot,$mode==='submit'?'Customer submitted design':'Customer saved draft']);
 $newToken=null;
 if(!$existing){$newToken=bin2hex(random_bytes(32));$pdo->prepare('INSERT INTO designer_access_tokens (design_id,token_hash) VALUES (?,?)')->execute([$did,hash('sha256',$newToken)]);}
 $pdo->commit();
 id3_json(['ok'=>true,'design_id'=>$did,'design_code'=>$code,'edit_token'=>$newToken,'revision_no'=>$revision,'status'=>$status]);
}catch(DomainException $e){if($pdo->inTransaction())$pdo->rollBack();id3_json(['ok'=>false,'error'=>$e->getMessage()],422);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('IDEARE designer save: '.$e->getMessage());id3_json(['ok'=>false,'error'=>'Unable to save. Check the two SQL migrations have been imported and the database is writable.'],503);}
function id3_uuid(): string { $b=random_bytes(16);$b[6]=chr(ord($b[6])&0x0f|0x40);$b[8]=chr(ord($b[8])&0x3f|0x80);$h=bin2hex($b);return substr($h,0,8).'-'.substr($h,8,4).'-'.substr($h,12,4).'-'.substr($h,16,4).'-'.substr($h,20); }
