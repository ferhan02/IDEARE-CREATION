<?php
require_once __DIR__.'/../../includes/staff/operations.php';

require_login();
verify_csrf();

$pdo=staff_db();
$staff=current_staff();
$id=(int)($_GET['id']??0);

$q=$pdo->prepare("
    SELECT
        p.*,
        c.name customer_name,
        c.phone customer_phone,
        c.email customer_email,
        c.id customer_id,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) manager_name
    FROM projects p
    JOIN customers c ON c.id=p.customer_id
    LEFT JOIN staff s ON s.id=p.assigned_manager
    WHERE p.id=?
");
$q->execute([$id]);
$p=$q->fetch();

if(!$p){
    http_response_code(404);
    exit('Project not found');
}

if($_SERVER['REQUEST_METHOD']==='POST'){
    $action=$_POST['action']??'';

    if($action==='status'){
        $old=$p['status'];
        $new=$_POST['status'];

        $pdo->prepare("
            UPDATE projects
            SET status=?,
                completed_at=IF(?='completed',NOW(),completed_at)
            WHERE id=?
        ")->execute([$new,$new,$id]);

        project_activity(
            $pdo,
            $id,
            'status_change',
            'Status changed',
            ucwords(str_replace('_',' ',$old))
            .' → '
            .ucwords(str_replace('_',' ',$new))
        );

        flash('success','Project status updated.');
        staff_redirect('staff/pages/project-view.php?id='.$id);
    }

    if($action==='design_link'){
        $did=(int)($_POST['design_id']??0);
        $purpose=$_POST['purpose']??'concept';

        if($did){
            $pdo->prepare("
                INSERT IGNORE INTO project_designs
                (project_id,design_id,purpose,is_primary,linked_by)
                VALUES(?,?,?,?,?)
            ")->execute([
                $id,
                $did,
                $purpose,
                isset($_POST['is_primary'])?1:0,
                $staff['id']
            ]);

            project_activity(
                $pdo,
                $id,
                'design_linked',
                'Cabinet design linked',
                'Design #'.$did.' linked as '.$purpose
            );

            flash('success','Design linked to project.');
        }

        staff_redirect('staff/pages/project-view.php?id='.$id);
    }
}

$designs=$pdo->query("
    SELECT id,design_code,title
    FROM designs
    ORDER BY updated_at DESC
")->fetchAll();

$dq=$pdo->prepare("
    SELECT pd.*,d.design_code,d.title
    FROM project_designs pd
    JOIN designs d ON d.id=pd.design_id
    WHERE pd.project_id=?
    ORDER BY pd.is_primary DESC,pd.created_at DESC
");
$dq->execute([$id]);
$linkedDesigns=$dq->fetchAll();

$mq=$pdo->prepare("
    SELECT
        sm.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) measured_by_name
    FROM site_measurements sm
    LEFT JOIN staff s ON s.id=sm.measured_by
    WHERE sm.project_id=?
    ORDER BY sm.measured_at DESC
");
$mq->execute([$id]);
$measurements=$mq->fetchAll();

$tq=$pdo->prepare("
    SELECT
        t.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) assigned_name
    FROM tasks t
    LEFT JOIN staff s ON s.id=t.assigned_to
    WHERE t.project_id=?
    ORDER BY
        FIELD(t.status,'in_progress','todo','waiting','completed','cancelled'),
        t.due_date
");
$tq->execute([$id]);
$tasks=$tq->fetchAll();

$aq=$pdo->prepare("
    SELECT
        pa.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) staff_name
    FROM project_activity pa
    LEFT JOIN staff s ON s.id=pa.staff_id
    WHERE pa.project_id=?
    ORDER BY pa.created_at DESC
    LIMIT 40
");
$aq->execute([$id]);
$activity=$aq->fetchAll();

$statuses=array_keys(project_statuses());
$currentIndex=array_search($p['status'],$statuses,true);

$pageTitle=$p['project_code'];
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content">
    <div class="page-head">
        <div>
            <p class="eyebrow"><?= h($p['project_code']) ?></p>
            <h1><?= h($p['name']) ?></h1>
            <p class="muted">
                <a href="<?= h(
                    ideare_root_url(
                        'staff/pages/customer-view.php?id='.$p['customer_id']
                    )
                ) ?>">
                    <?= h($p['customer_name']) ?>
                </a>
                · <?= h($p['project_type']?:'General project') ?>
            </p>
        </div>

        <div class="actions">
            <a class="btn" href="<?= h(
                ideare_root_url(
                    'staff/pages/site-measurements.php?project_id='.$id
                )
            ) ?>">
                Add measurement
            </a>

            <a class="btn" href="<?= h(
                ideare_root_url('staff/pages/projects.php')
            ) ?>">
                All projects
            </a>
        </div>
    </div>

    <section class="staff-panel">
        <div class="section-title">
            <div>
                <p class="eyebrow">Progress</p>
                <h2><?= h(project_statuses()[$p['status']]??$p['status']) ?></h2>
            </div>

            <form method="post" class="inline-form">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="status">

                <select name="status">
                    <?php foreach(project_statuses() as $key=>$value): ?>
                        <option
                            value="<?= h($key) ?>"
                            <?= $p['status']===$key?'selected':'' ?>
                        >
                            <?= h($value) ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <button class="btn">Update</button>
            </form>
        </div>

        <div class="progress-track">
            <?php foreach($statuses as $i=>$status): ?>
                <?php if(in_array($status,['on_hold','cancelled'],true)) continue; ?>
                <span
                    class="progress-step <?= $currentIndex!==false&&$i<=$currentIndex?'done':'' ?>"
                    title="<?= h(project_statuses()[$status]) ?>"
                ></span>
            <?php endforeach; ?>
        </div>

        <div class="kpi-inline" style="margin-top:18px">
            <span>
                <small>Manager</small>
                <strong><?= h($p['manager_name']?:'Unassigned') ?></strong>
            </span>
            <span>
                <small>Target</small>
                <strong>
                    <?= $p['target_date']
                        ?h(date('j M Y',strtotime($p['target_date'])))
                        :'—' ?>
                </strong>
            </span>
            <span>
                <small>Value</small>
                <strong><?= money($p['estimated_value']) ?></strong>
            </span>
        </div>
    </section>

    <div class="split-grid">
        <section class="staff-panel">
            <div class="section-title">
                <div>
                    <p class="eyebrow">Work</p>
                    <h2>Project tasks</h2>
                    <p class="muted">
                        Tasks linked to this project are managed centrally.
                    </p>
                </div>

                <?php if(can_manage_tasks()): ?>
                    <a
                        class="btn primary"
                        href="<?= h(
                            ideare_root_url(
                                'staff/admin/task-management.php?project_id='.$id
                            )
                        ) ?>"
                    >
                        Assign task
                    </a>
                <?php else: ?>
                    <a
                        class="btn"
                        href="<?= h(ideare_root_url('staff/pages/tasks.php')) ?>"
                    >
                        My tasks
                    </a>
                <?php endif; ?>
            </div>

            <div class="list">
                <?php foreach($tasks as $task): ?>
                    <div class="list-row">
                        <div>
                            <b><?= h($task['title']) ?></b>
                            <small>
                                <?= h($task['assigned_name']?:'Unassigned') ?>
                                · <?= h(ucwords(
                                    str_replace('_',' ',$task['status'])
                                )) ?>
                                <?= $task['due_date']
                                    ?' · '.h(date(
                                        'j M, g:i A',
                                        strtotime($task['due_date'])
                                    ))
                                    :'' ?>
                            </small>
                        </div>
                        <span class="pill <?= h($task['priority']) ?>">
                            <?= h($task['priority']) ?>
                        </span>
                    </div>
                <?php endforeach; ?>

                <?php if(!$tasks): ?>
                    <p class="muted">No tasks linked to this project yet.</p>
                <?php endif; ?>
            </div>
        </section>

        <section class="staff-panel">
            <div class="section-title">
                <h2>Site measurements</h2>
                <a href="<?= h(
                    ideare_root_url(
                        'staff/pages/site-measurements.php?project_id='.$id
                    )
                ) ?>">
                    Open survey
                </a>
            </div>

            <div class="list">
                <?php foreach($measurements as $measurement): ?>
                    <div class="list-row">
                        <div>
                            <b><?= h($measurement['room_name']) ?></b>
                            <small>
                                <?= h(date(
                                    'j M Y, g:i A',
                                    strtotime($measurement['measured_at'])
                                )) ?>
                                · <?= h(
                                    $measurement['measured_by_name']?:'Unknown'
                                ) ?>
                            </small>
                        </div>
                        <span>
                            <?= $measurement['wall_a_mm']
                                ?h($measurement['wall_a_mm'].' mm')
                                :'' ?>
                        </span>
                    </div>
                <?php endforeach; ?>

                <?php if(!$measurements): ?>
                    <p class="muted">No measurements yet.</p>
                <?php endif; ?>
            </div>
        </section>
    </div>

    <section class="staff-panel">
        <div class="section-title">
            <h2>Cabinet designs</h2>
            <a href="<?= h(ideare_root_url('designer/index.php')) ?>">
                Open configurator ↗
            </a>
        </div>

        <form method="post" class="mini-form">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="design_link">

            <label>
                Saved design
                <select name="design_id" required>
                    <option value="">Choose design...</option>
                    <?php foreach($designs as $design): ?>
                        <option value="<?= (int)$design['id'] ?>">
                            <?= h(
                                $design['design_code']
                                .' · '.$design['title']
                            ) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>

            <label>
                Purpose
                <select name="purpose">
                    <option>concept</option>
                    <option>quotation</option>
                    <option>approved</option>
                    <option>production</option>
                    <option>as_built</option>
                </select>
            </label>

            <label>
                <input type="checkbox" name="is_primary">
                Primary design
            </label>

            <button class="btn">Link design</button>
        </form>

        <div class="list">
            <?php foreach($linkedDesigns as $design): ?>
                <div class="list-row">
                    <div>
                        <b>
                            <?= h(
                                $design['design_code'].' · '.$design['title']
                            ) ?>
                        </b>
                        <small>
                            <?= h($design['purpose']) ?>
                            <?= $design['is_primary']?' · Primary':'' ?>
                        </small>
                    </div>

                    <a
                        class="btn"
                        href="<?= h(
                            ideare_root_url(
                                'designer/index.php?design_id='
                                .$design['design_id']
                            )
                        ) ?>"
                    >
                        Open
                    </a>
                </div>
            <?php endforeach; ?>

            <?php if(!$linkedDesigns): ?>
                <p class="muted">No configurator design linked yet.</p>
            <?php endif; ?>
        </div>
    </section>

    <section class="staff-panel">
        <h2>Project activity</h2>

        <div class="timeline">
            <?php foreach($activity as $entry): ?>
                <div class="timeline-item">
                    <b><?= h($entry['title']) ?></b>
                    <small class="muted">
                        <?= h(date(
                            'j M Y, g:i A',
                            strtotime($entry['created_at'])
                        )) ?>
                        · <?= h($entry['staff_name']?:'System') ?>
                    </small>

                    <?php if($entry['description']): ?>
                        <p><?= h($entry['description']) ?></p>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>

            <?php if(!$activity): ?>
                <p class="muted">No activity yet.</p>
            <?php endif; ?>
        </div>
    </section>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
