<?php
require_once __DIR__.'/../../includes/staff/feature-tools.php';
require_permission('appointments.view');
$pdo=staff_db();
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
if (!$id || !db_table_exists($pdo,'customer_appointment_attachments')) {
    http_response_code(404); exit('Attachment not found.');
}
$q=$pdo->prepare('SELECT a.stored_name,a.file_name,a.file_size FROM customer_appointment_attachments a INNER JOIN customer_appointments c ON c.id=a.appointment_id WHERE a.id=? LIMIT 1');
$q->execute([$id]);
$row=$q->fetch(PDO::FETCH_ASSOC);
if (!$row) { http_response_code(404); exit('Attachment not found.'); }
$stored=(string)$row['stored_name'];
if (!preg_match('/^[a-f0-9]{40}\.(?:jpg|jpeg|png|webp|pdf)$/D',$stored)) {
    http_response_code(404); exit('Attachment not found.');
}
$path=dirname(__DIR__,2).'/uploads/appointments/'.$stored;
if (!is_file($path) || !is_readable($path)) { http_response_code(404); exit('Attachment not found.'); }
$name=trim(str_replace(["\r","\n",'"'], '',(string)$row['file_name']));
if ($name==='') $name='attachment';
$name=basename(str_replace('\\','/',$name));
while (ob_get_level()) ob_end_clean();
header('Content-Type: application/octet-stream');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store, max-age=0');
header('Content-Disposition: attachment; filename="file"; filename*=UTF-8\'\''.rawurlencode($name));
header('Content-Length: '.filesize($path));
readfile($path);
exit;
