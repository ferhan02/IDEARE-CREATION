<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('quotation.view');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();
$id=(int)($_GET['id']??$_POST['id']??0);

if(!$id){
    staff_redirect('staff/pages/quotations.php');
}

if($_SERVER['REQUEST_METHOD']==='POST' && ($_POST['action']??'')==='status'){
    $newStatus=$_POST['status']??'draft';

    $allowed=['draft','pending_approval','approved','sent','accepted','rejected','expired','cancelled'];

    if(!in_array($newStatus,$allowed,true)){
        $newStatus='draft';
    }

    $q=$pdo->prepare("SELECT status FROM quotations WHERE id=?");
    $q->execute([$id]);
    $oldStatus=$q->fetchColumn();

    if($oldStatus!==false){
        if($newStatus==='approved' && !can('quotation.approve')){
            flash('error','You do not have permission to approve quotations.');
            staff_redirect('staff/pages/quotation-view.php?id='.$id);
        }

        $approvedBy=$newStatus==='approved'?$staff['id']:null;
        $approvedAt=$newStatus==='approved'?date('Y-m-d H:i:s'):null;

        $pdo->prepare("
            UPDATE quotations
            SET status=?,
                approved_by=COALESCE(?,approved_by),
                approved_at=COALESCE(?,approved_at)
            WHERE id=?
        ")->execute([$newStatus,$approvedBy,$approvedAt,$id]);

        $pdo->prepare("
            INSERT INTO quotation_status_history
            (quotation_id,old_status,new_status,changed_by,notes)
            VALUES(?,?,?,?,?)
        ")->execute([
            $id,
            $oldStatus,
            $newStatus,
            $staff['id'],
            trim($_POST['status_note']??'') ?: null
        ]);

        log_activity(
            'quotation.status',
            'quotation',
            (string)$id,
            'Quotation status changed from '.$oldStatus.' to '.$newStatus
        );

        flash('success','Quotation status updated.');
    }

    staff_redirect('staff/pages/quotation-view.php?id='.$id);
}

$stmt=$pdo->prepare("
    SELECT
        q.*,
        CONCAT(c.first_name,' ',COALESCE(c.last_name,'')) creator_name,
        CONCAT(a.first_name,' ',COALESCE(a.last_name,'')) approver_name
    FROM quotations q
    LEFT JOIN staff c ON c.id=q.created_by
    LEFT JOIN staff a ON a.id=q.approved_by
    WHERE q.id=?
    LIMIT 1
");
$stmt->execute([$id]);
$q=$stmt->fetch();

if(!$q){
    http_response_code(404);
    exit('Quotation not found.');
}

$itemStmt=$pdo->prepare("
    SELECT *
    FROM quotation_items
    WHERE quotation_id=?
    ORDER BY sort_order,id
");
$itemStmt->execute([$id]);
$items=$itemStmt->fetchAll();

$chargeStmt=$pdo->prepare("
    SELECT *
    FROM quotation_charges
    WHERE quotation_id=?
    ORDER BY sort_order,id
");
$chargeStmt->execute([$id]);
$charges=$chargeStmt->fetchAll();

$historyStmt=$pdo->prepare("
    SELECT
        h.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) changed_by_name
    FROM quotation_status_history h
    LEFT JOIN staff s ON s.id=h.changed_by
    WHERE h.quotation_id=?
    ORDER BY h.created_at DESC
");
$historyStmt->execute([$id]);
$history=$historyStmt->fetchAll();

$pageTitle=$q['quotation_code'];
require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content quotation-view-page">
<div class="page-head no-print">
    <div>
        <p class="eyebrow">Quotation</p>
        <h1><?= h($q['quotation_code']) ?></h1>
        <p class="muted"><?= h($q['customer_name']) ?> · <?= h($q['project_name']?:$q['project_type']?:'Project') ?></p>
    </div>

    <div class="actions">
        <button class="btn" type="button" onclick="window.print()">Print / Save PDF</button>
        <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotations.php')) ?>">Back</a>
    </div>
</div>

<section class="customer-quote-sheet">
    <header class="quote-document-header">
        <div>
            <div class="quote-logo">IdeaRE</div>
            <span>Cabinet & Interior Solutions</span>
        </div>

        <div class="quote-doc-meta">
            <b>QUOTATION</b>
            <span><?= h($q['quotation_code']) ?></span>
        </div>
    </header>

    <div class="quote-customer-grid">
        <div>
            <small>Prepared for</small>
            <strong><?= h($q['customer_name']) ?></strong>
            <?php if($q['customer_phone']): ?><span><?= h($q['customer_phone']) ?></span><?php endif; ?>
            <?php if($q['customer_email']): ?><span><?= h($q['customer_email']) ?></span><?php endif; ?>
        </div>

        <div>
            <small>Project</small>
            <strong><?= h($q['project_name']?:$q['project_type']?:'Cabinet Project') ?></strong>
            <?php if($q['design_code']): ?><span>Design: <?= h($q['design_code']) ?></span><?php endif; ?>
        </div>

        <div>
            <small>Quotation date</small>
            <strong><?= h(date('j M Y',strtotime($q['quotation_date']))) ?></strong>
            <?php if($q['valid_until']): ?><span>Valid until <?= h(date('j M Y',strtotime($q['valid_until']))) ?></span><?php endif; ?>
        </div>
    </div>

    <table class="customer-quote-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Amount</th>
            </tr>
        </thead>

        <tbody>
        <?php foreach($items as $item): ?>
            <?php if(!$item['show_on_customer_quote']) continue; ?>
            <tr>
                <td><?= h($item['description']) ?></td>
                <td><?= h(rtrim(rtrim(number_format((float)$item['quantity'],3,'.',''),'0'),'.')) ?></td>
                <td><?= h($item['unit']?:'—') ?></td>
                <td><?= money($item['unit_price']) ?></td>
                <td><?= money($item['amount']) ?></td>
            </tr>
        <?php endforeach; ?>

        <?php foreach($charges as $charge): ?>
            <?php if($charge['internal_only']) continue; ?>
            <tr>
                <td><?= h($charge['charge_name']) ?></td>
                <td>1</td>
                <td><?= h($charge['calculation_type']==='percentage'?'%':'charge') ?></td>
                <td><?= $charge['calculation_type']==='percentage'?h($charge['rate'].'%'):money($charge['amount']) ?></td>
                <td><?= money($charge['amount']) ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <div class="quote-document-totals">
        <?php if((float)$q['discount_amount']>0): ?>
        <div><span>Before discount</span><strong><?= money($q['selling_price_before_discount']) ?></strong></div>
        <div><span>Discount</span><strong>- <?= money($q['discount_amount']) ?></strong></div>
        <?php endif; ?>

        <div><span>Subtotal</span><strong><?= money($q['subtotal']) ?></strong></div>

        <?php if((float)$q['tax_amount']>0): ?>
        <div><span><?= h($q['tax_name']?:'Tax') ?> (<?= h($q['tax_percent']) ?>%)</span><strong><?= money($q['tax_amount']) ?></strong></div>
        <?php endif; ?>

        <div class="final">
            <span>Total</span>
            <strong><?= money($q['final_total']) ?></strong>
        </div>
    </div>

    <?php if($q['customer_notes']): ?>
    <div class="quote-note-block">
        <b>Notes</b>
        <p><?= nl2br(h($q['customer_notes'])) ?></p>
    </div>
    <?php endif; ?>

    <?php if($q['terms_and_conditions']): ?>
    <div class="quote-note-block terms">
        <b>Terms & conditions</b>
        <p><?= nl2br(h($q['terms_and_conditions'])) ?></p>
    </div>
    <?php endif; ?>

    <footer class="quote-document-footer">
        <span>IdeaRE</span>
        <span>Thank you for the opportunity to quote your project.</span>
    </footer>
</section>

<?php if(can('quotation.view_cost')): ?>
<section class="staff-panel no-print internal-quote-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Internal only</p>
            <h2>Cost & margin breakdown</h2>
        </div>
        <span class="pill <?= h($q['status']) ?>"><?= h(str_replace('_',' ',$q['status'])) ?></span>
    </div>

    <div class="internal-quote-grid">
        <div><span>Direct cost</span><strong><?= money($q['direct_cost']) ?></strong></div>
        <div><span>Waste cost</span><strong><?= money($q['waste_cost']) ?></strong></div>
        <div><span>Overhead</span><strong><?= money($q['overhead_amount']) ?></strong></div>
        <div><span>Internal cost</span><strong><?= money($q['internal_cost']) ?></strong></div>

        <?php if(can('quotation.view_margin')): ?>
        <div><span>Markup / profit</span><strong><?= money($q['markup_amount']) ?></strong></div>
        <div>
            <span>Approx. gross margin</span>
            <strong>
                <?= (float)$q['selling_price_before_discount']>0
                    ? h(number_format(((float)$q['selling_price_before_discount']-(float)$q['internal_cost'])/(float)$q['selling_price_before_discount']*100,2)).'%'
                    : '0.00%' ?>
            </strong>
        </div>
        <?php endif; ?>
    </div>

    <?php if($q['internal_notes']): ?>
        <p><b>Internal notes:</b> <?= nl2br(h($q['internal_notes'])) ?></p>
    <?php endif; ?>
</section>
<?php endif; ?>

<section class="staff-panel no-print">
    <p class="eyebrow">Workflow</p>
    <h2>Quotation status</h2>

    <form method="post" class="status-update-form">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="status">
        <input type="hidden" name="id" value="<?= (int)$q['id'] ?>">

        <select name="status">
            <option value="draft" <?= $q['status']==='draft'?'selected':'' ?>>Draft</option>
            <option value="pending_approval" <?= $q['status']==='pending_approval'?'selected':'' ?>>Pending approval</option>

            <?php if(can('quotation.approve')): ?>
            <option value="approved" <?= $q['status']==='approved'?'selected':'' ?>>Approved</option>
            <?php endif; ?>

            <option value="sent" <?= $q['status']==='sent'?'selected':'' ?>>Sent</option>
            <option value="accepted" <?= $q['status']==='accepted'?'selected':'' ?>>Accepted</option>
            <option value="rejected" <?= $q['status']==='rejected'?'selected':'' ?>>Rejected</option>
            <option value="expired" <?= $q['status']==='expired'?'selected':'' ?>>Expired</option>
            <option value="cancelled" <?= $q['status']==='cancelled'?'selected':'' ?>>Cancelled</option>
        </select>

        <input name="status_note" placeholder="Optional status note">
        <button class="btn primary">Update status</button>
    </form>

    <div class="quote-history">
        <?php foreach($history as $h): ?>
        <div>
            <strong><?= h(str_replace('_',' ',$h['new_status'])) ?></strong>
            <span><?= h(date('j M Y, g:i A',strtotime($h['created_at']))) ?></span>
            <small><?= h(trim($h['changed_by_name'])?:'System') ?><?= $h['notes']?' · '.h($h['notes']):'' ?></small>
        </div>
        <?php endforeach; ?>
    </div>
</section>
</main>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
