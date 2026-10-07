<?php
require_once __DIR__.'/../../includes/staff/operations.php';

require_login();
verify_csrf();

$pdo=staff_db();
$me=current_staff();
$id=(int)($_GET['id']??0);

function stage2_load_task(PDO $pdo,int $id): ?array
{
    $q=$pdo->prepare("
        SELECT
            t.*,
            CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) assignee_name,
            s.job_title assignee_job_title,
            CONCAT(a.first_name,' ',COALESCE(a.last_name,'')) assigned_by_name,
            p.project_code,
            p.name project_name,
            p.status project_status,
            c.name customer_name,
            c.id customer_id_join
        FROM tasks t
        LEFT JOIN staff s ON s.id=t.assigned_to
        LEFT JOIN staff a ON a.id=t.assigned_by
        LEFT JOIN projects p ON p.id=t.project_id
        LEFT JOIN customers c ON c.id=t.customer_id
        WHERE t.id=?
        LIMIT 1
    ");
    $q->execute([$id]);
    return $q->fetch()?:null;
}

function stage2_due_value(?string $value): string
{
    if(!$value) return 'No deadline';
    return date('j M Y, g:i A',strtotime($value));
}

function stage2_activity_label(string $action): string
{
    $labels=[
        'created'=>'Task created',
        'title_updated'=>'Title updated',
        'description_updated'=>'Description updated',
        'project_changed'=>'Project changed',
        'reassigned'=>'Task reassigned',
        'priority_changed'=>'Priority changed',
        'status_changed'=>'Status changed',
        'deadline_changed'=>'Deadline changed',
        'cancelled'=>'Task cancelled',
        'duplicated'=>'Task duplicated',
    ];

    return $labels[$action]??ucwords(str_replace('_',' ',$action));
}

$task=stage2_load_task($pdo,$id);

if(!$task){
    http_response_code(404);
    $pageTitle='Task not found';
    $taskManagementAssets=true;
    require __DIR__.'/../../includes/staff/header.php';
    ?>
    <main class="staff-content task-stage2">
        <section class="staff-panel">
            <p class="eyebrow">404</p>
            <h1>Task not found</h1>
            <p class="muted">This task does not exist or has been removed.</p>
            <a class="btn" href="<?= h(ideare_root_url('staff/pages/tasks.php')) ?>">Back to tasks</a>
        </section>
    </main>
    <?php
    require __DIR__.'/../../includes/staff/footer.php';
    exit;
}

$isManager=can_manage_tasks();
$isAssignee=(int)($task['assigned_to']??0)===(int)$me['id'];

if(!$isManager&&!$isAssignee){
    render_access_denied(
        'Task access restricted',
        'You can only open tasks assigned to you unless you have Task Management access.'
    );
}

if($_SERVER['REQUEST_METHOD']==='POST'){
    if(!$isManager){
        render_access_denied(
            'Task editing restricted',
            'Only authorised Task Management users can edit, reassign, duplicate or cancel tasks.'
        );
    }

    $action=$_POST['action']??'update';

    if($action==='update'){
        $title=trim($_POST['title']??'');
        $description=trim($_POST['description']??'');
        $projectId=(int)($_POST['project_id']??0);
        $assignedTo=(int)($_POST['assigned_to']??0);
        $priority=$_POST['priority']??'normal';
        $status=$_POST['status']??'todo';
        $rawDue=trim($_POST['due_date']??'');

        if($title===''){
            flash('error','Task title is required.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        if(strlen($title)>200){
            flash('error','Task title must be 200 characters or fewer.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        if(!array_key_exists($priority,task_priorities())){
            flash('error','Choose a valid priority.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        if(!array_key_exists($status,task_statuses())){
            flash('error','Choose a valid task status.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $staffCheck=$pdo->prepare("
            SELECT id,first_name,last_name,job_title
            FROM staff
            WHERE id=? AND is_active=1
            LIMIT 1
        ");
        $staffCheck->execute([$assignedTo]);
        $newAssignee=$staffCheck->fetch();

        if(!$newAssignee){
            flash('error','Choose an active employee.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $project=null;
        $customerId=null;

        if($projectId){
            $projectCheck=$pdo->prepare("
                SELECT
                    p.id,
                    p.customer_id,
                    p.project_code,
                    p.name,
                    p.status,
                    c.name customer_name
                FROM projects p
                JOIN customers c ON c.id=p.customer_id
                WHERE p.id=?
                LIMIT 1
            ");
            $projectCheck->execute([$projectId]);
            $project=$projectCheck->fetch();

            if(!$project){
                flash('error','Choose a valid project.');
                staff_redirect('staff/pages/task-view.php?id='.$id);
            }

            if(
                (int)$task['project_id']!==$projectId
                && in_array($project['status'],['completed','cancelled'],true)
            ){
                flash('error','New tasks cannot be moved into a completed or cancelled project.');
                staff_redirect('staff/pages/task-view.php?id='.$id);
            }

            $customerId=(int)$project['customer_id'];
        }

        $due=null;

        if($rawDue!==''){
            $timestamp=strtotime(str_replace('T',' ',$rawDue));

            if($timestamp===false){
                flash('error','The task deadline is invalid.');
                staff_redirect('staff/pages/task-view.php?id='.$id);
            }

            $due=date('Y-m-d H:i:s',$timestamp);
        }

        $newAssigneeName=trim(
            ($newAssignee['first_name']??'').' '.($newAssignee['last_name']??'')
        );

        $oldProjectId=(int)($task['project_id']??0);
        $oldProjectLabel=$task['project_code']
            ?$task['project_code'].' · '.$task['project_name']
            :'General / no project';

        $newProjectLabel=$project
            ?$project['project_code'].' · '.$project['name']
            :'General / no project';

        $changes=[];

        if($title!==$task['title']){
            $changes[]=[
                'action'=>'title_updated',
                'details'=>'"'.$task['title'].'" → "'.$title.'"'
            ];
        }

        $oldDescription=trim((string)($task['description']??''));
        if($description!==$oldDescription){
            $changes[]=[
                'action'=>'description_updated',
                'details'=>'Task instructions were updated.'
            ];
        }

        if($projectId!==$oldProjectId){
            $changes[]=[
                'action'=>'project_changed',
                'details'=>$oldProjectLabel.' → '.$newProjectLabel
            ];
        }

        if($assignedTo!==(int)($task['assigned_to']??0)){
            $changes[]=[
                'action'=>'reassigned',
                'details'=>($task['assignee_name']?:'Unassigned').' → '.$newAssigneeName
            ];
        }

        if($priority!==$task['priority']){
            $changes[]=[
                'action'=>'priority_changed',
                'details'=>(task_priorities()[$task['priority']]??$task['priority'])
                    .' → '.(task_priorities()[$priority]??$priority)
            ];
        }

        if($status!==$task['status']){
            $changes[]=[
                'action'=>'status_changed',
                'details'=>(task_statuses()[$task['status']]??$task['status'])
                    .' → '.(task_statuses()[$status]??$status)
            ];
        }

        if(($task['due_date']??null)!==$due){
            $changes[]=[
                'action'=>'deadline_changed',
                'details'=>stage2_due_value($task['due_date']??null)
                    .' → '.stage2_due_value($due)
            ];
        }

        if(!$changes){
            flash('info','No task changes were detected.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        try{
            $pdo->beginTransaction();

            $update=$pdo->prepare("
                UPDATE tasks
                SET
                    title=?,
                    description=?,
                    project_id=?,
                    customer_id=?,
                    assigned_to=?,
                    priority=?,
                    status=?,
                    due_date=?,
                    deadline=?,
                    completed_at=
                        CASE
                            WHEN ?='completed'
                            THEN COALESCE(completed_at,NOW())
                            ELSE NULL
                        END
                WHERE id=?
            ");

            $update->execute([
                $title,
                $description!==''?$description:null,
                $projectId?:null,
                $customerId,
                $assignedTo,
                $priority,
                $status,
                $due,
                $due,
                $status,
                $id
            ]);

            foreach($changes as $change){
                task_activity(
                    $pdo,
                    $id,
                    $change['action'],
                    $change['details']
                );
            }

            $assigneeChanged=$assignedTo!==(int)($task['assigned_to']??0);

            if($assigneeChanged){
                task_record_assignment(
                    $pdo,
                    $id,
                    $assignedTo,
                    (int)$me['id']
                );

                notify_staff(
                    $pdo,
                    $assignedTo,
                    'Task assigned to you',
                    $title,
                    'task',
                    'task',
                    $id
                );
            }else{
                $importantActions=array_column($changes,'action');

                if(
                    array_intersect(
                        $importantActions,
                        ['priority_changed','status_changed','deadline_changed','description_updated','project_changed']
                    )
                ){
                    notify_staff(
                        $pdo,
                        $assignedTo,
                        'Task updated',
                        $title,
                        'task',
                        'task',
                        $id
                    );
                }
            }

            $summary=implode(
                '; ',
                array_map(
                    static fn(array $change): string => $change['details'],
                    $changes
                )
            );

            if($oldProjectId&&$oldProjectId!==$projectId){
                project_activity(
                    $pdo,
                    $oldProjectId,
                    'task_updated',
                    'Task moved to another project',
                    $task['title'].' · '.$oldProjectLabel.' → '.$newProjectLabel
                );
            }

            if($projectId){
                project_activity(
                    $pdo,
                    $projectId,
                    'task_updated',
                    'Task updated',
                    $title.' · '.$summary
                );
            }

            $pdo->commit();

            log_activity(
                'task.updated',
                'task',
                (string)$id,
                $title.' · '.$summary
            );

            flash('success','Task updated.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }catch(Throwable $e){
            if($pdo->inTransaction()){
                $pdo->rollBack();
            }

            error_log('Task update failed: '.$e->getMessage());
            flash('error','The task could not be updated.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }
    }

    if($action==='cancel'){
        if($task['status']==='cancelled'){
            flash('info','This task is already cancelled.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        try{
            $pdo->beginTransaction();

            $pdo->prepare("
                UPDATE tasks
                SET status='cancelled',
                    completed_at=NULL
                WHERE id=?
            ")->execute([$id]);

            task_activity(
                $pdo,
                $id,
                'cancelled',
                'Task cancelled by '.trim(
                    ($me['first_name']??'').' '.($me['last_name']??'')
                ).'.'
            );

            if($task['project_id']){
                project_activity(
                    $pdo,
                    (int)$task['project_id'],
                    'task_cancelled',
                    'Task cancelled',
                    $task['title']
                );
            }

            notify_staff(
                $pdo,
                (int)($task['assigned_to']??0),
                'Task cancelled',
                $task['title'],
                'task',
                'task',
                $id
            );

            $pdo->commit();

            log_activity(
                'task.cancelled',
                'task',
                (string)$id,
                'Cancelled task "'.$task['title'].'"'
            );

            flash('success','Task cancelled.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }catch(Throwable $e){
            if($pdo->inTransaction()){
                $pdo->rollBack();
            }

            error_log('Task cancellation failed: '.$e->getMessage());
            flash('error','The task could not be cancelled.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }
    }

    if($action==='duplicate'){
        $copyTitle='Copy of '.$task['title'];

        if(strlen($copyTitle)>200){
            $copyTitle=substr($copyTitle,0,200);
        }

        try{
            $pdo->beginTransaction();

            $copy=$pdo->prepare("
                INSERT INTO tasks
                (
                    title,
                    description,
                    project_id,
                    customer_id,
                    assigned_to,
                    assigned_by,
                    priority,
                    status,
                    due_date,
                    completed_at,
                    start_date,
                    deadline
                )
                VALUES(?,?,?,?,?,? ,?,'todo',NULL,NULL,NULL,NULL)
            ");

            $copy->execute([
                $copyTitle,
                $task['description'],
                $task['project_id'],
                $task['customer_id'],
                $task['assigned_to'],
                $me['id'],
                $task['priority']
            ]);

            $newTaskId=(int)$pdo->lastInsertId();

            if($task['assigned_to']){
                task_record_assignment(
                    $pdo,
                    $newTaskId,
                    (int)$task['assigned_to'],
                    (int)$me['id']
                );
            }

            task_activity(
                $pdo,
                $newTaskId,
                'duplicated',
                'Created from task #'.$id.'.'
            );

            notify_staff(
                $pdo,
                (int)($task['assigned_to']??0),
                'New task assigned',
                $copyTitle,
                'task',
                'task',
                $newTaskId
            );

            if($task['project_id']){
                project_activity(
                    $pdo,
                    (int)$task['project_id'],
                    'task_created',
                    'Task duplicated',
                    $copyTitle
                );
            }

            $pdo->commit();

            log_activity(
                'task.duplicated',
                'task',
                (string)$newTaskId,
                'Duplicated from task #'.$id
            );

            flash(
                'success',
                'Task duplicated. The new copy has no deadline so you can set a fresh one.'
            );

            staff_redirect('staff/pages/task-view.php?id='.$newTaskId);
        }catch(Throwable $e){
            if($pdo->inTransaction()){
                $pdo->rollBack();
            }

            error_log('Task duplication failed: '.$e->getMessage());
            flash('error','The task could not be duplicated.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }
    }
}

$task=stage2_load_task($pdo,$id);

$staffRows=[];
$projects=[];

if($isManager){
    $staffRows=$pdo->query("
        SELECT id,first_name,last_name,job_title
        FROM staff
        WHERE is_active=1
        ORDER BY first_name,last_name
    ")->fetchAll();

    $projectQuery=$pdo->prepare("
        SELECT
            p.id,
            p.project_code,
            p.name,
            p.status,
            c.name customer_name
        FROM projects p
        JOIN customers c ON c.id=p.customer_id
        WHERE p.status NOT IN('completed','cancelled')
           OR p.id=?
        ORDER BY p.updated_at DESC
    ");
    $projectQuery->execute([(int)($task['project_id']??0)]);
    $projects=$projectQuery->fetchAll();
}

$historyQuery=$pdo->prepare("
    SELECT
        a.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) staff_name
    FROM task_activity a
    LEFT JOIN staff s ON s.id=a.staff_id
    WHERE a.task_id=?
    ORDER BY a.created_at DESC,a.id DESC
");
$historyQuery->execute([$id]);
$history=$historyQuery->fetchAll();

$assignmentQuery=$pdo->prepare("
    SELECT
        x.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) staff_name,
        CONCAT(a.first_name,' ',COALESCE(a.last_name,'')) assigned_by_name
    FROM task_assignments x
    JOIN staff s ON s.id=x.staff_id
    LEFT JOIN staff a ON a.id=x.assigned_by
    WHERE x.task_id=?
    ORDER BY x.assigned_at DESC,x.id DESC
");
$assignmentQuery->execute([$id]);
$assignments=$assignmentQuery->fetchAll();

$overdue=
    !empty($task['due_date'])
    && !in_array($task['status'],['completed','cancelled'],true)
    && strtotime($task['due_date'])<time();

$pageTitle=$task['title'];
$taskManagementAssets=true;
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content task-stage2">
    <div class="page-head">
        <div>
            <p class="eyebrow">
                <?= $task['project_code']
                    ?h($task['project_code'])
                    :'General task' ?>
            </p>

            <h1><?= h($task['title']) ?></h1>

            <div class="task-header-badges">
                <span class="pill <?= h($task['priority']) ?>">
                    <?= h(task_priorities()[$task['priority']]??$task['priority']) ?>
                </span>

                <span class="pill <?= h($task['status']) ?>">
                    <?= h(task_statuses()[$task['status']]??$task['status']) ?>
                </span>

                <?php if($overdue): ?>
                    <span class="pill rejected">Overdue</span>
                <?php endif; ?>
            </div>
        </div>

        <div class="actions">
            <?php if($isManager): ?>
                <a
                    class="btn"
                    href="<?= h(ideare_root_url('staff/admin/task-management.php')) ?>"
                >
                    Task management
                </a>
            <?php else: ?>
                <a
                    class="btn"
                    href="<?= h(ideare_root_url('staff/pages/tasks.php')) ?>"
                >
                    My tasks
                </a>
            <?php endif; ?>

            <?php if($task['project_id']): ?>
                <a
                    class="btn"
                    href="<?= h(
                        ideare_root_url(
                            'staff/pages/project-view.php?id='.$task['project_id']
                        )
                    ) ?>"
                >
                    Open project
                </a>
            <?php endif; ?>
        </div>
    </div>

    <div class="task-detail-grid">
        <div>
            <?php if($isManager): ?>
                <section class="staff-panel">
                    <div class="section-title">
                        <div>
                            <p class="eyebrow">Lifecycle</p>
                            <h2>Edit task</h2>
                            <p class="muted">
                                Changes are recorded in the task history automatically.
                            </p>
                        </div>
                    </div>

                    <form method="post" class="task-edit-form">
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="update">

                        <label>
                            Title
                            <input
                                name="title"
                                required
                                maxlength="200"
                                value="<?= h($task['title']) ?>"
                            >
                        </label>

                        <label>
                            Description
                            <textarea
                                name="description"
                                rows="6"
                                placeholder="Instructions and context for the employee."
                            ><?= h($task['description']??'') ?></textarea>
                        </label>

                        <div class="two">
                            <label>
                                Project
                                <select name="project_id">
                                    <option value="">General / no project</option>

                                    <?php foreach($projects as $project): ?>
                                        <option
                                            value="<?= (int)$project['id'] ?>"
                                            <?= (int)$task['project_id']===(int)$project['id']?'selected':'' ?>
                                        >
                                            <?= h(
                                                $project['project_code']
                                                .' · '.$project['customer_name']
                                                .' · '.$project['name']
                                                .(in_array(
                                                    $project['status'],
                                                    ['completed','cancelled'],
                                                    true
                                                )?' · '.ucfirst($project['status']):'')
                                            ) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </label>

                            <label>
                                Assigned to
                                <select name="assigned_to" required>
                                    <?php foreach($staffRows as $staffRow): ?>
                                        <option
                                            value="<?= (int)$staffRow['id'] ?>"
                                            <?= (int)$task['assigned_to']===(int)$staffRow['id']?'selected':'' ?>
                                        >
                                            <?= h(
                                                trim(
                                                    $staffRow['first_name']
                                                    .' '.($staffRow['last_name']??'')
                                                )
                                                .($staffRow['job_title']
                                                    ?' · '.$staffRow['job_title']
                                                    :'')
                                            ) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </label>

                            <label>
                                Priority
                                <select name="priority">
                                    <?php foreach(task_priorities() as $key=>$label): ?>
                                        <option
                                            value="<?= h($key) ?>"
                                            <?= $task['priority']===$key?'selected':'' ?>
                                        >
                                            <?= h($label) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </label>

                            <label>
                                Status
                                <select name="status">
                                    <?php foreach(task_statuses() as $key=>$label): ?>
                                        <option
                                            value="<?= h($key) ?>"
                                            <?= $task['status']===$key?'selected':'' ?>
                                        >
                                            <?= h($label) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </label>
                        </div>

                        <label>
                            Deadline
                            <input
                                type="datetime-local"
                                name="due_date"
                                value="<?= $task['due_date']
                                    ?h(date(
                                        'Y-m-d\TH:i',
                                        strtotime($task['due_date'])
                                    ))
                                    :'' ?>"
                            >
                        </label>

                        <div class="task-edit-actions">
                            <button class="btn primary" type="submit">
                                Save changes
                            </button>
                        </div>
                    </form>
                </section>

                <section class="staff-panel task-danger-zone">
                    <p class="eyebrow">Task actions</p>
                    <h2>Duplicate or cancel</h2>
                    <p class="muted">
                        Duplicating keeps the task details, project, assignee and
                        priority, but creates the copy as To Do with no deadline.
                    </p>

                    <div class="task-edit-actions">
                        <form
                            method="post"
                            data-task-confirm
                            data-confirm-title="Duplicate this task?"
                            data-confirm-text="A new To Do task will be created without a deadline."
                            data-confirm-button="Duplicate task"
                        >
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="duplicate">
                            <button class="btn" type="submit">
                                Duplicate task
                            </button>
                        </form>

                        <form
                            method="post"
                            data-task-confirm
                            data-confirm-title="Cancel this task?"
                            data-confirm-text="The task will remain in history but will no longer be active."
                            data-confirm-button="Cancel task"
                            data-confirm-danger="1"
                        >
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="cancel">
                            <button
                                class="btn danger"
                                type="submit"
                                <?= $task['status']==='cancelled'?'disabled':'' ?>
                            >
                                <?= $task['status']==='cancelled'
                                    ?'Task cancelled'
                                    :'Cancel task' ?>
                            </button>
                        </form>
                    </div>
                </section>
            <?php else: ?>
                <section class="staff-panel">
                    <p class="eyebrow">Task details</p>
                    <h2><?= h($task['title']) ?></h2>

                    <div class="read-only-description">
                        <?= h($task['description']?:'No additional instructions.') ?>
                    </div>
                </section>
            <?php endif; ?>

            <section class="staff-panel">
                <div class="section-title">
                    <div>
                        <p class="eyebrow">Audit trail</p>
                        <h2>Task history</h2>
                    </div>
                    <span class="muted"><?= count($history) ?> events</span>
                </div>

                <div class="task-history">
                    <?php foreach($history as $event): ?>
                        <div class="task-history-item">
                            <span class="task-history-marker"></span>

                            <div class="task-history-copy">
                                <b><?= h(stage2_activity_label($event['action'])) ?></b>

                                <?php if($event['details']): ?>
                                    <p><?= h($event['details']) ?></p>
                                <?php endif; ?>

                                <small>
                                    <?= h(date(
                                        'j M Y, g:i A',
                                        strtotime($event['created_at'])
                                    )) ?>
                                    · <?= h($event['staff_name']?:'System') ?>
                                </small>
                            </div>
                        </div>
                    <?php endforeach; ?>

                    <?php if(!$history): ?>
                        <p class="muted">
                            No lifecycle events have been recorded for this task yet.
                        </p>
                    <?php endif; ?>
                </div>
            </section>
        </div>

        <aside class="task-detail-side">
            <section class="staff-panel">
                <p class="eyebrow">Summary</p>
                <h2>Task information</h2>

                <div class="task-summary-list">
                    <div class="task-summary-item">
                        <span>Assigned to</span>
                        <strong>
                            <?= h($task['assignee_name']?:'Unassigned') ?>
                            <?= $task['assignee_job_title']
                                ?' · '.h($task['assignee_job_title'])
                                :'' ?>
                        </strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Assigned by</span>
                        <strong><?= h($task['assigned_by_name']?:'—') ?></strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Project</span>
                        <strong>
                            <?= $task['project_code']
                                ?h($task['project_code'].' · '.$task['project_name'])
                                :'General / no project' ?>
                        </strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Customer</span>
                        <strong><?= h($task['customer_name']?:'—') ?></strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Deadline</span>
                        <strong class="<?= $overdue?'deadline-overdue':'' ?>">
                            <?= h(stage2_due_value($task['due_date']??null)) ?>
                        </strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Created</span>
                        <strong>
                            <?= h(date(
                                'j M Y, g:i A',
                                strtotime($task['created_at'])
                            )) ?>
                        </strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Last updated</span>
                        <strong>
                            <?= h(date(
                                'j M Y, g:i A',
                                strtotime($task['updated_at'])
                            )) ?>
                        </strong>
                    </div>

                    <?php if($task['completed_at']): ?>
                        <div class="task-summary-item">
                            <span>Completed</span>
                            <strong>
                                <?= h(date(
                                    'j M Y, g:i A',
                                    strtotime($task['completed_at'])
                                )) ?>
                            </strong>
                        </div>
                    <?php endif; ?>
                </div>
            </section>

            <section class="staff-panel">
                <div class="section-title">
                    <div>
                        <p class="eyebrow">Ownership</p>
                        <h2>Assignment history</h2>
                    </div>
                </div>

                <div class="assignment-history">
                    <?php foreach($assignments as $assignment): ?>
                        <div class="assignment-entry">
                            <b><?= h($assignment['staff_name']) ?></b>
                            <small>
                                Assigned
                                <?= h(date(
                                    'j M Y, g:i A',
                                    strtotime($assignment['assigned_at'])
                                )) ?>
                                <?php if($assignment['assigned_by_name']): ?>
                                    · by <?= h($assignment['assigned_by_name']) ?>
                                <?php endif; ?>
                            </small>
                        </div>
                    <?php endforeach; ?>

                    <?php if(!$assignments): ?>
                        <p class="muted">No assignment history yet.</p>
                    <?php endif; ?>
                </div>
            </section>
        </aside>
    </div>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
