<?php
// Keep legacy bookmarks pointing to the single maintained customer configurator.
header('Location: designer/index.php'.(!empty($_SERVER['QUERY_STRING'])?'?'.$_SERVER['QUERY_STRING']:''), true, 302);
exit;
