<?php
require_once __DIR__.'/../config/databases.php';
if(!in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)){http_response_code(403);exit('Localhost only.');}
$emails=['owner@ideare.local','manager@ideare.local','supervisor@ideare.local','designer@ideare.local','daniel@ideare.local','nadia@ideare.local','hakim@ideare.local','rizal@ideare.local','mei@ideare.local'];
$hash=password_hash('password123',PASSWORD_DEFAULT);$stmt=staff_db()->prepare("UPDATE staff SET password_hash=?,must_change_password=0,failed_login_attempts=0,locked_until=NULL WHERE email=?");$count=0;foreach($emails as $email){$stmt->execute([$hash,$email]);$count+=$stmt->rowCount();}
?>
<!doctype html><html><head><meta charset="utf-8"><title>Demo Passwords</title></head><body style="font-family:system-ui;background:#f5f2ec;padding:50px"><main style="max-width:650px;margin:auto;background:white;padding:30px;border-radius:18px"><h1>Demo passwords configured</h1><p><?= (int)$count ?> accounts updated.</p><p>Password: <code>password123</code></p><p><a href="../auth/login.php">Go to login</a></p></main></body></html>
