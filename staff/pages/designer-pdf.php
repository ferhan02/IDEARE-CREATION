<?php
require_once __DIR__.'/../../includes/staff/auth.php';require_login();$st=current_staff();$manager=ideare_is_owner_or_manager($st);
if(!$manager&&!can('design.view_assigned'))render_access_denied();
$pdo=staff_db();$id=(int)($_GET['document_id']??0);
$s=$pdo->prepare('SELECT doc.*,d.design_code FROM designer_documents doc JOIN designs d ON d.id=doc.design_id WHERE doc.id=?');$s->execute([$id]);$doc=$s->fetch();
if(!$doc){http_response_code(404);exit('PDF not found.');}
if(!$manager){$s=$pdo->prepare('SELECT COUNT(*) FROM design_assignments WHERE design_id=? AND assigned_to=?');$s->execute([$doc['design_id'],$st['id']]);if(!(int)$s->fetchColumn()){http_response_code(403);exit('Not assigned to this design.');}}
$base=realpath(__DIR__.'/../../private/designer-pdfs');$path=$base?realpath($base.'/'.basename($doc['storage_path'])):false;
if(!$base||!$path||!str_starts_with($path,$base.DIRECTORY_SEPARATOR)||!is_file($path)){http_response_code(404);exit('PDF file unavailable.');}
header('Content-Type: application/pdf');header('X-Content-Type-Options: nosniff');header('Content-Disposition: inline; filename="'.preg_replace('/[^A-Za-z0-9_.-]/','_', $doc['design_code']).'-concept.pdf"');header('Content-Length: '.filesize($path));readfile($path);exit;
