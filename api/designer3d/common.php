<?php
declare(strict_types=1);
if (session_status() !== PHP_SESSION_ACTIVE) session_start();
require_once __DIR__.'/../../config/db.php';
function id3_json(array $out, int $status=200): never {
  http_response_code($status); header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store'); echo json_encode($out, JSON_INVALID_UTF8_SUBSTITUTE); exit;
}
function id3_db(): PDO { $pdo=db(); if(!$pdo) id3_json(['ok'=>false,'error'=>'Database unavailable. Check ideare_db and XAMPP.'],503); return $pdo; }
function id3_csrf(): void {
  $in=$_SERVER['HTTP_X_CSRF_TOKEN']??'';
  if(!is_string($in)||!hash_equals($_SESSION['id3_csrf']??'', $in)) id3_json(['ok'=>false,'error'=>'Session token expired. Reload the designer.'],419);
  $origin=$_SERVER['HTTP_ORIGIN']??''; $host=$_SERVER['HTTP_HOST']??'';
  if($origin && $host && parse_url($origin,PHP_URL_HOST)!==explode(':',$host)[0]) id3_json(['ok'=>false,'error'=>'Invalid request origin.'],403);
}
function id3_request(): array {
  if(($_SERVER['REQUEST_METHOD']??'')!=='POST') id3_json(['ok'=>false,'error'=>'POST required.'],405);
  id3_csrf();
  if((int)($_SERVER['CONTENT_LENGTH']??0)>2400000) id3_json(['ok'=>false,'error'=>'Design payload too large.'],413);
  $p=json_decode(file_get_contents('php://input'),true);
  if(!is_array($p)) id3_json(['ok'=>false,'error'=>'Invalid JSON.'],422);
  return $p;
}
function id3_str($v,int $max=255): string { return mb_substr(trim(is_scalar($v)?(string)$v:''),0,$max); }
function id3_num($v, float $low, float $high, string $field): float {
  if(!is_numeric($v)||!is_finite((float)$v)||(float)$v<$low||(float)$v>$high) id3_json(['ok'=>false,'error'=>"Invalid $field."],422);
  return round((float)$v,2);
}
function id3_token_owner(PDO $pdo, int $designId, string $token): bool {
  if(strlen($token)!==64||!ctype_xdigit($token))return false;
  $s=$pdo->prepare('SELECT token_hash FROM designer_access_tokens WHERE design_id=? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>NOW())');
  $s->execute([$designId]);$hash=hash('sha256',$token);
  foreach($s->fetchAll(PDO::FETCH_COLUMN) as $valid){if(hash_equals($valid,$hash))return true;}
  return false;
}
