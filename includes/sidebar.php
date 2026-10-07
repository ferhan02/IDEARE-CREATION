<?php
$path = str_replace('\\','/', $_SERVER['PHP_SELF'] ?? '');
function nav_active(string $needle): string {
    global $path;
    return str_contains($path, $needle) ? 'active' : '';
}
?>
<aside class="sidebar" id="sidebar">
  <div class="brand-wrap">
    <a class="brand logo-link" href="<?= h(base_url('staff/index.php')) ?>" aria-label="IDEARE Staff Portal">
      <img class="brand-logo-image sidebar-brand-logo" src="<?= h(base_url('assets/images/ideare-logo.png')) ?>" alt="IDEARE">
    </a>
    <span>Staff Portal</span>
  </div>

  <nav>
    <p class="nav-label">Overview</p>
    <a class="<?= nav_active('/staff/index.php') ?>" href="<?= h(base_url('staff/index.php')) ?>">Dashboard</a>

    <p class="nav-label">Work</p>
    <?php if (can('task.view_own')): ?><a class="<?= nav_active('/tasks.php') ?>" href="<?= h(base_url('staff/pages/tasks.php')) ?>">My Tasks</a><?php endif; ?>
    <?php if (can('design.view_assigned')): ?><a class="<?= nav_active('/designs.php') ?>" href="<?= h(base_url('staff/pages/designs.php')) ?>">Assigned Designs</a><?php endif; ?>
    <a href="<?= h(base_url('../ideare-cabinet-designer-demo/designer.php')) ?>">Cabinet Designer ↗</a>

    <p class="nav-label">Attendance & requests</p>
    <?php if (can('attendance.view_own')): ?><a class="<?= nav_active('/attendance.php') ?>" href="<?= h(base_url('staff/pages/attendance.php')) ?>">Attendance</a><?php endif; ?>
    <?php if (can('leave.view_own')): ?><a class="<?= nav_active('/leave.php') ?>" href="<?= h(base_url('staff/pages/leave.php')) ?>">Leave</a><?php endif; ?>
    <?php if (can('overtime.view_own')): ?><a class="<?= nav_active('/overtime.php') ?>" href="<?= h(base_url('staff/pages/overtime.php')) ?>">Overtime</a><?php endif; ?>
    <?php if (can('salary_advance.view_own')): ?><a class="<?= nav_active('/salary-advance.php') ?>" href="<?= h(base_url('staff/pages/salary-advance.php')) ?>">Salary Advance</a><?php endif; ?>
    <?php if (can('salary.view_own')): ?><a class="<?= nav_active('/salary.php') ?>" href="<?= h(base_url('staff/pages/salary.php')) ?>">My Salary</a><?php endif; ?>

    <p class="nav-label">Company</p>
    <?php if (can('announcement.view')): ?><a class="<?= nav_active('/announcements.php') ?>" href="<?= h(base_url('staff/pages/announcements.php')) ?>">Announcements</a><?php endif; ?>
    <a class="<?= nav_active('/profile.php') ?>" href="<?= h(base_url('staff/pages/profile.php')) ?>">My Profile</a>

    <?php if (can('staff.view') || can('attendance.view_all') || can('leave.approve') || can('salary.manage')): ?>
    <p class="nav-label">Management</p>
    <?php if (can('dashboard.management')): ?><a class="<?= nav_active('/management-dashboard.php') ?>" href="<?= h(base_url('staff/admin/management-dashboard.php')) ?>">Management Dashboard</a><?php endif; ?>
    <?php if (can('design.view_all')): ?><a class="<?= nav_active('/all-designs.php') ?>" href="<?= h(base_url('staff/admin/all-designs.php')) ?>">All Customer Designs</a><?php endif; ?>
    <?php if (can('staff.view')): ?><a class="<?= nav_active('/staff-management.php') ?>" href="<?= h(base_url('staff/admin/staff-management.php')) ?>">Staff Management</a><?php endif; ?>
    <?php if (can('attendance.view_all')): ?><a class="<?= nav_active('/attendance-management.php') ?>" href="<?= h(base_url('staff/admin/attendance-management.php')) ?>">Attendance Management</a><?php endif; ?>
    <?php if (can('leave.approve')): ?><a class="<?= nav_active('/leave-approvals.php') ?>" href="<?= h(base_url('staff/admin/leave-approvals.php')) ?>">Leave Approvals</a><?php endif; ?>
    <?php if (can('overtime.approve')): ?><a class="<?= nav_active('/overtime-approvals.php') ?>" href="<?= h(base_url('staff/admin/overtime-approvals.php')) ?>">Overtime Approvals</a><?php endif; ?>
    <?php if (can('salary_advance.approve')): ?><a class="<?= nav_active('/salary-advance-approvals.php') ?>" href="<?= h(base_url('staff/admin/salary-advance-approvals.php')) ?>">Advance Approvals</a><?php endif; ?>
    <?php if (can('design.assign')): ?><a class="<?= nav_active('/design-assignments.php') ?>" href="<?= h(base_url('staff/admin/design-assignments.php')) ?>">Design Assignments</a><?php endif; ?>
    <?php if (can('task.create')): ?><a class="<?= nav_active('/task-management.php') ?>" href="<?= h(base_url('staff/admin/task-management.php')) ?>">Task Management</a><?php endif; ?>
    <?php endif; ?>

    <?php if (can('salary.manage') || can('announcement.manage') || can('activity.view') || can('settings.manage')): ?>
    <p class="nav-label">Boss / Admin</p>
    <?php if (can('salary.manage')): ?><a class="<?= nav_active('/payroll.php') ?>" href="<?= h(base_url('staff/admin/payroll.php')) ?>">Payroll</a><?php endif; ?>
    <?php if (can('announcement.manage')): ?><a class="<?= nav_active('/announcements-management.php') ?>" href="<?= h(base_url('staff/admin/announcements-management.php')) ?>">Manage Announcements</a><?php endif; ?>
    <?php if (can('activity.view')): ?><a class="<?= nav_active('/activity-logs.php') ?>" href="<?= h(base_url('staff/admin/activity-logs.php')) ?>">Activity Logs</a><?php endif; ?>
    <?php if (can('settings.manage')): ?><a class="<?= nav_active('/settings.php') ?>" href="<?= h(base_url('staff/admin/settings.php')) ?>">System Settings</a><?php endif; ?>
    <?php endif; ?>
  </nav>

  <div class="sidebar-footer">
    <a href="<?= h(base_url('auth/logout.php')) ?>">Sign out</a>
  </div>
</aside>
