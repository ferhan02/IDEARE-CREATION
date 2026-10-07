<?php
require_once __DIR__.'/../../includes/staff/operations.php';
require_permission('quotation.create');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();

function quotation_setting_value(PDO $pdo,string $key,string $default=''): string
{
    $s=$pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key=? LIMIT 1");
    $s->execute([$key]);
    $v=$s->fetchColumn();
    return $v!==false?(string)$v:$default;
}

$requiredV2Tables=['quotation_groups','quotation_sections'];
foreach($requiredV2Tables as $requiredTable){
    if(!db_table_exists($pdo,$requiredTable)){
        $pageTitle='Create Quotation';
        require __DIR__.'/../../includes/staff/header.php';
        ?>
        <main class="staff-content quotation-page">
            <section class="staff-panel quotation-db-warning">
                <p class="eyebrow">Database update required</p>
                <h1>Quotation Centre V2 is not ready yet</h1>
                <p class="muted">Apply the Quotation Centre V2 SQL migration first, then return here.</p>
                <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Back to Quotation Centre</a>
            </section>
        </main>
        <?php
        require __DIR__.'/../../includes/staff/footer.php';
        exit;
    }
}

if($_SERVER['REQUEST_METHOD']==='POST'){
    $payload=json_decode($_POST['payload']??'',true);

    if(!is_array($payload)){
        flash('error','The quotation data could not be read. Please try again.');
        staff_redirect('staff/pages/quotation-create.php');
    }

    $customerId=(int)($payload['customer_id']??0);
    $projectId=(int)($payload['project_id']??0);
    $measurementId=(int)($payload['site_measurement_id']??0);
    $salespersonId=(int)($payload['salesperson_id']??0);
    $designId=(int)($payload['design_id']??0);
    $materialCalculationId=(int)($payload['material_calculation_id']??0);

    if($customerId<=0){
        flash('error','Choose a customer from CRM before saving the quotation.');
        staff_redirect('staff/pages/quotation-create.php');
    }

    try{
        $customerStmt=$pdo->prepare("SELECT * FROM customers WHERE id=? LIMIT 1");
        $customerStmt->execute([$customerId]);
        $customer=$customerStmt->fetch(PDO::FETCH_ASSOC);

        if(!$customer){
            throw new RuntimeException('The selected customer no longer exists.');
        }

        $project=null;
        if($projectId>0){
            $projectStmt=$pdo->prepare("SELECT * FROM projects WHERE id=? AND customer_id=? LIMIT 1");
            $projectStmt->execute([$projectId,$customerId]);
            $project=$projectStmt->fetch(PDO::FETCH_ASSOC);

            if(!$project){
                throw new RuntimeException('The selected project does not belong to this customer.');
            }
        }

        $measurement=null;
        if($measurementId>0){
            if(!$project){
                throw new RuntimeException('Choose a linked project before selecting a site measurement.');
            }

            $measurementStmt=$pdo->prepare("SELECT * FROM site_measurements WHERE id=? AND project_id=? LIMIT 1");
            $measurementStmt->execute([$measurementId,$projectId]);
            $measurement=$measurementStmt->fetch(PDO::FETCH_ASSOC);

            if(!$measurement){
                throw new RuntimeException('The selected site measurement does not belong to this project.');
            }
        }

        $design=null;
        if($designId>0){
            $designStmt=$pdo->prepare("SELECT id,design_code,customer_id,project_id FROM designs WHERE id=? LIMIT 1");
            $designStmt->execute([$designId]);
            $design=$designStmt->fetch(PDO::FETCH_ASSOC);

            if(!$design){
                throw new RuntimeException('The selected cabinet design no longer exists.');
            }

            if(!empty($design['customer_id']) && (int)$design['customer_id']!==$customerId){
                throw new RuntimeException('The selected cabinet design belongs to a different customer.');
            }

            if($projectId>0 && !empty($design['project_id']) && (int)$design['project_id']!==$projectId){
                throw new RuntimeException('The selected cabinet design belongs to a different project.');
            }
        }

        $materialCalculation=null;
        if($materialCalculationId>0){
            $calcStmt=$pdo->prepare("SELECT id,calculation_code,customer_id,project_id FROM material_calculations WHERE id=? LIMIT 1");
            $calcStmt->execute([$materialCalculationId]);
            $materialCalculation=$calcStmt->fetch(PDO::FETCH_ASSOC);

            if(!$materialCalculation){
                throw new RuntimeException('The selected material calculation no longer exists.');
            }

            if(!empty($materialCalculation['customer_id']) && (int)$materialCalculation['customer_id']!==$customerId){
                throw new RuntimeException('The selected material calculation belongs to a different customer.');
            }

            if($projectId>0 && !empty($materialCalculation['project_id']) && (int)$materialCalculation['project_id']!==$projectId){
                throw new RuntimeException('The selected material calculation belongs to a different project.');
            }
        }

        if($salespersonId<=0){
            $salespersonId=(int)$staff['id'];
        }

        $salespersonStmt=$pdo->prepare("SELECT id FROM staff WHERE id=? AND is_active=1 LIMIT 1");
        $salespersonStmt->execute([$salespersonId]);
        if(!$salespersonStmt->fetchColumn()){
            $salespersonId=(int)$staff['id'];
        }

        $leadId=$project && !empty($project['lead_id'])?(int)$project['lead_id']:null;
        if(!$leadId){
            $leadStmt=$pdo->prepare("SELECT id FROM leads WHERE customer_id=? ORDER BY created_at DESC,id DESC LIMIT 1");
            $leadStmt->execute([$customerId]);
            $leadValue=$leadStmt->fetchColumn();
            $leadId=$leadValue!==false?(int)$leadValue:null;
        }

        $snapshotName=trim((string)($payload['customer_name']??'')) ?: (string)$customer['name'];
        $snapshotEmail=trim((string)($payload['customer_email']??'')) ?: ($customer['email']??null);
        $snapshotPhone=trim((string)($payload['customer_phone']??'')) ?: ($customer['phone']??null);
        $snapshotBilling=trim((string)($payload['customer_billing_address_snapshot']??'')) ?: ($customer['billing_address']??null);
        $snapshotCustomerSite=trim((string)($payload['customer_site_address_snapshot']??'')) ?: ($customer['site_address']??null);
        $snapshotProjectName=trim((string)($payload['project_name']??'')) ?: ($project['name']??'General quotation');
        $snapshotProjectType=trim((string)($payload['project_type']??'')) ?: ($project['project_type']??null);
        $snapshotSiteAddress=trim((string)($payload['site_address_snapshot']??'')) ?: ($project['site_address']??$customer['site_address']??null);
        $referenceNo=trim((string)($payload['reference_no']??'')) ?: null;
        $quotationTitle=trim((string)($payload['quotation_title']??'')) ?: 'Interior Design Works';

        $items=is_array($payload['items']??null)?$payload['items']:[];
        $charges=is_array($payload['charges']??null)?$payload['charges']:[];

        if(!$items && !$charges){
            throw new RuntimeException('Add at least one quotation item or charge.');
        }

        $directCost=(float)($payload['direct_cost']??0);
        $wasteCost=(float)($payload['waste_cost']??0);
        $overheadAmount=(float)($payload['overhead_amount']??0);
        $internalCost=(float)($payload['internal_cost']??0);
        $sellingBeforeDiscount=(float)($payload['selling_price_before_discount']??0);
        $subtotal=(float)($payload['subtotal']??0);
        $taxAmount=(float)($payload['tax_amount']??0);
        $finalTotal=(float)($payload['final_total']??0);
        $grossProfit=$subtotal-$internalCost;
        $grossMargin=$subtotal>0?($grossProfit/$subtotal)*100:0;

        $pdo->beginTransaction();

        $prefix=quotation_setting_value($pdo,'quotation_prefix','QT');
        $code=$prefix.'-'.date('Ymd-His').'-'.str_pad((string)random_int(1,99),2,'0',STR_PAD_LEFT);

        $stmt=$pdo->prepare("
            INSERT INTO quotations
            (
                branch_id,
                customer_id,
                project_id,
                lead_id,
                site_measurement_id,
                salesperson_id,
                quotation_code,
                design_id,
                design_code,
                material_calculation_id,
                customer_name,
                customer_email,
                customer_phone,
                customer_code_snapshot,
                customer_billing_address_snapshot,
                customer_site_address_snapshot,
                project_name,
                project_code_snapshot,
                project_type,
                site_address_snapshot,
                reference_no,
                quotation_title,
                currency,
                quotation_date,
                valid_until,
                status,
                direct_cost,
                waste_cost,
                overhead_amount,
                contingency_amount,
                internal_cost,
                markup_type,
                markup_value,
                markup_amount,
                selling_price_before_discount,
                standard_selling_price,
                commercial_adjustment_amount,
                foc_retail_value,
                discount_type,
                discount_value,
                discount_amount,
                subtotal,
                tax_name,
                tax_percent,
                tax_amount,
                final_total,
                gross_profit,
                gross_margin_percent,
                internal_notes,
                customer_notes,
                terms_and_conditions,
                created_by,
                last_revised_at
            )
            VALUES(
                ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',
                ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW()
            )
        ");

        $stmt->execute([
            $staff['branch_id']??null,
            $customerId,
            $projectId?:null,
            $leadId,
            $measurementId?:null,
            $salespersonId,
            $code,
            $designId?:null,
            $design['design_code']??(trim((string)($payload['design_code']??''))?:null),
            $materialCalculationId?:null,
            $snapshotName,
            $snapshotEmail?:null,
            $snapshotPhone?:null,
            $customer['customer_code']??null,
            $snapshotBilling?:null,
            $snapshotCustomerSite?:null,
            $snapshotProjectName,
            $project['project_code']??null,
            $snapshotProjectType?:null,
            $snapshotSiteAddress?:null,
            $referenceNo,
            $quotationTitle,
            'MYR',
            $payload['quotation_date']??date('Y-m-d'),
            !empty($payload['valid_until'])?$payload['valid_until']:null,
            $directCost,
            $wasteCost,
            $overheadAmount,
            0,
            $internalCost,
            $payload['markup_type']??'percentage',
            (float)($payload['markup_value']??0),
            (float)($payload['markup_amount']??0),
            $sellingBeforeDiscount,
            $sellingBeforeDiscount,
            0,
            0,
            $payload['discount_type']??'none',
            (float)($payload['discount_value']??0),
            (float)($payload['discount_amount']??0),
            $subtotal,
            trim((string)($payload['tax_name']??''))?:null,
            (float)($payload['tax_percent']??0),
            $taxAmount,
            $finalTotal,
            $grossProfit,
            $grossMargin,
            trim((string)($payload['internal_notes']??''))?:null,
            trim((string)($payload['customer_notes']??''))?:null,
            trim((string)($payload['terms_and_conditions']??''))?:null,
            $staff['id']
        ]);

        $quoteId=(int)$pdo->lastInsertId();

        $groupStmt=$pdo->prepare("
            INSERT INTO quotation_groups
            (quotation_id,group_code,group_name,group_type,pricing_mode,item_subtotal,internal_cost,final_total,sort_order)
            VALUES(?,?,?,?,?,?,?,?,?)
        ");
        $groupStmt->execute([
            $quoteId,
            'MAIN',
            'Main Works',
            'standard',
            'itemized',
            $sellingBeforeDiscount,
            $internalCost,
            $sellingBeforeDiscount,
            1
        ]);
        $groupId=(int)$pdo->lastInsertId();

        $sectionStmt=$pdo->prepare("
            INSERT INTO quotation_sections
            (quotation_id,group_id,section_code,section_name,section_subtotal,internal_cost,final_total,sort_order)
            VALUES(?,?,?,?,?,?,?,?)
        ");
        $sectionStmt->execute([
            $quoteId,
            $groupId,
            'A',
            'General Works',
            $sellingBeforeDiscount,
            $internalCost,
            $sellingBeforeDiscount,
            1
        ]);
        $sectionId=(int)$pdo->lastInsertId();

        $itemStmt=$pdo->prepare("
            INSERT INTO quotation_items
            (
                quotation_id,
                section_id,
                item_type,
                pricing_method,
                description,
                quantity,
                unit,
                unit_price,
                amount,
                standard_unit_price,
                standard_amount,
                internal_unit_cost,
                internal_total_cost,
                internal_line_cost,
                show_on_customer_quote,
                taxable,
                source_type,
                sort_order,
                notes
            )
            VALUES(?,?,?,'quantity',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ");

        foreach($items as $idx=>$item){
            $itemType=(string)($item['item_type']??'other');
            $allowedItemTypes=['material','cabinet','countertop','hardware','labour','installation','delivery','electrical','plumbing','ceiling','renovation','door_glass','service','subcontractor','other'];
            if(!in_array($itemType,$allowedItemTypes,true)) $itemType='other';

            $quantity=(float)($item['quantity']??0);
            $unitPrice=(float)($item['unit_price']??0);
            $amount=(float)($item['amount']??($quantity*$unitPrice));
            $internalUnitCost=(float)($item['internal_unit_cost']??0);
            $internalTotal=(float)($item['internal_total_cost']??($quantity*$internalUnitCost));

            $itemStmt->execute([
                $quoteId,
                $sectionId,
                $itemType,
                trim((string)($item['description']??''))?:'Quotation item',
                $quantity,
                trim((string)($item['unit']??''))?:null,
                $unitPrice,
                $amount,
                $unitPrice,
                $amount,
                $internalUnitCost,
                $internalTotal,
                $internalTotal,
                !empty($item['show_on_customer_quote'])?1:0,
                1,
                'manual',
                $idx+1,
                trim((string)($item['notes']??''))?:null
            ]);
        }

        $chargeStmt=$pdo->prepare("
            INSERT INTO quotation_charges
            (
                quotation_id,
                group_id,
                section_id,
                charge_code,
                charge_name,
                charge_category,
                calculation_type,
                calculation_base,
                rate,
                base_amount,
                amount,
                internal_cost_amount,
                customer_amount,
                internal_only,
                is_internal_only,
                taxable,
                source_type,
                sort_order,
                notes
            )
            VALUES(?,?,?,?,?,?,?,'manual',?,?,?,?,?,?,?,?,?,?,?)
        ");

        foreach($charges as $idx=>$charge){
            $category=(string)($charge['charge_category']??'other');
            $allowedCategories=['labour','installation','delivery','transport','measurement','design','subcontractor','waste','overhead','contingency','consumables','machine','disposal','parking_toll','surcharge','other'];
            if(!in_array($category,$allowedCategories,true)) $category='other';

            $calcType=(string)($charge['calculation_type']??'fixed');
            $allowedCalculationTypes=['fixed','percentage','per_unit','per_hour','per_day','per_trip'];
            if(!in_array($calcType,$allowedCalculationTypes,true)) $calcType='fixed';

            $amount=(float)($charge['amount']??0);
            $internalOnly=!empty($charge['internal_only']);

            $chargeStmt->execute([
                $quoteId,
                $groupId,
                $sectionId,
                trim((string)($charge['charge_code']??''))?:null,
                trim((string)($charge['charge_name']??''))?:'Additional Charge',
                $category,
                $calcType,
                (float)($charge['rate']??0),
                (float)($charge['base_amount']??0),
                $amount,
                $internalOnly?$amount:0,
                $internalOnly?0:$amount,
                $internalOnly?1:0,
                $internalOnly?1:0,
                !empty($charge['taxable'])?1:0,
                'manual',
                $idx+1,
                trim((string)($charge['notes']??''))?:null
            ]);
        }

        $pdo->prepare("
            INSERT INTO quotation_status_history
            (quotation_id,old_status,new_status,changed_by,notes)
            VALUES(?,NULL,'draft',?,'Quotation created')
        ")->execute([$quoteId,$staff['id']]);

        if($project){
            if(in_array($project['status'],['consultation','measurement','design'],true)){
                $pdo->prepare("UPDATE projects SET status='quotation' WHERE id=?")->execute([$projectId]);
            }

            project_activity(
                $pdo,
                $projectId,
                'quotation',
                'Quotation created',
                $code.' created for '.$snapshotName
            );
        }

        $pdo->commit();

        log_activity('quotation.create','quotation',(string)$quoteId,'Created quotation '.$code);
        flash('success','Quotation '.$code.' created and linked to the selected CRM records.');
        staff_redirect('staff/pages/quotation-view.php?id='.$quoteId);
    }catch(Throwable $e){
        if($pdo->inTransaction()) $pdo->rollBack();
        flash('error','Could not create quotation: '.$e->getMessage());

        $redirect='staff/pages/quotation-create.php';
        if($projectId>0) $redirect.='?project_id='.$projectId;
        elseif($customerId>0) $redirect.='?customer_id='.$customerId;
        staff_redirect($redirect);
    }
}

$customers=$pdo->query("
    SELECT
        id,customer_code,name,phone,email,billing_address,site_address,city,state,postcode,
        assigned_to,status,interested_service
    FROM customers
    WHERE status<>'blacklisted'
    ORDER BY name
")->fetchAll(PDO::FETCH_ASSOC);

$projects=$pdo->query("
    SELECT
        p.id,p.customer_id,p.project_code,p.name,p.project_type,p.status,p.assigned_manager,
        p.site_address,p.lead_id,p.estimated_value,p.updated_at
    FROM projects p
    WHERE p.status<>'cancelled'
    ORDER BY p.updated_at DESC,p.id DESC
")->fetchAll(PDO::FETCH_ASSOC);

$measurements=$pdo->query("
    SELECT
        sm.id,sm.project_id,sm.room_name,sm.measured_at,sm.wall_a_mm,sm.wall_b_mm,sm.wall_c_mm,
        sm.wall_d_mm,sm.ceiling_height_mm,sm.window_details,sm.door_details,sm.plumbing_details,
        sm.electrical_details,sm.obstacles,sm.notes,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) measured_by_name
    FROM site_measurements sm
    LEFT JOIN staff s ON s.id=sm.measured_by
    ORDER BY sm.measured_at DESC,sm.id DESC
")->fetchAll(PDO::FETCH_ASSOC);

$designs=[];
try{
    $designs=$pdo->query("
        SELECT
            id,design_code,design_name,customer_id,project_id,customer_name,customer_email,
            customer_phone,room_type,estimated_price,status,updated_at
        FROM designs
        ORDER BY updated_at DESC,id DESC
        LIMIT 300
    ")->fetchAll(PDO::FETCH_ASSOC);
}catch(Throwable $e){}

$calculations=$pdo->query("
    SELECT
        id,calculation_code,calculation_name,customer_name,customer_id,project_id,design_id,design_code,
        status,total_material_cost,total_waste_cost,total_cost,updated_at
    FROM material_calculations
    WHERE status IN('calculated','approved')
    ORDER BY updated_at DESC,id DESC
    LIMIT 300
")->fetchAll(PDO::FETCH_ASSOC);

$presets=$pdo->query("
    SELECT *
    FROM quotation_charge_presets
    WHERE is_active=1
    ORDER BY sort_order,charge_name
")->fetchAll(PDO::FETCH_ASSOC);

$salespeople=$pdo->query("
    SELECT id,first_name,last_name,job_title,role_id
    FROM staff
    WHERE is_active=1
    ORDER BY first_name,last_name
")->fetchAll(PDO::FETCH_ASSOC);

$requestedCustomerId=(int)($_GET['customer_id']??0);
$requestedProjectId=(int)($_GET['project_id']??0);
$requestedMeasurementId=(int)($_GET['measurement_id']??0);

$projectById=[];
foreach($projects as $row) $projectById[(int)$row['id']]=$row;
$measurementById=[];
foreach($measurements as $row) $measurementById[(int)$row['id']]=$row;

if($requestedMeasurementId>0 && isset($measurementById[$requestedMeasurementId])){
    $requestedProjectId=(int)$measurementById[$requestedMeasurementId]['project_id'];
}
if($requestedProjectId>0 && isset($projectById[$requestedProjectId])){
    $requestedCustomerId=(int)$projectById[$requestedProjectId]['customer_id'];
}

$defaultMarkup=(float)quotation_setting_value($pdo,'quotation_default_markup_percent','25');
$defaultOverhead=(float)quotation_setting_value($pdo,'quotation_default_overhead_percent','8');
$defaultTax=(float)quotation_setting_value($pdo,'quotation_default_tax_percent','0');
$validDays=max(1,(int)quotation_setting_value($pdo,'quotation_valid_days','30'));

$contextPayload=[
    'customers'=>$customers,
    'projects'=>$projects,
    'measurements'=>$measurements,
    'designs'=>$designs,
    'calculations'=>$calculations,
    'preselect'=>[
        'customer_id'=>$requestedCustomerId,
        'project_id'=>$requestedProjectId,
        'measurement_id'=>$requestedMeasurementId,
    ],
    'urls'=>[
        'customer'=>ideare_root_url('staff/pages/customer-view.php?id='),
        'customer_list'=>ideare_root_url('staff/pages/customers.php'),
        'project'=>ideare_root_url('staff/pages/project-view.php?id='),
        'project_list'=>ideare_root_url('staff/pages/projects.php'),
        'measurement'=>ideare_root_url('staff/pages/site-measurements.php?project_id='),
        'measurement_list'=>ideare_root_url('staff/pages/site-measurements.php'),
    ],
];

$pageTitle='Create Quotation';
require __DIR__.'/../../includes/staff/header.php';
?>

<main class="staff-content quotation-page quotation-create-stage2">
<div class="page-head quotation-create-head">
    <div>
        <p class="eyebrow">Sales &amp; Costing</p>
        <h1>Create quotation</h1>
        <p class="muted">Start from the CRM and project records so the quotation keeps a reliable customer, project and site-measurement trail.</p>
    </div>

    <div class="actions">
        <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Back to Quotation Centre</a>
    </div>
</div>

<div class="quotation-create-progress" aria-label="Quotation build progress">
    <span class="is-done"><b>1</b> Centre foundation</span>
    <span class="is-active"><b>2</b> Customer &amp; project context</span>
    <span><b>3</b> Scope &amp; pricing</span>
    <span><b>4</b> Revisions &amp; approval</span>
    <span><b>5</b> Customer document</span>
</div>

<div class="quote-builder-grid">
<section class="staff-panel quote-context-panel">
    <div class="section-title quote-context-title">
        <div>
            <p class="eyebrow">Quotation source</p>
            <h2>Customer &amp; project</h2>
            <p class="muted">The linked CRM records remain live; the editable fields below are copied into the quotation as a historical snapshot.</p>
        </div>
        <div class="quote-context-links">
            <a id="quoteCustomerLink" class="btn" href="<?= h(ideare_root_url('staff/pages/customers.php')) ?>">Open CRM</a>
            <a id="quoteProjectLink" class="btn" href="<?= h(ideare_root_url('staff/pages/projects.php')) ?>">Open project</a>
        </div>
    </div>

    <div class="quotation-context-grid">
        <div class="quote-context-block">
            <div class="quote-context-block-head">
                <div>
                    <span class="quote-context-step">1</span>
                    <div>
                        <b>Customer</b>
                        <small id="quoteCustomerCodeLabel">Choose a CRM customer</small>
                    </div>
                </div>
            </div>

            <label>
                CRM customer <span class="required-mark">*</span>
                <select id="quoteCustomerId" required>
                    <option value="">Choose customer...</option>
                    <?php foreach($customers as $customer): ?>
                        <option value="<?= (int)$customer['id'] ?>" <?= $requestedCustomerId===(int)$customer['id']?'selected':'' ?>>
                            <?= h($customer['customer_code'].' · '.$customer['name'].($customer['phone']?' · '.$customer['phone']:'')) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>

            <div class="form-grid">
                <label>Customer name<input id="quoteCustomerName" required></label>
                <label>Customer email<input id="quoteCustomerEmail" type="email"></label>
                <label>Customer phone<input id="quoteCustomerPhone"></label>
            </div>

            <div class="two">
                <label>Billing address<textarea id="quoteCustomerBillingAddress" rows="3"></textarea></label>
                <label>Customer site address<textarea id="quoteCustomerSiteAddress" rows="3"></textarea></label>
            </div>
        </div>

        <div class="quote-context-block">
            <div class="quote-context-block-head">
                <div>
                    <span class="quote-context-step">2</span>
                    <div>
                        <b>Project</b>
                        <small id="quoteProjectCodeLabel">Optional customer-only quotation</small>
                    </div>
                </div>
            </div>

            <label>
                Linked project
                <select id="quoteProjectId">
                    <option value="">No linked project</option>
                </select>
            </label>

            <div class="form-grid">
                <label>Project name<input id="quoteProjectName" value="General quotation"></label>
                <label>Project type<input id="quoteProjectType" placeholder="Kitchen Cabinet"></label>
                <label>Site address<input id="quoteSiteAddress" placeholder="Project installation address"></label>
            </div>

            <div class="quote-context-note" id="quoteProjectStatusNote">
                Choose a project to connect this quotation to the project timeline.
            </div>
        </div>
    </div>
</section>

<section class="staff-panel quote-measurement-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Site reference</p>
            <h2>Primary site measurement</h2>
            <p class="muted">Link the room measurement that staff should treat as the main site reference for this quotation.</p>
        </div>
        <a id="quoteMeasurementLink" class="btn" href="<?= h(ideare_root_url('staff/pages/site-measurements.php')) ?>">Open measurements</a>
    </div>

    <label>
        Measurement record
        <select id="quoteMeasurementId" disabled>
            <option value="">Choose a project first</option>
        </select>
    </label>

    <div id="quoteMeasurementPreview" class="quote-measurement-preview is-empty">
        <div>
            <strong>No measurement linked</strong>
            <span>Select a project and measurement to preview the room dimensions and service notes here.</span>
        </div>
    </div>
</section>

<section class="staff-panel quote-source-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Supporting sources</p>
            <h2>Design &amp; costing references</h2>
            <p class="muted">Only sources related to the selected customer/project are shown.</p>
        </div>
    </div>

    <div class="two">
        <label>
            Link saved cabinet design
            <select id="quoteDesign">
                <option value="">No linked design</option>
            </select>
        </label>

        <label>
            Link material calculation
            <select id="quoteMaterialCalc">
                <option value="">No saved material calculation</option>
            </select>
        </label>
    </div>
</section>

<section class="staff-panel quote-document-setup">
    <div class="section-title">
        <div>
            <p class="eyebrow">Document setup</p>
            <h2>Quotation details</h2>
        </div>
        <span class="quote-owner-chip"><?= h($staff['branch_name']?:'IdeaRE') ?></span>
    </div>

    <div class="form-grid">
        <label>
            Quotation title
            <input id="quoteTitle" value="Interior Design Works" placeholder="Interior Design Works">
        </label>

        <label>
            Customer / external reference
            <input id="quoteReferenceNo" placeholder="PO, enquiry or reference no.">
        </label>

        <?php if(can('quotation.settings') || can('quotation.approve')): ?>
        <label>
            Quotation owner
            <select id="quoteSalespersonId">
                <?php foreach($salespeople as $person): ?>
                    <option value="<?= (int)$person['id'] ?>" <?= (int)$person['id']===(int)$staff['id']?'selected':'' ?>>
                        <?= h(trim($person['first_name'].' '.($person['last_name']??''))) ?><?= $person['job_title']?' · '.h($person['job_title']):'' ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </label>
        <?php else: ?>
            <input id="quoteSalespersonId" type="hidden" value="<?= (int)$staff['id'] ?>">
            <label>Quotation owner<input value="<?= h(trim($staff['first_name'].' '.($staff['last_name']??''))) ?>" readonly></label>
        <?php endif; ?>

        <label>Quotation date<input id="quoteDate" type="date" value="<?= h(date('Y-m-d')) ?>"></label>
        <label>Valid until<input id="quoteValidUntil" type="date" value="<?= h(date('Y-m-d',strtotime('+'.$validDays.' days'))) ?>"></label>
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
        <button type="button" class="charge-preset" data-preset='<?= h(json_encode($p,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)) ?>'>
            + <?= h($p['charge_name']) ?>
        </button>
        <?php endforeach; ?>
    </div>

    <div id="quoteChargeRows"></div>
</section>

<?php if(can('quotation.view_cost') || can('quotation.edit_margin')): ?>
<section class="staff-panel internal-cost-card">
    <p class="eyebrow">Internal only</p>
    <h2>Costing &amp; margin</h2>

    <div class="quote-cost-grid">
        <label>Overhead %<input id="quoteOverheadPct" type="number" step=".01" min="0" value="<?= h((string)$defaultOverhead) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>></label>
        <label>
            Pricing method
            <select id="quoteMarkupType" <?= can('quotation.edit_margin')?'':'disabled' ?>>
                <option value="percentage">Markup %</option>
                <option value="margin">Target gross margin %</option>
                <option value="fixed">Fixed profit amount</option>
            </select>
        </label>
        <label>Pricing value<input id="quoteMarkupValue" type="number" step=".01" min="0" value="<?= h((string)$defaultMarkup) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>></label>

        <?php if(can('quotation.discount')): ?>
        <label>
            Discount type
            <select id="quoteDiscountType">
                <option value="none">No discount</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
            </select>
        </label>
        <label>Discount value<input id="quoteDiscountValue" type="number" step=".01" min="0" value="0"></label>
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
    <p class="eyebrow">Tax &amp; notes</p>
    <h2>Finishing details</h2>

    <div class="form-grid">
        <label>Tax name<input id="quoteTaxName" value="Tax"></label>
        <label>Tax %<input id="quoteTaxPct" type="number" step=".01" min="0" value="<?= h((string)$defaultTax) ?>"></label>
    </div>

    <label>Customer notes<textarea id="quoteCustomerNotes" rows="3" placeholder="Notes that may be shown to the customer..."></textarea></label>

    <?php if(can('quotation.view_cost')): ?>
    <label>Internal notes<textarea id="quoteInternalNotes" rows="3" placeholder="Internal notes. Not shown on customer quotation."></textarea></label>
    <?php else: ?>
    <input id="quoteInternalNotes" type="hidden" value="">
    <?php endif; ?>

    <label>Terms &amp; conditions<textarea id="quoteTerms" rows="5">Quotation valid until the date shown. Final measurements and specifications are subject to site verification. Changes to scope may affect pricing.</textarea></label>
</section>
</div>

<aside class="quote-summary staff-panel">
    <p class="eyebrow">Live total</p>
    <h2>Quotation summary</h2>

    <div class="quote-summary-context">
        <span id="summaryCustomerContext">No customer selected</span>
        <small id="summaryProjectContext">No linked project</small>
    </div>

    <?php if(can('quotation.view_cost')): ?>
    <div class="summary-line"><span>Direct internal cost</span><strong id="summaryDirectCost">RM 0.00</strong></div>
    <div class="summary-line"><span>Waste cost</span><strong id="summaryWasteCost">RM 0.00</strong></div>
    <div class="summary-line"><span>Overhead</span><strong id="summaryOverhead">RM 0.00</strong></div>
    <div class="summary-line internal-total"><span>Total internal cost</span><strong id="summaryInternalCost">RM 0.00</strong></div>
    <?php if(can('quotation.view_margin')): ?>
    <div class="summary-line"><span>Profit / markup</span><strong id="summaryMarkup">RM 0.00</strong></div>
    <?php endif; ?>
    <?php endif; ?>

    <div class="summary-line"><span>Selling price</span><strong id="summarySelling">RM 0.00</strong></div>
    <div class="summary-line"><span>Discount</span><strong id="summaryDiscount">RM 0.00</strong></div>
    <div class="summary-line"><span>Subtotal</span><strong id="summarySubtotal">RM 0.00</strong></div>
    <div class="summary-line"><span>Tax</span><strong id="summaryTax">RM 0.00</strong></div>
    <div class="summary-line quote-grand"><span>Final quotation</span><strong id="summaryFinal">RM 0.00</strong></div>

    <form method="post" id="saveQuoteForm">
        <?= csrf_field() ?>
        <input type="hidden" name="payload" id="quotePayload">
        <button class="btn primary wide" type="submit">Save draft quotation</button>
    </form>
    <p class="quote-save-note">Stage 2 saves a linked draft. Section/rate-book pricing is added in Stage 3.</p>
</aside>
</main>

<script>
window.IDEARE_QUOTE_CAN_VIEW_COST = <?= can('quotation.view_cost')?'true':'false' ?>;
window.IDEARE_QUOTE_STAGE2 = <?= json_encode($contextPayload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) ?>;
</script>
<script src="<?= h(ideare_root_url('assets/js/quotation-context.js')) ?>"></script>
<script src="<?= h(ideare_root_url('assets/js/quotation-builder.js')) ?>"></script>

<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
