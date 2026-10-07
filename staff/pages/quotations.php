<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('quotation.view');

$query=trim((string)($_SERVER['QUERY_STRING']??''));
staff_redirect('staff/pages/quotation-centre.php'.($query!==''?'?'.$query:''));
