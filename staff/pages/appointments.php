<?php
require_once __DIR__.'/../../includes/staff/feature-tools.php';
require_once __DIR__.'/../../includes/customer/appointment-functions.php';
require_permission('appointments.view');
verify_csrf();
$pdo=staff_db();
feature_table($pdo, 'customer_appointments');

if ($_SERVER['REQUEST_METHOD']==='POST') {
    if (fpost('action')==='update') {
        $statuses=['requested','confirmed','completed','cancelled','no_show'];
        $status=fpost('status');
        if (!in_array($status,$statuses,true)) {
            flash('error','Invalid appointment status.');
        } else {
            $confirmed=fpost('confirmed_start');
            $confirmed=$confirmed!=='' ? str_replace('T',' ',$confirmed).':00' : null;
            $pdo->prepare('UPDATE customer_appointments SET status=?,confirmed_start=?,assigned_to=?,staff_notes=? WHERE id=?')
                ->execute([$status,$confirmed,fint('assigned_to'),fpost('staff_notes')?:null,fint('id')]);
            flash('success','Appointment updated.');
        }
    }
    staff_redirect('staff/pages/appointments.php');
}

$staffs=staff_options($pdo);
$rows=db_rows($pdo,'SELECT a.*,CONCAT(s.first_name," ",COALESCE(s.last_name,"")) assigned_name FROM customer_appointments a LEFT JOIN staff s ON s.id=a.assigned_to ORDER BY COALESCE(a.confirmed_start,a.requested_start) DESC');
$detailsByAppointment=[];
$filesByAppointment=[];
if (db_table_exists($pdo,'customer_appointment_details')) {
    foreach (db_rows($pdo,'SELECT * FROM customer_appointment_details') as $d) {
        $detailsByAppointment[(int)$d['appointment_id']]=$d;
    }
}
if (db_table_exists($pdo,'customer_appointment_attachments')) {
    foreach (db_rows($pdo,'SELECT id,appointment_id,file_name,file_size FROM customer_appointment_attachments ORDER BY id') as $attachment) {
        $filesByAppointment[(int)$attachment['appointment_id']][]=$attachment;
    }
}
$types=booking_options();
$properties=booking_property_types();
$stages=booking_stages();
$budgets=booking_budgets();
$methods=booking_methods();
$pageTitle='Customer Appointments';
require __DIR__.'/../../includes/staff/header.php';
?>
<link rel="stylesheet" href="<?=h(ideare_root_url('assets/css/booking-staff.css'))?>">
<?php module_head('Customers','Appointments','Review enquiries, design consultations, measurements and showroom requests.');?>
<section class="staff-panel table-panel booking-staff-list">
  <table>
    <thead><tr><th>Customer</th><th>Project & appointment</th><th>Requested</th><th>Status</th><th>Assignment / confirmation</th></tr></thead>
    <tbody>
    <?php foreach($rows as $r):
        $id=(int)$r['id']; $d=$detailsByAppointment[$id]??null; $files=$filesByAppointment[$id]??[];
    ?>
      <tr>
        <td><strong><?=h($r['customer_name'])?></strong><small><?=h($r['customer_phone']?:$r['customer_email'])?></small><small class="booking-ref"><?=h($r['appointment_code'])?></small></td>
        <td>
          <strong><?=h($d ? ($types[$d['project_type']]??ucwords(str_replace('_',' ',$d['project_type']))) : ucwords(str_replace('_',' ',$r['appointment_type'])))?></strong>
          <small><?=h(str_replace('_',' ',$r['appointment_type']))?><?=($d && $d['consultation_method'])?' · '.h($methods[$d['consultation_method']]??$d['consultation_method']):''?></small>
          <details class="booking-staff-details">
            <summary>View request details<?=count($files)?' · '.count($files).' files':''?></summary>
            <div class="booking-staff-detail-grid">
              <?php if($d): ?>
                <div><span>Property</span><b><?=h($properties[$d['property_type']]??$d['property_type'])?></b></div>
                <div><span>Stage</span><b><?=h($stages[$d['project_stage']]??($d['project_stage']?:'Not provided'))?></b></div>
                <div><span>Project focus</span><b><?=h($d['project_focus']?:'Not provided')?></b></div>
                <div><span>Approximate size</span><b><?=h($d['project_size']?:'Not provided')?></b></div>
                <div><span>Budget (optional)</span><b><?=h($budgets[$d['budget_range']]??($d['budget_range']?:'Not provided'))?></b></div>
                <div><span>Project area</span><b><?=h($d['project_location']?:'Not provided')?></b></div>
                <div><span>Alternative time</span><b><?=h($d['alternative_start']?date('j M Y, g:i A',strtotime($d['alternative_start'])):'Not provided')?></b></div>
                <div><span>Preferred contact</span><b><?=h(ucfirst($d['preferred_contact']?:'Not provided'))?></b></div>
              <?php endif; ?>
              <div><span>Meeting location</span><b><?=h($r['location']?:'Not provided')?></b></div>
              <div><span>Phone</span><b><?=h($r['customer_phone']?:'Not provided')?></b></div>
              <div><span>Email</span><b><?=h($r['customer_email']?:'Not provided')?></b></div>
            </div>
            <?php if($r['customer_notes']): ?><div class="booking-staff-message"><span>Customer notes</span><p><?=nl2br(h($r['customer_notes']))?></p></div><?php endif; ?>
            <?php if($files): ?><div class="booking-staff-files"><span>Private attachments</span><?php foreach($files as $f): ?><a href="<?=h(ideare_root_url('staff/pages/appointment-file.php?id='.(int)$f['id']))?>"><?=h($f['file_name'])?> <small>(<?=h(number_format((int)$f['file_size']/1048576,2))?> MB)</small></a><?php endforeach; ?></div><?php endif; ?>
          </details>
        </td>
        <td><?=h(date('j M Y, g:i A',strtotime($r['requested_start'])))?></td>
        <td><span class="pill <?=h($r['status'])?>"><?=h(ucwords(str_replace('_',' ',$r['status'])))?></span></td>
        <td>
          <form method="post" class="toolbar booking-staff-form">
            <?=csrf_field()?><input type="hidden" name="action" value="update"><input type="hidden" name="id" value="<?=$id?>">
            <select name="status" aria-label="Appointment status">
              <?php foreach(['requested','confirmed','completed','cancelled','no_show'] as $s): ?><option value="<?=h($s)?>" <?=$r['status']===$s?'selected':''?>><?=h(ucwords(str_replace('_',' ',$s)))?></option><?php endforeach; ?>
            </select>
            <input type="datetime-local" aria-label="Confirmed appointment time" name="confirmed_start" value="<?=h($r['confirmed_start']?date('Y-m-d\TH:i',strtotime($r['confirmed_start'])):'')?>">
            <select name="assigned_to" aria-label="Assigned staff member"><option value="">Unassigned</option><?php foreach($staffs as $s): ?><option value="<?=$s['id']?>" <?=$r['assigned_to']==$s['id']?'selected':''?>><?=hopt($s['first_name'],$s['last_name'])?></option><?php endforeach; ?></select>
            <input name="staff_notes" aria-label="Internal notes" value="<?=h($r['staff_notes']?:'')?>" placeholder="Internal notes">
            <button class="btn" type="submit">Save</button>
          </form>
        </td>
      </tr>
    <?php endforeach; ?>
    <?php if(!$rows): ?><tr><td colspan="5" class="booking-staff-empty">No appointment requests have been received yet.</td></tr><?php endif; ?>
    </tbody>
  </table>
</section>
<?php module_end();require __DIR__.'/../../includes/staff/footer.php'; ?>
