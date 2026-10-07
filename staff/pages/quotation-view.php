<?php
require_once __DIR__.'/../../includes/staff/operations.php';
require_once __DIR__.'/../../includes/staff/quotation-pricing.php';
require_once __DIR__.'/../../includes/staff/quotation-workflow.php';
require_permission('quotation.view');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();
$id=(int)($_GET['id']??$_POST['id']??0);
if(!$id) staff_redirect('staff/pages/quotation-centre.php');
if(!db_table_exists($pdo,'quotation_version_events')) staff_redirect('staff/pages/quotation-centre.php');

if($_SERVER['REQUEST_METHOD']==='POST'){
    $action=(string)($_POST['action']??'');
    try{
        if($action==='submit_approval'){
            if(!can('quotation.revise') && !can('quotation.create')){
                throw new RuntimeException('You do not have permission to submit quotation revisions.');
            }
            $summary=trim((string)($_POST['change_summary']??''));
            if($summary==='') $summary='Revision submitted for commercial review.';
            $pdo->beginTransaction();
            $result=quotation_workflow_submit($pdo,$id,(int)$staff['id'],$summary,can('quotation.approve'));
            $pdo->commit();
            if($result['status']==='pending_approval'){
                try{
                    $notify=$pdo->prepare("SELECT DISTINCT assigned_approver FROM approval_requests WHERE quotation_version_id=? AND status='pending' AND assigned_approver IS NOT NULL");
                    $notify->execute([(int)$result['version_id']]);
                    foreach($notify->fetchAll(PDO::FETCH_COLUMN) as $approverId){
                        notify_staff($pdo,(int)$approverId,'Quotation approval required','Quotation #'.$id.' revision v'.$result['version_no'].' is waiting for your approval.','warning','quotation',$id);
                    }
                }catch(Throwable $notificationError){
                    error_log('Quotation approval notification failed: '.$notificationError->getMessage());
                }
            }
            try{log_activity('quotation.workflow.submit','quotation',(string)$id,'Submitted quotation revision v'.$result['version_no'].' into workflow.');}catch(Throwable $logError){error_log('Quotation activity log failed: '.$logError->getMessage());}
            flash('success',$result['status']==='approved'
                ?'Revision v'.$result['version_no'].' was frozen and approved. It is ready to issue.'
                :'Revision v'.$result['version_no'].' was frozen and sent for '.(int)$result['requests'].' approval check'.((int)$result['requests']===1?'':'s').'.');
        }elseif($action==='start_revision'){
            if(!can('quotation.revise')) throw new RuntimeException('You do not have permission to start quotation revisions.');
            $pdo->beginTransaction();
            $newVersion=quotation_workflow_start_revision($pdo,$id,(int)$staff['id'],trim((string)($_POST['revision_note']??''))?:null);
            $pdo->commit();
            try{log_activity('quotation.revise.start','quotation',(string)$id,'Started working revision v'.$newVersion.'.');}catch(Throwable $logError){error_log('Quotation activity log failed: '.$logError->getMessage());}
            flash('success','Working revision v'.$newVersion.' started.');
            staff_redirect('staff/pages/quotation-revise.php?id='.$id);
        }elseif($action==='withdraw_approval'){
            if(!can('quotation.revise') && !can('quotation.approve')){
                throw new RuntimeException('You do not have permission to withdraw this approval workflow.');
            }
            $pdo->beginTransaction();
            $newVersion=quotation_workflow_withdraw_approval($pdo,$id,(int)$staff['id'],trim((string)($_POST['withdraw_note']??''))?:null);
            $pdo->commit();
            try{log_activity('quotation.workflow.withdraw','quotation',(string)$id,'Withdrew approval and started revision v'.$newVersion.'.');}catch(Throwable $logError){error_log('Quotation activity log failed: '.$logError->getMessage());}
            flash('success','Pending approval was withdrawn. Working revision v'.$newVersion.' is ready to edit.');
            staff_redirect('staff/pages/quotation-revise.php?id='.$id);
        }elseif($action==='issue'){
            if(!can('quotation.issue')) throw new RuntimeException('You do not have permission to issue quotations.');
            $versionId=(int)($_POST['version_id']??0);
            $pdo->beginTransaction();
            quotation_workflow_issue($pdo,$id,$versionId,(int)$staff['id'],trim((string)($_POST['issue_note']??''))?:null);
            $pdo->commit();
            try{log_activity('quotation.issue','quotation',(string)$id,'Issued quotation version #'.$versionId.'.');}catch(Throwable $logError){error_log('Quotation activity log failed: '.$logError->getMessage());}
            flash('success','Approved revision issued to the customer.');
        }elseif($action==='customer_decision'){
            if(!can('quotation.accept')) throw new RuntimeException('You do not have permission to record customer decisions.');
            $versionId=(int)($_POST['version_id']??0);
            $decision=(string)($_POST['decision']??'');
            $customerName=trim((string)($_POST['customer_name']??''));
            $method=(string)($_POST['decision_method']??'manual');
            $notes=trim((string)($_POST['decision_notes']??''))?:null;
            $pdo->beginTransaction();
            quotation_workflow_customer_decision($pdo,$id,$versionId,(int)$staff['id'],$decision,$customerName,$method,$notes);
            $pdo->commit();
            try{log_activity('quotation.customer_decision','quotation',(string)$id,'Customer decision recorded: '.$decision.'.');}catch(Throwable $logError){error_log('Quotation activity log failed: '.$logError->getMessage());}
            flash('success','Customer decision recorded against the issued revision.');
        }
    }catch(Throwable $e){
        if($pdo->inTransaction()) $pdo->rollBack();
        flash('error','Quotation workflow could not be updated: '.$e->getMessage());
    }
    staff_redirect('staff/pages/quotation-view.php?id='.$id);
}

$stmt=$pdo->prepare("SELECT q.*,CONCAT(c.first_name,' ',COALESCE(c.last_name,'')) creator_name,
    CONCAT(a.first_name,' ',COALESCE(a.last_name,'')) approver_name,
    CONCAT(sp.first_name,' ',COALESCE(sp.last_name,'')) salesperson_name,
    p.project_code linked_project_code,cus.customer_code linked_customer_code
    FROM quotations q
    LEFT JOIN staff c ON c.id=q.created_by
    LEFT JOIN staff a ON a.id=q.approved_by
    LEFT JOIN staff sp ON sp.id=COALESCE(q.salesperson_id,q.created_by)
    LEFT JOIN projects p ON p.id=q.project_id
    LEFT JOIN customers cus ON cus.id=q.customer_id
    WHERE q.id=? LIMIT 1");
$stmt->execute([$id]);
$q=$stmt->fetch(PDO::FETCH_ASSOC);
if(!$q){http_response_code(404);exit('Quotation not found.');}

$groupsStmt=$pdo->prepare('SELECT * FROM quotation_groups WHERE quotation_id=? ORDER BY sort_order,id');
$groupsStmt->execute([$id]);$groups=$groupsStmt->fetchAll(PDO::FETCH_ASSOC);
$sectionsStmt=$pdo->prepare('SELECT * FROM quotation_sections WHERE quotation_id=? ORDER BY sort_order,id');
$sectionsStmt->execute([$id]);$sections=$sectionsStmt->fetchAll(PDO::FETCH_ASSOC);
$itemsStmt=$pdo->prepare('SELECT qi.*,ri.rate_code,ri.name rate_name FROM quotation_items qi LEFT JOIN quotation_rate_items ri ON ri.id=qi.rate_book_item_id WHERE qi.quotation_id=? ORDER BY qi.sort_order,qi.id');
$itemsStmt->execute([$id]);$items=$itemsStmt->fetchAll(PDO::FETCH_ASSOC);
$chargeStmt=$pdo->prepare('SELECT * FROM quotation_charges WHERE quotation_id=? ORDER BY sort_order,id');
$chargeStmt->execute([$id]);$charges=$chargeStmt->fetchAll(PDO::FETCH_ASSOC);
$costStmt=$pdo->prepare('SELECT * FROM quotation_cost_components WHERE quotation_id=? ORDER BY cost_category,sort_order,id');
$costStmt->execute([$id]);$costComponents=$costStmt->fetchAll(PDO::FETCH_ASSOC);
$adjustStmt=$pdo->prepare('SELECT * FROM quotation_adjustments WHERE quotation_id=? ORDER BY sort_order,id');
$adjustStmt->execute([$id]);$adjustments=$adjustStmt->fetchAll(PDO::FETCH_ASSOC);
$historyStmt=$pdo->prepare("SELECT h.*,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) changed_by_name FROM quotation_status_history h LEFT JOIN staff s ON s.id=h.changed_by WHERE h.quotation_id=? ORDER BY h.created_at DESC");
$historyStmt->execute([$id]);$history=$historyStmt->fetchAll(PDO::FETCH_ASSOC);

$versionsStmt=$pdo->prepare("SELECT v.*,CONCAT(cb.first_name,' ',COALESCE(cb.last_name,'')) created_by_name,
    CONCAT(ab.first_name,' ',COALESCE(ab.last_name,'')) approved_by_name,
    CONCAT(ib.first_name,' ',COALESCE(ib.last_name,'')) issued_by_name
    FROM quotation_versions v
    LEFT JOIN staff cb ON cb.id=v.created_by
    LEFT JOIN staff ab ON ab.id=v.approved_by
    LEFT JOIN staff ib ON ib.id=v.issued_by
    WHERE v.quotation_id=? ORDER BY v.version_no DESC");
$versionsStmt->execute([$id]);$versions=$versionsStmt->fetchAll(PDO::FETCH_ASSOC);

$currentVersion=null;$issuedVersion=null;
foreach($versions as $version){
    if((int)$version['version_no']===max(1,(int)$q['current_version_no']) && !$currentVersion) $currentVersion=$version;
    if($version['status']==='issued' && !$issuedVersion) $issuedVersion=$version;
    if((int)($q['accepted_version_id']??0)===(int)$version['id']) $issuedVersion=$version;
}

$approvalStmt=$pdo->prepare("SELECT ar.*,r.rule_code,r.name rule_name,
    CONCAT(req.first_name,' ',COALESCE(req.last_name,'')) requester_name,
    CONCAT(ap.first_name,' ',COALESCE(ap.last_name,'')) approver_name
    FROM approval_requests ar
    LEFT JOIN quotation_approval_rules r ON r.id=ar.approval_rule_id
    LEFT JOIN staff req ON req.id=ar.requested_by
    LEFT JOIN staff ap ON ap.id=ar.assigned_approver
    WHERE ar.entity_type='quotation' AND ar.entity_id=?
    ORDER BY FIELD(ar.status,'pending','rejected','approved','cancelled'),ar.created_at DESC,ar.id DESC");
$approvalStmt->execute([$id]);$approvalRequests=$approvalStmt->fetchAll(PDO::FETCH_ASSOC);
$pendingApprovals=array_values(array_filter($approvalRequests,fn($row)=>$row['status']==='pending' && (!$currentVersion || (int)$row['quotation_version_id']===(int)$currentVersion['id'])));

$eventStmt=$pdo->prepare("SELECT e.*,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) staff_name FROM quotation_version_events e LEFT JOIN staff s ON s.id=e.staff_id WHERE e.quotation_id=? ORDER BY e.created_at DESC,e.id DESC LIMIT 30");
$eventStmt->execute([$id]);$workflowEvents=$eventStmt->fetchAll(PDO::FETCH_ASSOC);

$sectionsByGroup=[];foreach($sections as $section){$sectionsByGroup[(int)($section['group_id']??0)][]=$section;}
$itemsBySection=[];foreach($items as $item){$itemsBySection[(int)($item['section_id']??0)][]=$item;}
$quoteLevelCharges=[];foreach($charges as $charge){if((int)($charge['internal_only']??0)===0)$quoteLevelCharges[]=$charge;}

$pageTitle=$q['quotation_code'];
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content quotation-view-page quotation-view-stage4">
<div class="page-head no-print">
    <div>
        <p class="eyebrow">Quotation Centre · Stage 4</p>
        <h1><?= h($q['quotation_code']) ?></h1>
        <p class="muted"><?= h($q['customer_name']) ?> · <?= h($q['project_name']?:$q['project_type']?:'Project') ?> · <?= h(trim($q['salesperson_name'])?:'Unassigned') ?></p>
    </div>
    <div class="actions">
        <button class="btn" type="button" onclick="window.print()">Print working copy</button>
        <?php if($q['status']==='draft' && can('quotation.revise')): ?><a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-revise.php?id='.$id)) ?>">Edit revision v<?= max(1,(int)$q['current_version_no']) ?></a><?php endif; ?>
        <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Back to Centre</a>
    </div>
</div>

<section class="staff-panel no-print quotation-workflow-panel">
    <div class="section-title quotation-workflow-head">
        <div>
            <p class="eyebrow">Controlled workflow</p>
            <h2>Revision v<?= max(1,(int)$q['current_version_no']) ?> · <?= h(ucwords(str_replace('_',' ',$q['status']))) ?></h2>
            <p class="muted">Customer-facing revisions are frozen before approval. Issued and accepted versions cannot be overwritten.</p>
        </div>
        <span class="quote-status quote-status-<?= h($q['status']) ?>"><?= h(ucwords(str_replace('_',' ',$q['status']))) ?></span>
    </div>

    <div class="quotation-workflow-steps">
        <?php
        $workflowOrder=['draft'=>1,'pending_approval'=>2,'approved'=>3,'sent'=>4,'accepted'=>5];
        $activeStep=$workflowOrder[$q['status']]??($q['status']==='rejected'?4:1);
        foreach([1=>'Working revision',2=>'Approval',3=>'Approved',4=>'Issued',5=>'Customer decision'] as $step=>$label):
        ?>
        <div class="workflow-step <?= $step<$activeStep?'is-done':($step===$activeStep?'is-active':'') ?>"><b><?= $step ?></b><span><?= h($label) ?></span></div>
        <?php endforeach; ?>
    </div>

    <?php if($q['status']==='draft'): ?>
        <div class="workflow-action-card">
            <div><strong>Freeze this working revision and submit it</strong><span>The current price, scope, costs and customer wording become an immutable v<?= max(1,(int)$q['current_version_no']) ?> snapshot.</span></div>
            <?php if(can('quotation.revise') || can('quotation.create')): ?>
            <form method="post" class="workflow-inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="submit_approval"><input type="hidden" name="id" value="<?= $id ?>"><input name="change_summary" placeholder="What changed in this revision?" required><button class="btn primary">Submit revision</button></form>
            <?php endif; ?>
        </div>
    <?php elseif($q['status']==='pending_approval'): ?>
        <div class="workflow-action-card workflow-warning-card">
            <div><strong><?= count($pendingApprovals) ?> approval check<?= count($pendingApprovals)===1?'':'s' ?> still pending</strong><span>This frozen revision cannot be edited while approval is active.</span></div>
            <div class="actions"><?php if(can('quotation.approve')): ?><a class="btn primary" href="<?= h(ideare_root_url('staff/admin/approvals.php')) ?>">Open approval queue</a><?php endif; ?></div>
        </div>
        <?php if(can('quotation.revise') || can('quotation.approve')): ?>
        <form method="post" class="workflow-withdraw-form"><?= csrf_field() ?><input type="hidden" name="action" value="withdraw_approval"><input type="hidden" name="id" value="<?= $id ?>"><input name="withdraw_note" placeholder="Reason for withdrawing approval"><button class="btn danger" type="submit">Withdraw &amp; start new revision</button></form>
        <?php endif; ?>
    <?php elseif($q['status']==='approved' && $currentVersion): ?>
        <div class="workflow-action-card workflow-success-card">
            <div><strong>Revision v<?= (int)$currentVersion['version_no'] ?> is approved</strong><span>Issue this exact frozen version to the customer. Any later change requires another revision.</span></div>
            <?php if(can('quotation.issue')): ?><form method="post" class="workflow-inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="issue"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="version_id" value="<?= (int)$currentVersion['id'] ?>"><input name="issue_note" placeholder="Issue note / channel"><button class="btn primary">Issue v<?= (int)$currentVersion['version_no'] ?></button></form><?php endif; ?>
        </div>
        <?php if(can('quotation.revise')): ?><form method="post" class="workflow-secondary-action"><?= csrf_field() ?><input type="hidden" name="action" value="start_revision"><input type="hidden" name="id" value="<?= $id ?>"><input name="revision_note" placeholder="Reason for revising approved quotation"><button class="btn">Start another revision instead</button></form><?php endif; ?>
    <?php elseif($q['status']==='sent' && $issuedVersion): ?>
        <div class="workflow-action-card">
            <div><strong>Waiting for the customer</strong><span>Revision v<?= (int)$issuedVersion['version_no'] ?> was issued<?= $issuedVersion['issued_at']?' on '.h(date('j M Y, g:i A',strtotime($issuedVersion['issued_at']))):'' ?>.</span></div>
        </div>
        <?php if(can('quotation.accept')): ?>
        <form method="post" class="customer-decision-form"><?= csrf_field() ?><input type="hidden" name="action" value="customer_decision"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="version_id" value="<?= (int)$issuedVersion['id'] ?>">
            <label>Customer / decision maker<input name="customer_name" value="<?= h($q['customer_name']) ?>" required></label>
            <label>Decision method<select name="decision_method"><option value="signed">Signed quotation</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="customer_portal">Customer portal</option><option value="manual">Manual confirmation</option><option value="other">Other</option></select></label>
            <label class="span-2">Decision notes<input name="decision_notes" placeholder="Reference, message, signature details..."></label>
            <div class="customer-decision-actions"><button class="btn primary" name="decision" value="accepted">Record accepted</button><button class="btn danger" name="decision" value="rejected">Record rejected</button></div>
        </form>
        <?php endif; ?>
        <?php if(can('quotation.revise')): ?><form method="post" class="workflow-secondary-action"><?= csrf_field() ?><input type="hidden" name="action" value="start_revision"><input type="hidden" name="id" value="<?= $id ?>"><input name="revision_note" placeholder="Customer requested changes"><button class="btn">Customer requested changes · Start revision</button></form><?php endif; ?>
    <?php elseif($q['status']==='rejected'): ?>
        <div class="workflow-action-card workflow-danger-card"><div><strong>This revision was rejected</strong><span>The rejected snapshot remains in history. Start a new revision to continue negotiation.</span></div><?php if(can('quotation.revise')): ?><form method="post" class="workflow-inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="start_revision"><input type="hidden" name="id" value="<?= $id ?>"><input name="revision_note" placeholder="What will change next?"><button class="btn primary">Start new revision</button></form><?php endif; ?></div>
    <?php elseif($q['status']==='accepted'): ?>
        <div class="workflow-action-card workflow-success-card"><div><strong>Customer accepted revision v<?= $issuedVersion?(int)$issuedVersion['version_no']:'—' ?></strong><span>The accepted commercial snapshot is locked. Stage 5 will use this exact version for the final document and downstream hand-off.</span></div><?php if($issuedVersion): ?><a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-version-view.php?id='.(int)$issuedVersion['id'])) ?>">Open accepted version</a><?php endif; ?></div>
    <?php endif; ?>

    <?php if($pendingApprovals): ?>
    <div class="workflow-approval-mini-list">
        <?php foreach($pendingApprovals as $approval): ?><div><span class="pill pending">Pending</span><div><b><?= h($approval['rule_name']?:ucwords(str_replace('_',' ',$approval['request_type']))) ?></b><small><?= h($approval['reason']?:'Management approval required') ?><?= $approval['approver_name']?' · assigned to '.h(trim($approval['approver_name'])):'' ?></small></div></div><?php endforeach; ?>
    </div>
    <?php endif; ?>
</section>

<section class="customer-quote-sheet stage3-customer-quote">
    <header class="quote-document-header">
        <div><div class="quote-logo">IdeaRE</div><span>Architecture · Interior Design · Cabinetry</span></div>
        <div class="quote-doc-meta"><b>QUOTATION</b><span><?= h($q['quotation_code']) ?></span><span>Working revision v<?= max(1,(int)$q['current_version_no']) ?></span><?php if($q['reference_no']): ?><span>Ref: <?= h($q['reference_no']) ?></span><?php endif; ?></div>
    </header>

    <div class="quote-document-title"><small><?= h($q['quotation_title']?:'Interior Design Works') ?></small><strong><?= h($q['project_name']?:$q['project_type']?:'Project') ?></strong></div>

    <div class="quote-customer-grid">
        <div><small>Prepared for</small><strong><?= h($q['customer_name']) ?></strong><?php if($q['customer_phone']): ?><span><?= h($q['customer_phone']) ?></span><?php endif; ?><?php if($q['customer_email']): ?><span><?= h($q['customer_email']) ?></span><?php endif; ?><?php if($q['customer_billing_address_snapshot']): ?><span><?= nl2br(h($q['customer_billing_address_snapshot'])) ?></span><?php endif; ?></div>
        <div><small>Project / Site</small><strong><?= h($q['project_code_snapshot']?:$q['linked_project_code']?:'General quotation') ?></strong><?php if($q['site_address_snapshot']): ?><span><?= nl2br(h($q['site_address_snapshot'])) ?></span><?php endif; ?><?php if($q['design_code']): ?><span>Design: <?= h($q['design_code']) ?></span><?php endif; ?></div>
        <div><small>Quotation date</small><strong><?= h(date('j M Y',strtotime($q['quotation_date']))) ?></strong><?php if($q['valid_until']): ?><span>Valid until <?= h(date('j M Y',strtotime($q['valid_until']))) ?></span><?php endif; ?><span>Status: <?= h(ucwords(str_replace('_',' ',$q['status']))) ?></span></div>
    </div>

    <div class="quote-scope-document">
    <?php foreach($groups as $group): if(!(int)$group['show_on_customer_quote']) continue; ?>
        <section class="quote-doc-group">
            <div class="quote-doc-group-head"><div><small><?= h(ucwords(str_replace('_',' ',$group['group_type']))) ?></small><h2><?= h($group['group_name']) ?></h2></div><?php if($group['pricing_mode']!=='itemized'): ?><strong><?= money($group['final_total']) ?></strong><?php endif; ?></div>
            <?php if(!(int)$group['show_breakdown']): ?>
                <table class="customer-quote-table stage3-quote-table"><tbody><tr class="quote-package-row"><td><b><?= h($group['group_name']) ?></b><?php if($group['notes']): ?><small><?= h($group['notes']) ?></small><?php endif; ?></td><td>1</td><td>package</td><td><?= money($group['final_total']) ?></td><td><?= money($group['final_total']) ?></td></tr></tbody></table>
            <?php else: ?>
                <?php foreach($sectionsByGroup[(int)$group['id']]??[] as $section): if(!(int)$section['show_on_customer_quote']) continue; ?>
                    <div class="quote-doc-section">
                        <div class="quote-doc-section-title"><div><b><?= h($section['section_code']) ?>.</b><strong><?= h($section['section_name']) ?></strong></div><?php if((int)$section['show_section_total']): ?><span><?= money($section['final_total']) ?></span><?php endif; ?></div>
                        <?php if($section['description']): ?><p class="quote-doc-section-desc"><?= nl2br(h($section['description'])) ?></p><?php endif; ?>
                        <table class="customer-quote-table stage3-quote-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>
                        <?php foreach($itemsBySection[(int)$section['id']]??[] as $item): if(!(int)$item['show_on_customer_quote']) continue; ?>
                            <tr class="<?= (int)$item['is_foc']===1?'quote-foc-row':'' ?>"><td><b><?= h($item['description']) ?></b><?php if($item['measurement_text']): ?><small><?= h($item['measurement_text']) ?></small><?php endif; ?><?php if($item['notes']): ?><small><?= h($item['notes']) ?></small><?php endif; ?></td><td><?= h(rtrim(rtrim(number_format((float)$item['quantity'],3,'.',''),'0'),'.')) ?></td><td><?= h($item['unit']?:'—') ?></td><td><?= (int)$item['is_foc']===1?'<b class="quote-foc-label">FOC</b>':money($item['unit_price']) ?></td><td><?= (int)$item['is_foc']===1?'<b class="quote-foc-label">FOC</b>':money($item['amount']) ?></td></tr>
                        <?php endforeach; ?>
                        </tbody></table>
                    </div>
                <?php endforeach; ?>
                <?php if($group['pricing_mode']!=='itemized'): ?><div class="quote-package-summary"><span>Itemized scope value <?= money($group['item_subtotal']) ?></span><strong><?= h($group['group_type']==='package'?'Package price':'Group total') ?> <?= money($group['final_total']) ?></strong></div><?php endif; ?>
            <?php endif; ?>
        </section>
    <?php endforeach; ?>

    <?php if($quoteLevelCharges): ?>
        <section class="quote-doc-group"><div class="quote-doc-group-head"><div><small>Charges</small><h2>Additional Charges</h2></div></div><table class="customer-quote-table stage3-quote-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Amount</th></tr></thead><tbody><?php foreach($quoteLevelCharges as $charge): ?><tr><td><?= h($charge['charge_name']) ?></td><td>1</td><td><?= h($charge['calculation_type']==='percentage'?'%':'charge') ?></td><td><?= $charge['calculation_type']==='percentage'?h($charge['rate'].'%'):money($charge['customer_amount']?:$charge['amount']) ?></td><td><?= money($charge['customer_amount']?:$charge['amount']) ?></td></tr><?php endforeach; ?></tbody></table></section>
    <?php endif; ?>
    </div>

    <div class="quote-document-totals">
        <?php if((float)$q['discount_amount']>0): ?><div><span>Before discount</span><strong><?= money($q['selling_price_before_discount']) ?></strong></div><div><span>Discount</span><strong>- <?= money($q['discount_amount']) ?></strong></div><?php endif; ?>
        <div><span>Subtotal</span><strong><?= money($q['subtotal']) ?></strong></div>
        <?php if((float)$q['tax_amount']>0): ?><div><span><?= h($q['tax_name']?:'Tax') ?> (<?= h($q['tax_percent']) ?>%)</span><strong><?= money($q['tax_amount']) ?></strong></div><?php endif; ?>
        <div class="final"><span>Total</span><strong><?= money($q['final_total']) ?></strong></div>
    </div>

    <?php if($q['customer_notes']): ?><div class="quote-note-block"><b>Notes</b><p><?= nl2br(h($q['customer_notes'])) ?></p></div><?php endif; ?>
    <?php if($q['terms_and_conditions']): ?><div class="quote-note-block terms"><b>Terms &amp; conditions</b><p><?= nl2br(h($q['terms_and_conditions'])) ?></p></div><?php endif; ?>
    <footer class="quote-document-footer"><span>IdeaRE</span><span>Working revision v<?= max(1,(int)$q['current_version_no']) ?> · freeze before customer issue.</span></footer>
</section>

<?php if(can('quotation.view_cost')): ?>
<section class="staff-panel no-print internal-quote-panel stage3-internal-panel">
    <div class="section-title"><div><p class="eyebrow">Internal only</p><h2>Commercial &amp; cost control</h2></div><span class="pill <?= h($q['status']) ?>"><?= h(str_replace('_',' ',$q['status'])) ?></span></div>
    <div class="internal-quote-grid stage3-internal-grid">
        <div><span>Direct cost</span><strong><?= money($q['direct_cost']) ?></strong></div><div><span>Waste inside direct cost</span><strong><?= money($q['waste_cost']) ?></strong></div><div><span>Overhead</span><strong><?= money($q['overhead_amount']) ?></strong></div><div><span>Contingency</span><strong><?= money($q['contingency_amount']) ?></strong></div><div><span>True internal cost</span><strong><?= money($q['internal_cost']) ?></strong></div><div><span>Standard selling value</span><strong><?= money($q['standard_selling_price']) ?></strong></div><div><span>Package adjustment</span><strong><?= money($q['commercial_adjustment_amount']) ?></strong></div><div><span>FOC retail value</span><strong><?= money($q['foc_retail_value']) ?></strong></div>
        <?php if(can('quotation.view_margin')): ?><div><span>Gross profit</span><strong><?= money($q['gross_profit']) ?></strong></div><div><span>Gross margin</span><strong><?= number_format((float)$q['gross_margin_percent'],2) ?>%</strong></div><?php endif; ?>
    </div>
    <div class="split-grid stage3-audit-grid">
        <div><h3>Cost components</h3><div class="quote-cost-component-list"><?php foreach($costComponents as $cost): ?><div><span><b><?= h(ucwords(str_replace('_',' ',$cost['cost_category']))) ?></b><small><?= h($cost['description']) ?></small></span><strong><?= money($cost['amount']) ?></strong></div><?php endforeach; ?><?php if(!$costComponents): ?><p class="muted">No detailed cost components saved.</p><?php endif; ?></div></div>
        <div><h3>Pricing exceptions</h3><div class="quote-cost-component-list"><?php foreach($items as $item): if(!(int)$item['is_foc'] && !(int)$item['is_price_overridden']) continue; ?><div><span><b><?= h($item['description']) ?></b><small><?= (int)$item['is_foc']?'FOC · '.h($item['foc_reason']?:'No reason'):'Rate override · '.h($item['override_reason']?:'No reason') ?></small></span><strong><?= (int)$item['is_foc']?money($item['standard_amount']):money($item['amount']) ?></strong></div><?php endforeach; ?><?php foreach($adjustments as $adj): if(!in_array($adj['adjustment_type'],['package_adjustment','discount'],true)) continue; ?><div><span><b><?= h(ucwords(str_replace('_',' ',$adj['adjustment_type']))) ?></b><small><?= h($adj['reason']?:'Commercial adjustment') ?></small></span><strong><?= h($adj['direction']==='decrease'?'- ':'+ ') ?><?= money($adj['amount']) ?></strong></div><?php endforeach; ?></div></div>
    </div>
    <?php if($q['internal_notes']): ?><p><b>Internal notes:</b> <?= nl2br(h($q['internal_notes'])) ?></p><?php endif; ?>
</section>
<?php endif; ?>

<section class="staff-panel no-print quotation-version-register">
    <div class="section-title"><div><p class="eyebrow">Immutable history</p><h2>Quotation revisions</h2></div><span class="muted tiny"><?= count($versions) ?> frozen snapshot<?= count($versions)===1?'':'s' ?></span></div>
    <?php if(!$versions): ?><div class="quotation-mini-empty">No revision has been frozen yet. Submit the draft to create v<?= max(1,(int)$q['current_version_no']) ?>.</div><?php else: ?>
    <div class="table-panel"><table><thead><tr><th>Revision</th><th>Status</th><th>Change summary</th><th>Total</th><?php if(can('quotation.view_margin')): ?><th>Margin</th><?php endif; ?><th>Created / issued</th><th></th></tr></thead><tbody>
    <?php foreach($versions as $version): ?><tr><td><b>v<?= (int)$version['version_no'] ?></b><small><?= h($version['version_label']?:'Revision '.$version['version_no']) ?><?= (int)$version['is_locked']?' · Locked':'' ?></small></td><td><span class="quote-status quote-status-<?= h($version['status']) ?>"><?= h(ucwords(str_replace('_',' ',$version['status']))) ?></span></td><td><?= h($version['change_summary']?:'—') ?></td><td><b><?= money($version['total_amount']) ?></b></td><?php if(can('quotation.view_margin')): ?><td><?= number_format((float)$version['gross_margin_percent'],2) ?>%</td><?php endif; ?><td><?= h(date('j M Y, g:i A',strtotime($version['created_at']))) ?><?php if($version['issued_at']): ?><small>Issued <?= h(date('j M Y, g:i A',strtotime($version['issued_at']))) ?></small><?php endif; ?></td><td><a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-version-view.php?id='.(int)$version['id'])) ?>">Open frozen v<?= (int)$version['version_no'] ?></a></td></tr><?php endforeach; ?>
    </tbody></table></div>
    <?php endif; ?>
</section>

<section class="staff-panel no-print quotation-workflow-history">
    <div class="section-title"><div><p class="eyebrow">Audit trail</p><h2>Workflow history</h2></div></div>
    <div class="version-audit-list"><?php foreach($workflowEvents as $event): ?><div><span class="quote-status"><?= h(ucwords(str_replace('_',' ',$event['event_type']))) ?></span><div><b><?= h(trim($event['staff_name'])?:'System') ?></b><small><?= h(date('j M Y, g:i A',strtotime($event['created_at']))) ?><?= $event['notes']?' · '.h($event['notes']):'' ?></small></div></div><?php endforeach; ?><?php if(!$workflowEvents): ?><p class="muted">No Stage 4 workflow events recorded yet.</p><?php endif; ?></div>
    <details class="quotation-status-history"><summary>Legacy quotation status history</summary><div class="quote-history"><?php foreach($history as $h): ?><div><strong><?= h(str_replace('_',' ',$h['new_status'])) ?></strong><span><?= h(date('j M Y, g:i A',strtotime($h['created_at']))) ?></span><small><?= h(trim($h['changed_by_name'])?:'System') ?><?= $h['notes']?' · '.h($h['notes']):'' ?></small></div><?php endforeach; ?></div></details>
</section>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
