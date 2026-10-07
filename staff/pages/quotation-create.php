<?php
require_once __DIR__.'/../../includes/staff/operations.php';
require_once __DIR__.'/../../includes/staff/quotation-pricing.php';
require_once __DIR__.'/../../includes/staff/quotation-payments.php';
require_permission('quotation.create');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();

$requiredV2Tables=[
    'quotation_groups','quotation_sections','quotation_rate_items',
    'quotation_cost_components','quotation_adjustments','quotation_payment_milestones'
];
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
        $customerStmt=$pdo->prepare('SELECT * FROM customers WHERE id=? LIMIT 1');
        $customerStmt->execute([$customerId]);
        $customer=$customerStmt->fetch(PDO::FETCH_ASSOC);
        if(!$customer) throw new RuntimeException('The selected customer no longer exists.');

        $project=null;
        if($projectId>0){
            $projectStmt=$pdo->prepare('SELECT * FROM projects WHERE id=? AND customer_id=? LIMIT 1');
            $projectStmt->execute([$projectId,$customerId]);
            $project=$projectStmt->fetch(PDO::FETCH_ASSOC);
            if(!$project) throw new RuntimeException('The selected project does not belong to this customer.');
        }

        $measurement=null;
        if($measurementId>0){
            if(!$project) throw new RuntimeException('Choose a linked project before selecting a site measurement.');
            $measurementStmt=$pdo->prepare('SELECT * FROM site_measurements WHERE id=? AND project_id=? LIMIT 1');
            $measurementStmt->execute([$measurementId,$projectId]);
            $measurement=$measurementStmt->fetch(PDO::FETCH_ASSOC);
            if(!$measurement) throw new RuntimeException('The selected site measurement does not belong to this project.');
        }

        $design=null;
        if($designId>0){
            $designStmt=$pdo->prepare('SELECT id,design_code,customer_id,project_id FROM designs WHERE id=? LIMIT 1');
            $designStmt->execute([$designId]);
            $design=$designStmt->fetch(PDO::FETCH_ASSOC);
            if(!$design) throw new RuntimeException('The selected cabinet design no longer exists.');
            if(!empty($design['customer_id']) && (int)$design['customer_id']!==$customerId){
                throw new RuntimeException('The selected cabinet design belongs to a different customer.');
            }
            if($projectId>0 && !empty($design['project_id']) && (int)$design['project_id']!==$projectId){
                throw new RuntimeException('The selected cabinet design belongs to a different project.');
            }
        }

        $materialCalculation=null;
        if($materialCalculationId>0){
            $calcStmt=$pdo->prepare('SELECT id,calculation_code,customer_id,project_id,total_material_cost,total_waste_cost,total_cost FROM material_calculations WHERE id=? LIMIT 1');
            $calcStmt->execute([$materialCalculationId]);
            $materialCalculation=$calcStmt->fetch(PDO::FETCH_ASSOC);
            if(!$materialCalculation) throw new RuntimeException('The selected material calculation no longer exists.');
            if(!empty($materialCalculation['customer_id']) && (int)$materialCalculation['customer_id']!==$customerId){
                throw new RuntimeException('The selected material calculation belongs to a different customer.');
            }
            if($projectId>0 && !empty($materialCalculation['project_id']) && (int)$materialCalculation['project_id']!==$projectId){
                throw new RuntimeException('The selected material calculation belongs to a different project.');
            }
        }

        if($salespersonId<=0) $salespersonId=(int)$staff['id'];
        $salespersonStmt=$pdo->prepare('SELECT id FROM staff WHERE id=? AND is_active=1 LIMIT 1');
        $salespersonStmt->execute([$salespersonId]);
        if(!$salespersonStmt->fetchColumn()) $salespersonId=(int)$staff['id'];

        $leadId=$project && !empty($project['lead_id'])?(int)$project['lead_id']:null;
        if(!$leadId){
            $leadStmt=$pdo->prepare('SELECT id FROM leads WHERE customer_id=? ORDER BY created_at DESC,id DESC LIMIT 1');
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

        /*
         * Finance permissions are enforced again on the server. Staff who
         * cannot view internal cost cannot inject manual hidden costs through
         * edited browser JSON. Rate Book cost comes from the database below.
         */
        if(!can('quotation.view_cost')){
            if(isset($payload['groups']) && is_array($payload['groups'])){
                foreach($payload['groups'] as &$secureGroup){
                    if(!isset($secureGroup['sections']) || !is_array($secureGroup['sections'])) continue;
                    foreach($secureGroup['sections'] as &$secureSection){
                        if(!isset($secureSection['items']) || !is_array($secureSection['items'])) continue;
                        foreach($secureSection['items'] as &$secureItem){
                            $secureItem['internal_unit_cost']=0;
                        }
                        unset($secureItem);
                    }
                    unset($secureSection);
                }
                unset($secureGroup);
            }
            if(isset($payload['charges']) && is_array($payload['charges'])){
                foreach($payload['charges'] as &$secureCharge){
                    $secureCharge['internal_only']=false;
                }
                unset($secureCharge);
            }
        }

        /*
         * Material-calculation costs are trusted from the database, never from
         * browser JSON. This also lets staff without cost-view permission link
         * a calculation without exposing its confidential values client-side.
         */
        if($materialCalculation){
            $foundMaterialReference=false;
            if(isset($payload['groups']) && is_array($payload['groups'])){
                foreach($payload['groups'] as &$payloadGroup){
                    if(!isset($payloadGroup['sections']) || !is_array($payloadGroup['sections'])) continue;
                    foreach($payloadGroup['sections'] as &$payloadSection){
                        if(!isset($payloadSection['items']) || !is_array($payloadSection['items'])) continue;
                        foreach($payloadSection['items'] as &$payloadItem){
                            if(($payloadItem['source_type']??'')==='material_calculation' && (int)($payloadItem['source_id']??0)===$materialCalculationId){
                                $payloadItem['internal_unit_cost']=(float)$materialCalculation['total_material_cost'];
                                $foundMaterialReference=true;
                            }
                        }
                        unset($payloadItem);
                    }
                    unset($payloadSection);
                }
                unset($payloadGroup);
            }

            if(!$foundMaterialReference && !empty($payload['groups'][0]['sections'][0])){
                $payload['groups'][0]['sections'][0]['items'][]=[
                    'client_key'=>'material_calc_server_'.$materialCalculationId,
                    'item_type'=>'material','pricing_method'=>'fixed','base_pricing_method'=>'fixed',
                    'description'=>'Internal materials · '.$materialCalculation['calculation_code'],
                    'quantity'=>1,'unit'=>'job','unit_price'=>0,'standard_unit_price'=>0,
                    'internal_unit_cost'=>(float)$materialCalculation['total_material_cost'],
                    'show_on_customer_quote'=>false,'taxable'=>false,
                    'source_type'=>'material_calculation','source_id'=>$materialCalculationId,
                    'source_reference'=>$materialCalculation['calculation_code']
                ];
            }

            $foundWasteReference=false;
            if(isset($payload['charges']) && is_array($payload['charges'])){
                foreach($payload['charges'] as &$payloadCharge){
                    if(($payloadCharge['source_type']??'')==='material_calculation_waste' && (int)($payloadCharge['source_id']??0)===$materialCalculationId){
                        $payloadCharge['rate']=(float)$materialCalculation['total_waste_cost'];
                        $payloadCharge['internal_only']=true;
                        $foundWasteReference=true;
                    }
                }
                unset($payloadCharge);
            }
            if(!$foundWasteReference && (float)$materialCalculation['total_waste_cost']>0){
                $payload['charges'][]=[
                    'client_key'=>'material_waste_server_'.$materialCalculationId,
                    'charge_name'=>'Material waste allowance','charge_category'=>'waste','calculation_type'=>'fixed','calculation_base'=>'manual',
                    'rate'=>(float)$materialCalculation['total_waste_cost'],'base_amount'=>0,'internal_only'=>true,'taxable'=>false,
                    'source_type'=>'material_calculation_waste','source_id'=>$materialCalculationId,'source_reference'=>$materialCalculation['calculation_code']
                ];
            }
        }

        $pricing=quotation_prepare_pricing($pdo,$payload,[
            'view_cost'=>can('quotation.view_cost'),
            'override_price'=>can('quotation.override_price'),
            'package_price'=>can('quotation.package_price'),
            'discount'=>can('quotation.discount'),
            'edit_margin'=>can('quotation.edit_margin'),
        ]);
        $paymentMilestones=quotation_payment_prepare(
            is_array($payload['payment_milestones']??null)?$payload['payment_milestones']:[],
            (float)$pricing['final_total']
        );

        $pdo->beginTransaction();

        $prefix=quotation_setting($pdo,'quotation_prefix','QT');
        $code=$prefix.'-'.date('Ymd-His').'-'.str_pad((string)random_int(1,99),2,'0',STR_PAD_LEFT);
        $currency=quotation_setting($pdo,'quotation_default_currency','MYR') ?: 'MYR';

        $stmt=$pdo->prepare("INSERT INTO quotations (
            branch_id,customer_id,project_id,lead_id,site_measurement_id,salesperson_id,
            quotation_code,design_id,design_code,material_calculation_id,
            customer_name,customer_email,customer_phone,customer_code_snapshot,
            customer_billing_address_snapshot,customer_site_address_snapshot,
            project_name,project_code_snapshot,project_type,site_address_snapshot,
            reference_no,quotation_title,currency,quotation_date,valid_until,status,
            direct_cost,waste_cost,overhead_amount,contingency_amount,internal_cost,
            markup_type,markup_value,markup_amount,selling_price_before_discount,
            standard_selling_price,commercial_adjustment_amount,foc_retail_value,
            discount_type,discount_value,discount_amount,subtotal,tax_name,tax_percent,tax_amount,
            final_total,gross_profit,gross_margin_percent,internal_notes,customer_notes,
            terms_and_conditions,created_by,last_revised_at
        ) VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW()
        )");

        $stmt->execute([
            $staff['branch_id']??null,$customerId,$projectId?:null,$leadId,$measurementId?:null,$salespersonId,
            $code,$designId?:null,$design['design_code']??(trim((string)($payload['design_code']??''))?:null),$materialCalculationId?:null,
            $snapshotName,$snapshotEmail?:null,$snapshotPhone?:null,$customer['customer_code']??null,
            $snapshotBilling?:null,$snapshotCustomerSite?:null,$snapshotProjectName,$project['project_code']??null,
            $snapshotProjectType?:null,$snapshotSiteAddress?:null,$referenceNo,$quotationTitle,$currency,
            $payload['quotation_date']??date('Y-m-d'),!empty($payload['valid_until'])?$payload['valid_until']:null,
            $pricing['direct_cost'],$pricing['waste_cost'],$pricing['overhead_amount'],$pricing['contingency_amount'],$pricing['internal_cost'],
            $pricing['markup_type'],$pricing['markup_value'],$pricing['markup_amount'],$pricing['selling_price_before_discount'],
            $pricing['standard_selling_price'],$pricing['commercial_adjustment_amount'],$pricing['foc_retail_value'],
            $pricing['discount_type'],$pricing['discount_value'],$pricing['discount_amount'],$pricing['subtotal'],
            trim((string)($payload['tax_name']??''))?:null,$pricing['tax_percent'],$pricing['tax_amount'],$pricing['final_total'],
            $pricing['gross_profit'],$pricing['gross_margin_percent'],trim((string)($payload['internal_notes']??''))?:null,
            trim((string)($payload['customer_notes']??''))?:null,trim((string)($payload['terms_and_conditions']??''))?:null,$staff['id']
        ]);

        $quoteId=(int)$pdo->lastInsertId();
        $groupIds=[];
        $sectionIds=[];
        $itemIds=[];

        $groupStmt=$pdo->prepare("INSERT INTO quotation_groups
            (quotation_id,group_code,group_name,group_type,pricing_mode,item_subtotal,internal_cost,package_target_total,adjustment_amount,final_total,show_on_customer_quote,show_breakdown,sort_order,notes)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $sectionStmt=$pdo->prepare("INSERT INTO quotation_sections
            (quotation_id,group_id,section_code,section_name,description,section_subtotal,internal_cost,final_total,show_on_customer_quote,show_section_total,sort_order)
            VALUES(?,?,?,?,?,?,?,?,?,?,?)");
        $itemStmt=$pdo->prepare("INSERT INTO quotation_items
            (quotation_id,section_id,rate_book_item_id,item_type,pricing_method,description,measurement_text,width_value,height_value,depth_value,measurement_unit,
             quantity,unit,unit_price,amount,standard_unit_price,standard_amount,is_foc,foc_reason,is_price_overridden,override_reason,overridden_by,overridden_at,
             internal_unit_cost,internal_total_cost,internal_line_cost,show_on_customer_quote,taxable,source_type,source_id,source_reference,rate_snapshot_json,sort_order,notes)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $costStmt=$pdo->prepare("INSERT INTO quotation_cost_components
            (quotation_id,section_id,quotation_item_id,cost_category,description,quantity,unit,unit_cost,amount,source_type,source_id,source_reference,included_in_item_cost,sort_order,notes,created_by)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

        $costSort=0;
        foreach($pricing['groups'] as $group){
            $groupStmt->execute([
                $quoteId,$group['group_code'],$group['group_name'],$group['group_type'],$group['pricing_mode'],
                $group['item_subtotal'],$group['internal_cost'],$group['package_target_total'],$group['adjustment_amount'],$group['final_total'],
                $group['show_on_customer_quote'],$group['show_breakdown'],$group['sort_order'],$group['notes']
            ]);
            $groupId=(int)$pdo->lastInsertId();
            $groupIds[$group['client_key']]=$groupId;

            foreach($group['sections'] as $section){
                $sectionStmt->execute([
                    $quoteId,$groupId,$section['section_code'],$section['section_name'],$section['description'],
                    $section['section_subtotal'],$section['internal_cost'],$section['final_total'],$section['show_on_customer_quote'],$section['show_section_total'],$section['sort_order']
                ]);
                $sectionId=(int)$pdo->lastInsertId();
                $sectionIds[$section['client_key']]=$sectionId;

                foreach($section['items'] as $item){
                    $overrideStaff=$item['is_price_overridden']?(int)$staff['id']:null;
                    $itemStmt->execute([
                        $quoteId,$sectionId,$item['rate_book_item_id'],$item['item_type'],$item['pricing_method'],$item['description'],$item['measurement_text'],
                        $item['width_value'],$item['height_value'],$item['depth_value'],$item['measurement_unit'],$item['quantity'],$item['unit'],$item['unit_price'],$item['amount'],
                        $item['standard_unit_price'],$item['standard_amount'],$item['is_foc'],$item['foc_reason'],$item['is_price_overridden'],$item['override_reason'],
                        $overrideStaff,$overrideStaff?date('Y-m-d H:i:s'):null,$item['internal_unit_cost'],$item['internal_total_cost'],$item['internal_line_cost'],
                        $item['show_on_customer_quote'],$item['taxable'],$item['source_type'],$item['source_id'],$item['source_reference'],$item['rate_snapshot_json'],$item['sort_order'],$item['notes']
                    ]);
                    $itemId=(int)$pdo->lastInsertId();
                    $itemIds[$item['client_key']]=$itemId;

                    if(($item['base_internal_total_cost']??$item['internal_total_cost'])>0){
                        $costSort++;
                        $costStmt->execute([
                            $quoteId,$sectionId,$itemId,quotation_cost_category_for_item($item['item_type']),$item['description'],$item['quantity'],$item['unit'],
                            $item['internal_unit_cost'],$item['base_internal_total_cost']??$item['internal_total_cost'],$item['source_type'],$item['source_id'],$item['source_reference'],1,$costSort,$item['notes'],$staff['id']
                        ]);
                    }
                    if(($item['waste_cost']??0)>0){
                        $costSort++;
                        $costStmt->execute([
                            $quoteId,$sectionId,$itemId,'waste',$item['description'].' · waste allowance',1,'allowance',
                            $item['waste_cost'],$item['waste_cost'],'rate_book_waste',$item['rate_book_item_id'],$item['source_reference'],1,$costSort,
                            'Rate Book waste allowance '.number_format((float)($item['waste_percent']??0),2).'%',$staff['id']
                        ]);
                    }
                }
            }
        }

        $chargeStmt=$pdo->prepare("INSERT INTO quotation_charges
            (quotation_id,group_id,section_id,rate_book_item_id,charge_code,charge_name,charge_category,calculation_type,calculation_base,rate,base_amount,amount,
             internal_cost_amount,customer_amount,internal_only,is_internal_only,taxable,source_type,source_id,source_reference,sort_order,notes)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        foreach($pricing['charges'] as $charge){
            $groupId=$charge['group_client_key']?($groupIds[$charge['group_client_key']]??null):null;
            $sectionId=$charge['section_client_key']?($sectionIds[$charge['section_client_key']]??null):null;
            $chargeStmt->execute([
                $quoteId,$groupId,$sectionId,$charge['rate_book_item_id'],$charge['charge_code'],$charge['charge_name'],$charge['charge_category'],
                $charge['calculation_type'],$charge['calculation_base'],$charge['rate'],$charge['base_amount'],$charge['amount'],$charge['internal_cost_amount'],$charge['customer_amount'],
                $charge['internal_only'],$charge['is_internal_only'],$charge['taxable'],$charge['source_type'],$charge['source_id'],$charge['source_reference'],$charge['sort_order'],$charge['notes']
            ]);

            if($charge['internal_cost_amount']>0){
                $costSort++;
                $costCategory=in_array($charge['charge_category'],['labour','installation','transport','delivery','waste','consumables','overhead','contingency','machine','disposal','parking_toll','subcontractor'],true)
                    ?$charge['charge_category']:'other';
                $costStmt->execute([
                    $quoteId,$sectionId,null,$costCategory,$charge['charge_name'],1,'charge',$charge['internal_cost_amount'],$charge['internal_cost_amount'],
                    $charge['source_type'],$charge['source_id'],$charge['source_reference'],0,$costSort,$charge['notes'],$staff['id']
                ]);
            }
        }

        if($pricing['overhead_amount']>0){
            $costSort++;
            $costStmt->execute([$quoteId,null,null,'overhead','Quotation overhead',1,'%', $pricing['overhead_amount'],$pricing['overhead_amount'],'system',null,null,0,$costSort,'Calculated at '.$pricing['overhead_percent'].'%',$staff['id']]);
        }
        if($pricing['contingency_amount']>0){
            $costSort++;
            $costStmt->execute([$quoteId,null,null,'contingency','Quotation contingency',1,'%', $pricing['contingency_amount'],$pricing['contingency_amount'],'system',null,null,0,$costSort,'Calculated at '.$pricing['contingency_percent'].'%',$staff['id']]);
        }

        $adjustmentStmt=$pdo->prepare("INSERT INTO quotation_adjustments
            (quotation_id,group_id,section_id,quotation_item_id,adjustment_type,calculation_type,direction,value,base_amount,amount,customer_visible,requires_approval,reason,created_by,sort_order)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        foreach($pricing['adjustments'] as $adjustment){
            $adjustmentStmt->execute([
                $quoteId,
                $adjustment['group_client_key']?($groupIds[$adjustment['group_client_key']]??null):null,
                $adjustment['section_client_key']?($sectionIds[$adjustment['section_client_key']]??null):null,
                $adjustment['quotation_item_client_key']?($itemIds[$adjustment['quotation_item_client_key']]??null):null,
                $adjustment['adjustment_type'],$adjustment['calculation_type'],$adjustment['direction'],$adjustment['value'],$adjustment['base_amount'],$adjustment['amount'],
                $adjustment['customer_visible'],$adjustment['requires_approval'],$adjustment['reason'],$staff['id'],$adjustment['sort_order']
            ]);
        }

        quotation_payment_replace_master($pdo,$quoteId,$paymentMilestones);

        $pdo->prepare("INSERT INTO quotation_status_history (quotation_id,old_status,new_status,changed_by,notes) VALUES(?,NULL,'draft',?,'Quotation created')")
            ->execute([$quoteId,$staff['id']]);

        if($project){
            if(in_array($project['status'],['consultation','measurement','design'],true)){
                $pdo->prepare("UPDATE projects SET status='quotation' WHERE id=?")->execute([$projectId]);
            }
            project_activity($pdo,$projectId,'quotation','Quotation created',$code.' created for '.$snapshotName);
        }

        $pdo->commit();
        log_activity('quotation.create','quotation',(string)$quoteId,'Created quotation '.$code.' with Stage 3 pricing');
        flash('success','Quotation '.$code.' created with sections and server-verified pricing.');
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

$customers=$pdo->query("SELECT id,customer_code,name,phone,email,billing_address,site_address,city,state,postcode,assigned_to,status,interested_service FROM customers WHERE status<>'blacklisted' ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
$projects=$pdo->query("SELECT p.id,p.customer_id,p.project_code,p.name,p.project_type,p.status,p.assigned_manager,p.site_address,p.lead_id,p.estimated_value,p.updated_at FROM projects p WHERE p.status<>'cancelled' ORDER BY p.updated_at DESC,p.id DESC")->fetchAll(PDO::FETCH_ASSOC);
$measurements=$pdo->query("SELECT sm.id,sm.project_id,sm.room_name,sm.measured_at,sm.wall_a_mm,sm.wall_b_mm,sm.wall_c_mm,sm.wall_d_mm,sm.ceiling_height_mm,sm.window_details,sm.door_details,sm.plumbing_details,sm.electrical_details,sm.obstacles,sm.notes,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) measured_by_name FROM site_measurements sm LEFT JOIN staff s ON s.id=sm.measured_by ORDER BY sm.measured_at DESC,sm.id DESC")->fetchAll(PDO::FETCH_ASSOC);

$designs=[];
try{
    $designs=$pdo->query("SELECT id,design_code,design_name,customer_id,project_id,customer_name,customer_email,customer_phone,room_type,estimated_price,status,updated_at FROM designs ORDER BY updated_at DESC,id DESC LIMIT 300")->fetchAll(PDO::FETCH_ASSOC);
}catch(Throwable $e){}

$calculations=$pdo->query("SELECT id,calculation_code,calculation_name,customer_name,customer_id,project_id,design_id,design_code,status,total_material_cost,total_waste_cost,total_cost,updated_at FROM material_calculations WHERE status IN('calculated','approved') ORDER BY updated_at DESC,id DESC LIMIT 300")->fetchAll(PDO::FETCH_ASSOC);
$presetVisibility=can('quotation.view_cost')?'':" AND internal_only=0";
$presets=$pdo->query("SELECT * FROM quotation_charge_presets WHERE is_active=1 AND charge_category<>'overhead'".$presetVisibility." ORDER BY sort_order,charge_name")->fetchAll(PDO::FETCH_ASSOC);
$salespeople=$pdo->query("SELECT id,first_name,last_name,job_title,role_id FROM staff WHERE is_active=1 ORDER BY first_name,last_name")->fetchAll(PDO::FETCH_ASSOC);
$rateBook=$pdo->query("SELECT ri.*,rc.category_code,rc.name category_name FROM quotation_rate_items ri JOIN quotation_rate_categories rc ON rc.id=ri.category_id WHERE ri.is_active=1 AND rc.is_active=1 AND (ri.effective_from IS NULL OR ri.effective_from<=CURDATE()) AND (ri.effective_to IS NULL OR ri.effective_to>=CURDATE()) ORDER BY rc.sort_order,ri.sort_order,ri.name")->fetchAll(PDO::FETCH_ASSOC);

$requestedCustomerId=(int)($_GET['customer_id']??0);
$requestedProjectId=(int)($_GET['project_id']??0);
$requestedMeasurementId=(int)($_GET['measurement_id']??0);
$projectById=[]; foreach($projects as $row) $projectById[(int)$row['id']]=$row;
$measurementById=[]; foreach($measurements as $row) $measurementById[(int)$row['id']]=$row;
if($requestedMeasurementId>0 && isset($measurementById[$requestedMeasurementId])) $requestedProjectId=(int)$measurementById[$requestedMeasurementId]['project_id'];
if($requestedProjectId>0 && isset($projectById[$requestedProjectId])) $requestedCustomerId=(int)$projectById[$requestedProjectId]['customer_id'];

$defaultMarkup=(float)quotation_setting($pdo,'quotation_default_markup_percent','25');
$defaultOverhead=(float)quotation_setting($pdo,'quotation_default_overhead_percent','8');
$defaultContingency=(float)quotation_setting($pdo,'quotation_default_contingency_percent','0');
$defaultTax=(float)quotation_setting($pdo,'quotation_default_tax_percent','0');
$validDays=max(1,(int)quotation_setting($pdo,'quotation_valid_days','30'));

$calculationsForClient=$calculations;
$rateBookForClient=$rateBook;
if(!can('quotation.view_cost')){
    foreach($calculationsForClient as &$row){
        $row['total_material_cost']=0;
        $row['total_waste_cost']=0;
        $row['total_cost']=0;
    }
    unset($row);
    foreach($rateBookForClient as &$row){
        $row['internal_cost_rate']=0;
        $row['minimum_selling_rate']=null;
    }
    unset($row);
}

$contextPayload=[
    'customers'=>$customers,'projects'=>$projects,'measurements'=>$measurements,'designs'=>$designs,'calculations'=>$calculationsForClient,
    'preselect'=>['customer_id'=>$requestedCustomerId,'project_id'=>$requestedProjectId,'measurement_id'=>$requestedMeasurementId],
    'urls'=>[
        'customer'=>ideare_root_url('staff/pages/customer-view.php?id='),'customer_list'=>ideare_root_url('staff/pages/customers.php'),
        'project'=>ideare_root_url('staff/pages/project-view.php?id='),'project_list'=>ideare_root_url('staff/pages/projects.php'),
        'measurement'=>ideare_root_url('staff/pages/site-measurements.php?project_id='),'measurement_list'=>ideare_root_url('staff/pages/site-measurements.php'),
    ],
];

$pricingPayload=[
    'rateBook'=>$rateBookForClient,
    'permissions'=>[
        'viewCost'=>can('quotation.view_cost'),'viewMargin'=>can('quotation.view_margin'),'overridePrice'=>can('quotation.override_price'),
        'packagePrice'=>can('quotation.package_price'),'discount'=>can('quotation.discount'),'editMargin'=>can('quotation.edit_margin')
    ],
    'settings'=>[
        'defaultMarkup'=>$defaultMarkup,'defaultOverhead'=>$defaultOverhead,'defaultContingency'=>$defaultContingency,'defaultTax'=>$defaultTax,
        'requireOverrideReason'=>quotation_setting($pdo,'quotation_require_price_override_reason','1')==='1',
        'requireFocReason'=>quotation_setting($pdo,'quotation_foc_requires_reason','1')==='1',
    ]
];

$pageTitle='Create Quotation';
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content quotation-page quotation-create-stage3">
<div class="page-head quotation-create-head">
    <div>
        <p class="eyebrow">Sales &amp; Costing</p>
        <h1>Create quotation</h1>
        <p class="muted">Build the scope by section, pull standard rates from the IdeaRE Rate Book and keep customer selling prices separate from internal cost.</p>
    </div>
    <div class="actions">
        <?php if(can('quotation.manage_rate_book') || can('quotation.settings')): ?>
        <a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-rate-book.php')) ?>">Rate Book</a>
        <?php endif; ?>
        <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Back to Quotation Centre</a>
    </div>
</div>

<div class="quotation-create-progress" aria-label="Quotation build progress">
    <span class="is-done"><b>1</b> Centre foundation</span>
    <span class="is-done"><b>2</b> Customer &amp; project context</span>
    <span class="is-active"><b>3</b> Scope &amp; pricing</span>
    <span><b>4</b> Revisions &amp; approval</span>
    <span><b>5</b> Customer document</span>
</div>

<div class="quote-builder-grid">
<section class="staff-panel quote-context-panel">
    <div class="section-title quote-context-title">
        <div><p class="eyebrow">Quotation source</p><h2>Customer &amp; project</h2><p class="muted">CRM links remain live; these editable fields become the historical quotation snapshot.</p></div>
        <div class="quote-context-links"><a id="quoteCustomerLink" class="btn" href="<?= h(ideare_root_url('staff/pages/customers.php')) ?>">Open CRM</a><a id="quoteProjectLink" class="btn" href="<?= h(ideare_root_url('staff/pages/projects.php')) ?>">Open project</a></div>
    </div>
    <div class="quotation-context-grid">
        <div class="quote-context-block">
            <div class="quote-context-block-head"><div><span class="quote-context-step">1</span><div><b>Customer</b><small id="quoteCustomerCodeLabel">Choose a CRM customer</small></div></div></div>
            <label>CRM customer <span class="required-mark">*</span><select id="quoteCustomerId" required><option value="">Choose customer...</option><?php foreach($customers as $customer): ?><option value="<?= (int)$customer['id'] ?>" <?= $requestedCustomerId===(int)$customer['id']?'selected':'' ?>><?= h($customer['customer_code'].' · '.$customer['name'].($customer['phone']?' · '.$customer['phone']:'')) ?></option><?php endforeach; ?></select></label>
            <div class="form-grid"><label>Customer name<input id="quoteCustomerName" required></label><label>Customer email<input id="quoteCustomerEmail" type="email"></label><label>Customer phone<input id="quoteCustomerPhone"></label></div>
            <div class="two"><label>Billing address<textarea id="quoteCustomerBillingAddress" rows="3"></textarea></label><label>Customer site address<textarea id="quoteCustomerSiteAddress" rows="3"></textarea></label></div>
        </div>
        <div class="quote-context-block">
            <div class="quote-context-block-head"><div><span class="quote-context-step">2</span><div><b>Project</b><small id="quoteProjectCodeLabel">Optional customer-only quotation</small></div></div></div>
            <label>Linked project<select id="quoteProjectId"><option value="">No linked project</option></select></label>
            <div class="form-grid"><label>Project name<input id="quoteProjectName" value="General quotation"></label><label>Project type<input id="quoteProjectType" placeholder="Kitchen Cabinet"></label><label>Site address<input id="quoteSiteAddress" placeholder="Project installation address"></label></div>
            <div class="quote-context-note" id="quoteProjectStatusNote">Choose a project to connect this quotation to the project timeline.</div>
        </div>
    </div>
</section>

<section class="staff-panel quote-measurement-panel">
    <div class="section-title"><div><p class="eyebrow">Site reference</p><h2>Primary site measurement</h2><p class="muted">Keep the room dimensions and service notes beside the quotation while pricing.</p></div><a id="quoteMeasurementLink" class="btn" href="<?= h(ideare_root_url('staff/pages/site-measurements.php')) ?>">Open measurements</a></div>
    <label>Measurement record<select id="quoteMeasurementId" disabled><option value="">Choose a project first</option></select></label>
    <div id="quoteMeasurementPreview" class="quote-measurement-preview is-empty"><div><strong>No measurement linked</strong><span>Select a project and measurement to preview the room dimensions and service notes here.</span></div></div>
</section>

<section class="staff-panel quote-source-panel">
    <div class="section-title"><div><p class="eyebrow">Supporting sources</p><h2>Design &amp; costing references</h2><p class="muted">Material calculations feed internal material/waste cost without exposing those costs to the customer.</p></div></div>
    <div class="two"><label>Link saved cabinet design<select id="quoteDesign"><option value="">No linked design</option></select></label><label>Link material calculation<select id="quoteMaterialCalc"><option value="">No saved material calculation</option></select></label></div>
</section>

<section class="staff-panel quote-document-setup">
    <div class="section-title"><div><p class="eyebrow">Document setup</p><h2>Quotation details</h2></div><span class="quote-owner-chip"><?= h($staff['branch_name']?:'IdeaRE') ?></span></div>
    <div class="form-grid">
        <label>Quotation title<input id="quoteTitle" value="Interior Design Works"></label><label>Customer / external reference<input id="quoteReferenceNo" placeholder="PO, enquiry or reference no."></label>
        <?php if(can('quotation.settings') || can('quotation.approve')): ?><label>Quotation owner<select id="quoteSalespersonId"><?php foreach($salespeople as $person): ?><option value="<?= (int)$person['id'] ?>" <?= (int)$person['id']===(int)$staff['id']?'selected':'' ?>><?= h(trim($person['first_name'].' '.($person['last_name']??''))) ?><?= $person['job_title']?' · '.h($person['job_title']):'' ?></option><?php endforeach; ?></select></label><?php else: ?><input id="quoteSalespersonId" type="hidden" value="<?= (int)$staff['id'] ?>"><label>Quotation owner<input value="<?= h(trim($staff['first_name'].' '.($staff['last_name']??''))) ?>" readonly></label><?php endif; ?>
        <label>Quotation date<input id="quoteDate" type="date" value="<?= h(date('Y-m-d')) ?>"></label><label>Valid until<input id="quoteValidUntil" type="date" value="<?= h(date('Y-m-d',strtotime('+'.$validDays.' days'))) ?>"></label>
    </div>
</section>

<section class="staff-panel quotation-scope-panel">
    <div class="section-title quotation-scope-head">
        <div><p class="eyebrow">Scope &amp; selling price</p><h2>Quotation sections</h2><p class="muted">Organise work exactly as the customer should read it: Main Works, Kitchen Cabinet, Electrical Works, Additional Works and more.</p></div>
        <div class="actions"><button class="btn" type="button" id="addQuoteGroupBtn">Add group</button><button class="btn primary" type="button" id="openRateBookBtn">Add from Rate Book</button></div>
    </div>
    <div class="quotation-builder-legend"><span>Rate Book = standard rate</span><span>Manual = custom line</span><span>FOC keeps internal cost</span><span>Package price adjusts a whole group</span></div>
    <div id="quoteGroupRows"></div>
</section>

<section class="staff-panel">
    <div class="section-title"><div><p class="eyebrow">Additional charges</p><h2>Charges &amp; site costs</h2><p class="muted">Add delivery, installation, subcontractors, waste, consumables and other commercial or internal-only costs.</p></div><button class="btn" type="button" id="addChargeBtn">Add charge</button></div>
    <div class="charge-preset-bar"><?php foreach($presets as $p): ?><button type="button" class="charge-preset" data-preset='<?= h(json_encode($p,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)) ?>'>+ <?= h($p['charge_name']) ?></button><?php endforeach; ?></div>
    <div id="quoteChargeRows"></div>
</section>

<?php if(can('quotation.view_cost') || can('quotation.edit_margin') || can('quotation.discount')): ?>
<section class="staff-panel internal-cost-card">
    <div class="section-title"><div><p class="eyebrow">Internal commercial controls</p><h2>Cost, margin &amp; discount</h2><p class="muted">Customer line prices remain explicit. Margin controls are shown as a management benchmark rather than silently replacing Rate Book prices.</p></div></div>
    <div class="quote-cost-grid">
        <?php if(can('quotation.view_cost') || can('quotation.edit_margin')): ?>
        <label>Overhead %<input id="quoteOverheadPct" type="number" step=".01" min="0" value="<?= h((string)$defaultOverhead) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>></label>
        <label>Contingency %<input id="quoteContingencyPct" type="number" step=".01" min="0" value="<?= h((string)$defaultContingency) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>></label>
        <label>Margin benchmark<select id="quoteMarkupType" <?= can('quotation.edit_margin')?'':'disabled' ?>><option value="percentage">Markup %</option><option value="margin">Target gross margin %</option><option value="fixed">Fixed profit target</option></select></label>
        <label>Benchmark value<input id="quoteMarkupValue" type="number" step=".01" min="0" value="<?= h((string)$defaultMarkup) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>></label>
        <?php else: ?>
        <input id="quoteOverheadPct" type="hidden" value="<?= h((string)$defaultOverhead) ?>">
        <input id="quoteContingencyPct" type="hidden" value="<?= h((string)$defaultContingency) ?>">
        <input id="quoteMarkupType" type="hidden" value="percentage">
        <input id="quoteMarkupValue" type="hidden" value="<?= h((string)$defaultMarkup) ?>">
        <?php endif; ?>
        <?php if(can('quotation.discount')): ?><label>Discount type<select id="quoteDiscountType"><option value="none">No discount</option><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><label>Discount value<input id="quoteDiscountValue" type="number" step=".01" min="0" value="0"></label><?php else: ?><input id="quoteDiscountType" type="hidden" value="none"><input id="quoteDiscountValue" type="hidden" value="0"><?php endif; ?>
    </div>
</section>
<?php else: ?>
<input id="quoteOverheadPct" type="hidden" value="<?= h((string)$defaultOverhead) ?>">
<input id="quoteContingencyPct" type="hidden" value="<?= h((string)$defaultContingency) ?>">
<input id="quoteMarkupType" type="hidden" value="percentage">
<input id="quoteMarkupValue" type="hidden" value="<?= h((string)$defaultMarkup) ?>">
<input id="quoteDiscountType" type="hidden" value="none">
<input id="quoteDiscountValue" type="hidden" value="0">
<?php endif; ?>

<section class="staff-panel quote-payment-panel">
    <div class="section-title">
        <div>
            <p class="eyebrow">Stage 5 · Customer payment plan</p>
            <h2>Payment schedule</h2>
            <p class="muted">Optional, but recommended before approval. The schedule is frozen into each issued quotation revision and can create milestone invoices after acceptance.</p>
        </div>
        <button class="btn" type="button" id="addPaymentMilestoneBtn">Add milestone</button>
    </div>
    <div class="quote-payment-presets">
        <span>Quick schedule:</span>
        <button class="btn" type="button" data-payment-preset="50-40-10">50 / 40 / 10</button>
        <button class="btn" type="button" data-payment-preset="40-40-20">40 / 40 / 20</button>
        <button class="btn" type="button" data-payment-preset="100">100% on acceptance</button>
    </div>
    <div class="quote-payment-head" aria-hidden="true"><span>Milestone</span><span>Calculation</span><span>Due trigger</span><span>Amount</span><span>Customer</span><span></span></div>
    <div id="quoteMilestoneRows"></div>
    <div class="quote-payment-totals">
        <span>Scheduled <strong id="quoteMilestoneTotal">RM 0.00</strong></span>
        <span>Difference <strong id="quoteMilestoneBalance">RM 0.00</strong></span>
    </div>
</section>

<section class="staff-panel">
    <p class="eyebrow">Tax &amp; notes</p><h2>Finishing details</h2>
    <div class="form-grid"><label>Tax name<input id="quoteTaxName" value="Tax"></label><label>Tax %<input id="quoteTaxPct" type="number" step=".01" min="0" value="<?= h((string)$defaultTax) ?>"></label></div>
    <label>Customer notes<textarea id="quoteCustomerNotes" rows="3" placeholder="Notes that may be shown to the customer..."></textarea></label>
    <?php if(can('quotation.view_cost')): ?><label>Internal notes<textarea id="quoteInternalNotes" rows="3" placeholder="Internal notes. Not shown on customer quotation."></textarea></label><?php else: ?><input id="quoteInternalNotes" type="hidden" value=""><?php endif; ?>
    <label>Terms &amp; conditions<textarea id="quoteTerms" rows="5">Quotation valid until the date shown. Final measurements and specifications are subject to site verification. Changes to scope may affect pricing.</textarea></label>
</section>
</div>

<aside class="quote-summary staff-panel">
    <p class="eyebrow">Live commercial summary</p><h2>Quotation summary</h2>
    <div class="quote-summary-context"><span id="summaryCustomerContext">No customer selected</span><small id="summaryProjectContext">No linked project</small></div>
    <?php if(can('quotation.view_cost')): ?>
    <div class="summary-line"><span>Direct internal cost</span><strong id="summaryDirectCost">RM 0.00</strong></div><div class="summary-line"><span>Overhead</span><strong id="summaryOverhead">RM 0.00</strong></div><div class="summary-line"><span>Contingency</span><strong id="summaryContingency">RM 0.00</strong></div><div class="summary-line internal-total"><span>True internal cost</span><strong id="summaryInternalCost">RM 0.00</strong></div>
    <?php endif; ?>
    <div class="summary-line"><span>Standard scope value</span><strong id="summaryStandardSelling">RM 0.00</strong></div><div class="summary-line"><span>Package adjustment</span><strong id="summaryCommercialAdjustment">RM 0.00</strong></div><div class="summary-line"><span>FOC retail value</span><strong id="summaryFocValue">RM 0.00</strong></div><div class="summary-line"><span>Selling before discount</span><strong id="summarySelling">RM 0.00</strong></div><div class="summary-line"><span>Discount</span><strong id="summaryDiscount">RM 0.00</strong></div><div class="summary-line"><span>Subtotal</span><strong id="summarySubtotal">RM 0.00</strong></div><div class="summary-line"><span>Tax</span><strong id="summaryTax">RM 0.00</strong></div><div class="summary-line quote-grand"><span>Final quotation</span><strong id="summaryFinal">RM 0.00</strong></div>
    <?php if(can('quotation.view_margin') && can('quotation.view_cost')): ?><div class="quote-margin-health"><span>Projected gross margin</span><strong id="summaryMargin">0.0%</strong><small id="summaryMarginHint">Based on the live internal cost and customer subtotal.</small></div><?php endif; ?>
    <form method="post" id="saveQuoteForm"><?= csrf_field() ?><input type="hidden" name="payload" id="quotePayload"><button class="btn primary wide" type="submit">Save draft quotation</button></form>
    <p class="quote-save-note">The browser preview is recalculated again in PHP before anything is saved.</p>
</aside>

<div class="quote-rate-modal" id="quoteRateModal" hidden>
    <div class="quote-rate-dialog" role="dialog" aria-modal="true" aria-labelledby="quoteRateModalTitle">
        <div class="quote-rate-head"><div><p class="eyebrow">IdeaRE pricing catalogue</p><h2 id="quoteRateModalTitle">Rate Book</h2></div><button class="btn" type="button" id="closeRateBookBtn">Close</button></div>
        <div class="quote-rate-toolbar"><input id="rateBookSearch" type="search" placeholder="Search cabinet, quartz, downlight, installation..."><select id="rateBookCategory"><option value="">All categories</option></select></div>
        <div id="rateBookResults" class="quote-rate-results"></div>
    </div>
</div>
</main>

<script>
window.IDEARE_QUOTE_STAGE2 = <?= json_encode($contextPayload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) ?>;
window.IDEARE_QUOTE_STAGE3 = <?= json_encode($pricingPayload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) ?>;
</script>
<script src="<?= h(ideare_root_url('assets/js/quotation-context.js')) ?>"></script>
<script src="<?= h(ideare_root_url('assets/js/quotation-builder.js')) ?>"></script>
<script src="<?= h(ideare_root_url('assets/js/quotation-milestones.js')) ?>"></script>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
