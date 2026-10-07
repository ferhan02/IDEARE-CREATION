<?php

declare(strict_types=1);

/**
 * Stage 5 quotation payment-schedule helpers.
 *
 * Payment milestone values are always recalculated on the server from the
 * authoritative quotation total. Browser amounts are display-only previews.
 */

function quotation_payment_round(float $value): float
{
    return round($value + 0.0000001, 2);
}

function quotation_payment_trigger_label(string $trigger): string
{
    return match($trigger){
        'acceptance' => 'On acceptance',
        'before_production' => 'Before production',
        'before_delivery' => 'Before delivery',
        'on_installation' => 'On installation',
        'on_completion' => 'On completion',
        'date' => 'Specific date',
        default => 'Other / manually agreed',
    };
}

function quotation_payment_prepare(array $rows,float $quotationTotal): array
{
    $allowedCalculation=['percentage','fixed'];
    $allowedTriggers=['acceptance','before_production','before_delivery','on_installation','on_completion','date','other'];
    $result=[];
    $sort=0;
    $sum=0.0;

    foreach($rows as $row){
        if(!is_array($row)) continue;

        $label=trim((string)($row['label']??''));
        if($label==='') continue;

        $calculation=(string)($row['calculation_type']??'percentage');
        if(!in_array($calculation,$allowedCalculation,true)) $calculation='percentage';

        $value=max(0,(float)($row['value']??0));
        $trigger=(string)($row['due_trigger']??'other');
        if(!in_array($trigger,$allowedTriggers,true)) $trigger='other';

        $dueDate=trim((string)($row['due_date']??''));
        if($trigger!=='date') $dueDate='';
        if($trigger==='date' && $dueDate===''){
            throw new RuntimeException('A payment milestone using a specific date must include the due date.');
        }

        $amount=$calculation==='percentage'
            ? quotation_payment_round($quotationTotal*$value/100)
            : quotation_payment_round($value);

        $sort++;
        $sum+=$amount;
        $result[]=[
            'label'=>$label,
            'calculation_type'=>$calculation,
            'value'=>$value,
            'amount'=>$amount,
            'due_trigger'=>$trigger,
            'due_date'=>$dueDate!==''?$dueDate:null,
            'customer_visible'=>!empty($row['customer_visible'])?1:0,
            'sort_order'=>$sort,
            'notes'=>trim((string)($row['notes']??''))?:null,
        ];
    }

    if($result){
        $difference=abs(quotation_payment_round($sum)-quotation_payment_round($quotationTotal));
        if($difference>0.05){
            throw new RuntimeException(
                'Payment milestones total '.money($sum).' but the quotation total is '.money($quotationTotal).'. Adjust the schedule so both totals match.'
            );
        }
    }

    return $result;
}

function quotation_payment_replace_master(PDO $pdo,int $quotationId,array $milestones): void
{
    $pdo->prepare('DELETE FROM quotation_payment_milestones WHERE quotation_id=?')->execute([$quotationId]);

    if(!$milestones) return;

    $stmt=$pdo->prepare("INSERT INTO quotation_payment_milestones
        (quotation_id,label,calculation_type,value,amount,due_trigger,due_date,customer_visible,sort_order,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?)");

    foreach($milestones as $row){
        $stmt->execute([
            $quotationId,
            $row['label'],
            $row['calculation_type'],
            $row['value'],
            $row['amount'],
            $row['due_trigger'],
            $row['due_date'],
            $row['customer_visible'],
            $row['sort_order'],
            $row['notes'],
        ]);
    }
}
