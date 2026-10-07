<?php
require_once __DIR__.'/../../includes/staff/operations.php';
require_once __DIR__.'/../../includes/staff/quotation-payments.php';
require_permission('quotation.view');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();
$id=(int)($_GET['id']??$_POST['id']??0);
if(!$id) staff_redirect('staff/pages/quotation-centre.php');

foreach(['quotation_payment_milestones','quotation_version_payment_milestones','bills_of_materials','invoices'] as $requiredTable){
    if(!db_table_exists($pdo,$requiredTable)){
        $pageTitle='Quotation Hand-off';
        require __DIR__.'/../../includes/staff/header.php';
        ?>
        <main class="staff-content quotation-handoff-page">
            <section class="staff-panel quotation-db-warning">
                <p class="eyebrow">Database update required</p>
                <h1>Stage 5 hand-off is not available yet</h1>
                <p class="muted">The Quotation Centre V2 database migration must be applied before this page can create linked BOMs and invoices.</p>
                <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.$id)) ?>">Back to quotation</a>
            </section>
        </main>
        <?php
        require __DIR__.'/../../includes/staff/footer.php';
        exit;
    }
}

$quoteStmt=$pdo->prepare("SELECT
    q.*,
    v.version_no accepted_version_no,
    v.status accepted_version_status,
    v.total_amount accepted_total,
    v.customer_decision_at,
    v.customer_decision_by,
    v.customer_decision_method,
    v.snapshot_hash,
    c.customer_code linked_customer_code,
    p.project_code linked_project_code,
    p.name linked_project_name,
    p.status project_status,
    p.accepted_quotation_id project_accepted_quotation_id,
    p.accepted_quotation_version_id project_accepted_version_id
FROM quotations q
JOIN quotation_versions v ON v.id=q.accepted_version_id AND v.quotation_id=q.id
LEFT JOIN customers c ON c.id=q.customer_id
LEFT JOIN projects p ON p.id=q.project_id
WHERE q.id=?
LIMIT 1");
$quoteStmt->execute([$id]);
$q=$quoteStmt->fetch(PDO::FETCH_ASSOC);

if(!$q){
    http_response_code(404);
    exit('Accepted quotation not found.');
}
if($q['status']!=='accepted' || $q['accepted_version_status']!=='accepted'){
    flash('error','Stage 5 hand-off is only available after the customer accepts an issued quotation revision.');
    staff_redirect('staff/pages/quotation-view.php?id='.$id);
}

$acceptedVersionId=(int)$q['accepted_version_id'];
$projectId=(int)($q['project_id']??0);
$customerId=(int)($q['customer_id']??0);

function stage5_handoff_redirect(int $quoteId): never
{
    staff_redirect('staff/pages/quotation-handoff.php?id='.$quoteId);
}

if($_SERVER['REQUEST_METHOD']==='POST'){
    $action=(string)($_POST['action']??'');

    try{
        if($action==='create_bom'){
            if(!can('materials.view')) throw new RuntimeException('You do not have permission to create the project BOM.');
            if(!$projectId) throw new RuntimeException('This accepted quotation is not linked to a project.');

            $existing=$pdo->prepare('SELECT id,bom_code FROM bills_of_materials WHERE quotation_id=? AND quotation_version_id=? ORDER BY id DESC LIMIT 1');
            $existing->execute([$id,$acceptedVersionId]);
            if($existingBom=$existing->fetch(PDO::FETCH_ASSOC)){
                throw new RuntimeException('A BOM is already linked to this accepted quotation: '.$existingBom['bom_code'].'.');
            }

            $pdo->beginTransaction();
            $bomCode=op_code('BOM');
            $materialCost=0.0;$wasteCost=0.0;$totalCost=0.0;$bomStatus='draft';
            $calc=null;$calcItems=[];

            if(!empty($q['material_calculation_id'])){
                $calcStmt=$pdo->prepare('SELECT * FROM material_calculations WHERE id=? AND (project_id=? OR project_id IS NULL) LIMIT 1');
                $calcStmt->execute([(int)$q['material_calculation_id'],$projectId]);
                $calc=$calcStmt->fetch(PDO::FETCH_ASSOC)?:null;
                if($calc){
                    $calcItemsStmt=$pdo->prepare("SELECT mci.*,m.unit material_unit
                        FROM material_calculation_items mci
                        LEFT JOIN materials m ON m.id=mci.material_id
                        WHERE mci.calculation_id=? AND mci.material_id IS NOT NULL
                        ORDER BY mci.sort_order,mci.id");
                    $calcItemsStmt->execute([(int)$calc['id']]);
                    $calcItems=$calcItemsStmt->fetchAll(PDO::FETCH_ASSOC);
                    if($calcItems){
                        foreach($calcItems as $calcItem){
                            $materialCost+=(float)$calcItem['material_cost'];
                            $wasteCost+=(float)$calcItem['waste_cost'];
                            $totalCost+=(float)$calcItem['total_cost'];
                        }
                        $materialCost=round($materialCost,2);
                        $wasteCost=round($wasteCost,2);
                        $totalCost=round($totalCost,2);
                        $bomStatus='calculated';
                    }
                }
            }

            $bomStmt=$pdo->prepare("INSERT INTO bills_of_materials
                (bom_code,project_id,design_id,quotation_id,quotation_version_id,revision_no,status,material_cost,waste_cost,total_cost,notes,created_by)
                VALUES(?,?,?,?,?,1,?,?,?,?,?,?)");
            $bomStmt->execute([
                $bomCode,$projectId,$q['design_id']?:null,$id,$acceptedVersionId,$bomStatus,$materialCost,$wasteCost,$totalCost,
                'Created from accepted quotation '.$q['quotation_code'].' v'.$q['accepted_version_no'].'.',$staff['id']
            ]);
            $bomId=(int)$pdo->lastInsertId();

            if($calcItems){
                $itemStmt=$pdo->prepare("INSERT INTO bom_items
                    (bom_id,material_id,description,required_qty,waste_percent,purchase_qty,unit,unit_cost,line_cost,source,source_reference,notes)
                    VALUES(?,?,?,?,?,?,?,?,?,'calculation',?,?)");
                foreach($calcItems as $item){
                    $required=max(0,(float)$item['quantity']);
                    $waste=max(0,(float)$item['waste_percent']);
                    $purchase=$required*(1+$waste/100);
                    $itemStmt->execute([
                        $bomId,(int)$item['material_id'],$item['description'],$required,$waste,$purchase,
                        $item['unit_type']?:$item['material_unit'],$item['unit_cost'],$item['total_cost'],$calc['calculation_code'],$item['notes']
                    ]);
                }
                $pdo->prepare('UPDATE material_calculations SET bom_id=COALESCE(bom_id,?) WHERE id=?')->execute([$bomId,(int)$calc['id']]);
            }

            project_activity($pdo,$projectId,'bom','BOM created from accepted quotation',$bomCode.' · '.$q['quotation_code'].' v'.$q['accepted_version_no']);
            $pdo->commit();
            try{log_activity('quotation.handoff.bom','quotation',(string)$id,'Created '.$bomCode.' from accepted quotation version '.$acceptedVersionId);}catch(Throwable $e){}
            flash('success',$calcItems?'BOM '.$bomCode.' created and populated from the linked material calculation.':'BOM '.$bomCode.' created and linked to the accepted quotation.');
        }

        if($action==='create_invoice'){
            if(!can('finance.view')) throw new RuntimeException('You do not have permission to create invoices.');
            if(!$customerId) throw new RuntimeException('The quotation is not linked to a CRM customer.');

            $milestoneId=(int)($_POST['milestone_id']??0);
            $milestone=null;
            $amount=(float)$q['accepted_total'];
            $label='Accepted quotation';
            $dueDate=trim((string)($_POST['due_date']??''))?:null;

            if($milestoneId>0){
                $m=$pdo->prepare('SELECT * FROM quotation_payment_milestones WHERE id=? AND quotation_id=? LIMIT 1');
                $m->execute([$milestoneId,$id]);
                $milestone=$m->fetch(PDO::FETCH_ASSOC);
                if(!$milestone) throw new RuntimeException('Payment milestone not found.');

                $existing=$pdo->prepare("SELECT invoice_no FROM invoices WHERE payment_milestone_id=? AND status<>'void' LIMIT 1");
                $existing->execute([$milestoneId]);
                if($invoiceNo=$existing->fetchColumn()) throw new RuntimeException('This milestone already has invoice '.$invoiceNo.'.');

                $amount=(float)$milestone['amount'];
                $label=$milestone['label'];
                if(!$dueDate && $milestone['due_date']) $dueDate=$milestone['due_date'];
            }else{
                $existing=$pdo->prepare("SELECT invoice_no FROM invoices WHERE quotation_version_id=? AND payment_milestone_id IS NULL AND status<>'void' LIMIT 1");
                $existing->execute([$acceptedVersionId]);
                if($invoiceNo=$existing->fetchColumn()) throw new RuntimeException('This accepted quotation already has full-value invoice '.$invoiceNo.'.');
            }

            if($amount<=0) throw new RuntimeException('The invoice amount must be greater than zero.');

            $pdo->beginTransaction();
            $invoiceNo=op_code('INV');
            $invoiceStmt=$pdo->prepare("INSERT INTO invoices
                (invoice_no,customer_id,project_id,quotation_id,quotation_version_id,payment_milestone_id,status,issue_date,due_date,currency,
                 subtotal,discount_amount,tax_amount,total_amount,paid_amount,balance_amount,notes,terms,created_by)
                VALUES(?,?,?,?,?,?,'issued',CURDATE(),?,?,?,0,0,?,0,?,?,?,?)");
            $invoiceStmt->execute([
                $invoiceNo,$customerId,$projectId?:null,$id,$acceptedVersionId,$milestoneId?:null,$dueDate,$q['currency']?:'MYR',
                $amount,$amount,$amount,
                'Generated from accepted quotation '.$q['quotation_code'].' v'.$q['accepted_version_no'].' · '.$label.'.',
                $q['terms_and_conditions']?:null,$staff['id']
            ]);
            $invoiceId=(int)$pdo->lastInsertId();
            $pdo->prepare("INSERT INTO invoice_items(invoice_id,description,quantity,unit,unit_price,tax_percent,line_total,sort_order)
                VALUES(?,?,1,'milestone',?,0,?,1)")
                ->execute([$invoiceId,$label,$amount,$amount]);

            if($projectId){
                project_activity($pdo,$projectId,'invoice','Invoice issued from accepted quotation',$invoiceNo.' · '.$label.' · '.money($amount));
            }
            $pdo->commit();
            try{log_activity('quotation.handoff.invoice','quotation',(string)$id,'Created '.$invoiceNo.' from accepted quotation version '.$acceptedVersionId);}catch(Throwable $e){}
            flash('success','Invoice '.$invoiceNo.' issued for '.$label.'.');
        }
    }catch(Throwable $e){
        if($pdo->inTransaction()) $pdo->rollBack();
        flash('error','Stage 5 hand-off could not be completed: '.$e->getMessage());
    }

    stage5_handoff_redirect($id);
}

$masterMilestoneStmt=$pdo->prepare('SELECT * FROM quotation_payment_milestones WHERE quotation_id=? ORDER BY sort_order,id');
$masterMilestoneStmt->execute([$id]);
$milestones=$masterMilestoneStmt->fetchAll(PDO::FETCH_ASSOC);

$versionMilestoneStmt=$pdo->prepare('SELECT * FROM quotation_version_payment_milestones WHERE quotation_version_id=? ORDER BY sort_order,id');
$versionMilestoneStmt->execute([$acceptedVersionId]);
$frozenMilestones=$versionMilestoneStmt->fetchAll(PDO::FETCH_ASSOC);

$invoiceStmt=$pdo->prepare("SELECT i.*,m.label milestone_label
    FROM invoices i
    LEFT JOIN quotation_payment_milestones m ON m.id=i.payment_milestone_id
    WHERE i.quotation_version_id=? AND i.status<>'void'
    ORDER BY i.created_at,i.id");
$invoiceStmt->execute([$acceptedVersionId]);
$invoices=$invoiceStmt->fetchAll(PDO::FETCH_ASSOC);
$invoiceByMilestone=[];
foreach($invoices as $invoice){if(!empty($invoice['payment_milestone_id']))$invoiceByMilestone[(int)$invoice['payment_milestone_id']]=$invoice;}

$bomStmt=$pdo->prepare('SELECT * FROM bills_of_materials WHERE quotation_id=? AND quotation_version_id=? ORDER BY id DESC');
$bomStmt->execute([$id,$acceptedVersionId]);
$boms=$bomStmt->fetchAll(PDO::FETCH_ASSOC);

$documentStmt=$pdo->prepare("SELECT * FROM documents WHERE quotation_id=? AND quotation_version_id=? ORDER BY created_at DESC");
$documentStmt->execute([$id,$acceptedVersionId]);
$documents=$documentStmt->fetchAll(PDO::FETCH_ASSOC);

$invoiceTotal=array_sum(array_map(fn($row)=>(float)$row['total_amount'],$invoices));
$paidTotal=array_sum(array_map(fn($row)=>(float)$row['paid_amount'],$invoices));
$outstanding=array_sum(array_map(fn($row)=>(float)$row['balance_amount'],$invoices));
$handoffReady=$projectId>0 && (bool)$boms && ($milestones?count($invoices)>=count($milestones):count($invoices)>=1);

$pageTitle='Stage 5 · '.$q['quotation_code'];
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content quotation-handoff-page">
<div class="page-head quotation-handoff-head">
    <div>
        <p class="eyebrow">Quotation Centre · Stage 5</p>
        <h1>Accepted quotation hand-off</h1>
        <p class="muted"><?= h($q['quotation_code']) ?> · Revision <?= (int)$q['accepted_version_no'] ?> · <?= h($q['customer_name']) ?><?= $q['project_code_snapshot']?' · '.h($q['project_code_snapshot']):'' ?></p>
    </div>
    <div class="actions">
        <a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-version-view.php?id='.$acceptedVersionId)) ?>">Customer PDF / accepted version</a>
        <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.$id)) ?>">Quotation workflow</a>
    </div>
</div>

<section class="quotation-handoff-kpis">
    <article><span>Accepted value</span><strong><?= money($q['accepted_total']) ?></strong><small>Immutable revision v<?= (int)$q['accepted_version_no'] ?></small></article>
    <article><span>Invoiced</span><strong><?= money($invoiceTotal) ?></strong><small><?= count($invoices) ?> linked invoice<?= count($invoices)===1?'':'s' ?></small></article>
    <article><span>Paid</span><strong><?= money($paidTotal) ?></strong><small>Outstanding <?= money($outstanding) ?></small></article>
    <article class="<?= $handoffReady?'is-ready':'' ?>"><span>Operations hand-off</span><strong><?= $handoffReady?'Ready':'In progress' ?></strong><small><?= count($boms) ?> BOM · <?= count($documents) ?> linked document<?= count($documents)===1?'':'s' ?></small></article>
</section>

<section class="staff-panel quotation-accepted-card">
    <div class="section-title">
        <div><p class="eyebrow">Accepted commercial baseline</p><h2><?= h($q['quotation_title']?:'Quotation') ?></h2></div>
        <span class="quote-status quote-status-accepted">Accepted</span>
    </div>
    <div class="quotation-handoff-baseline">
        <div><small>Customer</small><b><?= h($q['customer_name']) ?></b><span><?= h($q['customer_code_snapshot']?:$q['linked_customer_code']?:'CRM customer') ?></span></div>
        <div><small>Project</small><b><?= h($q['project_name']?:$q['linked_project_name']?:'No linked project') ?></b><span><?= h($q['project_code_snapshot']?:$q['linked_project_code']?:'—') ?></span></div>
        <div><small>Accepted by</small><b><?= h($q['customer_decision_by']?:$q['accepted_by_name']?:$q['customer_name']) ?></b><span><?= $q['customer_decision_at']?h(date('j M Y, g:i A',strtotime($q['customer_decision_at']))):'—' ?></span></div>
        <div><small>Project status</small><b><?= h($q['project_status']?ucwords(str_replace('_',' ',$q['project_status'])):'No project') ?></b><span><?= $projectId?'Accepted quote linked to project':'Create/link a project before operations' ?></span></div>
    </div>
</section>

<div class="quotation-handoff-grid">
<section class="staff-panel quotation-handoff-section">
    <div class="section-title"><div><p class="eyebrow">1 · Billing</p><h2>Payment milestones & invoices</h2><p class="muted">Invoices use the accepted quotation total. Milestone amounts are not re-taxed because they already represent a share of the final customer total.</p></div><?php if(can('finance.view')): ?><a class="btn" href="<?= h(ideare_root_url('staff/pages/finance.php')) ?>">Finance</a><?php endif; ?></div>

    <?php if($milestones): ?>
    <div class="handoff-milestone-list">
        <?php foreach($milestones as $m): $invoice=$invoiceByMilestone[(int)$m['id']]??null; ?>
        <article class="handoff-milestone <?= $invoice?'is-complete':'' ?>">
            <div class="handoff-milestone-main">
                <span class="handoff-step-dot"><?= (int)$m['sort_order'] ?></span>
                <div><b><?= h($m['label']) ?></b><small><?= h(quotation_payment_trigger_label($m['due_trigger'])) ?><?= $m['due_date']?' · '.h(date('j M Y',strtotime($m['due_date']))):'' ?> · <?= $m['calculation_type']==='percentage'?h(rtrim(rtrim(number_format((float)$m['value'],2,'.',''),'0'),'.')).'%':'Fixed amount' ?></small></div>
                <strong><?= money($m['amount']) ?></strong>
            </div>
            <?php if($invoice): ?>
                <div class="handoff-linked-record"><span>Invoice</span><b><?= h($invoice['invoice_no']) ?></b><span><?= h(ucwords(str_replace('_',' ',$invoice['status']))) ?> · Balance <?= money($invoice['balance_amount']) ?></span></div>
            <?php elseif(can('finance.view')): ?>
                <form method="post" class="handoff-inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="create_invoice"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="milestone_id" value="<?= (int)$m['id'] ?>"><label>Invoice due date<input type="date" name="due_date" value="<?= h((string)$m['due_date']) ?>"></label><button class="btn primary" type="submit">Issue milestone invoice</button></form>
            <?php endif; ?>
        </article>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
        <div class="handoff-empty-action">
            <div><strong>No payment schedule was frozen into this accepted quotation</strong><span>You can still create one full-value invoice. Future quotations can define deposits/progress claims before approval.</span></div>
            <?php if(can('finance.view') && !$invoices): ?><form method="post" class="handoff-inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="create_invoice"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="milestone_id" value="0"><label>Invoice due date<input type="date" name="due_date"></label><button class="btn primary">Issue full-value invoice</button></form><?php endif; ?>
        </div>
    <?php endif; ?>
</section>

<section class="staff-panel quotation-handoff-section">
    <div class="section-title"><div><p class="eyebrow">2 · Production costing</p><h2>Accepted quotation → BOM</h2><p class="muted">The BOM is permanently linked to the accepted quotation revision. If a material calculation is linked, its material lines are copied automatically.</p></div><?php if(can('materials.view')): ?><a class="btn" href="<?= h(ideare_root_url('staff/pages/bom.php')) ?>">BOM Centre</a><?php endif; ?></div>
    <?php if($boms): ?>
        <div class="handoff-record-list"><?php foreach($boms as $bom): ?><div><span><b><?= h($bom['bom_code']) ?></b><small><?= h(ucwords(str_replace('_',' ',$bom['status']))) ?> · <?= money($bom['total_cost']) ?></small></span><span class="quote-status quote-status-approved">Linked</span></div><?php endforeach; ?></div>
    <?php elseif(!$projectId): ?>
        <div class="handoff-empty-action"><div><strong>No project is linked</strong><span>A BOM requires a project. Link the quotation to a project before production hand-off.</span></div></div>
    <?php elseif(can('materials.view')): ?>
        <form method="post" class="handoff-create-card"><?= csrf_field() ?><input type="hidden" name="action" value="create_bom"><input type="hidden" name="id" value="<?= $id ?>"><div><b>Create the production BOM</b><span><?= $q['material_calculation_id']?'The linked material calculation will populate material quantities and cost.':'A linked blank BOM will be created for the production team to complete.' ?></span></div><button class="btn primary">Create BOM from accepted quote</button></form>
    <?php endif; ?>
</section>

<section class="staff-panel quotation-handoff-section">
    <div class="section-title"><div><p class="eyebrow">3 · Project baseline</p><h2>Project commercial lock</h2></div><?php if($projectId): ?><a class="btn" href="<?= h(ideare_root_url('staff/pages/project-view.php?id='.$projectId)) ?>">Open project</a><?php endif; ?></div>
    <?php if($projectId): ?>
    <div class="handoff-check-list">
        <div class="is-complete"><b>Accepted quotation linked</b><span><?= h($q['quotation_code']) ?> · v<?= (int)$q['accepted_version_no'] ?></span></div>
        <div class="is-complete"><b>Approved project value</b><span><?= money($q['accepted_total']) ?></span></div>
        <div class="<?= $boms?'is-complete':'' ?>"><b>Production BOM</b><span><?= $boms?h($boms[0]['bom_code']):'Not created yet' ?></span></div>
        <div class="<?= $invoices?'is-complete':'' ?>"><b>Billing started</b><span><?= $invoices?count($invoices).' invoice'.(count($invoices)===1?'':'s').' linked':'No invoice yet' ?></span></div>
    </div>
    <?php else: ?><p class="muted">This customer-only quotation has no project to hand off to operations.</p><?php endif; ?>
</section>

<section class="staff-panel quotation-handoff-section">
    <div class="section-title"><div><p class="eyebrow">4 · Records</p><h2>Frozen document trail</h2><p class="muted">The accepted revision remains immutable. Save the customer PDF from the accepted version and attach signed/customer-returned files in the Document Centre.</p></div><?php if(can('documents.view')): ?><a class="btn" href="<?= h(ideare_root_url('staff/pages/documents.php')) ?>">Document Centre</a><?php endif; ?></div>
    <div class="handoff-record-list">
        <div><span><b>Accepted quotation v<?= (int)$q['accepted_version_no'] ?></b><small>Snapshot <?= h(substr((string)$q['snapshot_hash'],0,12)) ?> · Print-ready customer document</small></span><a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-version-view.php?id='.$acceptedVersionId)) ?>">Open</a></div>
        <?php foreach($documents as $document): ?><div><span><b><?= h($document['title']) ?></b><small><?= h($document['document_code']?:'Document') ?> · <?= h($document['category']) ?></small></span><span class="quote-status quote-status-approved">Recorded</span></div><?php endforeach; ?>
    </div>
</section>
</div>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
