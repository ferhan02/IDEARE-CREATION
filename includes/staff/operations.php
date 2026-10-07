<?php

require_once __DIR__ . '/auth.php';

function op_code(string $prefix): string
{
    return strtoupper($prefix) . '-' . date('Y') . '-' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
}

function project_statuses(): array
{
    return [
        'consultation' => 'Consultation',
        'measurement' => 'Measurement',
        'design' => 'Design',
        'quotation' => 'Quotation',
        'approved' => 'Approved',
        'procurement' => 'Procurement',
        'production' => 'Production',
        'qc' => 'Quality control',
        'installation' => 'Installation',
        'completed' => 'Completed',
        'on_hold' => 'On hold',
        'cancelled' => 'Cancelled',
    ];
}

function lead_stages(): array
{
    return [
        'new' => 'New lead',
        'contacted' => 'Contacted',
        'consultation' => 'Consultation',
        'site_measurement' => 'Site measurement',
        'designing' => 'Designing',
        'quotation_sent' => 'Quotation sent',
        'negotiation' => 'Negotiation',
        'won' => 'Won',
        'lost' => 'Lost',
    ];
}

function task_statuses(): array
{
    return [
        'todo' => 'To do',
        'in_progress' => 'In progress',
        'waiting' => 'Waiting',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
    ];
}

function task_priorities(): array
{
    return [
        'low' => 'Low',
        'normal' => 'Normal',
        'high' => 'High',
        'urgent' => 'Urgent',
    ];
}

function task_comment_types(): array
{
    return [
        'comment' => 'Comment',
        'progress' => 'Progress update',
        'completion' => 'Completion note',
    ];
}

function project_activity(PDO $pdo, int $projectId, string $type, string $title, ?string $description = null): void
{
    $st = current_staff();
    $q = $pdo->prepare('INSERT INTO project_activity(project_id, staff_id, activity_type, title, description) VALUES(?, ?, ?, ?, ?)');
    $q->execute([$projectId, $st['id'] ?? null, $type, $title, $description]);
}

function task_activity(
    PDO $pdo,
    int $taskId,
    string $action,
    ?string $details = null,
    ?int $staffId = null
): void {
    if ($staffId === null) {
        $st = current_staff();
        $staffId = isset($st['id']) ? (int) $st['id'] : null;
    }

    $q = $pdo->prepare(
        'INSERT INTO task_activity(task_id, staff_id, action, details)
         VALUES(?, ?, ?, ?)'
    );
    $q->execute([$taskId, $staffId, $action, $details]);
}

function task_record_assignment(
    PDO $pdo,
    int $taskId,
    int $staffId,
    ?int $assignedBy = null
): void {
    $q = $pdo->prepare(
        'INSERT INTO task_assignments(task_id, staff_id, assigned_by, assigned_at)
         VALUES(?, ?, ?, NOW())'
    );
    $q->execute([$taskId, $staffId, $assignedBy]);
}

function task_upload_extensions(): array
{
    return [
        'jpg','jpeg','png','webp',
        'pdf',
        'doc','docx',
        'xls','xlsx',
        'txt'
    ];
}

function task_store_attachment(
    PDO $pdo,
    int $taskId,
    int $uploadedBy,
    array $file,
    string $attachmentType='general'
): int {
    if(($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK){
        throw new RuntimeException('Choose a file to upload.');
    }

    $size=(int)($file['size']??0);

    if($size<=0){
        throw new RuntimeException('The uploaded file is empty.');
    }

    if($size>10*1024*1024){
        throw new RuntimeException('Attachments must be 10 MB or smaller.');
    }

    $originalName=trim((string)($file['name']??'attachment'));
    $extension=strtolower(pathinfo($originalName,PATHINFO_EXTENSION));

    if(!in_array($extension,task_upload_extensions(),true)){
        throw new RuntimeException(
            'Unsupported file type. Use JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX or TXT.'
        );
    }

    if(!in_array($attachmentType,['general','completion_evidence'],true)){
        $attachmentType='general';
    }

    $tmp=(string)($file['tmp_name']??'');

    if($tmp===''||!is_uploaded_file($tmp)){
        throw new RuntimeException('The uploaded file could not be verified.');
    }

    $projectRoot=dirname(__DIR__,2);
    $relativeDir='uploads/tasks/'.$taskId;
    $absoluteDir=$projectRoot.DIRECTORY_SEPARATOR
        .str_replace('/',DIRECTORY_SEPARATOR,$relativeDir);

    if(!is_dir($absoluteDir) && !mkdir($absoluteDir,0775,true) && !is_dir($absoluteDir)){
        throw new RuntimeException('The task upload folder could not be created.');
    }

    $storedName=date('YmdHis').'-'.bin2hex(random_bytes(8)).'.'.$extension;
    $absolutePath=$absoluteDir.DIRECTORY_SEPARATOR.$storedName;

    if(!move_uploaded_file($tmp,$absolutePath)){
        throw new RuntimeException('The file could not be saved.');
    }

    $mimeType=null;

    if(class_exists('finfo')){
        try{
            $finfo=new finfo(FILEINFO_MIME_TYPE);
            $mimeType=$finfo->file($absolutePath)?:null;
        }catch(Throwable $e){
            $mimeType=null;
        }
    }

    if(!$mimeType){
        $mimeType=substr((string)($file['type']??''),0,120)?:null;
    }

    $relativePath=$relativeDir.'/'.$storedName;

    try{
        $q=$pdo->prepare("
            INSERT INTO task_attachments
            (
                task_id,
                uploaded_by,
                attachment_type,
                file_name,
                file_path,
                mime_type,
                file_size
            )
            VALUES(?,?,?,?,?,?,?)
        ");

        $q->execute([
            $taskId,
            $uploadedBy,
            $attachmentType,
            $originalName,
            $relativePath,
            $mimeType,
            $size
        ]);
    }catch(Throwable $e){
        @unlink($absolutePath);
        throw $e;
    }

    return (int)$pdo->lastInsertId();
}

function task_delete_attachment_file(?string $relativePath): void
{
    if(!$relativePath) return;

    $normalized=str_replace('\\','/',trim($relativePath));

    if(!str_starts_with($normalized,'uploads/tasks/')){
        return;
    }

    $projectRoot=dirname(__DIR__,2);
    $absolutePath=$projectRoot.DIRECTORY_SEPARATOR
        .str_replace('/',DIRECTORY_SEPARATOR,$normalized);

    if(is_file($absolutePath)){
        @unlink($absolutePath);
    }
}

function notify_staff(PDO $pdo, ?int $staffId, string $title, string $message, ?string $type = null, ?string $relatedType = null, ?int $relatedId = null): void
{
    if (!$staffId) {
        return;
    }

    try {
        $q = $pdo->prepare('INSERT INTO notifications(staff_id, title, message, type, entity_type, entity_id) VALUES(?, ?, ?, ?, ?, ?)');
        $q->execute([$staffId, $title, $message, $type ?: 'info', $relatedType, $relatedId]);
    } catch (Throwable $e) {
        $q = $pdo->prepare('INSERT INTO notifications(staff_id, title, message, notification_type, related_type, related_id) VALUES(?, ?, ?, ?, ?, ?)');
        $q->execute([$staffId, $title, $message, $type, $relatedType, $relatedId]);
    }
}

function db_table_exists(PDO $pdo, string $table): bool
{
    try {
        $q = $pdo->prepare(
            'SELECT 1
             FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
             LIMIT 1'
        );

        $q->execute([$table]);

        return (bool) $q->fetchColumn();
    } catch (Throwable $e) {
        error_log('db_table_exists failed: ' . $e->getMessage());
        return false;
    }
}
