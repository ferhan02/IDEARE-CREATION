<?php
require __DIR__.'/common.php';
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')id3_json(['ok'=>false,'error'=>'POST required.'],405);
id3_csrf();
$code=id3_str($_POST['design_code']??'',50);$token=id3_str($_POST['edit_token']??'',64);
$pdo=id3_db();$s=$pdo->prepare('SELECT id,current_revision_no FROM designs WHERE design_code=? LIMIT 1');$s->execute([$code]);$d=$s->fetch();
if(!$d||!id3_token_owner($pdo,(int)$d['id'],$token))id3_json(['ok'=>false,'error'=>'No permission to attach PDF.'],403);
$f=$_FILES['pdf']??null;
if(!$f||$f['error']!==UPLOAD_ERR_OK||$f['size']<20||$f['size']>8000000)id3_json(['ok'=>false,'error'=>'PDF must be under 8 MB.'],422);
$fh=fopen($f['tmp_name'],'rb');$sig=fread($fh,5);fclose($fh);
if($sig!=='%PDF-')id3_json(['ok'=>false,'error'=>'Invalid PDF format.'],422);
$dir=__DIR__.'/../../private/designer-pdfs';
if(!is_dir($dir)&&!mkdir($dir,0700,true))id3_json(['ok'=>false,'error'=>'Storage directory unavailable.'],503);
file_put_contents($dir.'/.htaccess',"Require all denied\nDeny from all\n",LOCK_EX);
$name='design-'.(int)$d['id'].'-'.bin2hex(random_bytes(8)).'.pdf';
if(!move_uploaded_file($f['tmp_name'],$dir.'/'.$name))id3_json(['ok'=>false,'error'=>'PDF upload failed.'],503);
$relative='private/designer-pdfs/'.$name;
try{$s=$pdo->prepare('INSERT INTO designer_documents (design_id,revision_no,file_name,storage_path,mime_type,file_size) VALUES (?,?,?,?,\'application/pdf\',?)');$s->execute([$d['id'],$d['current_revision_no'],$code.'-concept.pdf',$relative,$f['size']]);id3_json(['ok'=>true]);}
catch(Throwable $e){@unlink($dir.'/'.$name);error_log('IDEARE designer PDF: '.$e->getMessage());id3_json(['ok'=>false,'error'=>'PDF attachment could not be recorded.'],503);}
