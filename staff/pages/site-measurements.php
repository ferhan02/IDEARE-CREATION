<?php
require_once __DIR__.'/../../includes/staff/operations.php';
require_login();
verify_csrf();

$pdo=staff_db();
$staff=current_staff();
$projectId=(int)($_GET['project_id']??$_POST['project_id']??0);

$projects=$pdo->query("
    SELECT p.id,p.project_code,p.name,c.name customer_name
    FROM projects p
    JOIN customers c ON c.id=p.customer_id
    WHERE p.status NOT IN('completed','cancelled')
    ORDER BY p.updated_at DESC
")->fetchAll();

if($_SERVER['REQUEST_METHOD']==='POST' && ($_POST['action']??'')==='save'){
    $when=$_POST['measured_at']?str_replace('T',' ',$_POST['measured_at']):date('Y-m-d H:i:s');
    $q=$pdo->prepare('INSERT INTO site_measurements(project_id,measured_by,measured_at,room_name,wall_a_mm,wall_b_mm,wall_c_mm,wall_d_mm,ceiling_height_mm,window_details,door_details,plumbing_details,electrical_details,obstacles,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');

    $vals=[];
    foreach(['wall_a_mm','wall_b_mm','wall_c_mm','wall_d_mm','ceiling_height_mm'] as $k){
        $vals[$k]=$_POST[$k]!==''?(float)$_POST[$k]:null;
    }

    $q->execute([
        $projectId,
        $staff['id'],
        $when,
        trim($_POST['room_name']),
        $vals['wall_a_mm'],
        $vals['wall_b_mm'],
        $vals['wall_c_mm'],
        $vals['wall_d_mm'],
        $vals['ceiling_height_mm'],
        trim($_POST['window_details'])?:null,
        trim($_POST['door_details'])?:null,
        trim($_POST['plumbing_details'])?:null,
        trim($_POST['electrical_details'])?:null,
        trim($_POST['obstacles'])?:null,
        trim($_POST['notes'])?:null
    ]);

    project_activity($pdo,$projectId,'measurement','Site measurement added',trim($_POST['room_name']));
    $pdo->prepare("UPDATE projects SET status=IF(status='consultation','measurement',status) WHERE id=?")->execute([$projectId]);
    flash('success','Site measurement saved.');
    staff_redirect('staff/pages/site-measurements.php?project_id='.$projectId);
}

$rows=[];
$project=null;
if($projectId){
    $q=$pdo->prepare("
        SELECT p.*,c.name customer_name,c.id customer_id
        FROM projects p
        JOIN customers c ON c.id=p.customer_id
        WHERE p.id=?
    ");
    $q->execute([$projectId]);
    $project=$q->fetch();

    $q=$pdo->prepare("
        SELECT sm.*,CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) measured_by_name
        FROM site_measurements sm
        LEFT JOIN staff s ON s.id=sm.measured_by
        WHERE sm.project_id=?
        ORDER BY sm.measured_at DESC
    ");
    $q->execute([$projectId]);
    $rows=$q->fetchAll();
}

$pageTitle='Site Measurements';
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content">
    <div class="page-head">
        <div>
            <p class="eyebrow">Site survey</p>
            <h1>Measurements</h1>
            <p class="muted">Capture site dimensions and service-location notes from phone, tablet or desktop.</p>
        </div>
        <?php if($project && can('quotation.create')): ?>
        <a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-create.php?project_id='.$projectId)) ?>">Create quotation</a>
        <?php endif; ?>
    </div>

    <section class="staff-panel">
        <form method="get" class="search-row">
            <label>
                Project
                <select name="project_id" required>
                    <option value="">Choose project</option>
                    <?php foreach($projects as $p): ?>
                        <option value="<?= $p['id'] ?>" <?= $projectId===(int)$p['id']?'selected':'' ?>><?= h($p['project_code'].' · '.$p['customer_name'].' · '.$p['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <button class="btn">Open</button>
        </form>
    </section>

    <?php if($project): ?>
    <div class="split-grid">
        <section class="staff-panel">
            <div class="section-title">
                <div>
                    <p class="eyebrow"><?= h($project['project_code']) ?></p>
                    <h2>New measurement</h2>
                </div>
                <a class="btn" href="<?= h(ideare_root_url('staff/pages/project-view.php?id='.$projectId)) ?>">Open project</a>
            </div>

            <form method="post">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="save">
                <input type="hidden" name="project_id" value="<?= $projectId ?>">

                <label>Measured at<input type="datetime-local" name="measured_at" value="<?= h(date('Y-m-d\TH:i')) ?>"></label>
                <label>Room / area<input name="room_name" placeholder="Kitchen" required></label>

                <div class="form-grid">
                    <label>Wall A (mm)<input type="number" step=".01" name="wall_a_mm"></label>
                    <label>Wall B (mm)<input type="number" step=".01" name="wall_b_mm"></label>
                    <label>Wall C (mm)<input type="number" step=".01" name="wall_c_mm"></label>
                    <label>Wall D (mm)<input type="number" step=".01" name="wall_d_mm"></label>
                    <label>Ceiling height (mm)<input type="number" step=".01" name="ceiling_height_mm"></label>
                </div>

                <label>Windows<textarea name="window_details" placeholder="Width, height, sill height and position"></textarea></label>
                <label>Doors<textarea name="door_details"></textarea></label>
                <label>Plumbing<textarea name="plumbing_details" placeholder="Sink, water inlet, drain positions"></textarea></label>
                <label>Electrical<textarea name="electrical_details" placeholder="Sockets, switches, appliance points"></textarea></label>
                <label>Obstacles<textarea name="obstacles" placeholder="Columns, beams, uneven walls..."></textarea></label>
                <label>Notes<textarea name="notes"></textarea></label>
                <button class="btn primary">Save measurement</button>
            </form>
        </section>

        <section class="staff-panel">
            <div class="section-title">
                <div>
                    <p class="eyebrow">Quotation reference</p>
                    <h2>Measurement history</h2>
                </div>
                <?php if(can('quotation.create')): ?>
                <a class="btn" href="<?= h(ideare_root_url('staff/pages/quotation-create.php?project_id='.$projectId)) ?>">Quote project</a>
                <?php endif; ?>
            </div>

            <div class="list">
                <?php foreach($rows as $r): ?>
                    <div class="mini-card" style="margin-bottom:10px">
                        <div class="section-title">
                            <div>
                                <b><?= h($r['room_name']) ?></b>
                                <small><?= h(date('j M Y, g:i A',strtotime($r['measured_at']))) ?></small>
                            </div>
                            <?php if(can('quotation.create')): ?>
                            <a class="btn primary" href="<?= h(ideare_root_url('staff/pages/quotation-create.php?project_id='.$projectId.'&measurement_id='.(int)$r['id'])) ?>">Use in quotation</a>
                            <?php endif; ?>
                        </div>

                        <p class="muted tiny">By <?= h($r['measured_by_name']?:'Unknown') ?></p>
                        <div class="metric-row">
                            <span class="pill">A <?= h($r['wall_a_mm']?:'—') ?> mm</span>
                            <span class="pill">B <?= h($r['wall_b_mm']?:'—') ?> mm</span>
                            <span class="pill">C <?= h($r['wall_c_mm']?:'—') ?> mm</span>
                            <span class="pill">D <?= h($r['wall_d_mm']?:'—') ?> mm</span>
                            <span class="pill">Ceiling <?= h($r['ceiling_height_mm']?:'—') ?> mm</span>
                        </div>
                        <?php if($r['notes']): ?><p><?= h($r['notes']) ?></p><?php endif; ?>
                    </div>
                <?php endforeach; ?>

                <?php if(!$rows): ?><p class="muted">No measurements recorded.</p><?php endif; ?>
            </div>
        </section>
    </div>
    <?php endif; ?>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
