<?php
/**
 * IDEARE route and navigation policy. The role boundary is intentionally
 * enforced on the server, not merely by hiding sidebar links.
 */
function ideare_is_owner_or_manager(?array $staff = null): bool
{
    $staff = $staff ?? current_staff();
    if (!$staff) return false;
    $slug = strtolower(trim((string)($staff['role_slug'] ?? '')));
    return in_array($slug, ['owner', 'manager'], true);
}

/** A restricted page always needs a matching privilege AND its own permission checks. */
function ideare_enforce_staff_route_policy(): void
{
    $path = strtolower(str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? '')));
    if (!preg_match('~/staff/(pages|admin)/([^/]+\.php)$~', $path, $parts)) return;

    // Every staff URL requires an authenticated user, even if a legacy page
    // happens to rely on the common header rather than require_login().
    require_login();
    $file = $parts[2];
    $admin = $parts[1] === 'admin';
    // Legacy quotation settings must never re-enable approvals through POST.
    if ($admin && $file === 'quotation-settings.php' && ($_SERVER['REQUEST_METHOD']??'')==='POST') {
        $_POST['quotation_require_approval_for_non_approvers']='0';
        $_POST['quotation_package_adjustment_requires_approval']='0';
    }

    // Customers and sales are strictly Owner / Manager only.
    $restrictedSales = [
        'customers.php', 'customer-view.php', 'leads.php', 'appointments.php',
        'appointment-file.php', 'finance.php', 'quotations.php',
        'quotation-centre.php', 'quotation-create.php', 'quotation-view.php',
        'quotation-revise.php', 'quotation-version-view.php',
        'quotation-handoff.php',
    ];
    $restrictedWorkshop = [
        'materials.php', 'material-calculator.php', 'bom.php', 'suppliers.php',
        'purchase-orders.php', 'inventory.php', 'production.php',
        'installations.php', 'quality-control.php',
    ];
    // Existing price/finance-related pages elsewhere in the staff suite.
    $restrictedExtra = [
        'salary.php', 'payroll.php', 'salary-advance.php',
        'quotation-settings.php', 'quotation-rate-book.php',
        'quotation-approval-rules.php',
    ];

    if (($admin && $file !== 'task-management.php') ||
        ($parts[1] === 'pages' && (in_array($file, $restrictedSales, true) ||
            in_array($file, $restrictedWorkshop, true) ||
            in_array($file, $restrictedExtra, true)))) {
        if (!ideare_is_owner_or_manager()) {
            render_access_denied(
                'Management access required',
                'This area is available only to the Owner and Manager accounts.'
            );
        }
    }

    // Removed modules should not remain accessible using old bookmarks.
    $removed = $admin
        ? ['approvals.php', 'customer-portal-access.php', 'gallery.php',
           'inspiration.php', 'quotation-approval-rules.php']
        : ['quality-control.php'];
    if (in_array($file, $removed, true)) {
        http_response_code(404);
        render_access_denied('Module retired', 'This module is no longer in use.');
    }
}
