<?php
require_once __DIR__.'/../../includes/staff/auth.php';
require_login();
verify_csrf();
if(!can('quotation.manage_approval_rules') && !can('quotation.settings')){
    render_access_denied('Approval Rules restricted','Your account cannot manage quotation approval rules.');
}
$pdo=staff_db();$staff=current_staff();

$triggerLabels=[
    'discount_amount'=>'Discount amount (RM)','discount_percent'=>'Discount percentage','gross_margin_percent'=>'Gross margin %',
    'package_adjustment'=>'Package adjustment (RM)','manual_price_override'=>'Manual price variance (RM)','foc_value'=>'FOC retail value (RM)',
    'quotation_total'=>'Quotation total (RM)','other'=>'Other metric'
];
$operatorLabels=['gt'=>'>','gte'=>'>=','lt'=>'<','lte'=>'<=','eq'=>'='];

if($_SERVER['REQUEST_METHOD']==='POST'){
    try{
        $action=$_POST['action']??'';
        if($action==='save'){
            $id=(int)($_POST['id']??0);
            $code=strtoupper(trim((string)($_POST['rule_code']??'')));
            $name=trim((string)($_POST['name']??''));
            $trigger=(string)($_POST['trigger_type']??'quotation_total');
            $operator=(string)($_POST['comparison_operator']??'gte');
            if($code===''||$name==='') throw new RuntimeException('Rule code and name are required.');
            if(!isset($triggerLabels[$trigger])||!isset($operatorLabels[$operator])) throw new RuntimeException('Invalid rule configuration.');
            $roleId=(int)($_POST['approver_role_id']??0)?:null;
            if($id){
                $stmt=$pdo->prepare("UPDATE quotation_approval_rules SET rule_code=?,name=?,trigger_type=?,comparison_operator=?,threshold_value=?,approver_role_id=?,priority=?,is_active=?,notes=? WHERE id=?");
                $stmt->execute([$code,$name,$trigger,$operator,(float)($_POST['threshold_value']??0),$roleId,(int)($_POST['priority']??100),!empty($_POST['is_active'])?1:0,trim((string)($_POST['notes']??''))?:null,$id]);
                flash('success','Approval rule updated.');
            }else{
                $stmt=$pdo->prepare("INSERT INTO quotation_approval_rules(rule_code,name,trigger_type,comparison_operator,threshold_value,approver_role_id,priority,is_active,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)");
                $stmt->execute([$code,$name,$trigger,$operator,(float)($_POST['threshold_value']??0),$roleId,(int)($_POST['priority']??100),!empty($_POST['is_active'])?1:0,trim((string)($_POST['notes']??''))?:null,$staff['id']]);
                flash('success','Approval rule added.');
            }
        }
        if($action==='toggle'){
            $id=(int)($_POST['id']??0);$active=!empty($_POST['is_active'])?1:0;
            $pdo->prepare('UPDATE quotation_approval_rules SET is_active=? WHERE id=?')->execute([$active,$id]);
            flash('success',$active?'Approval rule enabled.':'Approval rule disabled.');
        }
    }catch(Throwable $e){flash('error','Could not save approval rule: '.$e->getMessage());}
    staff_redirect('staff/admin/quotation-approval-rules.php'.(!empty($_POST['return_edit'])?'?edit='.(int)$_POST['return_edit']:''));
}

$roles=$pdo->query("SELECT id,name,slug FROM roles WHERE is_active=1 ORDER BY hierarchy_level,name")->fetchAll(PDO::FETCH_ASSOC);
$rules=$pdo->query("SELECT r.*,ro.name approver_role_name FROM quotation_approval_rules r LEFT JOIN roles ro ON ro.id=r.approver_role_id ORDER BY r.priority,r.id")->fetchAll(PDO::FETCH_ASSOC);
$editId=(int)($_GET['edit']??0);$edit=null;foreach($rules as $row){if((int)$row['id']===$editId){$edit=$row;break;}}
$pageTitle='Quotation Approval Rules';
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content quotation-approval-rules-page">
<div class="page-head"><div><p class="eyebrow">Quotation Centre · Stage 4</p><h1>Approval rules</h1><p class="muted">Control which commercial exceptions require management approval before a quotation revision can be issued.</p></div><div class="actions"><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-settings.php')) ?>">Quotation settings</a><a class="btn" href="<?= h(ideare_root_url('staff/admin/approvals.php')) ?>">Approval queue</a><a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-centre.php')) ?>">Quotation Centre</a></div></div>

<div class="split-grid approval-rule-layout">
<section class="staff-panel"><div class="section-title"><div><p class="eyebrow">Rule editor</p><h2><?= $edit?'Edit rule':'Add approval rule' ?></h2></div><?php if($edit): ?><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-approval-rules.php')) ?>">New rule</a><?php endif; ?></div>
<form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int)($edit['id']??0) ?>">
<div class="two"><label>Rule code<input name="rule_code" value="<?= h($edit['rule_code']??'') ?>" placeholder="LOW_MARGIN_REVIEW" required></label><label>Name<input name="name" value="<?= h($edit['name']??'') ?>" placeholder="Low gross margin" required></label></div>
<div class="form-grid"><label>Metric<select name="trigger_type"><?php foreach($triggerLabels as $k=>$label): ?><option value="<?= h($k) ?>" <?= ($edit['trigger_type']??'')===$k?'selected':'' ?>><?= h($label) ?></option><?php endforeach; ?></select></label><label>Comparison<select name="comparison_operator"><?php foreach($operatorLabels as $k=>$label): ?><option value="<?= h($k) ?>" <?= ($edit['comparison_operator']??'gte')===$k?'selected':'' ?>><?= h($label) ?></option><?php endforeach; ?></select></label><label>Threshold<input type="number" step=".0001" name="threshold_value" value="<?= h((string)($edit['threshold_value']??'0')) ?>"></label></div>
<div class="two"><label>Preferred approver role<select name="approver_role_id"><option value="">Any quotation approver</option><?php foreach($roles as $role): ?><option value="<?= (int)$role['id'] ?>" <?= (int)($edit['approver_role_id']??0)===(int)$role['id']?'selected':'' ?>><?= h($role['name']) ?></option><?php endforeach; ?></select></label><label>Priority<input type="number" name="priority" value="<?= (int)($edit['priority']??100) ?>"></label></div>
<label>Notes<textarea name="notes" rows="3"><?= h($edit['notes']??'') ?></textarea></label><label class="check"><input type="checkbox" name="is_active" value="1" <?= !isset($edit['is_active'])||(int)$edit['is_active']===1?'checked':'' ?>> Rule is active</label><button class="btn primary">Save approval rule</button>
</form></section>

<section class="staff-panel"><p class="eyebrow">How Stage 4 uses rules</p><h2>Approval routing</h2><div class="approval-rule-explainer"><p>Each active rule is evaluated against the frozen quotation revision when staff submit it. Every triggered rule becomes its own approval requirement.</p><p>Staff without <code>quotation.approve</code> also require a general management approval even when no commercial rule is triggered.</p><p>Only when every request for that revision is approved can the exact snapshot be issued to the customer.</p></div></section>
</div>

<section class="staff-panel table-panel"><div class="section-title"><div><p class="eyebrow">Commercial controls</p><h2><?= count($rules) ?> approval rule<?= count($rules)===1?'':'s' ?></h2></div><span class="muted tiny">Inactive recommended rules are safe to review before enabling.</span></div><table><thead><tr><th>Rule</th><th>Metric</th><th>Condition</th><th>Approver</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody><?php foreach($rules as $r): ?><tr><td><b><?= h($r['name']) ?></b><small><?= h($r['rule_code']) ?></small></td><td><?= h($triggerLabels[$r['trigger_type']]??$r['trigger_type']) ?></td><td><b><?= h($operatorLabels[$r['comparison_operator']]??$r['comparison_operator']) ?> <?= h(number_format((float)$r['threshold_value'],2)) ?></b></td><td><?= h($r['approver_role_name']?:'Any quotation approver') ?></td><td><?= (int)$r['priority'] ?></td><td><span class="pill <?= (int)$r['is_active']?'approved':'rejected' ?>"><?= (int)$r['is_active']?'Active':'Inactive' ?></span></td><td><div class="actions"><a class="btn" href="<?= h(ideare_root_url('staff/admin/quotation-approval-rules.php?edit='.(int)$r['id'])) ?>">Edit</a><form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int)$r['id'] ?>"><input type="hidden" name="is_active" value="<?= (int)$r['is_active']?'0':'1' ?>"><button class="btn"><?= (int)$r['is_active']?'Disable':'Enable' ?></button></form></div></td></tr><?php endforeach; ?><?php if(!$rules): ?><tr><td colspan="7"><p class="muted">No approval rules configured.</p></td></tr><?php endif; ?></tbody></table></section>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
