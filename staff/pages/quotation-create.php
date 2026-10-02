<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_permission('quotation.create');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();

function setting_value(PDO $pdo,string $key,string $default=''): string {
    $s=$pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key=? LIMIT 1");
    $s->execute([$key]);
    $v=$s->fetchColumn();
    return $v!==false?(string)$v:$default;
}

if($_SERVER['REQUEST_METHOD']==='POST'){
    $payload=json_decode($_POST['payload']??'',true);

    if(!is_array($payload) || empty($payload['customer_name'])){
        flash('error','Customer name is required.');
        staff_redirect('staff/pages/quotation-create.php');
    }

    $pdo->beginTransaction();

    try{
        $prefix=setting_value($pdo,'quotation_prefix','Q');
        $code=$prefix.'-'.date('Ymd-His');

        $stmt=$pdo->prepare("
            INSERT INTO quotations
            (
                quotation_code,
                design_id,
                design_code,
                material_calculation_id,
                customer_name,
                customer_email,
                customer_phone,
                project_name,
                project_type,
                quotation_date,
                valid_until,
                status,
                direct_cost,
                waste_cost,
                overhead_amount,
                internal_cost,
                markup_type,
                markup_value,
                markup_amount,
                selling_price_before_discount,
                discount_type,
                discount_value,
                discount_amount,
                subtotal,
                tax_name,
                tax_percent,
                tax_amount,
                final_total,
                internal_notes,
                customer_notes,
                terms_and_conditions,
                created_by
            )
            VALUES(
                ?,?,?,?,?,?,?,?,?,?,?,
                'draft',
                ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )
        ");

        $stmt->execute([
            $code,
            !empty($payload['design_id']) ? (int)$payload['design_id'] : null,
            $payload['design_code'] ?: null,
            !empty($payload['material_calculation_id']) ? (int)$payload['material_calculation_id'] : null,
            $payload['customer_name'],
            $payload['customer_email'] ?: null,
            $payload['customer_phone'] ?: null,
            $payload['project_name'] ?: null,
            $payload['project_type'] ?: null,
            $payload['quotation_date'],
            $payload['valid_until'] ?: null,
            (float)$payload['direct_cost'],
            (float)$payload['waste_cost'],
            (float)$payload['overhead_amount'],
            (float)$payload['internal_cost'],
            $payload['markup_type'],
            (float)$payload['markup_value'],
            (float)$payload['markup_amount'],
            (float)$payload['selling_price_before_discount'],
            $payload['discount_type'],
            (float)$payload['discount_value'],
            (float)$payload['discount_amount'],
            (float)$payload['subtotal'],
            $payload['tax_name'] ?: null,
            (float)$payload['tax_percent'],
            (float)$payload['tax_amount'],
            (float)$payload['final_total'],
            $payload['internal_notes'] ?: null,
            $payload['customer_notes'] ?: null,
            $payload['terms_and_conditions'] ?: null,
            $staff['id']
        ]);

        $quoteId=(int)$pdo->lastInsertId();

        $itemStmt=$pdo->prepare("
            INSERT INTO quotation_items
            (
                quotation_id,
                item_type,
                description,
                quantity,
                unit,
                unit_price,
                amount,
                internal_unit_cost,
                internal_total_cost,
                show_on_customer_quote,
                sort_order,
                notes
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
        ");

        foreach($payload['items'] as $idx=>$item){
            $itemStmt->execute([
                $quoteId,
                $item['item_type'],
                $item['description'],
                (float)$item['quantity'],
                $item['unit'] ?: null,
                (float)$item['unit_price'],
                (float)$item['amount'],
                (float)$item['internal_unit_cost'],
                (float)$item['internal_total_cost'],
                !empty($item['show_on_customer_quote'])?1:0,
                $idx+1,
                $item['notes'] ?: null
            ]);
        }

        $chargeStmt=$pdo->prepare("
            INSERT INTO quotation_charges
            (
                quotation_id,
                charge_code,
                charge_name,
                charge_category,
                calculation_type,
                rate,
                base_amount,
                amount,
                internal_only,
                taxable,
                sort_order,
                notes
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
        ");

        foreach($payload['charges'] as $idx=>$charge){
            $chargeStmt->execute([
                $quoteId,
                $charge['charge_code'] ?: null,
                $charge['charge_name'],
                $charge['charge_category'],
                $charge['calculation_type'],
                (float)$charge['rate'],
                (float)$charge['base_amount'],
                (float)$charge['amount'],
                !empty($charge['internal_only'])?1:0,
                !empty($charge['taxable'])?1:0,
                $idx+1,
                $charge['notes'] ?: null
            ]);
        }

        $pdo->prepare("
            INSERT INTO quotation_status_history
            (quotation_id,old_status,new_status,changed_by,notes)
            VALUES(?,NULL,'draft',?,'Quotation created')
        ")->execute([$quoteId,$staff['id']]);

        $pdo->commit();

        log_activity(
            'quotation.create',
            'quotation',
            (string)$quoteId,
            'Created quotation '.$code
        );

        flash('success','Quotation '.$code.' created.');
        staff_redirect('staff/pages/quotation-view.php?id='.$quoteId);

    }catch(Throwable $e){
        if($pdo->inTransaction()) $pdo->rollBack();
        flash('error','Could not create quotation: '.$e->getMessage());
        staff_redirect('staff/pages/quotation-create.php');
    }
}

$designs=[];
try{
    $designs=$pdo->query("
        SELECT
            id,
            design_code,
            design_name,
            customer_name,
            customer_email,
            customer_phone,
            room_type,
            estimated_price
        FROM designs
        ORDER BY created_at DESC
        LIMIT 100
    ")->fetchAll();
}catch(Throwable $e){}

$calculations=$pdo->query("
    SELECT *
    FROM material_calculations
    WHERE status IN('calculated','approved')
    ORDER BY created_at DESC
    LIMIT 100
")->fetchAll();

$presets=$pdo->query("
    SELECT *
    FROM quotation_charge_presets
    WHERE is_active=1
    ORDER BY sort_order,charge_name
")->fetchAll();

$defaultMarkup=(float)setting_value($pdo,'quotation_default_markup_percent','25');
$defaultOverhead=(float)setting_value($pdo,'quotation_default_overhead_percent','8');
$defaultTax=(float)setting_value($pdo,'quotation_default_tax_percent','0');
$validDays=max(1,(int)setting_value($pdo,'quotation_valid_days','30'));

$pageTitle='Create Quotation';
require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content quotation-page">
<div class="page-head">
    <div>
        <p class="eyebrow">Sales & Costing</p>
        <h1>Create quotation</h1>
        <p class="muted">Build a customer quotation while keeping internal cost and margin details protected by permissions.</p>
    </div>

    <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotations.php')) ?>">Back to quotations</a>
</div>

<div class="quote-builder-grid">
<section class="staff-panel">
    <p class="eyebrow">Customer</p>
    <h2>Project details</h2>

    <div class="form-grid">
        <label>
            Link saved design
            <select id="quoteDesign">
                <option value="">No linked design</option>
                <?php foreach($designs as $d): ?>
                <option
                    value="<?= (int)$d['id'] ?>"
                    data-code="<?= h($d['design_code']) ?>"
                    data-customer="<?= h($d['customer_name']??'') ?>"
                    data-email="<?= h($d['customer_email']??'') ?>"
                    data-phone="<?= h($d['customer_phone']??'') ?>"
                    data-room="<?= h($d['room_type']??'') ?>"
                    data-price="<?= h($d['estimated_price']??'0') ?>"
                >
                    <?= h($d['design_code'].' — '.($d['design_name']?:'Untitled')) ?>
                </option>
                <?php endforeach; ?>
            </select>
        </label>

        <label>
            Material calculation
            <select id="quoteMaterialCalc">
                <option value="">No saved material calculation</option>
                <?php foreach($calculations as $c): ?>
                <option
                    value="<?= (int)$c['id'] ?>"
                    data-material="<?= h($c['total_material_cost']) ?>"
                    data-waste="<?= h($c['total_waste_cost']) ?>"
                    data-total="<?= h($c['total_cost']) ?>"
                    data-customer="<?= h($c['customer_name']??'') ?>"
                    data-design-code="<?= h($c['design_code']??'') ?>"
                >
                    <?= h($c['calculation_code'].' — '.$c['calculation_name']) ?>
                </option>
                <?php endforeach; ?>
            </select>
        </label>

        <label>
            Customer name
            <input id="quoteCustomerName" required>
        </label>

        <label>
            Customer email
            <input id="quoteCustomerEmail" type="email">
        </label>

        <label>
            Customer phone
            <input id="quoteCustomerPhone">
        </label>

        <label>
            Project name
            <input id="quoteProjectName" value="Cabinet Project">
        </label>

        <label>
            Project type
            <select id="quoteProjectType">
                <option>Kitchen</option>
                <option>Wardrobe</option>
                <option>TV Cabinet</option>
                <option>Vanity</option>
                <option>Storage</option>
                <option>Other</option>
            </select>
        </label>

        <label>
            Quotation date
            <input id="quoteDate" type="date" value="<?= h(date('Y-m-d')) ?>">
        </label>

        <label>
            Valid until
            <input id="quoteValidUntil" type="date" value="<?= h(date('Y-m-d',strtotime('+'.$validDays.' days'))) ?>">
        </label>
    </div>
</section>

<section class="staff-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Customer items</p>
            <h2>Quotation lines</h2>
        </div>
        <button class="btn" type="button" id="addQuoteItemBtn">Add item</button>
    </div>

    <div id="quoteItemRows"></div>
</section>

<section class="staff-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Additional charges</p>
            <h2>Charges</h2>
        </div>
        <button class="btn" type="button" id="addChargeBtn">Add charge</button>
    </div>

    <div class="charge-preset-bar">
        <?php foreach($presets as $p): ?>
        <button
            type="button"
            class="charge-preset"
            data-preset='<?= h(json_encode($p,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)) ?>'
        >
            + <?= h($p['charge_name']) ?>
        </button>
        <?php endforeach; ?>
    </div>

    <div id="quoteChargeRows"></div>
</section>

<?php if(can('quotation.view_cost') || can('quotation.edit_margin')): ?>
<section class="staff-panel internal-cost-card">
    <p class="eyebrow">Internal only</p>
    <h2>Costing & margin</h2>

    <div class="quote-cost-grid">
        <label>
            Overhead %
            <input id="quoteOverheadPct" type="number" step=".01" min="0" value="<?= h((string)$defaultOverhead) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>>
        </label>

        <label>
            Pricing method
            <select id="quoteMarkupType" <?= can('quotation.edit_margin')?'':'disabled' ?>>
                <option value="percentage">Markup %</option>
                <option value="margin">Target gross margin %</option>
                <option value="fixed">Fixed profit amount</option>
            </select>
        </label>

        <label>
            Pricing value
            <input id="quoteMarkupValue" type="number" step=".01" min="0" value="<?= h((string)$defaultMarkup) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>>
        </label>

        <?php if(can('quotation.discount')): ?>
        <label>
            Discount type
            <select id="quoteDiscountType">
                <option value="none">No discount</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
            </select>
        </label>

        <label>
            Discount value
            <input id="quoteDiscountValue" type="number" step=".01" min="0" value="0">
        </label>
        <?php else: ?>
        <input id="quoteDiscountType" type="hidden" value="none">
        <input id="quoteDiscountValue" type="hidden" value="0">
        <?php endif; ?>
    </div>
</section>
<?php else: ?>
<input id="quoteOverheadPct" type="hidden" value="<?= h((string)$defaultOverhead) ?>">
<input id="quoteMarkupType" type="hidden" value="percentage">
<input id="quoteMarkupValue" type="hidden" value="<?= h((string)$defaultMarkup) ?>">
<input id="quoteDiscountType" type="hidden" value="none">
<input id="quoteDiscountValue" type="hidden" value="0">
<?php endif; ?>

<section class="staff-panel">
    <p class="eyebrow">Tax & notes</p>
    <h2>Finishing details</h2>

    <div class="form-grid">
        <label>
            Tax name
            <input id="quoteTaxName" value="Tax">
        </label>

        <label>
            Tax %
            <input id="quoteTaxPct" type="number" step=".01" min="0" value="<?= h((string)$defaultTax) ?>">
        </label>
    </div>

    <label>
        Customer notes
        <textarea id="quoteCustomerNotes" rows="3" placeholder="Notes that may be shown to the customer..."></textarea>
    </label>

    <?php if(can('quotation.view_cost')): ?>
    <label>
        Internal notes
        <textarea id="quoteInternalNotes" rows="3" placeholder="Internal notes. Not shown on customer quotation."></textarea>
    </label>
    <?php else: ?>
    <input id="quoteInternalNotes" type="hidden" value="">
    <?php endif; ?>

    <label>
        Terms & conditions
        <textarea id="quoteTerms" rows="5">Quotation valid until the date shown. Final measurements and specifications are subject to site verification. Changes to scope may affect pricing.</textarea>
    </label>
</section>
</div>

<aside class="quote-summary staff-panel">
    <p class="eyebrow">Live total</p>
    <h2>Quotation summary</h2>

    <?php if(can('quotation.view_cost')): ?>
    <div class="summary-line">
        <span>Direct internal cost</span>
        <strong id="summaryDirectCost">RM 0.00</strong>
    </div>

    <div class="summary-line">
        <span>Waste cost</span>
        <strong id="summaryWasteCost">RM 0.00</strong>
    </div>

    <div class="summary-line">
        <span>Overhead</span>
        <strong id="summaryOverhead">RM 0.00</strong>
    </div>

    <div class="summary-line internal-total">
        <span>Total internal cost</span>
        <strong id="summaryInternalCost">RM 0.00</strong>
    </div>

    <?php if(can('quotation.view_margin')): ?>
    <div class="summary-line">
        <span>Profit / markup</span>
        <strong id="summaryMarkup">RM 0.00</strong>
    </div>
    <?php endif; ?>
    <?php endif; ?>

    <div class="summary-line">
        <span>Selling price</span>
        <strong id="summarySelling">RM 0.00</strong>
    </div>

    <div class="summary-line">
        <span>Discount</span>
        <strong id="summaryDiscount">RM 0.00</strong>
    </div>

    <div class="summary-line">
        <span>Subtotal</span>
        <strong id="summarySubtotal">RM 0.00</strong>
    </div>

    <div class="summary-line">
        <span>Tax</span>
        <strong id="summaryTax">RM 0.00</strong>
    </div>

    <div class="summary-line quote-grand">
        <span>Final quotation</span>
        <strong id="summaryFinal">RM 0.00</strong>
    </div>

    <form method="post" id="saveQuoteForm">
        <?= csrf_field() ?>
        <input type="hidden" name="payload" id="quotePayload">
        <button class="btn primary wide" type="submit">Save quotation</button>
    </form>
</aside>
</main>

<script>
window.IDEARE_QUOTE_CAN_VIEW_COST = <?= can('quotation.view_cost')?'true':'false' ?>;
</script>
<script src="<?= h(ideare_root_url('assets/js/quotation-builder.js')) ?>"></script>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
