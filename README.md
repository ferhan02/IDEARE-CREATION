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

**Important:** The reviewed repository does not contain an SQL dump or migration set. Obtain the latest complete `ideare_db` export, including catalogue seed data and the current designer tables, from the project owner. Creating an empty database alone will not enable the database-backed features.

## Installation

### 1. Prerequisites

- Windows with XAMPP (or an equivalent Apache/PHP/MySQL environment).
- PHP 8.1 or newer, with `pdo_mysql`, `mbstring`, `fileinfo` and session support enabled.
- MySQL/MariaDB and phpMyAdmin or a compatible SQL client.
- A current WebGL-capable browser such as Chrome, Edge or Firefox.
- Git (optional if downloading the repository ZIP).
- The latest database export and any separately stored runtime assets.

### 2. Download the repository

Open a terminal and run:

```bat
cd /d C:\xampp\htdocs
git clone https://github.com/ferhan02/IDEARE-CREATION.git "IDEARE CREATION"
```

Alternatively, download **Code → Download ZIP** from GitHub and extract its contents to:

```text
C:\xampp\htdocs\IDEARE CREATION\
```

Ensure `index.php`, `config/`, `assets/` and the other root folders sit directly inside this directory, not inside an additional nested repository folder.

### 3. Start the local server

Open XAMPP Control Panel and start **Apache** and **MySQL**. Verify that `http://localhost/` and `http://localhost/phpmyadmin/` open. If the server uses a non-default port, include that port in the URLs below.

### 4. Import the database

1. Open phpMyAdmin at `http://localhost/phpmyadmin/`.
2. Create `ideare_db` with `utf8mb4` encoding if the supplied SQL export does not create it itself.
3. Select the database, open **Import**, choose the latest IDEARE SQL export and run the import.
4. Confirm the required tables and catalogue rows exist, using the table inventory above as a starting point.
5. If updating an existing installation, back it up and apply only the appropriate schema changes instead of overwriting live data.

### 5. Configure PHP database connections

Review these two files:

- `config/db.php`
- `config/databases.php`

The checked-in local defaults use `localhost`, `ideare_db`, user `root` and an empty password. These are suitable only for a matching isolated local XAMPP setup. If your MySQL credentials differ, edit both PDO connection definitions to match. In production, use a restricted database account and environment-backed credentials rather than committing passwords.

### 6. Configure storage and assets

- Preserve the `assets/images/` and `public/uploads/materials/` directory structures; filenames and letter case matter on Linux.
- Restore any database-referenced images that are not included in Git.
- Give the PHP process write access to the relevant upload directories for consultation attachments and generated design PDFs.
- For home concept submissions, set `IDEARE_HOME_LEAD_DIR` to a writable directory outside the web document root. If unset, the code attempts to create `ideare-home-leads` alongside the web document root (typically `C:\xampp\ideare-home-leads` in a standard XAMPP installation).
- Verify PHP upload and POST limits accommodate the application's accepted attachments. Preserve server-side restrictions against direct access or execution in private storage.

### 7. Open the website

```text
http://localhost/IDEARE%20CREATION/
```

| Page | Local URL path (after `/IDEARE%20CREATION/`) |
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

### 8. Optional Planner 5D integration

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
- Keep secrets, database exports, customer information, saved edit links and private lead files out of public Git repositories.
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
| Website does not load | Apache running, correct port, root folder and URL. |
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

- This documentation describes the customer-facing repository on `main`, reviewed on 28 November 2026 (tree `1e1d6099f599169cd2b204ddf1696fd7cff50838`).
- The SQL schema/export, staff portal and operational data are not bundled in that tree. Obtain these independently where needed.
- Some pages and historical update files coexist with newer implementations. Verify active references before deleting files.
- The homepage includes an enquiry interface; do not assume every contact button has a working backend or automated notification. Use the verified booking and design submission handlers and test the live contact flow before release.
- The website is a concept visualisation and lead-generation platform, not an e-commerce checkout, structural engineering system or automated manufacturing solution.
- Feature descriptions are based on source inspection, not a completed live installation or end-to-end browser test.
- No software licence file was present in the reviewed tree. Public repository visibility does not itself grant reuse rights; confirm permissions with the project owner.

---

**IDEARE Creation** · Construction, interior design and custom cabinetry · Negeri Sembilan, Malaysia
