<?php

declare(strict_types=1);

/**
 * Server-authoritative quotation pricing helpers for Quotation Centre Stage 3.
 * Browser calculations are previews only; these helpers recalculate all saved
 * quantities, rates, package adjustments, FOC values and totals.
 */

function quotation_num(mixed $value,float $default=0.0): float
{
    return is_numeric($value)?(float)$value:$default;
}

function quotation_bool(mixed $value): bool
{
    return in_array($value,[1,'1',true,'true','yes','on'],true);
}

function quotation_setting(PDO $pdo,string $key,string $default=''): string
{
    $q=$pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key=? LIMIT 1');
    $q->execute([$key]);
    $v=$q->fetchColumn();
    return $v!==false?(string)$v:$default;
}

function quotation_round_money(float $value): float
{
    return round($value,2);
}

function quotation_to_metres(float $value,string $unit): float
{
    return match($unit){
        'mm'=>$value/1000,
        'cm'=>$value/100,
        'ft'=>$value*0.3048,
        'in'=>$value*0.0254,
        default=>$value,
    };
}

function quotation_to_feet(float $value,string $unit): float
{
    return quotation_to_metres($value,$unit)/0.3048;
}

function quotation_measurement_text(array $item): string
{
    $width=quotation_num($item['width_value']??0);
    $height=quotation_num($item['height_value']??0);
    $depth=quotation_num($item['depth_value']??0);
    $unit=(string)($item['measurement_unit']??'');

    $parts=[];
    if($width>0) $parts[]='W '.rtrim(rtrim(number_format($width,3,'.',''),'0'),'.');
    if($height>0) $parts[]='H '.rtrim(rtrim(number_format($height,3,'.',''),'0'),'.');
    if($depth>0) $parts[]='D '.rtrim(rtrim(number_format($depth,3,'.',''),'0'),'.');

    return $parts?implode(' × ',$parts).($unit?' '.$unit:''):'';
}

function quotation_pricing_basis(array $item,string $method,?string $defaultUnit=null): float
{
    $qty=max(0,quotation_num($item['quantity']??1,1));
    $width=max(0,quotation_num($item['width_value']??0));
    $height=max(0,quotation_num($item['height_value']??0));
    $measurementUnit=(string)($item['measurement_unit']??'m');
    $count=$qty>0?$qty:1;

    return match($method){
        'running_ft'=>$width>0 ? quotation_to_feet($width,$measurementUnit)*$count : $qty,
        'running_m'=>$width>0 ? quotation_to_metres($width,$measurementUnit)*$count : $qty,
        'area_sqft'=>$width>0 && $height>0
            ? quotation_to_feet($width,$measurementUnit)*quotation_to_feet($height,$measurementUnit)*$count
            : $qty,
        'area_sqm'=>$width>0 && $height>0
            ? quotation_to_metres($width,$measurementUnit)*quotation_to_metres($height,$measurementUnit)*$count
            : $qty,
        'dimension'=>$width>0 && $height>0
            ? (str_contains(strtolower((string)$defaultUnit),'sqft')
                ? quotation_to_feet($width,$measurementUnit)*quotation_to_feet($height,$measurementUnit)*$count
                : quotation_to_metres($width,$measurementUnit)*quotation_to_metres($height,$measurementUnit)*$count)
            : $qty,
        'lump_sum','fixed'=>1.0,
        default=>$qty,
    };
}

function quotation_cost_category_for_item(string $itemType): string
{
    return match($itemType){
        'material','cabinet','countertop'=>'material',
        'hardware'=>'hardware',
        'labour'=>'labour',
        'installation'=>'installation',
        'delivery'=>'delivery',
        'subcontractor'=>'subcontractor',
        default=>'other',
    };
}

function quotation_cost_category_for_charge(string $chargeCategory): string
{
    return match($chargeCategory){
        'labour'=>'labour',
        'installation'=>'installation',
        'delivery'=>'delivery',
        'transport'=>'transport',
        'subcontractor'=>'subcontractor',
        'waste'=>'waste',
        'consumables'=>'consumables',
        'overhead'=>'overhead',
        'contingency'=>'contingency',
        'machine'=>'machine',
        'disposal'=>'disposal',
        'parking_toll'=>'parking_toll',
        'measurement','design'=>'site_cost',
        default=>'other',
    };
}

function quotation_rate_items_by_id(PDO $pdo,array $ids): array
{
    $ids=array_values(array_unique(array_filter(array_map('intval',$ids),fn($id)=>$id>0)));
    if(!$ids) return [];

    $placeholders=implode(',',array_fill(0,count($ids),'?'));
    $q=$pdo->prepare("SELECT ri.*,rc.category_code,rc.name category_name
                      FROM quotation_rate_items ri
                      JOIN quotation_rate_categories rc ON rc.id=ri.category_id
                      WHERE ri.id IN ($placeholders)");
    $q->execute($ids);

    $out=[];
    foreach($q->fetchAll(PDO::FETCH_ASSOC) as $row){
        $out[(int)$row['id']]=$row;
    }
    return $out;
}

/**
 * Recalculate all quotation pricing from primitive inputs.
 *
 * @param array $permissions Supported keys: view_cost, override_price, package_price,
 *                           discount, edit_margin.
 */
function quotation_prepare_pricing(PDO $pdo,array $payload,array $permissions=[]): array
{
    $groupsInput=is_array($payload['groups']??null)?$payload['groups']:[];
    $chargesInput=is_array($payload['charges']??null)?$payload['charges']:[];

    if(!$groupsInput){
        throw new RuntimeException('Add at least one quotation group.');
    }

    $rateIds=[];
    foreach($groupsInput as $group){
        foreach((array)($group['sections']??[]) as $section){
            foreach((array)($section['items']??[]) as $item){
                $rid=(int)($item['rate_book_item_id']??0);
                if($rid>0) $rateIds[]=$rid;
            }
        }
    }
    foreach($chargesInput as $charge){
        $rid=(int)($charge['rate_book_item_id']??0);
        if($rid>0) $rateIds[]=$rid;
    }
    $rateMap=quotation_rate_items_by_id($pdo,$rateIds);

    $requireOverrideReason=quotation_setting($pdo,'quotation_require_price_override_reason','1')==='1';
    $requireFocReason=quotation_setting($pdo,'quotation_foc_requires_reason','1')==='1';

    $allowedItemTypes=['material','cabinet','countertop','hardware','labour','installation','delivery','electrical','plumbing','ceiling','renovation','door_glass','service','subcontractor','other'];
    $allowedPricingMethods=['quantity','running_ft','running_m','area_sqft','area_sqm','set','lump_sum','fixed','dimension','manual','foc'];
    $allowedGroupTypes=['standard','package','additional'];
    $allowedGroupPricing=['itemized','package_target','manual_total'];

    $groups=[];
    $allItems=[];
    $sectionLookup=[];
    $groupLookup=[];
    $directItemCost=0.0;
    $embeddedWasteCost=0.0;
    $itemStandardSelling=0.0;
    $itemCustomerSelling=0.0;
    $focRetailValue=0.0;
    $commercialAdjustment=0.0;
    $sortGroup=0;
    $globalItemSort=0;
    $seenGroupCodes=[];
    $seenSectionCodes=[];

    foreach($groupsInput as $groupInput){
        $sortGroup++;
        $groupKey=trim((string)($groupInput['client_key']??'')) ?: 'g'.$sortGroup;
        $groupCode=strtoupper(trim((string)($groupInput['group_code']??''))) ?: 'G'.$sortGroup;
        if(isset($seenGroupCodes[$groupCode])) throw new RuntimeException('Quotation group codes must be unique.');
        $seenGroupCodes[$groupCode]=true;
        $groupName=trim((string)($groupInput['group_name']??'')) ?: 'Quotation Group '.$sortGroup;
        $groupType=(string)($groupInput['group_type']??'standard');
        if(!in_array($groupType,$allowedGroupTypes,true)) $groupType='standard';

        $pricingMode=(string)($groupInput['pricing_mode']??'itemized');
        if(!in_array($pricingMode,$allowedGroupPricing,true)) $pricingMode='itemized';
        if($pricingMode!=='itemized' && empty($permissions['package_price'])){
            throw new RuntimeException('You do not have permission to set package or manual group pricing.');
        }

        $group=[
            'client_key'=>$groupKey,
            'group_code'=>$groupCode,
            'group_name'=>$groupName,
            'group_type'=>$groupType,
            'pricing_mode'=>$pricingMode,
            'package_target_total'=>null,
            'show_on_customer_quote'=>quotation_bool($groupInput['show_on_customer_quote']??true),
            'show_breakdown'=>quotation_bool($groupInput['show_breakdown']??true),
            'notes'=>trim((string)($groupInput['notes']??''))?:null,
            'sort_order'=>$sortGroup,
            'sections'=>[],
            'item_subtotal'=>0.0,
            'standard_subtotal'=>0.0,
            'internal_cost'=>0.0,
            'adjustment_amount'=>0.0,
            'final_total'=>0.0,
        ];

        $sectionsInput=is_array($groupInput['sections']??null)?$groupInput['sections']:[];
        if(!$sectionsInput){
            throw new RuntimeException('Every quotation group must contain at least one section.');
        }

        $sectionSort=0;
        foreach($sectionsInput as $sectionInput){
            $sectionSort++;
            $sectionKey=trim((string)($sectionInput['client_key']??'')) ?: $groupKey.'s'.$sectionSort;
            $sectionCode=strtoupper(trim((string)($sectionInput['section_code']??''))) ?: 'S'.($sectionSort);
            if(isset($seenSectionCodes[$sectionCode])) throw new RuntimeException('Quotation section codes must be unique across the quotation.');
            $seenSectionCodes[$sectionCode]=true;
            $sectionName=trim((string)($sectionInput['section_name']??'')) ?: 'Section '.$sectionCode;

            $section=[
                'client_key'=>$sectionKey,
                'group_client_key'=>$groupKey,
                'section_code'=>$sectionCode,
                'section_name'=>$sectionName,
                'description'=>trim((string)($sectionInput['description']??''))?:null,
                'show_on_customer_quote'=>quotation_bool($sectionInput['show_on_customer_quote']??true),
                'show_section_total'=>quotation_bool($sectionInput['show_section_total']??true),
                'sort_order'=>$sectionSort,
                'items'=>[],
                'section_subtotal'=>0.0,
                'standard_subtotal'=>0.0,
                'internal_cost'=>0.0,
                'final_total'=>0.0,
            ];

            $itemsInput=is_array($sectionInput['items']??null)?$sectionInput['items']:[];
            $itemSort=0;
            foreach($itemsInput as $itemInput){
                $description=trim((string)($itemInput['description']??''));
                $rateId=(int)($itemInput['rate_book_item_id']??0);
                $rate=$rateId>0?($rateMap[$rateId]??null):null;
                if($rateId>0 && !$rate){
                    throw new RuntimeException('One selected Rate Book item no longer exists.');
                }

                if($rate && (!(int)$rate['is_active'] || ($rate['effective_from'] && $rate['effective_from']>date('Y-m-d')) || ($rate['effective_to'] && $rate['effective_to']<date('Y-m-d')))){
                    throw new RuntimeException('A selected Rate Book item is inactive or outside its effective date.');
                }

                if($description==='' && $rate) $description=(string)$rate['name'];
                if($description==='') continue;

                $itemSort++;
                $globalItemSort++;

                $itemType=(string)($itemInput['item_type']??($rate['item_type']??'other'));
                if(!in_array($itemType,$allowedItemTypes,true)) $itemType='other';

                $pricingMethod=$rate?(string)$rate['pricing_method']:(string)($itemInput['pricing_method']??'quantity');
                if(!in_array($pricingMethod,$allowedPricingMethods,true)) $pricingMethod='quantity';

                $isFoc=quotation_bool($itemInput['is_foc']??false) || $pricingMethod==='foc';
                $effectiveMethod=$pricingMethod==='foc'?(string)($itemInput['base_pricing_method']??($rate['pricing_method']??'quantity')):$pricingMethod;
                if(!in_array($effectiveMethod,$allowedPricingMethods,true) || $effectiveMethod==='foc') $effectiveMethod='quantity';

                $defaultUnit=$rate['default_unit']??null;
                $basis=quotation_pricing_basis($itemInput,$effectiveMethod,$defaultUnit);
                if($basis<0) $basis=0;

                $standardUnitPrice=$rate?quotation_num($rate['standard_selling_rate']):quotation_num($itemInput['standard_unit_price']??$itemInput['unit_price']??0);
                $internalUnitCost=$rate?quotation_num($rate['internal_cost_rate']):quotation_num($itemInput['internal_unit_cost']??0);
                $requestedUnitPrice=quotation_num($itemInput['unit_price']??$standardUnitPrice);
                $overrideReason=trim((string)($itemInput['override_reason']??''));
                $isOverride=abs($requestedUnitPrice-$standardUnitPrice)>0.0001;

                if($rate && $isOverride){
                    if(empty($permissions['override_price'])){
                        $requestedUnitPrice=$standardUnitPrice;
                        $isOverride=false;
                        $overrideReason='';
                    }elseif(($requireOverrideReason || (int)$rate['require_override_reason']===1) && $overrideReason===''){
                        throw new RuntimeException('A reason is required when overriding a Rate Book selling price.');
                    }
                }

                if($isFoc && $requireFocReason && trim((string)($itemInput['foc_reason']??''))===''){
                    throw new RuntimeException('A reason is required for every FOC quotation item.');
                }

                $standardAmount=quotation_round_money($basis*$standardUnitPrice);
                $customerAmount=$isFoc?0.0:quotation_round_money($basis*$requestedUnitPrice);
                $baseInternalTotal=quotation_round_money($basis*$internalUnitCost);
                $wastePercent=$rate?max(0,quotation_num($rate['default_waste_percent']??0)):0.0;
                $itemWasteCost=quotation_round_money($baseInternalTotal*$wastePercent/100);
                $internalTotal=quotation_round_money($baseInternalTotal+$itemWasteCost);

                $sourceType=$rate?'rate_book':(trim((string)($itemInput['source_type']??''))?:'manual');
                $rateSnapshot=$rate?json_encode([
                    'id'=>(int)$rate['id'],
                    'rate_code'=>$rate['rate_code'],
                    'name'=>$rate['name'],
                    'category_code'=>$rate['category_code'],
                    'pricing_method'=>$rate['pricing_method'],
                    'default_unit'=>$rate['default_unit'],
                    'internal_cost_rate'=>(float)$rate['internal_cost_rate'],
                    'standard_selling_rate'=>(float)$rate['standard_selling_rate'],
                    'minimum_selling_rate'=>$rate['minimum_selling_rate']!==null?(float)$rate['minimum_selling_rate']:null,
                    'default_waste_percent'=>(float)($rate['default_waste_percent']??0),
                ],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES):null;

                $measurementText=trim((string)($itemInput['measurement_text']??'')) ?: quotation_measurement_text($itemInput);
                $unit=trim((string)($itemInput['unit']??'')) ?: ($defaultUnit?:null);

                $item=[
                    'client_key'=>trim((string)($itemInput['client_key']??'')) ?: 'i'.$globalItemSort,
                    'section_client_key'=>$sectionKey,
                    'rate_book_item_id'=>$rateId?:null,
                    'item_type'=>$itemType,
                    'pricing_method'=>$isFoc?'foc':$effectiveMethod,
                    'base_pricing_method'=>$effectiveMethod,
                    'description'=>$description,
                    'measurement_text'=>$measurementText?:null,
                    'width_value'=>($itemInput['width_value']??'')!==''?quotation_num($itemInput['width_value']):null,
                    'height_value'=>($itemInput['height_value']??'')!==''?quotation_num($itemInput['height_value']):null,
                    'depth_value'=>($itemInput['depth_value']??'')!==''?quotation_num($itemInput['depth_value']):null,
                    'measurement_unit'=>in_array(($itemInput['measurement_unit']??''),['mm','cm','m','ft','in'],true)?$itemInput['measurement_unit']:null,
                    'quantity'=>$basis,
                    'unit'=>$unit,
                    'unit_price'=>$isFoc?0.0:$requestedUnitPrice,
                    'amount'=>$customerAmount,
                    'standard_unit_price'=>$standardUnitPrice,
                    'standard_amount'=>$standardAmount,
                    'internal_unit_cost'=>$internalUnitCost,
                    'base_internal_total_cost'=>$baseInternalTotal,
                    'waste_percent'=>$wastePercent,
                    'waste_cost'=>$itemWasteCost,
                    'internal_total_cost'=>$internalTotal,
                    'internal_line_cost'=>$internalTotal,
                    'is_foc'=>$isFoc?1:0,
                    'foc_reason'=>$isFoc?(trim((string)($itemInput['foc_reason']??''))?:null):null,
                    'is_price_overridden'=>$isOverride?1:0,
                    'override_reason'=>$isOverride?$overrideReason:null,
                    'show_on_customer_quote'=>quotation_bool($itemInput['show_on_customer_quote']??true)?1:0,
                    'taxable'=>quotation_bool($itemInput['taxable']??true)?1:0,
                    'source_type'=>$sourceType,
                    'source_id'=>isset($itemInput['source_id']) && $itemInput['source_id']!==''?(int)$itemInput['source_id']:null,
                    'source_reference'=>trim((string)($itemInput['source_reference']??''))?:null,
                    'rate_snapshot_json'=>$rateSnapshot,
                    'sort_order'=>$itemSort,
                    'notes'=>trim((string)($itemInput['notes']??''))?:null,
                ];

                $section['items'][]=$item;
                $section['section_subtotal']+=$customerAmount;
                $section['standard_subtotal']+=$standardAmount;
                $section['internal_cost']+=$internalTotal;
                $section['final_total']+=$customerAmount;
                $directItemCost+=$internalTotal;
                $embeddedWasteCost+=$itemWasteCost;
                $itemStandardSelling+=$standardAmount;
                $itemCustomerSelling+=$customerAmount;
                if($isFoc) $focRetailValue+=$standardAmount;
                $allItems[]=$item;
            }

            $section['section_subtotal']=quotation_round_money($section['section_subtotal']);
            $section['standard_subtotal']=quotation_round_money($section['standard_subtotal']);
            $section['internal_cost']=quotation_round_money($section['internal_cost']);
            $section['final_total']=quotation_round_money($section['final_total']);
            $sectionLookup[$sectionKey]=[
                'group_key'=>$groupKey,
                'section_subtotal'=>$section['section_subtotal'],
                'standard_subtotal'=>$section['standard_subtotal'],
                'internal_cost'=>$section['internal_cost'],
            ];
            $group['sections'][]=$section;
            $group['item_subtotal']+=$section['section_subtotal'];
            $group['standard_subtotal']+=$section['standard_subtotal'];
            $group['internal_cost']+=$section['internal_cost'];
        }

        $group['item_subtotal']=quotation_round_money($group['item_subtotal']);
        $group['standard_subtotal']=quotation_round_money($group['standard_subtotal']);
        $group['internal_cost']=quotation_round_money($group['internal_cost']);

        $groupFinal=$group['item_subtotal'];
        if($pricingMode!=='itemized'){
            $target=max(0,quotation_num($groupInput['package_target_total']??0));
            $group['package_target_total']=quotation_round_money($target);
            $groupFinal=$target;
            $group['adjustment_amount']=quotation_round_money($groupFinal-$group['item_subtotal']);
            $commercialAdjustment+=$group['adjustment_amount'];
        }

        $group['final_total']=quotation_round_money($groupFinal);
        $groupLookup[$groupKey]=[
            'item_subtotal'=>$group['item_subtotal'],
            'standard_subtotal'=>$group['standard_subtotal'],
            'internal_cost'=>$group['internal_cost'],
            'final_total'=>$group['final_total'],
        ];
        $groups[]=$group;
    }

    $allowedChargeCategories=['labour','installation','delivery','transport','measurement','design','subcontractor','waste','overhead','contingency','consumables','machine','disposal','parking_toll','surcharge','other'];
    $allowedChargeTypes=['fixed','percentage','per_unit','per_hour','per_day','per_trip'];
    $allowedChargeBases=['manual','direct_cost','internal_cost','selling_subtotal','group_subtotal','section_subtotal','item_amount'];

    $charges=[];
    $internalChargeTotal=0.0;
    $customerChargeTotal=0.0;
    $wasteCost=0.0;
    $chargeSort=0;

    foreach($chargesInput as $chargeInput){
        $name=trim((string)($chargeInput['charge_name']??''));
        if($name==='') continue;
        $chargeSort++;

        $category=(string)($chargeInput['charge_category']??'other');
        if(!in_array($category,$allowedChargeCategories,true)) $category='other';
        $calcType=(string)($chargeInput['calculation_type']??'fixed');
        if(!in_array($calcType,$allowedChargeTypes,true)) $calcType='fixed';
        $calcBase=(string)($chargeInput['calculation_base']??'manual');
        if(!in_array($calcBase,$allowedChargeBases,true)) $calcBase='manual';

        $groupKey=trim((string)($chargeInput['group_client_key']??''));
        $sectionKey=trim((string)($chargeInput['section_client_key']??''));
        if($sectionKey!=='' && isset($sectionLookup[$sectionKey])) $groupKey=$sectionLookup[$sectionKey]['group_key'];

        $rate=max(0,quotation_num($chargeInput['rate']??0));
        $manualBase=max(0,quotation_num($chargeInput['base_amount']??0));
        $baseAmount=$manualBase;

        if($calcType==='percentage'){
            $baseAmount=match($calcBase){
                'direct_cost'=>$directItemCost+$internalChargeTotal,
                'internal_cost'=>$directItemCost+$internalChargeTotal,
                'selling_subtotal'=>array_sum(array_column($groups,'final_total'))+$customerChargeTotal,
                'group_subtotal'=>$groupKey!==''?($groupLookup[$groupKey]['final_total']??0):0,
                'section_subtotal'=>$sectionKey!==''?($sectionLookup[$sectionKey]['section_subtotal']??0):0,
                default=>$manualBase,
            };
            $amount=$baseAmount*$rate/100;
        }elseif(in_array($calcType,['per_unit','per_hour','per_day','per_trip'],true)){
            $amount=$manualBase*$rate;
        }else{
            $amount=$rate;
            $baseAmount=0.0;
        }

        $amount=quotation_round_money($amount);
        $internalOnly=quotation_bool($chargeInput['internal_only']??false);
        $internalAmount=$internalOnly?$amount:0.0;
        $customerAmount=$internalOnly?0.0:$amount;

        if($internalOnly){
            $internalChargeTotal+=$amount;
            if($category==='waste') $wasteCost+=$amount;
        }else{
            $customerChargeTotal+=$amount;
        }

        $charges[]=[
            'client_key'=>trim((string)($chargeInput['client_key']??'')) ?: 'c'.$chargeSort,
            'group_client_key'=>$groupKey?:null,
            'section_client_key'=>$sectionKey?:null,
            'rate_book_item_id'=>null,
            'charge_code'=>trim((string)($chargeInput['charge_code']??''))?:null,
            'charge_name'=>$name,
            'charge_category'=>$category,
            'calculation_type'=>$calcType,
            'calculation_base'=>$calcBase,
            'rate'=>$rate,
            'base_amount'=>quotation_round_money($baseAmount),
            'amount'=>$amount,
            'internal_cost_amount'=>$internalAmount,
            'customer_amount'=>$customerAmount,
            'internal_only'=>$internalOnly?1:0,
            'is_internal_only'=>$internalOnly?1:0,
            'taxable'=>quotation_bool($chargeInput['taxable']??true)?1:0,
            'source_type'=>trim((string)($chargeInput['source_type']??''))?:'manual',
            'source_id'=>isset($chargeInput['source_id']) && $chargeInput['source_id']!==''?(int)$chargeInput['source_id']:null,
            'source_reference'=>trim((string)($chargeInput['source_reference']??''))?:null,
            'sort_order'=>$chargeSort,
            'notes'=>trim((string)($chargeInput['notes']??''))?:null,
        ];
    }

    $directCost=quotation_round_money($directItemCost+$internalChargeTotal);
    $overheadPct=empty($permissions['edit_margin'])
        ? max(0,quotation_num(quotation_setting($pdo,'quotation_default_overhead_percent','8')))
        : max(0,quotation_num($payload['overhead_percent']??0));
    $contingencyPct=empty($permissions['edit_margin'])
        ? max(0,quotation_num(quotation_setting($pdo,'quotation_default_contingency_percent','0')))
        : max(0,quotation_num($payload['contingency_percent']??0));
    $overheadAmount=quotation_round_money($directCost*$overheadPct/100);
    $contingencyAmount=quotation_round_money($directCost*$contingencyPct/100);
    $internalCost=quotation_round_money($directCost+$overheadAmount+$contingencyAmount);

    $groupCustomerTotal=quotation_round_money(array_sum(array_column($groups,'final_total')));
    $standardSelling=quotation_round_money($itemStandardSelling+$customerChargeTotal);
    $sellingBeforeDiscount=quotation_round_money($groupCustomerTotal+$customerChargeTotal);
    $commercialAdjustment=quotation_round_money($sellingBeforeDiscount-$standardSelling+$focRetailValue);
    // The FOC retail value already reduces customer selling versus standard selling;
    // commercial adjustment should represent package/manual group changes only.
    $commercialAdjustment=quotation_round_money(array_sum(array_column($groups,'adjustment_amount')));

    $discountType=(string)($payload['discount_type']??'none');
    if(!in_array($discountType,['none','percentage','fixed'],true)) $discountType='none';
    $discountValue=max(0,quotation_num($payload['discount_value']??0));
    if($discountType!=='none' && empty($permissions['discount'])){
        $discountType='none';
        $discountValue=0;
    }
    $discountAmount=match($discountType){
        'percentage'=>quotation_round_money($sellingBeforeDiscount*$discountValue/100),
        'fixed'=>quotation_round_money($discountValue),
        default=>0.0,
    };
    $discountAmount=min($discountAmount,$sellingBeforeDiscount);

    $subtotal=quotation_round_money(max(0,$sellingBeforeDiscount-$discountAmount));
    $taxPct=max(0,quotation_num($payload['tax_percent']??0));
    $taxAmount=quotation_round_money($subtotal*$taxPct/100);
    $finalTotal=quotation_round_money($subtotal+$taxAmount);

    $markupType=empty($permissions['edit_margin'])?'percentage':(string)($payload['markup_type']??'percentage');
    if(!in_array($markupType,['percentage','fixed','margin'],true)) $markupType='percentage';
    $markupValue=empty($permissions['edit_margin'])
        ? max(0,quotation_num(quotation_setting($pdo,'quotation_default_markup_percent','25')))
        : max(0,quotation_num($payload['markup_value']??0));
    $markupAmount=quotation_round_money($sellingBeforeDiscount-$internalCost);
    $grossProfit=quotation_round_money($subtotal-$internalCost);
    $grossMargin=$subtotal>0?round(($grossProfit/$subtotal)*100,2):0.0;

    $adjustments=[];
    $adjSort=0;
    foreach($groups as $group){
        if(abs($group['adjustment_amount'])<0.005) continue;
        $adjSort++;
        $adjustments[]=[
            'group_client_key'=>$group['client_key'],
            'section_client_key'=>null,
            'quotation_item_client_key'=>null,
            'adjustment_type'=>'package_adjustment',
            'calculation_type'=>'target_total',
            'direction'=>$group['adjustment_amount']>=0?'increase':'decrease',
            'value'=>$group['package_target_total']??0,
            'base_amount'=>$group['item_subtotal'],
            'amount'=>abs($group['adjustment_amount']),
            'customer_visible'=>1,
            'requires_approval'=>0,
            'reason'=>'Package / group target pricing',
            'sort_order'=>$adjSort,
        ];
    }
    foreach($allItems as $item){
        if(!$item['is_foc']) continue;
        $adjSort++;
        $adjustments[]=[
            'group_client_key'=>null,
            'section_client_key'=>$item['section_client_key'],
            'quotation_item_client_key'=>$item['client_key'],
            'adjustment_type'=>'foc',
            'calculation_type'=>'fixed',
            'direction'=>'decrease',
            'value'=>$item['standard_amount'],
            'base_amount'=>$item['standard_amount'],
            'amount'=>$item['standard_amount'],
            'customer_visible'=>1,
            'requires_approval'=>0,
            'reason'=>$item['foc_reason'],
            'sort_order'=>$adjSort,
        ];
    }
    if($discountAmount>0){
        $adjSort++;
        $adjustments[]=[
            'group_client_key'=>null,
            'section_client_key'=>null,
            'quotation_item_client_key'=>null,
            'adjustment_type'=>'discount',
            'calculation_type'=>$discountType==='percentage'?'percentage':'fixed',
            'direction'=>'decrease',
            'value'=>$discountValue,
            'base_amount'=>$sellingBeforeDiscount,
            'amount'=>$discountAmount,
            'customer_visible'=>1,
            'requires_approval'=>0,
            'reason'=>'Quotation discount',
            'sort_order'=>$adjSort,
        ];
    }

    return [
        'groups'=>$groups,
        'charges'=>$charges,
        'adjustments'=>$adjustments,
        'direct_cost'=>$directCost,
        'waste_cost'=>quotation_round_money($embeddedWasteCost+$wasteCost),
        'overhead_percent'=>$overheadPct,
        'overhead_amount'=>$overheadAmount,
        'contingency_percent'=>$contingencyPct,
        'contingency_amount'=>$contingencyAmount,
        'internal_cost'=>$internalCost,
        'standard_selling_price'=>$standardSelling,
        'commercial_adjustment_amount'=>$commercialAdjustment,
        'foc_retail_value'=>quotation_round_money($focRetailValue),
        'selling_price_before_discount'=>$sellingBeforeDiscount,
        'markup_type'=>$markupType,
        'markup_value'=>$markupValue,
        'markup_amount'=>$markupAmount,
        'discount_type'=>$discountType,
        'discount_value'=>$discountValue,
        'discount_amount'=>$discountAmount,
        'subtotal'=>$subtotal,
        'tax_percent'=>$taxPct,
        'tax_amount'=>$taxAmount,
        'final_total'=>$finalTotal,
        'gross_profit'=>$grossProfit,
        'gross_margin_percent'=>$grossMargin,
    ];
}
