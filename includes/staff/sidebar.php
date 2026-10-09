<?php
$path=str_replace('\\','/',$_SERVER['PHP_SELF']??'');

function nav_active(string $needle):string
{
    global $path;
    return str_contains($path,$needle)?'active':'';
}
?>
<aside class="sidebar" id="sidebar">
    <div class="brand-wrap">
        <a class="brand logo-link" href="<?=h(ideare_root_url('staff/index.php'))?>" aria-label="IDEARE Staff Portal">
            <img class="brand-logo-image sidebar-brand-logo" src="<?=h(ideare_root_url('assets/images/ideare-logo.png'))?>" alt="IDEARE">
        </a>
        <span>Staff Portal</span>
    </div>

    <form
        class="sidebar-nav-search sidebar-global-search"
        role="search"
        action="<?=h(ideare_root_url('staff/pages/search.php'))?>"
        method="get"
    >
        <div class="sidebar-nav-search-box">
            <svg class="sidebar-nav-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input
                id="sidebarGlobalSearch"
                name="q"
                type="search"
                value="<?=h(trim((string)($_GET['q']??'')))?>"
                placeholder="Search everything..."
                aria-label="Search customers, projects, catalogue and other records"
                autocomplete="off"
                spellcheck="false"
            >
            <button class="sidebar-nav-search-submit" type="submit" aria-label="Run global search" title="Search everything">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
        <div class="sidebar-global-search-hint">Customers, projects, quotations, materials and more</div>
    </form>

    <nav id="staffNavigation">
        <p class="nav-label">Overview</p>
        <a href="<?=h(ideare_root_url('staff/index.php'))?>">Dashboard</a>
        <a href="<?=h(ideare_root_url('staff/admin/management-dashboard.php'))?>">Business Dashboard</a>
        <a href="<?=h(ideare_root_url('staff/pages/search.php'))?>">Global Search</a>
        <a href="<?=h(ideare_root_url('staff/pages/notifications.php'))?>">Notifications</a>

        <p class="nav-label">Customers &amp; Sales</p>
        <a href="<?=h(ideare_root_url('staff/pages/customers.php'))?>">Customers / CRM</a>
        <a href="<?=h(ideare_root_url('staff/pages/leads.php'))?>">Sales Pipeline</a>
        <a href="<?=h(ideare_root_url('staff/pages/appointments.php'))?>">Appointments</a>
        <a href="<?=h(ideare_root_url('staff/pages/quotation-centre.php'))?>">Quotation Centre</a>
        <a href="<?=h(ideare_root_url('staff/pages/finance.php'))?>">Payments / Invoices</a>

        <p class="nav-label">Projects &amp; Design</p>
        <a href="<?=h(ideare_root_url('staff/pages/projects.php'))?>">Projects</a>
        <a href="<?=h(ideare_root_url('staff/pages/site-measurements.php'))?>">Site Measurements</a>
        <a href="<?=h(ideare_root_url('designer/index.php'))?>">Cabinet Designer ↗</a>
        <a href="<?=h(ideare_root_url('staff/pages/bom.php'))?>">Bill of Materials</a>
        <a href="<?=h(ideare_root_url('staff/pages/documents.php'))?>">Documents / Notes</a>

        <p class="nav-label">Procurement &amp; Workshop</p>
        <a href="<?=h(ideare_root_url('staff/pages/materials.php'))?>">Material Catalogue</a>
        <a href="<?=h(ideare_root_url('material-catalogue.php'))?>">HPL Finish Catalogue ↗</a>
        <a href="<?=h(ideare_root_url('staff/pages/suppliers.php'))?>">Suppliers</a>
        <a href="<?=h(ideare_root_url('staff/pages/purchase-orders.php'))?>">Purchase Orders</a>
        <a href="<?=h(ideare_root_url('staff/pages/inventory.php'))?>">Inventory</a>
        <a href="<?=h(ideare_root_url('staff/pages/production.php'))?>">Production Board</a>
        <a href="<?=h(ideare_root_url('staff/pages/quality-control.php'))?>">Quality Control</a>
        <a href="<?=h(ideare_root_url('staff/pages/installations.php'))?>">Installations</a>

        <p class="nav-label">Work</p>
        <a href="<?=h(ideare_root_url('staff/pages/tasks.php'))?>">My Tasks</a>
        <?php if(can_manage_tasks()): ?>
            <a href="<?=h(ideare_root_url('staff/admin/task-management.php'))?>">Task Management</a>
        <?php endif; ?>
        <a href="<?=h(ideare_root_url('staff/pages/calendar.php'))?>">Staff Calendar</a>
        <a href="<?=h(ideare_root_url('staff/pages/warranty.php'))?>">Warranty / After-Sales</a>

        <p class="nav-label">Management</p>
        <a href="<?=h(ideare_root_url('staff/admin/approvals.php'))?>">Approvals</a>
        <a href="<?=h(ideare_root_url('staff/admin/customer-portal-access.php'))?>">Customer Portal Access</a>
        <a href="<?=h(ideare_root_url('staff/admin/roles.php'))?>">Roles / Permissions</a>
        <a href="<?=h(ideare_root_url('staff/admin/gallery.php'))?>">Project Gallery</a>
        <a href="<?=h(ideare_root_url('staff/admin/inspiration.php'))?>">Inspiration Gallery</a>

        <p class="nav-label">Existing Staff Tools</p>
        <?php if(can('attendance.view_own')):?><a href="<?=h(ideare_root_url('staff/pages/attendance.php'))?>">Attendance</a><?php endif?>
        <?php if(can('leave.view_own')):?><a href="<?=h(ideare_root_url('staff/pages/leave.php'))?>">Leave</a><?php endif?>
        <a href="<?=h(ideare_root_url('staff/pages/profile.php'))?>">My Profile</a>
    </nav>

    <div class="sidebar-footer">
        <a href="<?=h(ideare_root_url('auth/logout.php'))?>">Sign out</a>
    </div>
</aside>

<script>
(function () {
    const input = document.getElementById('sidebarGlobalSearch');
    if (!input) return;

    document.addEventListener('keydown', function (event) {
        const target = event.target;
        const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;

        if (!typing && event.key === '/') {
            event.preventDefault();
            input.focus();
            input.select();
        }
    });
})();
</script>
