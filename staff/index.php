<?php
require_once __DIR__.'/../includes/staff/auth.php';require_login();$pdo=staff_db();$staff=current_staff();
$q=$pdo->prepare("SELECT COUNT(*) FROM tasks WHERE assigned_to=? AND status NOT IN('completed','cancelled')");$q->execute([$staff['id']]);$openTasks=(int)$q->fetchColumn();
$q=$pdo->prepare("SELECT COUNT(*) FROM design_assignments WHERE assigned_to=? AND status NOT IN('completed','cancelled')");$q->execute([$staff['id']]);$openDesigns=(int)$q->fetchColumn();
$q=$pdo->prepare("SELECT COUNT(*) FROM notifications WHERE staff_id=? AND is_read=0");$q->execute([$staff['id']]);$unread=(int)$q->fetchColumn();
$q=$pdo->prepare("SELECT * FROM attendance WHERE staff_id=? AND attendance_date=CURDATE()");$q->execute([$staff['id']]);$today=$q->fetch();
$tasksStmt=$pdo->prepare("SELECT * FROM tasks WHERE assigned_to=? ORDER BY FIELD(status,'in_progress','todo','waiting','completed'),due_date IS NULL,due_date LIMIT 5");$tasksStmt->execute([$staff['id']]);$tasks=$tasksStmt->fetchAll();
$pageTitle='Dashboard';require __DIR__.'/../includes/staff/header.php';
?>
<main class="staff-content"><div class="page-head"><div><p class="eyebrow">Good to see you</p><h1><?= h($staff['first_name']) ?>’s dashboard</h1><p class="muted"><?= h($staff['job_title']?:$staff['role_name']) ?></p></div><a class="btn" href="<?= h(ideare_root_url('index.php')) ?>">Customer site</a></div>
<section class="stat-grid"><article class="stat"><span>Open tasks</span><strong><?= $openTasks ?></strong></article><article class="stat"><span>Assigned designs</span><strong><?= $openDesigns ?></strong></article><article class="stat"><span>Unread notifications</span><strong><?= $unread ?></strong></article><article class="stat"><span>Today</span><strong><?= $today?h(ucwords(str_replace('_',' ',$today['status']))):'Not clocked in' ?></strong></article></section>
<section class="staff-panel"><div class="section-title"><div><p class="eyebrow">Work</p><h2>My tasks</h2></div><a href="<?= h(ideare_root_url('staff/pages/tasks.php')) ?>">View all</a></div><div class="list"><?php foreach($tasks as $t):?><div class="list-row"><div><b><?= h($t['title']) ?></b><small><?= h(str_replace('_',' ',$t['status'])) ?></small></div><span class="pill <?= h($t['priority']) ?>"><?= h($t['priority']) ?></span></div><?php endforeach;?></div></section></main>
<?php require __DIR__.'/../includes/staff/footer.php'; ?>
