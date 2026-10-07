<?php
require_once __DIR__.'/../../includes/staff/operations.php';

require_permission('task.view_own');
verify_csrf();

$pdo=staff_db();
$staff=current_staff();

if($_SERVER['REQUEST_METHOD']==='POST'){
    $id=(int)($_POST['task_id']??0);
    $status=$_POST['status']??'todo';
    $allowed=['todo','in_progress','waiting'];

    if(!in_array($status,$allowed,true)){
        flash(
            'error',
            'Use the task detail page to complete a task so a completion note can be recorded.'
        );
        staff_redirect('staff/pages/tasks.php');
    }

    $q=$pdo->prepare("
        SELECT
            id,
            project_id,
            title,
            status,
            assigned_by
        FROM tasks
        WHERE id=? AND assigned_to=?
        LIMIT 1
    ");
    $q->execute([$id,$staff['id']]);
    $task=$q->fetch();

    if(!$task){
        flash('error','Task not found or no longer assigned to you.');
        staff_redirect('staff/pages/tasks.php');
    }

    if(in_array($task['status'],['completed','cancelled'],true)){
        flash(
            'error',
            'Completed or cancelled tasks cannot be changed from the quick status control.'
        );
        staff_redirect('staff/pages/tasks.php');
    }

    if($task['status']===$status){
        flash('info','No task status change was detected.');
        staff_redirect('staff/pages/tasks.php');
    }

    $oldLabel=task_statuses()[$task['status']]??$task['status'];
    $newLabel=task_statuses()[$status]??$status;

    try{
        $pdo->beginTransaction();

        $pdo->prepare("
            UPDATE tasks
            SET status=?
            WHERE id=? AND assigned_to=?
        ")->execute([
            $status,
            $id,
            $staff['id']
        ]);

        task_activity(
            $pdo,
            $id,
            'status_changed',
            $oldLabel.' → '.$newLabel
        );

        if($task['project_id']){
            project_activity(
                $pdo,
                (int)$task['project_id'],
                'task_status',
                'Task updated',
                $task['title'].' · '.$oldLabel.' → '.$newLabel
            );
        }

        if(
            $task['assigned_by']
            && (int)$task['assigned_by']!==(int)$staff['id']
        ){
            notify_staff(
                $pdo,
                (int)$task['assigned_by'],
                'Task status updated',
                $task['title'].' · '.$newLabel,
                'task',
                'task',
                $id
            );
        }

        $pdo->commit();

        log_activity(
            'task.status_changed',
            'task',
            (string)$id,
            $task['title'].' · '.$oldLabel.' → '.$newLabel
        );

        flash('success','Task status updated.');
    }catch(Throwable $e){
        if($pdo->inTransaction()){
            $pdo->rollBack();
        }

        error_log('Employee task status update failed: '.$e->getMessage());
        flash('error','The task could not be updated.');
    }

    staff_redirect('staff/pages/tasks.php');
}

$s=$pdo->prepare("
    SELECT
        t.*,
        p.project_code,
        p.name project_name,
        c.name customer_name,
        (
            SELECT COUNT(*)
            FROM task_checklist_items ci
            WHERE ci.task_id=t.id
        ) checklist_total,
        (
            SELECT COUNT(*)
            FROM task_checklist_items ci
            WHERE ci.task_id=t.id
              AND ci.is_completed=1
        ) checklist_done
    FROM tasks t
    LEFT JOIN projects p ON p.id=t.project_id
    LEFT JOIN customers c ON c.id=t.customer_id
    WHERE t.assigned_to=?
    ORDER BY
        FIELD(t.status,'in_progress','todo','waiting','completed','cancelled'),
        t.due_date IS NULL,
        t.due_date
");
$s->execute([$staff['id']]);
$rows=$s->fetchAll();

$pageTitle='My Tasks';
$taskManagementAssets=true;
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content task-stage2 task-stage3">
    <div class="page-head">
        <div>
            <p class="eyebrow">Work</p>
            <h1>My tasks</h1>
            <p class="muted">
                Open a task to work through its checklist, post progress,
                upload files and record completion.
            </p>
        </div>

        <a
            class="btn"
            href="<?= h(ideare_root_url('staff/pages/calendar.php')) ?>"
        >
            Calendar
        </a>
    </div>

    <div class="task-grid">
        <?php foreach($rows as $row): ?>
            <?php
            $overdue=
                !empty($row['due_date'])
                && !in_array($row['status'],['completed','cancelled'],true)
                && strtotime($row['due_date'])<time();
            ?>

            <article class="staff-panel task-card">
                <div class="rowtop">
                    <span class="pill <?= h($row['priority']) ?>">
                        <?= h(task_priorities()[$row['priority']]??$row['priority']) ?>
                    </span>

                    <span class="pill <?= h($row['status']) ?>">
                        <?= h(task_statuses()[$row['status']]??$row['status']) ?>
                    </span>
                </div>

                <h2 class="task-card-title">
                    <a href="<?= h(
                        ideare_root_url(
                            'staff/pages/task-view.php?id='.$row['id']
                        )
                    ) ?>">
                        <?= h($row['title']) ?>
                    </a>
                </h2>

                <?php if($row['project_id']): ?>
                    <p class="tiny">
                        <a href="<?= h(
                            ideare_root_url(
                                'staff/pages/project-view.php?id='.$row['project_id']
                            )
                        ) ?>">
                            <?= h($row['project_code'].' · '.$row['project_name']) ?>
                        </a>

                        <?php if($row['customer_name']): ?>
                            · <?= h($row['customer_name']) ?>
                        <?php endif; ?>
                    </p>
                <?php endif; ?>

                <p><?= h($row['description']?:'') ?></p>

                <div class="task-card-progress">
                    <div>
                        <span>Progress</span>
                        <strong><?= (int)$row['progress_percent'] ?>%</strong>
                    </div>

                    <div
                        class="task-mini-progress"
                        role="progressbar"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="<?= (int)$row['progress_percent'] ?>"
                    >
                        <span style="width:<?= (int)$row['progress_percent'] ?>%"></span>
                    </div>

                    <?php if((int)$row['checklist_total']>0): ?>
                        <small>
                            Checklist:
                            <?= (int)$row['checklist_done'] ?>/<?= (int)$row['checklist_total'] ?>
                        </small>
                    <?php endif; ?>
                </div>

                <small class="<?= $overdue?'deadline-overdue':'' ?>">
                    <?= $row['due_date']
                        ?h(date(
                            'j M Y, g:i A',
                            strtotime($row['due_date'])
                        ))
                        :'No due date' ?>
                    <?= $overdue?' · Overdue':'' ?>
                </small>

                <?php if(!in_array($row['status'],['completed','cancelled'],true)): ?>
                    <form
                        method="post"
                        class="inline-form"
                        style="margin-top:14px"
                    >
                        <?= csrf_field() ?>
                        <input
                            type="hidden"
                            name="task_id"
                            value="<?= (int)$row['id'] ?>"
                        >

                        <select name="status">
                            <?php foreach([
                                'todo'=>'To do',
                                'in_progress'=>'In progress',
                                'waiting'=>'Waiting'
                            ] as $key=>$label): ?>
                                <option
                                    value="<?= h($key) ?>"
                                    <?= $row['status']===$key?'selected':'' ?>
                                >
                                    <?= h($label) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>

                        <button class="btn" type="submit">
                            Update status
                        </button>
                    </form>
                <?php endif; ?>

                <a
                    class="btn primary task-view-link"
                    href="<?= h(
                        ideare_root_url(
                            'staff/pages/task-view.php?id='.$row['id']
                        )
                    ) ?>"
                >
                    Open task workspace
                </a>
            </article>
        <?php endforeach; ?>

        <?php if(!$rows): ?>
            <section class="staff-panel empty-state">
                No tasks assigned.
            </section>
        <?php endif; ?>
    </div>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
