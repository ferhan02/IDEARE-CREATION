<?php

require_once __DIR__ . '/../../includes/staff/operations.php';
require_login();
verify_csrf();
$pdo = staff_db();
$staff = current_staff();

if (!db_table_exists($pdo, 'customers')) {
    http_response_code(503);
    $pageTitle = 'Customers';

    require __DIR__ . '/../../includes/staff/header.php';

    echo '
    <main class="staff-content">
        <section class="staff-panel">
            <h1>CRM database tables unavailable</h1>
            <p>
                The <code>customers</code> table could not be found in
                <code>ideare_db</code>.
            </p>
            <p>
                Verify that <code>database/ideare_full_32_feature_schema.sql</code>
                has been applied.
            </p>
        </section>
    </main>';

    require __DIR__ . '/../../includes/staff/footer.php';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'create') {
    $name = trim($_POST['name'] ?? '');
    if ($name === '') {
        flash('error', 'Customer name is required.');
        staff_redirect('staff/pages/customers.php');
    }

    $code = op_code('CUS');
    $q = $pdo->prepare('INSERT INTO customers(customer_code, name, phone, email, site_address, lead_source, interested_service, assigned_to, status, notes, created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
    $assigned = $_POST['assigned_to'] !== '' ? (int) $_POST['assigned_to'] : null;
    $q->execute([
        $code,
        $name,
        trim($_POST['phone'] ?? '') ?: null,
        trim($_POST['email'] ?? '') ?: null,
        trim($_POST['address'] ?? '') ?: null,
        trim($_POST['lead_source'] ?? '') ?: null,
        trim($_POST['interested_service'] ?? '') ?: null,
        $assigned,
        'lead',
        trim($_POST['notes'] ?? '') ?: null,
        $staff['id'],
    ]);
    $id = (int) $pdo->lastInsertId();

    $q = $pdo->prepare('INSERT INTO leads(customer_id, assigned_to, stage, estimated_value, probability) VALUES(?,?,?,?,?)');
    $q->execute([$id, $assigned, 'new', (float) ($_POST['estimated_value'] ?? 0), 20]);

    log_activity('customer.created', 'customer', (string) $id, 'Created ' . $name);
    flash('success', 'Customer and lead created.');
    staff_redirect('staff/pages/customer-view.php?id=' . $id);
}

$search = trim($_GET['q'] ?? '');
$status = $_GET['status'] ?? '';
$sql = "SELECT c.*, CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) assigned_name, (SELECT COUNT(*) FROM projects p WHERE p.customer_id=c.id) project_count, (SELECT stage FROM leads l WHERE l.customer_id=c.id LIMIT 1) lead_stage FROM customers c LEFT JOIN staff s ON s.id=c.assigned_to WHERE 1";
$args = [];

if ($search !== '') {
    $sql .= ' AND (c.name LIKE ? OR c.customer_code LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
    $like = '%' . $search . '%';
    $args = [$like, $like, $like, $like];
}

if ($status !== '') {
    $sql .= ' AND c.status=?';
    $args[] = $status;
}

$sql .= ' ORDER BY c.updated_at DESC';
$q = $pdo->prepare($sql);
$q->execute($args);
$rows = $q->fetchAll();
$staffRows = $pdo->query("SELECT id, first_name, last_name FROM staff WHERE is_active=1 ORDER BY first_name, last_name")->fetchAll();
$pageTitle = 'Customers';
require __DIR__ . '/../../includes/staff/header.php';
?>

<main class="staff-content">
    <div class="page-head">
        <div>
            <p class="eyebrow">CRM</p>
            <h1>Customers</h1>
            <p class="muted">Keep leads, customers, projects and follow-ups in one place.</p>
        </div>
    </div>

    <div class="split-grid">
        <section class="staff-panel">
            <h2>Add customer</h2>
            <form method="post">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="create">
                
                <div class="two">
                    <label>Name<input name="name" required></label>
                    <label>Phone<input name="phone"></label>
                </div>

                <div class="two">
                    <label>Email<input type="email" name="email"></label>
                    <label>Lead source<input name="lead_source" placeholder="WhatsApp, referral, Facebook..."></label>
                </div>

                <label>Address<textarea name="address"></textarea></label>

                <div class="two">
                    <label>Interested service<input name="interested_service" placeholder="Kitchen cabinet"></label>
                    <label>Estimated value (RM)<input type="number" step=".01" name="estimated_value" value="0"></label>
                </div>

                <label>Assigned staff
                    <select name="assigned_to">
                        <option value="">Unassigned</option>
                        <?php foreach ($staffRows as $s): ?>
                            <option value="<?= (int) $s['id'] ?>"><?= h(trim($s['first_name'] . ' ' . $s['last_name'])) ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>

                <label>Notes<textarea name="notes"></textarea></label>

                <button class="btn primary">Create customer</button>
            </form>
        </section>

        <section class="staff-panel">
            <h2>Find customers</h2>
            <form method="get" class="search-row">
                <label>Search
                    <input name="q" value="<?= h($search) ?>" placeholder="Name, phone, email or customer code">
                </label>
                <label>Status
                    <select name="status">
                        <option value="">All</option>
                        <?php foreach (['lead', 'active', 'inactive', 'completed'] as $x): ?>
                            <option value="<?= $x ?>" <?= $status === $x ? 'selected' : '' ?>><?= h(ucfirst($x)) ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
                <button class="btn">Filter</button>
            </form>

            <div class="kpi-inline" style="margin-top:22px">
                <span>
                    <small>Customers shown</small>
                    <strong><?= count($rows) ?></strong>
                </span>
                <span>
                    <small>With projects</small>
                    <strong><?= count(array_filter($rows, fn($r) => (int) $r['project_count'] > 0)) ?></strong>
                </span>
            </div>
        </section>
    </div>

    <section class="staff-panel table-panel">
        <table>
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Lead stage</th>
                    <th>Assigned</th>
                    <th>Projects</th>
                    <th>Updated</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($rows as $r): ?>
                    <tr>
                        <td>
                            <a href="<?= h(ideare_root_url('staff/pages/customer-view.php?id=' . $r['id'])) ?>">
                                <b><?= h($r['name']) ?></b>
                            </a>
                            <small><?= h($r['customer_code']) ?></small>
                        </td>
                        <td>
                            <?= h($r['phone'] ?: '—') ?>
                            <small><?= h($r['email'] ?: '') ?></small>
                        </td>
                        <td>
                            <span class="pill"><?= h(str_replace('_', ' ', $r['lead_stage'] ?: $r['status'])) ?></span>
                        </td>
                        <td><?= h(trim($r['assigned_name'] ?: 'Unassigned')) ?></td>
                        <td><?= (int) $r['project_count'] ?></td>
                        <td><?= h(date('j M Y', strtotime($r['updated_at']))) ?></td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$rows): ?>
                    <tr>
                        <td colspan="6" class="empty-state">No customers found.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </section>
</main>

<?php require __DIR__ . '/../../includes/staff/footer.php'; ?>