<?php
require_once __DIR__.'/../../includes/staff/feature-tools.php';
require_once __DIR__.'/../../includes/staff/quotation-pricing.php';
require_once __DIR__.'/../../includes/staff/quotation-workflow.php';
require_login();
verify_csrf();

if(!can('quotation.approve') && !can('quotations.approve')){
    render_access_denied('Approvals restricted','Your account does not have approval permission.');
}

$pdo=staff_db();
feature_table($pdo,'approval_requests');
feature_table($pdo,'quotation_version_events');
$staff=current_staff();

if($_SERVER['REQUEST_METHOD']==='POST'){
    $requestId=(int)($_POST['id']??0);
    $decision=(string)($_POST['decision']??'');
    $notes=trim((string)($_POST['notes']??''));

    try{
        if(!in_array($decision,['approved','rejected'],true)) throw new RuntimeException('Choose approve or reject.');
        if($decision==='rejected' && $notes==='') throw new RuntimeException('Add a decision note when rejecting an approval request.');

        $stmt=$pdo->prepare('SELECT * FROM approval_requests WHERE id=? LIMIT 1');
        $stmt->execute([$requestId]);
        $request=$stmt->fetch(PDO::FETCH_ASSOC);
        if(!$request) throw new RuntimeException('Approval request not found.');
        if($request['status']!=='pending') throw new RuntimeException('This approval request has already been resolved.');
        $isOwner=($staff['role_slug']??'')==='owner';
        if($request['entity_type']==='quotation'){
            if(!empty($request['assigned_approver']) && (int)$request['assigned_approver']!==(int)$staff['id'] && !$isOwner){
                throw new RuntimeException('This quotation approval is assigned to another approver.');
            }
            if((int)$request['requested_by']===(int)$staff['id'] && !$isOwner){
                throw new RuntimeException('You cannot approve your own quotation exception. Another approver must decide it.');
            }
        }

        $pdo->beginTransaction();
        $pdo->prepare('UPDATE approval_requests SET status=?,assigned_approver=?,decided_at=NOW() WHERE id=?')
            ->execute([$decision,(int)$staff['id'],$requestId]);
        $pdo->prepare('INSERT INTO approval_actions(approval_request_id,staff_id,action,comment) VALUES(?,?,?,?)')
            ->execute([$requestId,(int)$staff['id'],$decision,$notes?:null]);

        $workflowState=null;
        if($request['entity_type']==='quotation' && !empty($request['quotation_version_id'])){
            $versionId=(int)$request['quotation_version_id'];
            if($decision==='rejected'){
                $other=$pdo->prepare("SELECT id FROM approval_requests WHERE quotation_version_id=? AND id<>? AND status='pending'");
                $other->execute([$versionId,$requestId]);
                $cancelIds=array_map('intval',$other->fetchAll(PDO::FETCH_COLUMN));
                if($cancelIds){
                    $cancel=$pdo->prepare("UPDATE approval_requests SET status='cancelled',decided_at=NOW() WHERE id=? AND status='pending'");
                    $action=$pdo->prepare("INSERT INTO approval_actions(approval_request_id,staff_id,action,comment) VALUES(?,?,'cancelled',?)");
                    foreach($cancelIds as $cancelId){
                        $cancel->execute([$cancelId]);
                        $action->execute([$cancelId,(int)$staff['id'],'Cancelled because another requirement rejected this quotation revision.']);
                    }
                }
            }
            $workflowState=quotation_workflow_refresh_approval_state($pdo,$versionId,(int)$staff['id'],$notes?:null);
        }

        $pdo->commit();
        try{
            notify_staff(
                $pdo,
                (int)$request['requested_by'],
                'Approval '.($decision==='approved'?'approved':'rejected'),
                'Approval #'.$requestId.' was '.$decision.($notes?' · '.$notes:''),
                $decision==='approved'?'success':'warning',
                $request['entity_type'],
                (int)$request['entity_id']
            );
        }catch(Throwable $notificationError){
            error_log('Approval notification failed: '.$notificationError->getMessage());
        }
        try{
            log_activity('approval.'.$decision,'approval_request',(string)$requestId,'Approval request '.$decision.($workflowState?' · quotation revision '.$workflowState:''));
        }catch(Throwable $logError){
            error_log('Approval activity log failed: '.$logError->getMessage());
        }
        flash('success','Approval decision saved.'.($workflowState?' Quotation revision is now '.str_replace('_',' ',$workflowState).'.':''));
    }catch(Throwable $e){
        if($pdo->inTransaction()) $pdo->rollBack();
        flash('error','Could not save approval decision: '.$e->getMessage());
    }
    staff_redirect('staff/admin/approvals.php');
}

$statusFilter=(string)($_GET['status']??'pending');
if(!in_array($statusFilter,['pending','approved','rejected','cancelled','all'],true)) $statusFilter='pending';
$where=$statusFilter==='all'?'1=1':'a.status='.$pdo->quote($statusFilter);

$rows=db_rows($pdo,"SELECT a.*,r.rule_code,r.name rule_name,
    CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) requester,
    CONCAT(ap.first_name,' ',COALESCE(ap.last_name,'')) assigned_approver_name,
    q.quotation_code,q.customer_name,q.final_total,q.current_version_no,
    qv.version_no quotation_version_no,qv.status quotation_version_status
    FROM approval_requests a
    LEFT JOIN quotation_approval_rules r ON r.id=a.approval_rule_id
    LEFT JOIN staff s ON s.id=a.requested_by
    LEFT JOIN staff ap ON ap.id=a.assigned_approver
    LEFT JOIN quotations q ON a.entity_type='quotation' AND q.id=a.entity_id
    LEFT JOIN quotation_versions qv ON qv.id=a.quotation_version_id
    WHERE $where
    ORDER BY FIELD(a.status,'pending','rejected','approved','cancelled'),a.created_at DESC,a.id DESC
    LIMIT 300");

$counts=$pdo->query("SELECT
    SUM(status='pending') pending_count,
    SUM(status='approved') approved_count,
    SUM(status='rejected') rejected_count,
    SUM(status='cancelled') cancelled_count
    FROM approval_requests")->fetch(PDO::FETCH_ASSOC)?:[];

$pageTitle='Approvals';
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content approval-workflow-page">
<div class="page-head">
    <div><p class="eyebrow">Management · Stage 4</p><h1>Approval Workflow</h1><p class="muted">Approve the exact frozen quotation revision that triggered each commercial control.</p></div>
    <div class="actions">
        <?php if(can('quotation.manage_approval_rules') || can('quotation.settings')): ?><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-approval-rules.php')) ?>">Approval rules</a><?php endif; ?>
        <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Quotation Centre</a>
    </div>
</div>

<section class="stat-grid">
    <article class="stat"><span>Pending</span><strong><?= (int)($counts['pending_count']??0) ?></strong></article>
    <article class="stat"><span>Approved</span><strong><?= (int)($counts['approved_count']??0) ?></strong></article>
    <article class="stat"><span>Rejected</span><strong><?= (int)($counts['rejected_count']??0) ?></strong></article>
    <article class="stat"><span>Cancelled</span><strong><?= (int)($counts['cancelled_count']??0) ?></strong></article>
</section>

<section class="staff-panel">
    <form method="get" class="inline-form">
        <label>Status<select name="status"><?php foreach(['pending'=>'Pending','approved'=>'Approved','rejected'=>'Rejected','cancelled'=>'Cancelled','all'=>'All requests'] as $key=>$label): ?><option value="<?= h($key) ?>" <?= $statusFilter===$key?'selected':'' ?>><?= h($label) ?></option><?php endforeach; ?></select></label>
        <button class="btn">Filter</button>
    </form>
</section>

<section class="staff-panel table-panel">
<table>
<thead><tr><th>Request</th><th>Quotation / entity</th><th>Control triggered</th><th>Requested by</th><th>Status</th><th>Decision</th></tr></thead>
<tbody>
<?php if(!$rows): ?><tr><td colspan="6"><p class="muted">No approval requests match this filter.</p></td></tr><?php endif; ?>
<?php foreach($rows as $r): ?>
<tr>
    <td><b>Approval #<?= (int)$r['id'] ?></b><small><?= h(date('j M Y, g:i A',strtotime($r['created_at']))) ?></small><?php if($r['assigned_approver_name']): ?><small>Assigned: <?= h(trim($r['assigned_approver_name'])) ?></small><?php endif; ?></td>
    <td>
        <?php if($r['entity_type']==='quotation' && $r['quotation_code']): ?>
            <a href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.(int)$r['entity_id'])) ?>"><b><?= h($r['quotation_code']) ?></b></a>
            <small><?= h($r['customer_name']?:'Customer') ?> · <?= money($r['final_total']) ?></small>
            <?php if($r['quotation_version_id']): ?><a href="<?= h(ideare_root_url('staff/pages/quotation-version-view.php?id='.(int)$r['quotation_version_id'])) ?>"><small>Frozen revision v<?= (int)$r['quotation_version_no'] ?> · <?= h(str_replace('_',' ',$r['quotation_version_status']?:'')) ?></small></a><?php endif; ?>
        <?php else: ?>
            <b><?= h(ucwords(str_replace('_',' ',$r['entity_type']))) ?> #<?= (int)$r['entity_id'] ?></b>
        <?php endif; ?>
    </td>
    <td><b><?= h($r['rule_name']?:ucwords(str_replace('_',' ',$r['request_type']))) ?></b><small><?= h($r['reason']?:'Controlled action requires approval.') ?></small><?php if($r['requested_value']!==null): ?><small>Trigger value: <?= is_numeric($r['requested_value'])?number_format((float)$r['requested_value'],2):h($r['requested_value']) ?></small><?php endif; ?></td>
    <td><?= h(trim($r['requester'])?:'—') ?></td>
    <td><span class="pill <?= h($r['status']) ?>"><?= h($r['status']) ?></span><?php if($r['decided_at']): ?><small><?= h(date('j M Y, g:i A',strtotime($r['decided_at']))) ?></small><?php endif; ?></td>
    <td>
        <?php if($r['status']==='pending'): ?>
        <form method="post" class="decision-form"><?= csrf_field() ?><input type="hidden" name="id" value="<?= (int)$r['id'] ?>"><input name="notes" placeholder="Decision note"><button class="btn approve" name="decision" value="approved">Approve</button><button class="btn danger" name="decision" value="rejected">Reject</button></form>
        <?php else: ?><span class="muted">Resolved</span><?php endif; ?>
    </td>
</tr>
<?php endforeach; ?>
</tbody>
</table>
</section>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
