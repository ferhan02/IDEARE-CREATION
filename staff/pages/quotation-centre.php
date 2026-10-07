<?php
require_once __DIR__.'/../../includes/staff/feature-tools.php';
require_permission('quotation.view');

$pdo=staff_db();
$staff=current_staff();
$pageTitle='Quotation Centre';

/*
 * Quotation Centre dashboard/register. Stage 3 adds section-based scope, the
 * Rate Book, package/FOC pricing and server-verified internal costing while
 * revisions and approval automation remain for Stage 4.
 */
$requiredV2Tables=[
    'quotation_groups',
    'quotation_sections',
    'quotation_rate_items',
    'quotation_adjustments',
    'quotation_cost_components',
];

foreach($requiredV2Tables as $requiredTable){
    if(!db_table_exists($pdo,$requiredTable)){
        require __DIR__.'/../../includes/staff/header.php';
        ?>
        <main class="staff-content quotation-centre-page">
            <section class="staff-panel quotation-db-warning">
                <p class="eyebrow">Database update required</p>
                <h1>Quotation Centre V2 is not ready yet</h1>
                <p class="muted">
                    Apply the Quotation Centre V2 SQL migration to <code>ideare_db</code>, then reload this page.
                    Existing quotation data will remain intact.
                </p>
            </section>
        </main>
        <?php
        require __DIR__.'/../../includes/staff/footer.php';
        exit;
    }
}

$canViewCost=can('quotation.view_cost');
$canViewMargin=can('quotation.view_margin');
$canCreate=can('quotation.create');
$canManageSettings=can('quotation.settings');
$canManageRateBook=can('quotation.manage_rate_book') || $canManageSettings;
$canApprove=can('quotation.approve');

$statusLabels=[
    'draft'=>'Draft',
    'pending_approval'=>'Pending approval',
    'approved'=>'Approved',
    'sent'=>'Sent',
    'accepted'=>'Accepted',
    'rejected'=>'Rejected',
    'expired'=>'Expired',
    'cancelled'=>'Cancelled',
];

function quote_status_label(string $status,array $labels): string
{
    return $labels[$status]??ucwords(str_replace('_',' ',$status));
}

function quote_validity_label(?string $validUntil,string $status): array
{
    if(!$validUntil || in_array($status,['accepted','rejected','expired','cancelled'],true)){
        return ['label'=>$validUntil?date('j M Y',strtotime($validUntil)):'No expiry','class'=>''];
    }

    $today=new DateTimeImmutable('today');
    $valid=new DateTimeImmutable($validUntil);
    $days=(int)$today->diff($valid)->format('%r%a');

    if($days<0){
        return ['label'=>'Expired '.abs($days).'d ago','class'=>'is-overdue'];
    }

    if($days===0){
        return ['label'=>'Expires today','class'=>'is-urgent'];
    }

    if($days<=7){
        return ['label'=>'Expires in '.$days.'d','class'=>'is-warning'];
    }

    return ['label'=>date('j M Y',strtotime($validUntil)),'class'=>''];
}

$search=trim((string)($_GET['q']??''));
$status=trim((string)($_GET['status']??''));
$salespersonId=(int)($_GET['salesperson']??0);
$validity=trim((string)($_GET['validity']??''));

if($status!=='' && !array_key_exists($status,$statusLabels)){
    $status='';
}

if(!in_array($validity,['','expiring','expired'],true)){
    $validity='';
}

$where=['1=1'];
$params=[];

if($search!==''){
    $where[]="(
        q.quotation_code LIKE ? OR
        q.reference_no LIKE ? OR
        q.quotation_title LIKE ? OR
        q.customer_name LIKE ? OR
        q.customer_phone LIKE ? OR
        q.customer_email LIKE ? OR
        q.customer_code_snapshot LIKE ? OR
        q.project_name LIKE ? OR
        q.project_code_snapshot LIKE ? OR
        c.name LIKE ? OR
        c.customer_code LIKE ? OR
        p.name LIKE ? OR
        p.project_code LIKE ?
    )";

    $like='%'.$search.'%';
    for($i=0;$i<13;$i++) $params[]=$like;
}

if($status!==''){
    $where[]='q.status=?';
    $params[]=$status;
}

if($salespersonId>0){
    $where[]='COALESCE(q.salesperson_id,q.created_by)=?';
    $params[]=$salespersonId;
}

if($validity==='expiring'){
    $where[]="q.status IN('approved','sent') AND q.valid_until BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 7 DAY)";
}elseif($validity==='expired'){
    $where[]="q.status NOT IN('accepted','rejected','cancelled','expired') AND q.valid_until IS NOT NULL AND q.valid_until<CURDATE()";
}

$whereSql=implode(' AND ',$where);

$metrics=$pdo->query("
    SELECT
        COUNT(*) total_quotes,
        SUM(CASE WHEN status IN('draft','pending_approval','approved','sent') THEN 1 ELSE 0 END) active_quotes,
        COALESCE(SUM(CASE WHEN status IN('draft','pending_approval','approved','sent') THEN final_total ELSE 0 END),0) pipeline_value,
        SUM(CASE WHEN status='pending_approval' THEN 1 ELSE 0 END) pending_approval_count,
        SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) sent_count,
        SUM(CASE
            WHEN status='accepted'
             AND COALESCE(accepted_at,updated_at)>=DATE_FORMAT(CURDATE(),'%Y-%m-01')
            THEN 1 ELSE 0 END
        ) accepted_this_month,
        COALESCE(SUM(CASE
            WHEN status='accepted'
             AND COALESCE(accepted_at,updated_at)>=DATE_FORMAT(CURDATE(),'%Y-%m-01')
            THEN final_total ELSE 0 END
        ),0) accepted_value_this_month,
        SUM(CASE
            WHEN status IN('approved','sent')
             AND valid_until BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 7 DAY)
            THEN 1 ELSE 0 END
        ) expiring_soon
    FROM quotations
")->fetch(PDO::FETCH_ASSOC)?:[];

$salespeople=$pdo->query("
    SELECT DISTINCT
        s.id,
        s.first_name,
        s.last_name
    FROM staff s
    JOIN quotations q
      ON q.salesperson_id=s.id OR (q.salesperson_id IS NULL AND q.created_by=s.id)
    WHERE s.is_active=1
    ORDER BY s.first_name,s.last_name
")->fetchAll(PDO::FETCH_ASSOC);

$sql="
    SELECT
        q.*,
        c.customer_code crm_customer_code,
        p.project_code linked_project_code,
        p.name linked_project_name,
        CONCAT(sp.first_name,' ',COALESCE(sp.last_name,'')) salesperson_name,
        CONCAT(cr.first_name,' ',COALESCE(cr.last_name,'')) creator_name,
        (SELECT COUNT(*) FROM quotation_versions v WHERE v.quotation_id=q.id) version_count,
        (SELECT COUNT(*) FROM quotation_groups g WHERE g.quotation_id=q.id) group_count,
        (SELECT COUNT(*) FROM quotation_sections qs WHERE qs.quotation_id=q.id) section_count,
        (SELECT COUNT(*)
         FROM approval_requests ar
         WHERE ar.entity_type='quotation'
           AND ar.entity_id=q.id
           AND ar.status='pending') pending_approval_count
    FROM quotations q
    LEFT JOIN customers c ON c.id=q.customer_id
    LEFT JOIN projects p ON p.id=q.project_id
    LEFT JOIN staff sp ON sp.id=COALESCE(q.salesperson_id,q.created_by)
    LEFT JOIN staff cr ON cr.id=q.created_by
    WHERE $whereSql
    ORDER BY
        FIELD(q.status,'pending_approval','draft','approved','sent','accepted','rejected','expired','cancelled'),
        COALESCE(q.last_revised_at,q.updated_at) DESC,
        q.id DESC
    LIMIT 250
";

$stmt=$pdo->prepare($sql);
$stmt->execute($params);
$rows=$stmt->fetchAll(PDO::FETCH_ASSOC);

$pendingApprovals=$pdo->query("
    SELECT
        ar.id,
        ar.entity_id quotation_id,
        ar.request_type,
        ar.reason,
        ar.requested_value,
        ar.created_at,
        q.quotation_code,
        q.customer_name,
        q.final_total,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) requester_name
    FROM approval_requests ar
    JOIN quotations q ON q.id=ar.entity_id
    LEFT JOIN staff s ON s.id=ar.requested_by
    WHERE ar.entity_type='quotation'
      AND ar.status='pending'
    ORDER BY ar.created_at DESC
    LIMIT 5
")->fetchAll(PDO::FETCH_ASSOC);

$expiringQuotes=$pdo->query("
    SELECT id,quotation_code,customer_name,final_total,valid_until,status
    FROM quotations
    WHERE status IN('approved','sent')
      AND valid_until BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 7 DAY)
    ORDER BY valid_until ASC,final_total DESC
    LIMIT 5
")->fetchAll(PDO::FETCH_ASSOC);

require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content quotation-centre-page">
    <div class="page-head quotation-centre-head">
        <div>
            <p class="eyebrow">Sales &amp; Costing</p>
            <h1>Quotation Centre</h1>
            <p class="muted">
                One place to track every quotation from draft to customer acceptance.
            </p>
        </div>

        <div class="quotation-head-actions">
            <?php if($canManageSettings): ?>
                <a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-settings.php')) ?>">Settings</a>
            <?php endif; ?>
            <?php if($canManageRateBook): ?>
                <a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-rate-book.php')) ?>">Rate Book</a>
            <?php endif; ?>
            <?php if($canApprove): ?>
                <a class="btn" href="<?= h(ideare_root_url('staff/admin/approvals.php')) ?>">Approvals</a>
            <?php endif; ?>
            <?php if($canCreate): ?>
                <a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-create.php')) ?>">New quotation</a>
            <?php endif; ?>
        </div>
    </div>

    <section class="quotation-kpi-grid" aria-label="Quotation summary">
        <article class="quotation-kpi-card quotation-kpi-primary">
            <span>Active pipeline</span>
            <strong><?= money($metrics['pipeline_value']??0) ?></strong>
            <small><?= (int)($metrics['active_quotes']??0) ?> open quotations</small>
        </article>

        <article class="quotation-kpi-card">
            <span>Awaiting approval</span>
            <strong><?= (int)($metrics['pending_approval_count']??0) ?></strong>
            <small>Needs management action</small>
        </article>

        <article class="quotation-kpi-card">
            <span>Sent to customers</span>
            <strong><?= (int)($metrics['sent_count']??0) ?></strong>
            <small>Waiting for a decision</small>
        </article>

        <article class="quotation-kpi-card quotation-kpi-success">
            <span>Accepted this month</span>
            <strong><?= money($metrics['accepted_value_this_month']??0) ?></strong>
            <small><?= (int)($metrics['accepted_this_month']??0) ?> accepted quotations</small>
        </article>

        <article class="quotation-kpi-card <?= (int)($metrics['expiring_soon']??0)>0?'quotation-kpi-warning':'' ?>">
            <span>Expiring within 7 days</span>
            <strong><?= (int)($metrics['expiring_soon']??0) ?></strong>
            <small>Approved or sent quotations</small>
        </article>
    </section>

    <section class="staff-panel quotation-filter-panel">
        <form method="get" class="quotation-filter-form">
            <label class="quotation-search-field">
                Search quotations
                <input
                    type="search"
                    name="q"
                    value="<?= h($search) ?>"
                    placeholder="Quotation no., customer, project or reference"
                >
            </label>

            <label>
                Status
                <select name="status">
                    <option value="">All statuses</option>
                    <?php foreach($statusLabels as $key=>$label): ?>
                        <option value="<?= h($key) ?>" <?= $status===$key?'selected':'' ?>><?= h($label) ?></option>
                    <?php endforeach; ?>
                </select>
            </label>

            <label>
                Salesperson
                <select name="salesperson">
                    <option value="0">All staff</option>
                    <?php foreach($salespeople as $person): ?>
                        <option value="<?= (int)$person['id'] ?>" <?= $salespersonId===(int)$person['id']?'selected':'' ?>>
                            <?= h(trim($person['first_name'].' '.($person['last_name']??''))) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>

            <label>
                Validity
                <select name="validity">
                    <option value="">Any validity</option>
                    <option value="expiring" <?= $validity==='expiring'?'selected':'' ?>>Expiring within 7 days</option>
                    <option value="expired" <?= $validity==='expired'?'selected':'' ?>>Past valid-until date</option>
                </select>
            </label>

            <div class="quotation-filter-actions">
                <button class="btn primary" type="submit">Apply filters</button>
                <?php if($search!=='' || $status!=='' || $salespersonId>0 || $validity!==''): ?>
                    <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Clear</a>
                <?php endif; ?>
            </div>
        </form>
    </section>

    <div class="quotation-centre-layout">
        <section class="staff-panel quotation-list-panel">
            <div class="section-title quotation-list-title">
                <div>
                    <p class="eyebrow">Quotation register</p>
                    <h2><?= count($rows) ?> quotation<?= count($rows)===1?'':'s' ?></h2>
                </div>
                <span class="quotation-list-note">Showing up to 250 records</span>
            </div>

            <div class="table-panel quotation-register-wrap">
                <table class="quotation-register-table">
                    <thead>
                        <tr>
                            <th>Quotation</th>
                            <th>Customer / Project</th>
                            <th>Status</th>
                            <th>Revision</th>
                            <th class="money-col">Selling</th>
                            <?php if($canViewCost): ?><th class="money-col sensitive-col">Internal cost</th><?php endif; ?>
                            <?php if($canViewMargin): ?><th class="money-col sensitive-col">Margin</th><?php endif; ?>
                            <th>Valid until</th>
                            <th>Owner</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php if(!$rows): ?>
                        <tr>
                            <td colspan="<?= 8+($canViewCost?1:0)+($canViewMargin?1:0) ?>">
                                <div class="quotation-empty-state">
                                    <strong>No quotations found</strong>
                                    <span>Try clearing the filters or create a new quotation.</span>
                                </div>
                            </td>
                        </tr>
                    <?php endif; ?>

                    <?php foreach($rows as $q): ?>
                        <?php
                        $validityInfo=quote_validity_label($q['valid_until']??null,$q['status']);
                        $projectCode=$q['project_code_snapshot']?:($q['linked_project_code']??'');
                        $projectName=$q['project_name']?:($q['linked_project_name']??'');
                        $customerCode=$q['customer_code_snapshot']?:($q['crm_customer_code']??'');
                        $versionNo=max(1,(int)$q['current_version_no']);
                        $versionCount=max((int)$q['version_count'],$versionNo);
                        ?>
                        <tr class="quotation-row <?= ($q['pending_approval_count']??0)>0?'has-pending-approval':'' ?>">
                            <td>
                                <a class="quotation-code-link" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.(int)$q['id'])) ?>">
                                    <?= h($q['quotation_code']) ?>
                                </a>
                                <small>
                                    <?= h($q['quotation_title']?:($q['reference_no']?:'Standard quotation')) ?>
                                </small>
                            </td>

                            <td>
                                <b><?= h($q['customer_name']) ?></b>
                                <small>
                                    <?= h(implode(' · ',array_values(array_filter([
                                        $customerCode,
                                        $projectCode,
                                        $projectName,
                                    ],fn($v)=>$v!==null && $v!=='')))) ?: 'No linked project' ?>
                                </small>
                            </td>

                            <td>
                                <span class="quote-status quote-status-<?= h($q['status']) ?>">
                                    <?= h(quote_status_label($q['status'],$statusLabels)) ?>
                                </span>
                                <?php if((int)($q['pending_approval_count']??0)>0): ?>
                                    <small class="quotation-attention-text">Approval pending</small>
                                <?php endif; ?>
                            </td>

                            <td>
                                <b>v<?= $versionNo ?></b>
                                <small><?= $versionCount ?> saved snapshot<?= $versionCount===1?'':'s' ?></small>
                                <small><?= (int)$q['section_count'] ?> section<?= (int)$q['section_count']===1?'':'s' ?></small>
                            </td>

                            <td class="money-col">
                                <b><?= money($q['final_total']) ?></b>
                                <?php if((float)$q['commercial_adjustment_amount']!==0.0): ?>
                                    <small>Adj. <?= money($q['commercial_adjustment_amount']) ?></small>
                                <?php endif; ?>
                            </td>

                            <?php if($canViewCost): ?>
                                <td class="money-col sensitive-col">
                                    <b><?= money($q['internal_cost']) ?></b>
                                    <?php if((float)$q['foc_retail_value']>0): ?>
                                        <small>FOC value <?= money($q['foc_retail_value']) ?></small>
                                    <?php endif; ?>
                                </td>
                            <?php endif; ?>

                            <?php if($canViewMargin): ?>
                                <td class="money-col sensitive-col">
                                    <b><?= number_format((float)$q['gross_margin_percent'],1) ?>%</b>
                                    <small><?= money($q['gross_profit']) ?> GP</small>
                                </td>
                            <?php endif; ?>

                            <td>
                                <span class="quotation-validity <?= h($validityInfo['class']) ?>">
                                    <?= h($validityInfo['label']) ?>
                                </span>
                                <small><?= $q['quotation_date']?h('Quoted '.date('j M Y',strtotime($q['quotation_date']))):'' ?></small>
                            </td>

                            <td>
                                <?= h(trim($q['salesperson_name']?:$q['creator_name']?:'Unassigned')) ?>
                                <small><?= h(date('j M Y',strtotime($q['updated_at']))) ?></small>
                            </td>

                            <td class="quotation-row-actions">
                                <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.(int)$q['id'])) ?>">Open</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>

        <aside class="quotation-attention-column">
            <section class="staff-panel quotation-attention-panel">
                <div class="section-title">
                    <div>
                        <p class="eyebrow">Needs attention</p>
                        <h2>Pending approvals</h2>
                    </div>
                    <?php if($canApprove): ?>
                        <a href="<?= h(ideare_root_url('staff/admin/approvals.php')) ?>">Open all</a>
                    <?php endif; ?>
                </div>

                <div class="quotation-attention-list">
                    <?php foreach($pendingApprovals as $approval): ?>
                        <a class="quotation-attention-item" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.(int)$approval['quotation_id'])) ?>">
                            <div>
                                <b><?= h($approval['quotation_code']) ?></b>
                                <span><?= h($approval['customer_name']) ?></span>
                            </div>
                            <strong><?= money($approval['final_total']) ?></strong>
                            <small>
                                <?= h($approval['requester_name']?:'Staff') ?> ·
                                <?= h(ucwords(str_replace('_',' ',$approval['request_type']))) ?>
                            </small>
                        </a>
                    <?php endforeach; ?>

                    <?php if(!$pendingApprovals): ?>
                        <div class="quotation-mini-empty">No quotation approvals are waiting.</div>
                    <?php endif; ?>
                </div>
            </section>

            <section class="staff-panel quotation-attention-panel">
                <div class="section-title">
                    <div>
                        <p class="eyebrow">Follow-up</p>
                        <h2>Expiring soon</h2>
                    </div>
                    <a href="<?= h(ideare_root_url('staff/pages/quotation-centre.php?validity=expiring')) ?>">View all</a>
                </div>

                <div class="quotation-attention-list">
                    <?php foreach($expiringQuotes as $quote): ?>
                        <?php $days=max(0,(int)(new DateTimeImmutable('today'))->diff(new DateTimeImmutable($quote['valid_until']))->format('%r%a')); ?>
                        <a class="quotation-attention-item" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.(int)$quote['id'])) ?>">
                            <div>
                                <b><?= h($quote['quotation_code']) ?></b>
                                <span><?= h($quote['customer_name']) ?></span>
                            </div>
                            <strong><?= money($quote['final_total']) ?></strong>
                            <small><?= $days===0?'Expires today':'Expires in '.$days.' day'.($days===1?'':'s') ?></small>
                        </a>
                    <?php endforeach; ?>

                    <?php if(!$expiringQuotes): ?>
                        <div class="quotation-mini-empty">Nothing is expiring in the next 7 days.</div>
                    <?php endif; ?>
                </div>
            </section>

            <section class="staff-panel quotation-stage-card">
                <p class="eyebrow">Stage 3</p>
                <h2>Scope &amp; pricing is live</h2>
                <p class="muted">
                    New quotations now support customer-facing sections, Rate Book pricing, multiple measurement methods,
                    FOC lines, package totals and detailed internal cost tracking. Revisions and approval automation come next.
                </p>
            </section>
        </aside>
    </div>
</main>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
