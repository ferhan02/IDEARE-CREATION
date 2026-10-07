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
