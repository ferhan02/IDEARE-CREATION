<?php
require_once __DIR__.'/../../includes/staff/operations.php';
require_permission('quotation.view');
$pdo=staff_db();
$id=(int)($_GET['id']??0);
if(!$id) staff_redirect('staff/pages/quotation-centre.php');
if(!db_table_exists($pdo,'quotation_version_events')) staff_redirect('staff/pages/quotation-centre.php');

$stmt=$pdo->prepare("SELECT v.*,q.quotation_code,q.reference_no live_reference_no,q.quotation_title live_quotation_title,q.status quotation_status,
    CONCAT(cb.first_name,' ',COALESCE(cb.last_name,'')) created_by_name,
    CONCAT(ab.first_name,' ',COALESCE(ab.last_name,'')) approved_by_name,
    CONCAT(ib.first_name,' ',COALESCE(ib.last_name,'')) issued_by_name
    FROM quotation_versions v JOIN quotations q ON q.id=v.quotation_id
    LEFT JOIN staff cb ON cb.id=v.created_by LEFT JOIN staff ab ON ab.id=v.approved_by LEFT JOIN staff ib ON ib.id=v.issued_by
    WHERE v.id=? LIMIT 1");
$stmt->execute([$id]);$v=$stmt->fetch(PDO::FETCH_ASSOC);
if(!$v){http_response_code(404);exit('Quotation revision not found.');}

$fetch=function(string $sql) use($pdo,$id){$s=$pdo->prepare($sql);$s->execute([$id]);return $s->fetchAll(PDO::FETCH_ASSOC);};
$groups=$fetch('SELECT * FROM quotation_version_groups WHERE quotation_version_id=? ORDER BY sort_order,id');
$sections=$fetch('SELECT * FROM quotation_version_sections WHERE quotation_version_id=? ORDER BY sort_order,id');
$items=$fetch('SELECT * FROM quotation_version_items WHERE quotation_version_id=? ORDER BY sort_order,id');
$charges=$fetch('SELECT * FROM quotation_version_charges WHERE quotation_version_id=? ORDER BY sort_order,id');
$costs=$fetch('SELECT * FROM quotation_version_cost_components WHERE quotation_version_id=? ORDER BY sort_order,id');
$adjustments=$fetch('SELECT * FROM quotation_version_adjustments WHERE quotation_version_id=? ORDER BY sort_order,id');
$events=$fetch("SELECT e.*,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) staff_name FROM quotation_version_events e LEFT JOIN staff s ON s.id=e.staff_id WHERE e.quotation_version_id=? ORDER BY e.created_at DESC,e.id DESC");
$approvals=$fetch("SELECT a.*,CONCAT(r.first_name,' ',COALESCE(r.last_name,'')) requester_name,CONCAT(ap.first_name,' ',COALESCE(ap.last_name,'')) approver_name,
    (SELECT aa.comment FROM approval_actions aa WHERE aa.approval_request_id=a.id ORDER BY aa.created_at DESC,aa.id DESC LIMIT 1) latest_action_comment,
    (SELECT CONCAT(ds.first_name,' ',COALESCE(ds.last_name,'')) FROM approval_actions aa2 LEFT JOIN staff ds ON ds.id=aa2.staff_id WHERE aa2.approval_request_id=a.id AND aa2.action IN('approved','rejected') ORDER BY aa2.created_at DESC,aa2.id DESC LIMIT 1) decided_by_name
    FROM approval_requests a LEFT JOIN staff r ON r.id=a.requested_by LEFT JOIN staff ap ON ap.id=a.assigned_approver WHERE a.quotation_version_id=? ORDER BY a.created_at,a.id");

$previous=null;
$p=$pdo->prepare('SELECT id,version_no,total_amount,internal_cost,gross_margin_percent,discount_amount,commercial_adjustment_amount,foc_retail_value,status FROM quotation_versions WHERE quotation_id=? AND version_no<? ORDER BY version_no DESC LIMIT 1');
$p->execute([(int)$v['quotation_id'],(int)$v['version_no']]);$previous=$p->fetch(PDO::FETCH_ASSOC)?:null;

$sectionsByGroup=[];foreach($sections as $s)$sectionsByGroup[(int)($s['quotation_version_group_id']??0)][]=$s;
$itemsBySection=[];foreach($items as $i)$itemsBySection[(int)($i['quotation_version_section_id']??0)][]=$i;
$customerCharges=array_values(array_filter($charges,fn($c)=>(int)$c['is_internal_only']===0));

$pageTitle=$v['quotation_code'].' v'.$v['version_no'];
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content quotation-version-page">
<div class="page-head no-print"><div><p class="eyebrow">Frozen quotation revision</p><h1><?= h($v['quotation_code']) ?> · v<?= (int)$v['version_no'] ?></h1><p class="muted"><?= h($v['version_label']?:'Revision '.$v['version_no']) ?> · <?= h(ucwords(str_replace('_',' ',$v['status']))) ?><?= (int)$v['is_locked']?' · Locked snapshot':'' ?></p></div><div class="actions"><button class="btn" type="button" onclick="window.print()">Print / Save PDF</button><a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.(int)$v['quotation_id'])) ?>">Back to live quotation</a></div></div>

<?php if($previous): ?>
<section class="staff-panel no-print version-delta-panel"><div class="section-title"><div><p class="eyebrow">Revision comparison</p><h2>Changes from v<?= (int)$previous['version_no'] ?></h2></div><a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-version-view.php?id='.(int)$previous['id'])) ?>">Open v<?= (int)$previous['version_no'] ?></a></div><div class="version-delta-grid">
<div><span>Total</span><strong><?= money($v['total_amount']) ?></strong><small><?= ((float)$v['total_amount']-(float)$previous['total_amount'])>=0?'+ ':'' ?><?= money((float)$v['total_amount']-(float)$previous['total_amount']) ?></small></div>
<?php if(can('quotation.view_cost')): ?><div><span>Internal cost</span><strong><?= money($v['internal_cost']) ?></strong><small><?= ((float)$v['internal_cost']-(float)$previous['internal_cost'])>=0?'+ ':'' ?><?= money((float)$v['internal_cost']-(float)$previous['internal_cost']) ?></small></div><?php endif; ?>
<?php if(can('quotation.view_margin')): ?><div><span>Gross margin</span><strong><?= number_format((float)$v['gross_margin_percent'],2) ?>%</strong><small><?= number_format((float)$v['gross_margin_percent']-(float)$previous['gross_margin_percent'],2) ?> pts</small></div><?php endif; ?>
<div><span>Discount</span><strong><?= money($v['discount_amount']) ?></strong><small><?= ((float)$v['discount_amount']-(float)$previous['discount_amount'])>=0?'+ ':'' ?><?= money((float)$v['discount_amount']-(float)$previous['discount_amount']) ?></small></div>
</div></section>
<?php endif; ?>

<section class="customer-quote-sheet stage3-customer-quote">
<header class="quote-document-header"><div><div class="quote-logo">IdeaRE</div><span>Architecture · Interior Design · Cabinetry</span></div><div class="quote-doc-meta"><b>QUOTATION</b><span><?= h($v['quotation_code']) ?> · Revision <?= (int)$v['version_no'] ?></span><?php if($v['reference_no_snapshot']): ?><span>Ref: <?= h($v['reference_no_snapshot']) ?></span><?php endif; ?><?php if($v['snapshot_hash']): ?><span class="version-hash">Snapshot <?= h(substr($v['snapshot_hash'],0,12)) ?></span><?php endif; ?></div></header>
<div class="quote-document-title"><small><?= h($v['quotation_title_snapshot']?:$v['live_quotation_title']?:'Quotation') ?></small><strong><?= h($v['project_name_snapshot']?:$v['project_type_snapshot']?:'Project') ?></strong></div>
<div class="quote-customer-grid"><div><small>Prepared for</small><strong><?= h($v['customer_name_snapshot']) ?></strong><?php if($v['customer_phone_snapshot']): ?><span><?= h($v['customer_phone_snapshot']) ?></span><?php endif; ?><?php if($v['customer_email_snapshot']): ?><span><?= h($v['customer_email_snapshot']) ?></span><?php endif; ?><?php if($v['customer_billing_address_snapshot']): ?><span><?= nl2br(h($v['customer_billing_address_snapshot'])) ?></span><?php endif; ?></div><div><small>Project / Site</small><strong><?= h($v['project_code_snapshot']?:'General quotation') ?></strong><?php if($v['site_address_snapshot']): ?><span><?= nl2br(h($v['site_address_snapshot'])) ?></span><?php endif; ?></div><div><small>Revision</small><strong>v<?= (int)$v['version_no'] ?> · <?= h(ucwords(str_replace('_',' ',$v['status']))) ?></strong><?php if($v['quotation_date']): ?><span><?= h(date('j M Y',strtotime($v['quotation_date']))) ?></span><?php endif; ?><?php if($v['valid_until']): ?><span>Valid until <?= h(date('j M Y',strtotime($v['valid_until']))) ?></span><?php endif; ?></div></div>

<div class="quote-scope-document">
<?php foreach($groups as $g): if(!(int)$g['show_on_customer_quote'])continue; ?>
<section class="quote-doc-group"><div class="quote-doc-group-head"><div><small><?= h(ucwords(str_replace('_',' ',$g['group_type']))) ?></small><h2><?= h($g['group_name']) ?></h2></div><?php if($g['pricing_mode']!=='itemized'): ?><strong><?= money($g['final_total']) ?></strong><?php endif; ?></div>
<?php if(!(int)$g['show_breakdown']): ?><table class="customer-quote-table stage3-quote-table"><tbody><tr><td><b><?= h($g['group_name']) ?></b></td><td>1</td><td>package</td><td><?= money($g['final_total']) ?></td><td><?= money($g['final_total']) ?></td></tr></tbody></table><?php else: ?>
<?php foreach($sectionsByGroup[(int)$g['id']]??[] as $s): if(!(int)$s['show_on_customer_quote'])continue; ?><div class="quote-doc-section"><div class="quote-doc-section-title"><div><b><?= h($s['section_code']) ?>.</b><strong><?= h($s['section_name']) ?></strong></div><?php if((int)$s['show_section_total']): ?><span><?= money($s['final_total']) ?></span><?php endif; ?></div><?php if($s['description']): ?><p class="quote-doc-section-desc"><?= nl2br(h($s['description'])) ?></p><?php endif; ?><table class="customer-quote-table stage3-quote-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody><?php foreach($itemsBySection[(int)$s['id']]??[] as $i): if(!(int)($i['show_on_customer_quote']??1)) continue; ?><tr class="<?= (int)$i['is_foc']?'quote-foc-row':'' ?>"><td><b><?= h($i['description']) ?></b><?php if($i['measurement_text']): ?><small><?= h($i['measurement_text']) ?></small><?php endif; ?><?php if((int)$i['is_foc'] && $i['foc_reason']): ?><small>FOC: <?= h($i['foc_reason']) ?></small><?php endif; ?></td><td><?= h(rtrim(rtrim(number_format((float)$i['quantity'],3,'.',''),'0'),'.')) ?></td><td><?= h($i['unit']?:'—') ?></td><td><?= (int)$i['is_foc']?'<b class="quote-foc-label">FOC</b>':money($i['unit_price']) ?></td><td><?= (int)$i['is_foc']?'<b class="quote-foc-label">FOC</b>':money($i['line_total']) ?></td></tr><?php endforeach; ?></tbody></table></div><?php endforeach; ?>
<?php if($g['pricing_mode']!=='itemized'): ?><div class="quote-package-summary"><span>Itemized scope value <?= money($g['item_subtotal']) ?></span><strong>Group price <?= money($g['final_total']) ?></strong></div><?php endif; ?>
<?php endif; ?></section><?php endforeach; ?>
<?php if($customerCharges): ?><section class="quote-doc-group"><div class="quote-doc-group-head"><div><small>Charges</small><h2>Additional Charges</h2></div></div><table class="customer-quote-table stage3-quote-table"><tbody><?php foreach($customerCharges as $c): ?><tr><td><?= h($c['label']) ?></td><td>1</td><td><?= h($c['calculation_type']==='percentage'?'%':'charge') ?></td><td><?= $c['calculation_type']==='percentage'?h($c['rate'].'%'):money($c['customer_amount']?:$c['amount']) ?></td><td><?= money($c['customer_amount']?:$c['amount']) ?></td></tr><?php endforeach; ?></tbody></table></section><?php endif; ?>
</div>
<div class="quote-document-totals"><?php if((float)$v['discount_amount']>0): ?><div><span>Before discount</span><strong><?= money($v['selling_price_before_discount']) ?></strong></div><div><span>Discount</span><strong>- <?= money($v['discount_amount']) ?></strong></div><?php endif; ?><div><span>Subtotal</span><strong><?= money($v['subtotal']) ?></strong></div><?php if((float)$v['tax_amount']>0): ?><div><span><?= h($v['tax_name']?:'Tax') ?> (<?= h($v['tax_percent']) ?>%)</span><strong><?= money($v['tax_amount']) ?></strong></div><?php endif; ?><div class="final"><span>Total</span><strong><?= money($v['total_amount']) ?></strong></div></div>
<?php if($v['customer_notes']): ?><div class="quote-note-block"><b>Notes</b><p><?= nl2br(h($v['customer_notes'])) ?></p></div><?php endif; ?><?php if($v['terms']): ?><div class="quote-note-block terms"><b>Terms &amp; conditions</b><p><?= nl2br(h($v['terms'])) ?></p></div><?php endif; ?>
<footer class="quote-document-footer"><span>IdeaRE</span><span>Frozen revision v<?= (int)$v['version_no'] ?> · <?= h(ucwords(str_replace('_',' ',$v['status']))) ?></span></footer>
</section>

<div class="split-grid no-print">
<section class="staff-panel"><p class="eyebrow">Workflow audit</p><h2>Revision lifecycle</h2><div class="version-audit-list"><?php foreach($events as $e): ?><div><span class="quote-status quote-status-<?= h($e['to_status']?:$e['event_type']) ?>"><?= h(ucwords(str_replace('_',' ',$e['event_type']))) ?></span><div><b><?= h($e['staff_name']?:'System') ?></b><small><?= h(date('j M Y, g:i A',strtotime($e['created_at']))) ?><?= $e['notes']?' · '.h($e['notes']):'' ?></small></div></div><?php endforeach; ?><?php if(!$events): ?><p class="muted">No Stage 4 events recorded for this revision.</p><?php endif; ?></div></section>
<section class="staff-panel"><p class="eyebrow">Approvals</p><h2>Approval requirements</h2><div class="version-approval-list"><?php foreach($approvals as $a): ?><div><span class="pill <?= h($a['status']) ?>"><?= h($a['status']) ?></span><div><b><?= h(ucwords(str_replace('_',' ',$a['request_type']))) ?></b><small><?= h($a['reason']?:'Approval request') ?> · requested by <?= h(trim($a['requester_name'])?:'Staff') ?><?= $a['decided_by_name']?' · decided by '.h(trim($a['decided_by_name'])):($a['approver_name']?' · assigned to '.h(trim($a['approver_name'])):'') ?><?= $a['latest_action_comment']?' · '.h($a['latest_action_comment']):'' ?></small></div></div><?php endforeach; ?><?php if(!$approvals): ?><p class="muted">This revision did not require an approval request.</p><?php endif; ?></div></section>
</div>

<?php if(can('quotation.view_cost')): ?><section class="staff-panel no-print"><p class="eyebrow">Frozen internal commercial state</p><h2>Cost & exceptions</h2><div class="internal-quote-grid stage3-internal-grid"><div><span>Internal cost</span><strong><?= money($v['internal_cost']) ?></strong></div><div><span>Waste</span><strong><?= money($v['waste_cost']) ?></strong></div><div><span>Overhead</span><strong><?= money($v['overhead_amount']) ?></strong></div><div><span>Contingency</span><strong><?= money($v['contingency_amount']) ?></strong></div><div><span>Package adjustment</span><strong><?= money($v['commercial_adjustment_amount']) ?></strong></div><div><span>FOC retail value</span><strong><?= money($v['foc_retail_value']) ?></strong></div><?php if(can('quotation.view_margin')): ?><div><span>Gross profit</span><strong><?= money($v['gross_profit']) ?></strong></div><div><span>Gross margin</span><strong><?= number_format((float)$v['gross_margin_percent'],2) ?>%</strong></div><?php endif; ?></div><div class="split-grid stage3-audit-grid"><div><h3>Cost components</h3><div class="quote-cost-component-list"><?php foreach($costs as $c): ?><div><span><b><?= h(ucwords(str_replace('_',' ',$c['cost_category']))) ?></b><small><?= h($c['description']) ?></small></span><strong><?= money($c['amount']) ?></strong></div><?php endforeach; ?></div></div><div><h3>Commercial adjustments</h3><div class="quote-cost-component-list"><?php foreach($adjustments as $a): ?><div><span><b><?= h(ucwords(str_replace('_',' ',$a['adjustment_type']))) ?></b><small><?= h($a['reason']?:'Adjustment') ?></small></span><strong><?= h($a['direction']==='decrease'?'- ':'+ ') ?><?= money($a['amount']) ?></strong></div><?php endforeach; ?></div></div></div></section><?php endif; ?>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
