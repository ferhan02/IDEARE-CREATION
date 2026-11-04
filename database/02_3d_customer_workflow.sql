-- IDEARE configurator customer save, private edit links and PDF attachments.
-- Run AFTER 01_3d_configurator_schema.sql in ideare_db.
USE `ideare_db`;
CREATE TABLE IF NOT EXISTS `designer_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` DATETIME NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_dat_hash` (`token_hash`), KEY `idx_dat_design` (`design_id`),
  CONSTRAINT `fk_dat_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `designer_documents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `design_id` INT UNSIGNED NOT NULL,
  `revision_no` INT UNSIGNED NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(500) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  `file_size` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_dd_design` (`design_id`),
  CONSTRAINT `fk_dd_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
