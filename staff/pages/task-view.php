<?php
require_once __DIR__.'/../../includes/staff/operations.php';

require_login();
verify_csrf();

$pdo=staff_db();
$me=current_staff();
$id=(int)($_GET['id']??0);

function stage3_load_task(PDO $pdo,int $id): ?array
{
    $q=$pdo->prepare("
        SELECT
            t.*,
            CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) assignee_name,
            s.job_title assignee_job_title,
            CONCAT(a.first_name,' ',COALESCE(a.last_name,'')) assigned_by_name,
            CONCAT(cb.first_name,' ',COALESCE(cb.last_name,'')) completed_by_name,
            p.project_code,
            p.name project_name,
            p.status project_status,
            c.name customer_name,
            c.id customer_id_join
        FROM tasks t
        LEFT JOIN staff s ON s.id=t.assigned_to
        LEFT JOIN staff a ON a.id=t.assigned_by
        LEFT JOIN staff cb ON cb.id=t.completed_by
        LEFT JOIN projects p ON p.id=t.project_id
        LEFT JOIN customers c ON c.id=t.customer_id
        WHERE t.id=?
        LIMIT 1
    ");
    $q->execute([$id]);

    return $q->fetch()?:null;
}

function stage3_due_value(?string $value): string
{
    if(!$value) return 'No deadline';
    return date('j M Y, g:i A',strtotime($value));
}

function stage3_activity_label(string $action): string
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
        'progress_updated'=>'Progress updated',
        'comment_added'=>'Update posted',
        'checklist_added'=>'Checklist item added',
        'checklist_completed'=>'Checklist item completed',
        'checklist_reopened'=>'Checklist item reopened',
        'checklist_removed'=>'Checklist item removed',
        'attachment_added'=>'Attachment added',
        'attachment_removed'=>'Attachment removed',
        'completed'=>'Task completed',
        'cancelled'=>'Task cancelled',
        'duplicated'=>'Task duplicated',
    ];

    return $labels[$action]??ucwords(str_replace('_',' ',$action));
}

function stage3_notify_counterpart(
    PDO $pdo,
    array $task,
    array $actor,
    string $title,
    string $message,
    int $taskId
): void {
    $actorId=(int)$actor['id'];
    $assigneeId=(int)($task['assigned_to']??0);
    $assignedById=(int)($task['assigned_by']??0);

    if($actorId===$assigneeId){
        if($assignedById && $assignedById!==$actorId){
            notify_staff(
                $pdo,
                $assignedById,
                $title,
                $message,
                'task',
                'task',
                $taskId
            );
        }
        return;
    }

    if($assigneeId && $assigneeId!==$actorId){
        notify_staff(
            $pdo,
            $assigneeId,
            $title,
            $message,
            'task',
            'task',
            $taskId
        );
    }
}

$task=stage3_load_task($pdo,$id);

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
            <a class="btn" href="<?= h(ideare_root_url('staff/pages/tasks.php')) ?>">
                Back to tasks
            </a>
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
    $action=$_POST['action']??'';

    if($action==='update'){
        if(!$isManager){
            render_access_denied(
                'Task editing restricted',
                'Only authorised Task Management users can edit management fields.'
            );
        }

        $title=trim($_POST['title']??'');
        $description=trim($_POST['description']??'');
        $projectId=(int)($_POST['project_id']??0);
        $assignedTo=(int)($_POST['assigned_to']??0);
        $priority=$_POST['priority']??'normal';
        $status=$_POST['status']??'todo';
        $rawDue=trim($_POST['due_date']??'');
        $progress=(int)($_POST['progress_percent']??0);
        $completionNote=trim($_POST['completion_note']??'');

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

        if(
            !array_key_exists($status,task_statuses())
            || $status==='cancelled'
        ){
            flash('error','Use the Cancel task action to cancel a task.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $progress=max(0,min(100,$progress));

        if($status==='completed' && $completionNote===''){
            flash('error','Add a completion note before marking the task completed.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        if($status==='completed'){
            $progress=100;
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
                flash('error','A task cannot be moved into a completed or cancelled project.');
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

        if((int)($task['progress_percent']??0)!==$progress){
            $changes[]=[
                'action'=>'progress_updated',
                'details'=>(int)($task['progress_percent']??0).'% → '.$progress.'%'
            ];
        }

        if(($task['due_date']??null)!==$due){
            $changes[]=[
                'action'=>'deadline_changed',
                'details'=>stage3_due_value($task['due_date']??null)
                    .' → '.stage3_due_value($due)
            ];
        }

        $completionChanged=
            $status==='completed'
            && $completionNote!==trim((string)($task['completion_note']??''));

        if(!$changes&&!$completionChanged){
            flash('info','No task changes were detected.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        try{
            $pdo->beginTransaction();

            $completedAt=$status==='completed'
                ?($task['completed_at']?:date('Y-m-d H:i:s'))
                :null;

            $completedBy=$status==='completed'
                ?(int)$me['id']
                :null;

            $storedCompletionNote=$status==='completed'
                ?$completionNote
                :null;

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
                    progress_percent=?,
                    due_date=?,
                    deadline=?,
                    completed_at=?,
                    completion_note=?,
                    completed_by=?
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
                $progress,
                $due,
                $due,
                $completedAt,
                $storedCompletionNote,
                $completedBy,
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

            $becameCompleted=
                $status==='completed'
                && $task['status']!=='completed';

            if($becameCompleted||$completionChanged){
                $comment=$pdo->prepare("
                    INSERT INTO task_comments
                    (task_id,staff_id,comment,comment_type,progress_percent)
                    VALUES(?,?,?,'completion',100)
                ");
                $comment->execute([
                    $id,
                    $me['id'],
                    $completionNote
                ]);

                task_activity(
                    $pdo,
                    $id,
                    'completed',
                    'Completion note: '.$completionNote
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
                        [
                            'priority_changed',
                            'status_changed',
                            'deadline_changed',
                            'description_updated',
                            'project_changed',
                            'progress_updated'
                        ]
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
                    $status==='completed'?'task_completed':'task_updated',
                    $status==='completed'?'Task completed':'Task updated',
                    $title.($summary!==''?' · '.$summary:'')
                );
            }

            $pdo->commit();

            log_activity(
                'task.updated',
                'task',
                (string)$id,
                $title.($summary!==''?' · '.$summary:'')
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
        if(!$isManager){
            render_access_denied(
                'Task cancellation restricted',
                'Only authorised Task Management users can cancel tasks.'
            );
        }

        if($task['status']==='cancelled'){
            flash('info','This task is already cancelled.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        try{
            $pdo->beginTransaction();

            $pdo->prepare("
                UPDATE tasks
                SET
                    status='cancelled',
                    completed_at=NULL,
                    completion_note=NULL,
                    completed_by=NULL
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
        if(!$isManager){
            render_access_denied(
                'Task duplication restricted',
                'Only authorised Task Management users can duplicate tasks.'
            );
        }

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
                    progress_percent,
                    due_date,
                    completed_at,
                    completion_note,
                    completed_by,
                    start_date,
                    deadline
                )
                VALUES(?,?,?,?,?,?,?,'todo',0,NULL,NULL,NULL,NULL,NULL,NULL)
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

    if($action==='add_checklist'){
        if(!$isManager){
            render_access_denied(
                'Checklist editing restricted',
                'Only Task Management users can add checklist items.'
            );
        }

        $itemText=trim($_POST['item_text']??'');

        if($itemText===''){
            flash('error','Checklist item cannot be empty.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        if(strlen($itemText)>255){
            flash('error','Checklist item must be 255 characters or fewer.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $orderQuery=$pdo->prepare("
            SELECT COALESCE(MAX(sort_order),0)+10
            FROM task_checklist_items
            WHERE task_id=?
        ");
        $orderQuery->execute([$id]);
        $sortOrder=(int)$orderQuery->fetchColumn();

        $q=$pdo->prepare("
            INSERT INTO task_checklist_items
            (task_id,item_text,sort_order,created_by)
            VALUES(?,?,?,?)
        ");
        $q->execute([$id,$itemText,$sortOrder,$me['id']]);

        task_activity(
            $pdo,
            $id,
            'checklist_added',
            $itemText
        );

        stage3_notify_counterpart(
            $pdo,
            $task,
            $me,
            'Task checklist updated',
            $task['title'],
            $id
        );

        flash('success','Checklist item added.');
        staff_redirect('staff/pages/task-view.php?id='.$id);
    }

    if($action==='toggle_checklist'){
        $itemId=(int)($_POST['item_id']??0);

        $q=$pdo->prepare("
            SELECT *
            FROM task_checklist_items
            WHERE id=? AND task_id=?
            LIMIT 1
        ");
        $q->execute([$itemId,$id]);
        $item=$q->fetch();

        if(!$item){
            flash('error','Checklist item not found.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $completed=!((bool)$item['is_completed']);

        $update=$pdo->prepare("
            UPDATE task_checklist_items
            SET
                is_completed=?,
                completed_by=?,
                completed_at=?
            WHERE id=? AND task_id=?
        ");

        $update->execute([
            $completed?1:0,
            $completed?(int)$me['id']:null,
            $completed?date('Y-m-d H:i:s'):null,
            $itemId,
            $id
        ]);

        task_activity(
            $pdo,
            $id,
            $completed?'checklist_completed':'checklist_reopened',
            $item['item_text']
        );

        flash(
            'success',
            $completed?'Checklist item completed.':'Checklist item reopened.'
        );
        staff_redirect('staff/pages/task-view.php?id='.$id);
    }

    if($action==='delete_checklist'){
        if(!$isManager){
            render_access_denied(
                'Checklist editing restricted',
                'Only Task Management users can remove checklist items.'
            );
        }

        $itemId=(int)($_POST['item_id']??0);

        $q=$pdo->prepare("
            SELECT *
            FROM task_checklist_items
            WHERE id=? AND task_id=?
            LIMIT 1
        ");
        $q->execute([$itemId,$id]);
        $item=$q->fetch();

        if(!$item){
            flash('error','Checklist item not found.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $pdo->prepare("
            DELETE FROM task_checklist_items
            WHERE id=? AND task_id=?
        ")->execute([$itemId,$id]);

        task_activity(
            $pdo,
            $id,
            'checklist_removed',
            $item['item_text']
        );

        flash('success','Checklist item removed.');
        staff_redirect('staff/pages/task-view.php?id='.$id);
    }

    if($action==='add_comment'){
        $comment=trim($_POST['comment']??'');
        $commentType=$_POST['comment_type']??'comment';

        if(!in_array($commentType,['comment','progress'],true)){
            $commentType='comment';
        }

        if($comment===''){
            flash('error','Write an update before posting.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $progress=null;

        if($commentType==='progress'){
            $progress=(int)($_POST['progress_percent']??0);
            $progress=max(0,min(100,$progress));
        }

        try{
            $pdo->beginTransaction();

            $q=$pdo->prepare("
                INSERT INTO task_comments
                (task_id,staff_id,comment,comment_type,progress_percent)
                VALUES(?,?,?,?,?)
            ");
            $q->execute([
                $id,
                $me['id'],
                $comment,
                $commentType,
                $progress
            ]);

            if($commentType==='progress'){
                $pdo->prepare("
                    UPDATE tasks
                    SET progress_percent=?
                    WHERE id=?
                ")->execute([$progress,$id]);

                task_activity(
                    $pdo,
                    $id,
                    'progress_updated',
                    $progress.'% · '.$comment
                );
            }else{
                task_activity(
                    $pdo,
                    $id,
                    'comment_added',
                    $comment
                );
            }

            stage3_notify_counterpart(
                $pdo,
                $task,
                $me,
                $commentType==='progress'?'Task progress updated':'New task update',
                $task['title'],
                $id
            );

            $pdo->commit();

            flash(
                'success',
                $commentType==='progress'?'Progress update posted.':'Update posted.'
            );
        }catch(Throwable $e){
            if($pdo->inTransaction()){
                $pdo->rollBack();
            }

            error_log('Task comment failed: '.$e->getMessage());
            flash('error','The update could not be posted.');
        }

        staff_redirect('staff/pages/task-view.php?id='.$id);
    }

    if($action==='upload_attachment'){
        $attachmentType=$_POST['attachment_type']??'general';

        try{
            $attachmentId=task_store_attachment(
                $pdo,
                $id,
                (int)$me['id'],
                $_FILES['attachment']??[],
                $attachmentType
            );

            $fileName=trim((string)($_FILES['attachment']['name']??'Attachment'));

            task_activity(
                $pdo,
                $id,
                'attachment_added',
                ($attachmentType==='completion_evidence'
                    ?'Completion evidence: '
                    :'Attachment: ')
                .$fileName
            );

            stage3_notify_counterpart(
                $pdo,
                $task,
                $me,
                $attachmentType==='completion_evidence'
                    ?'Completion evidence uploaded'
                    :'Task attachment uploaded',
                $task['title'],
                $id
            );

            flash('success','Attachment uploaded.');
        }catch(Throwable $e){
            error_log('Task attachment upload failed: '.$e->getMessage());
            flash('error',$e->getMessage());
        }

        staff_redirect('staff/pages/task-view.php?id='.$id);
    }

    if($action==='delete_attachment'){
        $attachmentId=(int)($_POST['attachment_id']??0);

        $q=$pdo->prepare("
            SELECT *
            FROM task_attachments
            WHERE id=? AND task_id=?
            LIMIT 1
        ");
        $q->execute([$attachmentId,$id]);
        $attachment=$q->fetch();

        if(!$attachment){
            flash('error','Attachment not found.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $canDelete=
            $isManager
            || (int)($attachment['uploaded_by']??0)===(int)$me['id'];

        if(!$canDelete){
            render_access_denied(
                'Attachment removal restricted',
                'You can only remove files that you uploaded.'
            );
        }

        $pdo->prepare("
            DELETE FROM task_attachments
            WHERE id=? AND task_id=?
        ")->execute([$attachmentId,$id]);

        task_delete_attachment_file($attachment['file_path']??null);

        task_activity(
            $pdo,
            $id,
            'attachment_removed',
            $attachment['file_name']
        );

        flash('success','Attachment removed.');
        staff_redirect('staff/pages/task-view.php?id='.$id);
    }

    if($action==='complete'){
        if($task['status']==='cancelled'){
            flash('error','A cancelled task cannot be completed.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        $completionNote=trim($_POST['completion_note']??'');

        if($completionNote===''){
            flash('error','Add a completion note before completing the task.');
            staff_redirect('staff/pages/task-view.php?id='.$id);
        }

        try{
            $pdo->beginTransaction();

            $pdo->prepare("
                UPDATE tasks
                SET
                    status='completed',
                    progress_percent=100,
                    completed_at=NOW(),
                    completion_note=?,
                    completed_by=?
                WHERE id=?
            ")->execute([
                $completionNote,
                $me['id'],
                $id
            ]);

            $comment=$pdo->prepare("
                INSERT INTO task_comments
                (task_id,staff_id,comment,comment_type,progress_percent)
                VALUES(?,?,?,'completion',100)
            ");
            $comment->execute([
                $id,
                $me['id'],
                $completionNote
            ]);

            task_activity(
                $pdo,
                $id,
                'completed',
                $completionNote
            );

            if($task['project_id']){
                project_activity(
                    $pdo,
                    (int)$task['project_id'],
                    'task_completed',
                    'Task completed',
                    $task['title'].' · '.$completionNote
                );
            }

            stage3_notify_counterpart(
                $pdo,
                $task,
                $me,
                'Task completed',
                $task['title'],
                $id
            );

            $pdo->commit();

            log_activity(
                'task.completed',
                'task',
                (string)$id,
                $task['title'].' · '.$completionNote
            );

            flash('success','Task completed.');
        }catch(Throwable $e){
            if($pdo->inTransaction()){
                $pdo->rollBack();
            }

            error_log('Task completion failed: '.$e->getMessage());
            flash('error','The task could not be completed.');
        }

        staff_redirect('staff/pages/task-view.php?id='.$id);
    }
}

$task=stage3_load_task($pdo,$id);
$isManager=can_manage_tasks();
$isAssignee=(int)($task['assigned_to']??0)===(int)$me['id'];

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

$checklistQuery=$pdo->prepare("
    SELECT
        i.*,
        CONCAT(c.first_name,' ',COALESCE(c.last_name,'')) created_by_name,
        CONCAT(d.first_name,' ',COALESCE(d.last_name,'')) completed_by_name
    FROM task_checklist_items i
    LEFT JOIN staff c ON c.id=i.created_by
    LEFT JOIN staff d ON d.id=i.completed_by
    WHERE i.task_id=?
    ORDER BY i.sort_order,i.id
");
$checklistQuery->execute([$id]);
$checklist=$checklistQuery->fetchAll();

$commentQuery=$pdo->prepare("
    SELECT
        c.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) staff_name,
        s.job_title
    FROM task_comments c
    LEFT JOIN staff s ON s.id=c.staff_id
    WHERE c.task_id=?
    ORDER BY c.created_at DESC,c.id DESC
");
$commentQuery->execute([$id]);
$comments=$commentQuery->fetchAll();

$attachmentQuery=$pdo->prepare("
    SELECT
        a.*,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) uploaded_by_name
    FROM task_attachments a
    LEFT JOIN staff s ON s.id=a.uploaded_by
    WHERE a.task_id=?
    ORDER BY
        FIELD(a.attachment_type,'completion_evidence','general'),
        a.created_at DESC,
        a.id DESC
");
$attachmentQuery->execute([$id]);
$attachments=$attachmentQuery->fetchAll();

$checklistTotal=count($checklist);
$checklistDone=count(array_filter(
    $checklist,
    static fn(array $item): bool => (bool)$item['is_completed']
));
$checklistPercent=$checklistTotal
    ?(int)round(($checklistDone/$checklistTotal)*100)
    :0;

$evidenceCount=count(array_filter(
    $attachments,
    static fn(array $attachment): bool =>
        ($attachment['attachment_type']??'general')==='completion_evidence'
));

$overdue=
    !empty($task['due_date'])
    && !in_array($task['status'],['completed','cancelled'],true)
    && strtotime($task['due_date'])<time();

$pageTitle=$task['title'];
$taskManagementAssets=true;
require __DIR__.'/../../includes/staff/header.php';
?>
<main class="staff-content task-stage2 task-stage3">
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

                <span class="pill">
                    <?= (int)$task['progress_percent'] ?>% progress
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

    <section class="staff-panel task-progress-panel">
        <div class="task-progress-head">
            <div>
                <p class="eyebrow">Execution progress</p>
                <h2><?= (int)$task['progress_percent'] ?>% reported progress</h2>
            </div>

            <?php if($checklistTotal): ?>
                <span class="muted">
                    Checklist <?= $checklistDone ?>/<?= $checklistTotal ?>
                    · <?= $checklistPercent ?>%
                </span>
            <?php endif; ?>
        </div>

        <div
            class="task-progress-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="<?= (int)$task['progress_percent'] ?>"
        >
            <span style="width:<?= (int)$task['progress_percent'] ?>%"></span>
        </div>
    </section>

    <div class="task-detail-grid">
        <div>
            <?php if($isManager && $task['status']!=='cancelled'): ?>
                <section class="staff-panel">
                    <div class="section-title">
                        <div>
                            <p class="eyebrow">Management</p>
                            <h2>Edit task</h2>
                            <p class="muted">
                                Management changes are recorded in Task History.
                            </p>
                        </div>
                    </div>

                    <form method="post" class="task-edit-form" data-task-edit-form>
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
                                <select name="status" data-task-status-select>
                                    <?php foreach(task_statuses() as $key=>$label): ?>
                                        <?php if($key==='cancelled') continue; ?>
                                        <option
                                            value="<?= h($key) ?>"
                                            <?= $task['status']===$key?'selected':'' ?>
                                        >
                                            <?= h($label) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </label>

                            <label>
                                Reported progress
                                <select name="progress_percent">
                                    <?php for($percent=0;$percent<=100;$percent+=10): ?>
                                        <option
                                            value="<?= $percent ?>"
                                            <?= (int)$task['progress_percent']===$percent?'selected':'' ?>
                                        >
                                            <?= $percent ?>%
                                        </option>
                                    <?php endfor; ?>
                                </select>
                            </label>

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
                        </div>

                        <label data-completion-note-wrap>
                            Completion note
                            <textarea
                                name="completion_note"
                                rows="3"
                                placeholder="Required when status is Completed."
                            ><?= h($task['completion_note']??'') ?></textarea>
                            <small class="muted">
                                Required when the task is marked Completed.
                            </small>
                        </label>

                        <div class="task-edit-actions">
                            <button class="btn primary" type="submit">
                                Save changes
                            </button>
                        </div>
                    </form>
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
                        <p class="eyebrow">Subtasks</p>
                        <h2>Checklist</h2>
                        <p class="muted">
                            <?= $checklistDone ?> of <?= $checklistTotal ?> completed.
                        </p>
                    </div>

                    <?php if($checklistTotal): ?>
                        <span class="pill approved"><?= $checklistPercent ?>%</span>
                    <?php endif; ?>
                </div>

                <?php if($isManager): ?>
                    <form method="post" class="task-checklist-add">
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="add_checklist">
                        <input
                            name="item_text"
                            maxlength="255"
                            required
                            placeholder="Add a checklist item..."
                        >
                        <button class="btn" type="submit">Add item</button>
                    </form>
                <?php endif; ?>

                <div class="task-checklist">
                    <?php foreach($checklist as $item): ?>
                        <div class="task-checklist-row <?= $item['is_completed']?'is-complete':'' ?>">
                            <form method="post" class="task-checklist-toggle">
                                <?= csrf_field() ?>
                                <input type="hidden" name="action" value="toggle_checklist">
                                <input type="hidden" name="item_id" value="<?= (int)$item['id'] ?>">
                                <button
                                    type="submit"
                                    class="task-check-button"
                                    aria-label="<?= $item['is_completed']?'Reopen checklist item':'Complete checklist item' ?>"
                                >
                                    <?= $item['is_completed']?'✓':'' ?>
                                </button>
                            </form>

                            <div class="task-checklist-copy">
                                <b><?= h($item['item_text']) ?></b>

                                <?php if($item['is_completed']): ?>
                                    <small>
                                        Completed
                                        <?= $item['completed_by_name']
                                            ?'by '.h($item['completed_by_name'])
                                            :'' ?>
                                        <?= $item['completed_at']
                                            ?' · '.h(date(
                                                'j M, g:i A',
                                                strtotime($item['completed_at'])
                                            ))
                                            :'' ?>
                                    </small>
                                <?php elseif($item['created_by_name']): ?>
                                    <small>
                                        Added by <?= h($item['created_by_name']) ?>
                                    </small>
                                <?php endif; ?>
                            </div>

                            <?php if($isManager): ?>
                                <form
                                    method="post"
                                    data-task-confirm
                                    data-confirm-title="Remove checklist item?"
                                    data-confirm-text="<?= h($item['item_text']) ?>"
                                    data-confirm-button="Remove"
                                    data-confirm-danger="1"
                                >
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="action" value="delete_checklist">
                                    <input type="hidden" name="item_id" value="<?= (int)$item['id'] ?>">
                                    <button class="task-row-action danger-link" type="submit">
                                        Remove
                                    </button>
                                </form>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>

                    <?php if(!$checklist): ?>
                        <div class="task-empty-block">
                            No checklist items yet.
                            <?= $isManager?'Add the work steps above.':'' ?>
                        </div>
                    <?php endif; ?>
                </div>
            </section>

            <section class="staff-panel">
                <div class="section-title">
                    <div>
                        <p class="eyebrow">Communication</p>
                        <h2>Updates &amp; progress</h2>
                        <p class="muted">
                            Keep task discussion and progress in the project record.
                        </p>
                    </div>
                </div>

                <?php if($task['status']!=='cancelled'): ?>
                    <form method="post" class="task-update-form">
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="add_comment">

                        <div class="two">
                            <label>
                                Update type
                                <select name="comment_type" data-comment-type>
                                    <option value="comment">Comment</option>
                                    <option value="progress">Progress update</option>
                                </select>
                            </label>

                            <label data-progress-field hidden>
                                Progress
                                <select name="progress_percent">
                                    <?php for($percent=0;$percent<=100;$percent+=10): ?>
                                        <option
                                            value="<?= $percent ?>"
                                            <?= (int)$task['progress_percent']===$percent?'selected':'' ?>
                                        >
                                            <?= $percent ?>%
                                        </option>
                                    <?php endfor; ?>
                                </select>
                            </label>
                        </div>

                        <label>
                            Update
                            <textarea
                                name="comment"
                                rows="3"
                                required
                                placeholder="What changed, what is blocked, or what should management know?"
                            ></textarea>
                        </label>

                        <button class="btn primary" type="submit">
                            Post update
                        </button>
                    </form>
                <?php endif; ?>

                <div class="task-conversation">
                    <?php foreach($comments as $comment): ?>
                        <article class="task-comment">
                            <div class="task-comment-avatar">
                                <?= h(strtoupper(substr($comment['staff_name']?:'S',0,1))) ?>
                            </div>

                            <div class="task-comment-body">
                                <div class="task-comment-head">
                                    <div>
                                        <b><?= h($comment['staff_name']?:'System') ?></b>
                                        <?php if($comment['job_title']): ?>
                                            <small><?= h($comment['job_title']) ?></small>
                                        <?php endif; ?>
                                    </div>

                                    <div class="task-comment-meta">
                                        <span class="pill <?= $comment['comment_type']==='completion'?'approved':'' ?>">
                                            <?= h(task_comment_types()[$comment['comment_type']]??$comment['comment_type']) ?>
                                        </span>

                                        <?php if($comment['progress_percent']!==null): ?>
                                            <span class="pill">
                                                <?= (int)$comment['progress_percent'] ?>%
                                            </span>
                                        <?php endif; ?>
                                    </div>
                                </div>

                                <p><?= nl2br(h($comment['comment'])) ?></p>

                                <small>
                                    <?= h(date(
                                        'j M Y, g:i A',
                                        strtotime($comment['created_at'])
                                    )) ?>
                                </small>
                            </div>
                        </article>
                    <?php endforeach; ?>

                    <?php if(!$comments): ?>
                        <div class="task-empty-block">
                            No updates have been posted yet.
                        </div>
                    <?php endif; ?>
                </div>
            </section>

            <section class="staff-panel">
                <div class="section-title">
                    <div>
                        <p class="eyebrow">Files</p>
                        <h2>Attachments &amp; evidence</h2>
                        <p class="muted">
                            JPG, PNG, WEBP, PDF, Word, Excel or TXT · maximum 10 MB.
                        </p>
                    </div>

                    <?php if($evidenceCount): ?>
                        <span class="pill approved">
                            <?= $evidenceCount ?> evidence
                        </span>
                    <?php endif; ?>
                </div>

                <?php if($task['status']!=='cancelled'): ?>
                    <form
                        method="post"
                        enctype="multipart/form-data"
                        class="task-upload-form"
                    >
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="upload_attachment">

                        <label>
                            File
                            <input
                                type="file"
                                name="attachment"
                                required
                                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            >
                        </label>

                        <label>
                            File purpose
                            <select name="attachment_type">
                                <option value="general">General attachment</option>
                                <option value="completion_evidence">Completion evidence</option>
                            </select>
                        </label>

                        <button class="btn" type="submit">
                            Upload file
                        </button>
                    </form>
                <?php endif; ?>

                <div class="task-file-list">
                    <?php foreach($attachments as $attachment): ?>
                        <?php
                        $canDeleteAttachment=
                            $isManager
                            || (int)($attachment['uploaded_by']??0)===(int)$me['id'];
                        ?>
                        <div class="task-file-row">
                            <div class="task-file-icon">
                                <?= ($attachment['attachment_type']??'general')==='completion_evidence'
                                    ?'✓'
                                    :'↗' ?>
                            </div>

                            <div class="task-file-copy">
                                <a
                                    href="<?= h(ideare_root_url($attachment['file_path'])) ?>"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <?= h($attachment['file_name']) ?>
                                </a>

                                <small>
                                    <?= ($attachment['attachment_type']??'general')==='completion_evidence'
                                        ?'Completion evidence'
                                        :'Attachment' ?>
                                    · <?= h($attachment['uploaded_by_name']?:'Unknown') ?>
                                    · <?= h(number_format(((int)$attachment['file_size'])/1024,1)) ?> KB
                                    · <?= h(date(
                                        'j M Y, g:i A',
                                        strtotime($attachment['created_at'])
                                    )) ?>
                                </small>
                            </div>

                            <?php if($canDeleteAttachment): ?>
                                <form
                                    method="post"
                                    data-task-confirm
                                    data-confirm-title="Remove this file?"
                                    data-confirm-text="<?= h($attachment['file_name']) ?>"
                                    data-confirm-button="Remove"
                                    data-confirm-danger="1"
                                >
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="action" value="delete_attachment">
                                    <input
                                        type="hidden"
                                        name="attachment_id"
                                        value="<?= (int)$attachment['id'] ?>"
                                    >
                                    <button class="task-row-action danger-link" type="submit">
                                        Remove
                                    </button>
                                </form>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>

                    <?php if(!$attachments): ?>
                        <div class="task-empty-block">
                            No files uploaded yet.
                        </div>
                    <?php endif; ?>
                </div>
            </section>

            <?php if(!in_array($task['status'],['completed','cancelled'],true)): ?>
                <section class="staff-panel task-completion-panel">
                    <div class="section-title">
                        <div>
                            <p class="eyebrow">Finish work</p>
                            <h2>Complete task</h2>
                            <p class="muted">
                                Add a short completion note. Upload evidence above
                                when a photo or document is useful.
                            </p>
                        </div>

                        <?php if($evidenceCount): ?>
                            <span class="pill approved">
                                <?= $evidenceCount ?> evidence file<?= $evidenceCount===1?'':'s' ?>
                            </span>
                        <?php endif; ?>
                    </div>

                    <form
                        method="post"
                        data-task-confirm
                        data-confirm-title="Mark this task completed?"
                        data-confirm-text="Progress will be set to 100% and the completion note will be saved."
                        data-confirm-button="Complete task"
                    >
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="complete">

                        <label>
                            Completion note
                            <textarea
                                name="completion_note"
                                rows="4"
                                required
                                placeholder="Summarise what was completed, any handover details, and anything management should know."
                            ></textarea>
                        </label>

                        <button class="btn approve" type="submit">
                            Mark completed
                        </button>
                    </form>
                </section>
            <?php elseif($task['status']==='completed'): ?>
                <section class="staff-panel task-completion-panel is-complete">
                    <p class="eyebrow">Completed</p>
                    <h2>Completion record</h2>
                    <p class="read-only-description">
                        <?= h($task['completion_note']?:'No completion note recorded.') ?>
                    </p>
                    <small class="muted">
                        <?= $task['completed_by_name']
                            ?'Completed by '.h($task['completed_by_name'])
                            :'Completed' ?>
                        <?= $task['completed_at']
                            ?' · '.h(date(
                                'j M Y, g:i A',
                                strtotime($task['completed_at'])
                            ))
                            :'' ?>
                    </small>
                </section>
            <?php endif; ?>

            <?php if($isManager): ?>
                <section class="staff-panel task-danger-zone">
                    <p class="eyebrow">Task actions</p>
                    <h2>Duplicate or cancel</h2>
                    <p class="muted">
                        Duplicating keeps the task details, project, assignee and
                        priority, but creates a new To Do task with 0% progress
                        and no deadline.
                    </p>

                    <div class="task-edit-actions">
                        <form
                            method="post"
                            data-task-confirm
                            data-confirm-title="Duplicate this task?"
                            data-confirm-text="A new To Do task will be created without checklist items, updates, files or a deadline."
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
                                <b><?= h(stage3_activity_label($event['action'])) ?></b>

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
                        <span>Progress</span>
                        <strong><?= (int)$task['progress_percent'] ?>%</strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Checklist</span>
                        <strong><?= $checklistDone ?>/<?= $checklistTotal ?></strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Evidence</span>
                        <strong><?= $evidenceCount ?></strong>
                    </div>

                    <div class="task-summary-item">
                        <span>Deadline</span>
                        <strong class="<?= $overdue?'deadline-overdue':'' ?>">
                            <?= h(stage3_due_value($task['due_date']??null)) ?>
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
