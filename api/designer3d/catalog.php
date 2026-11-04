<?php
require __DIR__.'/common.php';
$pdo=id3_db();
try {
  $tables=[
    'categories'=>'SELECT id,name,slug FROM cabinet_categories WHERE is_active=1 AND slug<>\'demo-cabinets\' ORDER BY sort_order',
    'templates'=>'SELECT id,category_id,name,slug,description,default_width,default_height,default_depth,min_width,max_width,min_height,max_height,min_depth,max_depth,geometry_type,allow_custom_dimensions,base_price FROM cabinet_templates WHERE is_active=1 AND slug<>\'demo-base-cabinet\' ORDER BY sort_order',
    'doors'=>'SELECT id,name FROM door_styles WHERE is_active=1 ORDER BY sort_order',
    'handles'=>'SELECT id,name FROM handles WHERE is_active=1 ORDER BY sort_order',
    'finishes'=>'SELECT id,name FROM finishes WHERE is_active=1 ORDER BY sort_order'
  ];
  $data=[]; foreach($tables as $k=>$sql) $data[$k]=$pdo->query($sql)->fetchAll();
  id3_json(['ok'=>true]+$data);
}catch(Throwable $e){ error_log('IDEARE designer3d catalog: '.$e->getMessage()); id3_json(['ok'=>false,'error'=>'Please import database/01_3d_configurator_schema.sql before using the 3D designer.'],503); }
