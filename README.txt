IDEARE MATERIAL COSTING + QUOTATION PAGE PATCH
==============================================

Target project:

C:\xampp\htdocs\IDEARE CREATION\


BEFORE INSTALLING
-----------------

This patch assumes you have already run the SQL that creates:

material_categories
materials
material_sizes
material_cost_history
material_calculations
material_calculation_items
cutting_jobs
cutting_job_parts
quotations
quotation_items
quotation_charges
quotation_charge_presets
quotation_status_history

and the new material/quotation permissions.


INSTALL
-------

1. Extract this ZIP.

2. Copy the contents into:

   C:\xampp\htdocs\IDEARE CREATION\

3. Allow Windows to replace:

   includes\staff\sidebar.php

4. Add this ONE line to the <head> section of:

   includes\staff\header.php

   directly after your existing staff.css / staff-alerts.css links:

   <link rel="stylesheet" href="<?= h(ideare_root_url('assets/css/costing-quotation.css')) ?>">

That is the only manual merge step, because your current header already contains the
SweetAlert2/staff UI changes and this patch avoids overwriting them.


NEW STAFF PAGES
---------------

Material calculator:

http://localhost/IDEARE%20CREATION/staff/pages/material-calculator.php

Quotation list:

http://localhost/IDEARE%20CREATION/staff/pages/quotations.php

Create quotation:

http://localhost/IDEARE%20CREATION/staff/pages/quotation-create.php


NEW MANAGEMENT PAGES
--------------------

Material catalogue:

http://localhost/IDEARE%20CREATION/staff/admin/materials.php

Quotation settings:

http://localhost/IDEARE%20CREATION/staff/admin/quotation-settings.php


MATERIAL CALCULATOR FEATURES
----------------------------

- select material from database
- standard material sizes
- material quantity
- unit cost
- default/custom waste %
- sheet material panel entry
- rough sheet requirement based on panel area
- calculate material cost
- calculate waste allowance
- save material calculation
- link calculation to saved customer design
- create cutting jobs / parts records for sheet materials
- recent saved calculations
- normal staff sees own calculations
- authorized management can see all


IMPORTANT ABOUT SHEET WASTE
---------------------------

This first version is NOT a true 2D nesting optimizer yet.

It estimates number of sheets using:
required panel area + waste allowance / sheet area

The cutting_jobs and cutting_job_parts tables are populated so we can build
the visual 2D optimizer next without redesigning the database.


QUOTATION BUILDER FEATURES
--------------------------

- customer details
- link saved cabinet design
- link saved material calculation
- customer quotation line items
- material / cabinet / hardware / labour / installation / delivery / service items
- saved quotation charge presets
- fixed charges
- percentage charges
- internal-only charges
- overhead %
- markup %
- target gross margin %
- fixed profit option
- fixed or percentage discount
- tax %
- internal notes
- customer notes
- terms and conditions
- live totals
- permission-aware internal cost information


QUOTATION VIEW FEATURES
-----------------------

- customer-facing quotation layout
- printable / browser Save as PDF layout
- internal cost section visible only to permitted users
- quotation status workflow
- approval permission check
- quotation status history


PERMISSIONS USED
----------------

material.calculate
material.view_all
material.manage

quotation.create
quotation.view
quotation.view_cost
quotation.view_margin
quotation.edit_margin
quotation.discount
quotation.approve
quotation.settings


SWEETALERT2
-----------

If your earlier IdeaRE SweetAlert patch is installed, confirmation prompts on
these pages automatically use IdeaREAlert.

If it is not installed, the pages still function and use normal browser behavior.


FIRST TEST
----------

Login as:

owner@ideare.local

Then:

1. Open Material Catalogue
2. Check that starter materials exist
3. Open Material Calculator
4. Add materials and save a MAT- calculation
5. Open Quotations
6. New quotation
7. Select the saved material calculation
8. Add customer-facing cabinet/work lines
9. Add Installation and Delivery presets
10. Save quotation
11. Print / Save PDF from the quotation view
