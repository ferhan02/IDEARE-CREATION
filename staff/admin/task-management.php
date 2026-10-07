<?php
require_once __DIR__.'/../../includes/staff/operations.php';

require_task_manager_access();
verify_csrf();

$pdo=staff_db();
$me=current_staff();

$selectedProjectId=(int)($_GET['project_id']??0);

if($_SERVER['REQUEST_METHOD']==='POST'){
    $title=trim($_POST['title']??'');
    $projectId=(int)($_POST['project_id']??0);
    $assignedTo=(int)($_POST['assigned_to']??0);
    $priority=$_POST['priority']??'normal';
    $rawDue=trim($_POST['due_date']??'');
    $description=trim($_POST['description']??'');

    if($title===''){
        flash('error','Task title is required.');
        staff_redirect(
            'staff/admin/task-management.php'
            .($projectId?'?project_id='.$projectId:'')
        );
    }

    if(strlen($title)>200){
        flash('error','Task title must be 200 characters or fewer.');
        staff_redirect(
            'staff/admin/task-management.php'
            .($projectId?'?project_id='.$projectId:'')
        );
    }

    if(!array_key_exists($priority,task_priorities())){
        $priority='normal';
    }

    $staffCheck=$pdo->prepare("
        SELECT id,first_name,last_name
        FROM staff
        WHERE id=? AND is_active=1
        LIMIT 1
    ");
    $staffCheck->execute([$assignedTo]);
    $assignee=$staffCheck->fetch();

    if(!$assignee){
        flash('error','Choose an active employee to assign the task to.');
        staff_redirect(
            'staff/admin/task-management.php'
            .($projectId?'?project_id='.$projectId:'')
        );
    }

    $customerId=null;
    $project=null;

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
              AND p.status NOT IN('completed','cancelled')
            LIMIT 1
        ");
        $projectCheck->execute([$projectId]);
        $project=$projectCheck->fetch();

        if(!$project){
            flash('error','That project is unavailable or already closed.');
            staff_redirect('staff/admin/task-management.php');
        }

        $customerId=(int)$project['customer_id'];
    }

    $due=null;

    if($rawDue!==''){
        $timestamp=strtotime(str_replace('T',' ',$rawDue));

        if($timestamp===false){
            flash('error','The task deadline is invalid.');
            staff_redirect(
                'staff/admin/task-management.php'
                .($projectId?'?project_id='.$projectId:'')
            );
        }

        $due=date('Y-m-d H:i:s',$timestamp);
    }

    $assigneeName=trim(
        ($assignee['first_name']??'').' '.($assignee['last_name']??'')
    );

    try{
        $pdo->beginTransaction();

        $insert=$pdo->prepare("
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
                deadline
            )
            VALUES(?,?,?,?,?,?,?,'todo',?,?)
        ");

        $insert->execute([
            $title,
            $description!==''?$description:null,
            $projectId?:null,
            $customerId,
            $assignedTo,
            $me['id'],
            $priority,
            $due,
            $due
        ]);

        $taskId=(int)$pdo->lastInsertId();

        task_record_assignment(
            $pdo,
            $taskId,
            $assignedTo,
            (int)$me['id']
        );

        task_activity(
            $pdo,
            $taskId,
            'created',
            'Task created and assigned to '.$assigneeName.'.'
        );

        notify_staff(
            $pdo,
            $assignedTo,
            'New task assigned',
            $title,
            'task',
            'task',
            $taskId
        );

        if($projectId){
            project_activity(
                $pdo,
                $projectId,
                'task_created',
                'Task assigned',
                $title.' → '.$assigneeName
            );
        }

        $pdo->commit();

        log_activity(
            'task.created',
            'task',
            (string)$taskId,
            'Task "'.$title.'" assigned to '.$assigneeName
        );

        flash('success','Task assigned to '.$assigneeName.'.');

        staff_redirect('staff/pages/task-view.php?id='.$taskId);
    }catch(Throwable $e){
        if($pdo->inTransaction()){
            $pdo->rollBack();
        }

        error_log('Task creation failed: '.$e->getMessage());

        flash(
            'error',
            'The task could not be created. If you have not run the Stage 2 SQL yet, apply it first.'
        );

        staff_redirect(
            'staff/admin/task-management.php'
            .($projectId?'?project_id='.$projectId:'')
        );
    }
}

$staffRows=$pdo->query("
    SELECT id,first_name,last_name,job_title
    FROM staff
    WHERE is_active=1
    ORDER BY first_name,last_name
")->fetchAll();

$projects=db_table_exists($pdo,'projects')
    ? $pdo->query("
        SELECT
            p.id,
            p.project_code,
            p.name,
            c.name customer_name
        FROM projects p
        JOIN customers c ON c.id=p.customer_id
        WHERE p.status NOT IN('completed','cancelled')
        ORDER BY p.updated_at DESC
    ")->fetchAll()
    : [];

$validProjectIds=array_map(
    static fn(array $project): int => (int)$project['id'],
    $projects
);

if(
    $selectedProjectId
    && !in_array($selectedProjectId,$validProjectIds,true)
){
    $selectedProjectId=0;
}

$rows=$pdo->query("
    SELECT
        t.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) staff_name,
        CONCAT(a.first_name,' ',COALESCE(a.last_name,'')) assigned_by_name,
        p.project_code,
        p.name project_name,
        c.name customer_name
    FROM tasks t
    LEFT JOIN staff s ON s.id=t.assigned_to
    LEFT JOIN staff a ON a.id=t.assigned_by
    LEFT JOIN projects p ON p.id=t.project_id
    LEFT JOIN customers c ON c.id=t.customer_id
    ORDER BY
        FIELD(t.status,'in_progress','todo','waiting','completed','cancelled'),
        t.due_date IS NULL,
        t.due_date,
        t.created_at DESC
")->fetchAll();

$pageTitle='Task Management';
$taskManagementAssets=true;
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content task-stage2 task-management-page">
    <div class="page-head">
        <div>
            <p class="eyebrow">Management</p>
            <h1>Task management</h1>
            <p class="muted">
                Assign work, open a task to edit or reassign it, and keep a
                complete task lifecycle history.
            </p>
        </div>

        <div class="actions">
            <a class="btn" href="<?= h(ideare_root_url('staff/pages/calendar.php')) ?>">
                Calendar
            </a>
            <a class="btn" href="<?= h(ideare_root_url('staff/pages/projects.php')) ?>">
                Projects
            </a>
        </div>
    </div>

    <div class="task-management-stack">
        <section class="staff-panel task-assignment-panel">
            <div class="section-title">
                <div>
                    <p class="eyebrow">Create</p>
                    <h2>Assign task</h2>
                </div>
                <span class="pill approved">Management only</span>
            </div>

            <form method="post" class="task-assignment-form">
                <?= csrf_field() ?>

                <label>
                    Title
                    <input
                        name="title"
                        required
                        maxlength="200"
                        placeholder="e.g. Complete site measurement"
                    >
                </label>

                <label>
                    Project
                    <select name="project_id">
                        <option value="">General / no project</option>

                        <?php foreach($projects as $project): ?>
                            <option
                                value="<?= (int)$project['id'] ?>"
                                <?= $selectedProjectId===(int)$project['id']?'selected':'' ?>
                            >
                                <?= h(
                                    $project['project_code']
                                    .' · '.$project['customer_name']
                                    .' · '.$project['name']
                                ) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </label>

                <label>
                    Assign to
                    <select name="assigned_to" required>
                        <option value="">Choose employee...</option>

                        <?php foreach($staffRows as $staffRow): ?>
                            <option value="<?= (int)$staffRow['id'] ?>">
                                <?= h(
                                    trim(
                                        $staffRow['first_name']
                                        .' '.($staffRow['last_name']??'')
                                    )
                                    .($staffRow['job_title']
                                        ? ' · '.$staffRow['job_title']
                                        : '')
                                ) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </label>

                <div class="two">
                    <label>
                        Priority
                        <select name="priority">
                            <?php foreach(task_priorities() as $key=>$label): ?>
                                <option value="<?= h($key) ?>" <?= $key==='normal'?'selected':'' ?>>
                                    <?= h($label) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>

                    <label>
                        Deadline
                        <input type="datetime-local" name="due_date">
                    </label>
                </div>

                <label>
                    Description
                    <textarea
                        name="description"
                        rows="5"
                        placeholder="Add instructions, requirements or useful context for the employee."
                    ></textarea>
                </label>

                <button class="btn primary" type="submit">
                    Assign task
                </button>
            </form>
        </section>

        <section class="staff-panel task-overview-panel">
            <div class="section-title">
                <div>
                    <p class="eyebrow">Overview</p>
                    <h2>All tasks</h2>
                </div>
                <span class="muted"><?= count($rows) ?> total</span>
            </div>

            <table class="task-overview-table">
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Project</th>
                        <th>Assigned to</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    <?php foreach($rows as $row): ?>
                        <?php
                        $overdue=
                            !empty($row['due_date'])
                            && !in_array($row['status'],['completed','cancelled'],true)
                            && strtotime($row['due_date'])<time();
                        ?>
                        <tr>
                            <td>
                                <a
                                    class="task-title-link"
                                    href="<?= h(
                                        ideare_root_url(
                                            'staff/pages/task-view.php?id='.$row['id']
                                        )
                                    ) ?>"
                                >
                                    <b><?= h($row['title']) ?></b>
                                </a>
                                <small>
                                    <?= h(task_priorities()[$row['priority']]??$row['priority']) ?>
                                    <?php if($row['assigned_by_name']): ?>
                                        · by <?= h(trim($row['assigned_by_name'])) ?>
                                    <?php endif; ?>
                                </small>
                            </td>

                            <td>
                                <?php if($row['project_id']): ?>
                                    <a href="<?= h(
                                        ideare_root_url(
                                            'staff/pages/project-view.php?id='
                                            .$row['project_id']
                                        )
                                    ) ?>">
                                        <?= h($row['project_code']) ?>
                                    </a>
                                    <small>
                                        <?= h(
                                            $row['customer_name']
                                            .' · '.$row['project_name']
                                        ) ?>
                                    </small>
                                <?php else: ?>
                                    <span class="muted">General</span>
                                <?php endif; ?>
                            </td>

                            <td><?= h($row['staff_name']?:'—') ?></td>

                            <td class="<?= $overdue?'deadline-overdue':'' ?>">
                                <?php if($row['due_date']): ?>
                                    <?= h(date(
                                        'j M Y, g:i A',
                                        strtotime($row['due_date'])
                                    )) ?>
                                    <?php if($overdue): ?>
                                        <small>Overdue</small>
                                    <?php endif; ?>
                                <?php else: ?>
                                    —
                                <?php endif; ?>
                            </td>

                            <td>
                                <span class="pill <?= h($row['status']) ?>">
                                    <?= h(task_statuses()[$row['status']]??$row['status']) ?>
                                </span>
                            </td>

                            <td class="task-actions-cell">
                                <a
                                    class="btn"
                                    href="<?= h(
                                        ideare_root_url(
                                            'staff/pages/task-view.php?id='.$row['id']
                                        )
                                    ) ?>"
                                >
                                    View
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                    <?php if(!$rows): ?>
                        <tr>
                            <td colspan="6" class="empty-state">
                                No tasks have been created yet.
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </section>
    </div>
</main>
<?php require __DIR__.'/../../includes/staff/footer.php'; ?>
