<?php
$path=str_replace('\\','/',$_SERVER['PHP_SELF']??'');
function nav_active(string $needle): string {
    global $path;
    return str_contains($path,$needle)?'active':'';
}
?>
<aside class="sidebar" id="sidebar">
<div class="brand-wrap">
    <a class="brand" href="<?= h(ideare_root_url('staff/index.php')) ?>">IdeaRE</a>
    <span>Staff Portal</span>
</div>

<nav>
<p class="nav-label">Overview</p>
<a class="<?= nav_active('/staff/index.php') ?>" href="<?= h(ideare_root_url('staff/index.php')) ?>">Dashboard</a>
<?php if(can('dashboard.management')):?>
<a class="<?= nav_active('/management-dashboard.php') ?>" href="<?= h(ideare_root_url('staff/admin/management-dashboard.php')) ?>">Management Dashboard</a>
<?php endif;?>

<p class="nav-label">Work</p>
<?php if(can('task.view_own')):?>
<a class="<?= nav_active('/tasks.php') ?>" href="<?= h(ideare_root_url('staff/pages/tasks.php')) ?>">My Tasks</a>
<?php endif;?>
<?php if(can('design.view_assigned')):?>
<a class="<?= nav_active('/designs.php') ?>" href="<?= h(ideare_root_url('staff/pages/designs.php')) ?>">Assigned Designs</a>
<?php endif;?>
<?php if(can('design.view_all')):?>
<a class="<?= nav_active('/all-designs.php') ?>" href="<?= h(ideare_root_url('staff/admin/all-designs.php')) ?>">All Customer Designs</a>
<?php endif;?>
<a href="<?= h(ideare_root_url('designer/index.php')) ?>">Cabinet Designer ↗</a>

<?php if(can('material.calculate') || can('quotation.view')): ?>
<p class="nav-label">Costing & Quotations</p>
<?php endif; ?>

<?php if(can('material.calculate')):?>
<a class="<?= nav_active('/material-calculator.php') ?>" href="<?= h(ideare_root_url('staff/pages/material-calculator.php')) ?>">Material Calculator</a>
<?php endif;?>

<?php if(can('quotation.view')):?>
<a class="<?= nav_active('/quotations.php') || nav_active('/quotation-create.php') || nav_active('/quotation-view.php') ?>" href="<?= h(ideare_root_url('staff/pages/quotations.php')) ?>">Quotations</a>
<?php endif;?>

<p class="nav-label">Attendance & requests</p>
<?php if(can('attendance.view_own')):?><a href="<?= h(ideare_root_url('staff/pages/attendance.php')) ?>">Attendance</a><?php endif;?>
<?php if(can('leave.view_own')):?><a href="<?= h(ideare_root_url('staff/pages/leave.php')) ?>">Leave</a><?php endif;?>
<?php if(can('overtime.view_own')):?><a href="<?= h(ideare_root_url('staff/pages/overtime.php')) ?>">Overtime</a><?php endif;?>
<?php if(can('salary_advance.view_own')):?><a href="<?= h(ideare_root_url('staff/pages/salary-advance.php')) ?>">Salary Advance</a><?php endif;?>
<?php if(can('salary.view_own')):?><a href="<?= h(ideare_root_url('staff/pages/salary.php')) ?>">My Salary</a><?php endif;?>

<p class="nav-label">Company</p>
<?php if(can('announcement.view')):?><a href="<?= h(ideare_root_url('staff/pages/announcements.php')) ?>">Announcements</a><?php endif;?>
<a href="<?= h(ideare_root_url('staff/pages/profile.php')) ?>">My Profile</a>

<?php if(can('staff.view')||can('attendance.view_all')||can('leave.approve')||can('task.create')||can('design.assign')||can('material.manage')):?>
<p class="nav-label">Management</p>
<?php endif;?>

<?php if(can('staff.view')):?><a href="<?= h(ideare_root_url('staff/admin/staff-management.php')) ?>">Staff Management</a><?php endif;?>
<?php if(can('attendance.view_all')):?><a href="<?= h(ideare_root_url('staff/admin/attendance-management.php')) ?>">Attendance Management</a><?php endif;?>
<?php if(can('leave.approve')):?><a href="<?= h(ideare_root_url('staff/admin/leave-approvals.php')) ?>">Leave Approvals</a><?php endif;?>
<?php if(can('overtime.approve')):?><a href="<?= h(ideare_root_url('staff/admin/overtime-approvals.php')) ?>">Overtime Approvals</a><?php endif;?>
<?php if(can('salary_advance.approve')):?><a href="<?= h(ideare_root_url('staff/admin/salary-advance-approvals.php')) ?>">Advance Approvals</a><?php endif;?>
<?php if(can('design.assign')):?><a href="<?= h(ideare_root_url('staff/admin/design-assignments.php')) ?>">Design Assignments</a><?php endif;?>
<?php if(can('task.create')):?><a href="<?= h(ideare_root_url('staff/admin/task-management.php')) ?>">Task Management</a><?php endif;?>
<?php if(can('material.manage')):?><a class="<?= nav_active('/materials.php') ?>" href="<?= h(ideare_root_url('staff/admin/materials.php')) ?>">Material Catalogue</a><?php endif;?>

<?php if(can('salary.manage')||can('announcement.manage')||can('activity.view')||can('settings.manage')||can('quotation.settings')):?>
<p class="nav-label">Boss / Admin</p>
<?php endif;?>

<?php if(can('salary.manage')):?><a href="<?= h(ideare_root_url('staff/admin/payroll.php')) ?>">Payroll</a><?php endif;?>
<?php if(can('quotation.settings')):?><a class="<?= nav_active('/quotation-settings.php') ?>" href="<?= h(ideare_root_url('staff/admin/quotation-settings.php')) ?>">Quotation Settings</a><?php endif;?>
<?php if(can('announcement.manage')):?><a href="<?= h(ideare_root_url('staff/admin/announcements-management.php')) ?>">Manage Announcements</a><?php endif;?>
<?php if(can('activity.view')):?><a href="<?= h(ideare_root_url('staff/admin/activity-logs.php')) ?>">Activity Logs</a><?php endif;?>
<?php if(can('settings.manage')):?><a href="<?= h(ideare_root_url('staff/admin/settings.php')) ?>">System Settings</a><?php endif;?>
</nav>

<div class="sidebar-footer">
    <a href="<?= h(ideare_root_url('auth/logout.php')) ?>">Sign out</a>
</div>
</aside>
