<?php
header('Content-Type: application/json');
require __DIR__.'/../../config/databases.php';
$pdo=customer_db();
if(!$pdo){echo json_encode(['ok'=>false]);exit;}
try{
 echo json_encode([
  'ok'=>true,
  'templates'=>$pdo->query("SELECT * FROM cabinet_templates WHERE is_active=1 ORDER BY sort_order")->fetchAll(),
  'finishes'=>$pdo->query("SELECT * FROM finishes WHERE is_active=1 ORDER BY sort_order")->fetchAll(),
  'colors'=>$pdo->query("SELECT * FROM colors WHERE is_active=1 ORDER BY sort_order")->fetchAll(),
  'doors'=>$pdo->query("SELECT * FROM door_styles WHERE is_active=1 ORDER BY sort_order")->fetchAll(),
  'handles'=>$pdo->query("SELECT * FROM handles WHERE is_active=1 ORDER BY sort_order")->fetchAll()
 ]);
}catch(Throwable $e){echo json_encode(['ok'=>false]);}
