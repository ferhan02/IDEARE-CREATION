<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('quotation.view');

$pdo=staff_db();

$sql="
    SELECT
        q.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) creator_name
    FROM quotations q
    LEFT JOIN staff s ON s.id=q.created_by
    ORDER BY q.created_at DESC
    LIMIT 200
";

$rows=$pdo->query($sql)->fetchAll();

$pageTitle='Quotations';
require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content">
<div class="page-head">
    <div>
        <p class="eyebrow">Sales & Costing</p>
        <h1>Quotations</h1>
        <p class="muted">Create, review and present customer quotations.</p>
    </div>

    <?php if(can('quotation.create')): ?>
    <a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-create.php')) ?>">
        New quotation
    </a>
    <?php endif; ?>
</div>

<section class="staff-panel table-panel">
<table>
<thead>
<tr>
    <th>Quotation</th>
    <th>Customer</th>
    <th>Project</th>
    <th>Date</th>
    <th>Valid Until</th>
    <th>Total</th>
    <th>Status</th>
    <th>Created By</th>
    <th></th>
</tr>
</thead>

<tbody>
<?php if(!$rows): ?>
<tr>
    <td colspan="9" class="empty-text">No quotations yet.</td>
</tr>
<?php endif; ?>

<?php foreach($rows as $q): ?>
<tr>
    <td>
        <b><?= h($q['quotation_code']) ?></b>
        <small><?= h($q['design_code']?:'No linked design') ?></small>
    </td>
    <td>
        <?= h($q['customer_name']) ?>
        <small><?= h($q['customer_phone']?:$q['customer_email']?:'') ?></small>
    </td>
    <td><?= h($q['project_name']?:$q['project_type']?:'—') ?></td>
    <td><?= h(date('j M Y',strtotime($q['quotation_date']))) ?></td>
    <td><?= $q['valid_until']?h(date('j M Y',strtotime($q['valid_until']))):'—' ?></td>
    <td><b><?= money($q['final_total']) ?></b></td>
    <td><span class="pill <?= h($q['status']) ?>"><?= h(str_replace('_',' ',$q['status'])) ?></span></td>
    <td><?= h(trim($q['creator_name'])?:'—') ?></td>
    <td>
        <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.(int)$q['id'])) ?>">
            Open
        </a>
    </td>
</tr>
<?php endforeach; ?>
</tbody>
</table>
</section>
</main>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
