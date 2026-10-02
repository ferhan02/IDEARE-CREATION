<?php
require_once __DIR__.'/operations.php';
function feature_table(PDO $pdo,string $table): void {
    if(!db_table_exists($pdo,$table)){
        http_response_code(503);
        $GLOBALS['pageTitle']='Database update required';
        require __DIR__.'/header.php';
        echo '<main class="staff-content"><section class="staff-panel"><h1>Database update required</h1><p>Run <code>database/ideare_full_32_feature_schema.sql</code> in phpMyAdmin, then reload this page.</p></section></main>';
        require __DIR__.'/footer.php'; exit;
    }
}
function fpost(string $key,$default=''){ return trim((string)($_POST[$key]??$default)); }
function fint(string $key): ?int { $v=$_POST[$key]??''; return $v===''?null:(int)$v; }
function fnum(string $key,float $default=0): float { return is_numeric($_POST[$key]??null)?(float)$_POST[$key]:$default; }
function db_rows(PDO $pdo,string $sql,array $args=[]): array { $q=$pdo->prepare($sql);$q->execute($args);return $q->fetchAll(PDO::FETCH_ASSOC); }
function db_one(PDO $pdo,string $sql,array $args=[]): ?array { $q=$pdo->prepare($sql);$q->execute($args);$r=$q->fetch(PDO::FETCH_ASSOC);return $r?:null; }
function project_options(PDO $pdo): array { return db_rows($pdo,"SELECT id,project_code,name FROM projects ORDER BY updated_at DESC"); }
function customer_options(PDO $pdo): array { return db_rows($pdo,"SELECT id,customer_code,name FROM customers ORDER BY name"); }
function staff_options(PDO $pdo): array { return db_rows($pdo,"SELECT id,first_name,last_name FROM staff WHERE is_active=1 ORDER BY first_name,last_name"); }
function material_options(PDO $pdo): array { return db_rows($pdo,"SELECT id,material_code,name,unit,unit_cost FROM materials WHERE is_active=1 ORDER BY name"); }
function hopt($a,$b){ return h(trim((string)$a.' '.(string)$b)); }
function module_head(string $eyebrow,string $title,string $desc=''): void { echo '<main class="staff-content"><div class="page-head"><div><p class="eyebrow">'.h($eyebrow).'</p><h1>'.h($title).'</h1>'.($desc?'<p class="muted">'.h($desc).'</p>':'').'</div></div>'; }
function module_end(): void { echo '</main>'; }
?>