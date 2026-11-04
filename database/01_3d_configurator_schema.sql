-- IDEARE 3D Cabinet Configurator - Schema migration v1
-- Based on ideare_db(4).sql (28 Oct 2026), MariaDB 10.4.32 / XAMPP
-- IMPORTANT: Import into existing ideare_db, NOT as a new database.
-- Back up ideare_db first. This is a migration, not a complete database dump.
-- Run once. CREATE TABLE IF NOT EXISTS is repeat-friendly; ALTER ADD COLUMN IF NOT EXISTS requires MariaDB 10.4+.
-- No existing rows are deleted. Workshop dimensions/hardware capacities MUST be approved by IDEARE staff.
USE `ideare_db`;
SET NAMES utf8mb4;

-- A. Keep existing customer design, cabinet, and BOM tables intact.
-- Existing min/max/step are treated as suggested/default template bands, NOT absolute custom-size restrictions.
ALTER TABLE `cabinet_templates`
  ADD COLUMN IF NOT EXISTS `geometry_type` VARCHAR(50) NOT NULL DEFAULT 'rectangular' AFTER `preview_image`,
  ADD COLUMN IF NOT EXISTS `construction_type` VARCHAR(50) NOT NULL DEFAULT 'carcass' AFTER `geometry_type`,
  ADD COLUMN IF NOT EXISTS `default_interior_json` LONGTEXT NULL AFTER `construction_type`,
  ADD COLUMN IF NOT EXISTS `capabilities_json` LONGTEXT NULL AFTER `default_interior_json`,
  ADD COLUMN IF NOT EXISTS `allow_custom_dimensions` TINYINT(1) NOT NULL DEFAULT 1 AFTER `capabilities_json`,
  ADD COLUMN IF NOT EXISTS `rule_set_version` INT UNSIGNED NOT NULL DEFAULT 1 AFTER `allow_custom_dimensions`;

ALTER TABLE `designs`
  ADD COLUMN IF NOT EXISTS `designer_version` VARCHAR(30) NULL AFTER `design_name`,
  ADD COLUMN IF NOT EXISTS `property_type` VARCHAR(80) NULL AFTER `room_type`,
  ADD COLUMN IF NOT EXISTS `project_location` VARCHAR(255) NULL AFTER `property_type`,
  ADD COLUMN IF NOT EXISTS `budget_range` VARCHAR(80) NULL AFTER `project_location`,
  ADD COLUMN IF NOT EXISTS `preferred_contact_method` VARCHAR(30) NULL AFTER `budget_range`,
  ADD COLUMN IF NOT EXISTS `submitted_at` DATETIME NULL AFTER `status`,
  ADD COLUMN IF NOT EXISTS `staff_review_status` VARCHAR(30) NOT NULL DEFAULT 'not_requested' AFTER `submitted_at`,
  ADD COLUMN IF NOT EXISTS `current_revision_no` INT UNSIGNED NOT NULL DEFAULT 1 AFTER `staff_review_status`;

ALTER TABLE `design_items`
  ADD COLUMN IF NOT EXISTS `object_uuid` CHAR(36) NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `pos_x_mm` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `position_order`,
  ADD COLUMN IF NOT EXISTS `pos_y_mm` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `pos_x_mm`,
  ADD COLUMN IF NOT EXISTS `pos_z_mm` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `pos_y_mm`,
  ADD COLUMN IF NOT EXISTS `rotation_y_deg` DECIMAL(8,3) NOT NULL DEFAULT 0 AFTER `pos_z_mm`,
  ADD COLUMN IF NOT EXISTS `carcass_thickness_mm` DECIMAL(7,2) NULL AFTER `depth`,
  ADD COLUMN IF NOT EXISTS `config_json` LONGTEXT NULL AFTER `carcass_thickness_mm`,
  ADD COLUMN IF NOT EXISTS `validation_state` VARCHAR(30) NOT NULL DEFAULT 'unchecked' AFTER `config_json`;

-- B. Room and wall geometry; coordinates in millimetres.
CREATE TABLE IF NOT EXISTS `designer_rooms` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_id` INT UNSIGNED NOT NULL,
  `room_name` VARCHAR(150) NOT NULL DEFAULT 'Room 1',
  `shape_type` VARCHAR(40) NOT NULL DEFAULT 'rectangle',
  `ceiling_height_mm` DECIMAL(12,2) NOT NULL DEFAULT 2700.00,
  `floor_finish_json` LONGTEXT NULL,
  `wall_polygon_json` LONGTEXT NOT NULL COMMENT 'Ordered 2D vertices in millimetres',
  `room_metadata_json` LONGTEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_dr_design` (`design_id`),
  CONSTRAINT `fk_dr_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `designer_room_features` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `room_id` BIGINT UNSIGNED NOT NULL,
  `feature_uuid` CHAR(36) NOT NULL,
  `feature_type` VARCHAR(40) NOT NULL COMMENT 'door,window,beam,pillar,outlet,plumbing,obstacle',
  `wall_index` INT NULL,
  `pos_x_mm` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `pos_y_mm` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `pos_z_mm` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `width_mm` DECIMAL(12,2) NULL,
  `height_mm` DECIMAL(12,2) NULL,
  `depth_mm` DECIMAL(12,2) NULL,
  `properties_json` LONGTEXT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_drf_room_uuid` (`room_id`,`feature_uuid`),
  CONSTRAINT `fk_drf_room` FOREIGN KEY (`room_id`) REFERENCES `designer_rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- C. Parametric internal parts. Each component is attached to an existing design_item.
-- parent_component_id supports nested compartments/drawers; app must keep parent within same item.
CREATE TABLE IF NOT EXISTS `designer_components` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_item_id` INT UNSIGNED NOT NULL,
  `component_uuid` CHAR(36) NOT NULL,
  `parent_component_id` BIGINT UNSIGNED NULL,
  `component_type` VARCHAR(40) NOT NULL COMMENT 'shelf,partition,door,drawer_front,drawer_box,rail,appliance_space,accessory,carcass_panel',
  `component_name` VARCHAR(150) NULL,
  `pos_x_mm` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `pos_y_mm` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `pos_z_mm` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `width_mm` DECIMAL(12,2) NULL,
  `height_mm` DECIMAL(12,2) NULL,
  `depth_mm` DECIMAL(12,2) NULL,
  `thickness_mm` DECIMAL(8,2) NULL,
  `is_adjustable` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `properties_json` LONGTEXT NULL COMMENT 'Opening, load, edge, grain, material and hardware selections',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_dc_item_uuid` (`design_item_id`,`component_uuid`),
  KEY `idx_dc_parent` (`parent_component_id`), KEY `idx_dc_type` (`component_type`),
  CONSTRAINT `fk_dc_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dc_parent` FOREIGN KEY (`parent_component_id`) REFERENCES `designer_components` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- D. Shared run-level elements (a continuous worktop/plinth/backsplash can span multiple cabinets).
CREATE TABLE IF NOT EXISTS `designer_shared_elements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_id` INT UNSIGNED NOT NULL,
  `room_id` BIGINT UNSIGNED NULL,
  `element_uuid` CHAR(36) NOT NULL,
  `element_type` VARCHAR(40) NOT NULL COMMENT 'worktop,plinth,backsplash,cover_panel,filler',
  `name` VARCHAR(150) NULL,
  `geometry_json` LONGTEXT NOT NULL,
  `settings_json` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_dse_design_uuid` (`design_id`,`element_uuid`),
  CONSTRAINT `fk_dse_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dse_room` FOREIGN KEY (`room_id`) REFERENCES `designer_rooms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `designer_shared_element_items` (
  `element_id` BIGINT UNSIGNED NOT NULL,
  `design_item_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`element_id`,`design_item_id`),
  KEY `idx_dsei_item` (`design_item_id`),
  CONSTRAINT `fk_dsei_element` FOREIGN KEY (`element_id`) REFERENCES `designer_shared_elements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dsei_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- E. Material selections reference existing catalogues without modifying supplier data.
-- Source types: topmix, dgtango, casero_stone_sintered, casero_stone_quartz, materials, custom.
CREATE TABLE IF NOT EXISTS `designer_material_selections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_id` INT UNSIGNED NOT NULL,
  `design_item_id` INT UNSIGNED NULL,
  `component_id` BIGINT UNSIGNED NULL,
  `shared_element_id` BIGINT UNSIGNED NULL,
  `application` VARCHAR(50) NOT NULL COMMENT 'carcass,door,shelf,worktop,backsplash,plinth,edge',
  `source_table` VARCHAR(50) NOT NULL,
  `source_row_id` BIGINT UNSIGNED NULL,
  `product_code_snapshot` VARCHAR(100) NULL,
  `product_name_snapshot` VARCHAR(255) NULL,
  `texture_path_snapshot` VARCHAR(500) NULL,
  `grain_direction` VARCHAR(20) NULL,
  `properties_json` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_dms_design` (`design_id`), KEY `idx_dms_item` (`design_item_id`),
  KEY `idx_dms_component` (`component_id`), KEY `idx_dms_shared` (`shared_element_id`),
  CONSTRAINT `fk_dms_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dms_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dms_component` FOREIGN KEY (`component_id`) REFERENCES `designer_components` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dms_shared` FOREIGN KEY (`shared_element_id`) REFERENCES `designer_shared_elements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- F. Hardware catalogue and compatibility rules. No fictitious load ratings are seeded.
CREATE TABLE IF NOT EXISTS `designer_hardware` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `hardware_code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `hardware_type` VARCHAR(50) NOT NULL COMMENT 'hinge,runner,lift,push_open,basket,carousel,rail,other',
  `brand` VARCHAR(120) NULL,
  `supplier_id` BIGINT UNSIGNED NULL COMMENT 'Optional reference to suppliers; confirm existing PK before enforcing FK',
  `min_inner_width_mm` DECIMAL(10,2) NULL,
  `max_inner_width_mm` DECIMAL(10,2) NULL,
  `min_inner_depth_mm` DECIMAL(10,2) NULL,
  `max_inner_depth_mm` DECIMAL(10,2) NULL,
  `rated_load_kg` DECIMAL(10,2) NULL,
  `clearance_rules_json` LONGTEXT NULL,
  `datasheet_url` VARCHAR(500) NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_dh_code` (`hardware_code`), KEY `idx_dh_type` (`hardware_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `designer_template_hardware` (
  `template_id` INT UNSIGNED NOT NULL,
  `hardware_id` BIGINT UNSIGNED NOT NULL,
  `compatibility` VARCHAR(20) NOT NULL DEFAULT 'review' COMMENT 'allowed,review,blocked',
  `notes` VARCHAR(500) NULL,
  PRIMARY KEY (`template_id`,`hardware_id`),
  CONSTRAINT `fk_dth_template` FOREIGN KEY (`template_id`) REFERENCES `cabinet_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dth_hardware` FOREIGN KEY (`hardware_id`) REFERENCES `designer_hardware` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rules store staff-authored criteria as JSON (not executable SQL or PHP).
-- App validates schema, comparisons, and all numeric values before use.
CREATE TABLE IF NOT EXISTS `designer_validation_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rule_code` VARCHAR(100) NOT NULL,
  `rule_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `category_slug` VARCHAR(120) NULL,
  `template_id` INT UNSIGNED NULL,
  `component_type` VARCHAR(50) NULL,
  `rule_kind` VARCHAR(50) NOT NULL,
  `severity` VARCHAR(20) NOT NULL DEFAULT 'review' COMMENT 'info,warning,review,block',
  `criteria_json` LONGTEXT NOT NULL,
  `customer_message` VARCHAR(500) NOT NULL,
  `staff_message` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `verified_by_staff_id` INT UNSIGNED NULL,
  `verified_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_dvr_code_version` (`rule_code`,`rule_version`),
  KEY `idx_dvr_template` (`template_id`),
  CONSTRAINT `fk_dvr_template` FOREIGN KEY (`template_id`) REFERENCES `cabinet_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `designer_validation_findings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_id` INT UNSIGNED NOT NULL,
  `design_item_id` INT UNSIGNED NULL,
  `rule_id` BIGINT UNSIGNED NULL,
  `finding_code` VARCHAR(100) NOT NULL,
  `severity` VARCHAR(20) NOT NULL,
  `message` TEXT NOT NULL,
  `state` VARCHAR(25) NOT NULL DEFAULT 'open' COMMENT 'open,resolved,accepted_for_review',
  `details_json` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME NULL,
  PRIMARY KEY (`id`), KEY `idx_dvf_design_state` (`design_id`,`state`),
  CONSTRAINT `fk_dvf_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dvf_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dvf_rule` FOREIGN KEY (`rule_id`) REFERENCES `designer_validation_rules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- G. Versioned full-scene snapshots for customer/staff comparison.
CREATE TABLE IF NOT EXISTS `designer_revisions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_id` INT UNSIGNED NOT NULL,
  `revision_no` INT UNSIGNED NOT NULL,
  `scene_json` LONGTEXT NOT NULL COMMENT 'Full editable snapshot: room geometry, objects, material IDs/codes and settings',
  `schema_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `rule_set_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `change_summary` VARCHAR(500) NULL,
  `author_type` VARCHAR(20) NOT NULL DEFAULT 'customer',
  `author_staff_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_drev_design_rev` (`design_id`,`revision_no`),
  CONSTRAINT `fk_drev_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `designer_staff_reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_id` INT UNSIGNED NOT NULL,
  `revision_id` BIGINT UNSIGNED NULL,
  `design_item_id` INT UNSIGNED NULL,
  `reviewer_staff_id` INT UNSIGNED NOT NULL,
  `decision` VARCHAR(30) NOT NULL COMMENT 'requested,needs_changes,approved,rejected,note',
  `review_note` TEXT NULL,
  `reviewed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_dsr_design` (`design_id`),
  CONSTRAINT `fk_dsr_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dsr_revision` FOREIGN KEY (`revision_id`) REFERENCES `designer_revisions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dsr_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dsr_staff` FOREIGN KEY (`reviewer_staff_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- H. Set clear customer-facing category labels; retain the same category IDs and slugs.
UPDATE `cabinet_categories` SET `name`='Wall / Upper Cabinets',
  `description`='Wall-mounted, overhead, glass-front and open shelving cabinets.'
  WHERE `slug`='wall-cabinets';
UPDATE `cabinet_categories` SET `name`='Tall / Pantry Cabinets',
  `description`='Full-height pantry, appliance towers and utility cabinetry.'
  WHERE `slug`='tall-cabinets';
UPDATE `cabinet_categories` SET `name`='Specialty & Corner Cabinets',
  `description`='L-shaped, blind corner, pull-out, island and special-purpose modules.'
  WHERE `slug`='special-cabinets';

-- I. Seed starter templates (suggested dimensions only; not workshop-certified limits).
-- No fixed prices entered for unpriced new templates; quotation is subject to staff review.
-- Existing 14 production templates and demo records remain untouched.
INSERT INTO `cabinet_templates` (`category_id`,`name`,`slug`,`description`,`default_width`,`default_height`,`default_depth`,`min_width`,`max_width`,`width_step`,`min_height`,`max_height`,`height_step`,`min_depth`,`max_depth`,`depth_step`,`base_price`,`sort_order`,`is_active`,`geometry_type`,`construction_type`,`allow_custom_dimensions`)
SELECT src.category_id,src.name,src.slug,src.description,src.w,src.h,src.d,src.minw,src.maxw,10,src.minh,src.maxh,10,src.mind,src.maxd,10,0,src.ord,1,src.geometry_type,'carcass',1
FROM (
 SELECT 1 category_id,'Hob Base Cabinet' name,'hob-base-cabinet' slug,'Hob unit: cutout and ventilation reviewed against selected appliance.' description,900 w,850 h,600 d,600 minw,1200 maxw,750 minh,950 maxh,500 mind,700 maxd,16 ord,'rectangular' geometry_type
 UNION ALL SELECT 1,'Built-in Oven Base Cabinet','oven-base-cabinet','Integrated oven base; appliance dimensions required.',600,850,600,500,900,750,1000,550,700,17,'rectangular'
 UNION ALL SELECT 1,'Pull-out Base Cabinet','pullout-base-cabinet','Narrow storage with manufacturer-specific pull-out mechanism.',300,850,600,150,600,750,950,450,700,18,'rectangular'
 UNION ALL SELECT 1,'Door and Drawer Base Cabinet','door-drawer-base-cabinet','Combined drawer and hinged-door fronts.',600,850,600,300,1200,750,950,450,700,19,'rectangular'
 UNION ALL SELECT 2,'Lift-up Wall Cabinet','lift-up-wall-cabinet','Upper cabinet with lift-up front.',800,600,350,450,1200,350,900,250,500,20,'rectangular'
 UNION ALL SELECT 2,'Extractor Hood Wall Cabinet','extractor-hood-wall-cabinet','Cabinet around an extractor hood; clearances must be checked.',900,700,350,600,1200,400,1000,250,500,21,'rectangular'
 UNION ALL SELECT 2,'Wall Microwave Cabinet','wall-microwave-cabinet','Microwave compartment with appliance ventilation review.',600,700,400,500,900,400,1000,300,600,22,'rectangular'
 UNION ALL SELECT 3,'Pull-out Tall Pantry Cabinet','pullout-tall-pantry-cabinet','Full-height pantry using pull-out storage hardware.',600,2100,600,300,900,1800,2600,450,700,23,'rectangular'
 UNION ALL SELECT 3,'Tall Oven and Microwave Tower','tall-oven-microwave-tower','Combined oven and microwave housing.',600,2200,600,550,1000,1800,2700,500,700,24,'rectangular'
 UNION ALL SELECT 3,'Fridge Surround Cabinet','fridge-surround-cabinet','Tall refrigerator housing; ventilation and appliance clearances required.',900,2200,700,650,1400,1800,2800,500,900,25,'rectangular'
 UNION ALL SELECT 4,'L-shaped Corner Base Cabinet','l-shaped-corner-base-cabinet','L-corner footprint with configurable openings.',900,850,900,750,1300,750,950,750,1300,26,'l_corner'
 UNION ALL SELECT 4,'Blind Corner Base Cabinet','blind-corner-base-cabinet','Blind-corner unit compatible with selected pull-out mechanism.',1000,850,600,800,1400,750,950,500,800,27,'blind_corner'
 UNION ALL SELECT 4,'Diagonal Corner Cabinet','diagonal-corner-cabinet','Angled front cabinet with corner footprint.',900,850,900,750,1300,750,950,750,1300,28,'diagonal_corner'
 UNION ALL SELECT 4,'Corner Carousel Cabinet','corner-carousel-cabinet','Corner cabinet with rotating organizer requiring fitting envelope.',900,850,900,750,1300,750,950,750,1300,29,'l_corner'
 UNION ALL SELECT 4,'Peninsula Cabinet','peninsula-cabinet','Cabinet run with an exposed end and optional seating overhang.',1200,850,900,600,2400,750,950,600,1200,30,'rectangular'
) AS src
WHERE NOT EXISTS (SELECT 1 FROM `cabinet_templates` t WHERE t.`slug`=src.slug);

-- J. Add inactive rule placeholders for workshop verification.
-- They intentionally have NO arbitrary numeric thresholds and will NOT automatically approve anything.
INSERT INTO `designer_validation_rules` (`rule_code`,`rule_version`,`rule_kind`,`severity`,`criteria_json`,`customer_message`,`staff_message`,`is_active`)
SELECT seed.code,1,seed.kind,'review','{}',seed.message,seed.staff_message,0
FROM (
 SELECT 'door_leaf_hardware_capacity' code,'door_hardware' kind,'Door size may require different hinges or a divided front.' message,'Enter approved hinge model and maximum panel mass/size from manufacturer.' staff_message
 UNION ALL SELECT 'shelf_span_and_loading','shelf_deflection','A wide shelf may require a divider or reinforcement.','Enter approved panel type, thickness, loading, span and support method.'
 UNION ALL SELECT 'drawer_runner_fit','drawer_clearance','Drawer runners must fit the available internal opening.','Enter manufacturer-specific runner dimensions, side clearances and load.'
 UNION ALL SELECT 'wall_cabinet_mounting','installation','Wall-mounted units need site-specific fixing verification.','Confirm wall substrate, anchors, loading and mounting method.'
 UNION ALL SELECT 'appliance_ventilation','appliance','Built-in appliance clearances require review.','Validate model-specific cutout dimensions and ventilation instructions.'
 UNION ALL SELECT 'corner_fitting_envelope','corner_hardware','Corner storage hardware requires sufficient clearance.','Enter opening, handedness and manufacturer envelope.'
) seed
WHERE NOT EXISTS(SELECT 1 FROM `designer_validation_rules` r WHERE r.`rule_code`=seed.code AND r.`rule_version`=1);

-- End of migration.
-- IMPORTANT: Update PHP APIs, 3D renderer and staff portal separately. This SQL only prepares data structures.
