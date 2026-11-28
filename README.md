# IDEARE Creation

**Spaces that inspire. Built to belong.**

A customer-facing construction, interior design and custom cabinetry website with interactive 3D design studios, project showcases, material catalogues and consultation booking. IDEARE connects inspiration and early project planning with professional design, construction and installation services in Malaysia.

[Repository](https://github.com/ferhan02/IDEARE-CREATION) · PHP · MySQL/MariaDB · JavaScript · Three.js

## Contents

- [Project overview](#project-overview)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Database and storage](#database-and-storage)
- [Installation](#installation)
- [How to use](#how-to-use)
- [Maintenance and deployment](#maintenance-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Current scope and limitations](#current-scope-and-limitations)

## Project overview

IDEARE Creation is a digital showroom and project enquiry platform, not a fixed-price furniture store. Customers can explore completed work, discover interior styles, compare real material finishes, plan a home or custom cabinetry, and share their requirements with IDEARE for professional review.

The platform brings together five service disciplines:

| Discipline | Purpose |
| --- | --- |
| Consultation | Understand requirements, site conditions, preferences and budget. |
| 3D design | Visualise the proposed layout and design direction before committing to work. |
| Construction | Building, renovation and site execution, from foundation to finishing. |
| Interior design | Coordinate spatial planning, finishes, fittings and the overall interior experience. |
| Custom cabinetry and furniture | Design and manufacture fitted storage and furniture tailored to the actual space. |

The intended customer journey is **Discover → Explore → Design → Select materials → Consult → Professional review → Project execution**. The final construction and manufacturing stages take place through IDEARE's professional services, rather than being automatically executed by the website.

## Features

### 1. Public website and digital showroom

- Animated homepage presenting the company, services, project journey, portfolio, inspiration, design tools, material catalogues and contact options.
- Scroll-driven service storytelling and section-based desktop navigation.
- Dedicated About, Services, Portfolio, Inspiration, Contact and location pages.
- Interactive portfolio exhibition with project and photograph navigation, detailed project views and responsive gestures.
- Local image collections for Design & Build and Property projects, including residential, commercial, hospitality, industrial and institutional work.
- Additional database-driven completed-project gallery, displaying published entries with featured ordering.
- Shared navigation, footer, WhatsApp contact access and location information.
- Light and dark appearance preferences stored in the browser.
- Device-tailored CSS and JavaScript for desktop, tablet and phone, sharing the same PHP pages and image assets.

### 2. Interior and cabinet inspiration

Interactive concept galleries help visitors discover a visual direction for kitchens, bedrooms and living rooms. The repository includes these concept image collections:

| | | |
| --- | --- | --- |
| Contemporary Luxury | Japandi | Mid-Century Modern |
| Modern Classic | Modern Contemporary | Modern Farmhouse |
| Modern Industrial | Modern Luxury | Modern Minimalist |
| Modern Tropical | Muji | Organic Modern |
| Scandinavian | Wabi Sabi | |

The inspiration experience includes an animated orbit/showroom presentation, browsing controls, device-specific interactions and database-backed inspiration designs where available. Images are organised under `assets/images/Concepts/`.

### 3. 3D Space & Cabinet Designer

**Entry point:** [`designer/index.php`](designer/index.php)

An interactive room and custom cabinetry planner with four stages: Room shape, Define space, Make it yours and Finalize. Unlike a standard fixed-size cabinet catalogue, this studio is designed around custom dimensions and professional verification.

| Area | Capabilities |
| --- | --- |
| Room planning | Rectangular, notched, angled, open-plan, L-shaped and U-style room options; editable floor plan dimensions and ceiling height. |
| Cabinet selection | Database-backed categories and templates, including configured base, upper, tall and specialty units when present in the catalogue. |
| Custom dimensions | Adjustable cabinet measurements subject to template limits; editable placement and orientation. |
| Fronts and storage | Door configurations, drawer fronts, handles, open shelving, partitions, adjustable shelf positions and internal drawers. |
| Materials | Carcass selections, HPL finishes, worktop materials and stone catalogue searches. |
| Fittings and finishing | Worktops, plinths, shared cabinet runs and other configurable finishing elements. |
| Appliances and furniture | Concept appliances, dining furniture and accessories, with object-specific selection and editing tools. |
| 3D interaction | Orbit, floor plan and walkthrough views; zoom, recenter, grid and wall visibility controls. |
| Editing | Move, rotate, replace, duplicate, remove, undo/redo, item list and contextual details. |
| Visual selection | Preview-oriented catalogue and item interfaces, with layered studio popups. |
| Saving | Local browser draft backup and database-backed editable designs with revisions. |
| Handoff | Design summary, validation findings, concept PDF export and customer submission for consultation. |

No customer account is required for the studio's save/submit workflow. Customer contact information is required for server-side editable saves. A private edit link provides access to the saved design; it should not be shared publicly.

The generated concept is not a production drawing, final quotation or verified installation plan. Template constraints and validation findings assist planning but do not replace a site measurement or manufacturing review.

### 4. Home Design Studio

**Entry point:** [`home-configurator/index.php`](home-configurator/index.php) (native builder at `home-configurator/build.php`).

A separate concept planner for larger-scale home planning, with three stages:

- **Define land:** enter land width and length, assumed clearances and site information; inspect the plot in 3D.
- **Build home:** configure the home layout and floors, use available construction and furnishing tools, and inspect the concept using interactive camera and editing controls.
- **Finalize:** review the design, select a Standard, Executive or Luxury specification package, view an indicative investment estimate and submit contact details and the plan to IDEARE.

The native studio uses Three.js and its own catalogue and planning scripts. The submitted concept is stored as a JSON lead with a generated reference in a private server directory. This is a distinct workflow from the cabinet designer's relational database save process.

An optional Planner 5D partner integration is present but guarded by configuration. The native builder is not dependent on activating that integration. Land boundaries, setbacks, structural feasibility and final construction costs require professional verification. Estimates are illustrative and exclude land purchase and abnormal works.

### 5. Material catalogues

**Entry point:** [`material-catalogue.php`](material-catalogue.php)

| Catalogue | Features |
| --- | --- |
| HPL (`hpl-catalogue.php`) | Search by product details, filter by supplier/category/series, sort results and open finish previews. |
| Stone (`stone-catalogue.php`) | Browse sintered stone and quartz products; filter by stone type, surface and thickness; view product details. |

Customers can inspect product images and details, copy product codes and bring shortlisted finishes to a consultation. The cabinet designer also queries real catalogue products for material selections. Product availability, physical colour accuracy, pricing and suitability should be confirmed with IDEARE and actual samples.

### 6. Consultation booking

**Entry point:** [`pages/book-appointment.php`](pages/book-appointment.php)

The booking form collects project requirements, meeting preferences and contact details in stages. It supports project/property type, stage, focus, size, budget, location, appointment type, consultation method, preferred and alternative dates, notes, contact preference and reference attachments.

The server validates submissions, checks consent, applies CSRF protection and basic repeat-submission controls, and records the request and attachment metadata in the database. Dates use the `Asia/Kuala_Lumpur` time zone and must be in the future, within 12 months. Site measurement requests require an on-site meeting. A submitted request is not a guarantee of confirmed availability; IDEARE must follow up.

### 7. Responsive and visual experience

The customer header loads shared styling and device-specific layouts based on viewport width:

| Layout | Viewport |
| --- | --- |
| Desktop | 1200 px and above |
| Tablet | 768–1199 px |
| Phone | 767 px and below |

The project uses separate responsive CSS/JS for the main experience and specialised portfolio/inspiration interactions. The desktop design targets a full-viewport presentation at normal browser zoom. Actual fit and 3D performance depend on screen dimensions, browser and graphics hardware.

## Technology stack

| Layer | Technology |
| --- | --- |
| Server | PHP 8.1+ (PHP 8.2+ recommended), Apache |
| Database | MySQL or MariaDB, PDO with MySQL driver, `utf8mb4` |
| Frontend | HTML, CSS, vanilla JavaScript, SVG |
| 3D visualisation | Three.js 0.160.1, WebGL, OrbitControls in the cabinet studio |
| PDF export | jsPDF 2.5.2 |
| Client storage | Browser localStorage for theme and cabinet draft backup |
| Development environment | XAMPP, phpMyAdmin, Git |
| External resources | jsDelivr CDN, Google Fonts, map/contact links and optional Planner 5D |

The primary PHP pages run directly under Apache. No mandatory npm build or Composer installation is indicated for the current customer-facing application. Internet access is needed for CDN-hosted dependencies unless they are hosted locally.

## Project structure

```text
IDEARE-CREATION/
├── index.php                     # Homepage
├── ideare_db.sql                 # Bundled database schema and data
├── designer.php                  # Additional designer entry point
├── material-catalogue.php        # Catalogue landing page
├── hpl-catalogue.php              # HPL browser
├── stone-catalogue.php            # Stone browser
├── pages/                        # Customer-facing pages and booking
├── public/
│   ├── pages/                    # Public page implementations
│   └── uploads/materials/        # Material product images
├── designer/
│   ├── index.php                 # 3D cabinet design studio
│   └── api/                      # Additional designer endpoints
├── home-configurator/
│   ├── index.php                 # Home studio entry
│   ├── build.php                 # Native builder
│   ├── submit.php                # Home concept lead handler
│   └── planner5d-*.php            # Optional integration and diagnostics
├── api/
│   ├── designer3d/               # Catalogue, materials, save/load, PDF and CSRF
│   └── *.php                     # Other public catalogue and content endpoints
├── config/                       # PDO database connection helpers
├── includes/
│   ├── customer/                 # Shared layout, booking and public helpers
│   └── catalogue/                # Catalogue query helpers
├── assets/
│   ├── css/                      # Themes, components and responsive layouts
│   ├── js/                       # Interactions, design engines and responsive logic
│   └── images/                   # Branding, concepts, services and portfolio
├── uploads/                      # Runtime uploads and protected directories
├── ideare-cabinet-update/          # Historical update utilities
├── ideare-popup-update/            # Historical update utilities
└── README.md
```

Historical update scripts and `.bak` files are not normal customer entry points. Do not rerun them blindly or expose them in production.

## Database and storage

The application expects a database named `ideare_db`. Both `config/db.php` and `config/databases.php` contain PDO connection definitions. Update both consistently when changing database credentials or host.

The following table groups are referenced by the current source; this is a dependency inventory, not a complete SQL schema or migration script.

| Module | Referenced tables |
| --- | --- |
| Cabinet catalogue | `cabinet_categories`, `cabinet_templates`, `door_styles`, `handles`, `finishes` |
| Design records | `designs`, `design_items`, `designer_rooms`, `designer_room_features` |
| Detailed configuration | `designer_components`, `designer_material_selections`, `designer_shared_elements`, `designer_shared_element_items` |
| Revision, validation and access | `designer_revisions`, `designer_validation_findings`, `designer_access_tokens`, `designer_documents` |
| Inspiration and gallery | `inspiration_designs`, `project_gallery_entries` |
| Consultation booking | `customer_appointments`, `customer_appointment_details`, `customer_appointment_attachments` |
| Material catalogues | Supplier-specific HPL tables and `casero_stone_sintered`, `casero_stone_quartz` |

Cabinet saves persist the scene and related configuration records, including revisions and hashed access tokens. Home design leads are written separately as JSON files. Keep a consistent backup of database records and their corresponding uploaded images/documents.

The root-level [`ideare_db.sql`](ideare_db.sql) contains the database export (36 tables), including the cabinet and HPL catalogue data, inspiration records, design tables, and appointment tables. It was exported from MariaDB 10.4.32 using phpMyAdmin 5.2.3. It does **not** contain a `CREATE DATABASE` or `USE` statement, so create and select `ideare_db` before importing it. The presence of a table does not guarantee it contains products or other records; for example, the stone tables are included but have no seed inserts in the reviewed export.

> **Release privacy:** The current SQL export includes inserts into customer, appointment and saved-design tables. Before distributing a public release, verify that all such records are synthetic demo data or replace the export with a sanitized schema and catalogue seed dataset. Never distribute actual customer information, private designs, passwords or access credentials. Do not overwrite an existing operational database with the bundled dump.

## Installation

This guide is for a first-time user downloading an IDEARE Creation release on Windows. No programming experience, Git, Node.js, npm or Composer is needed for the standard installation. The website runs locally on your computer using XAMPP; an internet connection is needed to download the files and load externally hosted fonts and 3D libraries.

**Quick overview:** Download the release → Install XAMPP → Extract the website → Start Apache and MySQL → Create and import the database → Open the website in your browser.

### Step 1 — Download IDEARE Creation

1. Go to the [IDEARE Creation Releases page](https://github.com/ferhan02/IDEARE-CREATION/releases).
2. Open the release you want to install (normally the latest stable release).
3. Under **Assets**, download the project's installation ZIP if one is provided. Otherwise, download **Source code (zip)**, provided that the release includes `ideare_db.sql` and the complete website files.
4. Save the ZIP file to your Downloads folder. You do not need to install Git or clone the repository.

If no suitable release has been published yet, open the [main repository](https://github.com/ferhan02/IDEARE-CREATION), click the green **Code** button, then choose **Download ZIP**. This downloads the current development snapshot rather than a versioned release. Make sure the downloaded version contains `ideare_db.sql` before continuing.

### Step 2 — Download and install XAMPP

1. Visit the [official XAMPP download page](https://www.apachefriends.org/download.html).
2. Download XAMPP for Windows with PHP 8.2 or a newer compatible PHP version (the website requires PHP 8.1 or newer).
3. Run the downloaded XAMPP installer. Allow the installer to run if Windows asks for permission.
4. In the component selection screen, make sure **Apache**, **MySQL**, **PHP** and **phpMyAdmin** are installed. XAMPP labels its MariaDB service as MySQL.
5. Use the default installation folder `C:\xampp` for this guide.
6. Finish the installation and open **XAMPP Control Panel**.

If XAMPP is already installed with a compatible PHP version, you can skip this step. The required PHP extensions are `pdo_mysql`, `mbstring`, `fileinfo` and session support.

### Step 3 — Extract the website into XAMPP

1. Open File Explorer and go to your Downloads folder.
2. Right-click the downloaded IDEARE ZIP and select **Extract All**.
3. Open the extracted folder. GitHub may name it `IDEARE-CREATION-main` or include the release version in the folder name.
4. Open `C:\xampp\htdocs` in File Explorer.
5. Create a new folder named `IDEARE CREATION` inside `htdocs`.
6. Copy **all the contents** of the extracted website folder into `C:\xampp\htdocs\IDEARE CREATION`.

Your folder should look like this (other project files and folders are omitted here for clarity):

```text
C:\xampp\htdocs\IDEARE CREATION\
├── index.php
├── ideare_db.sql
├── README.md
├── assets\
├── config\
├── includes\
├── pages\
├── designer\
├── home-configurator\
├── api\
├── public\
└── uploads\
```

**Important:** `index.php` and `ideare_db.sql` must be directly inside the `IDEARE CREATION` folder. Do not leave another `IDEARE-CREATION-main` or release-version folder nested inside it. If you installed XAMPP somewhere other than `C:\xampp`, use that installation's `htdocs` directory instead.

### Step 4 — Start Apache and MySQL

1. Open **XAMPP Control Panel** from the Windows Start menu (or run `C:\xampp\xampp-control.exe`).
2. In the Apache row, click **Start**.
3. In the MySQL row, click **Start**.
4. Confirm that both modules are running (normally highlighted in green with process IDs and ports displayed).
5. Open Chrome, Edge or Firefox and visit [http://localhost/](http://localhost/) to confirm Apache is working.

Keep both services running while using the website. If either service fails to start, check the XAMPP log for port conflicts. If Apache is configured on a different port, such as 8080, use `http://localhost:8080/` instead throughout this guide.

### Step 5 — Create the IDEARE database

1. In your web browser, open [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/). You can also click **Admin** next to MySQL in XAMPP.
2. In the left sidebar, click **New** (or open the **Databases** tab).
3. In the database name field, enter exactly `ideare_db`.
4. Select `utf8mb4_general_ci` or another available compatible `utf8mb4` collation.
5. Click **Create**.
6. In the left sidebar, click the newly created `ideare_db` database.

The database name must match the website's PHP configuration. The bundled SQL file does not create or select the database for you. If `ideare_db` already exists, do not delete or import over it without backing it up and checking whether the data needs to be preserved. The next step assumes a fresh, empty database.

### Step 6 — Import the included SQL file

1. With `ideare_db` selected in phpMyAdmin, click the **Import** tab at the top.
2. Under **File to import**, click **Choose File** or **Browse**.
3. Navigate to `C:\xampp\htdocs\IDEARE CREATION\ideare_db.sql` and select it.
4. Leave the format set to **SQL** and the character set at UTF-8.
5. Scroll to the bottom and click **Import** (called **Go** in some phpMyAdmin versions).
6. Wait for phpMyAdmin to finish and check for a successful import message. If there is an error, resolve it before using database-dependent features.
7. Expand `ideare_db` in the left sidebar. Tables such as `cabinet_templates`, `designs`, `topmix`, `dgtango`, `inspiration_designs` and `customer_appointments` should now appear. The reviewed export contains 36 tables; other releases may have a different count.

You do not need to download a separate SQL file or manually create each table. A blank database without the SQL import is not enough to run the catalogue, saving and booking features.

### Step 7 — Check the database connection (normally no changes needed)

The included PHP configuration is already set up for a default local XAMPP installation:

| Setting | Default value |
| --- | --- |
| Database host | `localhost` |
| Database name | `ideare_db` |
| MySQL username | `root` |
| MySQL password | Empty (no password) |
| Character set | `utf8mb4` |

If you installed XAMPP using its standard local settings, proceed to Step 8. If your MySQL username, password, hostname or port is different, open these two files in a text editor and update both PDO connection definitions to match your own server:

- `config/db.php`
- `config/databases.php`

The default empty-password root account is intended only for an isolated local development installation. Do not use it for a public website.

### Step 8 — Open the IDEARE Creation website

Make sure Apache and MySQL are still running. Open your browser and enter this address:

**[http://localhost/IDEARE%20CREATION/](http://localhost/IDEARE%20CREATION/)**

You can also open [http://localhost/IDEARE%20CREATION/index.php](http://localhost/IDEARE%20CREATION/index.php).

The IDEARE homepage should appear. You have now completed the basic installation. Do not double-click `index.php` in File Explorer; PHP pages must be served through Apache, not opened using a `file:///` URL.

If you chose a different project folder name, change the URL to match. For example, if your folder is `C:\xampp\htdocs\IDEARE-CREATION`, use `http://localhost/IDEARE-CREATION/` instead. `%20` represents the space in `IDEARE CREATION`.

### Step 9 — Verify that the website works

Use the following pages to check the installation. All paths below are relative to `http://localhost/IDEARE%20CREATION/`.

| Page | Local URL path |
| --- | --- |
| Homepage | `index.php` |
| About | `pages/about.php` |
| Services | `pages/services.php` |
| Portfolio | `pages/portfolio.php` |
| Inspiration | `pages/inspiration.php` |
| Completed projects | `pages/projects.php` |
| Cabinet design studio | `designer/index.php` |
| Home design studio | `home-configurator/index.php` |
| Material catalogue | `material-catalogue.php` |
| HPL catalogue | `hpl-catalogue.php` |
| Stone catalogue | `stone-catalogue.php` |
| Book consultation | `pages/book-appointment.php` |
| Contact | `pages/contact.php` |
| Location | `pages/where-we-are.php` |

- Open the homepage and switch between light and dark modes.
- Open the HPL catalogue and confirm products are displayed; the stone catalogue needs separate product rows if the imported release contains only empty stone tables.
- Launch the cabinet studio, choose a room shape and add a cabinet. Launch the home studio and confirm that its 3D viewport loads. Use a WebGL-capable browser with hardware acceleration and an internet connection for CDN libraries.
- If testing submissions, use fictitious customer information. Check that save/booking operations return a confirmation; do not assume that a confirmation sends email or WhatsApp notifications.

If something fails, see [Troubleshooting](#troubleshooting).

### Using the website again later

There is no need to re-extract the ZIP or re-import the database every time. Open XAMPP Control Panel, start Apache and MySQL, then visit the same localhost URL. When you finish using the site, you can stop Apache and MySQL from the control panel. Saved database records remain on your computer.

### Updating to a newer release

Back up the existing project folder, database and runtime uploads before replacing files. Read the release notes for any schema changes; do not blindly import the full SQL dump into a database containing existing designs or appointments. For a separate clean test installation, use a separate database and adjust both PDO configuration files accordingly.

### Additional storage and asset configuration

The standard local installation should not require extra setup just to open the homepage. For complete submission functionality:

- Preserve `assets/images/` and `public/uploads/materials/`; restore any separately maintained images referenced in the database if needed.
- Give the PHP process write access to the relevant upload directories for consultation attachments and generated design PDFs.
- For home concept submissions, `IDEARE_HOME_LEAD_DIR` may be set to a writable directory outside the web document root. If unset, the code attempts to create `ideare-home-leads` alongside the document root (typically `C:\xampp\ideare-home-leads`).
- Check PHP upload and POST limits if attachments fail. Preserve server-side restrictions against direct access or execution in private storage.
- This guide is for a local evaluation/development installation, not internet-facing hosting. Do not expose the bundled SQL dump, configuration files, backups or private uploads over HTTP. See [Maintenance and deployment](#maintenance-and-deployment).

### Optional Planner 5D integration (not required for installation)

Only enable the partner editor after confirming the commercial agreement, approved embed URL, permitted host and required behaviour. Relevant configuration is in `home-configurator/planner5d-config.php`:

| Environment variable | Purpose |
| --- | --- |
| `IDEARE_P5D_ENABLED` | Set to `1` to enable integration. |
| `IDEARE_P5D_REQUIREMENTS_CONFIRMED` | Set to `1` only after confirming partner requirements. |
| `IDEARE_P5D_EMBED_URL` | Approved HTTPS embed URL. |
| `IDEARE_P5D_APPROVED_HOST` | Optional explicitly approved alternate host. |

Configure variables in the server environment; merely creating a `.env` file does not guarantee PHP loads it. Leave the integration disabled for a standard native studio installation. The host page cannot enforce restrictions inside a third-party iframe.

## How to use

### Explore IDEARE and find design inspiration

1. Start on the homepage and browse the company, service story and project journey.
2. Open the portfolio to explore projects and navigate their photographs.
3. Browse interior concepts by style and room imagery to identify preferred design directions.
4. Open the material catalogue, compare finishes and copy relevant product codes.
5. Use the location page or contact links to get in touch with IDEARE.

### Design custom cabinetry

1. Open the 3D Space & Cabinet Designer.
2. Choose a room shape, define the room type, adjust wall dimensions on the drawing and enter ceiling height in millimetres.
3. Continue to the design stage and add items from Cabinets, Appliances, Dining, Accessories or Materials.
4. Select objects in the scene or item list. Adjust measurements, positioning, fronts, storage, fittings and finishes as appropriate to that object.
5. Use the 3D orbit, plan or walkthrough view to inspect the arrangement. Toggle walls/grid, zoom or recenter as needed.
6. Review the design and any validation findings on Finalize.
7. Download the concept PDF or enter customer details to save an editable design or submit it to IDEARE.
8. Keep the generated reference and private edit link. Use the same browser to restore an available unfinished local draft.

### Plan a home

1. Open the Home Design Studio and define the land dimensions and assumed site clearances in metres.
2. Enter Build home and create the proposed layout using the available floor, building and furnishing controls.
3. Inspect the model in 3D and revise the concept before proceeding.
4. Open Finalize, select the desired specification package and review the indicative estimate.
5. Enter name, phone and land location, consent to submission and send the concept. Retain the returned reference.
6. Arrange a consultation for site verification, design feasibility and a formal quotation.

### Book a consultation

1. Open Book a Consultation.
2. Provide the type of project, property details, budget and project requirements.
3. Choose the appointment type, meeting method and preferred date; optionally provide an alternative date.
4. Enter contact details, notes and relevant reference files; agree to contact consent.
5. Submit the request and retain its confirmation/reference. Wait for IDEARE to confirm arrangements through the chosen contact channel.

### For IDEARE staff and project owners

The customer website collects enquiries and design concepts for professional follow-up. The separately maintained staff system, if available, must be installed/configured independently and checked for compatibility with the same database schema. The current Git tree does not include a staff portal.

Operationally, review incoming appointment records, saved/submitted cabinet designs and private home lead JSON files through authorised internal tools; verify dimensions, materials, budget and site requirements before producing formal documents or quotations. Do not treat a customer concept as an approved manufacturing order.

## Maintenance and deployment

### Where to make changes

| Change | Main locations |
| --- | --- |
| Branding/navigation/footer | `includes/customer/`, shared CSS, branding images |
| Homepage and services | `index.php`, `public/pages/services.php`, corresponding CSS/JS |
| Portfolio and inspiration | `assets/images/Portfolio/`, `assets/images/Concepts/`, relevant gallery scripts and APIs |
| Cabinet designer | `designer/index.php`, `assets/js/designer.js`, `assets/css/designer.css`, `api/designer3d/` |
| Studio popups and previews | `assets/js/design-studio-popups.js`, `assets/js/designer-item-previews.js`, related studio CSS |
| Home builder | `home-configurator/`, `assets/js/home-configurator*.js`, `assets/css/home-configurator.css` |
| Materials | Catalogue PHP pages, `includes/catalogue/`, material API and supplier data |
| Booking | `pages/book-appointment.php`, `includes/customer/appointment-functions.php`, booking CSS/JS |
| Responsive layouts | `assets/css/responsive/`, `assets/js/responsive/` |

### API overview

| Endpoint | Role |
| --- | --- |
| `api/designer3d/catalog.php` | Active cabinet templates, categories and options |
| `api/designer3d/materials.php` | Material product search |
| `api/designer3d/csrf.php` | Designer CSRF support |
| `api/designer3d/save.php` | Validate and save/submit a design and revision |
| `api/designer3d/load.php` | Retrieve an authorised saved design |
| `api/designer3d/upload-pdf.php` | Store a design PDF and document metadata |
| `home-configurator/submit.php` | Validate a home concept submission and store a private JSON lead |
| `api/concepts.php`, `api/inspiration.php`, `api/portfolio.php` | Public concept, inspiration and portfolio data |
| `api/catalog.php`, `api/save.php`, `designer/api/` | Additional/older catalogue and design endpoints; check callers before removing |

### Production checklist

- Use HTTPS, secure session configuration, restricted database credentials and a supported PHP version.
- Keep secrets, unsanitized database exports, real customer information, saved edit links and private lead files out of public Git repositories. Distribute only sanitized schema and non-sensitive seed data; deny HTTP access to `ideare_db.sql` or remove it from the deployed document root after import.
- Deny direct HTTP access to private uploads, configuration, backup files and historical update utilities; verify Apache actually enforces the rules.
- Review all legacy and active APIs for authentication/authorisation, CSRF, input validation, rate limiting and safe file handling before public deployment.
- Disable public error display; log errors privately and monitor failures.
- Maintain database and upload backups and test restoration.
- Confirm contact information, map destination, consent text, material availability and indicative estimate rates before release.
- Test CDN access and WebGL; consider self-hosting pinned frontend dependencies for resilience.
- Review customer data retention and privacy obligations; restrict staff access to legitimate operational needs.

### Regression testing

Before deploying changes, test on desktop, tablet and phone, in both themes, and on Chrome/Edge and Firefox. Check navigation, scrolling, orbit drag/swipe behaviour, gallery popups, 3D rendering, cabinet/appliance selection, item previews, dimensions and finishes, undo/redo, local draft restore, server save/load, PDF export, home lead submission, catalogue search and appointment uploads. Use dummy customer records in development and confirm that private documents cannot be retrieved without authorisation.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Apache or MySQL will not start | XAMPP logs, occupied ports (Apache normally 80/443; MySQL normally 3306), other running web/database services. |
| Website does not load / 404 | Apache running, correct port, root folder and URL. Check that `index.php` is not nested inside a second extracted folder. |
| SQL import fails | Select an empty `ideare_db`, use the bundled `ideare_db.sql`, check the phpMyAdmin error and avoid importing twice into the same database. |
| Database unavailable | MySQL running, database name, both PDO configurations, `pdo_mysql` extension. |
| Empty cabinet or material catalogue | Complete SQL import, correct schema and active template/product data. |
| Missing project/material images | Database paths, filename case, restored uploads and correct relative URLs. |
| Blank or slow 3D viewport | WebGL/hardware acceleration, CDN requests, browser console, graphics memory and browser extensions. |
| Changes not visible | Hard refresh, browser cache and correct asset path; inspect CSS/JS load order. |
| Cannot save/load a cabinet design | Required contact fields, database schema, API response, access token/private link and session. |
| PDF export fails | jsPDF CDN availability; for server storage check upload permissions and designer document tables. |
| Home submission fails | Required contact fields, consent, payload size and private lead directory permissions. |
| Booking submission fails | Date, required fields, consent, session/CSRF, upload restrictions and booking table schema. |
| Planner 5D unavailable | Optional partner integration settings, HTTPS embed URL and partner permissions. |

## Current scope and limitations

- This documentation describes the customer-facing repository on `main`, reviewed on 28 November 2026 (tree `fed2f1dcce7cf5b22307a3a58fc42282ddf6fa65`).
- The SQL export is bundled as `ideare_db.sql`. The separate staff portal is not included. Review the export for sensitive records before distribution; some catalogues may need additional product data.
- Some pages and historical update files coexist with newer implementations. Verify active references before deleting files.
- The homepage includes an enquiry interface; do not assume every contact button has a working backend or automated notification. Use the verified booking and design submission handlers and test the live contact flow before release.
- The website is a concept visualisation and lead-generation platform, not an e-commerce checkout, structural engineering system or automated manufacturing solution.
- Feature descriptions are based on source inspection, not a completed live installation or end-to-end browser test.
- No software licence file was present in the reviewed tree. Public repository visibility does not itself grant reuse rights; confirm permissions with the project owner.

---

**IDEARE Creation** · Construction, interior design and custom cabinetry · Negeri Sembilan, Malaysia
