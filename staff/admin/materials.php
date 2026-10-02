<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('material.manage');
verify_csrf();

$pdo=staff_db();

if($_SERVER['REQUEST_METHOD']==='POST'){
    $action=$_POST['action']??'';

    if($action==='create_material'){
        $stmt=$pdo->prepare("
            INSERT INTO materials
            (
                category_id,
                material_code,
                name,
                description,
                brand,
                supplier_name,
                thickness_mm,
                unit_type,
                default_unit_cost,
                default_waste_percent,
                notes,
                is_active
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,1)
        ");

        $stmt->execute([
            $_POST['category_id']?:null,
            trim($_POST['material_code']),
            trim($_POST['name']),
            trim($_POST['description'])?:null,
            trim($_POST['brand'])?:null,
            trim($_POST['supplier_name'])?:null,
            $_POST['thickness_mm']!=='' ? (float)$_POST['thickness_mm'] : null,
            $_POST['unit_type'],
            (float)$_POST['default_unit_cost'],
            (float)$_POST['default_waste_percent'],
            trim($_POST['notes'])?:null
        ]);

        flash('success','Material added.');
        staff_redirect('staff/admin/materials.php');
    }

    if($action==='add_size'){
        $stmt=$pdo->prepare("
            INSERT INTO material_sizes
            (
                material_id,
                size_name,
                width_mm,
                length_mm,
                thickness_mm,
                unit_cost,
                is_default,
                is_active
            )
            VALUES(?,?,?,?,?,?,?,1)
        ");

        $stmt->execute([
            $_POST['material_id'],
            trim($_POST['size_name'])?:null,
            $_POST['width_mm']!==''?(float)$_POST['width_mm']:null,
            $_POST['length_mm']!==''?(float)$_POST['length_mm']:null,
            $_POST['size_thickness_mm']!==''?(float)$_POST['size_thickness_mm']:null,
            (float)$_POST['unit_cost'],
            !empty($_POST['is_default'])?1:0
        ]);

        flash('success','Material size added.');
        staff_redirect('staff/admin/materials.php');
    }
}

$categories=$pdo->query("
    SELECT *
    FROM material_categories
    WHERE is_active=1
    ORDER BY sort_order,name
")->fetchAll();

$materials=$pdo->query("
    SELECT
        m.*,
        mc.name category_name,
        (
            SELECT COUNT(*)
            FROM material_sizes ms
            WHERE ms.material_id=m.id AND ms.is_active=1
        ) size_count
    FROM materials m
    LEFT JOIN material_categories mc ON mc.id=m.category_id
    ORDER BY m.is_active DESC,mc.sort_order,m.name
")->fetchAll();

$pageTitle='Material Catalogue';
require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content">
<div class="page-head">
    <div>
        <p class="eyebrow">Management</p>
        <h1>Material catalogue</h1>
        <p class="muted">Maintain material costs, units, waste defaults and standard sheet sizes.</p>
    </div>
</div>

<div class="split-grid">
<section class="staff-panel">
    <h2>Add material</h2>

    <form method="post">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="create_material">

        <label>
            Category
            <select name="category_id">
                <option value="">Uncategorized</option>
                <?php foreach($categories as $c): ?>
                <option value="<?= (int)$c['id'] ?>"><?= h($c['name']) ?></option>
                <?php endforeach; ?>
            </select>
        </label>

        <div class="two">
            <label>Material code<input name="material_code" required></label>
            <label>Name<input name="name" required></label>
        </div>

        <label>Description<textarea name="description"></textarea></label>

        <div class="two">
            <label>Brand<input name="brand"></label>
            <label>Supplier<input name="supplier_name"></label>
        </div>

        <div class="form-grid">
            <label>Thickness (mm)<input type="number" step=".01" name="thickness_mm"></label>

            <label>
                Unit type
                <select name="unit_type">
                    <option>sheet</option>
                    <option>piece</option>
                    <option>meter</option>
                    <option>square_meter</option>
                    <option>set</option>
                    <option>liter</option>
                    <option>kg</option>
                    <option>other</option>
                </select>
            </label>

            <label>Default unit cost<input type="number" step=".01" name="default_unit_cost" value="0"></label>
            <label>Default waste %<input type="number" step=".01" name="default_waste_percent" value="0"></label>
        </div>

        <label>Notes<textarea name="notes"></textarea></label>

        <button class="btn primary">Add material</button>
    </form>
</section>

<section class="staff-panel">
    <h2>Add sheet / size option</h2>

    <form method="post">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="add_size">

        <label>
            Material
            <select name="material_id">
                <?php foreach($materials as $m): ?>
                <option value="<?= (int)$m['id'] ?>"><?= h($m['name']) ?></option>
                <?php endforeach; ?>
            </select>
        </label>

        <label>Size name<input name="size_name" placeholder="2440 x 1220 x 18mm"></label>

        <div class="form-grid">
            <label>Width mm<input type="number" step=".01" name="width_mm"></label>
            <label>Length mm<input type="number" step=".01" name="length_mm"></label>
            <label>Thickness mm<input type="number" step=".01" name="size_thickness_mm"></label>
            <label>Unit cost<input type="number" step=".01" name="unit_cost" value="0"></label>
        </div>

        <label class="check">
            <input type="checkbox" name="is_default" value="1">
            Default size
        </label>

        <button class="btn">Add size</button>
    </form>
</section>
</div>

<section class="staff-panel table-panel">
<table>
<thead>
<tr>
    <th>Material</th>
    <th>Category</th>
    <th>Unit</th>
    <th>Thickness</th>
    <th>Default Cost</th>
    <th>Waste %</th>
    <th>Sizes</th>
    <th>Supplier</th>
</tr>
</thead>
<tbody>
<?php foreach($materials as $m): ?>
<tr>
    <td><b><?= h($m['name']) ?></b><small><?= h($m['material_code']) ?></small></td>
    <td><?= h($m['category_name']?:'—') ?></td>
    <td><?= h(str_replace('_',' ',$m['unit_type'])) ?></td>
    <td><?= $m['thickness_mm']!==null?h($m['thickness_mm'].' mm'):'—' ?></td>
    <td><?= money($m['default_unit_cost']) ?></td>
    <td><?= h($m['default_waste_percent']) ?>%</td>
    <td><?= (int)$m['size_count'] ?></td>
    <td><?= h($m['supplier_name']?:'—') ?></td>
</tr>
<?php endforeach; ?>
</tbody>
</table>
</section>
</main>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
