<?php
require_once __DIR__.'/../../includes/staff/feature-tools.php';
require_permission('search.use');

$pdo=staff_db();
$staff=current_staff();
$q=trim((string)($_GET['q']??''));
$results=[];
$searchedSources=0;
$sourceErrors=0;

/**
 * Global business-data search.
 *
 * This deliberately searches records, not navigation/page names. It uses
 * SHOW COLUMNS instead of information_schema so it remains compatible with
 * restricted phpMyAdmin/MySQL accounts and tolerates optional feature tables.
 */
function global_search_columns(PDO $pdo,string $table): array
{
    static $cache=[];

    if(isset($cache[$table])) return $cache[$table];
    if(!preg_match('/^[A-Za-z0-9_]+$/',$table)) return $cache[$table]=[];

    try{
        $rows=$pdo->query('SHOW COLUMNS FROM `'.$table.'`')->fetchAll(PDO::FETCH_ASSOC);
        return $cache[$table]=array_column($rows,'Field');
    }catch(Throwable $e){
        return $cache[$table]=[];
    }
}

function global_search_first(array $row,array $fields,string $fallback=''): string
{
    foreach($fields as $field){
        if(isset($row[$field]) && trim((string)$row[$field])!==''){
            return trim((string)$row[$field]);
        }
    }
    return $fallback;
}

function global_search_excerpt(array $row,array $fields,string $query,array $already=[]): string
{
    $parts=[];
    $needle=mb_strtolower($query);

    foreach($fields as $field){
        if(!isset($row[$field])) continue;
        $value=trim((string)$row[$field]);
        if($value==='' || in_array($value,$already,true)) continue;

        $isMatch=$needle!=='' && str_contains(mb_strtolower($value),$needle);
        if($isMatch || count($parts)<2){
            if(mb_strlen($value)>125) $value=mb_substr($value,0,122).'…';
            $parts[]=$value;
        }

        if(count($parts)>=3) break;
    }

    return implode(' · ',array_values(array_unique($parts)));
}

function global_search_source(PDO $pdo,array $source,string $query,int $limit=10): array
{
    $table=(string)$source['table'];
    $columns=global_search_columns($pdo,$table);
    if(!$columns) return [];

    $searchFields=array_values(array_intersect($source['fields'],$columns));
    if(!$searchFields) return [];

    $where=[];
    $params=[];
    $like='%'.$query.'%';

    foreach($searchFields as $field){
        $where[]='`'.$field.'` LIKE ?';
        $params[]=$like;
    }

    $sql='SELECT * FROM `'.$table.'` WHERE ('.implode(' OR ',$where).')';

    if(!empty($source['where'])){
        $sql.=' AND ('.$source['where'].')';
        foreach(($source['params']??[]) as $value) $params[]=$value;
    }

    if(!empty($source['order_by'])) $sql.=' ORDER BY '.$source['order_by'];
    $sql.=' LIMIT '.max(1,min(25,$limit));

    $statement=$pdo->prepare($sql);
    $statement->execute($params);
    $rows=$statement->fetchAll(PDO::FETCH_ASSOC);
    $out=[];

    foreach($rows as $row){
        $title=global_search_first(
            $row,
            $source['title_fields']??[],
            ($source['label']??'Record').' #'.($row['id']??'')
        );
        $code=global_search_first($row,$source['code_fields']??[],'');
        $meta=global_search_excerpt(
            $row,
            $source['meta_fields']??$searchFields,
            $query,
            array_filter([$title,$code])
        );

        $url='';
        if(isset($source['url']) && is_callable($source['url'])){
            $url=(string)$source['url']($row);
        }

        $out[]=[
            'type'=>$source['label'],
            'icon'=>$source['icon']??'◇',
            'title'=>$title,
            'code'=>$code,
            'meta'=>$meta,
            'url'=>$url,
        ];
    }

    return $out;
}

$sources=[
    [
        'label'=>'Customers','icon'=>'CU','table'=>'customers',
        'fields'=>['customer_code','name','phone','email','site_address','lead_source','interested_service','status','notes'],
        'title_fields'=>['name'],'code_fields'=>['customer_code'],
        'meta_fields'=>['phone','email','interested_service','status','site_address','notes'],
        'url'=>fn($r)=>'staff/pages/customer-view.php?id='.(int)$r['id'],
    ],
    [
        'label'=>'Projects','icon'=>'PR','table'=>'projects',
        'fields'=>['project_code','name','status','site_address','description','notes'],
        'title_fields'=>['name'],'code_fields'=>['project_code'],
        'meta_fields'=>['status','site_address','description','notes'],
        'url'=>fn($r)=>'staff/pages/project-view.php?id='.(int)$r['id'],
    ],
    [
        'label'=>'Follow-ups','icon'=>'FU','table'=>'follow_ups',
        'fields'=>['reason','notes','outcome','status'],
        'title_fields'=>['reason'],'code_fields'=>[],
        'meta_fields'=>['status','notes','outcome','follow_up_at'],
        'where'=>'assigned_to=?','params'=>[(int)$staff['id']],
        'url'=>fn($r)=>!empty($r['customer_id'])?'staff/pages/customer-view.php?id='.(int)$r['customer_id']:'staff/pages/customers.php',
    ],
    [
        'label'=>'Site Measurements','icon'=>'ME','table'=>'site_measurements',
        'fields'=>['room_name','window_details','door_details','plumbing_details','electrical_details','obstacles','notes'],
        'title_fields'=>['room_name'],'code_fields'=>[],
        'meta_fields'=>['window_details','door_details','plumbing_details','electrical_details','obstacles','notes'],
        'url'=>fn($r)=>!empty($r['project_id'])?'staff/pages/site-measurements.php?project_id='.(int)$r['project_id']:'staff/pages/site-measurements.php',
    ],
    [
        'label'=>'Internal Materials','icon'=>'MA','table'=>'materials',
        'fields'=>['material_code','name','brand','supplier_name','unit','unit_type','notes'],
        'title_fields'=>['name'],'code_fields'=>['material_code'],
        'meta_fields'=>['brand','supplier_name','unit_type','unit','notes'],
        'url'=>fn($r)=>'staff/pages/materials.php',
    ],
    [
        'label'=>'Topmix Catalogue','icon'=>'TM','table'=>'material_catalogue_topmix',
        'fields'=>['product_code','product_name','finish_code','category','series','brand','supplier','raw_code','notes'],
        'title_fields'=>['product_name'],'code_fields'=>['product_code','raw_code'],
        'meta_fields'=>['category','series','finish_code','brand','supplier','notes'],
        'where'=>'is_active=1',
        'url'=>fn($r)=>'material-catalogue.php?q='.rawurlencode((string)($r['product_code']??$r['product_name']??'')),
    ],
    [
        'label'=>'DGtango Catalogue','icon'=>'DG','table'=>'material_catalogue_dgtango',
        'fields'=>['product_code','product_name','finish_code','category','series','brand','supplier','raw_code','notes'],
        'title_fields'=>['product_name'],'code_fields'=>['product_code','raw_code'],
        'meta_fields'=>['category','series','finish_code','brand','supplier','notes'],
        'where'=>'is_active=1',
        'url'=>fn($r)=>'material-catalogue.php?q='.rawurlencode((string)($r['product_code']??$r['product_name']??'')),
    ],
    [
        'label'=>'Notifications','icon'=>'NO','table'=>'notifications',
        'fields'=>['title','message','type','notification_type','entity_type','related_type'],
        'title_fields'=>['title'],'code_fields'=>[],
        'meta_fields'=>['message','type','notification_type','entity_type'],
        'where'=>'staff_id=?','params'=>[(int)$staff['id']],
        'url'=>fn($r)=>'staff/pages/notifications.php',
    ],
];

if(can('appointments.view')){
    $sources[]=[
        'label'=>'Appointments','icon'=>'AP','table'=>'customer_appointments',
        'fields'=>['customer_name','customer_phone','customer_email','appointment_type','status','staff_notes','customer_notes'],
        'title_fields'=>['customer_name'],'code_fields'=>[],
        'meta_fields'=>['appointment_type','status','customer_phone','customer_email','staff_notes','customer_notes'],
        'url'=>fn($r)=>'staff/pages/appointments.php',
    ];
}

if(can('quotation.view')){
    $sources[]=[
        'label'=>'Quotations','icon'=>'QT','table'=>'quotations',
        'fields'=>['quotation_code','quotation_no','reference_no','quotation_title','customer_name','customer_code_snapshot','project_code_snapshot','project_name','status','notes'],
        'title_fields'=>['quotation_title','customer_name','quotation_code','quotation_no'],
        'code_fields'=>['quotation_code','quotation_no','reference_no'],
        'meta_fields'=>['customer_name','project_code_snapshot','project_name','status','reference_no','notes'],
        'url'=>fn($r)=>!empty($r['id'])?'staff/pages/quotation-view.php?id='.(int)$r['id']:'staff/pages/quotation-centre.php',
    ];
}

if(can('finance.view')){
    $sources[]=[
        'label'=>'Invoices','icon'=>'IN','table'=>'invoices',
        'fields'=>['invoice_no','status','notes'],
        'title_fields'=>['invoice_no'],'code_fields'=>['invoice_no'],
        'meta_fields'=>['status','issue_date','due_date','notes'],
        'url'=>fn($r)=>'staff/pages/finance.php',
    ];
    $sources[]=[
        'label'=>'Payments','icon'=>'PA','table'=>'payments',
        'fields'=>['payment_no','payment_method','reference_no','status','notes'],
        'title_fields'=>['payment_no'],'code_fields'=>['reference_no'],
        'meta_fields'=>['payment_method','status','reference_no','notes'],
        'url'=>fn($r)=>'staff/pages/finance.php',
    ];
}

if(can('suppliers.view')){
    $sources[]=[
        'label'=>'Suppliers','icon'=>'SU','table'=>'suppliers',
        'fields'=>['supplier_code','company_name','contact_person','phone','email','address','payment_terms','notes'],
        'title_fields'=>['company_name'],'code_fields'=>['supplier_code'],
        'meta_fields'=>['contact_person','phone','email','payment_terms','address','notes'],
        'url'=>fn($r)=>'staff/pages/suppliers.php',
    ];
}

if(can('purchasing.view')){
    $sources[]=[
        'label'=>'Purchase Orders','icon'=>'PO','table'=>'purchase_orders',
        'fields'=>['po_number','status','delivery_address','notes'],
        'title_fields'=>['po_number'],'code_fields'=>['po_number'],
        'meta_fields'=>['status','delivery_address','notes','expected_date'],
        'url'=>fn($r)=>'staff/pages/purchase-orders.php',
    ];
}

if(can('inventory.view')){
    $sources[]=[
        'label'=>'Inventory Locations','icon'=>'ST','table'=>'inventory_locations',
        'fields'=>['name','code','location_code','address','notes'],
        'title_fields'=>['name'],'code_fields'=>['location_code','code'],
        'meta_fields'=>['address','notes'],
        'url'=>fn($r)=>'staff/pages/inventory.php',
    ];
}

if(can('documents.view')){
    $sources[]=[
        'label'=>'Documents','icon'=>'DO','table'=>'documents',
        'fields'=>['document_code','title','category','file_name','file_path','mime_type'],
        'title_fields'=>['title','file_name'],'code_fields'=>['document_code'],
        'meta_fields'=>['category','file_name','file_path','mime_type'],
        'url'=>fn($r)=>'staff/pages/documents.php',
    ];
    $sources[]=[
        'label'=>'Internal Notes','icon'=>'NT','table'=>'internal_notes',
        'fields'=>['note','entity_type'],
        'title_fields'=>['note'],'code_fields'=>[],
        'meta_fields'=>['entity_type','created_at'],
        'url'=>fn($r)=>'staff/pages/documents.php',
    ];
}

if(can('materials.view')){
    $sources[]=[
        'label'=>'Bills of Materials','icon'=>'BM','table'=>'bills_of_materials',
        'fields'=>['bom_code','status','notes'],
        'title_fields'=>['bom_code'],'code_fields'=>['bom_code'],
        'meta_fields'=>['status','notes'],
        'url'=>fn($r)=>'staff/pages/bom.php',
    ];
}

if(can('production.view')){
    $sources[]=[
        'label'=>'Production','icon'=>'PD','table'=>'production_jobs',
        'fields'=>['production_code','status','priority','notes'],
        'title_fields'=>['production_code'],'code_fields'=>['production_code'],
        'meta_fields'=>['status','priority','notes'],
        'url'=>fn($r)=>'staff/pages/production.php',
    ];
}

if(can('qc.view')){
    $sources[]=[
        'label'=>'Quality Control','icon'=>'QC','table'=>'qc_inspections',
        'fields'=>['inspection_code','inspection_type','status','overall_notes'],
        'title_fields'=>['inspection_code'],'code_fields'=>['inspection_code'],
        'meta_fields'=>['inspection_type','status','overall_notes'],
        'url'=>fn($r)=>'staff/pages/quality-control.php',
    ];
}

if(can('installations.view')){
    $sources[]=[
        'label'=>'Installations','icon'=>'IS','table'=>'installations',
        'fields'=>['installation_code','status','site_address','tools_notes','installation_notes'],
        'title_fields'=>['installation_code'],'code_fields'=>['installation_code'],
        'meta_fields'=>['status','site_address','tools_notes','installation_notes'],
        'url'=>fn($r)=>'staff/pages/installations.php',
    ];
}

if(can('warranty.view')){
    $sources[]=[
        'label'=>'Warranties','icon'=>'WA','table'=>'warranties',
        'fields'=>['warranty_code','status','coverage_terms'],
        'title_fields'=>['warranty_code'],'code_fields'=>['warranty_code'],
        'meta_fields'=>['status','coverage_terms','starts_on','expires_on'],
        'url'=>fn($r)=>'staff/pages/warranty.php',
    ];
    $sources[]=[
        'label'=>'Warranty Claims','icon'=>'WC','table'=>'warranty_claims',
        'fields'=>['claim_code','issue_title','issue_description','status','priority','resolution_notes'],
        'title_fields'=>['issue_title','claim_code'],'code_fields'=>['claim_code'],
        'meta_fields'=>['status','priority','issue_description','resolution_notes'],
        'url'=>fn($r)=>'staff/pages/warranty.php',
    ];
}

if(can('task.view_own') || can_manage_tasks()){
    $taskSource=[
        'label'=>'Tasks','icon'=>'TK','table'=>'tasks',
        'fields'=>['title','description','status','priority','completion_note'],
        'title_fields'=>['title'],'code_fields'=>[],
        'meta_fields'=>['status','priority','description','completion_note','due_date'],
        'url'=>fn($r)=>'staff/pages/task-view.php?id='.(int)$r['id'],
    ];
    if(!can_manage_tasks()){
        $taskSource['where']='assigned_to=?';
        $taskSource['params']=[(int)$staff['id']];
    }
    $sources[]=$taskSource;
}

if($q!==''){
    foreach($sources as $source){
        try{
            if(!global_search_columns($pdo,$source['table'])) continue;
            $searchedSources++;
            foreach(global_search_source($pdo,$source,$q,10) as $row) $results[]=$row;
        }catch(Throwable $e){
            $sourceErrors++;
            error_log('Global search source failed ['.$source['table'].']: '.$e->getMessage());
        }
    }
}

$grouped=[];
foreach($results as $result) $grouped[$result['type']][]=$result;

$pageTitle='Global Search';
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content global-search-page">
    <div class="page-head global-search-head">
        <div>
            <p class="eyebrow">Business-wide lookup</p>
            <h1>Global Search</h1>
            <p class="muted">Search business records across CRM, projects, quotations, catalogues, operations and other modules you are allowed to access. Navigation pages are intentionally not included.</p>
        </div>
    </div>

    <section class="staff-panel global-search-panel">
        <form method="get" class="global-search-form">
            <div class="global-search-control">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <input
                    autofocus
                    type="search"
                    name="q"
                    value="<?=h($q)?>"
                    placeholder="Try a customer name, phone, project code, HPL code, quotation, supplier..."
                    autocomplete="off"
                >
            </div>
            <button class="btn primary global-search-submit" type="submit">Search everything</button>
        </form>

        <?php if($q!==''): ?>
            <div class="global-search-summary">
                <span><strong><?=count($results)?></strong> result<?=count($results)===1?'':'s'?></span>
                <span><strong><?=$searchedSources?></strong> searchable data area<?= $searchedSources===1?'':'s' ?> checked</span>
                <?php if($sourceErrors>0): ?><span class="global-search-warning"><?=$sourceErrors?> source<?= $sourceErrors===1?'':'s' ?> skipped safely</span><?php endif; ?>
            </div>
        <?php else: ?>
            <div class="global-search-suggestions">
                <span>Examples:</span>
                <button type="button" data-search-example="CUS-">customer code</button>
                <button type="button" data-search-example="Kitchen">project / room</button>
                <button type="button" data-search-example="Woodgrain">catalogue category</button>
                <button type="button" data-search-example="QT-">quotation code</button>
            </div>
        <?php endif; ?>
    </section>

    <?php if($q!=='' && !$results): ?>
        <section class="staff-panel global-search-empty">
            <div class="global-search-empty-icon">⌕</div>
            <h2>No matching records</h2>
            <p class="muted">Try a shorter term, a product/customer code, phone number, email, project name or material finish.</p>
        </section>
    <?php endif; ?>

    <?php foreach($grouped as $label=>$items): ?>
        <section class="staff-panel global-search-group">
            <div class="section-title global-search-group-head">
                <div>
                    <p class="eyebrow">Search results</p>
                    <h2><?=h($label)?></h2>
                </div>
                <span class="global-search-count"><?=count($items)?></span>
            </div>

            <div class="global-search-results">
                <?php foreach($items as $r): ?>
                    <?php $href=$r['url']!==''?ideare_root_url($r['url']):'#'; ?>
                    <a class="global-search-result" href="<?=h($href)?>">
                        <span class="global-search-result-icon" aria-hidden="true"><?=h($r['icon'])?></span>
                        <span class="global-search-result-copy">
                            <span class="global-search-result-topline">
                                <b><?=h($r['title'])?></b>
                                <?php if($r['code']!==''): ?><code><?=h($r['code'])?></code><?php endif; ?>
                            </span>
                            <?php if($r['meta']!==''): ?><small><?=h($r['meta'])?></small><?php endif; ?>
                        </span>
                        <span class="global-search-result-arrow" aria-hidden="true">→</span>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endforeach; ?>
</main>
<script>
(function(){
    const form=document.querySelector('.global-search-form');
    const input=form?.querySelector('input[name="q"]');
    if(!form || !input) return;

    document.querySelectorAll('[data-search-example]').forEach(button=>{
        button.addEventListener('click',()=>{
            input.value=button.dataset.searchExample||'';
            input.focus();
            form.requestSubmit();
        });
    });
})();
</script>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
