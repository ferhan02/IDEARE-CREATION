<?php

declare(strict_types=1);

require_once __DIR__.'/quotation-pricing.php';

/**
 * IdeaRE Quotation Centre Stage 4 workflow helpers.
 *
 * Stage 3 owns authoritative pricing. Stage 4 freezes that commercial state
 * into immutable quotation versions, routes approvals, issues an exact
 * revision, and records the customer's decision against that revision.
 */

function quotation_workflow_event(
    PDO $pdo,
    int $quotationId,
    ?int $versionId,
    string $eventType,
    ?int $staffId,
    ?string $fromStatus=null,
    ?string $toStatus=null,
    ?string $notes=null,
    ?array $metadata=null
): void {
    $stmt=$pdo->prepare("INSERT INTO quotation_version_events
        (quotation_id,quotation_version_id,event_type,staff_id,from_status,to_status,notes,metadata_json)
        VALUES(?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $quotationId,$versionId,$eventType,$staffId,$fromStatus,$toStatus,$notes,
        $metadata?json_encode($metadata,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES):null
    ]);
}

function quotation_workflow_master_data(PDO $pdo,int $quotationId): array
{
    $q=$pdo->prepare('SELECT * FROM quotations WHERE id=? LIMIT 1');
    $q->execute([$quotationId]);
    $quote=$q->fetch(PDO::FETCH_ASSOC);
    if(!$quote) throw new RuntimeException('Quotation not found.');

    $fetch=function(string $sql) use ($pdo,$quotationId): array {
        $s=$pdo->prepare($sql);
        $s->execute([$quotationId]);
        return $s->fetchAll(PDO::FETCH_ASSOC);
    };

    return [
        'quote'=>$quote,
        'groups'=>$fetch('SELECT * FROM quotation_groups WHERE quotation_id=? ORDER BY sort_order,id'),
        'sections'=>$fetch('SELECT * FROM quotation_sections WHERE quotation_id=? ORDER BY sort_order,id'),
        'items'=>$fetch("SELECT qi.*,ri.rate_code,ri.name rate_name FROM quotation_items qi LEFT JOIN quotation_rate_items ri ON ri.id=qi.rate_book_item_id WHERE qi.quotation_id=? ORDER BY qi.sort_order,qi.id"),
        'charges'=>$fetch('SELECT * FROM quotation_charges WHERE quotation_id=? ORDER BY sort_order,id'),
        'costs'=>$fetch('SELECT * FROM quotation_cost_components WHERE quotation_id=? ORDER BY sort_order,id'),
        'adjustments'=>$fetch('SELECT * FROM quotation_adjustments WHERE quotation_id=? ORDER BY sort_order,id'),
        'milestones'=>$fetch('SELECT * FROM quotation_payment_milestones WHERE quotation_id=? ORDER BY sort_order,id'),
    ];
}

function quotation_workflow_snapshot(
    PDO $pdo,
    int $quotationId,
    int $versionNo,
    int $staffId,
    ?string $changeSummary=null,
    string $status='draft'
): int {
    $data=quotation_workflow_master_data($pdo,$quotationId);
    $q=$data['quote'];

    $snapshot=[
        'schema_version'=>4,
        'quotation'=>$q,
        'groups'=>$data['groups'],
        'sections'=>$data['sections'],
        'items'=>$data['items'],
        'charges'=>$data['charges'],
        'cost_components'=>$data['costs'],
        'adjustments'=>$data['adjustments'],
        'payment_milestones'=>$data['milestones'],
    ];
    $snapshotJson=json_encode($snapshot,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRESERVE_ZERO_FRACTION);
    if($snapshotJson===false) throw new RuntimeException('Could not serialize quotation revision snapshot.');
    $hash=hash('sha256',$snapshotJson);

    $existing=$pdo->prepare('SELECT * FROM quotation_versions WHERE quotation_id=? AND version_no=? LIMIT 1');
    $existing->execute([$quotationId,$versionNo]);
    $version=$existing->fetch(PDO::FETCH_ASSOC);

    if($version && (int)$version['is_locked']===1){
        throw new RuntimeException('This quotation revision is locked and cannot be overwritten. Start a new revision instead.');
    }
    if($version && !in_array($version['status'],['draft','rejected'],true)){
        throw new RuntimeException('This quotation revision has already entered workflow and cannot be overwritten. Start a new revision instead.');
    }

    if($version){
        $versionId=(int)$version['id'];
        foreach([
            'quotation_version_payment_milestones','quotation_version_adjustments','quotation_version_cost_components',
            'quotation_version_charges','quotation_version_items','quotation_version_sections','quotation_version_groups'
        ] as $table){
            $pdo->prepare("DELETE FROM `$table` WHERE quotation_version_id=?")->execute([$versionId]);
        }
        $stmt=$pdo->prepare("UPDATE quotation_versions SET
            version_label=?,change_summary=?,status=?,quotation_date=?,currency=?,customer_id=?,project_id=?,
            customer_name_snapshot=?,customer_email_snapshot=?,customer_phone_snapshot=?,customer_billing_address_snapshot=?,site_address_snapshot=?,
            project_code_snapshot=?,project_name_snapshot=?,project_type_snapshot=?,quotation_title_snapshot=?,reference_no_snapshot=?,subtotal=?,selling_price_before_discount=?,commercial_adjustment_amount=?,
            foc_retail_value=?,discount_amount=?,discount_type=?,discount_value=?,tax_amount=?,tax_name=?,tax_percent=?,total_amount=?,internal_cost=?,waste_cost=?,
            overhead_amount=?,contingency_amount=?,markup_amount=?,gross_profit=?,gross_margin_percent=?,valid_until=?,notes=?,customer_notes=?,internal_notes=?,terms=?,
            snapshot_json=?,snapshot_schema_version=4,snapshot_hash=?,is_locked=0,approved_by=NULL,approved_at=NULL,issued_by=NULL,issued_at=NULL,
            customer_decision_at=NULL,customer_decision_by=NULL,customer_decision_method=NULL,customer_decision_notes=NULL
            WHERE id=?");
        $stmt->execute([
            'Revision '.$versionNo,$changeSummary,$status,$q['quotation_date'],$q['currency']?:'MYR',$q['customer_id'],$q['project_id'],
            $q['customer_name'],$q['customer_email'],$q['customer_phone'],$q['customer_billing_address_snapshot'],$q['site_address_snapshot'],
            $q['project_code_snapshot'],$q['project_name'],$q['project_type'],$q['quotation_title'],$q['reference_no'],$q['subtotal'],$q['selling_price_before_discount'],$q['commercial_adjustment_amount'],
            $q['foc_retail_value'],$q['discount_amount'],$q['discount_type'],$q['discount_value'],$q['tax_amount'],$q['tax_name'],$q['tax_percent'],$q['final_total'],
            $q['internal_cost'],$q['waste_cost'],$q['overhead_amount'],$q['contingency_amount'],$q['markup_amount'],$q['gross_profit'],$q['gross_margin_percent'],
            $q['valid_until'],$changeSummary,$q['customer_notes'],$q['internal_notes'],$q['terms_and_conditions'],$snapshotJson,$hash,$versionId
        ]);
    }else{
        $stmt=$pdo->prepare("INSERT INTO quotation_versions
            (quotation_id,version_no,version_label,change_summary,status,quotation_date,currency,customer_id,project_id,
             customer_name_snapshot,customer_email_snapshot,customer_phone_snapshot,customer_billing_address_snapshot,site_address_snapshot,
             project_code_snapshot,project_name_snapshot,project_type_snapshot,quotation_title_snapshot,reference_no_snapshot,subtotal,selling_price_before_discount,commercial_adjustment_amount,
             foc_retail_value,discount_amount,discount_type,discount_value,tax_amount,tax_name,tax_percent,total_amount,internal_cost,waste_cost,
             overhead_amount,contingency_amount,markup_amount,gross_profit,gross_margin_percent,valid_until,notes,customer_notes,internal_notes,terms,
             snapshot_json,snapshot_schema_version,snapshot_hash,is_locked,created_by)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,4,?,0,?)");
        $stmt->execute([
            $quotationId,$versionNo,'Revision '.$versionNo,$changeSummary,$status,$q['quotation_date'],$q['currency']?:'MYR',$q['customer_id'],$q['project_id'],
            $q['customer_name'],$q['customer_email'],$q['customer_phone'],$q['customer_billing_address_snapshot'],$q['site_address_snapshot'],
            $q['project_code_snapshot'],$q['project_name'],$q['project_type'],$q['quotation_title'],$q['reference_no'],$q['subtotal'],$q['selling_price_before_discount'],$q['commercial_adjustment_amount'],
            $q['foc_retail_value'],$q['discount_amount'],$q['discount_type'],$q['discount_value'],$q['tax_amount'],$q['tax_name'],$q['tax_percent'],$q['final_total'],
            $q['internal_cost'],$q['waste_cost'],$q['overhead_amount'],$q['contingency_amount'],$q['markup_amount'],$q['gross_profit'],$q['gross_margin_percent'],
            $q['valid_until'],$changeSummary,$q['customer_notes'],$q['internal_notes'],$q['terms_and_conditions'],$snapshotJson,$hash,$staffId
        ]);
        $versionId=(int)$pdo->lastInsertId();
    }

    $groupMap=[];
    $groupCodeById=[];
    $groupStmt=$pdo->prepare("INSERT INTO quotation_version_groups
        (quotation_version_id,group_code,group_name,group_type,pricing_mode,item_subtotal,internal_cost,package_target_total,adjustment_amount,final_total,show_on_customer_quote,show_breakdown,sort_order,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach($data['groups'] as $g){
        $groupStmt->execute([$versionId,$g['group_code'],$g['group_name'],$g['group_type'],$g['pricing_mode'],$g['item_subtotal'],$g['internal_cost'],$g['package_target_total'],$g['adjustment_amount'],$g['final_total'],$g['show_on_customer_quote'],$g['show_breakdown'],$g['sort_order'],$g['notes']]);
        $groupMap[(int)$g['id']]=(int)$pdo->lastInsertId();
        $groupCodeById[(int)$g['id']]=$g['group_code'];
    }

    $sectionMap=[];
    $sectionCodeById=[];
    $sectionStmt=$pdo->prepare("INSERT INTO quotation_version_sections
        (quotation_version_id,quotation_version_group_id,section_code,section_name,description,section_subtotal,internal_cost,final_total,show_on_customer_quote,show_section_total,sort_order)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)");
    foreach($data['sections'] as $s){
        $sectionStmt->execute([$versionId,$groupMap[(int)$s['group_id']]??null,$s['section_code'],$s['section_name'],$s['description'],$s['section_subtotal'],$s['internal_cost'],$s['final_total'],$s['show_on_customer_quote'],$s['show_section_total'],$s['sort_order']]);
        $sectionMap[(int)$s['id']]=(int)$pdo->lastInsertId();
        $sectionCodeById[(int)$s['id']]=$s['section_code'];
    }

    $versionItemType=function(string $type): string {
        $allowed=['material','cabinet','countertop','hardware','labour','installation','delivery','electrical','plumbing','ceiling','renovation','door_glass','transport','subcontractor','miscellaneous','service','custom'];
        if($type==='other') return 'custom';
        return in_array($type,$allowed,true)?$type:'custom';
    };
    $itemStmt=$pdo->prepare("INSERT INTO quotation_version_items
        (quotation_version_id,quotation_version_section_id,item_type,pricing_method,description,measurement_text,width_value,height_value,depth_value,measurement_unit,
         quantity,unit,unit_cost,unit_price,line_cost,line_total,standard_unit_price,standard_line_total,is_foc,foc_reason,is_price_overridden,override_reason,
         show_on_customer_quote,taxable,rate_book_code_snapshot,rate_book_name_snapshot,source_type,source_reference,notes,sort_order)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach($data['items'] as $i){
        $rateSnap=[];
        if(!empty($i['rate_snapshot_json'])) $rateSnap=json_decode((string)$i['rate_snapshot_json'],true)?:[];
        $itemStmt->execute([
            $versionId,$sectionMap[(int)($i['section_id']??0)]??null,$versionItemType((string)$i['item_type']),$i['pricing_method'],$i['description'],$i['measurement_text'],
            $i['width_value'],$i['height_value'],$i['depth_value'],$i['measurement_unit'],$i['quantity'],$i['unit'],$i['internal_unit_cost'],$i['unit_price'],
            $i['internal_total_cost'],$i['amount'],$i['standard_unit_price'],$i['standard_amount'],$i['is_foc'],$i['foc_reason'],$i['is_price_overridden'],$i['override_reason'],
            $i['show_on_customer_quote'],$i['taxable'],$i['rate_code']??($rateSnap['rate_code']??null),$i['rate_name']??($rateSnap['name']??null),$i['source_type'],$i['source_reference'],$i['notes'],$i['sort_order']
        ]);
    }

    $allowedChargeTypes=['labour','installation','delivery','transport','measurement','design','subcontractor','overhead','waste','contingency','consumables','machine','disposal','parking_toll','tax','discount','surcharge','other'];
    $chargeStmt=$pdo->prepare("INSERT INTO quotation_version_charges
        (quotation_version_id,quotation_version_group_id,quotation_version_section_id,charge_type,label,calculation_type,calculation_base,rate,amount,internal_cost_amount,customer_amount,is_internal_only,source_reference,sort_order)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach($data['charges'] as $c){
        $type=in_array($c['charge_category'],$allowedChargeTypes,true)?$c['charge_category']:'other';
        $chargeStmt->execute([$versionId,$groupMap[(int)($c['group_id']??0)]??null,$sectionMap[(int)($c['section_id']??0)]??null,$type,$c['charge_name'],$c['calculation_type'],$c['calculation_base'],$c['rate'],$c['amount'],$c['internal_cost_amount'],$c['customer_amount'],$c['internal_only'],$c['source_reference'],$c['sort_order']]);
    }

    $costStmt=$pdo->prepare("INSERT INTO quotation_version_cost_components
        (quotation_version_id,section_code_snapshot,cost_category,description,quantity,unit,unit_cost,amount,source_type,source_reference,sort_order,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach($data['costs'] as $c){
        $costStmt->execute([$versionId,$sectionCodeById[(int)($c['section_id']??0)]??null,$c['cost_category'],$c['description'],$c['quantity'],$c['unit'],$c['unit_cost'],$c['amount'],$c['source_type'],$c['source_reference'],$c['sort_order'],$c['notes']]);
    }

    $adjStmt=$pdo->prepare("INSERT INTO quotation_version_adjustments
        (quotation_version_id,group_code_snapshot,section_code_snapshot,adjustment_type,calculation_type,direction,value,base_amount,amount,customer_visible,reason,sort_order)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach($data['adjustments'] as $a){
        $adjStmt->execute([$versionId,$groupCodeById[(int)($a['group_id']??0)]??null,$sectionCodeById[(int)($a['section_id']??0)]??null,$a['adjustment_type'],$a['calculation_type'],$a['direction'],$a['value'],$a['base_amount'],$a['amount'],$a['customer_visible'],$a['reason'],$a['sort_order']]);
    }

    $mileStmt=$pdo->prepare("INSERT INTO quotation_version_payment_milestones
        (quotation_version_id,label,calculation_type,value,amount,due_trigger,due_date,customer_visible,sort_order,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?)");
    foreach($data['milestones'] as $m){
        $mileStmt->execute([$versionId,$m['label'],$m['calculation_type'],$m['value'],$m['amount'],$m['due_trigger'],$m['due_date'],$m['customer_visible'],$m['sort_order'],$m['notes']]);
    }

    quotation_workflow_event($pdo,$quotationId,$versionId,'snapshot_created',$staffId,null,$status,$changeSummary,['version_no'=>$versionNo,'snapshot_hash'=>$hash]);
    return $versionId;
}

function quotation_workflow_compare(float $value,string $operator,float $threshold): bool
{
    return match($operator){
        'gt'=>$value>$threshold,
        'gte'=>$value>=$threshold,
        'lt'=>$value<$threshold,
        'lte'=>$value<=$threshold,
        'eq'=>abs($value-$threshold)<0.0001,
        default=>false,
    };
}

function quotation_workflow_rule_metrics(PDO $pdo,array $quote): array
{
    $override=$pdo->prepare("SELECT COALESCE(SUM(ABS(standard_amount-amount)),0) FROM quotation_items WHERE quotation_id=? AND is_price_overridden=1");
    $override->execute([(int)$quote['id']]);
    $overrideVariance=(float)$override->fetchColumn();
    $discountPercent=(float)$quote['selling_price_before_discount']>0
        ? ((float)$quote['discount_amount']/(float)$quote['selling_price_before_discount'])*100
        : 0.0;
    return [
        'discount_amount'=>(float)$quote['discount_amount'],
        'discount_percent'=>$discountPercent,
        'gross_margin_percent'=>(float)$quote['gross_margin_percent'],
        'package_adjustment'=>abs((float)$quote['commercial_adjustment_amount']),
        'manual_price_override'=>$overrideVariance,
        'foc_value'=>(float)$quote['foc_retail_value'],
        'quotation_total'=>(float)$quote['final_total'],
        'other'=>0.0,
    ];
}

function quotation_workflow_request_type(string $trigger): string
{
    return match($trigger){
        'discount_amount','discount_percent'=>'quotation_discount',
        'gross_margin_percent'=>'low_margin',
        'package_adjustment'=>'quotation_package_adjustment',
        'manual_price_override'=>'quotation_price_override',
        'foc_value'=>'quotation_foc',
        default=>'quotation_change',
    };
}

function quotation_workflow_pick_approver(PDO $pdo,?int $roleId,int $requesterId): ?int
{
    if($roleId){
        $q=$pdo->prepare('SELECT id FROM staff WHERE role_id=? AND is_active=1 AND id<>? ORDER BY id LIMIT 1');
        $q->execute([$roleId,$requesterId]);
        $id=$q->fetchColumn();
        if($id!==false) return (int)$id;
    }

    $q=$pdo->prepare("SELECT DISTINCT s.id
        FROM staff s
        JOIN roles r ON r.id=s.role_id
        JOIN role_permissions rp ON rp.role_id=r.id
        JOIN permissions p ON p.id=rp.permission_id AND p.permission_key='quotation.approve'
        WHERE s.is_active=1 AND s.id<>?
        ORDER BY r.hierarchy_level,s.id LIMIT 1");
    $q->execute([$requesterId]);
    $id=$q->fetchColumn();
    return $id!==false?(int)$id:null;
}

function quotation_workflow_requirements(PDO $pdo,array $quote,int $requesterId): array
{
    $metrics=quotation_workflow_rule_metrics($pdo,$quote);
    $rules=$pdo->query("SELECT * FROM quotation_approval_rules WHERE is_active=1 ORDER BY priority,id")->fetchAll(PDO::FETCH_ASSOC);
    $requirements=[];
    foreach($rules as $rule){
        $trigger=$rule['trigger_type'];
        $value=(float)($metrics[$trigger]??0);
        if(!quotation_workflow_compare($value,$rule['comparison_operator'],(float)$rule['threshold_value'])) continue;
        $requirements[]=[
            'rule_id'=>(int)$rule['id'],
            'request_type'=>quotation_workflow_request_type($trigger),
            'reason'=>$rule['name'].' · '.ucwords(str_replace('_',' ',$trigger)).' '.number_format($value,2).' triggered '.$rule['comparison_operator'].' '.number_format((float)$rule['threshold_value'],2),
            'requested_value'=>$value,
            'assigned_approver'=>quotation_workflow_pick_approver($pdo,$rule['approver_role_id']?(int)$rule['approver_role_id']:null,$requesterId),
            'metadata'=>['rule_code'=>$rule['rule_code'],'trigger_type'=>$trigger,'actual_value'=>$value,'operator'=>$rule['comparison_operator'],'threshold'=>(float)$rule['threshold_value']],
        ];
    }

    $packageRequiresApproval=quotation_setting($pdo,'quotation_package_adjustment_requires_approval','1')==='1';
    $hasPackageRule=false;
    foreach($requirements as $requirement){
        if(($requirement['metadata']['trigger_type']??'')==='package_adjustment'){$hasPackageRule=true;break;}
    }
    if($packageRequiresApproval && !$hasPackageRule && (float)$metrics['package_adjustment']>0.0001){
        $requirements[]=[
            'rule_id'=>null,
            'request_type'=>'quotation_package_adjustment',
            'reason'=>'Package/commercial adjustment requires management approval under quotation policy.',
            'requested_value'=>(float)$metrics['package_adjustment'],
            'assigned_approver'=>quotation_workflow_pick_approver($pdo,null,$requesterId),
            'metadata'=>['trigger_type'=>'package_adjustment','actual_value'=>(float)$metrics['package_adjustment'],'policy'=>'quotation_package_adjustment_requires_approval'],
        ];
    }
    return $requirements;
}

function quotation_workflow_submit(PDO $pdo,int $quotationId,int $staffId,string $changeSummary,bool $submitterCanApprove): array
{
    $data=quotation_workflow_master_data($pdo,$quotationId);
    $quote=$data['quote'];
    if(!in_array($quote['status'],['draft','rejected'],true)){
        throw new RuntimeException('Only a draft or rejected working revision can be submitted.');
    }
    $versionNo=max(1,(int)$quote['current_version_no']);

    $existing=$pdo->prepare('SELECT id,status,is_locked FROM quotation_versions WHERE quotation_id=? AND version_no=? LIMIT 1');
    $existing->execute([$quotationId,$versionNo]);
    $existingVersion=$existing->fetch(PDO::FETCH_ASSOC);
    if($existingVersion && !in_array($existingVersion['status'],['draft','rejected'],true)){
        throw new RuntimeException('This revision already has a frozen workflow snapshot. Start a new revision.');
    }

    $versionId=quotation_workflow_snapshot($pdo,$quotationId,$versionNo,$staffId,$changeSummary,'draft');
    $requirements=quotation_workflow_requirements($pdo,$quote,$staffId);

    $forceApproval=quotation_setting($pdo,'quotation_require_approval_for_non_approvers','1')==='1';
    if(!$submitterCanApprove && $forceApproval && !$requirements){
        $requirements[]=[
            'rule_id'=>null,'request_type'=>'quotation_change','reason'=>'Quotation requires management approval before it can be issued.',
            'requested_value'=>(float)$quote['final_total'],'assigned_approver'=>quotation_workflow_pick_approver($pdo,null,$staffId),
            'metadata'=>['trigger_type'=>'permission','actual_value'=>(float)$quote['final_total']]
        ];
    }

    if(!$requirements){
        // Approved commercial snapshots are immutable by design.
        $pdo->prepare("UPDATE quotation_versions SET status='approved',is_locked=1,approved_by=?,approved_at=NOW() WHERE id=?")->execute([$staffId,$versionId]);
        $pdo->prepare("UPDATE quotations SET status='approved',approved_by=?,approved_at=NOW(),last_revised_at=NOW() WHERE id=?")->execute([$staffId,$quotationId]);
        $pdo->prepare("INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,?,'approved',?,?)")
            ->execute([$quotationId,$quote['status'],$staffId,'Revision '.$versionNo.' auto-approved; no active approval rule was triggered.']);
        quotation_workflow_event($pdo,$quotationId,$versionId,'auto_approved',$staffId,$quote['status'],'approved',$changeSummary,['version_no'=>$versionNo]);
        return ['version_id'=>$versionId,'version_no'=>$versionNo,'status'=>'approved','requests'=>0];
    }

    $requestStmt=$pdo->prepare("INSERT INTO approval_requests
        (request_type,entity_type,entity_id,quotation_version_id,approval_rule_id,project_id,requested_by,assigned_approver,status,reason,requested_value,metadata_json)
        VALUES(?,?,?,?,?,?,?,?, 'pending',?,?,?)");
    $actionStmt=$pdo->prepare("INSERT INTO approval_actions(approval_request_id,staff_id,action,comment) VALUES(?,?,'submitted',?)");
    foreach($requirements as $req){
        $requestStmt->execute([
            $req['request_type'],'quotation',$quotationId,$versionId,$req['rule_id'],$quote['project_id'],$staffId,$req['assigned_approver'],
            $req['reason'],$req['requested_value'],json_encode($req['metadata'],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)
        ]);
        $requestId=(int)$pdo->lastInsertId();
        $actionStmt->execute([$requestId,$staffId,$req['reason']]);
    }

    $pdo->prepare("UPDATE quotation_versions SET status='pending_approval' WHERE id=?")->execute([$versionId]);
    $pdo->prepare("UPDATE quotations SET status='pending_approval',last_revised_at=NOW() WHERE id=?")->execute([$quotationId]);
    $pdo->prepare("INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,?,'pending_approval',?,?)")
        ->execute([$quotationId,$quote['status'],$staffId,'Revision '.$versionNo.' submitted with '.count($requirements).' approval requirement(s).']);
    quotation_workflow_event($pdo,$quotationId,$versionId,'submitted_for_approval',$staffId,$quote['status'],'pending_approval',$changeSummary,['version_no'=>$versionNo,'requirements'=>count($requirements)]);
    return ['version_id'=>$versionId,'version_no'=>$versionNo,'status'=>'pending_approval','requests'=>count($requirements)];
}

function quotation_workflow_refresh_approval_state(PDO $pdo,int $versionId,int $staffId,?string $decisionNote=null): string
{
    $v=$pdo->prepare('SELECT * FROM quotation_versions WHERE id=? LIMIT 1');
    $v->execute([$versionId]);
    $version=$v->fetch(PDO::FETCH_ASSOC);
    if(!$version) throw new RuntimeException('Quotation revision not found.');

    $r=$pdo->prepare("SELECT status FROM approval_requests WHERE quotation_version_id=?");
    $r->execute([$versionId]);
    $statuses=$r->fetchAll(PDO::FETCH_COLUMN);
    if(!$statuses) return $version['status'];

    $quotationId=(int)$version['quotation_id'];
    $q=$pdo->prepare('SELECT status FROM quotations WHERE id=?');
    $q->execute([$quotationId]);
    $quoteStatus=(string)$q->fetchColumn();

    if(in_array('rejected',$statuses,true)){
        if($version['status']!=='rejected'){
            $pdo->prepare("UPDATE quotation_versions SET status='rejected',is_locked=1 WHERE id=?")->execute([$versionId]);
            $pdo->prepare("UPDATE quotations SET status='rejected',pricing_locked=1 WHERE id=?")->execute([$quotationId]);
            $pdo->prepare("INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,?,'rejected',?,?)")
                ->execute([$quotationId,$quoteStatus,$staffId,$decisionNote?:'Quotation revision rejected during approval.']);
            quotation_workflow_event($pdo,$quotationId,$versionId,'rejected',$staffId,$quoteStatus,'rejected',$decisionNote);
        }
        return 'rejected';
    }

    if(in_array('pending',$statuses,true)) return 'pending_approval';

    if($version['status']!=='approved'){
        // Approved commercial snapshots are immutable by design.
        $pdo->prepare("UPDATE quotation_versions SET status='approved',is_locked=1,approved_by=?,approved_at=NOW() WHERE id=?")->execute([$staffId,$versionId]);
        $pdo->prepare("UPDATE quotations SET status='approved',approved_by=?,approved_at=NOW(),pricing_locked=1 WHERE id=?")->execute([$staffId,$quotationId]);
        $pdo->prepare("INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,?,'approved',?,?)")
            ->execute([$quotationId,$quoteStatus,$staffId,$decisionNote?:'All approval requirements completed.']);
        quotation_workflow_event($pdo,$quotationId,$versionId,'approved',$staffId,$quoteStatus,'approved',$decisionNote);
    }
    return 'approved';
}

function quotation_workflow_issue(PDO $pdo,int $quotationId,int $versionId,int $staffId,?string $notes=null): void
{
    $v=$pdo->prepare('SELECT * FROM quotation_versions WHERE id=? AND quotation_id=? LIMIT 1');
    $v->execute([$versionId,$quotationId]);
    $version=$v->fetch(PDO::FETCH_ASSOC);
    if(!$version || $version['status']!=='approved') throw new RuntimeException('Only an approved quotation revision can be issued.');

    $q=$pdo->prepare('SELECT status,lead_id,project_id FROM quotations WHERE id=?');
    $q->execute([$quotationId]);
    $quote=$q->fetch(PDO::FETCH_ASSOC);
    if(!$quote) throw new RuntimeException('Quotation not found.');

    $oldIssued=$pdo->prepare("SELECT id FROM quotation_versions WHERE quotation_id=? AND id<>? AND status='issued'");
    $oldIssued->execute([$quotationId,$versionId]);
    foreach($oldIssued->fetchAll(PDO::FETCH_COLUMN) as $oldVersionId){
        $pdo->prepare("UPDATE quotation_versions SET status='superseded',is_locked=1 WHERE id=?")->execute([(int)$oldVersionId]);
        quotation_workflow_event($pdo,$quotationId,(int)$oldVersionId,'superseded',$staffId,'issued','superseded','A newer quotation revision was issued.');
    }

    $pdo->prepare("UPDATE quotation_versions SET status='issued',is_locked=1,issued_by=?,issued_at=NOW() WHERE id=?")->execute([$staffId,$versionId]);
    $pdo->prepare("UPDATE quotations SET status='sent',pricing_locked=1,sent_at=NOW(),last_revised_at=NOW() WHERE id=?")->execute([$quotationId]);
    $pdo->prepare("INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,?,'sent',?,?)")
        ->execute([$quotationId,$quote['status'],$staffId,$notes?:'Revision '.$version['version_no'].' issued to customer.']);

    if(!empty($quote['lead_id'])){
        $pdo->prepare("UPDATE leads SET stage=IF(stage IN('won','lost'),stage,'quotation_sent') WHERE id=?")->execute([(int)$quote['lead_id']]);
    }
    quotation_workflow_event($pdo,$quotationId,$versionId,'issued',$staffId,'approved','issued',$notes,['version_no'=>(int)$version['version_no']]);
}

function quotation_workflow_customer_decision(
    PDO $pdo,
    int $quotationId,
    int $versionId,
    int $staffId,
    string $decision,
    string $customerName,
    string $method,
    ?string $notes=null
): void {
    if(!in_array($decision,['accepted','rejected'],true)) throw new RuntimeException('Invalid customer decision.');
    if(!in_array($method,['manual','signed','customer_portal','email','whatsapp','other'],true)) $method='manual';

    $v=$pdo->prepare('SELECT * FROM quotation_versions WHERE id=? AND quotation_id=? LIMIT 1');
    $v->execute([$versionId,$quotationId]);
    $version=$v->fetch(PDO::FETCH_ASSOC);
    // A customer decision belongs to the exact revision that was actually issued.
    if(!$version || $version['status']!=='issued'){
        throw new RuntimeException('Customer decision must be recorded against the issued revision.');
    }
    $decisionFromStatus=$version['status'];

    $q=$pdo->prepare('SELECT * FROM quotations WHERE id=? LIMIT 1');
    $q->execute([$quotationId]);
    $quote=$q->fetch(PDO::FETCH_ASSOC);
    if(!$quote) throw new RuntimeException('Quotation not found.');

    $pdo->prepare("UPDATE quotation_versions SET status=?,is_locked=1,customer_decision_at=NOW(),customer_decision_by=?,customer_decision_method=?,customer_decision_notes=? WHERE id=?")
        ->execute([$decision,$customerName?:null,$method,$notes,$versionId]);

    if($decision==='accepted'){
        $pdo->prepare("UPDATE quotations SET status='accepted',accepted_version_id=?,accepted_at=NOW(),accepted_by_name=?,acceptance_method=?,acceptance_notes=?,pricing_locked=1 WHERE id=?")
            ->execute([$versionId,$customerName?:null,$method,$notes,$quotationId]);
        if(!empty($quote['project_id'])){
            $pdo->prepare("UPDATE projects SET accepted_quotation_id=?,accepted_quotation_version_id=?,approved_value=?,status=IF(status IN('completed','cancelled'),status,'approved') WHERE id=?")
                ->execute([$quotationId,$versionId,$version['total_amount'],(int)$quote['project_id']]);
        }
        if(!empty($quote['lead_id'])) $pdo->prepare("UPDATE leads SET stage='won',probability=100 WHERE id=?")->execute([(int)$quote['lead_id']]);
        quotation_workflow_event($pdo,$quotationId,$versionId,'customer_accepted',$staffId,$decisionFromStatus,'accepted',$notes,['customer'=>$customerName,'method'=>$method]);
    }else{
        $pdo->prepare("UPDATE quotations SET status='rejected',pricing_locked=1 WHERE id=?")->execute([$quotationId]);
        if(!empty($quote['lead_id'])) $pdo->prepare("UPDATE leads SET stage=IF(stage='won',stage,'negotiation') WHERE id=?")->execute([(int)$quote['lead_id']]);
        quotation_workflow_event($pdo,$quotationId,$versionId,'customer_rejected',$staffId,$decisionFromStatus,'rejected',$notes,['customer'=>$customerName,'method'=>$method]);
    }

    $pdo->prepare("INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,? ,?, ?,?)")
        ->execute([$quotationId,$quote['status'],$decision,$staffId,$notes?:('Customer '.$decision.' revision '.$version['version_no'].'.')]);
}

function quotation_workflow_withdraw_approval(PDO $pdo,int $quotationId,int $staffId,?string $notes=null): int
{
    $q=$pdo->prepare('SELECT * FROM quotations WHERE id=? LIMIT 1');
    $q->execute([$quotationId]);
    $quote=$q->fetch(PDO::FETCH_ASSOC);
    if(!$quote) throw new RuntimeException('Quotation not found.');
    if($quote['status']!=='pending_approval') throw new RuntimeException('Only a pending approval can be withdrawn.');

    $version=$pdo->prepare('SELECT * FROM quotation_versions WHERE quotation_id=? AND version_no=? LIMIT 1');
    $version->execute([$quotationId,max(1,(int)$quote['current_version_no'])]);
    $revision=$version->fetch(PDO::FETCH_ASSOC);
    if(!$revision || $revision['status']!=='pending_approval') throw new RuntimeException('The current pending quotation revision could not be found.');

    $pending=$pdo->prepare("SELECT id FROM approval_requests WHERE quotation_version_id=? AND status='pending'");
    $pending->execute([(int)$revision['id']]);
    $requestIds=array_map('intval',$pending->fetchAll(PDO::FETCH_COLUMN));
    if($requestIds){
        $cancel=$pdo->prepare("UPDATE approval_requests SET status='cancelled',decided_at=NOW() WHERE id=? AND status='pending'");
        $action=$pdo->prepare("INSERT INTO approval_actions(approval_request_id,staff_id,action,comment) VALUES(?,?,'cancelled',?)");
        foreach($requestIds as $requestId){
            $cancel->execute([$requestId]);
            $action->execute([$requestId,$staffId,$notes?:'Approval withdrawn so a new quotation revision can be prepared.']);
        }
    }

    $pdo->prepare("UPDATE quotation_versions SET status='cancelled',is_locked=1 WHERE id=?")
        ->execute([(int)$revision['id']]);
    $pdo->prepare("UPDATE quotations SET status='cancelled',pricing_locked=1 WHERE id=?")
        ->execute([$quotationId]);
    $pdo->prepare("INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,'pending_approval','cancelled',?,?)")
        ->execute([$quotationId,$staffId,$notes?:'Approval workflow withdrawn.']);
    quotation_workflow_event($pdo,$quotationId,(int)$revision['id'],'comment',$staffId,'pending_approval','cancelled',$notes?:'Approval workflow withdrawn.');

    return quotation_workflow_start_revision($pdo,$quotationId,$staffId,$notes?:'New revision started after withdrawing approval.');
}

function quotation_workflow_start_revision(PDO $pdo,int $quotationId,int $staffId,?string $notes=null): int
{
    $q=$pdo->prepare('SELECT * FROM quotations WHERE id=? LIMIT 1');
    $q->execute([$quotationId]);
    $quote=$q->fetch(PDO::FETCH_ASSOC);
    if(!$quote) throw new RuntimeException('Quotation not found.');
    if($quote['status']==='pending_approval') throw new RuntimeException('Resolve or cancel the pending approval before starting another revision.');
    if($quote['status']==='accepted') throw new RuntimeException('Accepted quotations are locked. Handle post-acceptance changes as a project variation rather than rewriting the accepted quotation.');

    $max=$pdo->prepare('SELECT COALESCE(MAX(version_no),0) FROM quotation_versions WHERE quotation_id=?');
    $max->execute([$quotationId]);
    $newVersion=max((int)$quote['current_version_no'],(int)$max->fetchColumn())+1;

    $pdo->prepare("UPDATE quotations SET current_version_no=?,status='draft',pricing_locked=0,approved_by=NULL,approved_at=NULL,sent_at=NULL,last_revised_at=NOW() WHERE id=?")
        ->execute([$newVersion,$quotationId]);
    $pdo->prepare("INSERT INTO quotation_status_history(quotation_id,old_status,new_status,changed_by,notes) VALUES(?,?,'draft',?,?)")
        ->execute([$quotationId,$quote['status'],$staffId,$notes?:'Revision '.$newVersion.' started.']);

    $lastVersion=$pdo->prepare('SELECT id FROM quotation_versions WHERE quotation_id=? ORDER BY version_no DESC LIMIT 1');
    $lastVersion->execute([$quotationId]);
    $lastId=$lastVersion->fetchColumn();
    quotation_workflow_event($pdo,$quotationId,$lastId!==false?(int)$lastId:null,'revision_started',$staffId,$quote['status'],'draft',$notes,['new_version_no'=>$newVersion]);
    return $newVersion;
}

function quotation_workflow_replace_master_pricing(
    PDO $pdo,
    int $quotationId,
    array $pricing,
    int $staffId,
    array $meta=[]
): void {
    foreach(['quotation_adjustments','quotation_cost_components','quotation_charges','quotation_items','quotation_sections','quotation_groups'] as $table){
        $pdo->prepare("DELETE FROM `$table` WHERE quotation_id=?")->execute([$quotationId]);
    }

    $groupIds=[];$sectionIds=[];$itemIds=[];
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
        $groupStmt->execute([$quotationId,$group['group_code'],$group['group_name'],$group['group_type'],$group['pricing_mode'],$group['item_subtotal'],$group['internal_cost'],$group['package_target_total'],$group['adjustment_amount'],$group['final_total'],$group['show_on_customer_quote'],$group['show_breakdown'],$group['sort_order'],$group['notes']]);
        $groupId=(int)$pdo->lastInsertId();$groupIds[$group['client_key']]=$groupId;
        foreach($group['sections'] as $section){
            $sectionStmt->execute([$quotationId,$groupId,$section['section_code'],$section['section_name'],$section['description'],$section['section_subtotal'],$section['internal_cost'],$section['final_total'],$section['show_on_customer_quote'],$section['show_section_total'],$section['sort_order']]);
            $sectionId=(int)$pdo->lastInsertId();$sectionIds[$section['client_key']]=$sectionId;
            foreach($section['items'] as $item){
                $overrideStaff=$item['is_price_overridden']?$staffId:null;
                $itemStmt->execute([$quotationId,$sectionId,$item['rate_book_item_id'],$item['item_type'],$item['pricing_method'],$item['description'],$item['measurement_text'],$item['width_value'],$item['height_value'],$item['depth_value'],$item['measurement_unit'],$item['quantity'],$item['unit'],$item['unit_price'],$item['amount'],$item['standard_unit_price'],$item['standard_amount'],$item['is_foc'],$item['foc_reason'],$item['is_price_overridden'],$item['override_reason'],$overrideStaff,$overrideStaff?date('Y-m-d H:i:s'):null,$item['internal_unit_cost'],$item['internal_total_cost'],$item['internal_line_cost'],$item['show_on_customer_quote'],$item['taxable'],$item['source_type'],$item['source_id'],$item['source_reference'],$item['rate_snapshot_json'],$item['sort_order'],$item['notes']]);
                $itemId=(int)$pdo->lastInsertId();$itemIds[$item['client_key']]=$itemId;
                if(($item['base_internal_total_cost']??$item['internal_total_cost'])>0){
                    $costSort++;
                    $costStmt->execute([$quotationId,$sectionId,$itemId,quotation_cost_category_for_item($item['item_type']),$item['description'],$item['quantity'],$item['unit'],$item['internal_unit_cost'],$item['base_internal_total_cost']??$item['internal_total_cost'],$item['source_type'],$item['source_id'],$item['source_reference'],1,$costSort,$item['notes'],$staffId]);
                }
                if(($item['waste_cost']??0)>0){
                    $costSort++;
                    $costStmt->execute([$quotationId,$sectionId,$itemId,'waste',$item['description'].' · waste allowance',1,'allowance',$item['waste_cost'],$item['waste_cost'],'rate_book_waste',$item['rate_book_item_id'],$item['source_reference'],1,$costSort,'Rate Book waste allowance '.number_format((float)($item['waste_percent']??0),2).'%',$staffId]);
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
        $chargeStmt->execute([$quotationId,$groupId,$sectionId,$charge['rate_book_item_id'],$charge['charge_code'],$charge['charge_name'],$charge['charge_category'],$charge['calculation_type'],$charge['calculation_base'],$charge['rate'],$charge['base_amount'],$charge['amount'],$charge['internal_cost_amount'],$charge['customer_amount'],$charge['internal_only'],$charge['is_internal_only'],$charge['taxable'],$charge['source_type'],$charge['source_id'],$charge['source_reference'],$charge['sort_order'],$charge['notes']]);
        if($charge['internal_cost_amount']>0){
            $costSort++;
            $costStmt->execute([$quotationId,$sectionId,null,quotation_cost_category_for_charge($charge['charge_category']),$charge['charge_name'],1,'charge',$charge['internal_cost_amount'],$charge['internal_cost_amount'],$charge['source_type'],$charge['source_id'],$charge['source_reference'],0,$costSort,$charge['notes'],$staffId]);
        }
    }
    if($pricing['overhead_amount']>0){$costSort++;$costStmt->execute([$quotationId,null,null,'overhead','Quotation overhead',1,'%',$pricing['overhead_amount'],$pricing['overhead_amount'],'system',null,null,0,$costSort,'Calculated at '.$pricing['overhead_percent'].'%',$staffId]);}
    if($pricing['contingency_amount']>0){$costSort++;$costStmt->execute([$quotationId,null,null,'contingency','Quotation contingency',1,'%',$pricing['contingency_amount'],$pricing['contingency_amount'],'system',null,null,0,$costSort,'Calculated at '.$pricing['contingency_percent'].'%',$staffId]);}

    $adjustmentStmt=$pdo->prepare("INSERT INTO quotation_adjustments
        (quotation_id,group_id,section_id,quotation_item_id,adjustment_type,calculation_type,direction,value,base_amount,amount,customer_visible,requires_approval,reason,created_by,sort_order)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach($pricing['adjustments'] as $adjustment){
        $adjustmentStmt->execute([$quotationId,$adjustment['group_client_key']?($groupIds[$adjustment['group_client_key']]??null):null,$adjustment['section_client_key']?($sectionIds[$adjustment['section_client_key']]??null):null,$adjustment['quotation_item_client_key']?($itemIds[$adjustment['quotation_item_client_key']]??null):null,$adjustment['adjustment_type'],$adjustment['calculation_type'],$adjustment['direction'],$adjustment['value'],$adjustment['base_amount'],$adjustment['amount'],$adjustment['customer_visible'],$adjustment['requires_approval'],$adjustment['reason'],$staffId,$adjustment['sort_order']]);
    }

    $stmt=$pdo->prepare("UPDATE quotations SET
        quotation_title=?,reference_no=?,valid_until=?,customer_notes=?,internal_notes=?,terms_and_conditions=?,tax_name=?,
        direct_cost=?,waste_cost=?,overhead_amount=?,contingency_amount=?,internal_cost=?,markup_type=?,markup_value=?,markup_amount=?,
        selling_price_before_discount=?,standard_selling_price=?,commercial_adjustment_amount=?,foc_retail_value=?,discount_type=?,discount_value=?,discount_amount=?,
        subtotal=?,tax_percent=?,tax_amount=?,final_total=?,gross_profit=?,gross_margin_percent=?,status='draft',pricing_locked=0,last_revised_at=NOW()
        WHERE id=?");
    $stmt->execute([
        $meta['quotation_title']??null,$meta['reference_no']??null,$meta['valid_until']??null,$meta['customer_notes']??null,$meta['internal_notes']??null,$meta['terms_and_conditions']??null,$meta['tax_name']??null,
        $pricing['direct_cost'],$pricing['waste_cost'],$pricing['overhead_amount'],$pricing['contingency_amount'],$pricing['internal_cost'],$pricing['markup_type'],$pricing['markup_value'],$pricing['markup_amount'],
        $pricing['selling_price_before_discount'],$pricing['standard_selling_price'],$pricing['commercial_adjustment_amount'],$pricing['foc_retail_value'],$pricing['discount_type'],$pricing['discount_value'],$pricing['discount_amount'],
        $pricing['subtotal'],$pricing['tax_percent'],$pricing['tax_amount'],$pricing['final_total'],$pricing['gross_profit'],$pricing['gross_margin_percent'],$quotationId
    ]);
}
