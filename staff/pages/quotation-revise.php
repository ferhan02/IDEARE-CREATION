<?php
require_once __DIR__.'/../../includes/staff/operations.php';
require_once __DIR__.'/../../includes/staff/quotation-pricing.php';
require_once __DIR__.'/../../includes/staff/quotation-workflow.php';
require_permission('quotation.revise');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();
$id=(int)($_GET['id']??$_POST['id']??0);
if(!$id) staff_redirect('staff/pages/quotation-centre.php');
if(!db_table_exists($pdo,'quotation_version_events')) staff_redirect('staff/pages/quotation-centre.php');

function revision_rate_basis_one(array $item): float
{
    $method=$item['pricing_method']==='foc'?($item['rate_pricing_method']?:'quantity'):$item['pricing_method'];
    $tmp=$item;
    $tmp['quantity']=1;
    return max(0.000001,quotation_pricing_basis($tmp,$method,$item['rate_default_unit']??$item['unit']??null));
}

function revision_item_count(array $item): float
{
    $method=$item['pricing_method']==='foc'?($item['rate_pricing_method']?:'quantity'):$item['pricing_method'];
    if(in_array($method,['running_ft','running_m','area_sqft','area_sqm','dimension'],true) && (float)($item['width_value']??0)>0){
        return max(0,(float)$item['quantity']/revision_rate_basis_one($item));
    }
    if(in_array($method,['lump_sum','fixed'],true)) return 1;
    return max(0,(float)$item['quantity']);
}

function revision_load(PDO $pdo,int $quotationId): array
{
    $q=$pdo->prepare("SELECT q.*,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) salesperson_name FROM quotations q LEFT JOIN staff s ON s.id=COALESCE(q.salesperson_id,q.created_by) WHERE q.id=? LIMIT 1");
    $q->execute([$quotationId]);
    $quote=$q->fetch(PDO::FETCH_ASSOC);
    if(!$quote) throw new RuntimeException('Quotation not found.');

    $g=$pdo->prepare('SELECT * FROM quotation_groups WHERE quotation_id=? ORDER BY sort_order,id');$g->execute([$quotationId]);$groups=$g->fetchAll(PDO::FETCH_ASSOC);
    $s=$pdo->prepare('SELECT * FROM quotation_sections WHERE quotation_id=? ORDER BY sort_order,id');$s->execute([$quotationId]);$sections=$s->fetchAll(PDO::FETCH_ASSOC);
    $i=$pdo->prepare("SELECT qi.*,ri.pricing_method rate_pricing_method,ri.default_unit rate_default_unit,ri.rate_code,ri.name rate_name FROM quotation_items qi LEFT JOIN quotation_rate_items ri ON ri.id=qi.rate_book_item_id WHERE qi.quotation_id=? ORDER BY qi.sort_order,qi.id");$i->execute([$quotationId]);$items=$i->fetchAll(PDO::FETCH_ASSOC);
    $c=$pdo->prepare('SELECT * FROM quotation_charges WHERE quotation_id=? ORDER BY sort_order,id');$c->execute([$quotationId]);$charges=$c->fetchAll(PDO::FETCH_ASSOC);
    return compact('quote','groups','sections','items','charges');
}

try{$data=revision_load($pdo,$id);}catch(Throwable $e){http_response_code(404);exit(h($e->getMessage()));}
$q=$data['quote'];

if($q['status']!=='draft'){
    flash('error','Only a draft working revision can be edited. Start a new revision from the quotation workflow first.');
    staff_redirect('staff/pages/quotation-view.php?id='.$id);
}

if($_SERVER['REQUEST_METHOD']==='POST' && ($_POST['action']??'')==='save_revision'){
    try{
        $data=revision_load($pdo,$id);
        $q=$data['quote'];
        if($q['status']!=='draft') throw new RuntimeException('This revision is no longer editable.');

        $canViewCost=can('quotation.view_cost');
        $canOverridePrice=can('quotation.override_price');
        $canPackagePrice=can('quotation.package_price');
        $canDiscount=can('quotation.discount');
        $canEditMargin=can('quotation.edit_margin');
        $hasExistingOverride=false;
        foreach($data['items'] as $existingItem){
            if((int)($existingItem['is_price_overridden']??0)===1){$hasExistingOverride=true;break;}
        }
        $hasExistingPackage=false;
        foreach($data['groups'] as $existingGroup){
            if(($existingGroup['pricing_mode']??'itemized')!=='itemized'){$hasExistingPackage=true;break;}
        }

        $groupPost=(array)($_POST['groups']??[]);
        $sectionPost=(array)($_POST['sections']??[]);
        $itemPost=(array)($_POST['items']??[]);
        $chargePost=(array)($_POST['charges']??[]);
        $deleteItems=array_map('intval',array_keys((array)($_POST['delete_items']??[])));
        $deleteSections=array_map('intval',array_keys((array)($_POST['delete_sections']??[])));
        $deleteGroups=array_map('intval',array_keys((array)($_POST['delete_groups']??[])));
        $deleteCharges=array_map('intval',array_keys((array)($_POST['delete_charges']??[])));

        $sectionsByGroup=[];foreach($data['sections'] as $row)$sectionsByGroup[(int)$row['group_id']][]=$row;
        $itemsBySection=[];foreach($data['items'] as $row)$itemsBySection[(int)$row['section_id']][]=$row;

        $payloadGroups=[];
        foreach($data['groups'] as $g){
            $gid=(int)$g['id'];if(in_array($gid,$deleteGroups,true))continue;
            $gp=$groupPost[$gid]??[];
            $groupKey='g'.$gid;
            $sections=[];
            foreach($sectionsByGroup[$gid]??[] as $s){
                $sid=(int)$s['id'];if(in_array($sid,$deleteSections,true))continue;
                $sp=$sectionPost[$sid]??[];
                $sectionKey='s'.$sid;
                $sectionItems=[];
                foreach($itemsBySection[$sid]??[] as $item){
                    $iid=(int)$item['id'];if(in_array($iid,$deleteItems,true))continue;
                    $ip=$itemPost[$iid]??[];
                    $isFoc=!empty($ip['is_foc']);
                    $baseMethod=$item['pricing_method']==='foc'?($item['rate_pricing_method']?:'quantity'):$item['pricing_method'];
                    $count=max(0,quotation_num($ip['count']??revision_item_count($item),revision_item_count($item)));
                    $internalCost=$canViewCost?quotation_num($ip['internal_unit_cost']??$item['internal_unit_cost']):(float)$item['internal_unit_cost'];
                    $requestedUnitPrice=quotation_num($ip['unit_price']??$item['unit_price']);
                    $overrideReason=trim((string)($ip['override_reason']??$item['override_reason']));
                    if($item['rate_book_item_id'] && !$canOverridePrice){
                        if((int)($item['is_price_overridden']??0)===1){
                            $requestedUnitPrice=(float)$item['unit_price'];
                            $overrideReason=(string)($item['override_reason']??'');
                        }else{
                            // Omit a requested price so Stage 3 adopts the current Rate Book standard.
                            $requestedUnitPrice=null;
                            $overrideReason='';
                        }
                    }
                    $sectionItems[]=[
                        'client_key'=>'i'.$iid,'rate_book_item_id'=>$item['rate_book_item_id'],'item_type'=>$item['item_type'],
                        'pricing_method'=>$isFoc?'foc':$baseMethod,'base_pricing_method'=>$baseMethod,
                        'description'=>trim((string)($ip['description']??$item['description'])),'quantity'=>$count,'unit'=>trim((string)($ip['unit']??$item['unit'])),
                        'unit_price'=>$requestedUnitPrice,'standard_unit_price'=>(float)$item['standard_unit_price'],
                        'internal_unit_cost'=>$internalCost,'width_value'=>$ip['width_value']??$item['width_value'],'height_value'=>$ip['height_value']??$item['height_value'],
                        'depth_value'=>$ip['depth_value']??$item['depth_value'],'measurement_unit'=>$ip['measurement_unit']??$item['measurement_unit'],
                        'measurement_text'=>trim((string)($ip['measurement_text']??$item['measurement_text'])),'is_foc'=>$isFoc,'foc_reason'=>trim((string)($ip['foc_reason']??$item['foc_reason'])),
                        'override_reason'=>$overrideReason,'show_on_customer_quote'=>!empty($ip['show_on_customer_quote']),
                        'taxable'=>!empty($ip['taxable']),'source_type'=>$item['source_type'],'source_id'=>$item['source_id'],'source_reference'=>$item['source_reference'],'notes'=>trim((string)($ip['notes']??$item['notes']))
                    ];
                }

                $manual=(array)(($_POST['new_manual'][$sid]??[]));
                if(trim((string)($manual['description']??''))!==''){
                    $sectionItems[]=[
                        'client_key'=>'new_manual_'.$sid,'item_type'=>$manual['item_type']??'other','pricing_method'=>'quantity','base_pricing_method'=>'quantity',
                        'description'=>trim((string)$manual['description']),'quantity'=>max(0,quotation_num($manual['quantity']??1,1)),'unit'=>trim((string)($manual['unit']??'unit')),
                        'unit_price'=>max(0,quotation_num($manual['unit_price']??0)),'standard_unit_price'=>max(0,quotation_num($manual['unit_price']??0)),
                        'internal_unit_cost'=>$canViewCost?max(0,quotation_num($manual['internal_unit_cost']??0)):0,
                        'show_on_customer_quote'=>true,'taxable'=>true,'source_type'=>'manual','notes'=>trim((string)($manual['notes']??''))
                    ];
                }

                $rate=(array)(($_POST['new_rate'][$sid]??[]));
                $rateId=(int)($rate['rate_book_item_id']??0);
                if($rateId>0){
                    $sectionItems[]=[
                        'client_key'=>'new_rate_'.$sid.'_'.$rateId,'rate_book_item_id'=>$rateId,'description'=>'','quantity'=>max(0,quotation_num($rate['quantity']??1,1)),
                        'show_on_customer_quote'=>true,'taxable'=>true,'source_type'=>'rate_book'
                    ];
                }

                $sections[]=[
                    'client_key'=>$sectionKey,'section_code'=>strtoupper(trim((string)($sp['section_code']??$s['section_code']))),'section_name'=>trim((string)($sp['section_name']??$s['section_name'])),
                    'description'=>trim((string)($sp['description']??$s['description'])),'show_on_customer_quote'=>!empty($sp['show_on_customer_quote']),
                    'show_section_total'=>!empty($sp['show_section_total']),'items'=>$sectionItems
                ];
            }

            $newSection=(array)(($_POST['new_section'][$gid]??[]));
            if(trim((string)($newSection['section_name']??''))!==''){
                $code=strtoupper(trim((string)($newSection['section_code']??''))) ?: 'N'.($gid);
                $sections[]=['client_key'=>'new_section_'.$gid,'section_code'=>$code,'section_name'=>trim((string)$newSection['section_name']),'description'=>trim((string)($newSection['description']??'')),'show_on_customer_quote'=>true,'show_section_total'=>true,'items'=>[]];
            }

            if(!$sections) continue;
            $payloadGroups[]=[
                'client_key'=>$groupKey,'group_code'=>strtoupper(trim((string)($gp['group_code']??$g['group_code']))),'group_name'=>trim((string)($gp['group_name']??$g['group_name'])),
                'group_type'=>$gp['group_type']??$g['group_type'],
                'pricing_mode'=>$canPackagePrice?($gp['pricing_mode']??$g['pricing_mode']):$g['pricing_mode'],
                'package_target_total'=>$canPackagePrice?($gp['package_target_total']??$g['package_target_total']):$g['package_target_total'],
                'show_on_customer_quote'=>!empty($gp['show_on_customer_quote']),'show_breakdown'=>!empty($gp['show_breakdown']),'notes'=>trim((string)($gp['notes']??$g['notes'])),'sections'=>$sections
            ];
        }

        $newGroup=(array)($_POST['new_group']??[]);
        if(trim((string)($newGroup['group_name']??''))!==''){
            $code=strtoupper(trim((string)($newGroup['group_code']??''))) ?: 'NEW'.(count($payloadGroups)+1);
            $sectionCode=strtoupper(trim((string)($newGroup['section_code']??''))) ?: 'N'.(count($payloadGroups)+1);
            $payloadGroups[]=['client_key'=>'new_group','group_code'=>$code,'group_name'=>trim((string)$newGroup['group_name']),'group_type'=>$newGroup['group_type']??'standard','pricing_mode'=>'itemized','show_on_customer_quote'=>true,'show_breakdown'=>true,'sections'=>[
                ['client_key'=>'new_group_section','section_code'=>$sectionCode,'section_name'=>trim((string)($newGroup['section_name']??'New Section')),'description'=>'','show_on_customer_quote'=>true,'show_section_total'=>true,'items'=>[]]
            ]];
        }

        if(!$payloadGroups) throw new RuntimeException('A quotation must keep at least one group and section.');

        $payloadCharges=[];
        foreach($data['charges'] as $charge){
            $cid=(int)$charge['id'];
            $isHiddenInternal=(int)($charge['internal_only']??0)===1 && !$canViewCost;
            if(in_array($cid,$deleteCharges,true) && !$isHiddenInternal) continue;
            $cp=$isHiddenInternal?[]:($chargePost[$cid]??[]);
            $groupKey=!empty($charge['group_id'])?'g'.(int)$charge['group_id']:null;
            $sectionKey=!empty($charge['section_id'])?'s'.(int)$charge['section_id']:null;
            $payloadCharges[]=[
                'client_key'=>'c'.$cid,'group_client_key'=>$groupKey,'section_client_key'=>$sectionKey,'charge_code'=>$charge['charge_code'],'charge_name'=>trim((string)($cp['charge_name']??$charge['charge_name'])),
                'charge_category'=>$cp['charge_category']??$charge['charge_category'],'calculation_type'=>$cp['calculation_type']??$charge['calculation_type'],'calculation_base'=>$cp['calculation_base']??$charge['calculation_base'],
                'rate'=>max(0,quotation_num($cp['rate']??$charge['rate'])),'base_amount'=>max(0,quotation_num($cp['base_amount']??$charge['base_amount'])),
                'internal_only'=>$canViewCost?!empty($cp['internal_only']):(bool)$charge['internal_only'],
                'taxable'=>$isHiddenInternal?(bool)$charge['taxable']:!empty($cp['taxable']),'source_type'=>$charge['source_type'],'source_id'=>$charge['source_id'],'source_reference'=>$charge['source_reference'],'notes'=>trim((string)($cp['notes']??$charge['notes']))
            ];
        }
        $newCharge=(array)($_POST['new_charge']??[]);
        if(trim((string)($newCharge['charge_name']??''))!==''){
            $payloadCharges[]=['client_key'=>'new_charge','charge_name'=>trim((string)$newCharge['charge_name']),'charge_category'=>$newCharge['charge_category']??'other','calculation_type'=>'fixed','calculation_base'=>'manual','rate'=>max(0,quotation_num($newCharge['rate']??0)),'internal_only'=>$canViewCost&&!empty($newCharge['internal_only']),'taxable'=>!empty($newCharge['taxable']),'source_type'=>'manual'];
        }

        $existingOverheadPct=(float)$q['direct_cost']>0?((float)$q['overhead_amount']/(float)$q['direct_cost']*100):0.0;
        $existingContingencyPct=(float)$q['direct_cost']>0?((float)$q['contingency_amount']/(float)$q['direct_cost']*100):0.0;
        $payload=[
            'groups'=>$payloadGroups,'charges'=>$payloadCharges,
            'overhead_percent'=>$canEditMargin?quotation_num($_POST['overhead_percent']??$existingOverheadPct):$existingOverheadPct,
            'contingency_percent'=>$canEditMargin?quotation_num($_POST['contingency_percent']??$existingContingencyPct):$existingContingencyPct,
            'markup_type'=>$canEditMargin?($_POST['markup_type']??$q['markup_type']):$q['markup_type'],
            'markup_value'=>$canEditMargin?quotation_num($_POST['markup_value']??$q['markup_value']):(float)$q['markup_value'],
            'discount_type'=>$canDiscount?($_POST['discount_type']??$q['discount_type']):$q['discount_type'],
            'discount_value'=>$canDiscount?quotation_num($_POST['discount_value']??$q['discount_value']):(float)$q['discount_value'],
            'tax_percent'=>quotation_num($_POST['tax_percent']??$q['tax_percent'])
        ];
        $pricing=quotation_prepare_pricing($pdo,$payload,[
            'view_cost'=>$canViewCost,
            'override_price'=>$canOverridePrice||$hasExistingOverride,
            'package_price'=>$canPackagePrice||$hasExistingPackage,
            'discount'=>$canDiscount||$q['discount_type']!=='none',
            // Sensitive values are forced above when the user lacks edit permission.
            'edit_margin'=>true
        ]);

        $pdo->beginTransaction();
        quotation_workflow_replace_master_pricing($pdo,$id,$pricing,(int)$staff['id'],[
            'quotation_title'=>trim((string)($_POST['quotation_title']??$q['quotation_title']))?:null,
            'reference_no'=>trim((string)($_POST['reference_no']??$q['reference_no']))?:null,
            'valid_until'=>$_POST['valid_until']?:null,'customer_notes'=>trim((string)($_POST['customer_notes']??$q['customer_notes']))?:null,
            'internal_notes'=>can('quotation.view_cost')?(trim((string)($_POST['internal_notes']??$q['internal_notes']))?:null):$q['internal_notes'],
            'terms_and_conditions'=>trim((string)($_POST['terms_and_conditions']??$q['terms_and_conditions']))?:null,
            'tax_name'=>trim((string)($_POST['tax_name']??$q['tax_name']))?:null,
        ]);
        quotation_workflow_event($pdo,$id,null,'comment',(int)$staff['id'],'draft','draft',trim((string)($_POST['revision_note']??''))?:'Working revision updated.');
        $pdo->commit();
        log_activity('quotation.revise.edit','quotation',(string)$id,'Updated working revision v'.max(1,(int)$q['current_version_no']));
        flash('success','Revision changes saved and recalculated on the server.');
        staff_redirect('staff/pages/quotation-revise.php?id='.$id);
    }catch(Throwable $e){
        if($pdo->inTransaction())$pdo->rollBack();
        flash('error','Could not save revision: '.$e->getMessage());
        staff_redirect('staff/pages/quotation-revise.php?id='.$id);
    }
}

$data=revision_load($pdo,$id);$q=$data['quote'];
$sectionsByGroup=[];foreach($data['sections'] as $row)$sectionsByGroup[(int)$row['group_id']][]=$row;
$itemsBySection=[];foreach($data['items'] as $row)$itemsBySection[(int)$row['section_id']][]=$row;
$rateBook=$pdo->query("SELECT ri.id,ri.rate_code,ri.name,ri.pricing_method,ri.default_unit,ri.standard_selling_rate,rc.name category_name FROM quotation_rate_items ri JOIN quotation_rate_categories rc ON rc.id=ri.category_id WHERE ri.is_active=1 AND rc.is_active=1 AND (ri.effective_from IS NULL OR ri.effective_from<=CURDATE()) AND (ri.effective_to IS NULL OR ri.effective_to>=CURDATE()) ORDER BY rc.sort_order,ri.sort_order,ri.name")->fetchAll(PDO::FETCH_ASSOC);
$overheadPct=(float)$q['direct_cost']>0?((float)$q['overhead_amount']/(float)$q['direct_cost']*100):0;
$contingencyPct=(float)$q['direct_cost']>0?((float)$q['contingency_amount']/(float)$q['direct_cost']*100):0;
$pageTitle='Revise '.$q['quotation_code'];
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content quotation-revise-page">
<div class="page-head"><div><p class="eyebrow">Quotation Centre · Stage 4</p><h1>Revise <?= h($q['quotation_code']) ?></h1><p class="muted">Working revision v<?= max(1,(int)$q['current_version_no']) ?> · changes remain draft until submitted into the approval workflow.</p></div><div class="actions"><a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-view.php?id='.$id)) ?>">Back to quotation</a></div></div>

<form method="post" class="quotation-revision-form"><?= csrf_field() ?><input type="hidden" name="action" value="save_revision"><input type="hidden" name="id" value="<?= $id ?>">
<section class="staff-panel"><div class="section-title"><div><p class="eyebrow">Revision setup</p><h2>Document & commercial controls</h2></div><span class="pill">Draft v<?= max(1,(int)$q['current_version_no']) ?></span></div>
<div class="form-grid"><label>Quotation title<input name="quotation_title" value="<?= h($q['quotation_title']) ?>"></label><label>External reference<input name="reference_no" value="<?= h($q['reference_no']) ?>"></label><label>Valid until<input type="date" name="valid_until" value="<?= h($q['valid_until']) ?>"></label></div>
<?php if(can('quotation.view_cost') || can('quotation.edit_margin')): ?>
<div class="form-grid"><label>Overhead %<input type="number" step=".01" min="0" name="overhead_percent" value="<?= h(number_format($overheadPct,2,'.','')) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>></label><label>Contingency %<input type="number" step=".01" min="0" name="contingency_percent" value="<?= h(number_format($contingencyPct,2,'.','')) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>></label><label>Tax %<input type="number" step=".01" min="0" name="tax_percent" value="<?= h($q['tax_percent']) ?>"></label></div>
<div class="form-grid"><label>Margin benchmark<select name="markup_type" <?= can('quotation.edit_margin')?'':'disabled' ?>><?php foreach(['percentage'=>'Markup %','margin'=>'Target margin %','fixed'=>'Fixed profit'] as $k=>$v): ?><option value="<?= $k ?>" <?= $q['markup_type']===$k?'selected':'' ?>><?= h($v) ?></option><?php endforeach; ?></select></label><label>Benchmark value<input type="number" step=".01" name="markup_value" value="<?= h($q['markup_value']) ?>" <?= can('quotation.edit_margin')?'':'readonly' ?>></label><label>Tax name<input name="tax_name" value="<?= h($q['tax_name']) ?>"></label></div>
<?php else: ?>
<div class="two"><label>Tax %<input type="number" step=".01" min="0" name="tax_percent" value="<?= h($q['tax_percent']) ?>"></label><label>Tax name<input name="tax_name" value="<?= h($q['tax_name']) ?>"></label></div>
<?php endif; ?>
<?php if(can('quotation.discount')): ?><div class="two"><label>Discount type<select name="discount_type"><?php foreach(['none'=>'None','percentage'=>'Percentage','fixed'=>'Fixed'] as $k=>$v): ?><option value="<?= $k ?>" <?= $q['discount_type']===$k?'selected':'' ?>><?= h($v) ?></option><?php endforeach; ?></select></label><label>Discount value<input type="number" step=".01" min="0" name="discount_value" value="<?= h($q['discount_value']) ?>"></label></div><?php else: ?><input type="hidden" name="discount_type" value="<?= h($q['discount_type']) ?>"><input type="hidden" name="discount_value" value="<?= h($q['discount_value']) ?>"><?php endif; ?>
</section>

<?php foreach($data['groups'] as $g): $gid=(int)$g['id']; ?>
<section class="staff-panel revision-group-card">
<div class="section-title"><div><p class="eyebrow">Group <?= h($g['group_code']) ?></p><h2><?= h($g['group_name']) ?></h2></div><label class="check revision-delete"><input type="checkbox" name="delete_groups[<?= $gid ?>]" value="1"> Remove group</label></div>
<div class="form-grid"><label>Group code<input name="groups[<?= $gid ?>][group_code]" value="<?= h($g['group_code']) ?>"></label><label>Group name<input name="groups[<?= $gid ?>][group_name]" value="<?= h($g['group_name']) ?>"></label><label>Type<select name="groups[<?= $gid ?>][group_type]"><?php foreach(['standard','package','additional'] as $v): ?><option value="<?= $v ?>" <?= $g['group_type']===$v?'selected':'' ?>><?= h(ucfirst($v)) ?></option><?php endforeach; ?></select></label></div>
<div class="form-grid"><label>Pricing mode<select name="groups[<?= $gid ?>][pricing_mode]" <?= can('quotation.package_price')?'':'disabled' ?>><?php foreach(['itemized'=>'Itemized','package_target'=>'Package target','manual_total'=>'Manual group total'] as $k=>$v): ?><option value="<?= $k ?>" <?= $g['pricing_mode']===$k?'selected':'' ?>><?= h($v) ?></option><?php endforeach; ?></select></label><label>Package / target total<input type="number" step=".01" min="0" name="groups[<?= $gid ?>][package_target_total]" value="<?= h((string)$g['package_target_total']) ?>" <?= can('quotation.package_price')?'':'readonly' ?>></label><label>Notes<input name="groups[<?= $gid ?>][notes]" value="<?= h($g['notes']) ?>"></label></div>
<div class="two"><label class="check"><input type="checkbox" name="groups[<?= $gid ?>][show_on_customer_quote]" value="1" <?= (int)$g['show_on_customer_quote']?'checked':'' ?>> Show group to customer</label><label class="check"><input type="checkbox" name="groups[<?= $gid ?>][show_breakdown]" value="1" <?= (int)$g['show_breakdown']?'checked':'' ?>> Show item breakdown</label></div>

<?php foreach($sectionsByGroup[$gid]??[] as $s): $sid=(int)$s['id']; ?>
<div class="revision-section-card">
<div class="section-title"><div><p class="eyebrow">Section <?= h($s['section_code']) ?></p><h3><?= h($s['section_name']) ?></h3></div><label class="check revision-delete"><input type="checkbox" name="delete_sections[<?= $sid ?>]" value="1"> Remove section</label></div>
<div class="form-grid"><label>Code<input name="sections[<?= $sid ?>][section_code]" value="<?= h($s['section_code']) ?>"></label><label>Section name<input name="sections[<?= $sid ?>][section_name]" value="<?= h($s['section_name']) ?>"></label><label>Description<input name="sections[<?= $sid ?>][description]" value="<?= h($s['description']) ?>"></label></div>
<div class="two"><label class="check"><input type="checkbox" name="sections[<?= $sid ?>][show_on_customer_quote]" value="1" <?= (int)$s['show_on_customer_quote']?'checked':'' ?>> Show section</label><label class="check"><input type="checkbox" name="sections[<?= $sid ?>][show_section_total]" value="1" <?= (int)$s['show_section_total']?'checked':'' ?>> Show section total</label></div>
<div class="revision-item-list">
<?php foreach($itemsBySection[$sid]??[] as $item): $iid=(int)$item['id']; $count=revision_item_count($item); ?>
<div class="revision-item-row">
<div class="revision-item-head"><div><b><?= h($item['description']) ?></b><small><?= $item['rate_book_item_id']?'Rate Book · '.h($item['rate_code']?:$item['rate_name']):'Manual line' ?> · <?= h(str_replace('_',' ',$item['pricing_method'])) ?></small></div><label class="check revision-delete"><input type="checkbox" name="delete_items[<?= $iid ?>]" value="1"> Remove</label></div>
<div class="revision-item-grid"><label>Description<input name="items[<?= $iid ?>][description]" value="<?= h($item['description']) ?>"></label><label>Qty / count<input type="number" step=".001" min="0" name="items[<?= $iid ?>][count]" value="<?= h(number_format($count,3,'.','')) ?>"></label><label>Unit<input name="items[<?= $iid ?>][unit]" value="<?= h($item['unit']) ?>"></label><label>Selling rate<input type="number" step=".01" min="0" name="items[<?= $iid ?>][unit_price]" value="<?= h($item['unit_price']) ?>" <?= $item['rate_book_item_id']&&!can('quotation.override_price')?'readonly':'' ?>></label><?php if(can('quotation.view_cost')): ?><label>Internal cost rate<input type="number" step=".01" min="0" name="items[<?= $iid ?>][internal_unit_cost]" value="<?= h($item['internal_unit_cost']) ?>" <?= $item['rate_book_item_id']?'readonly':'' ?>></label><?php endif; ?></div>
<div class="revision-item-grid"><label>Width<input type="number" step=".001" min="0" name="items[<?= $iid ?>][width_value]" value="<?= h((string)$item['width_value']) ?>"></label><label>Height<input type="number" step=".001" min="0" name="items[<?= $iid ?>][height_value]" value="<?= h((string)$item['height_value']) ?>"></label><label>Depth<input type="number" step=".001" min="0" name="items[<?= $iid ?>][depth_value]" value="<?= h((string)$item['depth_value']) ?>"></label><label>Measurement unit<select name="items[<?= $iid ?>][measurement_unit]"><option value="">—</option><?php foreach(['mm','cm','m','ft','in'] as $u): ?><option value="<?= $u ?>" <?= $item['measurement_unit']===$u?'selected':'' ?>><?= $u ?></option><?php endforeach; ?></select></label><label>Measurement text<input name="items[<?= $iid ?>][measurement_text]" value="<?= h($item['measurement_text']) ?>"></label></div>
<div class="revision-item-grid"><label>Override reason<input name="items[<?= $iid ?>][override_reason]" value="<?= h($item['override_reason']) ?>" placeholder="Required when overriding Rate Book price"></label><label>FOC reason<input name="items[<?= $iid ?>][foc_reason]" value="<?= h($item['foc_reason']) ?>"></label><label>Notes<input name="items[<?= $iid ?>][notes]" value="<?= h($item['notes']) ?>"></label><label class="check"><input type="checkbox" name="items[<?= $iid ?>][is_foc]" value="1" <?= (int)$item['is_foc']?'checked':'' ?>> FOC</label><label class="check"><input type="checkbox" name="items[<?= $iid ?>][show_on_customer_quote]" value="1" <?= (int)$item['show_on_customer_quote']?'checked':'' ?>> Show</label><label class="check"><input type="checkbox" name="items[<?= $iid ?>][taxable]" value="1" <?= (int)$item['taxable']?'checked':'' ?>> Taxable</label></div>
</div>
<?php endforeach; ?>
</div>
<div class="revision-add-grid"><div><p class="eyebrow">Add Rate Book line</p><div class="two"><label>Rate<select name="new_rate[<?= $sid ?>][rate_book_item_id]"><option value="">Choose...</option><?php foreach($rateBook as $rate): ?><option value="<?= (int)$rate['id'] ?>"><?= h($rate['rate_code'].' · '.$rate['name'].' · '.money($rate['standard_selling_rate']).'/'.($rate['default_unit']?:'unit')) ?></option><?php endforeach; ?></select></label><label>Qty / count<input type="number" step=".001" min="0" name="new_rate[<?= $sid ?>][quantity]" value="1"></label></div></div><div><p class="eyebrow">Add manual line</p><div class="form-grid"><label>Description<input name="new_manual[<?= $sid ?>][description]" placeholder="Optional new line"></label><label>Qty<input type="number" step=".001" name="new_manual[<?= $sid ?>][quantity]" value="1"></label><label>Unit<input name="new_manual[<?= $sid ?>][unit]" value="unit"></label></div><div class="form-grid"><label>Selling rate<input type="number" step=".01" name="new_manual[<?= $sid ?>][unit_price]" value="0"></label><?php if(can('quotation.view_cost')): ?><label>Internal cost rate<input type="number" step=".01" name="new_manual[<?= $sid ?>][internal_unit_cost]" value="0"></label><?php endif; ?><label>Notes<input name="new_manual[<?= $sid ?>][notes]"></label></div></div></div>
</div>
<?php endforeach; ?>
<div class="revision-new-section"><p class="eyebrow">Add section to <?= h($g['group_name']) ?></p><div class="form-grid"><label>Code<input name="new_section[<?= $gid ?>][section_code]" placeholder="F"></label><label>Section name<input name="new_section[<?= $gid ?>][section_name]" placeholder="Leave blank to skip"></label><label>Description<input name="new_section[<?= $gid ?>][description]"></label></div></div>
</section>
<?php endforeach; ?>

<section class="staff-panel"><p class="eyebrow">Add scope group</p><h2>New quotation group</h2><div class="form-grid"><label>Group code<input name="new_group[group_code]" placeholder="ADD"></label><label>Group name<input name="new_group[group_name]" placeholder="Leave blank to skip"></label><label>Group type<select name="new_group[group_type]"><option value="standard">Standard</option><option value="package">Package</option><option value="additional">Additional</option></select></label></div><div class="two"><label>First section code<input name="new_group[section_code]" placeholder="F"></label><label>First section name<input name="new_group[section_name]" placeholder="Additional Works"></label></div></section>

<section class="staff-panel"><p class="eyebrow">Charges</p><h2>Additional & internal charges</h2><?php foreach($data['charges'] as $c): $cid=(int)$c['id']; if((int)$c['internal_only']===1 && !can('quotation.view_cost')) continue; ?><div class="revision-charge-row"><input name="charges[<?= $cid ?>][charge_name]" value="<?= h($c['charge_name']) ?>"><select name="charges[<?= $cid ?>][charge_category]"><?php foreach(['labour','installation','delivery','transport','measurement','design','subcontractor','waste','overhead','contingency','consumables','machine','disposal','parking_toll','surcharge','other'] as $v): ?><option value="<?= $v ?>" <?= $c['charge_category']===$v?'selected':'' ?>><?= h(str_replace('_',' ',$v)) ?></option><?php endforeach; ?></select><select name="charges[<?= $cid ?>][calculation_type]"><?php foreach(['fixed','percentage','per_unit','per_hour','per_day','per_trip'] as $v): ?><option value="<?= $v ?>" <?= $c['calculation_type']===$v?'selected':'' ?>><?= h(str_replace('_',' ',$v)) ?></option><?php endforeach; ?></select><select name="charges[<?= $cid ?>][calculation_base]"><?php foreach(['manual','direct_cost','internal_cost','selling_subtotal','group_subtotal','section_subtotal'] as $v): ?><option value="<?= $v ?>" <?= $c['calculation_base']===$v?'selected':'' ?>><?= h(str_replace('_',' ',$v)) ?></option><?php endforeach; ?></select><input type="number" step=".01" min="0" name="charges[<?= $cid ?>][rate]" value="<?= h($c['rate']) ?>"><input type="number" step=".01" min="0" name="charges[<?= $cid ?>][base_amount]" value="<?= h($c['base_amount']) ?>"><label class="check"><input type="checkbox" name="charges[<?= $cid ?>][internal_only]" value="1" <?= (int)$c['internal_only']?'checked':'' ?>> Internal</label><label class="check"><input type="checkbox" name="charges[<?= $cid ?>][taxable]" value="1" <?= (int)$c['taxable']?'checked':'' ?>> Taxable</label><label class="check revision-delete"><input type="checkbox" name="delete_charges[<?= $cid ?>]" value="1"> Remove</label></div><?php endforeach; ?><div class="revision-charge-row revision-new-charge"><input name="new_charge[charge_name]" placeholder="New fixed charge"><select name="new_charge[charge_category]"><option value="other">Other</option><option value="delivery">Delivery</option><option value="installation">Installation</option><option value="transport">Transport</option><option value="subcontractor">Subcontractor</option><option value="waste">Waste</option><option value="consumables">Consumables</option></select><input type="number" step=".01" min="0" name="new_charge[rate]" value="0"><?php if(can('quotation.view_cost')): ?><label class="check"><input type="checkbox" name="new_charge[internal_only]" value="1"> Internal</label><?php endif; ?><label class="check"><input type="checkbox" name="new_charge[taxable]" value="1" checked> Taxable</label></div></section>

<section class="staff-panel"><p class="eyebrow">Notes</p><h2>Revision notes & customer wording</h2><label>Revision work note<input name="revision_note" placeholder="What changed in this working revision?"></label><label>Customer notes<textarea name="customer_notes" rows="3"><?= h($q['customer_notes']) ?></textarea></label><?php if(can('quotation.view_cost')): ?><label>Internal notes<textarea name="internal_notes" rows="3"><?= h($q['internal_notes']) ?></textarea></label><?php endif; ?><label>Terms &amp; conditions<textarea name="terms_and_conditions" rows="5"><?= h($q['terms_and_conditions']) ?></textarea></label><div class="revision-save-bar"><div><strong>Current total <?= money($q['final_total']) ?></strong><small>Saving recalculates all totals using Stage 3 server pricing.</small></div><button class="btn primary" type="submit">Save revision changes</button></div></section>
</form>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
