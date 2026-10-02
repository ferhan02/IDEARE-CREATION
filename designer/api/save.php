<?php
header('Content-Type: application/json');
require __DIR__.'/../../config/databases.php';
$p=json_decode(file_get_contents('php://input'),true);
if(!$p||empty($p['items'])){http_response_code(422);echo json_encode(['ok'=>false]);exit;}
$pdo=customer_db();
if(!$pdo){echo json_encode(['ok'=>false,'local'=>true]);exit;}
try{
 $pdo->beginTransaction();
 $code='IDEARE-D'.date('ymdHis');
 $s=$pdo->prepare("INSERT INTO designs(design_code,design_name,customer_name,customer_email,customer_phone,room_type,notes,total_width,estimated_price,status) VALUES(?,?,?,?,?,?,?,?,?,'saved')");
 $s->execute([$code,$p['design_name'],$p['customer_name']?:null,$p['customer_email']?:null,$p['customer_phone']?:null,$p['room_type'],$p['notes']?:null,$p['total_width'],$p['estimated_price']]);
 $did=$pdo->lastInsertId();
 $i=$pdo->prepare("INSERT INTO design_items(design_id,cabinet_template_id,finish_id,color_id,door_style_id,handle_id,position_order,width,height,depth,quantity,item_price) VALUES(?,?,?,?,?,?,?,?,?,?,1,?)");
 $o=$pdo->prepare("INSERT INTO design_item_options(design_item_id,option_name,option_value,price_modifier) VALUES(?,?,?,?)");
 foreach($p['items'] as $n=>$x){
   $i->execute([$did,$x['template_id'],$x['finish_id'],$x['color_id'],$x['door_style_id'],$x['handle_id'],$n+1,$x['width'],$x['height'],$x['depth'],$x['price']]);
   $iid=$pdo->lastInsertId();
   $o->execute([$iid,'Shelf Count',(string)$x['shelves'],0]);
   $o->execute([$iid,'Soft Close',$x['soft_close']?'Yes':'No',$x['soft_close']?30:0]);
 }
 $pdo->commit();echo json_encode(['ok'=>true,'design_code'=>$code,'design_id'=>$did]);
}catch(Throwable $e){
 if($pdo&&$pdo->inTransaction())$pdo->rollBack();
 echo json_encode(['ok'=>false]);
}
