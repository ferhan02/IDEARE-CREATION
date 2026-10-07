<?php
require_once __DIR__.'/../../includes/staff/operations.php';
require_login();
verify_csrf();

if(!can('quotation.manage_rate_book') && !can('quotation.settings')){
    render_access_denied('Rate Book restricted','Your account cannot manage quotation pricing rates.');
}

$pdo=staff_db();
$staff=current_staff();

foreach(['quotation_rate_categories','quotation_rate_items','quotation_rate_history'] as $requiredTable){
    if(!db_table_exists($pdo,$requiredTable)){
        render_access_denied('Database update required','Apply the Quotation Centre V2 database migration before using the Rate Book.');
    }
}

$allowedTypes=['material','cabinet','countertop','hardware','labour','installation','delivery','electrical','plumbing','ceiling','renovation','door_glass','service','subcontractor','other'];
$allowedMethods=['quantity','running_ft','running_m','area_sqft','area_sqm','set','lump_sum','fixed','dimension','manual'];

if($_SERVER['REQUEST_METHOD']==='POST'){
    $action=$_POST['action']??'';

    try{
        if($action==='category_save'){
            $code=strtoupper(trim((string)($_POST['category_code']??'')));
            $name=trim((string)($_POST['name']??''));
            if($code==='' || $name==='') throw new RuntimeException('Category code and name are required.');

            $stmt=$pdo->prepare("INSERT INTO quotation_rate_categories(category_code,name,description,sort_order,is_active)
                VALUES(?,?,?,?,1)
                ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),sort_order=VALUES(sort_order),is_active=1");
            $stmt->execute([$code,$name,trim((string)($_POST['description']??''))?:null,(int)($_POST['sort_order']??0)]);
            flash('success','Rate Book category saved.');
        }

        if($action==='item_save'){
            $id=(int)($_POST['id']??0);
            $categoryId=(int)($_POST['category_id']??0);
            $rateCode=strtoupper(trim((string)($_POST['rate_code']??'')));
            $name=trim((string)($_POST['name']??''));
            $itemType=(string)($_POST['item_type']??'other');
            $pricingMethod=(string)($_POST['pricing_method']??'quantity');
            if(!in_array($itemType,$allowedTypes,true)) $itemType='other';
            if(!in_array($pricingMethod,$allowedMethods,true)) $pricingMethod='quantity';
            if($categoryId<=0 || $rateCode==='' || $name==='') throw new RuntimeException('Category, rate code and item name are required.');

            $internal=(float)($_POST['internal_cost_rate']??0);
            $selling=(float)($_POST['standard_selling_rate']??0);
            $minimum=$_POST['minimum_selling_rate']!==''?(float)$_POST['minimum_selling_rate']:null;
            $effectiveFrom=$_POST['effective_from']?:null;
            $effectiveTo=$_POST['effective_to']?:null;
            $reason=trim((string)($_POST['change_reason']??''))?:null;

            if($id>0){
                $old=$pdo->prepare('SELECT * FROM quotation_rate_items WHERE id=? LIMIT 1');
                $old->execute([$id]);
                $previous=$old->fetch(PDO::FETCH_ASSOC);
                if(!$previous) throw new RuntimeException('Rate Book item not found.');

                if(
                    abs((float)$previous['internal_cost_rate']-$internal)>0.0001 ||
                    abs((float)$previous['standard_selling_rate']-$selling)>0.0001 ||
                    (string)($previous['minimum_selling_rate']??'')!==(string)($minimum??'')
                ){
                    $history=$pdo->prepare('INSERT INTO quotation_rate_history(rate_item_id,internal_cost_rate,standard_selling_rate,minimum_selling_rate,effective_from,effective_to,change_reason,changed_by) VALUES(?,?,?,?,?,?,?,?)');
                    $history->execute([$id,$previous['internal_cost_rate'],$previous['standard_selling_rate'],$previous['minimum_selling_rate'],$previous['effective_from'],$previous['effective_to'],$reason?:'Rate updated',$staff['id']]);
                }

                $stmt=$pdo->prepare("UPDATE quotation_rate_items SET category_id=?,rate_code=?,name=?,description=?,item_type=?,pricing_method=?,default_unit=?,internal_cost_rate=?,standard_selling_rate=?,minimum_selling_rate=?,default_waste_percent=?,taxable=?,require_override_reason=?,effective_from=?,effective_to=?,sort_order=?,notes=?,updated_by=? WHERE id=?");
                $stmt->execute([
                    $categoryId,$rateCode,$name,trim((string)($_POST['description']??''))?:null,$itemType,$pricingMethod,trim((string)($_POST['default_unit']??''))?:null,
                    $internal,$selling,$minimum,(float)($_POST['default_waste_percent']??0),!empty($_POST['taxable'])?1:0,!empty($_POST['require_override_reason'])?1:0,
                    $effectiveFrom,$effectiveTo,(int)($_POST['sort_order']??0),trim((string)($_POST['notes']??''))?:null,$staff['id'],$id
                ]);
                flash('success','Rate Book item updated.');
            }else{
                $stmt=$pdo->prepare("INSERT INTO quotation_rate_items(category_id,rate_code,name,description,item_type,pricing_method,default_unit,internal_cost_rate,standard_selling_rate,minimum_selling_rate,default_waste_percent,taxable,require_override_reason,effective_from,effective_to,is_active,sort_order,notes,created_by,updated_by)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?)");
                $stmt->execute([
                    $categoryId,$rateCode,$name,trim((string)($_POST['description']??''))?:null,$itemType,$pricingMethod,trim((string)($_POST['default_unit']??''))?:null,
                    $internal,$selling,$minimum,(float)($_POST['default_waste_percent']??0),!empty($_POST['taxable'])?1:0,!empty($_POST['require_override_reason'])?1:0,
                    $effectiveFrom,$effectiveTo,(int)($_POST['sort_order']??0),trim((string)($_POST['notes']??''))?:null,$staff['id'],$staff['id']
                ]);
                flash('success','Rate Book item added.');
            }
        }

        if($action==='item_toggle'){
            $id=(int)($_POST['id']??0);
            $active=!empty($_POST['is_active'])?1:0;
            $pdo->prepare('UPDATE quotation_rate_items SET is_active=?,updated_by=? WHERE id=?')->execute([$active,$staff['id'],$id]);
            flash('success',$active?'Rate Book item activated.':'Rate Book item archived.');
        }
    }catch(Throwable $e){
        flash('error','Could not save Rate Book: '.$e->getMessage());
    }

    $redirect='staff/admin/quotation-rate-book.php';
    if(!empty($_POST['return_edit'])) $redirect.='?edit='.(int)$_POST['return_edit'];
    staff_redirect($redirect);
}

$categories=$pdo->query('SELECT * FROM quotation_rate_categories ORDER BY sort_order,name')->fetchAll(PDO::FETCH_ASSOC);
$items=$pdo->query("SELECT ri.*,rc.category_code,rc.name category_name,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) updated_by_name
    FROM quotation_rate_items ri JOIN quotation_rate_categories rc ON rc.id=ri.category_id LEFT JOIN staff s ON s.id=ri.updated_by
    ORDER BY rc.sort_order,ri.sort_order,ri.name")->fetchAll(PDO::FETCH_ASSOC);

$editId=(int)($_GET['edit']??0);
$editItem=null;
if($editId){
    foreach($items as $row){ if((int)$row['id']===$editId){$editItem=$row;break;} }
}

$history=[];
if($editItem){
    $hq=$pdo->prepare("SELECT h.*,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) changed_by_name FROM quotation_rate_history h LEFT JOIN staff s ON s.id=h.changed_by WHERE h.rate_item_id=? ORDER BY h.created_at DESC LIMIT 12");
    $hq->execute([$editId]);
    $history=$hq->fetchAll(PDO::FETCH_ASSOC);
}

$pageTitle='Quotation Rate Book';
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content quote-rate-admin-page">
<div class="page-head">
    <div><p class="eyebrow">Quotation Centre · Stage 3</p><h1>Rate Book</h1><p class="muted">Maintain IdeaRE's standard selling rates and internal cost benchmarks. Existing quotations keep their saved rate snapshot even after rates change.</p></div>
    <div class="actions"><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-settings.php')) ?>">Quotation settings</a><a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-create.php')) ?>">Create quotation</a></div>
</div>

<section class="quotation-kpi-grid quote-rate-kpis">
    <article class="quotation-kpi-card"><span>Active rates</span><strong><?= count(array_filter($items,fn($r)=>(int)$r['is_active']===1)) ?></strong><small>Available in quotation builder</small></article>
    <article class="quotation-kpi-card"><span>Categories</span><strong><?= count($categories) ?></strong><small>Pricing catalogue groups</small></article>
    <article class="quotation-kpi-card"><span>Archived rates</span><strong><?= count(array_filter($items,fn($r)=>(int)$r['is_active']===0)) ?></strong><small>Kept for historical traceability</small></article>
</section>

<div class="split-grid quote-rate-admin-grid">
<section class="staff-panel">
    <div class="section-title"><div><p class="eyebrow">Rate item</p><h2><?= $editItem?'Edit rate':'Add rate' ?></h2></div><?php if($editItem): ?><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-rate-book.php')) ?>">New item</a><?php endif; ?></div>
    <form method="post">
        <?= csrf_field() ?><input type="hidden" name="action" value="item_save"><input type="hidden" name="id" value="<?= (int)($editItem['id']??0) ?>">
        <div class="form-grid">
            <label>Category<select name="category_id" required><option value="">Choose...</option><?php foreach($categories as $c): ?><option value="<?= (int)$c['id'] ?>" <?= (int)($editItem['category_id']??0)===(int)$c['id']?'selected':'' ?>><?= h($c['category_code'].' · '.$c['name']) ?></option><?php endforeach; ?></select></label>
            <label>Rate code<input name="rate_code" value="<?= h($editItem['rate_code']??'') ?>" placeholder="CAB-BASE-LAM" required></label>
            <label>Item name<input name="name" value="<?= h($editItem['name']??'') ?>" placeholder="Base cabinet - laminate" required></label>
        </div>
        <label>Description<textarea name="description" rows="2"><?= h($editItem['description']??'') ?></textarea></label>
        <div class="form-grid">
            <label>Item type<select name="item_type"><?php foreach($allowedTypes as $v): ?><option value="<?= h($v) ?>" <?= ($editItem['item_type']??'')===$v?'selected':'' ?>><?= h(ucwords(str_replace('_',' ',$v))) ?></option><?php endforeach; ?></select></label>
            <label>Pricing method<select name="pricing_method"><?php foreach($allowedMethods as $v): ?><option value="<?= h($v) ?>" <?= ($editItem['pricing_method']??'')===$v?'selected':'' ?>><?= h(ucwords(str_replace('_',' ',$v))) ?></option><?php endforeach; ?></select></label>
            <label>Default unit<input name="default_unit" value="<?= h($editItem['default_unit']??'') ?>" placeholder="ft, sqft, unit, set, LS"></label>
        </div>
        <div class="form-grid">
            <label>Internal cost rate (RM)<input type="number" step=".0001" min="0" name="internal_cost_rate" value="<?= h((string)($editItem['internal_cost_rate']??'0')) ?>"></label>
            <label>Standard selling rate (RM)<input type="number" step=".0001" min="0" name="standard_selling_rate" value="<?= h((string)($editItem['standard_selling_rate']??'0')) ?>"></label>
            <label>Minimum selling rate (RM)<input type="number" step=".0001" min="0" name="minimum_selling_rate" value="<?= h((string)($editItem['minimum_selling_rate']??'')) ?>"></label>
        </div>
        <div class="form-grid">
            <label>Default waste %<input type="number" step=".01" min="0" name="default_waste_percent" value="<?= h((string)($editItem['default_waste_percent']??'0')) ?>"></label>
            <label>Effective from<input type="date" name="effective_from" value="<?= h($editItem['effective_from']??'') ?>"></label>
            <label>Effective to<input type="date" name="effective_to" value="<?= h($editItem['effective_to']??'') ?>"></label>
        </div>
        <div class="two"><label class="check"><input type="checkbox" name="taxable" value="1" <?= !isset($editItem['taxable'])||(int)$editItem['taxable']===1?'checked':'' ?>> Taxable</label><label class="check"><input type="checkbox" name="require_override_reason" value="1" <?= !isset($editItem['require_override_reason'])||(int)$editItem['require_override_reason']===1?'checked':'' ?>> Require reason when selling rate is overridden</label></div>
        <?php if($editItem): ?><label>Reason for rate change<input name="change_reason" placeholder="Supplier increase, management rate review..."></label><?php endif; ?>
        <div class="two"><label>Sort order<input type="number" name="sort_order" value="<?= (int)($editItem['sort_order']??0) ?>"></label><label>Notes<input name="notes" value="<?= h($editItem['notes']??'') ?>"></label></div>
        <button class="btn primary"><?= $editItem?'Save rate changes':'Add rate to Rate Book' ?></button>
    </form>
</section>

<section class="staff-panel">
    <p class="eyebrow">Catalogue structure</p><h2>Add / restore category</h2>
    <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="category_save"><div class="two"><label>Category code<input name="category_code" placeholder="CABINETRY" required></label><label>Name<input name="name" placeholder="Cabinetry" required></label></div><label>Description<textarea name="description" rows="2"></textarea></label><label>Sort order<input type="number" name="sort_order" value="100"></label><button class="btn">Save category</button></form>

    <?php if($editItem): ?>
    <div class="quote-rate-history">
        <p class="eyebrow">Audit history</p><h2>Previous prices</h2>
        <?php if(!$history): ?><p class="muted">No prior price changes recorded for this rate.</p><?php endif; ?>
        <?php foreach($history as $h): ?><div class="quote-rate-history-row"><div><b><?= money($h['standard_selling_rate']) ?></b><small>Internal <?= money($h['internal_cost_rate']) ?><?= $h['change_reason']?' · '.h($h['change_reason']):'' ?></small></div><span><?= h(date('j M Y',strtotime($h['created_at']))) ?><small><?= h(trim($h['changed_by_name'])?:'System') ?></small></span></div><?php endforeach; ?>
    </div>
    <?php endif; ?>
</section>
</div>

<section class="staff-panel table-panel quote-rate-register">
<div class="section-title"><div><p class="eyebrow">Pricing catalogue</p><h2><?= count($items) ?> Rate Book items</h2></div><span class="muted tiny">Archive a rate instead of deleting it so old quotations remain traceable.</span></div>
<table><thead><tr><th>Code / Item</th><th>Category</th><th>Method</th><th>Unit</th><th>Internal Cost</th><th>Selling Rate</th><th>Minimum</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
<?php if(!$items): ?><tr><td colspan="10"><div class="quotation-empty-state"><strong>No Rate Book items yet</strong><span>Add the real rates IdeaRE uses for cabinets, tops, electrical, plumbing and other works.</span></div></td></tr><?php endif; ?>
<?php foreach($items as $r): ?><tr class="<?= (int)$r['is_active']===1?'':'is-archived' ?>"><td><b><?= h($r['rate_code']) ?></b><small><?= h($r['name']) ?></small></td><td><?= h($r['category_name']) ?></td><td><?= h(str_replace('_',' ',$r['pricing_method'])) ?></td><td><?= h($r['default_unit']?:'—') ?></td><td><?= money($r['internal_cost_rate']) ?></td><td><b><?= money($r['standard_selling_rate']) ?></b></td><td><?= $r['minimum_selling_rate']!==null?money($r['minimum_selling_rate']):'—' ?></td><td><span class="pill <?= (int)$r['is_active']===1?'approved':'rejected' ?>"><?= (int)$r['is_active']===1?'Active':'Archived' ?></span></td><td><?= h(date('j M Y',strtotime($r['updated_at']))) ?><small><?= h(trim($r['updated_by_name'])?:'—') ?></small></td><td><div class="actions"><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-rate-book.php?edit='.(int)$r['id'])) ?>">Edit</a><form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="item_toggle"><input type="hidden" name="id" value="<?= (int)$r['id'] ?>"><input type="hidden" name="is_active" value="<?= (int)$r['is_active']===1?'0':'1' ?>"><button class="btn"><?= (int)$r['is_active']===1?'Archive':'Activate' ?></button></form></div></td></tr><?php endforeach; ?>
</tbody></table>
</section>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
