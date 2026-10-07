<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('quotation.settings');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();

if($_SERVER['REQUEST_METHOD']==='POST'){
    $action=$_POST['action']??'';

    if($action==='settings'){
        $keys=[
            'quotation_default_markup_percent','quotation_default_overhead_percent','quotation_default_contingency_percent',
            'quotation_default_tax_percent','quotation_valid_days','quotation_prefix','quotation_default_currency',
            'quotation_require_price_override_reason','quotation_foc_requires_reason','quotation_package_adjustment_requires_approval','quotation_require_approval_for_non_approvers'
        ];
        foreach($keys as $key){
            if(!array_key_exists($key,$_POST)) continue;
            $stmt=$pdo->prepare("INSERT INTO system_settings(setting_key,setting_value,description,updated_by)
                VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),updated_by=VALUES(updated_by)");
            $stmt->execute([$key,trim((string)$_POST[$key]),'Quotation module setting.',$staff['id']]);
        }
        flash('success','Quotation settings saved.');
        staff_redirect('staff/admin/quotation-settings.php');
    }

    if($action==='preset'){
        $allowedCategories=['labour','installation','delivery','transport','measurement','design','subcontractor','waste','overhead','consumables','machine','disposal','parking_toll','other'];
        $allowedCalc=['fixed','percentage'];
        $category=in_array($_POST['charge_category']??'other',$allowedCategories,true)?$_POST['charge_category']:'other';
        $calc=in_array($_POST['calculation_type']??'fixed',$allowedCalc,true)?$_POST['calculation_type']:'fixed';
        $stmt=$pdo->prepare("INSERT INTO quotation_charge_presets(charge_code,charge_name,charge_category,calculation_type,default_rate,internal_only,taxable,is_active,sort_order,notes)
            VALUES(?,?,?,?,?,?,?,1,?,?)");
        $stmt->execute([
            strtoupper(trim((string)$_POST['charge_code'])),trim((string)$_POST['charge_name']),$category,$calc,(float)$_POST['default_rate'],
            !empty($_POST['internal_only'])?1:0,!empty($_POST['taxable'])?1:0,(int)$_POST['sort_order'],trim((string)$_POST['notes'])?:null
        ]);
        flash('success','Charge preset added.');
        staff_redirect('staff/admin/quotation-settings.php');
    }
}

$settings=[];
foreach($pdo->query("SELECT setting_key,setting_value FROM system_settings WHERE setting_key LIKE 'quotation_%'") as $r){$settings[$r['setting_key']]=$r['setting_value'];}
$presets=$pdo->query('SELECT * FROM quotation_charge_presets ORDER BY sort_order,charge_name')->fetchAll();
$rateCount=(int)$pdo->query('SELECT COUNT(*) FROM quotation_rate_items WHERE is_active=1')->fetchColumn();
$ruleCount=(int)$pdo->query('SELECT COUNT(*) FROM quotation_approval_rules WHERE is_active=1')->fetchColumn();

$pageTitle='Quotation Settings';
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content">
<div class="page-head">
    <div><p class="eyebrow">Quotation Centre · Stage 4</p><h1>Quotation settings</h1><p class="muted">Commercial defaults, workflow policy, charge presets and controlled approval rules.</p></div>
    <div class="actions"><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-rate-book.php')) ?>">Rate Book · <?= $rateCount ?> active</a><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-approval-rules.php')) ?>">Approval rules · <?= $ruleCount ?> active</a><a class="btn" href="<?= h(ideare_root_url('staff/admin/approvals.php')) ?>">Approval queue</a><a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Quotation Centre</a></div>
</div>

<div class="split-grid">
<section class="staff-panel">
    <p class="eyebrow">Commercial defaults</p><h2>Pricing settings</h2>
    <form method="post">
        <?= csrf_field() ?><input type="hidden" name="action" value="settings">
        <div class="two"><label>Default markup benchmark %<input name="quotation_default_markup_percent" type="number" step=".01" value="<?= h($settings['quotation_default_markup_percent']??'25') ?>"></label><label>Default overhead %<input name="quotation_default_overhead_percent" type="number" step=".01" value="<?= h($settings['quotation_default_overhead_percent']??'8') ?>"></label></div>
        <div class="two"><label>Default contingency %<input name="quotation_default_contingency_percent" type="number" step=".01" value="<?= h($settings['quotation_default_contingency_percent']??'0') ?>"></label><label>Default tax %<input name="quotation_default_tax_percent" type="number" step=".01" value="<?= h($settings['quotation_default_tax_percent']??'0') ?>"></label></div>
        <div class="form-grid"><label>Default validity (days)<input name="quotation_valid_days" type="number" min="1" value="<?= h($settings['quotation_valid_days']??'30') ?>"></label><label>Quotation prefix<input name="quotation_prefix" value="<?= h($settings['quotation_prefix']??'QT') ?>"></label><label>Currency<input name="quotation_default_currency" maxlength="3" value="<?= h($settings['quotation_default_currency']??'MYR') ?>"></label></div>
        <input type="hidden" name="quotation_require_price_override_reason" value="0"><label class="check"><input type="checkbox" name="quotation_require_price_override_reason" value="1" <?= ($settings['quotation_require_price_override_reason']??'1')==='1'?'checked':'' ?>> Require a reason when staff override a Rate Book selling price</label>
        <input type="hidden" name="quotation_foc_requires_reason" value="0"><label class="check"><input type="checkbox" name="quotation_foc_requires_reason" value="1" <?= ($settings['quotation_foc_requires_reason']??'1')==='1'?'checked':'' ?>> Require a reason for every FOC quotation line</label>
        <div class="quote-workflow-settings">
            <p class="eyebrow">Stage 4 workflow policy</p>
            <input type="hidden" name="quotation_require_approval_for_non_approvers" value="0"><label class="check"><input type="checkbox" name="quotation_require_approval_for_non_approvers" value="1" <?= ($settings['quotation_require_approval_for_non_approvers']??'1')==='1'?'checked':'' ?>> Staff without quotation approval permission must obtain management approval before issue</label>
            <input type="hidden" name="quotation_package_adjustment_requires_approval" value="0"><label class="check"><input type="checkbox" name="quotation_package_adjustment_requires_approval" value="1" <?= ($settings['quotation_package_adjustment_requires_approval']??'1')==='1'?'checked':'' ?>> Require approval whenever package/commercial pricing changes the itemized selling value</label>
            <p class="muted tiny">Approved revisions are always immutable, and customer decisions are always tied to the exact issued revision. Discount, low-margin, package, FOC, price-override and high-value thresholds are managed in Approval Rules.</p>
        </div>
        <button class="btn primary">Save settings</button>
    </form>
</section>

<section class="staff-panel">
    <p class="eyebrow">Reusable charges</p><h2>Add charge preset</h2>
    <form method="post">
        <?= csrf_field() ?><input type="hidden" name="action" value="preset">
        <div class="two"><label>Code<input name="charge_code" required></label><label>Name<input name="charge_name" required></label></div>
        <label>Category<select name="charge_category"><?php foreach(['labour','installation','delivery','transport','measurement','design','subcontractor','waste','overhead','consumables','machine','disposal','parking_toll','other'] as $v): ?><option value="<?= h($v) ?>"><?= h(ucwords(str_replace('_',' ',$v))) ?></option><?php endforeach; ?></select></label>
        <div class="two"><label>Calculation<select name="calculation_type"><option value="fixed">Fixed amount</option><option value="percentage">Percentage</option></select></label><label>Default rate<input type="number" step=".01" name="default_rate" value="0"></label></div>
        <div class="two"><label class="check"><input type="checkbox" name="internal_only" value="1"> Internal only</label><label class="check"><input type="checkbox" name="taxable" value="1" checked> Taxable</label></div>
        <label>Sort order<input type="number" name="sort_order" value="0"></label><label>Notes<textarea name="notes"></textarea></label><button class="btn">Add preset</button>
    </form>
</section>
</div>

<section class="staff-panel table-panel"><div class="section-title"><div><p class="eyebrow">Charge library</p><h2><?= count($presets) ?> presets</h2></div></div><table><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Method</th><th>Rate</th><th>Internal</th><th>Taxable</th></tr></thead><tbody><?php foreach($presets as $p): ?><tr><td><?= h($p['charge_code']) ?></td><td><?= h($p['charge_name']) ?></td><td><?= h(str_replace('_',' ',$p['charge_category'])) ?></td><td><?= h(str_replace('_',' ',$p['calculation_type'])) ?></td><td><?= h($p['default_rate']) ?></td><td><?= $p['internal_only']?'Yes':'No' ?></td><td><?= $p['taxable']?'Yes':'No' ?></td></tr><?php endforeach; ?></tbody></table></section>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
