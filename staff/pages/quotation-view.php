<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('quotation.view');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();
$id=(int)($_GET['id']??$_POST['id']??0);
if(!$id) staff_redirect('staff/pages/quotation-centre.php');

if($_SERVER['REQUEST_METHOD']==='POST' && ($_POST['action']??'')==='status'){
    $newStatus=$_POST['status']??'draft';
    $allowed=['draft','pending_approval','approved','sent','accepted','rejected','expired','cancelled'];
    if(!in_array($newStatus,$allowed,true)) $newStatus='draft';

    $q=$pdo->prepare('SELECT status FROM quotations WHERE id=?');
    $q->execute([$id]);
    $oldStatus=$q->fetchColumn();
    if($oldStatus!==false){
        if($newStatus==='approved' && !can('quotation.approve')){
            flash('error','You do not have permission to approve quotations.');
            staff_redirect('staff/pages/quotation-view.php?id='.$id);
        }
        $approvedBy=$newStatus==='approved'?$staff['id']:null;
        $approvedAt=$newStatus==='approved'?date('Y-m-d H:i:s'):null;
        $acceptedAt=$newStatus==='accepted'?date('Y-m-d H:i:s'):null;
        $sentAt=$newStatus==='sent'?date('Y-m-d H:i:s'):null;
        $pdo->prepare("UPDATE quotations SET status=?,approved_by=COALESCE(?,approved_by),approved_at=COALESCE(?,approved_at),sent_at=COALESCE(?,sent_at),accepted_at=COALESCE(?,accepted_at) WHERE id=?")
            ->execute([$newStatus,$approvedBy,$approvedAt,$sentAt,$acceptedAt,$id]);
        $pdo->prepare('INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,?,?,?,?)')
            ->execute([$id,$oldStatus,$newStatus,$staff['id'],trim((string)($_POST['status_note']??''))?:null]);
        log_activity('quotation.status','quotation',(string)$id,'Quotation status changed from '.$oldStatus.' to '.$newStatus);
        flash('success','Quotation status updated.');
    }
    staff_redirect('staff/pages/quotation-view.php?id='.$id);
}

$stmt=$pdo->prepare("SELECT q.*,CONCAT(c.first_name,' ',COALESCE(c.last_name,'')) creator_name,CONCAT(a.first_name,' ',COALESCE(a.last_name,'')) approver_name,CONCAT(sp.first_name,' ',COALESCE(sp.last_name,'')) salesperson_name,p.project_code linked_project_code,cus.customer_code linked_customer_code
    FROM quotations q LEFT JOIN staff c ON c.id=q.created_by LEFT JOIN staff a ON a.id=q.approved_by LEFT JOIN staff sp ON sp.id=COALESCE(q.salesperson_id,q.created_by) LEFT JOIN projects p ON p.id=q.project_id LEFT JOIN customers cus ON cus.id=q.customer_id WHERE q.id=? LIMIT 1");
$stmt->execute([$id]);
$q=$stmt->fetch(PDO::FETCH_ASSOC);
if(!$q){http_response_code(404);exit('Quotation not found.');}

$groupsStmt=$pdo->prepare('SELECT * FROM quotation_groups WHERE quotation_id=? ORDER BY sort_order,id');
$groupsStmt->execute([$id]);
$groups=$groupsStmt->fetchAll(PDO::FETCH_ASSOC);
$sectionsStmt=$pdo->prepare('SELECT * FROM quotation_sections WHERE quotation_id=? ORDER BY sort_order,id');
$sectionsStmt->execute([$id]);
$sections=$sectionsStmt->fetchAll(PDO::FETCH_ASSOC);
$itemsStmt=$pdo->prepare('SELECT qi.*,ri.rate_code,ri.name rate_name FROM quotation_items qi LEFT JOIN quotation_rate_items ri ON ri.id=qi.rate_book_item_id WHERE qi.quotation_id=? ORDER BY qi.sort_order,qi.id');
$itemsStmt->execute([$id]);
$items=$itemsStmt->fetchAll(PDO::FETCH_ASSOC);
$chargeStmt=$pdo->prepare('SELECT * FROM quotation_charges WHERE quotation_id=? ORDER BY sort_order,id');
$chargeStmt->execute([$id]);
$charges=$chargeStmt->fetchAll(PDO::FETCH_ASSOC);
$costStmt=$pdo->prepare('SELECT * FROM quotation_cost_components WHERE quotation_id=? ORDER BY cost_category,sort_order,id');
$costStmt->execute([$id]);
$costComponents=$costStmt->fetchAll(PDO::FETCH_ASSOC);
$adjustStmt=$pdo->prepare('SELECT * FROM quotation_adjustments WHERE quotation_id=? ORDER BY sort_order,id');
$adjustStmt->execute([$id]);
$adjustments=$adjustStmt->fetchAll(PDO::FETCH_ASSOC);
$historyStmt=$pdo->prepare("SELECT h.*,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) changed_by_name FROM quotation_status_history h LEFT JOIN staff s ON s.id=h.changed_by WHERE h.quotation_id=? ORDER BY h.created_at DESC");
$historyStmt->execute([$id]);
$history=$historyStmt->fetchAll(PDO::FETCH_ASSOC);

$sectionsByGroup=[];
foreach($sections as $section){$sectionsByGroup[(int)($section['group_id']??0)][]=$section;}
$itemsBySection=[];
foreach($items as $item){$itemsBySection[(int)($item['section_id']??0)][]=$item;}
$quoteLevelCharges=[];
foreach($charges as $charge){
    if((int)($charge['internal_only']??0)===1) continue;
    $quoteLevelCharges[]=$charge;
}

$pageTitle=$q['quotation_code'];
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content quotation-view-page quotation-view-stage3">
<div class="page-head no-print">
    <div><p class="eyebrow">Quotation · Stage 3 pricing</p><h1><?= h($q['quotation_code']) ?></h1><p class="muted"><?= h($q['customer_name']) ?> · <?= h($q['project_name']?:$q['project_type']?:'Project') ?> · <?= h(trim($q['salesperson_name'])?:'Unassigned') ?></p></div>
    <div class="actions"><button class="btn" type="button" onclick="window.print()">Print / Save PDF</button><?php if(can('quotation.create') && $q['project_id']): ?><a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-create.php?project_id='.(int)$q['project_id'])) ?>">New quotation</a><?php endif; ?><a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Back to Centre</a></div>
</div>

<section class="customer-quote-sheet stage3-customer-quote">
    <header class="quote-document-header">
        <div><div class="quote-logo">IdeaRE</div><span>Architecture · Interior Design · Cabinetry</span></div>
        <div class="quote-doc-meta"><b>QUOTATION</b><span><?= h($q['quotation_code']) ?></span><?php if($q['reference_no']): ?><span>Ref: <?= h($q['reference_no']) ?></span><?php endif; ?></div>
    </header>

    <div class="quote-document-title"><small><?= h($q['quotation_title']?:'Interior Design Works') ?></small><strong><?= h($q['project_name']?:$q['project_type']?:'Project') ?></strong></div>

    <div class="quote-customer-grid">
        <div><small>Prepared for</small><strong><?= h($q['customer_name']) ?></strong><?php if($q['customer_phone']): ?><span><?= h($q['customer_phone']) ?></span><?php endif; ?><?php if($q['customer_email']): ?><span><?= h($q['customer_email']) ?></span><?php endif; ?><?php if($q['customer_billing_address_snapshot']): ?><span><?= nl2br(h($q['customer_billing_address_snapshot'])) ?></span><?php endif; ?></div>
        <div><small>Project / Site</small><strong><?= h($q['project_code_snapshot']?:$q['linked_project_code']?:'General quotation') ?></strong><?php if($q['site_address_snapshot']): ?><span><?= nl2br(h($q['site_address_snapshot'])) ?></span><?php endif; ?><?php if($q['design_code']): ?><span>Design: <?= h($q['design_code']) ?></span><?php endif; ?></div>
        <div><small>Quotation date</small><strong><?= h(date('j M Y',strtotime($q['quotation_date']))) ?></strong><?php if($q['valid_until']): ?><span>Valid until <?= h(date('j M Y',strtotime($q['valid_until']))) ?></span><?php endif; ?><span>Status: <?= h(ucwords(str_replace('_',' ',$q['status']))) ?></span></div>
    </div>

    <div class="quote-scope-document">
    <?php foreach($groups as $group): ?>
        <?php if(!(int)$group['show_on_customer_quote']) continue; ?>
        <section class="quote-doc-group">
            <div class="quote-doc-group-head"><div><small><?= h(ucwords(str_replace('_',' ',$group['group_type']))) ?></small><h2><?= h($group['group_name']) ?></h2></div><?php if($group['pricing_mode']!=='itemized'): ?><strong><?= money($group['final_total']) ?></strong><?php endif; ?></div>

            <?php if(!(int)$group['show_breakdown']): ?>
                <table class="customer-quote-table stage3-quote-table"><tbody><tr class="quote-package-row"><td><b><?= h($group['group_name']) ?></b><?php if($group['notes']): ?><small><?= h($group['notes']) ?></small><?php endif; ?></td><td>1</td><td>package</td><td><?= money($group['final_total']) ?></td><td><?= money($group['final_total']) ?></td></tr></tbody></table>
            <?php else: ?>
                <?php foreach($sectionsByGroup[(int)$group['id']]??[] as $section): ?>
                    <?php if(!(int)$section['show_on_customer_quote']) continue; ?>
                    <div class="quote-doc-section">
                        <div class="quote-doc-section-title"><div><b><?= h($section['section_code']) ?>.</b><strong><?= h($section['section_name']) ?></strong></div><?php if((int)$section['show_section_total']): ?><span><?= money($section['final_total']) ?></span><?php endif; ?></div>
                        <?php if($section['description']): ?><p class="quote-doc-section-desc"><?= nl2br(h($section['description'])) ?></p><?php endif; ?>
                        <table class="customer-quote-table stage3-quote-table">
                            <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Amount</th></tr></thead>
                            <tbody>
                            <?php foreach($itemsBySection[(int)$section['id']]??[] as $item): ?>
                                <?php if(!(int)$item['show_on_customer_quote']) continue; ?>
                                <tr class="<?= (int)$item['is_foc']===1?'quote-foc-row':'' ?>">
                                    <td><b><?= h($item['description']) ?></b><?php if($item['measurement_text']): ?><small><?= h($item['measurement_text']) ?></small><?php endif; ?><?php if($item['notes']): ?><small><?= h($item['notes']) ?></small><?php endif; ?></td>
                                    <td><?= h(rtrim(rtrim(number_format((float)$item['quantity'],3,'.',''),'0'),'.')) ?></td><td><?= h($item['unit']?:'—') ?></td>
                                    <td><?= (int)$item['is_foc']===1?'<b class="quote-foc-label">FOC</b>':money($item['unit_price']) ?></td><td><?= (int)$item['is_foc']===1?'<b class="quote-foc-label">FOC</b>':money($item['amount']) ?></td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endforeach; ?>
                <?php if($group['pricing_mode']!=='itemized'): ?>
                    <div class="quote-package-summary"><span>Itemized scope value <?= money($group['item_subtotal']) ?></span><strong><?= h($group['group_type']==='package'?'Package price':'Group total') ?> <?= money($group['final_total']) ?></strong></div>
                <?php endif; ?>
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
    <footer class="quote-document-footer"><span>IdeaRE</span><span>Thank you for the opportunity to quote your project.</span></footer>
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
        <div><h3>Pricing exceptions</h3><div class="quote-cost-component-list"><?php foreach($items as $item): ?><?php if(!(int)$item['is_foc'] && !(int)$item['is_price_overridden']) continue; ?><div><span><b><?= h($item['description']) ?></b><small><?= (int)$item['is_foc']?'FOC · '.h($item['foc_reason']?:'No reason'):'Rate override · '.h($item['override_reason']?:'No reason') ?></small></span><strong><?= (int)$item['is_foc']?money($item['standard_amount']):money($item['amount']) ?></strong></div><?php endforeach; ?><?php foreach($adjustments as $adj): ?><?php if(!in_array($adj['adjustment_type'],['package_adjustment','discount'],true)) continue; ?><div><span><b><?= h(ucwords(str_replace('_',' ',$adj['adjustment_type']))) ?></b><small><?= h($adj['reason']?:'Commercial adjustment') ?></small></span><strong><?= h($adj['direction']==='decrease'?'- ':'+ ') ?><?= money($adj['amount']) ?></strong></div><?php endforeach; ?></div></div>
    </div>
    <?php if($q['internal_notes']): ?><p><b>Internal notes:</b> <?= nl2br(h($q['internal_notes'])) ?></p><?php endif; ?>
</section>
<?php endif; ?>

<section class="staff-panel no-print">
    <p class="eyebrow">Workflow</p><h2>Quotation status</h2>
    <form method="post" class="status-update-form"><?= csrf_field() ?><input type="hidden" name="action" value="status"><input type="hidden" name="id" value="<?= (int)$q['id'] ?>"><select name="status"><option value="draft" <?= $q['status']==='draft'?'selected':'' ?>>Draft</option><option value="pending_approval" <?= $q['status']==='pending_approval'?'selected':'' ?>>Pending approval</option><?php if(can('quotation.approve')): ?><option value="approved" <?= $q['status']==='approved'?'selected':'' ?>>Approved</option><?php endif; ?><option value="sent" <?= $q['status']==='sent'?'selected':'' ?>>Sent</option><option value="accepted" <?= $q['status']==='accepted'?'selected':'' ?>>Accepted</option><option value="rejected" <?= $q['status']==='rejected'?'selected':'' ?>>Rejected</option><option value="expired" <?= $q['status']==='expired'?'selected':'' ?>>Expired</option><option value="cancelled" <?= $q['status']==='cancelled'?'selected':'' ?>>Cancelled</option></select><input name="status_note" placeholder="Optional status note"><button class="btn primary">Update status</button></form>
    <div class="quote-history"><?php foreach($history as $h): ?><div><strong><?= h(str_replace('_',' ',$h['new_status'])) ?></strong><span><?= h(date('j M Y, g:i A',strtotime($h['created_at']))) ?></span><small><?= h(trim($h['changed_by_name'])?:'System') ?><?= $h['notes']?' · '.h($h['notes']):'' ?></small></div><?php endforeach; ?></div>
</section>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
