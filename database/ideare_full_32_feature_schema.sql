-- ============================================================================
-- IdeaRE Creation - Master Database Upgrade for 32 Approved Features
-- Target: MariaDB 10.4+ / XAMPP
-- Database: ideare_db
-- Generated: 2026-10-02
--
-- SAFE-UPGRADE PRINCIPLES
--   * Does not DROP existing business tables or data.
--   * Creates missing tables with IF NOT EXISTS.
--   * Adds missing integration columns/indexes to existing tables conditionally.
--   * Existing cabinet designer, staff/auth, costing, quotation and task data is kept.
--
-- IMPORTANT
--   Back up ideare_db before running this migration on production data.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `ideare_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `ideare_db`;

SET NAMES utf8mb4;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Helpers: make ALTER operations safe to re-run on MariaDB 10.4
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `ideare_add_column_if_missing`;
DROP PROCEDURE IF EXISTS `ideare_add_index_if_missing`;

DELIMITER $$
CREATE PROCEDURE `ideare_add_column_if_missing`(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = p_table
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_column
  ) THEN
    SET @sql_stmt = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @sql_stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

CREATE PROCEDURE `ideare_add_index_if_missing`(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_columns TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = p_table
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_index
  ) THEN
    SET @sql_stmt = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '` (', p_columns, ')');
    PREPARE stmt FROM @sql_stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- ============================================================================
-- 1-5. CRM, SALES PIPELINE, FOLLOW-UPS, PROJECTS, SITE MEASUREMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `customers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_code` VARCHAR(30) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `alternate_phone` VARCHAR(50) NULL,
  `email` VARCHAR(180) NULL,
  `billing_address` TEXT NULL,
  `site_address` TEXT NULL,
  `city` VARCHAR(120) NULL,
  `state` VARCHAR(120) NULL,
  `postcode` VARCHAR(20) NULL,
  `lead_source` VARCHAR(100) NULL,
  `interested_service` VARCHAR(150) NULL,
  `assigned_to` INT UNSIGNED NULL,
  `status` ENUM('lead','prospect','active','inactive','completed','blacklisted') NOT NULL DEFAULT 'lead',
  `preferred_contact_method` ENUM('phone','whatsapp','email','other') NULL,
  `notes` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customers_code` (`customer_code`),
  KEY `idx_customers_name` (`name`),
  KEY `idx_customers_phone` (`phone`),
  KEY `idx_customers_email` (`email`),
  KEY `idx_customers_status` (`status`),
  KEY `idx_customers_assigned` (`assigned_to`),
  CONSTRAINT `fk_customers_assigned_staff` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_customers_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leads` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `lead_code` VARCHAR(30) NULL,
  `stage` ENUM('new','contacted','consultation','site_measurement','designing','quotation_sent','negotiation','won','lost') NOT NULL DEFAULT 'new',
  `estimated_value` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `probability` TINYINT UNSIGNED NOT NULL DEFAULT 20,
  `source` VARCHAR(100) NULL,
  `assigned_to` INT UNSIGNED NULL,
  `next_follow_up_at` DATETIME NULL,
  `won_at` DATETIME NULL,
  `lost_at` DATETIME NULL,
  `lost_reason` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leads_code` (`lead_code`),
  KEY `idx_leads_customer` (`customer_id`),
  KEY `idx_leads_stage` (`stage`),
  KEY `idx_leads_assigned` (`assigned_to`),
  KEY `idx_leads_followup` (`next_follow_up_at`),
  CONSTRAINT `fk_leads_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leads_assigned_staff` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leads_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `follow_ups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `lead_id` BIGINT UNSIGNED NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `assigned_to` INT UNSIGNED NULL,
  `follow_up_at` DATETIME NOT NULL,
  `reason` VARCHAR(180) NOT NULL,
  `channel` ENUM('phone','whatsapp','email','meeting','other') NULL,
  `notes` TEXT NULL,
  `outcome` TEXT NULL,
  `status` ENUM('pending','completed','cancelled','missed') NOT NULL DEFAULT 'pending',
  `completed_at` DATETIME NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_followups_customer` (`customer_id`),
  KEY `idx_followups_lead` (`lead_id`),
  KEY `idx_followups_project` (`project_id`),
  KEY `idx_followups_staff_date` (`assigned_to`,`follow_up_at`),
  KEY `idx_followups_status_date` (`status`,`follow_up_at`),
  CONSTRAINT `fk_followups_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_followups_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_followups_assigned_staff` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_followups_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_code` VARCHAR(30) NOT NULL,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `lead_id` BIGINT UNSIGNED NULL,
  `name` VARCHAR(200) NOT NULL,
  `project_type` VARCHAR(120) NULL,
  `status` ENUM('consultation','measurement','design','quotation','approved','procurement','production','qc','installation','completed','on_hold','cancelled') NOT NULL DEFAULT 'consultation',
  `priority` ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `assigned_manager` INT UNSIGNED NULL,
  `site_address` TEXT NULL,
  `estimated_value` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `approved_value` DECIMAL(14,2) NULL,
  `start_date` DATE NULL,
  `target_date` DATE NULL,
  `completed_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_projects_code` (`project_code`),
  KEY `idx_projects_customer` (`customer_id`),
  KEY `idx_projects_lead` (`lead_id`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_manager` (`assigned_manager`),
  KEY `idx_projects_target` (`target_date`),
  CONSTRAINT `fk_projects_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_projects_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_projects_manager_staff` FOREIGN KEY (`assigned_manager`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_projects_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- follow_ups is deliberately created before projects for compatibility with the
-- earlier Phase 1 schema. Add the project FK now if possible is not required;
-- project_id remains indexed and enforced by the application.

CREATE TABLE IF NOT EXISTS `site_measurements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `measurement_code` VARCHAR(40) NULL,
  `revision_no` INT UNSIGNED NOT NULL DEFAULT 1,
  `measured_by` INT UNSIGNED NULL,
  `measured_at` DATETIME NOT NULL,
  `room_name` VARCHAR(150) NOT NULL,
  `room_type` VARCHAR(100) NULL,
  `wall_a_mm` DECIMAL(10,2) NULL,
  `wall_b_mm` DECIMAL(10,2) NULL,
  `wall_c_mm` DECIMAL(10,2) NULL,
  `wall_d_mm` DECIMAL(10,2) NULL,
  `ceiling_height_mm` DECIMAL(10,2) NULL,
  `floor_level_notes` TEXT NULL,
  `window_details` TEXT NULL,
  `door_details` TEXT NULL,
  `plumbing_details` TEXT NULL,
  `electrical_details` TEXT NULL,
  `obstacles` TEXT NULL,
  `access_notes` TEXT NULL,
  `notes` TEXT NULL,
  `is_final` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_measurement_code` (`measurement_code`),
  KEY `idx_measurements_project` (`project_id`),
  KEY `idx_measurements_measured_by` (`measured_by`),
  CONSTRAINT `fk_measurements_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_measurements_staff` FOREIGN KEY (`measured_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Upgrade the earlier Phase 1 CRM/project tables when they already exist.
CALL `ideare_add_column_if_missing`('customers','alternate_phone','VARCHAR(50) NULL');
CALL `ideare_add_column_if_missing`('customers','billing_address','TEXT NULL');
CALL `ideare_add_column_if_missing`('customers','site_address','TEXT NULL');
CALL `ideare_add_column_if_missing`('customers','city','VARCHAR(120) NULL');
CALL `ideare_add_column_if_missing`('customers','state','VARCHAR(120) NULL');
CALL `ideare_add_column_if_missing`('customers','postcode','VARCHAR(20) NULL');
CALL `ideare_add_column_if_missing`('customers','preferred_contact_method','ENUM(''phone'',''whatsapp'',''email'',''other'') NULL');
CALL `ideare_add_index_if_missing`('customers','idx_customers_status','`status`');
CALL `ideare_add_index_if_missing`('customers','idx_customers_assigned','`assigned_to`');

CALL `ideare_add_column_if_missing`('leads','lead_code','VARCHAR(30) NULL');
CALL `ideare_add_column_if_missing`('leads','source','VARCHAR(100) NULL');
CALL `ideare_add_column_if_missing`('leads','won_at','DATETIME NULL');
CALL `ideare_add_column_if_missing`('leads','lost_at','DATETIME NULL');
CALL `ideare_add_column_if_missing`('leads','created_by','INT UNSIGNED NULL');
CALL `ideare_add_index_if_missing`('leads','idx_leads_stage','`stage`');
CALL `ideare_add_index_if_missing`('leads','idx_leads_followup','`next_follow_up_at`');

CALL `ideare_add_column_if_missing`('follow_ups','project_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('follow_ups','channel','ENUM(''phone'',''whatsapp'',''email'',''meeting'',''other'') NULL');
CALL `ideare_add_column_if_missing`('follow_ups','outcome','TEXT NULL');
CALL `ideare_add_column_if_missing`('follow_ups','updated_at','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL `ideare_add_index_if_missing`('follow_ups','idx_followups_project','`project_id`');
CALL `ideare_add_index_if_missing`('follow_ups','idx_followups_status_date','`status`,`follow_up_at`');

CALL `ideare_add_column_if_missing`('projects','lead_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('projects','priority','ENUM(''low'',''normal'',''high'',''urgent'') NOT NULL DEFAULT ''normal''');
CALL `ideare_add_column_if_missing`('projects','approved_value','DECIMAL(14,2) NULL');
CALL `ideare_add_index_if_missing`('projects','idx_projects_lead','`lead_id`');
CALL `ideare_add_index_if_missing`('projects','idx_projects_target','`target_date`');

CALL `ideare_add_column_if_missing`('site_measurements','measurement_code','VARCHAR(40) NULL');
CALL `ideare_add_column_if_missing`('site_measurements','revision_no','INT UNSIGNED NOT NULL DEFAULT 1');
CALL `ideare_add_column_if_missing`('site_measurements','room_type','VARCHAR(100) NULL');
CALL `ideare_add_column_if_missing`('site_measurements','floor_level_notes','TEXT NULL');
CALL `ideare_add_column_if_missing`('site_measurements','access_notes','TEXT NULL');
CALL `ideare_add_column_if_missing`('site_measurements','is_final','TINYINT(1) NOT NULL DEFAULT 0');
CALL `ideare_add_column_if_missing`('site_measurements','updated_at','TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CREATE TABLE IF NOT EXISTS `site_measurement_photos` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `measurement_id` BIGINT UNSIGNED NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `caption` VARCHAR(255) NULL,
  `annotations_json` LONGTEXT NULL,
  `uploaded_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_measurement_photos_measurement` (`measurement_id`),
  CONSTRAINT `fk_measurement_photos_measurement` FOREIGN KEY (`measurement_id`) REFERENCES `site_measurements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_measurement_photos_staff` FOREIGN KEY (`uploaded_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. CABINET CONFIGURATOR -> CUSTOMER / PROJECT INTEGRATION
-- ============================================================================

CALL `ideare_add_column_if_missing`('designs','customer_id','BIGINT UNSIGNED NULL AFTER `id`');
CALL `ideare_add_column_if_missing`('designs','project_id','BIGINT UNSIGNED NULL AFTER `customer_id`');
CALL `ideare_add_column_if_missing`('designs','created_by_staff_id','INT UNSIGNED NULL AFTER `project_id`');
CALL `ideare_add_column_if_missing`('designs','approved_at','DATETIME NULL');
CALL `ideare_add_column_if_missing`('designs','approved_by_customer','TINYINT(1) NOT NULL DEFAULT 0');
CALL `ideare_add_index_if_missing`('designs','idx_designs_customer','`customer_id`');
CALL `ideare_add_index_if_missing`('designs','idx_designs_project','`project_id`');

CREATE TABLE IF NOT EXISTS `project_designs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `design_id` INT UNSIGNED NOT NULL,
  `purpose` ENUM('concept','quotation','approved','production','as_built') NOT NULL DEFAULT 'concept',
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `linked_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_design` (`project_id`,`design_id`,`purpose`),
  KEY `idx_project_designs_design` (`design_id`),
  CONSTRAINT `fk_project_designs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_designs_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_designs_staff` FOREIGN KEY (`linked_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7-10. BOM, MATERIAL CATALOGUE, SUPPLIERS, PURCHASE ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `material_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(140) NULL,
  `description` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_material_categories_name` (`name`),
  UNIQUE KEY `uq_material_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `materials` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NULL,
  `material_code` VARCHAR(50) NULL,
  `name` VARCHAR(180) NOT NULL,
  `brand` VARCHAR(120) NULL,
  `description` TEXT NULL,
  `unit` VARCHAR(30) NOT NULL DEFAULT 'unit',
  `width_mm` DECIMAL(10,2) NULL,
  `length_mm` DECIMAL(10,2) NULL,
  `thickness_mm` DECIMAL(10,2) NULL,
  `unit_cost` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `selling_price` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `waste_allowance_percent` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `minimum_stock_level` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_materials_code` (`material_code`),
  KEY `idx_materials_category` (`category_id`),
  KEY `idx_materials_name` (`name`),
  CONSTRAINT `fk_materials_category` FOREIGN KEY (`category_id`) REFERENCES `material_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Upgrade older materials table when it already exists.
CALL `ideare_add_column_if_missing`('materials','material_code','VARCHAR(50) NULL');
CALL `ideare_add_column_if_missing`('materials','brand','VARCHAR(120) NULL');
CALL `ideare_add_column_if_missing`('materials','selling_price','DECIMAL(14,4) NOT NULL DEFAULT 0.0000');
CALL `ideare_add_column_if_missing`('materials','waste_allowance_percent','DECIMAL(6,2) NOT NULL DEFAULT 0.00');
CALL `ideare_add_column_if_missing`('materials','minimum_stock_level','DECIMAL(14,3) NOT NULL DEFAULT 0.000');
CALL `ideare_add_column_if_missing`('materials','is_active','TINYINT(1) NOT NULL DEFAULT 1');
CALL `ideare_add_index_if_missing`('materials','idx_materials_name','`name`');

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `supplier_code` VARCHAR(40) NOT NULL,
  `company_name` VARCHAR(180) NOT NULL,
  `contact_person` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(180) NULL,
  `address` TEXT NULL,
  `registration_no` VARCHAR(80) NULL,
  `tax_no` VARCHAR(80) NULL,
  `payment_terms` VARCHAR(150) NULL,
  `lead_time_days` INT UNSIGNED NULL,
  `notes` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_suppliers_code` (`supplier_code`),
  KEY `idx_suppliers_company` (`company_name`),
  CONSTRAINT `fk_suppliers_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `supplier_materials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `supplier_id` BIGINT UNSIGNED NOT NULL,
  `material_id` INT UNSIGNED NOT NULL,
  `supplier_sku` VARCHAR(100) NULL,
  `purchase_unit` VARCHAR(50) NULL,
  `latest_unit_cost` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `minimum_order_qty` DECIMAL(14,3) NOT NULL DEFAULT 1.000,
  `lead_time_days` INT UNSIGNED NULL,
  `is_preferred` TINYINT(1) NOT NULL DEFAULT 0,
  `last_quoted_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_material` (`supplier_id`,`material_id`),
  KEY `idx_supplier_material_material` (`material_id`),
  CONSTRAINT `fk_supplier_material_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supplier_material_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bills_of_materials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bom_code` VARCHAR(40) NOT NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `design_id` INT UNSIGNED NULL,
  `revision_no` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('draft','calculated','approved','superseded') NOT NULL DEFAULT 'draft',
  `material_cost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `waste_cost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_cost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `approved_by` INT UNSIGNED NULL,
  `approved_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bom_code` (`bom_code`),
  KEY `idx_bom_project` (`project_id`),
  KEY `idx_bom_design` (`design_id`),
  CONSTRAINT `fk_bom_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bom_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bom_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bom_approved_staff` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bom_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bom_id` BIGINT UNSIGNED NOT NULL,
  `material_id` INT UNSIGNED NOT NULL,
  `description` VARCHAR(255) NULL,
  `required_qty` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `waste_percent` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `purchase_qty` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `unit` VARCHAR(30) NULL,
  `unit_cost` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `line_cost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `source` ENUM('design','manual','calculation') NOT NULL DEFAULT 'manual',
  `source_reference` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bom_items_bom` (`bom_id`),
  KEY `idx_bom_items_material` (`material_id`),
  CONSTRAINT `fk_bom_items_bom` FOREIGN KEY (`bom_id`) REFERENCES `bills_of_materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bom_items_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `po_number` VARCHAR(40) NOT NULL,
  `supplier_id` BIGINT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `bom_id` BIGINT UNSIGNED NULL,
  `status` ENUM('draft','pending_approval','approved','ordered','partially_received','received','cancelled') NOT NULL DEFAULT 'draft',
  `order_date` DATE NULL,
  `expected_date` DATE NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'MYR',
  `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `delivery_fee` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `supplier_reference` VARCHAR(120) NULL,
  `delivery_address` TEXT NULL,
  `notes` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `approved_by` INT UNSIGNED NULL,
  `approved_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_purchase_orders_number` (`po_number`),
  KEY `idx_purchase_orders_supplier` (`supplier_id`),
  KEY `idx_purchase_orders_project` (`project_id`),
  KEY `idx_purchase_orders_status` (`status`),
  CONSTRAINT `fk_po_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_po_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_po_bom` FOREIGN KEY (`bom_id`) REFERENCES `bills_of_materials` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_po_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_po_approved_staff` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `purchase_order_id` BIGINT UNSIGNED NOT NULL,
  `material_id` INT UNSIGNED NULL,
  `description` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(14,3) NOT NULL DEFAULT 1.000,
  `unit` VARCHAR(30) NULL,
  `unit_cost` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `tax_percent` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `received_qty` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  PRIMARY KEY (`id`),
  KEY `idx_po_items_po` (`purchase_order_id`),
  KEY `idx_po_items_material` (`material_id`),
  CONSTRAINT `fk_po_items_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_po_items_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `goods_receipts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `receipt_no` VARCHAR(40) NOT NULL,
  `purchase_order_id` BIGINT UNSIGNED NOT NULL,
  `received_at` DATETIME NOT NULL,
  `received_by` INT UNSIGNED NULL,
  `delivery_note_no` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_goods_receipts_no` (`receipt_no`),
  KEY `idx_goods_receipts_po` (`purchase_order_id`),
  CONSTRAINT `fk_goods_receipts_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_goods_receipts_staff` FOREIGN KEY (`received_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `goods_receipt_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `goods_receipt_id` BIGINT UNSIGNED NOT NULL,
  `purchase_order_item_id` BIGINT UNSIGNED NOT NULL,
  `quantity_received` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `quantity_rejected` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `rejection_reason` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_goods_receipt_items_receipt` (`goods_receipt_id`),
  CONSTRAINT `fk_goods_receipt_items_receipt` FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_goods_receipt_items_po_item` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Connect the existing costing / cutting / quotation tables to CRM projects.
-- These calls do nothing if an older optional table is not present.
CALL `ideare_add_column_if_missing`('material_calculations','customer_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('material_calculations','project_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('material_calculations','design_id','INT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('material_calculations','bom_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_index_if_missing`('material_calculations','idx_material_calculations_project','`project_id`');

CALL `ideare_add_column_if_missing`('cutting_jobs','project_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('cutting_jobs','bom_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_index_if_missing`('cutting_jobs','idx_cutting_jobs_project','`project_id`');

CALL `ideare_add_column_if_missing`('quotation_items','internal_unit_cost','DECIMAL(14,4) NOT NULL DEFAULT 0.0000');
CALL `ideare_add_column_if_missing`('quotation_items','internal_line_cost','DECIMAL(14,2) NOT NULL DEFAULT 0.00');
CALL `ideare_add_column_if_missing`('quotation_items','sort_order','INT NOT NULL DEFAULT 0');
CALL `ideare_add_column_if_missing`('quotation_charges','is_internal_only','TINYINT(1) NOT NULL DEFAULT 0');

-- ============================================================================
-- 11. INVENTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS `inventory_locations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `location_code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `location_type` ENUM('warehouse','workshop','vehicle','site','other') NOT NULL DEFAULT 'warehouse',
  `address` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_locations_code` (`location_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_stock` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `location_id` BIGINT UNSIGNED NOT NULL,
  `material_id` INT UNSIGNED NOT NULL,
  `quantity_on_hand` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `quantity_reserved` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
  `average_unit_cost` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_stock_location_material` (`location_id`,`material_id`),
  KEY `idx_inventory_stock_material` (`material_id`),
  CONSTRAINT `fk_inventory_stock_location` FOREIGN KEY (`location_id`) REFERENCES `inventory_locations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventory_stock_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `location_id` BIGINT UNSIGNED NOT NULL,
  `material_id` INT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `transaction_type` ENUM('opening','purchase_receipt','issue_to_project','return_from_project','adjustment_in','adjustment_out','transfer_in','transfer_out','waste') NOT NULL,
  `quantity` DECIMAL(14,3) NOT NULL,
  `unit_cost` DECIMAL(14,4) NULL,
  `reference_type` VARCHAR(60) NULL,
  `reference_id` BIGINT UNSIGNED NULL,
  `notes` TEXT NULL,
  `performed_by` INT UNSIGNED NULL,
  `transaction_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_tx_material` (`material_id`,`transaction_at`),
  KEY `idx_inventory_tx_location` (`location_id`,`transaction_at`),
  KEY `idx_inventory_tx_project` (`project_id`),
  CONSTRAINT `fk_inventory_tx_location` FOREIGN KEY (`location_id`) REFERENCES `inventory_locations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventory_tx_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventory_tx_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inventory_tx_staff` FOREIGN KEY (`performed_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_reservations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `location_id` BIGINT UNSIGNED NOT NULL,
  `material_id` INT UNSIGNED NOT NULL,
  `quantity` DECIMAL(14,3) NOT NULL,
  `status` ENUM('reserved','released','consumed','cancelled') NOT NULL DEFAULT 'reserved',
  `reserved_by` INT UNSIGNED NULL,
  `reserved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `released_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_res_project` (`project_id`),
  KEY `idx_inventory_res_material` (`material_id`),
  CONSTRAINT `fk_inventory_res_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventory_res_location` FOREIGN KEY (`location_id`) REFERENCES `inventory_locations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventory_res_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventory_res_staff` FOREIGN KEY (`reserved_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12-14. PRODUCTION BOARD, QUALITY CONTROL, INSTALLATION SCHEDULING
-- ============================================================================

CREATE TABLE IF NOT EXISTS `production_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `production_code` VARCHAR(40) NOT NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `bom_id` BIGINT UNSIGNED NULL,
  `status` ENUM('queued','cutting','edging','assembly','finishing','qc','ready_for_installation','completed','on_hold') NOT NULL DEFAULT 'queued',
  `priority` ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `assigned_supervisor` INT UNSIGNED NULL,
  `scheduled_start` DATETIME NULL,
  `scheduled_finish` DATETIME NULL,
  `actual_start` DATETIME NULL,
  `actual_finish` DATETIME NULL,
  `notes` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_production_jobs_code` (`production_code`),
  UNIQUE KEY `uq_production_jobs_project` (`project_id`),
  KEY `idx_production_jobs_status` (`status`),
  CONSTRAINT `fk_production_jobs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_production_jobs_bom` FOREIGN KEY (`bom_id`) REFERENCES `bills_of_materials` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_jobs_supervisor` FOREIGN KEY (`assigned_supervisor`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_jobs_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_job_steps` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `production_job_id` BIGINT UNSIGNED NOT NULL,
  `step_name` VARCHAR(120) NOT NULL,
  `step_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('pending','in_progress','blocked','completed','skipped') NOT NULL DEFAULT 'pending',
  `assigned_to` INT UNSIGNED NULL,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_production_steps_job` (`production_job_id`,`step_order`),
  CONSTRAINT `fk_production_steps_job` FOREIGN KEY (`production_job_id`) REFERENCES `production_jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_production_steps_staff` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qc_inspections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `inspection_code` VARCHAR(40) NOT NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `production_job_id` BIGINT UNSIGNED NULL,
  `inspection_type` ENUM('production','pre_installation','post_installation','handover') NOT NULL DEFAULT 'production',
  `status` ENUM('pending','in_progress','passed','failed','conditional_pass') NOT NULL DEFAULT 'pending',
  `inspected_by` INT UNSIGNED NULL,
  `inspected_at` DATETIME NULL,
  `overall_notes` TEXT NULL,
  `signed_off_by` INT UNSIGNED NULL,
  `signed_off_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_qc_inspections_code` (`inspection_code`),
  KEY `idx_qc_project` (`project_id`),
  KEY `idx_qc_status` (`status`),
  CONSTRAINT `fk_qc_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_qc_production_job` FOREIGN KEY (`production_job_id`) REFERENCES `production_jobs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_qc_inspector` FOREIGN KEY (`inspected_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_qc_signoff_staff` FOREIGN KEY (`signed_off_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qc_check_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `inspection_id` BIGINT UNSIGNED NOT NULL,
  `item_name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NULL,
  `result` ENUM('pending','pass','fail','not_applicable') NOT NULL DEFAULT 'pending',
  `notes` TEXT NULL,
  `photo_path` VARCHAR(500) NULL,
  `checked_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_qc_items_inspection` (`inspection_id`),
  CONSTRAINT `fk_qc_items_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `qc_inspections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `installations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `installation_code` VARCHAR(40) NOT NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `scheduled_start` DATETIME NOT NULL,
  `scheduled_end` DATETIME NULL,
  `status` ENUM('scheduled','confirmed','in_progress','completed','postponed','cancelled') NOT NULL DEFAULT 'scheduled',
  `site_address` TEXT NULL,
  `team_lead_id` INT UNSIGNED NULL,
  `vehicle_notes` VARCHAR(255) NULL,
  `tools_notes` TEXT NULL,
  `installation_notes` TEXT NULL,
  `customer_signed_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_installations_code` (`installation_code`),
  KEY `idx_installations_project` (`project_id`),
  KEY `idx_installations_schedule` (`scheduled_start`,`status`),
  CONSTRAINT `fk_installations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_installations_team_lead` FOREIGN KEY (`team_lead_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_installations_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `installation_staff` (
  `installation_id` BIGINT UNSIGNED NOT NULL,
  `staff_id` INT UNSIGNED NOT NULL,
  `role_on_job` VARCHAR(100) NULL,
  PRIMARY KEY (`installation_id`,`staff_id`),
  CONSTRAINT `fk_installation_staff_installation` FOREIGN KEY (`installation_id`) REFERENCES `installations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_installation_staff_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. EMPLOYEE TASK MANAGEMENT - extend existing tasks + collaboration tables
-- ============================================================================

CALL `ideare_add_column_if_missing`('tasks','project_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('tasks','customer_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('tasks','priority','ENUM(''low'',''normal'',''high'',''urgent'') NOT NULL DEFAULT ''normal''');
CALL `ideare_add_column_if_missing`('tasks','start_date','DATETIME NULL');
CALL `ideare_add_column_if_missing`('tasks','deadline','DATETIME NULL');
CALL `ideare_add_column_if_missing`('tasks','completed_at','DATETIME NULL');
CALL `ideare_add_index_if_missing`('tasks','idx_tasks_project','`project_id`');
CALL `ideare_add_index_if_missing`('tasks','idx_tasks_customer','`customer_id`');
CALL `ideare_add_index_if_missing`('tasks','idx_tasks_deadline','`deadline`');

CREATE TABLE IF NOT EXISTS `task_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `staff_id` INT UNSIGNED NOT NULL,
  `assigned_by` INT UNSIGNED NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acknowledged_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_task_assignment` (`task_id`,`staff_id`),
  KEY `idx_task_assignments_staff` (`staff_id`),
  CONSTRAINT `fk_task_assignments_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `task_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `staff_id` INT UNSIGNED NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_comments_task` (`task_id`),
  CONSTRAINT `fk_task_comments_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `task_attachments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `uploaded_by` INT UNSIGNED NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `mime_type` VARCHAR(120) NULL,
  `file_size` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_attachments_task` (`task_id`),
  CONSTRAINT `fk_task_attachments_staff` FOREIGN KEY (`uploaded_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `task_activity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `staff_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_activity_task` (`task_id`,`created_at`),
  CONSTRAINT `fk_task_activity_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16-17. STAFF CALENDAR + CUSTOMER APPOINTMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `event_type` ENUM('task','follow_up','appointment','measurement','installation','meeting','deadline','other') NOT NULL DEFAULT 'other',
  `customer_id` BIGINT UNSIGNED NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME NULL,
  `all_day` TINYINT(1) NOT NULL DEFAULT 0,
  `location` VARCHAR(255) NULL,
  `status` ENUM('scheduled','confirmed','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `source_type` VARCHAR(60) NULL,
  `source_id` BIGINT UNSIGNED NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calendar_events_dates` (`starts_at`,`ends_at`),
  KEY `idx_calendar_events_project` (`project_id`),
  KEY `idx_calendar_events_customer` (`customer_id`),
  CONSTRAINT `fk_calendar_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calendar_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calendar_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `calendar_event_attendees` (
  `event_id` BIGINT UNSIGNED NOT NULL,
  `staff_id` INT UNSIGNED NOT NULL,
  `response_status` ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`event_id`,`staff_id`),
  CONSTRAINT `fk_calendar_attendee_event` FOREIGN KEY (`event_id`) REFERENCES `calendar_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_calendar_attendee_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_appointments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `appointment_code` VARCHAR(40) NOT NULL,
  `customer_id` BIGINT UNSIGNED NULL,
  `customer_name` VARCHAR(180) NOT NULL,
  `customer_phone` VARCHAR(50) NULL,
  `customer_email` VARCHAR(180) NULL,
  `appointment_type` ENUM('consultation','site_measurement','showroom_visit','design_review','other') NOT NULL DEFAULT 'consultation',
  `requested_start` DATETIME NOT NULL,
  `requested_end` DATETIME NULL,
  `confirmed_start` DATETIME NULL,
  `assigned_to` INT UNSIGNED NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `status` ENUM('requested','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'requested',
  `location` VARCHAR(255) NULL,
  `customer_notes` TEXT NULL,
  `staff_notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_appointments_code` (`appointment_code`),
  KEY `idx_customer_appointments_date` (`requested_start`,`status`),
  KEY `idx_customer_appointments_customer` (`customer_id`),
  CONSTRAINT `fk_appointments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointments_staff` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 18-20. IMPROVED QUOTATIONS, VERSIONING, APPROVAL WORKFLOW
-- ============================================================================

CREATE TABLE IF NOT EXISTS `quotations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quotation_no` VARCHAR(40) NOT NULL,
  `customer_id` BIGINT UNSIGNED NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `status` ENUM('draft','pending_approval','sent','viewed','negotiation','accepted','rejected','expired','cancelled') NOT NULL DEFAULT 'draft',
  `valid_from` DATE NULL,
  `valid_until` DATE NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'MYR',
  `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `internal_cost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `gross_profit` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `gross_margin_percent` DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  `current_version_no` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_by` INT UNSIGNED NULL,
  `approved_by` INT UNSIGNED NULL,
  `accepted_at` DATETIME NULL,
  `notes` TEXT NULL,
  `terms` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotations_no` (`quotation_no`),
  KEY `idx_quotations_customer` (`customer_id`),
  KEY `idx_quotations_project` (`project_id`),
  KEY `idx_quotations_status` (`status`),
  CONSTRAINT `fk_quotations_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quotations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quotations_created_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quotations_approved_staff` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Upgrade earlier quotation table without removing its current columns/data.
CALL `ideare_add_column_if_missing`('quotations','customer_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('quotations','project_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('quotations','internal_cost','DECIMAL(14,2) NOT NULL DEFAULT 0.00');
CALL `ideare_add_column_if_missing`('quotations','gross_profit','DECIMAL(14,2) NOT NULL DEFAULT 0.00');
CALL `ideare_add_column_if_missing`('quotations','gross_margin_percent','DECIMAL(7,2) NOT NULL DEFAULT 0.00');
CALL `ideare_add_column_if_missing`('quotations','current_version_no','INT UNSIGNED NOT NULL DEFAULT 1');
CALL `ideare_add_column_if_missing`('quotations','approved_by','INT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('quotations','accepted_at','DATETIME NULL');
CALL `ideare_add_index_if_missing`('quotations','idx_quotations_customer','`customer_id`');
CALL `ideare_add_index_if_missing`('quotations','idx_quotations_project','`project_id`');

CREATE TABLE IF NOT EXISTS `quotation_versions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quotation_id` BIGINT UNSIGNED NOT NULL,
  `version_no` INT UNSIGNED NOT NULL,
  `status` ENUM('draft','issued','superseded','accepted','rejected') NOT NULL DEFAULT 'draft',
  `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `internal_cost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `gross_profit` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `gross_margin_percent` DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  `valid_until` DATE NULL,
  `notes` TEXT NULL,
  `terms` LONGTEXT NULL,
  `snapshot_json` LONGTEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_version` (`quotation_id`,`version_no`),
  CONSTRAINT `fk_quotation_versions_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotation_versions_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotation_version_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quotation_version_id` BIGINT UNSIGNED NOT NULL,
  `item_type` ENUM('material','labour','hardware','countertop','transport','subcontractor','miscellaneous','custom') NOT NULL DEFAULT 'custom',
  `description` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(14,3) NOT NULL DEFAULT 1.000,
  `unit` VARCHAR(30) NULL,
  `unit_cost` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `unit_price` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `line_cost` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_quotation_version_items_version` (`quotation_version_id`),
  CONSTRAINT `fk_quote_version_items_version` FOREIGN KEY (`quotation_version_id`) REFERENCES `quotation_versions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotation_version_charges` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quotation_version_id` BIGINT UNSIGNED NOT NULL,
  `charge_type` ENUM('labour','installation','transport','overhead','waste','tax','discount','other') NOT NULL,
  `label` VARCHAR(150) NOT NULL,
  `calculation_type` ENUM('fixed','percent') NOT NULL DEFAULT 'fixed',
  `rate` DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
  `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `is_internal_only` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_quote_version_charges_version` (`quotation_version_id`),
  CONSTRAINT `fk_quote_version_charges_version` FOREIGN KEY (`quotation_version_id`) REFERENCES `quotation_versions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `approval_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `request_type` ENUM('quotation_discount','low_margin','purchase_order','refund','quotation_change','payment_adjustment','other') NOT NULL,
  `entity_type` VARCHAR(60) NOT NULL,
  `entity_id` BIGINT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `requested_by` INT UNSIGNED NOT NULL,
  `assigned_approver` INT UNSIGNED NULL,
  `status` ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `reason` TEXT NULL,
  `requested_value` DECIMAL(14,2) NULL,
  `metadata_json` LONGTEXT NULL,
  `decided_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_approvals_entity` (`entity_type`,`entity_id`),
  KEY `idx_approvals_status` (`status`,`assigned_approver`),
  KEY `idx_approvals_project` (`project_id`),
  CONSTRAINT `fk_approvals_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_approvals_requester` FOREIGN KEY (`requested_by`) REFERENCES `staff` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_approvals_approver` FOREIGN KEY (`assigned_approver`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `approval_actions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `approval_request_id` BIGINT UNSIGNED NOT NULL,
  `staff_id` INT UNSIGNED NOT NULL,
  `action` ENUM('submitted','approved','rejected','commented','cancelled','reassigned') NOT NULL,
  `comment` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_approval_actions_request` (`approval_request_id`,`created_at`),
  CONSTRAINT `fk_approval_actions_request` FOREIGN KEY (`approval_request_id`) REFERENCES `approval_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_approval_actions_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 21. PAYMENTS / INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_no` VARCHAR(40) NOT NULL,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `quotation_id` BIGINT UNSIGNED NULL,
  `status` ENUM('draft','issued','partially_paid','paid','overdue','void') NOT NULL DEFAULT 'draft',
  `issue_date` DATE NULL,
  `due_date` DATE NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'MYR',
  `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `balance_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `terms` TEXT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoices_no` (`invoice_no`),
  KEY `idx_invoices_customer` (`customer_id`),
  KEY `idx_invoices_project` (`project_id`),
  KEY `idx_invoices_status_due` (`status`,`due_date`),
  CONSTRAINT `fk_invoices_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_invoices_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoices_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoices_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` BIGINT UNSIGNED NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(14,3) NOT NULL DEFAULT 1.000,
  `unit` VARCHAR(30) NULL,
  `unit_price` DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  `tax_percent` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_items_invoice` (`invoice_id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_no` VARCHAR(40) NOT NULL,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `payment_date` DATETIME NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'MYR',
  `payment_method` ENUM('cash','bank_transfer','card','cheque','duitnow','other') NOT NULL DEFAULT 'bank_transfer',
  `reference_no` VARCHAR(120) NULL,
  `receipt_file` VARCHAR(500) NULL,
  `status` ENUM('pending','confirmed','refunded','void') NOT NULL DEFAULT 'confirmed',
  `notes` TEXT NULL,
  `received_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_no` (`payment_no`),
  KEY `idx_payments_customer` (`customer_id`),
  KEY `idx_payments_project` (`project_id`),
  KEY `idx_payments_date` (`payment_date`),
  CONSTRAINT `fk_payments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payments_staff` FOREIGN KEY (`received_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_allocations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` BIGINT UNSIGNED NOT NULL,
  `invoice_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_invoice_allocation` (`payment_id`,`invoice_id`),
  CONSTRAINT `fk_payment_allocations_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payment_allocations_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 22. CUSTOMER PORTAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS `customer_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `email_verified_at` DATETIME NULL,
  `last_login_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_users_email` (`email`),
  KEY `idx_customer_users_customer` (`customer_id`),
  CONSTRAINT `fk_customer_users_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_portal_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `token_type` ENUM('email_verify','password_reset','magic_login') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_portal_token_hash` (`token_hash`),
  KEY `idx_customer_portal_tokens_user` (`customer_user_id`),
  CONSTRAINT `fk_customer_portal_tokens_user` FOREIGN KEY (`customer_user_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_portal_activity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_user_id` BIGINT UNSIGNED NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(60) NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_portal_activity_user` (`customer_user_id`,`created_at`),
  CONSTRAINT `fk_customer_portal_activity_user` FOREIGN KEY (`customer_user_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 23-25. PROJECT ACTIVITY, INTERNAL NOTES, DOCUMENT CENTRE
-- ============================================================================

CREATE TABLE IF NOT EXISTS `project_activity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `staff_id` INT UNSIGNED NULL,
  `customer_user_id` BIGINT UNSIGNED NULL,
  `activity_type` VARCHAR(80) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `entity_type` VARCHAR(60) NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `metadata_json` LONGTEXT NULL,
  `is_customer_visible` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_activity_project_date` (`project_id`,`created_at`),
  CONSTRAINT `fk_project_activity_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_activity_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_activity_customer_user` FOREIGN KEY (`customer_user_id`) REFERENCES `customer_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Upgrade the earlier Phase 1 project_activity table.
CALL `ideare_add_column_if_missing`('project_activity','customer_user_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('project_activity','entity_type','VARCHAR(60) NULL');
CALL `ideare_add_column_if_missing`('project_activity','entity_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('project_activity','metadata_json','LONGTEXT NULL');
CALL `ideare_add_column_if_missing`('project_activity','is_customer_visible','TINYINT(1) NOT NULL DEFAULT 0');

CREATE TABLE IF NOT EXISTS `internal_notes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_type` ENUM('customer','lead','project','quotation','invoice','task','supplier','purchase_order','installation','warranty') NOT NULL,
  `entity_id` BIGINT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `customer_id` BIGINT UNSIGNED NULL,
  `note` TEXT NOT NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_internal_notes_entity` (`entity_type`,`entity_id`),
  KEY `idx_internal_notes_project` (`project_id`),
  KEY `idx_internal_notes_customer` (`customer_id`),
  CONSTRAINT `fk_internal_notes_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_internal_notes_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_internal_notes_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `documents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_code` VARCHAR(40) NULL,
  `customer_id` BIGINT UNSIGNED NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `category` ENUM('design','measurement','site_photo','quotation','invoice','receipt','purchase_order','installation','warranty','contract','other') NOT NULL DEFAULT 'other',
  `title` VARCHAR(200) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `mime_type` VARCHAR(120) NULL,
  `file_size` BIGINT UNSIGNED NULL,
  `version_no` INT UNSIGNED NOT NULL DEFAULT 1,
  `is_customer_visible` TINYINT(1) NOT NULL DEFAULT 0,
  `uploaded_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_documents_code` (`document_code`),
  KEY `idx_documents_customer` (`customer_id`),
  KEY `idx_documents_project_category` (`project_id`,`category`),
  CONSTRAINT `fk_documents_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_documents_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_documents_staff` FOREIGN KEY (`uploaded_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 26. WARRANTY / AFTER-SALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `warranties` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `warranty_code` VARCHAR(40) NOT NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `starts_on` DATE NOT NULL,
  `expires_on` DATE NOT NULL,
  `status` ENUM('active','expired','void') NOT NULL DEFAULT 'active',
  `coverage_terms` LONGTEXT NULL,
  `exclusions` LONGTEXT NULL,
  `document_id` BIGINT UNSIGNED NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_warranties_code` (`warranty_code`),
  UNIQUE KEY `uq_warranties_project` (`project_id`),
  KEY `idx_warranties_customer` (`customer_id`),
  KEY `idx_warranties_expiry` (`expires_on`,`status`),
  CONSTRAINT `fk_warranties_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_warranties_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_warranties_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warranties_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `warranty_claims` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `claim_code` VARCHAR(40) NOT NULL,
  `warranty_id` BIGINT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `issue_title` VARCHAR(200) NOT NULL,
  `issue_description` TEXT NOT NULL,
  `status` ENUM('new','assigned','inspection_required','repair_scheduled','in_progress','resolved','rejected','closed') NOT NULL DEFAULT 'new',
  `priority` ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `assigned_to` INT UNSIGNED NULL,
  `scheduled_at` DATETIME NULL,
  `resolution_notes` TEXT NULL,
  `resolved_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_warranty_claims_code` (`claim_code`),
  KEY `idx_warranty_claims_warranty` (`warranty_id`),
  KEY `idx_warranty_claims_status` (`status`,`priority`),
  CONSTRAINT `fk_warranty_claims_warranty` FOREIGN KEY (`warranty_id`) REFERENCES `warranties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_warranty_claims_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_warranty_claims_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_warranty_claims_staff` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `warranty_claim_files` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `warranty_claim_id` BIGINT UNSIGNED NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `uploaded_by_type` ENUM('staff','customer') NOT NULL DEFAULT 'customer',
  `uploaded_by_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_warranty_claim_files_claim` (`warranty_claim_id`),
  CONSTRAINT `fk_warranty_claim_files_claim` FOREIGN KEY (`warranty_claim_id`) REFERENCES `warranty_claims` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 28. BUSINESS DASHBOARD SUPPORT
-- Dashboard KPIs are mostly calculated from operational tables; targets are stored here.
-- ============================================================================

CREATE TABLE IF NOT EXISTS `business_targets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `period_type` ENUM('month','quarter','year') NOT NULL DEFAULT 'month',
  `period_start` DATE NOT NULL,
  `revenue_target` DECIMAL(14,2) NULL,
  `sales_target` DECIMAL(14,2) NULL,
  `gross_profit_target` DECIMAL(14,2) NULL,
  `lead_target` INT UNSIGNED NULL,
  `conversion_target_percent` DECIMAL(6,2) NULL,
  `projects_completed_target` INT UNSIGNED NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_business_targets_period` (`period_type`,`period_start`),
  CONSTRAINT `fk_business_targets_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 30. NOTIFICATION CENTRE
-- Preserve the existing notifications table and extend it only when columns are missing.
-- ============================================================================

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staff_id` INT UNSIGNED NULL,
  `title` VARCHAR(180) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(60) NOT NULL DEFAULT 'info',
  `link_url` VARCHAR(500) NULL,
  `entity_type` VARCHAR(60) NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_staff_read` (`staff_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_notifications_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL `ideare_add_column_if_missing`('notifications','entity_type','VARCHAR(60) NULL');
CALL `ideare_add_column_if_missing`('notifications','entity_id','BIGINT UNSIGNED NULL');
CALL `ideare_add_column_if_missing`('notifications','link_url','VARCHAR(500) NULL');
CALL `ideare_add_column_if_missing`('notifications','is_read','TINYINT(1) NOT NULL DEFAULT 0');
CALL `ideare_add_column_if_missing`('notifications','read_at','DATETIME NULL');

CREATE TABLE IF NOT EXISTS `customer_notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(60) NOT NULL DEFAULT 'info',
  `link_url` VARCHAR(500) NULL,
  `entity_type` VARCHAR(60) NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_notifications_user_read` (`customer_user_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_customer_notifications_user` FOREIGN KEY (`customer_user_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 31. PERMISSIONS / ROLES
-- Existing roles/permissions tables are kept; add module permissions.
-- ============================================================================

INSERT IGNORE INTO `permissions` (`name`,`permission_key`,`description`) VALUES
('View CRM','crm.view','View customers, leads and follow-ups'),
('Manage CRM','crm.manage','Create and update customers, leads and follow-ups'),
('View Projects','projects.view','View projects and project activity'),
('Manage Projects','projects.manage','Create and update projects'),
('View Measurements','measurements.view','View site measurements'),
('Manage Measurements','measurements.manage','Create and update site measurements'),
('View Materials','materials.view','View material catalogue and costs allowed by role'),
('Manage Materials','materials.manage','Manage material catalogue'),
('View Suppliers','suppliers.view','View suppliers'),
('Manage Suppliers','suppliers.manage','Manage suppliers'),
('View Purchasing','purchasing.view','View purchase orders and receipts'),
('Manage Purchasing','purchasing.manage','Create and manage purchase orders'),
('Approve Purchasing','purchasing.approve','Approve purchase orders'),
('View Inventory','inventory.view','View stock and inventory movements'),
('Manage Inventory','inventory.manage','Manage stock, reservations and adjustments'),
('View Production','production.view','View production board'),
('Manage Production','production.manage','Manage production jobs and stages'),
('View Quality Control','qc.view','View quality inspections'),
('Manage Quality Control','qc.manage','Perform and sign off quality inspections'),
('View Installations','installations.view','View installation schedule'),
('Manage Installations','installations.manage','Schedule and manage installations'),
('View Tasks','tasks.view','View assigned/allowed tasks'),
('Manage Tasks','tasks.manage','Create, assign and manage tasks'),
('View Calendar','calendar.view','View staff calendar'),
('Manage Calendar','calendar.manage','Create and manage calendar events'),
('View Appointments','appointments.view','View customer appointments'),
('Manage Appointments','appointments.manage','Confirm and manage customer appointments'),
('View Quotations','quotations.view','View quotations'),
('Manage Quotations','quotations.manage','Create and revise quotations'),
('View Quotation Cost','quotations.view_cost','View internal quotation cost and margin'),
('Approve Quotations','quotations.approve','Approve discounts, margins and quotation changes'),
('View Finance','finance.view','View invoices, payments and balances'),
('Manage Finance','finance.manage','Create invoices and record payments'),
('Approve Finance','finance.approve','Approve refunds and finance adjustments'),
('Manage Customer Portal','portal.manage','Manage customer portal access'),
('View Documents','documents.view','View project/customer documents'),
('Manage Documents','documents.manage','Upload and manage documents'),
('View Warranty','warranty.view','View warranties and claims'),
('Manage Warranty','warranty.manage','Manage warranties and after-sales claims'),
('View Dashboard','dashboard.view','View business dashboard'),
('View Financial Dashboard','dashboard.finance','View dashboard financial KPIs'),
('Manage Notifications','notifications.manage','Create/manage staff or customer notifications'),
('Manage Roles','roles.manage','Manage roles and permissions'),
('Use Global Search','search.use','Use global staff search'),
('Manage Project Gallery','gallery.manage','Manage public completed-project gallery'),
('Manage Inspiration Gallery','inspiration.manage','Manage cabinet inspiration gallery');

-- Give broad access to owner/manager roles when those role slugs exist.
INSERT IGNORE INTO `role_permissions` (`role_id`,`permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p ON p.permission_key IN (
  'crm.view','crm.manage','projects.view','projects.manage','measurements.view','measurements.manage',
  'materials.view','materials.manage','suppliers.view','suppliers.manage','purchasing.view','purchasing.manage','purchasing.approve',
  'inventory.view','inventory.manage','production.view','production.manage','qc.view','qc.manage',
  'installations.view','installations.manage','tasks.view','tasks.manage','calendar.view','calendar.manage',
  'appointments.view','appointments.manage','quotations.view','quotations.manage','quotations.view_cost','quotations.approve',
  'finance.view','finance.manage','finance.approve','portal.manage','documents.view','documents.manage',
  'warranty.view','warranty.manage','dashboard.view','dashboard.finance','notifications.manage','roles.manage',
  'search.use','gallery.manage','inspiration.manage'
)
WHERE r.slug IN ('owner','manager');

-- Supervisors receive operational access but not sensitive finance/role permissions.
INSERT IGNORE INTO `role_permissions` (`role_id`,`permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p ON p.permission_key IN (
  'crm.view','projects.view','measurements.view','measurements.manage','materials.view',
  'inventory.view','production.view','production.manage','qc.view','qc.manage',
  'installations.view','installations.manage','tasks.view','tasks.manage','calendar.view',
  'appointments.view','quotations.view','documents.view','documents.manage','warranty.view',
  'dashboard.view','search.use'
)
WHERE r.slug IN ('supervisor');

-- ============================================================================
-- 33. GLOBAL SEARCH SUPPORT
-- Global search queries existing tables directly. Add supporting indexes.
-- ============================================================================

CALL `ideare_add_index_if_missing`('customers','idx_search_customers_name_phone','`name`,`phone`');
CALL `ideare_add_index_if_missing`('projects','idx_search_projects_name','`name`');
CALL `ideare_add_index_if_missing`('suppliers','idx_search_suppliers_company','`company_name`');
CALL `ideare_add_index_if_missing`('documents','idx_search_documents_title','`title`');

-- ============================================================================
-- 34. HOMEPAGE PROJECT GALLERY
-- ============================================================================

CREATE TABLE IF NOT EXISTS `project_gallery_entries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL,
  `category` VARCHAR(100) NULL,
  `short_description` TEXT NULL,
  `full_description` LONGTEXT NULL,
  `location_label` VARCHAR(150) NULL,
  `completion_date` DATE NULL,
  `cover_image` VARCHAR(500) NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_published` TINYINT(1) NOT NULL DEFAULT 0,
  `published_at` DATETIME NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_gallery_slug` (`slug`),
  KEY `idx_project_gallery_publish` (`is_published`,`is_featured`,`sort_order`),
  CONSTRAINT `fk_project_gallery_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_gallery_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_gallery_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `gallery_entry_id` BIGINT UNSIGNED NOT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `caption` VARCHAR(255) NULL,
  `image_type` ENUM('before','after','detail','general') NOT NULL DEFAULT 'general',
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_project_gallery_images_entry` (`gallery_entry_id`,`sort_order`),
  CONSTRAINT `fk_project_gallery_images_entry` FOREIGN KEY (`gallery_entry_id`) REFERENCES `project_gallery_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 35. CABINET INSPIRATION GALLERY
-- ============================================================================

CREATE TABLE IF NOT EXISTS `inspiration_designs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL,
  `style_name` VARCHAR(120) NULL,
  `room_type` VARCHAR(100) NULL,
  `description` LONGTEXT NULL,
  `cover_image` VARCHAR(500) NULL,
  `base_design_id` INT UNSIGNED NULL,
  `default_template_id` INT UNSIGNED NULL,
  `default_finish_id` INT UNSIGNED NULL,
  `default_color_id` INT UNSIGNED NULL,
  `default_door_style_id` INT UNSIGNED NULL,
  `default_handle_id` INT UNSIGNED NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_published` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inspiration_designs_slug` (`slug`),
  KEY `idx_inspiration_publish` (`is_published`,`is_featured`,`sort_order`),
  CONSTRAINT `fk_inspiration_base_design` FOREIGN KEY (`base_design_id`) REFERENCES `designs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspiration_template` FOREIGN KEY (`default_template_id`) REFERENCES `cabinet_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspiration_finish` FOREIGN KEY (`default_finish_id`) REFERENCES `finishes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspiration_color` FOREIGN KEY (`default_color_id`) REFERENCES `colors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspiration_door` FOREIGN KEY (`default_door_style_id`) REFERENCES `door_styles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspiration_handle` FOREIGN KEY (`default_handle_id`) REFERENCES `handles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspiration_staff` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inspiration_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `inspiration_design_id` BIGINT UNSIGNED NOT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `caption` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_inspiration_images_design` (`inspiration_design_id`,`sort_order`),
  CONSTRAINT `fk_inspiration_images_design` FOREIGN KEY (`inspiration_design_id`) REFERENCES `inspiration_designs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inspiration_tags` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inspiration_tags_name` (`name`),
  UNIQUE KEY `uq_inspiration_tags_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inspiration_design_tags` (
  `inspiration_design_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`inspiration_design_id`,`tag_id`),
  CONSTRAINT `fk_inspiration_design_tags_design` FOREIGN KEY (`inspiration_design_id`) REFERENCES `inspiration_designs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inspiration_design_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `inspiration_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- USEFUL VIEWS FOR DASHBOARD / STOCK / SALES PIPELINE
-- ============================================================================

CREATE OR REPLACE VIEW `v_inventory_available` AS
SELECT
  s.id,
  s.location_id,
  l.location_code,
  l.name AS location_name,
  s.material_id,
  m.name AS material_name,
  s.quantity_on_hand,
  s.quantity_reserved,
  (s.quantity_on_hand - s.quantity_reserved) AS quantity_available,
  s.average_unit_cost,
  ((s.quantity_on_hand - s.quantity_reserved) * s.average_unit_cost) AS available_stock_value
FROM inventory_stock s
JOIN inventory_locations l ON l.id = s.location_id
JOIN materials m ON m.id = s.material_id;

CREATE OR REPLACE VIEW `v_sales_pipeline` AS
SELECT
  l.id AS lead_id,
  l.lead_code,
  l.stage,
  l.estimated_value,
  l.probability,
  ROUND(l.estimated_value * (l.probability / 100), 2) AS weighted_value,
  l.next_follow_up_at,
  c.id AS customer_id,
  c.customer_code,
  c.name AS customer_name,
  c.phone,
  l.assigned_to
FROM leads l
JOIN customers c ON c.id = l.customer_id;

CREATE OR REPLACE VIEW `v_invoice_balances` AS
SELECT
  i.id,
  i.invoice_no,
  i.customer_id,
  i.project_id,
  i.status,
  i.issue_date,
  i.due_date,
  i.total_amount,
  COALESCE(SUM(pa.amount),0) AS allocated_paid_amount,
  (i.total_amount - COALESCE(SUM(pa.amount),0)) AS calculated_balance
FROM invoices i
LEFT JOIN payment_allocations pa ON pa.invoice_id = i.id
GROUP BY i.id, i.invoice_no, i.customer_id, i.project_id, i.status, i.issue_date, i.due_date, i.total_amount;

-- ============================================================================
-- OPTIONAL BASE SEED DATA
-- ============================================================================

INSERT IGNORE INTO `inventory_locations` (`location_code`,`name`,`location_type`) VALUES
('MAIN-WH','Main Warehouse','warehouse'),
('WORKSHOP','Main Workshop','workshop');

INSERT IGNORE INTO `inspiration_tags` (`name`,`slug`) VALUES
('Modern','modern'),
('Minimalist','minimalist'),
('Japandi','japandi'),
('Industrial','industrial'),
('Luxury','luxury'),
('Scandinavian','scandinavian'),
('Classic','classic');

-- ----------------------------------------------------------------------------
-- Cleanup helper procedures and restore FK setting.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `ideare_add_column_if_missing`;
DROP PROCEDURE IF EXISTS `ideare_add_index_if_missing`;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- ============================================================================
-- END OF MASTER MIGRATION
-- ============================================================================
