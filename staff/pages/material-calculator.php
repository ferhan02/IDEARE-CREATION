<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('material.calculate');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();

if($_SERVER['REQUEST_METHOD']==='POST' && ($_POST['action']??'')==='save_calculation'){
    $payload=json_decode($_POST['payload']??'',true);

    if(!is_array($payload) || empty($payload['items'])){
        flash('error','Add at least one material before saving.');
        staff_redirect('staff/pages/material-calculator.php');
    }

    $pdo->beginTransaction();

    try{
        $code='MAT-'.date('Ymd-His');

        $stmt=$pdo->prepare("
            INSERT INTO material_calculations
            (
                calculation_code,
                design_id,
                design_code,
                calculation_name,
                customer_name,
                created_by,
                status,
                total_material_cost,
                total_waste_cost,
                total_cost,
                notes
            )
            VALUES(?,?,?,?,?,?,'calculated',?,?,?,?)
        ");

        $stmt->execute([
            $code,
            !empty($payload['design_id']) ? (int)$payload['design_id'] : null,
            $payload['design_code'] ?: null,
            $payload['calculation_name'] ?: 'Material Calculation',
            $payload['customer_name'] ?: null,
            $staff['id'],
            (float)$payload['total_material_cost'],
            (float)$payload['total_waste_cost'],
            (float)$payload['total_cost'],
            $payload['notes'] ?: null
        ]);

        $calcId=(int)$pdo->lastInsertId();

        $itemStmt=$pdo->prepare("
            INSERT INTO material_calculation_items
            (
                calculation_id,
                material_id,
                material_size_id,
                description,
                quantity,
                unit_type,
                unit_cost,
                waste_percent,
                material_cost,
                waste_cost,
                total_cost,
                sort_order,
                notes
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
        ");

        $cutJobStmt=$pdo->prepare("
            INSERT INTO cutting_jobs
            (
                calculation_id,
                material_id,
                material_size_id,
                job_name,
                sheet_width_mm,
                sheet_length_mm,
                kerf_mm,
                sheets_required,
                total_sheet_area_m2,
                used_area_m2,
                waste_area_m2,
                waste_percent,
                status,
                created_by
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ");

        $partStmt=$pdo->prepare("
            INSERT INTO cutting_job_parts
            (
                cutting_job_id,
                part_name,
                width_mm,
                length_mm,
                quantity,
                grain_direction,
                edge_band_top,
                edge_band_bottom,
                edge_band_left,
                edge_band_right,
                notes
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?)
        ");

        foreach($payload['items'] as $idx=>$item){
            $itemStmt->execute([
                $calcId,
                !empty($item['material_id']) ? (int)$item['material_id'] : null,
                !empty($item['material_size_id']) ? (int)$item['material_size_id'] : null,
                $item['description'],
                (float)$item['quantity'],
                $item['unit_type'],
                (float)$item['unit_cost'],
                (float)$item['waste_percent'],
                (float)$item['material_cost'],
                (float)$item['waste_cost'],
                (float)$item['total_cost'],
                $idx+1,
                $item['notes'] ?: null
            ]);

            if(
                ($item['unit_type']??'')==='sheet'
                && !empty($item['parts'])
                && !empty($item['sheet_width_mm'])
                && !empty($item['sheet_length_mm'])
            ){
                $usedArea=0;
                foreach($item['parts'] as $part){
                    $usedArea += ((float)$part['width_mm'] * (float)$part['length_mm'] * (int)$part['quantity']) / 1000000;
                }

                $sheetArea=((float)$item['sheet_width_mm']*(float)$item['sheet_length_mm'])/1000000;
                $sheets=max(1,(int)$item['quantity']);
                $totalArea=$sheetArea*$sheets;
                $wasteArea=max(0,$totalArea-$usedArea);
                $wastePct=$totalArea>0 ? ($wasteArea/$totalArea)*100 : 0;

                $cutJobStmt->execute([
                    $calcId,
                    (int)$item['material_id'],
                    !empty($item['material_size_id']) ? (int)$item['material_size_id'] : null,
                    $item['description'].' Cutting Job',
                    (float)$item['sheet_width_mm'],
                    (float)$item['sheet_length_mm'],
                    3,
                    $sheets,
                    $totalArea,
                    $usedArea,
                    $wasteArea,
                    $wastePct,
                    'calculated',
                    $staff['id']
                ]);

                $jobId=(int)$pdo->lastInsertId();

                foreach($item['parts'] as $part){
                    $partStmt->execute([
                        $jobId,
                        $part['part_name'],
                        (float)$part['width_mm'],
                        (float)$part['length_mm'],
                        (int)$part['quantity'],
                        $part['grain_direction'] ?: 'none',
                        !empty($part['edge_band_top'])?1:0,
                        !empty($part['edge_band_bottom'])?1:0,
                        !empty($part['edge_band_left'])?1:0,
                        !empty($part['edge_band_right'])?1:0,
                        $part['notes'] ?: null
                    ]);
                }
            }
        }

        $pdo->commit();

        log_activity(
            'material_calculation.create',
            'material_calculation',
            (string)$calcId,
            'Created material calculation '.$code
        );

        flash('success','Material calculation saved as '.$code.'.');
        staff_redirect('staff/pages/material-calculator.php?saved='.$calcId);

    }catch(Throwable $e){
        if($pdo->inTransaction()) $pdo->rollBack();
        flash('error','Could not save material calculation: '.$e->getMessage());
        staff_redirect('staff/pages/material-calculator.php');
    }
}

$materials=$pdo->query("
    SELECT
        m.*,
        mc.name category_name
    FROM materials m
    LEFT JOIN material_categories mc ON mc.id=m.category_id
    WHERE m.is_active=1
    ORDER BY mc.sort_order,m.name
")->fetchAll();

$sizes=$pdo->query("
    SELECT *
    FROM material_sizes
    WHERE is_active=1
    ORDER BY material_id,is_default DESC,id
")->fetchAll();

$designs=[];
try{
    $designs=$pdo->query("
        SELECT id,design_code,design_name,customer_name,room_type
        FROM designs
        ORDER BY created_at DESC
        LIMIT 100
    ")->fetchAll();
}catch(Throwable $e){}

$recentSql="
    SELECT mc.*,
           CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) creator_name
    FROM material_calculations mc
    LEFT JOIN staff s ON s.id=mc.created_by
";
$params=[];

if(!can('material.view_all')){
    $recentSql.=" WHERE mc.created_by=? ";
    $params[]=$staff['id'];
}

$recentSql.=" ORDER BY mc.created_at DESC LIMIT 30 ";

$stmt=$pdo->prepare($recentSql);
$stmt->execute($params);
$recent=$stmt->fetchAll();

$pageTitle='Material Calculator';
require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content cost-page">
<div class="page-head">
    <div>
        <p class="eyebrow">Costing & Waste Control</p>
        <h1>Material calculator</h1>
        <p class="muted">
            Estimate material purchases, waste allowances and sheet usage before preparing a quotation.
        </p>
    </div>

    <?php if(can('material.manage')): ?>
    <a class="btn" href="<?= h(ideare_root_url('staff/admin/materials.php')) ?>">Manage materials</a>
    <?php endif; ?>
</div>

<div class="cost-layout">
<section class="staff-panel cost-builder">
    <div class="section-title">
        <div>
            <p class="eyebrow">Calculation</p>
            <h2>Project details</h2>
        </div>
    </div>

    <div class="form-grid">
        <label>
            Calculation name
            <input id="calcName" value="New Material Calculation">
        </label>

        <label>
            Link to design
            <select id="designSelect">
                <option value="">No linked design</option>
                <?php foreach($designs as $d): ?>
                <option
                    value="<?= (int)$d['id'] ?>"
                    data-code="<?= h($d['design_code']) ?>"
                    data-customer="<?= h($d['customer_name']??'') ?>"
                >
                    <?= h($d['design_code'].' — '.($d['design_name']?:'Untitled')) ?>
                </option>
                <?php endforeach; ?>
            </select>
        </label>

        <label>
            Customer
            <input id="calcCustomer" placeholder="Optional">
        </label>
    </div>

    <label>
        Notes
        <textarea id="calcNotes" rows="2" placeholder="Internal costing notes..."></textarea>
    </label>
</section>

<section class="staff-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Materials</p>
            <h2>Add material</h2>
        </div>
    </div>

    <div class="material-add-grid">
        <label>
            Material
            <select id="materialSelect">
                <?php foreach($materials as $m): ?>
                <option
                    value="<?= (int)$m['id'] ?>"
                    data-name="<?= h($m['name']) ?>"
                    data-unit="<?= h($m['unit_type']) ?>"
                    data-cost="<?= h($m['default_unit_cost']) ?>"
                    data-waste="<?= h($m['default_waste_percent']) ?>"
                >
                    <?= h(($m['category_name']?$m['category_name'].' · ':'').$m['name']) ?>
                </option>
                <?php endforeach; ?>
            </select>
        </label>

        <label>
            Available size
            <select id="materialSize"></select>
        </label>

        <label>
            Quantity
            <input id="materialQty" type="number" step=".001" min="0" value="1">
        </label>

        <label>
            Unit cost
            <input id="materialUnitCost" type="number" step=".01" min="0">
        </label>

        <label>
            Waste %
            <input id="materialWaste" type="number" step=".01" min="0" value="0">
        </label>

        <button type="button" class="btn primary material-add-btn" id="addMaterialBtn">
            Add material
        </button>
    </div>

    <div id="sheetPartEditor" class="sheet-part-editor" hidden>
        <div class="section-title compact">
            <div>
                <p class="eyebrow">Sheet Parts</p>
                <h3>Parts to cut from this sheet material</h3>
            </div>
            <button type="button" class="btn" id="addPartBtn">Add part</button>
        </div>

        <p class="muted small-copy">
            The first version estimates sheet requirement from total panel area plus waste allowance.
            A future optimizer can calculate the actual cutting layout.
        </p>

        <div id="partRows"></div>
    </div>
</section>

<section class="staff-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Estimate</p>
            <h2>Material summary</h2>
        </div>
        <button type="button" class="btn" id="clearMaterialsBtn">Clear</button>
    </div>

    <div class="table-panel">
        <table class="cost-table">
            <thead>
                <tr>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Base Cost</th>
                    <th>Waste</th>
                    <th>Total</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="materialRows">
                <tr id="materialEmptyRow">
                    <td colspan="7" class="empty-text">No materials added yet.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="cost-totals">
        <div>
            <span>Material cost</span>
            <strong id="materialSubtotal">RM 0.00</strong>
        </div>
        <div>
            <span>Waste allowance</span>
            <strong id="wasteSubtotal">RM 0.00</strong>
        </div>
        <div class="grand">
            <span>Total estimated cost</span>
            <strong id="materialGrandTotal">RM 0.00</strong>
        </div>
    </div>

    <form method="post" id="saveMaterialForm">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="save_calculation">
        <input type="hidden" name="payload" id="materialPayload">
        <button class="btn primary" type="submit">Save material calculation</button>
    </form>
</section>
</div>

<section class="staff-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Saved</p>
            <h2>Recent calculations</h2>
        </div>
    </div>

    <div class="table-panel">
        <table>
            <thead>
                <tr>
                    <th>Calculation</th>
                    <th>Customer</th>
                    <th>Design</th>
                    <th>Material</th>
                    <th>Waste</th>
                    <th>Total</th>
                    <th>Created by</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach($recent as $r): ?>
                <tr>
                    <td>
                        <b><?= h($r['calculation_code']) ?></b>
                        <small><?= h($r['calculation_name']) ?></small>
                    </td>
                    <td><?= h($r['customer_name']?:'—') ?></td>
                    <td><?= h($r['design_code']?:'—') ?></td>
                    <td><?= money($r['total_material_cost']) ?></td>
                    <td><?= money($r['total_waste_cost']) ?></td>
                    <td><b><?= money($r['total_cost']) ?></b></td>
                    <td><?= h(trim($r['creator_name'])?:'—') ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
</main>

<script>
window.IDEARE_MATERIALS = <?= json_encode($materials, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) ?>;
window.IDEARE_MATERIAL_SIZES = <?= json_encode($sizes, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) ?>;
</script>
<script src="<?= h(ideare_root_url('assets/js/material-calculator.js')) ?>"></script>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
