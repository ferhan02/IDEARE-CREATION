<?php
$path=str_replace('\\','/',$_SERVER['PHP_SELF']??'');
function nav_active(string $needle):string{global $path;return str_contains($path,$needle)?'active':'';}
?>
<aside class="sidebar" id="sidebar">
    <div class="brand-wrap">
        <a class="brand" href="<?=h(ideare_root_url('staff/index.php'))?>">IdeaRE</a>
        <span>Staff Portal</span>
    </div>

    <div class="sidebar-nav-search" role="search">
        <div class="sidebar-nav-search-box">
            <svg class="sidebar-nav-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input
                id="sidebarNavSearch"
                type="search"
                placeholder="Find a page..."
                aria-label="Filter staff navigation"
                autocomplete="off"
                spellcheck="false"
            >
            <button id="sidebarNavSearchClear" class="sidebar-nav-search-clear" type="button" aria-label="Clear navigation search" title="Clear search">×</button>
        </div>
        <div id="sidebarNavSearchHint" class="sidebar-nav-search-hint" aria-live="polite"></div>
    </div>

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
        <a href="<?=h(ideare_root_url('staff/pages/suppliers.php'))?>">Suppliers</a>
        <a href="<?=h(ideare_root_url('staff/pages/purchase-orders.php'))?>">Purchase Orders</a>
        <a href="<?=h(ideare_root_url('staff/pages/inventory.php'))?>">Inventory</a>
        <a href="<?=h(ideare_root_url('staff/pages/production.php'))?>">Production Board</a>
        <a href="<?=h(ideare_root_url('staff/pages/quality-control.php'))?>">Quality Control</a>
        <a href="<?=h(ideare_root_url('staff/pages/installations.php'))?>">Installations</a>

        <p class="nav-label">Work</p>
        <a href="<?=h(ideare_root_url('staff/pages/tasks.php'))?>">My Tasks</a>
        <a href="<?=h(ideare_root_url('staff/admin/task-management.php'))?>">Task Management</a>
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

        <div id="sidebarNavNoResults" class="sidebar-nav-no-results" hidden>
            <strong>No page found</strong>
            <span>Try another keyword.</span>
        </div>
    </nav>

    <div class="sidebar-footer"><a href="<?=h(ideare_root_url('auth/logout.php'))?>">Sign out</a></div>
</aside>

<script>
(function () {
    const input = document.getElementById('sidebarNavSearch');
    const clearButton = document.getElementById('sidebarNavSearchClear');
    const nav = document.getElementById('staffNavigation');
    const emptyState = document.getElementById('sidebarNavNoResults');
    const hint = document.getElementById('sidebarNavSearchHint');

    if (!input || !nav) return;

    const links = Array.from(nav.querySelectorAll(':scope > a'));
    const labels = Array.from(nav.querySelectorAll(':scope > .nav-label'));

    const normalise = value => String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    function applyFilter() {
        const query = normalise(input.value);
        let visibleCount = 0;

        links.forEach(link => {
            const haystack = normalise(link.textContent + ' ' + (link.dataset.search || ''));
            const matches = !query || haystack.includes(query);
            link.hidden = !matches;
            if (matches) visibleCount++;
        });

        labels.forEach(label => {
            let sibling = label.nextElementSibling;
            let hasVisibleLink = false;

            while (sibling && !sibling.classList.contains('nav-label')) {
                if (sibling.tagName === 'A' && !sibling.hidden) {
                    hasVisibleLink = true;
                    break;
                }
                sibling = sibling.nextElementSibling;
            }

            label.hidden = !hasVisibleLink;
        });

        if (emptyState) emptyState.hidden = !query || visibleCount > 0;
        if (clearButton) clearButton.classList.toggle('visible', Boolean(query));

        if (hint) {
            hint.textContent = query
                ? (visibleCount === 1 ? '1 page found' : visibleCount + ' pages found')
                : '';
        }
    }

    input.addEventListener('input', applyFilter);

    if (clearButton) {
        clearButton.addEventListener('click', function () {
            input.value = '';
            applyFilter();
            input.focus();
        });
    }

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            input.value = '';
            applyFilter();
            input.blur();
        }

        if (event.key === 'Enter') {
            const firstVisible = links.find(link => !link.hidden);
            if (firstVisible && input.value.trim()) {
                event.preventDefault();
                firstVisible.click();
            }
        }
    });

    document.addEventListener('keydown', function (event) {
        const target = event.target;
        const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;

        if (!typing && event.key === '/') {
            event.preventDefault();
            input.focus();
        }
    });
})();
</script>
