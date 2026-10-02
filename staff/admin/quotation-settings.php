<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('quotation.settings');
verify_csrf();

$pdo=staff_db();

if($_SERVER['REQUEST_METHOD']==='POST'){
    $action=$_POST['action']??'';

    if($action==='settings'){
        foreach([
            'quotation_default_markup_percent',
            'quotation_default_overhead_percent',
            'quotation_default_tax_percent',
            'quotation_valid_days',
            'quotation_prefix'
        ] as $key){
            if(!array_key_exists($key,$_POST)) continue;

            $stmt=$pdo->prepare("
                INSERT INTO system_settings(setting_key,setting_value,description,updated_by)
                VALUES(?,?,?,?)
                ON DUPLICATE KEY UPDATE
                    setting_value=VALUES(setting_value),
                    updated_by=VALUES(updated_by)
            ");

            $stmt->execute([
                $key,
                trim((string)$_POST[$key]),
                'Quotation module setting.',
                current_staff()['id']
            ]);
        }

        flash('success','Quotation settings saved.');
        staff_redirect('staff/admin/quotation-settings.php');
    }

    if($action==='preset'){
        $stmt=$pdo->prepare("
            INSERT INTO quotation_charge_presets
            (
                charge_code,
                charge_name,
                charge_category,
                calculation_type,
                default_rate,
                internal_only,
                taxable,
                is_active,
                sort_order,
                notes
            )
            VALUES(?,?,?,?,?,?,?,1,?,?)
        ");

        $stmt->execute([
            strtoupper(trim($_POST['charge_code'])),
            trim($_POST['charge_name']),
            $_POST['charge_category'],
            $_POST['calculation_type'],
            (float)$_POST['default_rate'],
            !empty($_POST['internal_only'])?1:0,
            !empty($_POST['taxable'])?1:0,
            (int)$_POST['sort_order'],
            trim($_POST['notes'])?:null
        ]);

        flash('success','Charge preset added.');
        staff_redirect('staff/admin/quotation-settings.php');
    }
}

$settings=[];
foreach($pdo->query("
    SELECT setting_key,setting_value
    FROM system_settings
    WHERE setting_key LIKE 'quotation_%'
") as $r){
    $settings[$r['setting_key']]=$r['setting_value'];
}

$presets=$pdo->query("
    SELECT *
    FROM quotation_charge_presets
    ORDER BY sort_order,charge_name
")->fetchAll();

$pageTitle='Quotation Settings';
require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content">
<div class="page-head">
    <div>
        <p class="eyebrow">Boss / Admin</p>
        <h1>Quotation settings</h1>
    </div>
</div>

<div class="split-grid">
<section class="staff-panel">
    <h2>Default pricing settings</h2>

    <form method="post">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="settings">

        <label>
            Default markup %
            <input name="quotation_default_markup_percent" type="number" step=".01" value="<?= h($settings['quotation_default_markup_percent']??'25') ?>">
        </label>

        <label>
            Default overhead %
            <input name="quotation_default_overhead_percent" type="number" step=".01" value="<?= h($settings['quotation_default_overhead_percent']??'8') ?>">
        </label>

        <label>
            Default tax %
            <input name="quotation_default_tax_percent" type="number" step=".01" value="<?= h($settings['quotation_default_tax_percent']??'0') ?>">
        </label>

        <label>
            Default validity (days)
            <input name="quotation_valid_days" type="number" min="1" value="<?= h($settings['quotation_valid_days']??'30') ?>">
        </label>

        <label>
            Quotation prefix
            <input name="quotation_prefix" value="<?= h($settings['quotation_prefix']??'Q') ?>">
        </label>

        <button class="btn primary">Save settings</button>
    </form>
</section>

<section class="staff-panel">
    <h2>Add charge preset</h2>

    <form method="post">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="preset">

        <div class="two">
            <label>Code<input name="charge_code" required></label>
            <label>Name<input name="charge_name" required></label>
        </div>

        <label>
            Category
            <select name="charge_category">
                <option>labour</option>
                <option>installation</option>
                <option>delivery</option>
                <option>transport</option>
                <option>measurement</option>
                <option>design</option>
                <option>subcontractor</option>
                <option>waste</option>
                <option>overhead</option>
                <option>consumables</option>
                <option>machine</option>
                <option>disposal</option>
                <option>parking_toll</option>
                <option>other</option>
            </select>
        </label>

        <div class="two">
            <label>
                Calculation
                <select name="calculation_type">
                    <option value="fixed">Fixed amount</option>
                    <option value="percentage">Percentage</option>
                </select>
            </label>

            <label>Default rate<input type="number" step=".01" name="default_rate" value="0"></label>
        </div>

        <div class="two">
            <label class="check"><input type="checkbox" name="internal_only" value="1"> Internal only</label>
            <label class="check"><input type="checkbox" name="taxable" value="1" checked> Taxable</label>
        </div>

        <label>Sort order<input type="number" name="sort_order" value="0"></label>
        <label>Notes<textarea name="notes"></textarea></label>

        <button class="btn">Add preset</button>
    </form>
</section>
</div>

<section class="staff-panel table-panel">
<table>
<thead>
<tr>
    <th>Code</th>
    <th>Name</th>
    <th>Category</th>
    <th>Method</th>
    <th>Rate</th>
    <th>Internal</th>
    <th>Taxable</th>
</tr>
</thead>
<tbody>
<?php foreach($presets as $p): ?>
<tr>
    <td><?= h($p['charge_code']) ?></td>
    <td><?= h($p['charge_name']) ?></td>
    <td><?= h(str_replace('_',' ',$p['charge_category'])) ?></td>
    <td><?= h($p['calculation_type']) ?></td>
    <td><?= h($p['default_rate']) ?></td>
    <td><?= $p['internal_only']?'Yes':'No' ?></td>
    <td><?= $p['taxable']?'Yes':'No' ?></td>
</tr>
<?php endforeach; ?>
</tbody>
</table>
</section>
</main>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
