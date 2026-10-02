<?php
require_once __DIR__.'/../includes/staff/auth.php';
if(current_staff()) log_activity('staff.logout','staff',(string)current_staff()['id'],'Staff logged out.');
$_SESSION=[];
session_destroy();
staff_redirect('auth/login.php');
