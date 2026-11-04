<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_login();
$staff=current_staff();$manager=ideare_is_owner_or_manager($staff);
if(!$manager&&!can('design.view_assigned'))render_access_denied('Design access required','Only assigned design staff or management may access submitted designs.');
$pdo=staff_db();$error='';$notice='';
if($_SERVER['REQUEST_METHOD']==='POST'){
 verify_csrf();$did=(int)($_POST['design_id']??0);
 $decision=(string)($_POST['decision']??'');$note=trim((string)($_POST['review_note']??''));
 if($did<=0||!in_array($decision,['note','needs_changes','approved','rejected'],true))$error='Invalid review action.';
 elseif(!$manager&&in_array($decision,['approved','rejected'],true))$error='Only management can approve or reject a design.';
 else{
   $check=$pdo->prepare("SELECT id,design_code FROM designs WHERE id=? AND designer_version='3d-v1' AND status='submitted'");$check->execute([$did]);$record=$check->fetch();
   if(!$record)$error='Submitted design not found.';
   elseif(!$manager){$assigned=$pdo->prepare('SELECT COUNT(*) FROM design_assignments WHERE design_id=? AND assigned_to=?');$assigned->execute([$did,$staff['id']]);if(!(int)$assigned->fetchColumn())$error='Not assigned to this design.';}
   if(!$error){try{
     $s=$pdo->prepare('SELECT id FROM designer_revisions WHERE design_id=? ORDER BY revision_no DESC LIMIT 1');$s->execute([$did]);$rev=$s->fetchColumn()?:null;
     $pdo->beginTransaction();$s=$pdo->prepare('INSERT INTO designer_staff_reviews (design_id,revision_id,reviewer_staff_id,decision,review_note) VALUES (?,?,?,?,?)');$s->execute([$did,$rev,$staff['id'],$decision,mb_substr($note,0,5000)]);
     if($decision!=='note'){$s=$pdo->prepare('UPDATE designs SET staff_review_status=? WHERE id=?');$s->execute([$decision,$did]);}
     $pdo->commit();$notice='Review saved for '.$record['design_code'];
   }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('IDEARE design review: '.$e->getMessage());$error='Unable to save review.';}}
 }
}
try{
 if($manager){$s=$pdo->query("SELECT d.*, (SELECT COUNT(*) FROM designer_validation_findings WHERE design_id=d.id AND state='open') AS findings_count FROM designs d WHERE d.designer_version='3d-v1' AND d.status='submitted' ORDER BY d.submitted_at DESC,d.id DESC LIMIT 100");}
 else{$s=$pdo->prepare("SELECT DISTINCT d.*, (SELECT COUNT(*) FROM designer_validation_findings WHERE design_id=d.id AND state='open') AS findings_count FROM designs d JOIN design_assignments a ON a.design_id=d.id WHERE d.designer_version='3d-v1' AND d.status='submitted' AND a.assigned_to=? ORDER BY d.submitted_at DESC,d.id DESC LIMIT 100");$s->execute([$staff['id']]);}
 $designs=$s->fetchAll();
}catch(Throwable $e){error_log('IDEARE designs listing: '.$e->getMessage());$designs=[];$error='Cannot load submitted designs. Check 3D database migration.';}
$pageTitle='3D Design Submissions';$pageStyles=['assets/css/designer-3d.css'];require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content"><div class="page-head"><div><p class="eyebrow">Design workflow</p><h1>3D design submissions</h1><p class="muted">Customer concepts awaiting workshop feasibility review. Not automatically approved for manufacturing.</p></div><a class="btn" href="<?=h(ideare_root_url('staff/pages/designs.php'))?>">Assigned designs</a></div>
<?php if($error):?><div class="flash error"><?=h($error)?></div><?php endif;?>
<?php if($notice):?><div class="flash success"><?=h($notice)?></div><?php endif;?>
<?php if(!$designs):?><section class="staff-panel"><p class="muted">No submitted 3D designs available to your account.</p></section><?php endif;?>
<div class="task-grid">
<?php foreach($designs as $d):?>
<article class="staff-panel task-card">
 <div class="rowtop"><span class="pill"><?=h($d['design_code'])?></span><span class="pill"><?=h(str_replace('_',' ',$d['staff_review_status']??'pending'))?></span></div>
 <h2><?=h($d['design_name']?:'Untitled design')?></h2>
 <p><b><?=h($d['customer_name']?:'Customer')?></b> · <?=h($d['room_type']?:'Kitchen')?></p>
 <p class="muted">Phone: <?=h($d['customer_phone']?:'—')?> · Email: <?=h($d['customer_email']?:'—')?></p>
 <p class="muted">Location: <?=h($d['project_location']?:'Not provided')?> · Budget: <?=h($d['budget_range']?:'Not provided')?></p>
 <p class="muted">Revision <?=h((string)$d['current_revision_no'])?> · Submitted <?=h($d['submitted_at']?:'—')?></p>
 <p class="muted"><?=h($d['notes']?:'')?></p>
 <div class="actions"><a class="btn primary" target="_blank" rel="noopener" href="<?=h(ideare_root_url('designer/index.php?staff_design='.(int)$d['id']))?>">Open 3D preview</a>
 <?php $q=$pdo->prepare('SELECT id FROM designer_documents WHERE design_id=? ORDER BY id DESC LIMIT 1');$q->execute([$d['id']]);$pdf=$q->fetchColumn();if($pdf):?><a class="btn" href="<?=h(ideare_root_url('staff/pages/designer-pdf.php?document_id='.(int)$pdf))?>">View PDF</a><?php endif;?></div>
 <form method="post" style="margin-top:14px;display:grid;gap:9px"><?=csrf_field()?><input type="hidden" name="design_id" value="<?=(int)$d['id']?>"><label style="font-size:12px">Review notes<textarea name="review_note" rows="3" maxlength="5000" placeholder="Construction concerns, suggested changes, follow-up notes..."></textarea></label><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn" name="decision" value="note">Add note</button><button class="btn" name="decision" value="needs_changes">Request changes</button><?php if($manager):?><button class="btn primary" name="decision" value="approved">Approve concept</button><button class="btn danger" name="decision" value="rejected">Reject</button><?php endif;?></div></form>
</article>
<?php endforeach;?>
</div></main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
