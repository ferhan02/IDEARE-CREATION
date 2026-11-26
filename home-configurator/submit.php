<?php
header('Content-Type: application/json');
function fail($message,$code=400){http_response_code($code);echo json_encode(['error'=>$message]);exit;}
if($_SERVER['REQUEST_METHOD']!=='POST')fail('POST required',405);
if((int)($_SERVER['CONTENT_LENGTH']??0)>500000)fail('Plan too large',413);
$raw=file_get_contents('php://input',false,null,0,500001);if(strlen($raw)>500000)fail('Plan too large',413);
$d=json_decode($raw,true);if(!is_array($d)||!is_array($d['contact']??null)||!is_array($d['plan']['floors']??null))fail('Invalid concept');
$c=$d['contact'];foreach(['name'=>120,'phone'=>50,'location'=>200] as $k=>$max){if(!is_string($c[$k]??null)||trim($c[$k])===''||strlen($c[$k])>$max)fail('Invalid contact details');}if(($c['consent']??'')!=='on')fail('Consent required');
// Store outside the web document root; set IDEARE_HOME_LEAD_DIR to a private writable folder in production.
$dir=getenv('IDEARE_HOME_LEAD_DIR')?:dirname(rtrim($_SERVER['DOCUMENT_ROOT'],'/\\')).DIRECTORY_SEPARATOR.'ideare-home-leads';
if(!is_dir($dir)&&!mkdir($dir,0700,true))fail('Lead storage unavailable',503);
$ref=bin2hex(random_bytes(12));$d['received_at']=gmdate('c');$d['reference']=$ref;
if(file_put_contents($dir.DIRECTORY_SEPARATOR.$ref.'.json',json_encode($d,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT),LOCK_EX)===false)fail('Unable to store concept',503);
echo json_encode(['reference'=>$ref]);
