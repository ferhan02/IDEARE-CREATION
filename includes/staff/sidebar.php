<?php
$path = str_replace('\\', '/', (string)($_SERVER['PHP_SELF'] ?? ''));
$managerView = ideare_is_owner_or_manager();
function nav_active(string $needle): string {
    global $path;
    return str_contains($path, $needle) ? 'active' : '';
}
function ideare_sidebar_link(string $label,string $href,string $permission=''): void {
    if($permission!=='' && !can($permission)) return;
    echo '<a class="'.h(nav_active($href)).'" href="'.h(ideare_root_url($href)).'">'.h($label).'</a>';
}
?>
<aside class="sidebar" id="sidebar">
    <div class="brand-wrap">
        <a class="brand logo-link" href="<?=h(ideare_root_url('staff/index.php'))?>" aria-label="IDEARE Staff Portal"><img class="brand-logo-image sidebar-brand-logo" src="<?=h(ideare_root_url('assets/images/ideare-logo.png'))?>" alt="IDEARE"></a>
        <span>Staff Portal</span>
    </div>

    <?php if(can('search.use')): ?>
    <form class="sidebar-nav-search sidebar-global-search" role="search" action="<?=h(ideare_root_url('staff/pages/search.php'))?>" method="get">
        <div class="sidebar-nav-search-box">
            <svg class="sidebar-nav-search-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <input id="sidebarGlobalSearch" name="q" type="search" value="<?=h(trim((string)($_GET['q']??'')))?>" placeholder="Search everything..." aria-label="Search authorized records" autocomplete="off" spellcheck="false">
            <button class="sidebar-nav-search-submit" type="submit" aria-label="Run global search" title="Search everything"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <div class="sidebar-global-search-hint">Search records your role can access</div>
    </form>
    <?php endif; ?>

    <nav id="staffNavigation" aria-label="Staff navigation">
        <p class="nav-label">Overview</p>
        <?php ideare_sidebar_link('Dashboard','staff/index.php'); ?>
        <?php if($managerView): ideare_sidebar_link('Business Dashboard','staff/admin/management-dashboard.php','dashboard.view'); endif; ?>
        <?php ideare_sidebar_link('Global Search','staff/pages/search.php','search.use'); ?>
        <?php ideare_sidebar_link('Notifications','staff/pages/notifications.php'); ?>

        <p class="nav-label">Work</p>
        <?php ideare_sidebar_link('My Tasks','staff/pages/tasks.php','task.view_own'); ?>
        <?php if(can_manage_tasks()): ideare_sidebar_link('Task Management','staff/admin/task-management.php'); endif; ?>
        <?php ideare_sidebar_link('Staff Calendar','staff/pages/calendar.php'); ?>
        <?php ideare_sidebar_link('Attendance','staff/pages/attendance.php','attendance.view_own'); ?>
        <?php ideare_sidebar_link('Leave','staff/pages/leave.php','leave.view_own'); ?>
        <?php ideare_sidebar_link('My Profile','staff/pages/profile.php'); ?>

        <?php if($managerView): ?>
        <p class="nav-label">Customers &amp; Sales</p>
        <?php ideare_sidebar_link('Customers / CRM','staff/pages/customers.php'); ?>
        <?php ideare_sidebar_link('Sales Pipeline','staff/pages/leads.php'); ?>
        <?php ideare_sidebar_link('Appointments','staff/pages/appointments.php','appointments.view'); ?>
        <?php ideare_sidebar_link('Quotation Centre','staff/pages/quotation-centre.php','quotation.view'); ?>
        <?php ideare_sidebar_link('Payments / Invoices','staff/pages/finance.php','finance.view'); ?>
        <?php endif; ?>

        <p class="nav-label">Projects &amp; Design</p>
        <?php ideare_sidebar_link('Projects','staff/pages/projects.php'); ?>
        <?php ideare_sidebar_link('Site Measurements','staff/pages/site-measurements.php'); ?>
        <a href="<?=h(ideare_root_url('designer/index.php'))?>">Cabinet Designer ↗</a>
        <?php if($managerView): ideare_sidebar_link('Bill of Materials','staff/pages/bom.php','materials.view'); endif; ?>
        <?php ideare_sidebar_link('Documents / Notes','staff/pages/documents.php','documents.view'); ?>

        <?php if($managerView): ?>
        <p class="nav-label">Procurement &amp; Workshop</p>
        <?php ideare_sidebar_link('Material Catalogue','staff/pages/materials.php','materials.view'); ?>
        <a href="<?=h(ideare_root_url('hpl-catalogue.php'))?>">HPL Catalogue ↗</a>
        <a href="<?=h(ideare_root_url('stone-catalogue.php'))?>">Stone Catalogue ↗</a>
        <?php ideare_sidebar_link('Suppliers','staff/pages/suppliers.php','suppliers.view'); ?>
        <?php ideare_sidebar_link('Purchase Orders','staff/pages/purchase-orders.php','purchasing.view'); ?>
        <?php ideare_sidebar_link('Inventory','staff/pages/inventory.php','inventory.view'); ?>
        <?php ideare_sidebar_link('Production Board','staff/pages/production.php','production.view'); ?>
        <?php ideare_sidebar_link('Installations','staff/pages/installations.php','installations.view'); ?>

        <?php if(can('roles.manage')||can('quotation.settings')||can('quotation.manage_rate_book')): ?>
        <p class="nav-label">Management</p>
        <?php ideare_sidebar_link('Roles / Permissions','staff/admin/roles.php','roles.manage'); ?>
        <?php ideare_sidebar_link('Quotation Settings','staff/admin/quotation-settings.php','quotation.settings'); ?>
        <?php if(can('quotation.manage_rate_book') || can('quotation.settings')): ?>
        <a href="<?=h(ideare_root_url('staff/admin/quotation-rate-book.php'))?>">Quotation Rate Book</a>
        <?php endif; ?>
        <?php endif; ?>
        <?php endif; ?>
    </nav>
    <div class="sidebar-footer"><a href="<?=h(ideare_root_url('auth/logout.php'))?>">Sign out</a></div>
</aside>
<script>
(function(){const input=document.getElementById('sidebarGlobalSearch');if(!input)return;document.addEventListener('keydown',function(event){const t=event.target;const typing=t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement||t?.isContentEditable;if(!typing&&event.key==='/'){event.preventDefault();input.focus();input.select();}});})();
</script>
