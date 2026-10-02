IDEARE CREATION — CRM / PROJECTS PHASE 1
=======================================

INSTALL
1. Back up your current IdeaRE project and database.
2. Extract this ZIP into your existing project root:
   C:\xampp\htdocs\IDEARE CREATION\
   Allow matching files to be replaced.
3. In phpMyAdmin select ideare_staff_db and run:
   database/add_crm_projects.sql
4. Sign in to the Staff Portal and use the new navigation sections:
   Customers & Sales / Projects / Staff Calendar.

IMPORTANT
- This package assumes the earlier staff portal, material/quotation tables,
  passkey update and SweetAlert/UI patches are already installed.
- The SQL migration adds CRM/project tables and project/customer links to tasks.
- This is phase 1 of the approved feature roadmap, not the entire roadmap.

PHASE 1 — 10 PRIORITY PAGES
[✓] staff/pages/customers.php        Customer / Lead CRM list + creation
[✓] staff/pages/customer-view.php    Customer profile, lead, follow-ups, projects
[✓] staff/pages/leads.php            Sales pipeline board
[✓] staff/pages/projects.php         Project register
[✓] staff/pages/project-view.php     Project workspace + activity + tasks
[✓] staff/pages/site-measurements.php Site survey / measurements
[✓] staff/pages/materials.php        Staff-readable material catalogue
[✓] staff/pages/tasks.php            Employee tasks linked to projects/customers
[✓] staff/pages/calendar.php         Staff work calendar
[✓] staff/pages/notifications.php    Improved notification centre

APPROVED FEATURE CHECKLIST
[✓] Customer / Lead CRM
[✓] Leads / Sales Pipeline
[✓] Follow-Up System
[✓] Project Management
[✓] Measurement / Site Survey
[ ] Cabinet Configurator → Project Integration
[ ] Automatic Bill of Materials
[✓] Material Catalogue
[ ] Suppliers
[ ] Purchase Orders
[ ] Inventory
[ ] Production Board
[ ] Quality Control
[ ] Installation Scheduling
[✓] Employee Task Management
[✓] Staff Calendar
[ ] Customer Appointments
[✓] Improved Quotation System (from previous update)
[ ] Quotation Versions
[ ] Approval Workflow
[ ] Payments / Invoices
[ ] Customer Portal
[✓] Project Activity Timeline (included in project workspace)
[✓] Internal Notes (customer/project notes foundation included)
[ ] Document Centre
[ ] Warranty / After-Sales
[✓] Business Dashboard (existing staff management dashboard)
[✓] Notification Centre
[✓] Permissions / Roles (existing role/permission system)
[ ] Global Search
[ ] Homepage Project Gallery
[ ] Cabinet Inspiration Gallery

NEW DATABASE TABLES
- customers
- leads
- follow_ups
- projects
- project_activity
- site_measurements

TASK UPGRADES
- tasks.project_id
- tasks.customer_id

NOTES
- Creating a customer also creates a lead automatically.
- A customer profile can schedule follow-ups and create projects.
- Project pages can create project-linked employee tasks.
- Project task assignment creates a staff notification.
- Site measurements are stored against projects.
- Staff Calendar combines assigned tasks, follow-ups and managed project targets.
