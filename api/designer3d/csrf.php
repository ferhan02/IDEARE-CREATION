<?php
require __DIR__.'/common.php';
if(empty($_SESSION['id3_csrf'])) $_SESSION['id3_csrf']=bin2hex(random_bytes(32));
id3_json(['ok'=>true,'csrf'=>$_SESSION['id3_csrf']]);
