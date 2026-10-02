# IdeaRE Full Operations Suite

This is an overlay package for the existing IdeaRE Creation PHP/XAMPP project. It preserves the existing authentication/passkey system and designer.

## Install
1. Back up the current project and `ideare_db`.
2. Extract this ZIP into `C:\xampp\htdocs\IDEARE CREATION\`, allowing files to merge/replace.
3. In phpMyAdmin, import `database/ideare_full_32_feature_schema.sql`. It is designed as an additive/idempotent migration.
4. Sign into the Staff Portal and use the expanded sidebar.

## Main module pages
- CRM: `staff/pages/customers.php`, `leads.php`, `customer-view.php`
- Projects: `projects.php`, `project-view.php`, `site-measurements.php`
- BOM/materials: `bom.php`, `materials.php`
- Procurement: `suppliers.php`, `purchase-orders.php`, `inventory.php`
- Delivery: `production.php`, `quality-control.php`, `installations.php`
- Workforce: `tasks.php`, `staff/admin/task-management.php`, `calendar.php`
- Sales/finance: `quotation-centre.php`, `staff/admin/approvals.php`, `finance.php`
- Records: `documents.php`, `warranty.php`
- Management: `staff/admin/management-dashboard.php`, `roles.php`, `staff/pages/search.php`
- Public: updated root `index.php`, `pages/book-appointment.php`, `projects.php`, `inspiration.php`, `customer-portal.php`
- Customer portal access: `staff/admin/customer-portal-access.php`
- Public content management: `staff/admin/gallery.php`, `inspiration.php`

## Important
This package uses the established database name `ideare_db`. The UI is intentionally compatible with the existing PDO/auth helpers. Public gallery and appointment pages are additive; link them from the existing public navbar/homepage where desired.
