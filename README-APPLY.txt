IDEARE — MATERIAL & FINISH CATALOGUE PATCH
=========================================

Chosen page name:
    Material & Finish Catalogue

Public URL after applying:
    http://localhost/IDEARE%20CREATION/material-catalogue.php

PURPOSE
-------
Replaces the temporary hpl_catalogue_test.php page with a customer-ready,
staff-accessible catalogue that uses the current IdeaRE public website theme.

THE PAGE READS BOTH TABLES
--------------------------
material_catalogue_topmix
material_catalogue_dgtango

No new database table is required.

FILES
-----
material-catalogue.php
    New public catalogue page.

hpl_catalogue_test.php
    Legacy redirect to the new page so old bookmarks do not break.

assets/css/material-catalogue.css
    Catalogue-specific responsive styling built on IdeaRE's current site.css variables.

assets/js/material-catalogue.js
    Product detail dialog, copy-code action and filter behavior.

includes/customer/header.php
    Adds "Materials" to the customer navigation.
    If a staff session is active, "Staff Login" changes to "Staff Portal".

includes/staff/sidebar.php
    Adds "HPL Finish Catalogue ↗" under Procurement & Workshop.
    The existing internal Material Catalogue remains untouched.

FEATURES
--------
- Publicly accessible; no customer or staff login required.
- Staff can access the same catalogue from the staff sidebar.
- Combines Topmix + DGtango.
- Search by code, product name, finish, supplier or brand.
- Filter by supplier, category and series.
- Sort by name, product code, supplier or category.
- 24 products per page with pagination.
- Supplier counts.
- Responsive desktop/tablet/mobile grid.
- Lazy-loaded material images.
- Handles both:
      public/uploads/materials/...
  and older:
      uploads/materials/...
  image paths.
- Missing-image fallback.
- Product details popup.
- Large finish preview.
- Copy product code button.
- Consultation / Cabinet Designer calls to action.
- Physical-sample colour disclaimer.
- Keeps image file paths hidden from customer-facing product details.
- Graceful error screen if catalogue tables are unavailable.

APPLY
-----
1. Extract this ZIP.

2. Copy the files/folders into:
       C:\xampp\htdocs\IDEARE CREATION\

3. Allow Windows to MERGE the folders and REPLACE:
       hpl_catalogue_test.php
       includes\customer\header.php
       includes\staff\sidebar.php

4. Confirm your existing images remain in:
       public\uploads\materials\topmix\
       public\uploads\materials\dgtango\

5. Open:
       http://localhost/IDEARE%20CREATION/material-catalogue.php

6. Test:
   - All materials
   - Topmix supplier filter
   - DGtango supplier filter
   - Category filter
   - Series filter
   - Search by a known product code
   - View finish popup
   - Copy product code
   - Mobile window width

DATABASE EXPECTATION
--------------------
Both supplier tables should have:
    id
    supplier
    brand
    product_code
    product_name
    finish_code
    category
    series
    image_filename
    image_path
    is_active
    created_at
    updated_at

The public page only reads active rows (is_active = 1).

NOT CHANGED
-----------
staff/pages/materials.php remains the internal costing/material master list.
The new Material & Finish Catalogue is the visual HPL finish browser.
