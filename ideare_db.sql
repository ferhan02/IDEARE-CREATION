-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 28, 2026 at 04:27 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ideare_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `cabinet_categories`
--

CREATE TABLE `cabinet_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cabinet_categories`
--

INSERT INTO `cabinet_categories` (`id`, `name`, `slug`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Base Cabinets', 'base-cabinets', 'Floor-mounted cabinets for kitchens and built-in storage.', 1, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(2, 'Wall / Upper Cabinets', 'wall-cabinets', 'Wall-mounted, overhead, glass-front and open shelving cabinets.', 2, 1, '2026-10-01 17:06:22', '2026-10-28 02:37:00'),
(3, 'Tall / Pantry Cabinets', 'tall-cabinets', 'Full-height pantry, appliance towers and utility cabinetry.', 3, 1, '2026-10-01 17:06:22', '2026-10-28 02:37:00'),
(4, 'Specialty & Corner Cabinets', 'special-cabinets', 'L-shaped, blind corner, pull-out, island and special-purpose modules.', 4, 1, '2026-10-01 17:06:22', '2026-10-28 02:37:00'),
(5, 'Demo Cabinets', 'demo-cabinets', 'Demo seeded description for cabinet categories.', 1, 1, '2026-10-02 04:19:21', '2026-10-02 04:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `cabinet_templates`
--

CREATE TABLE `cabinet_templates` (
  `id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `preview_image` varchar(255) DEFAULT NULL,
  `geometry_type` varchar(50) NOT NULL DEFAULT 'rectangular',
  `construction_type` varchar(50) NOT NULL DEFAULT 'carcass',
  `default_interior_json` longtext DEFAULT NULL,
  `capabilities_json` longtext DEFAULT NULL,
  `allow_custom_dimensions` tinyint(1) NOT NULL DEFAULT 1,
  `rule_set_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `default_width` decimal(10,2) NOT NULL DEFAULT 600.00,
  `default_height` decimal(10,2) NOT NULL DEFAULT 850.00,
  `default_depth` decimal(10,2) NOT NULL DEFAULT 600.00,
  `min_width` decimal(10,2) NOT NULL DEFAULT 300.00,
  `max_width` decimal(10,2) NOT NULL DEFAULT 1200.00,
  `width_step` decimal(10,2) NOT NULL DEFAULT 50.00,
  `min_height` decimal(10,2) NOT NULL DEFAULT 600.00,
  `max_height` decimal(10,2) NOT NULL DEFAULT 2400.00,
  `height_step` decimal(10,2) NOT NULL DEFAULT 50.00,
  `min_depth` decimal(10,2) NOT NULL DEFAULT 300.00,
  `max_depth` decimal(10,2) NOT NULL DEFAULT 700.00,
  `depth_step` decimal(10,2) NOT NULL DEFAULT 50.00,
  `base_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cabinet_templates`
--

INSERT INTO `cabinet_templates` (`id`, `category_id`, `name`, `slug`, `description`, `preview_image`, `geometry_type`, `construction_type`, `default_interior_json`, `capabilities_json`, `allow_custom_dimensions`, `rule_set_version`, `default_width`, `default_height`, `default_depth`, `min_width`, `max_width`, `width_step`, `min_height`, `max_height`, `height_step`, `min_depth`, `max_depth`, `depth_step`, `base_price`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Standard Base Cabinet', 'standard-base-cabinet', 'General-purpose base cabinet with two doors.', 'assets/images/cabinets/base-standard.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 850.00, 600.00, 300.00, 1200.00, 50.00, 750.00, 950.00, 50.00, 500.00, 650.00, 50.00, 500.00, 1, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(2, 1, 'Single Door Base Cabinet', 'single-door-base-cabinet', 'Compact base cabinet with one hinged door.', 'assets/images/cabinets/base-single-door.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 450.00, 850.00, 600.00, 300.00, 600.00, 50.00, 750.00, 950.00, 50.00, 500.00, 650.00, 50.00, 420.00, 2, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(3, 1, 'Drawer Cabinet', 'drawer-cabinet', 'Base cabinet with stacked drawers.', 'assets/images/cabinets/base-drawers.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 850.00, 600.00, 450.00, 900.00, 50.00, 750.00, 950.00, 50.00, 500.00, 650.00, 50.00, 650.00, 3, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(4, 1, 'Sink Cabinet', 'sink-cabinet', 'Base cabinet designed to accommodate a sink and plumbing.', 'assets/images/cabinets/base-sink.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 900.00, 850.00, 600.00, 600.00, 1200.00, 50.00, 750.00, 950.00, 50.00, 500.00, 650.00, 50.00, 600.00, 4, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(5, 1, 'Open Shelf Base Cabinet', 'open-shelf-base-cabinet', 'Open base unit for decorative or easy-access storage.', 'assets/images/cabinets/base-open-shelf.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 850.00, 600.00, 300.00, 900.00, 50.00, 750.00, 950.00, 50.00, 400.00, 650.00, 50.00, 450.00, 5, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(6, 2, 'Standard Wall Cabinet', 'standard-wall-cabinet', 'Two-door wall-mounted cabinet.', 'assets/images/cabinets/wall-standard.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 700.00, 350.00, 300.00, 1200.00, 50.00, 400.00, 1000.00, 50.00, 300.00, 450.00, 50.00, 400.00, 6, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(7, 2, 'Single Door Wall Cabinet', 'single-door-wall-cabinet', 'Compact wall cabinet with one hinged door.', 'assets/images/cabinets/wall-single-door.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 450.00, 700.00, 350.00, 300.00, 600.00, 50.00, 400.00, 1000.00, 50.00, 300.00, 450.00, 50.00, 340.00, 7, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(8, 2, 'Glass Door Wall Cabinet', 'glass-door-wall-cabinet', 'Wall cabinet intended for glass-panel doors.', 'assets/images/cabinets/wall-glass.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 700.00, 350.00, 400.00, 900.00, 50.00, 500.00, 1000.00, 50.00, 300.00, 450.00, 50.00, 520.00, 8, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(9, 2, 'Open Wall Shelf', 'open-wall-shelf', 'Open wall-mounted storage unit without doors.', 'assets/images/cabinets/wall-open-shelf.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 500.00, 300.00, 300.00, 1200.00, 50.00, 300.00, 900.00, 50.00, 250.00, 400.00, 50.00, 280.00, 9, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(10, 3, 'Tall Storage Cabinet', 'tall-storage-cabinet', 'Full-height pantry or general storage cabinet.', 'assets/images/cabinets/tall-storage.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 2100.00, 600.00, 450.00, 900.00, 50.00, 1800.00, 2400.00, 50.00, 500.00, 650.00, 50.00, 900.00, 10, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(11, 3, 'Tall Oven Cabinet', 'tall-oven-cabinet', 'Tall cabinet designed for built-in oven placement.', 'assets/images/cabinets/tall-oven.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 2100.00, 600.00, 600.00, 900.00, 50.00, 1800.00, 2400.00, 50.00, 550.00, 650.00, 50.00, 1100.00, 11, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(12, 3, 'Tall Utility Cabinet', 'tall-utility-cabinet', 'Tall cabinet for cleaning equipment or utility storage.', 'assets/images/cabinets/tall-utility.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 2100.00, 600.00, 450.00, 900.00, 50.00, 1800.00, 2400.00, 50.00, 500.00, 650.00, 50.00, 950.00, 12, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(13, 4, 'Corner Base Cabinet', 'corner-base-cabinet', 'Special base cabinet designed for kitchen corners.', 'assets/images/cabinets/corner-base.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 900.00, 850.00, 900.00, 800.00, 1200.00, 50.00, 750.00, 950.00, 50.00, 800.00, 1200.00, 50.00, 850.00, 13, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(14, 4, 'Island Cabinet', 'island-cabinet', 'Base cabinet designed for kitchen island layouts.', 'assets/images/cabinets/island.png', 'rectangular', 'carcass', NULL, NULL, 1, 1, 1200.00, 850.00, 900.00, 900.00, 2400.00, 50.00, 750.00, 950.00, 50.00, 700.00, 1200.00, 50.00, 1250.00, 14, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(15, 5, 'Demo Base Cabinet', 'demo-base-cabinet', 'Demo seeded description for cabinet templates.', 'uploads/demo/cabinet_templates-preview_image.dat', 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 850.00, 600.00, 600.00, 600.00, 600.00, 850.00, 850.00, 850.00, 600.00, 600.00, 600.00, 520.00, 1, 1, '2026-10-02 04:19:21', '2026-10-02 04:19:21'),
(16, 1, 'Hob Base Cabinet', 'hob-base-cabinet', 'Hob unit: cutout and ventilation reviewed against selected appliance.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 900.00, 850.00, 600.00, 600.00, 1200.00, 10.00, 750.00, 950.00, 10.00, 500.00, 700.00, 10.00, 0.00, 16, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(17, 1, 'Built-in Oven Base Cabinet', 'oven-base-cabinet', 'Integrated oven base; appliance dimensions required.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 850.00, 600.00, 500.00, 900.00, 10.00, 750.00, 1000.00, 10.00, 550.00, 700.00, 10.00, 0.00, 17, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(18, 1, 'Pull-out Base Cabinet', 'pullout-base-cabinet', 'Narrow storage with manufacturer-specific pull-out mechanism.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 300.00, 850.00, 600.00, 150.00, 600.00, 10.00, 750.00, 950.00, 10.00, 450.00, 700.00, 10.00, 0.00, 18, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(19, 1, 'Door and Drawer Base Cabinet', 'door-drawer-base-cabinet', 'Combined drawer and hinged-door fronts.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 850.00, 600.00, 300.00, 1200.00, 10.00, 750.00, 950.00, 10.00, 450.00, 700.00, 10.00, 0.00, 19, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(20, 2, 'Lift-up Wall Cabinet', 'lift-up-wall-cabinet', 'Upper cabinet with lift-up front.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 800.00, 600.00, 350.00, 450.00, 1200.00, 10.00, 350.00, 900.00, 10.00, 250.00, 500.00, 10.00, 0.00, 20, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(21, 2, 'Extractor Hood Wall Cabinet', 'extractor-hood-wall-cabinet', 'Cabinet around an extractor hood; clearances must be checked.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 900.00, 700.00, 350.00, 600.00, 1200.00, 10.00, 400.00, 1000.00, 10.00, 250.00, 500.00, 10.00, 0.00, 21, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(22, 2, 'Wall Microwave Cabinet', 'wall-microwave-cabinet', 'Microwave compartment with appliance ventilation review.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 700.00, 400.00, 500.00, 900.00, 10.00, 400.00, 1000.00, 10.00, 300.00, 600.00, 10.00, 0.00, 22, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(23, 3, 'Pull-out Tall Pantry Cabinet', 'pullout-tall-pantry-cabinet', 'Full-height pantry using pull-out storage hardware.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 2100.00, 600.00, 300.00, 900.00, 10.00, 1800.00, 2600.00, 10.00, 450.00, 700.00, 10.00, 0.00, 23, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(24, 3, 'Tall Oven and Microwave Tower', 'tall-oven-microwave-tower', 'Combined oven and microwave housing.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 600.00, 2200.00, 600.00, 550.00, 1000.00, 10.00, 1800.00, 2700.00, 10.00, 500.00, 700.00, 10.00, 0.00, 24, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(25, 3, 'Fridge Surround Cabinet', 'fridge-surround-cabinet', 'Tall refrigerator housing; ventilation and appliance clearances required.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 900.00, 2200.00, 700.00, 650.00, 1400.00, 10.00, 1800.00, 2800.00, 10.00, 500.00, 900.00, 10.00, 0.00, 25, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(26, 4, 'L-shaped Corner Base Cabinet', 'l-shaped-corner-base-cabinet', 'L-corner footprint with configurable openings.', NULL, 'l_corner', 'carcass', NULL, NULL, 1, 1, 900.00, 850.00, 900.00, 750.00, 1300.00, 10.00, 750.00, 950.00, 10.00, 750.00, 1300.00, 10.00, 0.00, 26, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(27, 4, 'Blind Corner Base Cabinet', 'blind-corner-base-cabinet', 'Blind-corner unit compatible with selected pull-out mechanism.', NULL, 'blind_corner', 'carcass', NULL, NULL, 1, 1, 1000.00, 850.00, 600.00, 800.00, 1400.00, 10.00, 750.00, 950.00, 10.00, 500.00, 800.00, 10.00, 0.00, 27, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(28, 4, 'Diagonal Corner Cabinet', 'diagonal-corner-cabinet', 'Angled front cabinet with corner footprint.', NULL, 'diagonal_corner', 'carcass', NULL, NULL, 1, 1, 900.00, 850.00, 900.00, 750.00, 1300.00, 10.00, 750.00, 950.00, 10.00, 750.00, 1300.00, 10.00, 0.00, 28, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(29, 4, 'Corner Carousel Cabinet', 'corner-carousel-cabinet', 'Corner cabinet with rotating organizer requiring fitting envelope.', NULL, 'l_corner', 'carcass', NULL, NULL, 1, 1, 900.00, 850.00, 900.00, 750.00, 1300.00, 10.00, 750.00, 950.00, 10.00, 750.00, 1300.00, 10.00, 0.00, 29, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(30, 4, 'Peninsula Cabinet', 'peninsula-cabinet', 'Cabinet run with an exposed end and optional seating overhang.', NULL, 'rectangular', 'carcass', NULL, NULL, 1, 1, 1200.00, 850.00, 900.00, 600.00, 2400.00, 10.00, 750.00, 950.00, 10.00, 600.00, 1200.00, 10.00, 0.00, 30, 1, '2026-10-28 02:37:00', '2026-10-28 02:37:00');

-- --------------------------------------------------------

--
-- Table structure for table `casero_stone_quartz`
--

CREATE TABLE `casero_stone_quartz` (
  `quartz_id` bigint(20) UNSIGNED NOT NULL,
  `sku` varchar(100) NOT NULL,
  `quartz_name` varchar(255) DEFAULT NULL,
  `series_name` varchar(150) DEFAULT NULL,
  `base_colour` varchar(150) DEFAULT NULL,
  `vein_colour` varchar(150) DEFAULT NULL,
  `vein_style` varchar(100) DEFAULT NULL,
  `pattern_level` varchar(100) DEFAULT NULL,
  `finish` varchar(100) DEFAULT NULL,
  `quartz_content` varchar(100) DEFAULT NULL,
  `sheet_length_mm` decimal(10,2) DEFAULT NULL,
  `sheet_width_mm` decimal(10,2) DEFAULT NULL,
  `available_thickness` varchar(150) DEFAULT NULL,
  `edge_profile_notes` varchar(255) DEFAULT NULL,
  `recommended_application` text DEFAULT NULL,
  `image_file` varchar(500) DEFAULT NULL,
  `image_preview` varchar(500) DEFAULT NULL,
  `product_source_url` text DEFAULT NULL,
  `catalogue_filename` varchar(255) DEFAULT NULL,
  `catalogue_page_number` int(10) UNSIGNED DEFAULT NULL,
  `extraction_method` varchar(100) DEFAULT NULL,
  `extraction_score` decimal(5,2) DEFAULT NULL,
  `data_status` enum('new','verified','incomplete','rejected') NOT NULL DEFAULT 'new',
  `available` tinyint(1) NOT NULL DEFAULT 1,
  `internal_remark` text DEFAULT NULL,
  `date_added` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_modified` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `casero_stone_sintered`
--

CREATE TABLE `casero_stone_sintered` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_code` varchar(100) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `collection` varchar(150) DEFAULT NULL,
  `colour_name` varchar(150) DEFAULT NULL,
  `design_type` varchar(100) DEFAULT NULL,
  `surface_finish` varchar(100) DEFAULT NULL,
  `slab_width_mm` decimal(10,2) DEFAULT NULL,
  `slab_length_mm` decimal(10,2) DEFAULT NULL,
  `slab_size_display` varchar(100) DEFAULT NULL,
  `thickness_mm` varchar(100) DEFAULT NULL,
  `bookmatch_available` tinyint(1) NOT NULL DEFAULT 0,
  `primary_image` varchar(500) DEFAULT NULL,
  `thumbnail_image` varchar(500) DEFAULT NULL,
  `drive_folder_url` text DEFAULT NULL,
  `source_pdf` varchar(255) DEFAULT NULL,
  `source_page` int(10) UNSIGNED DEFAULT NULL,
  `detector` varchar(100) DEFAULT NULL,
  `text_source` varchar(100) DEFAULT NULL,
  `confidence` decimal(5,2) DEFAULT NULL,
  `crop_x0` decimal(10,2) DEFAULT NULL,
  `crop_y0` decimal(10,2) DEFAULT NULL,
  `crop_x1` decimal(10,2) DEFAULT NULL,
  `crop_y1` decimal(10,2) DEFAULT NULL,
  `crop_width_px` int(10) UNSIGNED DEFAULT NULL,
  `crop_height_px` int(10) UNSIGNED DEFAULT NULL,
  `review_status` enum('pending','approved','rejected','needs_review') NOT NULL DEFAULT 'pending',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `colors`
--

CREATE TABLE `colors` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `hex_code` varchar(20) DEFAULT NULL,
  `texture_image` varchar(255) DEFAULT NULL,
  `price_modifier` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `colors`
--

INSERT INTO `colors` (`id`, `name`, `slug`, `hex_code`, `texture_image`, `price_modifier`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Pure White', 'pure-white', '#FFFFFF', NULL, 0.00, 1, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(2, 'Warm White', 'warm-white', '#F6F0E5', NULL, 0.00, 2, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(3, 'Soft Grey', 'soft-grey', '#CFCFCF', NULL, 0.00, 3, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(4, 'Charcoal Grey', 'charcoal-grey', '#4A4A4A', NULL, 20.00, 4, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(5, 'Matte Black', 'matte-black', '#1E1E1E', NULL, 30.00, 5, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(6, 'Beige', 'beige', '#D9C7AA', NULL, 0.00, 6, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(7, 'Sage Green', 'sage-green', '#A8B5A2', NULL, 40.00, 7, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(8, 'Navy Blue', 'navy-blue', '#263A53', NULL, 40.00, 8, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(9, 'Light Oak', 'light-oak', NULL, 'assets/images/colors/light-oak.jpg', 50.00, 9, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(10, 'Natural Oak', 'natural-oak', NULL, 'assets/images/colors/natural-oak.jpg', 60.00, 10, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(11, 'Dark Walnut', 'dark-walnut', NULL, 'assets/images/colors/dark-walnut.jpg', 80.00, 11, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(12, 'Ash Wood', 'ash-wood', NULL, 'assets/images/colors/ash-wood.jpg', 70.00, 12, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(13, 'Demo Sand', 'demo-sand', '#D8CBB8', 'uploads/demo/colors-texture_image.dat', 100.00, 1, 1, '2026-10-02 04:19:21', '2026-10-02 04:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_code` varchar(30) NOT NULL,
  `name` varchar(180) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `alternate_phone` varchar(50) DEFAULT NULL,
  `email` varchar(180) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `site_address` text DEFAULT NULL,
  `city` varchar(120) DEFAULT NULL,
  `state` varchar(120) DEFAULT NULL,
  `postcode` varchar(20) DEFAULT NULL,
  `lead_source` varchar(100) DEFAULT NULL,
  `interested_service` varchar(150) DEFAULT NULL,
  `assigned_to` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('lead','prospect','active','inactive','completed','blacklisted') NOT NULL DEFAULT 'lead',
  `preferred_contact_method` enum('phone','whatsapp','email','other') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `customer_code`, `name`, `phone`, `alternate_phone`, `email`, `billing_address`, `site_address`, `city`, `state`, `postcode`, `lead_source`, `interested_service`, `assigned_to`, `status`, `preferred_contact_method`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'CUST-DEMO-001', 'Demo Customer', '012-9901001', '012-9900001', 'demo.customer@example.test', '12 Demo Street, Kuala Lumpur', '88 Sample Avenue, Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur', '50000', 'Website', 'Kitchen Cabinet', NULL, 'active', 'whatsapp', 'Demo seeded notes for customers.', NULL, '2026-10-02 04:19:21', '2026-11-25 01:50:53'),
(2, 'CUST-DEMO-002', 'Demo Wardrobe Enquiry Customer', '012-9910002', NULL, 'demo.customer2@example.test', NULL, '2 Demo Road, Kuala Lumpur', NULL, NULL, NULL, 'Referral', 'Wardrobe', NULL, 'active', 'whatsapp', NULL, NULL, '2026-10-02 04:19:22', '2026-11-25 01:50:53'),
(3, 'CUST-DEMO-003', 'Demo TV Cabinet Customer', '012-9910003', NULL, 'demo.customer3@example.test', NULL, '3 Demo Road, Kuala Lumpur', NULL, NULL, NULL, 'Referral', 'TV Cabinet', NULL, 'active', 'whatsapp', NULL, NULL, '2026-10-02 04:19:22', '2026-11-25 01:50:53'),
(4, 'CUST-DEMO-004', 'Demo Office Storage Customer', '012-9910004', NULL, 'demo.customer4@example.test', NULL, '4 Demo Road, Kuala Lumpur', NULL, NULL, NULL, 'Referral', 'Commercial Cabinetry', NULL, 'active', 'whatsapp', NULL, NULL, '2026-10-02 04:19:22', '2026-11-25 01:50:53');

-- --------------------------------------------------------

--
-- Table structure for table `customer_appointments`
--

CREATE TABLE `customer_appointments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `appointment_code` varchar(40) NOT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_name` varchar(180) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `customer_email` varchar(180) DEFAULT NULL,
  `appointment_type` enum('consultation','site_measurement','showroom_visit','design_review','other') NOT NULL DEFAULT 'consultation',
  `requested_start` datetime NOT NULL,
  `requested_end` datetime DEFAULT NULL,
  `confirmed_start` datetime DEFAULT NULL,
  `assigned_to` int(10) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('requested','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'requested',
  `location` varchar(255) DEFAULT NULL,
  `customer_notes` text DEFAULT NULL,
  `staff_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_appointments`
--

INSERT INTO `customer_appointments` (`id`, `appointment_code`, `customer_id`, `customer_name`, `customer_phone`, `customer_email`, `appointment_type`, `requested_start`, `requested_end`, `confirmed_start`, `assigned_to`, `project_id`, `status`, `location`, `customer_notes`, `staff_notes`, `created_at`, `updated_at`) VALUES
(1, 'APT-DEMO-001', 1, 'Demo Customer', '012-9901001', 'demo.customer@example.test', 'design_review', '2026-10-02 12:00:00', '2026-10-02 12:00:00', '2026-10-02 12:00:00', NULL, NULL, 'confirmed', 'IdeaRE Showroom', 'Demo seeded customer notes for customer appointments.', 'Demo seeded staff notes for customer appointments.', '2026-10-02 04:19:21', '2026-11-25 01:50:53'),
(2, 'APT-2026-030326', NULL, 'ferhan', '0183868171', NULL, 'consultation', '2026-10-13 09:42:00', NULL, NULL, NULL, NULL, 'requested', 'Seremban', 'Requested service: Renovation & extension\nProperty type: Residential\nProject area: Seremban\n', NULL, '2026-10-12 05:30:46', '2026-10-12 05:30:46');

-- --------------------------------------------------------

--
-- Table structure for table `customer_appointment_attachments`
--

CREATE TABLE `customer_appointment_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `appointment_id` bigint(20) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `stored_name` varchar(128) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_appointment_details`
--

CREATE TABLE `customer_appointment_details` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `appointment_id` bigint(20) UNSIGNED NOT NULL,
  `project_type` varchar(50) NOT NULL,
  `property_type` varchar(40) NOT NULL,
  `project_stage` varchar(50) DEFAULT NULL,
  `project_focus` varchar(120) DEFAULT NULL,
  `project_size` varchar(120) DEFAULT NULL,
  `budget_range` varchar(70) DEFAULT NULL,
  `project_location` varchar(255) DEFAULT NULL,
  `consultation_method` varchar(40) NOT NULL,
  `alternative_start` datetime DEFAULT NULL,
  `preferred_contact` varchar(24) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_appointment_details`
--

INSERT INTO `customer_appointment_details` (`id`, `appointment_id`, `project_type`, `property_type`, `project_stage`, `project_focus`, `project_size`, `budget_range`, `project_location`, `consultation_method`, `alternative_start`, `preferred_contact`, `created_at`) VALUES
(1, 2, 'renovation', 'residential', 'planning', 'Kitchen', '2000', 'below_20k', 'Seremban', 'showroom', NULL, 'whatsapp', '2026-10-12 05:30:46');

-- --------------------------------------------------------

--
-- Table structure for table `designer_access_tokens`
--

CREATE TABLE `designer_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `design_id` int(10) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `revoked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_components`
--

CREATE TABLE `designer_components` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `design_item_id` int(10) UNSIGNED NOT NULL,
  `component_uuid` char(36) NOT NULL,
  `parent_component_id` bigint(20) UNSIGNED DEFAULT NULL,
  `component_type` varchar(40) NOT NULL COMMENT 'shelf,partition,door,drawer_front,drawer_box,rail,appliance_space,accessory,carcass_panel',
  `component_name` varchar(150) DEFAULT NULL,
  `pos_x_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `pos_y_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `pos_z_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `width_mm` decimal(12,2) DEFAULT NULL,
  `height_mm` decimal(12,2) DEFAULT NULL,
  `depth_mm` decimal(12,2) DEFAULT NULL,
  `thickness_mm` decimal(8,2) DEFAULT NULL,
  `is_adjustable` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `properties_json` longtext DEFAULT NULL COMMENT 'Opening, load, edge, grain, material and hardware selections',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_documents`
--

CREATE TABLE `designer_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `design_id` int(10) UNSIGNED NOT NULL,
  `revision_no` int(10) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) NOT NULL DEFAULT 'application/pdf',
  `file_size` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_hardware`
--

CREATE TABLE `designer_hardware` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hardware_code` varchar(100) NOT NULL,
  `name` varchar(180) NOT NULL,
  `hardware_type` varchar(50) NOT NULL COMMENT 'hinge,runner,lift,push_open,basket,carousel,rail,other',
  `brand` varchar(120) DEFAULT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Optional reference to suppliers; confirm existing PK before enforcing FK',
  `min_inner_width_mm` decimal(10,2) DEFAULT NULL,
  `max_inner_width_mm` decimal(10,2) DEFAULT NULL,
  `min_inner_depth_mm` decimal(10,2) DEFAULT NULL,
  `max_inner_depth_mm` decimal(10,2) DEFAULT NULL,
  `rated_load_kg` decimal(10,2) DEFAULT NULL,
  `clearance_rules_json` longtext DEFAULT NULL,
  `datasheet_url` varchar(500) DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_material_selections`
--

CREATE TABLE `designer_material_selections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `design_id` int(10) UNSIGNED NOT NULL,
  `design_item_id` int(10) UNSIGNED DEFAULT NULL,
  `component_id` bigint(20) UNSIGNED DEFAULT NULL,
  `shared_element_id` bigint(20) UNSIGNED DEFAULT NULL,
  `application` varchar(50) NOT NULL COMMENT 'carcass,door,shelf,worktop,backsplash,plinth,edge',
  `source_table` varchar(50) NOT NULL,
  `source_row_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_code_snapshot` varchar(100) DEFAULT NULL,
  `product_name_snapshot` varchar(255) DEFAULT NULL,
  `texture_path_snapshot` varchar(500) DEFAULT NULL,
  `grain_direction` varchar(20) DEFAULT NULL,
  `properties_json` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_revisions`
--

CREATE TABLE `designer_revisions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `design_id` int(10) UNSIGNED NOT NULL,
  `revision_no` int(10) UNSIGNED NOT NULL,
  `scene_json` longtext NOT NULL COMMENT 'Full editable snapshot: room geometry, objects, material IDs/codes and settings',
  `schema_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `rule_set_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `change_summary` varchar(500) DEFAULT NULL,
  `author_type` varchar(20) NOT NULL DEFAULT 'customer',
  `author_staff_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_rooms`
--

CREATE TABLE `designer_rooms` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `design_id` int(10) UNSIGNED NOT NULL,
  `room_name` varchar(150) NOT NULL DEFAULT 'Room 1',
  `shape_type` varchar(40) NOT NULL DEFAULT 'rectangle',
  `ceiling_height_mm` decimal(12,2) NOT NULL DEFAULT 2700.00,
  `floor_finish_json` longtext DEFAULT NULL,
  `wall_polygon_json` longtext NOT NULL COMMENT 'Ordered 2D vertices in millimetres',
  `room_metadata_json` longtext DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_room_features`
--

CREATE TABLE `designer_room_features` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `room_id` bigint(20) UNSIGNED NOT NULL,
  `feature_uuid` char(36) NOT NULL,
  `feature_type` varchar(40) NOT NULL COMMENT 'door,window,beam,pillar,outlet,plumbing,obstacle',
  `wall_index` int(11) DEFAULT NULL,
  `pos_x_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `pos_y_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `pos_z_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `width_mm` decimal(12,2) DEFAULT NULL,
  `height_mm` decimal(12,2) DEFAULT NULL,
  `depth_mm` decimal(12,2) DEFAULT NULL,
  `properties_json` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_shared_elements`
--

CREATE TABLE `designer_shared_elements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `design_id` int(10) UNSIGNED NOT NULL,
  `room_id` bigint(20) UNSIGNED DEFAULT NULL,
  `element_uuid` char(36) NOT NULL,
  `element_type` varchar(40) NOT NULL COMMENT 'worktop,plinth,backsplash,cover_panel,filler',
  `name` varchar(150) DEFAULT NULL,
  `geometry_json` longtext NOT NULL,
  `settings_json` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_shared_element_items`
--

CREATE TABLE `designer_shared_element_items` (
  `element_id` bigint(20) UNSIGNED NOT NULL,
  `design_item_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_template_hardware`
--

CREATE TABLE `designer_template_hardware` (
  `template_id` int(10) UNSIGNED NOT NULL,
  `hardware_id` bigint(20) UNSIGNED NOT NULL,
  `compatibility` varchar(20) NOT NULL DEFAULT 'review' COMMENT 'allowed,review,blocked',
  `notes` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_validation_findings`
--

CREATE TABLE `designer_validation_findings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `design_id` int(10) UNSIGNED NOT NULL,
  `design_item_id` int(10) UNSIGNED DEFAULT NULL,
  `rule_id` bigint(20) UNSIGNED DEFAULT NULL,
  `finding_code` varchar(100) NOT NULL,
  `severity` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `state` varchar(25) NOT NULL DEFAULT 'open' COMMENT 'open,resolved,accepted_for_review',
  `details_json` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designer_validation_rules`
--

CREATE TABLE `designer_validation_rules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `rule_code` varchar(100) NOT NULL,
  `rule_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `category_slug` varchar(120) DEFAULT NULL,
  `template_id` int(10) UNSIGNED DEFAULT NULL,
  `component_type` varchar(50) DEFAULT NULL,
  `rule_kind` varchar(50) NOT NULL,
  `severity` varchar(20) NOT NULL DEFAULT 'review' COMMENT 'info,warning,review,block',
  `criteria_json` longtext NOT NULL,
  `customer_message` varchar(500) NOT NULL,
  `staff_message` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `verified_by_staff_id` int(10) UNSIGNED DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `designer_validation_rules`
--

INSERT INTO `designer_validation_rules` (`id`, `rule_code`, `rule_version`, `category_slug`, `template_id`, `component_type`, `rule_kind`, `severity`, `criteria_json`, `customer_message`, `staff_message`, `is_active`, `verified_by_staff_id`, `verified_at`, `created_at`, `updated_at`) VALUES
(1, 'door_leaf_hardware_capacity', 1, NULL, NULL, NULL, 'door_hardware', 'review', '{}', 'Door size may require different hinges or a divided front.', 'Enter approved hinge model and maximum panel mass/size from manufacturer.', 0, NULL, NULL, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(2, 'shelf_span_and_loading', 1, NULL, NULL, NULL, 'shelf_deflection', 'review', '{}', 'A wide shelf may require a divider or reinforcement.', 'Enter approved panel type, thickness, loading, span and support method.', 0, NULL, NULL, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(3, 'drawer_runner_fit', 1, NULL, NULL, NULL, 'drawer_clearance', 'review', '{}', 'Drawer runners must fit the available internal opening.', 'Enter manufacturer-specific runner dimensions, side clearances and load.', 0, NULL, NULL, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(4, 'wall_cabinet_mounting', 1, NULL, NULL, NULL, 'installation', 'review', '{}', 'Wall-mounted units need site-specific fixing verification.', 'Confirm wall substrate, anchors, loading and mounting method.', 0, NULL, NULL, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(5, 'appliance_ventilation', 1, NULL, NULL, NULL, 'appliance', 'review', '{}', 'Built-in appliance clearances require review.', 'Validate model-specific cutout dimensions and ventilation instructions.', 0, NULL, NULL, '2026-10-28 02:37:00', '2026-10-28 02:37:00'),
(6, 'corner_fitting_envelope', 1, NULL, NULL, NULL, 'corner_hardware', 'review', '{}', 'Corner storage hardware requires sufficient clearance.', 'Enter opening, handedness and manufacturer envelope.', 0, NULL, NULL, '2026-10-28 02:37:00', '2026-10-28 02:37:00');

-- --------------------------------------------------------

--
-- Table structure for table `designs`
--

CREATE TABLE `designs` (
  `id` int(10) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by_staff_id` int(10) UNSIGNED DEFAULT NULL,
  `design_code` varchar(50) NOT NULL,
  `design_name` varchar(150) DEFAULT NULL,
  `designer_version` varchar(30) DEFAULT NULL,
  `customer_name` varchar(150) DEFAULT NULL,
  `customer_email` varchar(180) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `room_type` varchar(100) DEFAULT NULL,
  `property_type` varchar(80) DEFAULT NULL,
  `project_location` varchar(255) DEFAULT NULL,
  `budget_range` varchar(80) DEFAULT NULL,
  `preferred_contact_method` varchar(30) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `total_width` decimal(12,2) NOT NULL DEFAULT 0.00,
  `estimated_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','saved','submitted','quoted') NOT NULL DEFAULT 'draft',
  `submitted_at` datetime DEFAULT NULL,
  `staff_review_status` varchar(30) NOT NULL DEFAULT 'not_requested',
  `current_revision_no` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_at` datetime DEFAULT NULL,
  `approved_by_customer` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `designs`
--

INSERT INTO `designs` (`id`, `customer_id`, `project_id`, `created_by_staff_id`, `design_code`, `design_name`, `designer_version`, `customer_name`, `customer_email`, `customer_phone`, `room_type`, `property_type`, `project_location`, `budget_range`, `preferred_contact_method`, `notes`, `total_width`, `estimated_price`, `status`, `submitted_at`, `staff_review_status`, `current_revision_no`, `created_at`, `updated_at`, `approved_at`, `approved_by_customer`) VALUES
(1, NULL, NULL, NULL, 'IDEARE-D0001', 'Modern Walnut Kitchen Demo', NULL, 'Demo Customer', 'demo@example.com', '012-3456789', 'Kitchen', NULL, NULL, NULL, NULL, 'First presentation demo design for IdeaRE Cabinet Designer.', 2700.00, 3125.00, 'saved', NULL, 'not_requested', 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22', NULL, 0),
(2, NULL, NULL, NULL, 'IDEARE-D0002', 'White Shaker Kitchen Demo', NULL, 'Walk-in Customer', NULL, NULL, 'Kitchen', NULL, NULL, NULL, NULL, 'Alternative showroom-style demo with shaker doors.', 2400.00, 2890.00, 'draft', NULL, 'not_requested', 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22', NULL, 0),
(3, 1, NULL, NULL, 'IDEARE-DEMO-001', 'Demo Modern Kitchen Design', NULL, 'Demo Customer', 'demo.customer@example.test', '012-9901001', 'Kitchen', NULL, NULL, NULL, NULL, 'Demo seeded notes for designs.', 3600.00, 17800.00, 'saved', NULL, 'not_requested', 1, '2026-10-02 04:19:21', '2026-11-25 01:50:53', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `design_items`
--

CREATE TABLE `design_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `object_uuid` char(36) DEFAULT NULL,
  `design_id` int(10) UNSIGNED NOT NULL,
  `cabinet_template_id` int(10) UNSIGNED NOT NULL,
  `finish_id` int(10) UNSIGNED DEFAULT NULL,
  `color_id` int(10) UNSIGNED DEFAULT NULL,
  `door_style_id` int(10) UNSIGNED DEFAULT NULL,
  `handle_id` int(10) UNSIGNED DEFAULT NULL,
  `position_order` int(11) NOT NULL DEFAULT 0,
  `pos_x_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `pos_y_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `pos_z_mm` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rotation_y_deg` decimal(8,3) NOT NULL DEFAULT 0.000,
  `width` decimal(10,2) NOT NULL,
  `height` decimal(10,2) NOT NULL,
  `depth` decimal(10,2) NOT NULL,
  `carcass_thickness_mm` decimal(7,2) DEFAULT NULL,
  `config_json` longtext DEFAULT NULL,
  `validation_state` varchar(30) NOT NULL DEFAULT 'unchecked',
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `item_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `design_items`
--

INSERT INTO `design_items` (`id`, `object_uuid`, `design_id`, `cabinet_template_id`, `finish_id`, `color_id`, `door_style_id`, `handle_id`, `position_order`, `pos_x_mm`, `pos_y_mm`, `pos_z_mm`, `rotation_y_deg`, `width`, `height`, `depth`, `carcass_thickness_mm`, `config_json`, `validation_state`, `quantity`, `item_price`, `notes`, `created_at`, `updated_at`) VALUES
(1, NULL, 1, 1, 2, 11, 1, 1, 1, 0.00, 0.00, 0.00, 0.000, 600.00, 850.00, 600.00, NULL, NULL, 'unchecked', 1, 730.00, 'Left-side standard cabinet', '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(2, NULL, 1, 3, 2, 11, 1, 1, 2, 0.00, 0.00, 0.00, 0.000, 600.00, 850.00, 600.00, NULL, NULL, 'unchecked', 1, 880.00, 'Three-drawer module', '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(3, NULL, 1, 4, 2, 11, 1, 1, 3, 0.00, 0.00, 0.00, 0.000, 900.00, 850.00, 600.00, NULL, NULL, 'unchecked', 1, 830.00, 'Sink cabinet', '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(4, NULL, 1, 2, 2, 11, 1, 1, 4, 0.00, 0.00, 0.00, 0.000, 600.00, 850.00, 600.00, NULL, NULL, 'unchecked', 1, 685.00, 'Right-side storage cabinet', '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(5, NULL, 2, 1, 3, 1, 2, 2, 1, 0.00, 0.00, 0.00, 0.000, 600.00, 850.00, 600.00, NULL, NULL, 'unchecked', 1, 745.00, 'White shaker base cabinet', '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(6, NULL, 2, 3, 3, 1, 2, 2, 2, 0.00, 0.00, 0.00, 0.000, 600.00, 850.00, 600.00, NULL, NULL, 'unchecked', 1, 895.00, 'Drawer unit', '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(7, NULL, 2, 1, 3, 1, 2, 2, 3, 0.00, 0.00, 0.00, 0.000, 600.00, 850.00, 600.00, NULL, NULL, 'unchecked', 1, 745.00, 'Second base cabinet', '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(8, NULL, 2, 6, 3, 1, 2, 2, 4, 0.00, 0.00, 0.00, 0.000, 600.00, 700.00, 350.00, NULL, NULL, 'unchecked', 1, 605.00, 'Matching wall cabinet', '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(9, NULL, 3, 15, 8, 13, 6, 7, 1, 0.00, 0.00, 0.00, 0.000, 600.00, 850.00, 600.00, NULL, NULL, 'unchecked', 1, 100.00, 'Demo seeded notes for design items.', '2026-10-02 04:19:21', '2026-10-02 04:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `design_item_options`
--

CREATE TABLE `design_item_options` (
  `id` int(10) UNSIGNED NOT NULL,
  `design_item_id` int(10) UNSIGNED NOT NULL,
  `option_name` varchar(100) NOT NULL,
  `option_value` varchar(150) DEFAULT NULL,
  `price_modifier` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `design_item_options`
--

INSERT INTO `design_item_options` (`id`, `design_item_id`, `option_name`, `option_value`, `price_modifier`, `created_at`) VALUES
(1, 1, 'Door Count', '2', 0.00, '2026-10-01 17:06:22'),
(2, 1, 'Shelf Count', '1', 0.00, '2026-10-01 17:06:22'),
(3, 1, 'Soft Close', 'Yes', 30.00, '2026-10-01 17:06:22'),
(4, 2, 'Drawer Count', '3', 0.00, '2026-10-01 17:06:22'),
(5, 2, 'Soft Close', 'Yes', 45.00, '2026-10-01 17:06:22'),
(6, 3, 'Door Count', '2', 0.00, '2026-10-01 17:06:22'),
(7, 3, 'Sink Cutout Required', 'Yes', 0.00, '2026-10-01 17:06:22'),
(8, 4, 'Door Count', '1', 0.00, '2026-10-01 17:06:22'),
(9, 4, 'Shelf Count', '2', 0.00, '2026-10-01 17:06:22'),
(10, 5, 'Door Count', '2', 0.00, '2026-10-01 17:06:22'),
(11, 5, 'Soft Close', 'Yes', 30.00, '2026-10-01 17:06:22'),
(12, 6, 'Drawer Count', '3', 0.00, '2026-10-01 17:06:22'),
(13, 6, 'Soft Close', 'Yes', 45.00, '2026-10-01 17:06:22'),
(14, 7, 'Door Count', '2', 0.00, '2026-10-01 17:06:22'),
(15, 8, 'Door Count', '2', 0.00, '2026-10-01 17:06:22'),
(16, 8, 'Shelf Count', '2', 0.00, '2026-10-01 17:06:22'),
(17, 9, 'Demo Design Item Options', 'Demo option value', 100.00, '2026-10-02 04:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `dgtango`
--

CREATE TABLE `dgtango` (
  `id` int(10) UNSIGNED NOT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `product_code` varchar(100) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `finish_code` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `series` varchar(150) DEFAULT NULL,
  `image_filename` varchar(255) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dgtango`
--

INSERT INTO `dgtango` (`id`, `supplier`, `brand`, `product_code`, `product_name`, `finish_code`, `category`, `series`, `image_filename`, `image_path`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'supplier', 'brand', 'product_code', 'product_name', 'finish_code', 'category', 'series', 'image_filename', 'image_path', 0, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(2, 'DGtango', 'DGtango', '35010', 'VANILLA OAK', '', 'Colore Tec', 'WOODGRAIN', '35010_VANILLA_OAK.jpg', 'public/uploads/materials/dgtango/35010_VANILLA_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(3, 'DGtango', 'DGtango', '35020', 'SMOKY OAK', '', 'Colore Tec', 'WOODGRAIN', '35020_SMOKY_OAK.jpg', 'public/uploads/materials/dgtango/35020_SMOKY_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(4, 'DGtango', 'DGtango', '35060', 'MINKWOOD', '', 'Colore Tec', 'WOODGRAIN', '35060_MINKWOOD.jpg', 'public/uploads/materials/dgtango/35060_MINKWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(5, 'DGtango', 'DGtango', '35090', 'HERITAGE OAK', '', 'Colore Tec', 'WOODGRAIN', '35090_HERITAGE_OAK.jpg', 'public/uploads/materials/dgtango/35090_HERITAGE_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(6, 'DGtango', 'DGtango', '35100', 'ANTIQUE OAK', '', 'Colore Tec', 'WOODGRAIN', '35100_ANTIQUE_OAK.jpg', 'public/uploads/materials/dgtango/35100_ANTIQUE_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(7, 'DGtango', 'DGtango', '35120', 'COPPERWOOD', '', 'Colore Tec', 'WOODGRAIN', '35120_COPPERWOOD.jpg', 'public/uploads/materials/dgtango/35120_COPPERWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(8, 'DGtango', 'DGtango', '35140', 'CINNABAR OAK', '', 'Colore Tec', 'WOODGRAIN', '35140_CINNABAR_OAK.jpg', 'public/uploads/materials/dgtango/35140_CINNABAR_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(9, 'DGtango', 'DGtango', '35160', 'SNOWGRAIN', '', 'Colore Tec', 'WOODGRAIN', '35160_SNOWGRAIN.jpg', 'public/uploads/materials/dgtango/35160_SNOWGRAIN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(10, 'DGtango', 'DGtango', '35190', 'MOHAWK', '', 'Colore Tec', 'WOODGRAIN', '35190_MOHAWK.jpg', 'public/uploads/materials/dgtango/35190_MOHAWK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(11, 'DGtango', 'DGtango', '35210', 'SLATEWOOD', '', 'Colore Tec', 'WOODGRAIN', '35210_SLATEWOOD.jpg', 'public/uploads/materials/dgtango/35210_SLATEWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(12, 'DGtango', 'DGtango', '73090', 'VENICE', '', 'Colore Tec', 'WOODGRAIN', '73090_VENICE.jpg', 'public/uploads/materials/dgtango/73090_VENICE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(13, 'DGtango', 'DGtango', '73100', 'HECTOR', '', 'Colore Tec', 'WOODGRAIN', '73100_HECTOR.jpg', 'public/uploads/materials/dgtango/73100_HECTOR.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(14, 'DGtango', 'DGtango', '73200', 'BAINCO VANCOUVER', '', 'Colore Tec', 'WOODGRAIN', '73200_BAINCO_VANCOUVER.jpg', 'public/uploads/materials/dgtango/73200_BAINCO_VANCOUVER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(15, 'DGtango', 'DGtango', '73210', 'CIOCCOLATO VANCOUVER', '', 'Colore Tec', 'WOODGRAIN', '73210_CIOCCOLATO_VANCOUVER.jpg', 'public/uploads/materials/dgtango/73210_CIOCCOLATO_VANCOUVER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(16, 'DGtango', 'DGtango', '73650', 'CHIARO NATURALE TEAK', '', 'Colore Tec', 'WOODGRAIN', '73650_CHIARO_NATURALE_TEAK.jpg', 'public/uploads/materials/dgtango/73650_CHIARO_NATURALE_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(17, 'DGtango', 'DGtango', '73700', 'SOLARIA', '', 'Colore Tec', 'MARBLE', '73700_SOLARIA.jpg', 'public/uploads/materials/dgtango/73700_SOLARIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(18, 'DGtango', 'DGtango', '73280', 'MATT SENTIMENTAL', '', 'Colore Tec', 'MARBLE', '73280_MATT_SENTIMENTAL.jpg', 'public/uploads/materials/dgtango/73280_MATT_SENTIMENTAL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(19, 'DGtango', 'DGtango', '73290', 'GLOSSY SENTIMENTAL', '', 'Colore Tec', 'MARBLE', '73290_GLOSSY_SENTIMENTAL.jpg', 'public/uploads/materials/dgtango/73290_GLOSSY_SENTIMENTAL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(20, 'DGtango', 'DGtango', '73510', 'LAVATER STONE GLOSSY', '', 'Colore Tec', 'MARBLE', '73510_LAVATER_STONE_GLOSSY.jpg', 'public/uploads/materials/dgtango/73510_LAVATER_STONE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(21, 'DGtango', 'DGtango', '80090R', 'LUNIGIANA DESTRO', '', 'Colore Tec', 'DUO', '80090R_LUNIGIANA_DESTRO.jpg', 'public/uploads/materials/dgtango/80090R_LUNIGIANA_DESTRO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(22, 'DGtango', 'DGtango', '80100L', 'LUNIGIANA SINISTRA', '', 'Colore Tec', 'DUO', '80100L_LUNIGIANA_SINISTRA.jpg', 'public/uploads/materials/dgtango/80100L_LUNIGIANA_SINISTRA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(23, 'DGtango', 'DGtango', '86020', 'COLD WHITE', '', 'Colore Tec', 'GALAXY', '86020_COLD_WHITE.jpg', 'public/uploads/materials/dgtango/86020_COLD_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(24, 'DGtango', 'DGtango', '86030', 'WARM WHITE', '', 'Colore Tec', 'GALAXY', '86030_WARM_WHITE.jpg', 'public/uploads/materials/dgtango/86030_WARM_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(25, 'DGtango', 'DGtango', '86040', 'GREY', '', 'Colore Tec', 'GALAXY', '86040_GREY.jpg', 'public/uploads/materials/dgtango/86040_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(26, 'DGtango', 'DGtango', '86050', 'GRAYISH BLUE', '', 'Colore Tec', 'GALAXY', '86050_GRAYISH_BLUE.jpg', 'public/uploads/materials/dgtango/86050_GRAYISH_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(27, 'DGtango', 'DGtango', '62300', 'HONEY CREAM', '', 'Colore Tec', 'SOLID COLOR', '62300_HONEY_CREAM.jpg', 'public/uploads/materials/dgtango/62300_HONEY_CREAM.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(28, 'DGtango', 'DGtango', '62370', 'ASHWOOD GREY', '', 'Colore Tec', 'SOLID COLOR', '62370_ASHWOOD_GREY.jpg', 'public/uploads/materials/dgtango/62370_ASHWOOD_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(29, 'DGtango', 'DGtango', '61190', 'SMOKE GREY', '', 'Colore Tec', 'SOLID COLOR', '61190_SMOKE_GREY.jpg', 'public/uploads/materials/dgtango/61190_SMOKE_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(30, 'DGtango', 'DGtango', '62010', 'PEARL WHITE', '', 'Colore Tec', 'SOLID COLOR', '62010_PEARL_WHITE.jpg', 'public/uploads/materials/dgtango/62010_PEARL_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(31, 'DGtango', 'DGtango', '62260', 'BEIGE', '', 'Colore Tec', 'SOLID COLOR', '62260_BEIGE.jpg', 'public/uploads/materials/dgtango/62260_BEIGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(32, 'DGtango', 'DGtango', '7819', 'ENA RAGAZZA', '', 'Fabric', 'ENA', '7819_ENA_RAGAZZA.jpg', 'public/uploads/materials/dgtango/7819_ENA_RAGAZZA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(33, 'DGtango', 'DGtango', '7820', 'ENA BASSO', '', 'Fabric', 'ENA', '7820_ENA_BASSO.jpg', 'public/uploads/materials/dgtango/7820_ENA_BASSO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(34, 'DGtango', 'DGtango', '7821', 'ENA LUSSUOSO', '', 'Fabric', 'ENA', '7821_ENA_LUSSUOSO.jpg', 'public/uploads/materials/dgtango/7821_ENA_LUSSUOSO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(35, 'DGtango', 'DGtango', '7337', 'BIANCO GUABELLO', '', 'Fabric', 'GUABELLO', '7337_BIANCO_GUABELLO.jpg', 'public/uploads/materials/dgtango/7337_BIANCO_GUABELLO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(36, 'DGtango', 'DGtango', '7338-05', 'GRIGIO GUABELLO', '', 'Fabric', '', '7338-05_GRIGIO_GUABELLO.jpg', 'public/uploads/materials/dgtango/7338-05_GRIGIO_GUABELLO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(37, 'DGtango', 'DGtango', '7339', 'NERO GUABELLO', '', 'Fabric', 'GUABELLO', '7339_NERO_GUABELLO.jpg', 'public/uploads/materials/dgtango/7339_NERO_GUABELLO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(38, 'DGtango', 'DGtango', '7340', 'WHITE DENIM', '', 'Fabric', 'DENIM', '7340_WHITE_DENIM.jpg', 'public/uploads/materials/dgtango/7340_WHITE_DENIM.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(39, 'DGtango', 'DGtango', '7341', 'RUSTY DENIM', '', 'Fabric', 'DENIM', '7341_RUSTY_DENIM.jpg', 'public/uploads/materials/dgtango/7341_RUSTY_DENIM.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(40, 'DGtango', 'DGtango', '7342', 'BRONZE DENIM', '', 'Fabric', 'DENIM', '7342_BRONZE_DENIM.jpg', 'public/uploads/materials/dgtango/7342_BRONZE_DENIM.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(41, 'DGtango', 'DGtango', '7358', 'BIANCO', '', 'Fabric', 'WOVEN', '7358_BIANCO.jpg', 'public/uploads/materials/dgtango/7358_BIANCO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(42, 'DGtango', 'DGtango', '7359', 'NERO', '', 'Fabric', 'WOVEN', '7359_NERO.jpg', 'public/uploads/materials/dgtango/7359_NERO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(43, 'DGtango', 'DGtango', '7360', 'GRIGIO', '', 'Fabric', 'WOVEN', '7360_GRIGIO.jpg', 'public/uploads/materials/dgtango/7360_GRIGIO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(44, 'DGtango', 'DGtango', '6666', 'GREY HAIRLINE', '', 'Metal', 'HAIRLINE', '6666_GREY_HAIRLINE.jpg', 'public/uploads/materials/dgtango/6666_GREY_HAIRLINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(45, 'DGtango', 'DGtango', '7777', 'BLACK HAIRLINE', '', 'Metal', 'HAIRLINE', '7777_BLACK_HAIRLINE.jpg', 'public/uploads/materials/dgtango/7777_BLACK_HAIRLINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(46, 'DGtango', 'DGtango', '1111', 'SILVER HAIRLINE', '', 'Metal', 'HAIRLINE', '1111_SILVER_HAIRLINE.jpg', 'public/uploads/materials/dgtango/1111_SILVER_HAIRLINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(47, 'DGtango', 'DGtango', '8315', 'SPECCHIO D’ACQUA', '', 'Metal', 'RAME', '8315_SPECCHIO_D_ACQUA.jpg', 'public/uploads/materials/dgtango/8315_SPECCHIO_D_ACQUA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(48, 'DGtango', 'DGtango', '2222', 'GOLD HAIRLINE', '', 'Metal', 'HAIRLINE', '2222_GOLD_HAIRLINE.jpg', 'public/uploads/materials/dgtango/2222_GOLD_HAIRLINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(49, 'DGtango', 'DGtango', '5555', 'BROWN HAIRLINE', '', 'Metal', 'HAIRLINE', '5555_BROWN_HAIRLINE.jpg', 'public/uploads/materials/dgtango/5555_BROWN_HAIRLINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(50, 'DGtango', 'DGtango', '8311', 'PITONE', '', 'Metal', 'HAIRLINE', '8311_PITONE.jpg', 'public/uploads/materials/dgtango/8311_PITONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(51, 'DGtango', 'DGtango', '8312', 'SERPENTINA', '', 'Metal', 'HAIRLINE', '8312_SERPENTINA.jpg', 'public/uploads/materials/dgtango/8312_SERPENTINA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(52, 'DGtango', 'DGtango', '8313', 'BLUASTRO IRREGOLARE', '', 'Metal', 'HAIRLINE', '8313_BLUASTRO_IRREGOLARE.jpg', 'public/uploads/materials/dgtango/8313_BLUASTRO_IRREGOLARE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(53, 'DGtango', 'DGtango', '8314', 'IRREGOLARE RAME', '', 'Metal', 'HAIRLINE', '8314_IRREGOLARE_RAME.jpg', 'public/uploads/materials/dgtango/8314_IRREGOLARE_RAME.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(54, 'DGtango', 'DGtango', '8301', 'METAL GREY', '', 'Metal', 'PLANK MATRIX', '8301_METAL_GREY.jpg', 'public/uploads/materials/dgtango/8301_METAL_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(55, 'DGtango', 'DGtango', '8302', 'METAL SILVER', '', 'Metal', 'MIRROR', '8302_METAL_SILVER.jpg', 'public/uploads/materials/dgtango/8302_METAL_SILVER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(56, 'DGtango', 'DGtango', '8303', 'METAL GOLD', '', 'Metal', 'MIRROR', '8303_METAL_GOLD.jpg', 'public/uploads/materials/dgtango/8303_METAL_GOLD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(57, 'DGtango', 'DGtango', '8304', 'METAL COPPER', '', 'Metal', 'MIRROR', '8304_METAL_COPPER.jpg', 'public/uploads/materials/dgtango/8304_METAL_COPPER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(58, 'DGtango', 'DGtango', '6229', 'DARK PEBBLE', '', 'Solid Colour', 'SOLID COLOR', '6229_DARK_PEBBLE.jpg', 'public/uploads/materials/dgtango/6229_DARK_PEBBLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(59, 'DGtango', 'DGtango', '6230', 'HONEY CREAM', '', 'Solid Colour', 'SOLID COLOR', '6230_HONEY_CREAM.jpg', 'public/uploads/materials/dgtango/6230_HONEY_CREAM.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(60, 'DGtango', 'DGtango', '6231', 'OCHRE', '', 'Solid Colour', 'SOLID COLOR', '6231_OCHRE.jpg', 'public/uploads/materials/dgtango/6231_OCHRE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(61, 'DGtango', 'DGtango', '6232', 'PORCELAIN SKIN', '', 'Solid Colour', 'SOLID COLOR', '6232_PORCELAIN_SKIN.jpg', 'public/uploads/materials/dgtango/6232_PORCELAIN_SKIN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(62, 'DGtango', 'DGtango', '6233', 'DUSTY ROSE', '', 'Solid Colour', 'SOLID COLOR', '6233_DUSTY_ROSE.jpg', 'public/uploads/materials/dgtango/6233_DUSTY_ROSE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(63, 'DGtango', 'DGtango', '6234', 'TROPICAL INDIGO', '', 'Solid Colour', 'SOLID COLOR', '6234_TROPICAL_INDIGO.jpg', 'public/uploads/materials/dgtango/6234_TROPICAL_INDIGO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(64, 'DGtango', 'DGtango', '6235', 'DARK FALL', '', 'Solid Colour', 'SOLID COLOR', '6235_DARK_FALL.jpg', 'public/uploads/materials/dgtango/6235_DARK_FALL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(65, 'DGtango', 'DGtango', '6236', 'BABY PINK', '', 'Solid Colour', 'SOLID COLOR', '6236_BABY_PINK.jpg', 'public/uploads/materials/dgtango/6236_BABY_PINK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(66, 'DGtango', 'DGtango', '6237', 'ASHWOOD GREY', '', 'Solid Colour', 'SOLID COLOR', '6237_ASHWOOD_GREY.jpg', 'public/uploads/materials/dgtango/6237_ASHWOOD_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(67, 'DGtango', 'DGtango', '6239', 'SILKEN TAUPE', '', 'Solid Colour', 'SOLID COLOR', '6239_SILKEN_TAUPE.jpg', 'public/uploads/materials/dgtango/6239_SILKEN_TAUPE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(68, 'DGtango', 'DGtango', '1100G', 'WHITE GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '1100G_WHITE_GLOSSY.jpg', 'public/uploads/materials/dgtango/1100G_WHITE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(69, 'DGtango', 'DGtango', '1100M', 'WHITE MATT', '', 'Solid Colour', 'SOLID COLOR', '1100M_WHITE_MATT.jpg', 'public/uploads/materials/dgtango/1100M_WHITE_MATT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(70, 'DGtango', 'DGtango', '1100T', 'WHITE', '', 'Solid Colour', 'SOLID COLOR', '1100T_WHITE.jpg', 'public/uploads/materials/dgtango/1100T_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(71, 'DGtango', 'DGtango', '1200', 'BLACK', '', 'Solid Colour', 'SOLID COLOR', '1200_BLACK.jpg', 'public/uploads/materials/dgtango/1200_BLACK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(72, 'DGtango', 'DGtango', '1200M', 'BLACK MATT', '', 'Solid Colour', 'SOLID COLOR', '1200M_BLACK_MATT.jpg', 'public/uploads/materials/dgtango/1200M_BLACK_MATT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(73, 'DGtango', 'DGtango', '1300', 'RED', '', 'Solid Colour', 'SOLID COLOR', '1300_RED.jpg', 'public/uploads/materials/dgtango/1300_RED.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(74, 'DGtango', 'DGtango', '1300M', 'RED MATT', '', 'Solid Colour', 'SOLID COLOR', '1300M_RED_MATT.jpg', 'public/uploads/materials/dgtango/1300M_RED_MATT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(75, 'DGtango', 'DGtango', '5111G', 'MILKY WHITE GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5111G_MILKY_WHITE_GLOSSY.jpg', 'public/uploads/materials/dgtango/5111G_MILKY_WHITE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(76, 'DGtango', 'DGtango', '5113G', 'RICE GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5113G_RICE_GLOSSY.jpg', 'public/uploads/materials/dgtango/5113G_RICE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(77, 'DGtango', 'DGtango', '5114G', 'GRAY GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5114G_GRAY_GLOSSY.jpg', 'public/uploads/materials/dgtango/5114G_GRAY_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(78, 'DGtango', 'DGtango', '5115G', 'PLUMBAGO GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5115G_PLUMBAGO_GLOSSY.jpg', 'public/uploads/materials/dgtango/5115G_PLUMBAGO_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(79, 'DGtango', 'DGtango', '5116G', 'YELLOW GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5116G_YELLOW_GLOSSY.jpg', 'public/uploads/materials/dgtango/5116G_YELLOW_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(80, 'DGtango', 'DGtango', '5117G', 'BUFFALO GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5117G_BUFFALO_GLOSSY.jpg', 'public/uploads/materials/dgtango/5117G_BUFFALO_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(81, 'DGtango', 'DGtango', '5120G', 'GREY ASH GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5120G_GREY_ASH_GLOSSY.jpg', 'public/uploads/materials/dgtango/5120G_GREY_ASH_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(82, 'DGtango', 'DGtango', '5200G', 'BLACK GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5200G_BLACK_GLOSSY.jpg', 'public/uploads/materials/dgtango/5200G_BLACK_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(83, 'DGtango', 'DGtango', '5300G', 'RED GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5300G_RED_GLOSSY.jpg', 'public/uploads/materials/dgtango/5300G_RED_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(84, 'DGtango', 'DGtango', '5400G', 'BLUE GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5400G_BLUE_GLOSSY.jpg', 'public/uploads/materials/dgtango/5400G_BLUE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(85, 'DGtango', 'DGtango', '5500G', 'GREEN GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5500G_GREEN_GLOSSY.jpg', 'public/uploads/materials/dgtango/5500G_GREEN_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(86, 'DGtango', 'DGtango', '5600G', 'TANGERINE GLOSSY', '', 'Solid Colour', 'SOLID COLOR', '5600G_TANGERINE_GLOSSY.jpg', 'public/uploads/materials/dgtango/5600G_TANGERINE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(87, 'DGtango', 'DGtango', '5949G', 'HIGH GLOSS WHITE', '', 'Solid Colour', 'SOLID COLOR', '5949G_HIGH_GLOSS_WHITE.jpg', 'public/uploads/materials/dgtango/5949G_HIGH_GLOSS_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(88, 'DGtango', 'DGtango', '6111', 'MISSION WHITE', '', 'Solid Colour', 'SOLID COLOR', '6111_MISSION_WHITE.jpg', 'public/uploads/materials/dgtango/6111_MISSION_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(89, 'DGtango', 'DGtango', '6112', 'MILKY WHITE', '', 'Solid Colour', 'SOLID COLOR', '6112_MILKY_WHITE.jpg', 'public/uploads/materials/dgtango/6112_MILKY_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(90, 'DGtango', 'DGtango', '6112M', 'MILKY WHITE MATT', '', 'Solid Colour', 'SOLID COLOR', '6112M_MILKY_WHITE_MATT.jpg', 'public/uploads/materials/dgtango/6112M_MILKY_WHITE_MATT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(91, 'DGtango', 'DGtango', '6114', 'ANTIQUE', '', 'Solid Colour', 'SOLID COLOR', '6114_ANTIQUE.jpg', 'public/uploads/materials/dgtango/6114_ANTIQUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(92, 'DGtango', 'DGtango', '6115', 'NEW MAGNOLIA', '', 'Solid Colour', 'SOLID COLOR', '6115_NEW_MAGNOLIA.jpg', 'public/uploads/materials/dgtango/6115_NEW_MAGNOLIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(93, 'DGtango', 'DGtango', '6118', 'GRAY', '', 'Solid Colour', 'SOLID COLOR', '6118_GRAY.jpg', 'public/uploads/materials/dgtango/6118_GRAY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(94, 'DGtango', 'DGtango', '6119', 'SMOKE GREY', '', 'Solid Colour', 'SOLID COLOR', '6119_SMOKE_GREY.jpg', 'public/uploads/materials/dgtango/6119_SMOKE_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(95, 'DGtango', 'DGtango', '6120', 'CONTRACT GRAY', '', 'Solid Colour', 'SOLID COLOR', '6120_CONTRACT_GRAY.jpg', 'public/uploads/materials/dgtango/6120_CONTRACT_GRAY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(96, 'DGtango', 'DGtango', '6121', 'SILVER ASH', '', 'Solid Colour', 'SOLID COLOR', '6121_SILVER_ASH.jpg', 'public/uploads/materials/dgtango/6121_SILVER_ASH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(97, 'DGtango', 'DGtango', '6122', 'DARK GREY ASH', '', 'Solid Colour', 'SOLID COLOR', '6122_DARK_GREY_ASH.jpg', 'public/uploads/materials/dgtango/6122_DARK_GREY_ASH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(98, 'DGtango', 'DGtango', '6123', 'PLUMBAGO', '', 'Solid Colour', 'SOLID COLOR', '6123_PLUMBAGO.jpg', 'public/uploads/materials/dgtango/6123_PLUMBAGO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(99, 'DGtango', 'DGtango', '6124', 'CHOCOLATE', '', 'Solid Colour', 'SOLID COLOR', '6124_CHOCOLATE.jpg', 'public/uploads/materials/dgtango/6124_CHOCOLATE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(100, 'DGtango', 'DGtango', '6127', 'KISS BLUE', '', 'Solid Colour', 'SOLID COLOR', '6127_KISS_BLUE.jpg', 'public/uploads/materials/dgtango/6127_KISS_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(101, 'DGtango', 'DGtango', '6128', 'PERSIAN BLUE', '', 'Solid Colour', 'SOLID COLOR', '6128_PERSIAN_BLUE.jpg', 'public/uploads/materials/dgtango/6128_PERSIAN_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(102, 'DGtango', 'DGtango', '6129', 'LAPIS BLUE', '', 'Solid Colour', 'SOLID COLOR', '6129_LAPIS_BLUE.jpg', 'public/uploads/materials/dgtango/6129_LAPIS_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(103, 'DGtango', 'DGtango', '6130', 'NAVY BLUE', '', 'Solid Colour', 'SOLID COLOR', '6130_NAVY_BLUE.jpg', 'public/uploads/materials/dgtango/6130_NAVY_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(104, 'DGtango', 'DGtango', '6131', 'BRIGHT SUNNY', '', 'Solid Colour', 'SOLID COLOR', '6131_BRIGHT_SUNNY.jpg', 'public/uploads/materials/dgtango/6131_BRIGHT_SUNNY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(105, 'DGtango', 'DGtango', '6132', 'SPECTRUM YELLOW', '', 'Solid Colour', 'SOLID COLOR', '6132_SPECTRUM_YELLOW.jpg', 'public/uploads/materials/dgtango/6132_SPECTRUM_YELLOW.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(106, 'DGtango', 'DGtango', '6133', 'JAFFA ORANGE', '', 'Solid Colour', 'SOLID COLOR', '6133_JAFFA_ORANGE.jpg', 'public/uploads/materials/dgtango/6133_JAFFA_ORANGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(107, 'DGtango', 'DGtango', '6134', 'CHRYSOIDINE', '', 'Solid Colour', 'SOLID COLOR', '6134_CHRYSOIDINE.jpg', 'public/uploads/materials/dgtango/6134_CHRYSOIDINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(108, 'DGtango', 'DGtango', '6137', 'FINLAND GREEN', '', 'Solid Colour', 'SOLID COLOR', '6137_FINLAND_GREEN.jpg', 'public/uploads/materials/dgtango/6137_FINLAND_GREEN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(109, 'DGtango', 'DGtango', '6139', 'PERIDOT', '', 'Solid Colour', 'SOLID COLOR', '6139_PERIDOT.jpg', 'public/uploads/materials/dgtango/6139_PERIDOT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(110, 'DGtango', 'DGtango', '6140', 'DARK GREEN', '', 'Solid Colour', 'SOLID COLOR', '6140_DARK_GREEN.jpg', 'public/uploads/materials/dgtango/6140_DARK_GREEN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(111, 'DGtango', 'DGtango', '6141', 'ROSE PINK', '', 'Solid Colour', 'SOLID COLOR', '6141_ROSE_PINK.jpg', 'public/uploads/materials/dgtango/6141_ROSE_PINK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(112, 'DGtango', 'DGtango', '6142', 'PURPLE LILAC', '', 'Solid Colour', 'SOLID COLOR', '6142_PURPLE_LILAC.jpg', 'public/uploads/materials/dgtango/6142_PURPLE_LILAC.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(113, 'DGtango', 'DGtango', '6144', 'RED PURPLE', '', 'Solid Colour', 'SOLID COLOR', '6144_RED_PURPLE.jpg', 'public/uploads/materials/dgtango/6144_RED_PURPLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(114, 'DGtango', 'DGtango', '6145', 'OLD ROSE', '', 'Solid Colour', 'SOLID COLOR', '6145_OLD_ROSE.jpg', 'public/uploads/materials/dgtango/6145_OLD_ROSE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(115, 'DGtango', 'DGtango', '6200', 'ICEBERY', '', 'Solid Colour', 'SOLID COLOR', '6200_ICEBERY.jpg', 'public/uploads/materials/dgtango/6200_ICEBERY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(116, 'DGtango', 'DGtango', '6201', 'PEARL WHITE', '', 'Solid Colour', 'SOLID COLOR', '6201_PEARL_WHITE.jpg', 'public/uploads/materials/dgtango/6201_PEARL_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(117, 'DGtango', 'DGtango', '6202', 'FLEECE', '', 'Solid Colour', 'SOLID COLOR', '6202_FLEECE.jpg', 'public/uploads/materials/dgtango/6202_FLEECE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(118, 'DGtango', 'DGtango', '6203', 'EARTH', '', 'Solid Colour', 'SOLID COLOR', '6203_EARTH.jpg', 'public/uploads/materials/dgtango/6203_EARTH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(119, 'DGtango', 'DGtango', '6204', 'CHARCOAL GREY', '', 'Solid Colour', 'SOLID COLOR', '6204_CHARCOAL_GREY.jpg', 'public/uploads/materials/dgtango/6204_CHARCOAL_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(120, 'DGtango', 'DGtango', '6205', 'PEACE BLUE', '', 'Solid Colour', 'SOLID COLOR', '6205_PEACE_BLUE.jpg', 'public/uploads/materials/dgtango/6205_PEACE_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(121, 'DGtango', 'DGtango', '6206', 'CHROME', '', 'Solid Colour', 'SOLID COLOR', '6206_CHROME.jpg', 'public/uploads/materials/dgtango/6206_CHROME.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(122, 'DGtango', 'DGtango', '6209', 'COOL WHITE', '', 'Solid Colour', 'SOLID COLOR', '6209_COOL_WHITE.jpg', 'public/uploads/materials/dgtango/6209_COOL_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(123, 'DGtango', 'DGtango', '6210', 'SNOW', '', 'Solid Colour', 'SOLID COLOR', '6210_SNOW.jpg', 'public/uploads/materials/dgtango/6210_SNOW.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(124, 'DGtango', 'DGtango', '9100', 'WHITE', '', 'Solid Colour', 'SOLID COLOR', '9100_WHITE.jpg', 'public/uploads/materials/dgtango/9100_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(125, 'DGtango', 'DGtango', '9200', 'BLACK', '', 'Solid Colour', 'SOLID COLOR', '9200_BLACK.jpg', 'public/uploads/materials/dgtango/9200_BLACK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(126, 'DGtango', 'DGtango', '6214', 'TORTILLA', '', 'Solid Colour', 'SOLID COLOR', '6214_TORTILLA.jpg', 'public/uploads/materials/dgtango/6214_TORTILLA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(127, 'DGtango', 'DGtango', '6215', 'MERLOT', '', 'Solid Colour', 'SOLID COLOR', '6215_MERLOT.jpg', 'public/uploads/materials/dgtango/6215_MERLOT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(128, 'DGtango', 'DGtango', '6216', 'CERULEAN', '', 'Solid Colour', 'SOLID COLOR', '6216_CERULEAN.jpg', 'public/uploads/materials/dgtango/6216_CERULEAN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(129, 'DGtango', 'DGtango', '6217', 'COBALT BLUE', '', 'Solid Colour', 'SOLID COLOR', '6217_COBALT_BLUE.jpg', 'public/uploads/materials/dgtango/6217_COBALT_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(130, 'DGtango', 'DGtango', '6218', 'MINT', '', 'Solid Colour', 'SOLID COLOR', '6218_MINT.jpg', 'public/uploads/materials/dgtango/6218_MINT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(131, 'DGtango', 'DGtango', '6219', 'MAYA BLUE', '', 'Solid Colour', 'SOLID COLOR', '6219_MAYA_BLUE.jpg', 'public/uploads/materials/dgtango/6219_MAYA_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(132, 'DGtango', 'DGtango', '6220', 'BLUSH', '', 'Solid Colour', 'SOLID COLOR', '6220_BLUSH.jpg', 'public/uploads/materials/dgtango/6220_BLUSH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(133, 'DGtango', 'DGtango', '6221', 'PHTHALO GREEN', '', 'Solid Colour', 'SOLID COLOR', '6221_PHTHALO_GREEN.jpg', 'public/uploads/materials/dgtango/6221_PHTHALO_GREEN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(134, 'DGtango', 'DGtango', '6222', 'MELON', '', 'Solid Colour', 'SOLID COLOR', '6222_MELON.jpg', 'public/uploads/materials/dgtango/6222_MELON.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(135, 'DGtango', 'DGtango', '6223', 'FERN', '', 'Solid Colour', 'SOLID COLOR', '6223_FERN.jpg', 'public/uploads/materials/dgtango/6223_FERN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(136, 'DGtango', 'DGtango', '6224', 'PARAKEET GREEN', '', 'Solid Colour', 'SOLID COLOR', '6224_PARAKEET_GREEN.jpg', 'public/uploads/materials/dgtango/6224_PARAKEET_GREEN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(137, 'DGtango', 'DGtango', '6225', 'STEEL', '', 'Solid Colour', 'SOLID COLOR', '6225_STEEL.jpg', 'public/uploads/materials/dgtango/6225_STEEL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(138, 'DGtango', 'DGtango', '6226', 'BEIGE', '', 'Solid Colour', 'SOLID COLOR', '6226_BEIGE.jpg', 'public/uploads/materials/dgtango/6226_BEIGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(139, 'DGtango', 'DGtango', '6227', 'YALE BLUE', '', 'Solid Colour', 'SOLID COLOR', '6227_YALE_BLUE.jpg', 'public/uploads/materials/dgtango/6227_YALE_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(140, 'DGtango', 'DGtango', '6228', 'SOIL', '', 'Solid Colour', 'SOLID COLOR', '6228_SOIL.jpg', 'public/uploads/materials/dgtango/6228_SOIL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(141, 'DGtango', 'DGtango', '3315', 'BIANCO ASH', '', 'Woodgrain', 'CHERRY', '3315_BIANCO_ASH.jpg', 'public/uploads/materials/dgtango/3315_BIANCO_ASH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(142, 'DGtango', 'DGtango', '3316', 'NATURALE ASH', '', 'Woodgrain', 'CHERRY', '3316_NATURALE_ASH.jpg', 'public/uploads/materials/dgtango/3316_NATURALE_ASH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(143, 'DGtango', 'DGtango', '3317', 'INVECCHIATO ASH', '', 'Woodgrain', 'CHERRY', '3317_INVECCHIATO_ASH.jpg', 'public/uploads/materials/dgtango/3317_INVECCHIATO_ASH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(144, 'DGtango', 'DGtango', '3318', 'BIANCO CHIARO ELM', '', 'Woodgrain', 'ELM', '3318_BIANCO_CHIARO_ELM.jpg', 'public/uploads/materials/dgtango/3318_BIANCO_CHIARO_ELM.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(145, 'DGtango', 'DGtango', '3319', 'GRIGIO CHIARO ELM', '', 'Woodgrain', 'ELM', '3319_GRIGIO_CHIARO_ELM.jpg', 'public/uploads/materials/dgtango/3319_GRIGIO_CHIARO_ELM.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(146, 'DGtango', 'DGtango', '3320', 'BRUNISTA OAK', '', 'Woodgrain', 'ELM', '3320_BRUNISTA_OAK.jpg', 'public/uploads/materials/dgtango/3320_BRUNISTA_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(147, 'DGtango', 'DGtango', '3321', 'NEBBIA OAK', '', 'Woodgrain', 'ELM', '3321_NEBBIA_OAK.jpg', 'public/uploads/materials/dgtango/3321_NEBBIA_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(148, 'DGtango', 'DGtango', '3322', 'DRY BLACKWOOD', '', 'Woodgrain', 'OAK', '3322_DRY_BLACKWOOD.jpg', 'public/uploads/materials/dgtango/3322_DRY_BLACKWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(149, 'DGtango', 'DGtango', '3323', 'TOFFEE BLACKWOOD', '', 'Woodgrain', 'OAK', '3323_TOFFEE_BLACKWOOD.jpg', 'public/uploads/materials/dgtango/3323_TOFFEE_BLACKWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(150, 'DGtango', 'DGtango', '3324', 'SBIANCATA LEGNO', '', 'Woodgrain', 'ELM', '3324_SBIANCATA_LEGNO.jpg', 'public/uploads/materials/dgtango/3324_SBIANCATA_LEGNO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(151, 'DGtango', 'DGtango', '3325', 'OLIATA LEGNO', '', 'Woodgrain', 'ELM', '3325_OLIATA_LEGNO.jpg', 'public/uploads/materials/dgtango/3325_OLIATA_LEGNO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(152, 'DGtango', 'DGtango', '3326', 'NERO LEGNO', '', 'Woodgrain', 'ELM', '3326_NERO_LEGNO.jpg', 'public/uploads/materials/dgtango/3326_NERO_LEGNO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(153, 'DGtango', 'DGtango', '3327', 'MILLENNIUM OAK', '', 'Woodgrain', 'OAK', '3327_MILLENNIUM_OAK.jpg', 'public/uploads/materials/dgtango/3327_MILLENNIUM_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(154, 'DGtango', 'DGtango', '3328', 'STATEROOM NATURALE TEAK', '', 'Woodgrain', 'ELM', '3328_STATEROOM_NATURALE_TEAK.jpg', 'public/uploads/materials/dgtango/3328_STATEROOM_NATURALE_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(155, 'DGtango', 'DGtango', '3329', 'NATURALE CHERRY', '', 'Woodgrain', 'CHERRY', '3329_NATURALE_CHERRY.jpg', 'public/uploads/materials/dgtango/3329_NATURALE_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(156, 'DGtango', 'DGtango', '3330', 'MARRONE SCURO CHERRY', '', 'Woodgrain', 'CHERRY', '3330_MARRONE_SCURO_CHERRY.jpg', 'public/uploads/materials/dgtango/3330_MARRONE_SCURO_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(157, 'DGtango', 'DGtango', '3331', 'SIBERIAN LARCH', '', 'Woodgrain', 'WALNUT', '3331_SIBERIAN_LARCH.jpg', 'public/uploads/materials/dgtango/3331_SIBERIAN_LARCH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(158, 'DGtango', 'DGtango', '3332', 'ALPINE WALNUT', '', 'Woodgrain', 'WALNUT', '3332_ALPINE_WALNUT.jpg', 'public/uploads/materials/dgtango/3332_ALPINE_WALNUT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(159, 'DGtango', 'DGtango', '3333', 'FRAXINUS ASH', '', 'Woodgrain', 'WALNUT', '3333_FRAXINUS_ASH.jpg', 'public/uploads/materials/dgtango/3333_FRAXINUS_ASH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(160, 'DGtango', 'DGtango', '3334', 'SAND VISTA', '', 'Woodgrain', 'WALNUT', '3334_SAND_VISTA.jpg', 'public/uploads/materials/dgtango/3334_SAND_VISTA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(161, 'DGtango', 'DGtango', '3335', 'NOIR VISTA', '', 'Woodgrain', 'WALNUT', '3335_NOIR_VISTA.jpg', 'public/uploads/materials/dgtango/3335_NOIR_VISTA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(162, 'DGtango', 'DGtango', '3336', 'MIST VISTA', '', 'Woodgrain', 'WALNUT', '3336_MIST_VISTA.jpg', 'public/uploads/materials/dgtango/3336_MIST_VISTA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(163, 'DGtango', 'DGtango', '3337', 'THERMOPINE', '', 'Woodgrain', 'TEAK', '3337_THERMOPINE.jpg', 'public/uploads/materials/dgtango/3337_THERMOPINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(164, 'DGtango', 'DGtango', '3338', 'MOSSWOOD', '', 'Woodgrain', 'TEAK', '3338_MOSSWOOD.jpg', 'public/uploads/materials/dgtango/3338_MOSSWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(165, 'DGtango', 'DGtango', '3339', 'VIENNA ELM', '', 'Woodgrain', 'ELM', '3339_VIENNA_ELM.jpg', 'public/uploads/materials/dgtango/3339_VIENNA_ELM.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(166, 'DGtango', 'DGtango', '3340', 'MORNING OAK', '', 'Woodgrain', 'OAK', '3340_MORNING_OAK.jpg', 'public/uploads/materials/dgtango/3340_MORNING_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(167, 'DGtango', 'DGtango', '3341', 'WALNUT MOCHA', '', 'Woodgrain', 'WALNUT', '3341_WALNUT_MOCHA.jpg', 'public/uploads/materials/dgtango/3341_WALNUT_MOCHA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(168, 'DGtango', 'DGtango', '3342', 'HONEY WALNUT', '', 'Woodgrain', 'WALNUT', '3342_HONEY_WALNUT.jpg', 'public/uploads/materials/dgtango/3342_HONEY_WALNUT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(169, 'DGtango', 'DGtango', '3343', 'BURNT WOOD', '', 'Woodgrain', 'MAPLE', '3343_BURNT_WOOD.jpg', 'public/uploads/materials/dgtango/3343_BURNT_WOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(170, 'DGtango', 'DGtango', '3344', 'SUNLIT TIMBER', '', 'Woodgrain', 'MAPLE', '3344_SUNLIT_TIMBER.jpg', 'public/uploads/materials/dgtango/3344_SUNLIT_TIMBER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(171, 'DGtango', 'DGtango', '3501', 'VANILLA OAK', '', 'Woodgrain', 'OAK', '3501_VANILLA_OAK.jpg', 'public/uploads/materials/dgtango/3501_VANILLA_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(172, 'DGtango', 'DGtango', '3502', 'SMOKY OAK', '', 'Woodgrain', 'OAK', '3502_SMOKY_OAK.jpg', 'public/uploads/materials/dgtango/3502_SMOKY_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(173, 'DGtango', 'DGtango', '3505', 'DRIFTWOOD', '', 'Woodgrain', 'TEAK', '3505_DRIFTWOOD.jpg', 'public/uploads/materials/dgtango/3505_DRIFTWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(174, 'DGtango', 'DGtango', '3506', 'MINKWOOD', '', 'Woodgrain', 'TEAK', '3506_MINKWOOD.jpg', 'public/uploads/materials/dgtango/3506_MINKWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(175, 'DGtango', 'DGtango', '3509', 'HERITAGE OAK', '', 'Woodgrain', 'OAK', '3509_HERITAGE_OAK.jpg', 'public/uploads/materials/dgtango/3509_HERITAGE_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(176, 'DGtango', 'DGtango', '3510', 'ANTIQUE OAK', '', 'Woodgrain', 'OAK', '3510_ANTIQUE_OAK.jpg', 'public/uploads/materials/dgtango/3510_ANTIQUE_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(177, 'DGtango', 'DGtango', '3511', 'MIDNIGHT OAK', '', 'Woodgrain', 'OAK', '3511_MIDNIGHT_OAK.jpg', 'public/uploads/materials/dgtango/3511_MIDNIGHT_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(178, 'DGtango', 'DGtango', '3512', 'COPPERWOOD', '', 'Woodgrain', 'OAK', '3512_COPPERWOOD.jpg', 'public/uploads/materials/dgtango/3512_COPPERWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(179, 'DGtango', 'DGtango', '3513', 'BRONZEWOOD', '', 'Woodgrain', 'OAK', '3513_BRONZEWOOD.jpg', 'public/uploads/materials/dgtango/3513_BRONZEWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(180, 'DGtango', 'DGtango', '3514', 'CINNABAR OAK', '', 'Woodgrain', 'OAK', '3514_CINNABAR_OAK.jpg', 'public/uploads/materials/dgtango/3514_CINNABAR_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(181, 'DGtango', 'DGtango', '3515', 'RUSTIC DRIFT', '', 'Woodgrain', 'ELM', '3515_RUSTIC_DRIFT.jpg', 'public/uploads/materials/dgtango/3515_RUSTIC_DRIFT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(182, 'DGtango', 'DGtango', '3516', 'SNOWGRAIN', '', 'Woodgrain', 'MAPLE', '3516_SNOWGRAIN.jpg', 'public/uploads/materials/dgtango/3516_SNOWGRAIN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(183, 'DGtango', 'DGtango', '3517', 'SHADOWWOOD', '', 'Woodgrain', 'MAPLE', '3517_SHADOWWOOD.jpg', 'public/uploads/materials/dgtango/3517_SHADOWWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(184, 'DGtango', 'DGtango', '3518', 'PEWTER PLANK', '', 'Woodgrain', 'MAPLE', '3518_PEWTER_PLANK.jpg', 'public/uploads/materials/dgtango/3518_PEWTER_PLANK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(185, 'DGtango', 'DGtango', '3519', 'MOHAWK', '', 'Woodgrain', 'MAPLE', '3519_MOHAWK.jpg', 'public/uploads/materials/dgtango/3519_MOHAWK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(186, 'DGtango', 'DGtango', '3520', 'MOCHA RIDGE', '', 'Woodgrain', 'MAPLE', '3520_MOCHA_RIDGE.jpg', 'public/uploads/materials/dgtango/3520_MOCHA_RIDGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(187, 'DGtango', 'DGtango', '3521', 'SLATEWOOD', '', 'Woodgrain', 'OAK', '3521_SLATEWOOD.jpg', 'public/uploads/materials/dgtango/3521_SLATEWOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(188, 'DGtango', 'DGtango', '7169', 'ROSE OAK', '', 'Woodgrain', 'OAK', '7169_ROSE_OAK.jpg', 'public/uploads/materials/dgtango/7169_ROSE_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(189, 'DGtango', 'DGtango', '7817', 'CHIARO DURINI', '', 'Woodgrain', 'DURINI', '7817_CHIARO_DURINI.jpg', 'public/uploads/materials/dgtango/7817_CHIARO_DURINI.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(190, 'DGtango', 'DGtango', '7818', 'DURINI MARRONE', '', 'Woodgrain', 'DURINI', '7818_DURINI_MARRONE.jpg', 'public/uploads/materials/dgtango/7818_DURINI_MARRONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(191, 'DGtango', 'DGtango', '7827', 'KRONBERG SERA', '', 'Woodgrain', 'KRONBERG', '7827_KRONBERG_SERA.jpg', 'public/uploads/materials/dgtango/7827_KRONBERG_SERA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(192, 'DGtango', 'DGtango', '7828', 'KRONBERG MATTINO', '', 'Woodgrain', 'KRONBERG', '7828_KRONBERG_MATTINO.jpg', 'public/uploads/materials/dgtango/7828_KRONBERG_MATTINO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(193, 'DGtango', 'DGtango', '7829', 'SANA OAK', '', 'Woodgrain', 'SANA OAK', '7829_SANA_OAK.jpg', 'public/uploads/materials/dgtango/7829_SANA_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(194, 'DGtango', 'DGtango', '7830', 'DISSOLVENZA OAK', '', 'Woodgrain', 'SANA OAK', '7830_DISSOLVENZA_OAK.jpg', 'public/uploads/materials/dgtango/7830_DISSOLVENZA_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(195, 'DGtango', 'DGtango', '7831', 'MARRONE OAK', '', 'Woodgrain', 'SANA OAK', '7831_MARRONE_OAK.jpg', 'public/uploads/materials/dgtango/7831_MARRONE_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(196, 'DGtango', 'DGtango', '8113', 'APPLE', '', 'Woodgrain', 'MAPLE', '8113_APPLE.jpg', 'public/uploads/materials/dgtango/8113_APPLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(197, 'DGtango', 'DGtango', '3111', 'BAMBOO RATTAN', '', 'Woodgrain', 'BAMBOO', '3111_BAMBOO_RATTAN.jpg', 'public/uploads/materials/dgtango/3111_BAMBOO_RATTAN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(198, 'DGtango', 'DGtango', '3114', 'CHERRY FIBER', '', 'Woodgrain', 'BAMBOO', '3114_CHERRY_FIBER.jpg', 'public/uploads/materials/dgtango/3114_CHERRY_FIBER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(199, 'DGtango', 'DGtango', '3115', 'BAMBOO STRIPED', '', 'Woodgrain', 'BAMBOO', '3115_BAMBOO_STRIPED.jpg', 'public/uploads/materials/dgtango/3115_BAMBOO_STRIPED.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(200, 'DGtango', 'DGtango', '3118', 'FEATURES WALNUTS', '', 'Woodgrain', 'WALNUT', '3118_FEATURES_WALNUTS.jpg', 'public/uploads/materials/dgtango/3118_FEATURES_WALNUTS.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(201, 'DGtango', 'DGtango', '3119', 'DISTINCT ZEBRANO', '', 'Woodgrain', 'BAMBOO', '3119_DISTINCT_ZEBRANO.jpg', 'public/uploads/materials/dgtango/3119_DISTINCT_ZEBRANO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(202, 'DGtango', 'DGtango', '3211', 'NATURAL PINE', '', 'Woodgrain', 'CHERRY', '3211_NATURAL_PINE.jpg', 'public/uploads/materials/dgtango/3211_NATURAL_PINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(203, 'DGtango', 'DGtango', '3213', 'CHARCOAL WENGE', '', 'Woodgrain', 'BAMBOO', '3213_CHARCOAL_WENGE.jpg', 'public/uploads/materials/dgtango/3213_CHARCOAL_WENGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(204, 'DGtango', 'DGtango', '3215', 'BAMBOO STRIPED', '', 'Woodgrain', 'BAMBOO', '3215_BAMBOO_STRIPED.jpg', 'public/uploads/materials/dgtango/3215_BAMBOO_STRIPED.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(205, 'DGtango', 'DGtango', '3300', 'PURE TEAK', '', 'Woodgrain', 'TEAK', '3300_PURE_TEAK.jpg', 'public/uploads/materials/dgtango/3300_PURE_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(206, 'DGtango', 'DGtango', '3302', 'RIFT OAK', '', 'Woodgrain', 'OAK', '3302_RIFT_OAK.jpg', 'public/uploads/materials/dgtango/3302_RIFT_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(207, 'DGtango', 'DGtango', '3303', 'SPECIAL WOODGRAIN', '', 'Woodgrain', 'MAPLE', '3303_SPECIAL_WOODGRAIN.jpg', 'public/uploads/materials/dgtango/3303_SPECIAL_WOODGRAIN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(208, 'DGtango', 'DGtango', '3304', 'WALKING MOON', '', 'Woodgrain', 'YEW', '3304_WALKING_MOON.jpg', 'public/uploads/materials/dgtango/3304_WALKING_MOON.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(209, 'DGtango', 'DGtango', '3307', 'PINK OAK', '', 'Woodgrain', 'OAK', '3307_PINK_OAK.jpg', 'public/uploads/materials/dgtango/3307_PINK_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(210, 'DGtango', 'DGtango', '3308', 'ROUGH TAXUS CHINENSIS', '', 'Woodgrain', 'TEAK', '3308_ROUGH_TAXUS_CHINENSIS.jpg', 'public/uploads/materials/dgtango/3308_ROUGH_TAXUS_CHINENSIS.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(211, 'DGtango', 'DGtango', '3309', 'GROUND TAXUS CHINENSIS', '', 'Woodgrain', 'TEAK', '3309_GROUND_TAXUS_CHINENSIS.jpg', 'public/uploads/materials/dgtango/3309_GROUND_TAXUS_CHINENSIS.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(212, 'DGtango', 'DGtango', '7101', 'OLIVE TAXUS CHINENSIS', '', 'Woodgrain', 'TEAK', '7101_OLIVE_TAXUS_CHINENSIS.jpg', 'public/uploads/materials/dgtango/7101_OLIVE_TAXUS_CHINENSIS.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(213, 'DGtango', 'DGtango', '7111', 'PRECIOUS CHERRY', '', 'Woodgrain', 'CHERRY', '7111_PRECIOUS_CHERRY.jpg', 'public/uploads/materials/dgtango/7111_PRECIOUS_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(214, 'DGtango', 'DGtango', '7114', 'TORONTO MAPLE', '', 'Woodgrain', 'MAPLE', '7114_TORONTO_MAPLE.jpg', 'public/uploads/materials/dgtango/7114_TORONTO_MAPLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(215, 'DGtango', 'DGtango', '7115', 'CANADIAN RIFT TEAK', '', 'Woodgrain', 'TEAK', '7115_CANADIAN_RIFT_TEAK.jpg', 'public/uploads/materials/dgtango/7115_CANADIAN_RIFT_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(216, 'DGtango', 'DGtango', '7116', 'EUROPEAN RIFT TEAK', '', 'Woodgrain', 'CHERRY', '7116_EUROPEAN_RIFT_TEAK.jpg', 'public/uploads/materials/dgtango/7116_EUROPEAN_RIFT_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(217, 'DGtango', 'DGtango', '7117', 'WILD SPRUCE', '', 'Woodgrain', 'TEAK', '7117_WILD_SPRUCE.jpg', 'public/uploads/materials/dgtango/7117_WILD_SPRUCE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(218, 'DGtango', 'DGtango', '7120', 'CLASSIC PINE', '', 'Woodgrain', 'TEAK', '7120_CLASSIC_PINE.jpg', 'public/uploads/materials/dgtango/7120_CLASSIC_PINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(219, 'DGtango', 'DGtango', '7122', 'DARK DELICACY WOOD', '', 'Woodgrain', 'OAK', '7122_DARK_DELICACY_WOOD.jpg', 'public/uploads/materials/dgtango/7122_DARK_DELICACY_WOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(220, 'DGtango', 'DGtango', '7124', 'DARK WALNUT', '', 'Woodgrain', 'WALNUT', '7124_DARK_WALNUT.jpg', 'public/uploads/materials/dgtango/7124_DARK_WALNUT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(221, 'DGtango', 'DGtango', '7125', 'MALI WENGE', '', 'Woodgrain', 'WENGE', '7125_MALI_WENGE.jpg', 'public/uploads/materials/dgtango/7125_MALI_WENGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(222, 'DGtango', 'DGtango', '7126', 'WOODLINE PINE', '', 'Woodgrain', 'TEAK', '7126_WOODLINE_PINE.jpg', 'public/uploads/materials/dgtango/7126_WOODLINE_PINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(223, 'DGtango', 'DGtango', '7130', 'RIFT WALNUT', '', 'Woodgrain', 'MAPLE', '7130_RIFT_WALNUT.jpg', 'public/uploads/materials/dgtango/7130_RIFT_WALNUT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(224, 'DGtango', 'DGtango', '7133', 'DARK WALNUT WENGE', '', 'Woodgrain', 'WALNUT', '7133_DARK_WALNUT_WENGE.jpg', 'public/uploads/materials/dgtango/7133_DARK_WALNUT_WENGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(225, 'DGtango', 'DGtango', '7134', 'SWISS WALNUT', '', 'Woodgrain', 'WALNUT', '7134_SWISS_WALNUT.jpg', 'public/uploads/materials/dgtango/7134_SWISS_WALNUT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(226, 'DGtango', 'DGtango', '7135', 'NATURAL PINE', '', 'Woodgrain', '', '7135_NATURAL_PINE.jpg', 'public/uploads/materials/dgtango/7135_NATURAL_PINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(227, 'DGtango', 'DGtango', '7137', 'AMERICA WILD CHERRY', '', 'Woodgrain', 'CHERRY', '7137_AMERICA_WILD_CHERRY.jpg', 'public/uploads/materials/dgtango/7137_AMERICA_WILD_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(228, 'DGtango', 'DGtango', '7138', 'RED WALNUT', '', 'Woodgrain', 'WALNUT', '7138_RED_WALNUT.jpg', 'public/uploads/materials/dgtango/7138_RED_WALNUT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(229, 'DGtango', 'DGtango', '7139', 'CLASSIC SAPELE', '', 'Woodgrain', 'MAPLE', '7139_CLASSIC_SAPELE.jpg', 'public/uploads/materials/dgtango/7139_CLASSIC_SAPELE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(230, 'DGtango', 'DGtango', '7141', 'DARK WOODLINE', '', 'Woodgrain', 'BAMBOO', '7141_DARK_WOODLINE.jpg', 'public/uploads/materials/dgtango/7141_DARK_WOODLINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(231, 'DGtango', 'DGtango', '7142', 'ELEGANT CHERRY', '', 'Woodgrain', 'CHERRY', '7142_ELEGANT_CHERRY.jpg', 'public/uploads/materials/dgtango/7142_ELEGANT_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(232, 'DGtango', 'DGtango', '7143', 'ZEBRANO WOOD', '', 'Woodgrain', 'TEAK', '7143_ZEBRANO_WOOD.jpg', 'public/uploads/materials/dgtango/7143_ZEBRANO_WOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(233, 'DGtango', 'DGtango', '7144', 'BYZANTIUM CHERRY', '', 'Woodgrain', 'CHERRY', '7144_BYZANTIUM_CHERRY.jpg', 'public/uploads/materials/dgtango/7144_BYZANTIUM_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(234, 'DGtango', 'DGtango', '7145', 'MALT FIBER', '', 'Woodgrain', 'BAMBOO', '7145_MALT_FIBER.jpg', 'public/uploads/materials/dgtango/7145_MALT_FIBER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(235, 'DGtango', 'DGtango', '7147', 'RECONSTITUTED WOOD', '', 'Woodgrain', 'TEAK', '7147_RECONSTITUTED_WOOD.jpg', 'public/uploads/materials/dgtango/7147_RECONSTITUTED_WOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(236, 'DGtango', 'DGtango', '7150', 'ARCTIC OAK', '', 'Woodgrain', 'OAK', '7150_ARCTIC_OAK.jpg', 'public/uploads/materials/dgtango/7150_ARCTIC_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43');
INSERT INTO `dgtango` (`id`, `supplier`, `brand`, `product_code`, `product_name`, `finish_code`, `category`, `series`, `image_filename`, `image_path`, `is_active`, `created_at`, `updated_at`) VALUES
(237, 'DGtango', 'DGtango', '7151', 'DARK SANIBEL MAPLE', '', 'Woodgrain', 'CHERRY', '7151_DARK_SANIBEL_MAPLE.jpg', 'public/uploads/materials/dgtango/7151_DARK_SANIBEL_MAPLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(238, 'DGtango', 'DGtango', '7152', 'JAPAN MAPLE', '', 'Woodgrain', 'MAPLE', '7152_JAPAN_MAPLE.jpg', 'public/uploads/materials/dgtango/7152_JAPAN_MAPLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(239, 'DGtango', 'DGtango', '7153', 'STEAMED BEECH', '', 'Woodgrain', 'BEECH', '7153_STEAMED_BEECH.jpg', 'public/uploads/materials/dgtango/7153_STEAMED_BEECH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(240, 'DGtango', 'DGtango', '7154', 'FINELINE', '', 'Woodgrain', 'BAMBOO', '7154_FINELINE.jpg', 'public/uploads/materials/dgtango/7154_FINELINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(241, 'DGtango', 'DGtango', '7155', 'CHERRY OAK', '', 'Woodgrain', 'OAK', '7155_CHERRY_OAK.jpg', 'public/uploads/materials/dgtango/7155_CHERRY_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(242, 'DGtango', 'DGtango', '7156', 'CHALK OAK', '', 'Woodgrain', 'OAK', '7156_CHALK_OAK.jpg', 'public/uploads/materials/dgtango/7156_CHALK_OAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(243, 'DGtango', 'DGtango', '7157', 'RIVER CHERRY', '', 'Woodgrain', 'CHERRY', '7157_RIVER_CHERRY.jpg', 'public/uploads/materials/dgtango/7157_RIVER_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(244, 'DGtango', 'DGtango', '7158', 'DARK CHEER FIBER', '', 'Woodgrain', 'BAMBOO', '7158_DARK_CHEER_FIBER.jpg', 'public/uploads/materials/dgtango/7158_DARK_CHEER_FIBER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(245, 'DGtango', 'DGtango', '7159', 'GERMANY BIRCH', '', 'Woodgrain', 'TEAK', '7159_GERMANY_BIRCH.jpg', 'public/uploads/materials/dgtango/7159_GERMANY_BIRCH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(246, 'DGtango', 'DGtango', '7160', 'CHERRY FIBER', '', 'Woodgrain', 'BAMBOO', '7160_CHERRY_FIBER.jpg', 'public/uploads/materials/dgtango/7160_CHERRY_FIBER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(247, 'DGtango', 'DGtango', '7161', 'BAMBOO STRIPED', '', 'Woodgrain', 'BAMBOO', '7161_BAMBOO_STRIPED.jpg', 'public/uploads/materials/dgtango/7161_BAMBOO_STRIPED.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(248, 'DGtango', 'DGtango', '7163', 'BAMBOO RATTAN', '', 'Woodgrain', 'BAMBOO', '7163_BAMBOO_RATTAN.jpg', 'public/uploads/materials/dgtango/7163_BAMBOO_RATTAN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(249, 'DGtango', 'DGtango', '7164', 'JEQUIRITY WOOD', '', 'Woodgrain', 'TEAK', '7164_JEQUIRITY_WOOD.jpg', 'public/uploads/materials/dgtango/7164_JEQUIRITY_WOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(250, 'DGtango', 'DGtango', '7168', 'DESERT CHERRY', '', 'Woodgrain', 'CHERRY', '7168_DESERT_CHERRY.jpg', 'public/uploads/materials/dgtango/7168_DESERT_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(251, 'DGtango', 'DGtango', '7172', 'DARK CHERRY', '', 'Woodgrain', 'CHERRY', '7172_DARK_CHERRY.jpg', 'public/uploads/materials/dgtango/7172_DARK_CHERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(252, 'DGtango', 'DGtango', '7174', 'APPLE FADE', '', 'Woodgrain', 'TEAK', '7174_APPLE_FADE.jpg', 'public/uploads/materials/dgtango/7174_APPLE_FADE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(253, 'DGtango', 'DGtango', '7175', 'APPLE WOOD', '', 'Woodgrain', 'TEAK', '7175_APPLE_WOOD.jpg', 'public/uploads/materials/dgtango/7175_APPLE_WOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(254, 'DGtango', 'DGtango', '7180', 'OLD TEAK', '', 'Woodgrain', 'TEAK', '7180_OLD_TEAK.jpg', 'public/uploads/materials/dgtango/7180_OLD_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(255, 'DGtango', 'DGtango', '7185', 'CLEAR WALNUT', '', 'Woodgrain', 'BAMBOO', '7185_CLEAR_WALNUT.jpg', 'public/uploads/materials/dgtango/7185_CLEAR_WALNUT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(256, 'DGtango', 'DGtango', '7186', 'WOOD TEAK', '', 'Woodgrain', 'TEAK', '7186_WOOD_TEAK.jpg', 'public/uploads/materials/dgtango/7186_WOOD_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(257, 'DGtango', 'DGtango', '7187', 'SAND ROUND', '', 'Woodgrain', 'MAPLE', '7187_SAND_ROUND.jpg', 'public/uploads/materials/dgtango/7187_SAND_ROUND.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(258, 'DGtango', 'DGtango', '7188', 'WHITE TEAK', '', 'Woodgrain', 'TEAK', '7188_WHITE_TEAK.jpg', 'public/uploads/materials/dgtango/7188_WHITE_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(259, 'DGtango', 'DGtango', '7189', 'NEPAL TEAK', '', 'Woodgrain', 'WALNUT', '7189_NEPAL_TEAK.jpg', 'public/uploads/materials/dgtango/7189_NEPAL_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(260, 'DGtango', 'DGtango', '7190', 'SHARP MAPLE', '', 'Woodgrain', 'MAPLE', '7190_SHARP_MAPLE.jpg', 'public/uploads/materials/dgtango/7190_SHARP_MAPLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(261, 'DGtango', 'DGtango', '7301', 'LARGO', '', 'Woodgrain', 'OAK', '7301_LARGO.jpg', 'public/uploads/materials/dgtango/7301_LARGO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(262, 'DGtango', 'DGtango', '7302', 'CRACOW ADAGIO', '', 'Woodgrain', 'ELM', '7302_CRACOW_ADAGIO.jpg', 'public/uploads/materials/dgtango/7302_CRACOW_ADAGIO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(263, 'DGtango', 'DGtango', '7303', 'LUCERNE', '', 'Woodgrain', 'ELM', '7303_LUCERNE.jpg', 'public/uploads/materials/dgtango/7303_LUCERNE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(264, 'DGtango', 'DGtango', '7304', 'BOURGOGNE', '', 'Woodgrain', 'WALNUT', '7304_BOURGOGNE.jpg', 'public/uploads/materials/dgtango/7304_BOURGOGNE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(265, 'DGtango', 'DGtango', '7305', 'MARINO', '', 'Woodgrain', 'WALNUT', '7305_MARINO.jpg', 'public/uploads/materials/dgtango/7305_MARINO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(266, 'DGtango', 'DGtango', '7306', 'OSLO FIGARO', '', 'Woodgrain', 'OAK', '7306_OSLO_FIGARO.jpg', 'public/uploads/materials/dgtango/7306_OSLO_FIGARO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(267, 'DGtango', 'DGtango', '7307', 'GIOVANNI', '', 'Woodgrain', 'OAK', '7307_GIOVANNI.jpg', 'public/uploads/materials/dgtango/7307_GIOVANNI.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(268, 'DGtango', 'DGtango', '7308', 'CALIFORNIA', '', 'Woodgrain', 'WALNUT', '7308_CALIFORNIA.jpg', 'public/uploads/materials/dgtango/7308_CALIFORNIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(269, 'DGtango', 'DGtango', '7309', 'VENICE', '', 'Woodgrain', 'WALNUT', '7309_VENICE.jpg', 'public/uploads/materials/dgtango/7309_VENICE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(270, 'DGtango', 'DGtango', '7310', 'HECTOR', '', 'Woodgrain', 'OAK', '7310_HECTOR.jpg', 'public/uploads/materials/dgtango/7310_HECTOR.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(271, 'DGtango', 'DGtango', '7311', 'CORFU', '', 'Woodgrain', 'ELM', '7311_CORFU.jpg', 'public/uploads/materials/dgtango/7311_CORFU.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(272, 'DGtango', 'DGtango', '7312', 'BOOGIE', '', 'Woodgrain', 'ELM', '7312_BOOGIE.jpg', 'public/uploads/materials/dgtango/7312_BOOGIE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(273, 'DGtango', 'DGtango', '7313', 'PACIFIC', '', 'Woodgrain', 'OAK', '7313_PACIFIC.jpg', 'public/uploads/materials/dgtango/7313_PACIFIC.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(274, 'DGtango', 'DGtango', '7314', 'BRANDENBURG', '', 'Woodgrain', 'OAK', '7314_BRANDENBURG.jpg', 'public/uploads/materials/dgtango/7314_BRANDENBURG.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(275, 'DGtango', 'DGtango', '7315', 'BIANCO', '', 'Woodgrain', 'MAPLE', '7315_BIANCO.jpg', 'public/uploads/materials/dgtango/7315_BIANCO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(276, 'DGtango', 'DGtango', '7316', 'MARRONE', '', 'Woodgrain', 'MAPLE', '7316_MARRONE.jpg', 'public/uploads/materials/dgtango/7316_MARRONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(277, 'DGtango', 'DGtango', '7317', 'CREMA', '', 'Woodgrain', 'MAPLE', '7317_CREMA.jpg', 'public/uploads/materials/dgtango/7317_CREMA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(278, 'DGtango', 'DGtango', '7318', 'VERONA', '', 'Woodgrain', 'ELM', '7318_VERONA.jpg', 'public/uploads/materials/dgtango/7318_VERONA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(279, 'DGtango', 'DGtango', '7319', 'CALABRIA', '', 'Woodgrain', 'ELM', '7319_CALABRIA.jpg', 'public/uploads/materials/dgtango/7319_CALABRIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(280, 'DGtango', 'DGtango', '7320', 'BAINCO VANCOUVER', '', 'Woodgrain', 'CHERRY', '7320_BAINCO_VANCOUVER.jpg', 'public/uploads/materials/dgtango/7320_BAINCO_VANCOUVER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(281, 'DGtango', 'DGtango', '7321', 'CIOCCOLATO VANCOUVER', '', 'Woodgrain', 'CHERRY', '7321_CIOCCOLATO_VANCOUVER.jpg', 'public/uploads/materials/dgtango/7321_CIOCCOLATO_VANCOUVER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(282, 'DGtango', 'DGtango', '7322', 'GREY KASANDRA', '', 'Woodgrain', 'ELM', '7322_GREY_KASANDRA.jpg', 'public/uploads/materials/dgtango/7322_GREY_KASANDRA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(283, 'DGtango', 'DGtango', '7323', 'BROWN KASANDRA', '', 'Woodgrain', 'ELM', '7323_BROWN_KASANDRA.jpg', 'public/uploads/materials/dgtango/7323_BROWN_KASANDRA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(284, 'DGtango', 'DGtango', '7324', 'GREY AMBROSIA', '', 'Woodgrain', 'BAMBOO', '7324_GREY_AMBROSIA.jpg', 'public/uploads/materials/dgtango/7324_GREY_AMBROSIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(285, 'DGtango', 'DGtango', '7325', 'DARK AMBROSIA', '', 'Woodgrain', 'BAMBOO', '7325_DARK_AMBROSIA.jpg', 'public/uploads/materials/dgtango/7325_DARK_AMBROSIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(286, 'DGtango', 'DGtango', '7326', 'GRIGIO VANCOUVER', '', 'Woodgrain', 'CHERRY', '7326_GRIGIO_VANCOUVER.jpg', 'public/uploads/materials/dgtango/7326_GRIGIO_VANCOUVER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(287, 'DGtango', 'DGtango', '7327', 'NERO VANCOUVER', '', 'Woodgrain', 'CHERRY', '7327_NERO_VANCOUVER.jpg', 'public/uploads/materials/dgtango/7327_NERO_VANCOUVER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(288, 'DGtango', 'DGtango', '7343', 'ONTARIO WHITE', '', 'Woodgrain', 'OAK', '7343_ONTARIO_WHITE.jpg', 'public/uploads/materials/dgtango/7343_ONTARIO_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(289, 'DGtango', 'DGtango', '7344', 'ONTARIO SUMMER', '', 'Woodgrain', 'TEAK', '7344_ONTARIO_SUMMER.jpg', 'public/uploads/materials/dgtango/7344_ONTARIO_SUMMER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(290, 'DGtango', 'DGtango', '7345', 'ONTARIO NATURAL', '', 'Woodgrain', 'OAK', '7345_ONTARIO_NATURAL.jpg', 'public/uploads/materials/dgtango/7345_ONTARIO_NATURAL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(291, 'DGtango', 'DGtango', '7346', 'HICKORY MINK', '', 'Woodgrain', 'CHERRY', '7346_HICKORY_MINK.jpg', 'public/uploads/materials/dgtango/7346_HICKORY_MINK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(292, 'DGtango', 'DGtango', '7347', 'WINEO PINE', '', 'Woodgrain', 'TEAK', '7347_WINEO_PINE.jpg', 'public/uploads/materials/dgtango/7347_WINEO_PINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(293, 'DGtango', 'DGtango', '7348', 'COASTAL EUCALYPTUS', '', 'Woodgrain', 'TEAK', '7348_COASTAL_EUCALYPTUS.jpg', 'public/uploads/materials/dgtango/7348_COASTAL_EUCALYPTUS.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(294, 'DGtango', 'DGtango', '8111', 'JEQUIRITY WOOD', '', 'Woodgrain', 'WALNUT', '8111_JEQUIRITY_WOOD.jpg', 'public/uploads/materials/dgtango/8111_JEQUIRITY_WOOD.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(295, 'DGtango', 'DGtango', '8211', 'OAK H', '', 'Woodgrain', 'BAMBOO', '8211_OAK_H.jpg', 'public/uploads/materials/dgtango/8211_OAK_H.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(296, 'DGtango', 'DGtango', '8212', 'ZEBRA H', '', 'Woodgrain', 'BAMBOO', '8212_ZEBRA_H.jpg', 'public/uploads/materials/dgtango/8212_ZEBRA_H.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(297, 'DGtango', 'DGtango', '7365', 'CHIARO NATURALE TEAK', '', 'Woodgrain', 'TEAK', '7365_CHIARO_NATURALE_TEAK.jpg', 'public/uploads/materials/dgtango/7365_CHIARO_NATURALE_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(298, 'DGtango', 'DGtango', '7366', 'NATURALE TEAK', '', 'Woodgrain', 'TEAK', '7366_NATURALE_TEAK.jpg', 'public/uploads/materials/dgtango/7366_NATURALE_TEAK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(299, 'DGtango', 'DGtango', '7815', 'CONRADO PELE', '', 'Leather', 'CONRADO', '7815_CONRADO_PELE.jpg', 'public/uploads/materials/dgtango/7815_CONRADO_PELE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(300, 'DGtango', 'DGtango', '7816', 'CONRADO BUIO', '', 'Leather', 'CONRADO', '7816_CONRADO_BUIO.jpg', 'public/uploads/materials/dgtango/7816_CONRADO_BUIO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(301, 'DGtango', 'DGtango', '9111', 'WHITE', '', 'Leather', 'BUFFALOHIDES', '9111_WHITE.jpg', 'public/uploads/materials/dgtango/9111_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(302, 'DGtango', 'DGtango', '9112', 'BLACK', '', 'Leather', 'BUFFALOHIDES', '9112_BLACK.jpg', 'public/uploads/materials/dgtango/9112_BLACK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(303, 'DGtango', 'DGtango', '9211', 'BLACK NAPPA LEATHER', '', 'Leather', 'BUFFALOHIDES', '9211_BLACK_NAPPA_LEATHER.jpg', 'public/uploads/materials/dgtango/9211_BLACK_NAPPA_LEATHER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(304, 'DGtango', 'DGtango', '9212', 'COLD WHITE NAPPA LEATHER', '', 'Leather', 'BUFFALOHIDES', '9212_COLD_WHITE_NAPPA_LEATHER.jpg', 'public/uploads/materials/dgtango/9212_COLD_WHITE_NAPPA_LEATHER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(305, 'DGtango', 'DGtango', '9213', 'WARM WHITE NAPPA LEATHER', '', 'Leather', 'BUFFALOHIDES', '9213_WARM_WHITE_NAPPA_LEATHER.jpg', 'public/uploads/materials/dgtango/9213_WARM_WHITE_NAPPA_LEATHER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(306, 'DGtango', 'DGtango', '9214', 'COFFE NAPPA LEATHER', '', 'Leather', 'BUFFALOHIDES', '9214_COFFE_NAPPA_LEATHER.jpg', 'public/uploads/materials/dgtango/9214_COFFE_NAPPA_LEATHER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(307, 'DGtango', 'DGtango', '8501', 'STANDARD BLACK', '', 'Anti-fingerprint', 'ANTI-FINGER PRINT', '8501_STANDARD_BLACK.jpg', 'public/uploads/materials/dgtango/8501_STANDARD_BLACK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(308, 'DGtango', 'DGtango', '8502', 'DAISY WHITE', '', 'Anti-fingerprint', 'ANTI-FINGER PRINT', '8502_DAISY_WHITE.jpg', 'public/uploads/materials/dgtango/8502_DAISY_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(309, 'DGtango', 'DGtango', '8503', 'GRAY', '', 'Anti-fingerprint', 'ANTI-FINGER PRINT', '8503_GRAY.jpg', 'public/uploads/materials/dgtango/8503_GRAY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(310, 'DGtango', 'DGtango', '8504', 'GALAXY NAVY', '', 'Anti-fingerprint', 'ANTI-FINGER PRINT', '8504_GALAXY_NAVY.jpg', 'public/uploads/materials/dgtango/8504_GALAXY_NAVY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(311, 'DGtango', 'DGtango', '8505', 'INK GREEN', '', 'Anti-fingerprint', 'ANTI-FINGER PRINT', '8505_INK_GREEN.jpg', 'public/uploads/materials/dgtango/8505_INK_GREEN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(312, 'DGtango', 'DGtango', '7367', 'LUNA LUSTRE', '', 'Marble', 'KJERAG', '7367_LUNA_LUSTRE.jpg', 'public/uploads/materials/dgtango/7367_LUNA_LUSTRE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(313, 'DGtango', 'DGtango', '7368', 'LUNA VELAR', '', 'Marble', 'KJERAG', '7368_LUNA_VELAR.jpg', 'public/uploads/materials/dgtango/7368_LUNA_VELAR.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(314, 'DGtango', 'DGtango', '7369', 'AURELIA', '', 'Marble', 'KJERAG', '7369_AURELIA.jpg', 'public/uploads/materials/dgtango/7369_AURELIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(315, 'DGtango', 'DGtango', '7370', 'SOLARIA', '', 'Marble', 'KJERAG', '7370_SOLARIA.jpg', 'public/uploads/materials/dgtango/7370_SOLARIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(316, 'DGtango', 'DGtango', '7371', 'PURE VEIL', '', 'Marble', 'KJERAG', '7371_PURE_VEIL.jpg', 'public/uploads/materials/dgtango/7371_PURE_VEIL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(317, 'DGtango', 'DGtango', '7810', 'ALYSON ELEGANTE', '', 'Marble', 'ALYSON', '7810_ALYSON_ELEGANTE.jpg', 'public/uploads/materials/dgtango/7810_ALYSON_ELEGANTE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(318, 'DGtango', 'DGtango', '7811', 'TRANQUILLO ALYSON', '', 'Marble', 'ALYSON', '7811_TRANQUILLO_ALYSON.jpg', 'public/uploads/materials/dgtango/7811_TRANQUILLO_ALYSON.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(319, 'DGtango', 'DGtango', '7812', 'RISERVATO ALYSON', '', 'Marble', 'ALYSON', '7812_RISERVATO_ALYSON.jpg', 'public/uploads/materials/dgtango/7812_RISERVATO_ALYSON.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(320, 'DGtango', 'DGtango', '7825', 'NOBLE KJERAG', '', 'Marble', 'KJERAG', '7825_NOBLE_KJERAG.jpg', 'public/uploads/materials/dgtango/7825_NOBLE_KJERAG.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(321, 'DGtango', 'DGtango', '7826', 'KJERAG FANTASIA', '', 'Marble', 'KJERAG', '7826_KJERAG_FANTASIA.jpg', 'public/uploads/materials/dgtango/7826_KJERAG_FANTASIA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(322, 'DGtango', 'DGtango', '7328', 'MATT SENTIMENTAL', '', 'Marble', 'SENTIMENTAL', '7328_MATT_SENTIMENTAL.jpg', 'public/uploads/materials/dgtango/7328_MATT_SENTIMENTAL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(323, 'DGtango', 'DGtango', '7329', 'GLOSSY SENTIMENTAL', '', 'Marble', 'SENTIMENTAL', '7329_GLOSSY_SENTIMENTAL.jpg', 'public/uploads/materials/dgtango/7329_GLOSSY_SENTIMENTAL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(324, 'DGtango', 'DGtango', '7330', 'LIGHT TORINO', '', 'Marble', 'TORINO', '7330_LIGHT_TORINO.jpg', 'public/uploads/materials/dgtango/7330_LIGHT_TORINO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(325, 'DGtango', 'DGtango', '7332', 'GREY TORINO', '', 'Marble', 'TORINO', '7332_GREY_TORINO.jpg', 'public/uploads/materials/dgtango/7332_GREY_TORINO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(326, 'DGtango', 'DGtango', '7333', 'DARK TORINO', '', 'Marble', 'TORINO', '7333_DARK_TORINO.jpg', 'public/uploads/materials/dgtango/7333_DARK_TORINO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(327, 'DGtango', 'DGtango', '7349', 'GREY LAVATER STONE GLOSSY', '', 'Marble', 'LAVATER', '7349_GREY_LAVATER_STONE_GLOSSY.jpg', 'public/uploads/materials/dgtango/7349_GREY_LAVATER_STONE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(328, 'DGtango', 'DGtango', '7350', 'GREY LAVATER STONE', '', 'Marble', 'LAVATER', '7350_GREY_LAVATER_STONE.jpg', 'public/uploads/materials/dgtango/7350_GREY_LAVATER_STONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(329, 'DGtango', 'DGtango', '7351', 'LAVATER STONE GLOSSY', '', 'Marble', 'LAVATER', '7351_LAVATER_STONE_GLOSSY.jpg', 'public/uploads/materials/dgtango/7351_LAVATER_STONE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(330, 'DGtango', 'DGtango', '7352', 'LAVATER STONE', '', 'Marble', 'LAVATER', '7352_LAVATER_STONE.jpg', 'public/uploads/materials/dgtango/7352_LAVATER_STONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(331, 'DGtango', 'DGtango', '7353', 'GREECE MARBLE GLOSSY', '', 'Marble', 'LAVATER', '7353_GREECE_MARBLE_GLOSSY.jpg', 'public/uploads/materials/dgtango/7353_GREECE_MARBLE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(332, 'DGtango', 'DGtango', '7354', 'GREECE MARBLE', '', 'Marble', 'LAVATER', '7354_GREECE_MARBLE.jpg', 'public/uploads/materials/dgtango/7354_GREECE_MARBLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(333, 'DGtango', 'DGtango', '8606', 'CHAMPAGNE DUST', '', 'Galaxy', '', '8606_CHAMPAGNE_DUST.jpg', 'public/uploads/materials/dgtango/8606_CHAMPAGNE_DUST.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(334, 'DGtango', 'DGtango', '8601', 'BLACK GALAXY', '', 'Galaxy', '', '8601_BLACK_GALAXY.jpg', 'public/uploads/materials/dgtango/8601_BLACK_GALAXY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(335, 'DGtango', 'DGtango', '8602', 'COLD WHITE', '', 'Galaxy', '', '8602_COLD_WHITE.jpg', 'public/uploads/materials/dgtango/8602_COLD_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(336, 'DGtango', 'DGtango', '8603', 'WARM WHITE', '', 'Galaxy', '', '8603_WARM_WHITE.jpg', 'public/uploads/materials/dgtango/8603_WARM_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(337, 'DGtango', 'DGtango', '8604', 'GREY', '', 'Galaxy', '', '8604_GREY.jpg', 'public/uploads/materials/dgtango/8604_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(338, 'DGtango', 'DGtango', '8605', 'GRAYISH BLUE', '', 'Galaxy', '', '8605_GRAYISH_BLUE.jpg', 'public/uploads/materials/dgtango/8605_GRAYISH_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(339, 'DGtango', 'DGtango', '6254', 'DEEP AMBERGINE', '', 'Dry Matt', 'DRYMATT', '6254_DEEP_AMBERGINE.jpg', 'public/uploads/materials/dgtango/6254_DEEP_AMBERGINE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(340, 'DGtango', 'DGtango', '6253', 'MARSALA', '', 'Dry Matt', 'DRYMATT', '6253_MARSALA.jpg', 'public/uploads/materials/dgtango/6253_MARSALA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(341, 'DGtango', 'DGtango', '6260', 'PLASMA RED', '', 'Dry Matt', 'DRYMATT', '6260_PLASMA_RED.jpg', 'public/uploads/materials/dgtango/6260_PLASMA_RED.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(342, 'DGtango', 'DGtango', '6261', 'BRICK RED', '', 'Dry Matt', 'DRYMATT', '6261_BRICK_RED.jpg', 'public/uploads/materials/dgtango/6261_BRICK_RED.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(343, 'DGtango', 'DGtango', '6262', 'WOLFBERRY', '', 'Dry Matt', 'DRYMATT', '6262_WOLFBERRY.jpg', 'public/uploads/materials/dgtango/6262_WOLFBERRY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(344, 'DGtango', 'DGtango', '6263', 'PEACH WHISPER', '', 'Dry Matt', 'DRYMATT', '6263_PEACH_WHISPER.jpg', 'public/uploads/materials/dgtango/6263_PEACH_WHISPER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(345, 'DGtango', 'DGtango', '6249', 'BURNT CHOCOLATE', '', 'Dry Matt', 'DRYMATT', '6249_BURNT_CHOCOLATE.jpg', 'public/uploads/materials/dgtango/6249_BURNT_CHOCOLATE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(346, 'DGtango', 'DGtango', '6250', 'CINNAMON', '', 'Dry Matt', 'DRYMATT', '6250_CINNAMON.jpg', 'public/uploads/materials/dgtango/6250_CINNAMON.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(347, 'DGtango', 'DGtango', '6251', 'DESERT', '', 'Dry Matt', 'DRYMATT', '6251_DESERT.jpg', 'public/uploads/materials/dgtango/6251_DESERT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(348, 'DGtango', 'DGtango', '6252', 'IVORY', '', 'Dry Matt', 'DRYMATT', '6252_IVORY.jpg', 'public/uploads/materials/dgtango/6252_IVORY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(349, 'DGtango', 'DGtango', '6256', 'TAUPE', '', 'Dry Matt', 'DRYMATT', '6256_TAUPE.jpg', 'public/uploads/materials/dgtango/6256_TAUPE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(350, 'DGtango', 'DGtango', '6258', 'PEWTER', '', 'Dry Matt', 'DRYMATT', '6258_PEWTER.jpg', 'public/uploads/materials/dgtango/6258_PEWTER.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(351, 'DGtango', 'DGtango', '6257', 'ZEPHYR BROWN', '', 'Dry Matt', 'DRYMATT', '6257_ZEPHYR_BROWN.jpg', 'public/uploads/materials/dgtango/6257_ZEPHYR_BROWN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(352, 'DGtango', 'DGtango', '6248', 'DARK MATCHA', '', 'Dry Matt', 'DRYMATT', '6248_DARK_MATCHA.jpg', 'public/uploads/materials/dgtango/6248_DARK_MATCHA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(353, 'DGtango', 'DGtango', '6247', 'CELADON', '', 'Dry Matt', 'DRYMATT', '6247_CELADON.jpg', 'public/uploads/materials/dgtango/6247_CELADON.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(354, 'DGtango', 'DGtango', '6259', 'WHITECAP GRAY', '', 'Dry Matt', 'DRYMATT', '6259_WHITECAP_GRAY.jpg', 'public/uploads/materials/dgtango/6259_WHITECAP_GRAY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(355, 'DGtango', 'DGtango', '6264', 'OCEAN DEPTHS', '', 'Dry Matt', 'DRYMATT', '6264_OCEAN_DEPTHS.jpg', 'public/uploads/materials/dgtango/6264_OCEAN_DEPTHS.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(356, 'DGtango', 'DGtango', '6265', 'SNORLAX', '', 'Dry Matt', 'DRYMATT', '6265_SNORLAX.jpg', 'public/uploads/materials/dgtango/6265_SNORLAX.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(357, 'DGtango', 'DGtango', '6266', 'AZURE', '', 'Dry Matt', 'DRYMATT', '6266_AZURE.jpg', 'public/uploads/materials/dgtango/6266_AZURE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(358, 'DGtango', 'DGtango', '6267', 'DUSTY AQUA', '', 'Dry Matt', 'DRYMATT', '6267_DUSTY_AQUA.jpg', 'public/uploads/materials/dgtango/6267_DUSTY_AQUA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(359, 'DGtango', 'DGtango', '6255', 'MILKY TARO', '', 'Dry Matt', 'DRYMATT', '6255_MILKY_TARO.jpg', 'public/uploads/materials/dgtango/6255_MILKY_TARO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(360, 'DGtango', 'DGtango', '6238', 'SHADOW', '', 'Dry Matt', 'DRYMATT', '6238_SHADOW.jpg', 'public/uploads/materials/dgtango/6238_SHADOW.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(361, 'DGtango', 'DGtango', '6241', 'ONYX', '', 'Dry Matt', 'DRYMATT', '6241_ONYX.jpg', 'public/uploads/materials/dgtango/6241_ONYX.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(362, 'DGtango', 'DGtango', '6244', 'FOSSIL', '', 'Dry Matt', 'DRYMATT', '6244_FOSSIL.jpg', 'public/uploads/materials/dgtango/6244_FOSSIL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(363, 'DGtango', 'DGtango', '6240', 'MINK', '', 'Dry Matt', 'DRYMATT', '6240_MINK.jpg', 'public/uploads/materials/dgtango/6240_MINK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(364, 'DGtango', 'DGtango', '6242', 'OLIVE GREEN', '', 'Dry Matt', 'DRYMATT', '6242_OLIVE_GREEN.jpg', 'public/uploads/materials/dgtango/6242_OLIVE_GREEN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(365, 'DGtango', 'DGtango', '6243', 'LIGHT SAGE', '', 'Dry Matt', 'DRYMATT', '6243_LIGHT_SAGE.jpg', 'public/uploads/materials/dgtango/6243_LIGHT_SAGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(366, 'DGtango', 'DGtango', '6245', 'THISTLE', '', 'Dry Matt', 'DRYMATT', '6245_THISTLE.jpg', 'public/uploads/materials/dgtango/6245_THISTLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(367, 'DGtango', 'DGtango', '6246', 'OATMEAL', '', 'Dry Matt', 'DRYMATT', '6246_OATMEAL.jpg', 'public/uploads/materials/dgtango/6246_OATMEAL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(368, 'DGtango', 'DGtango', '6000S', 'MIDNIGHT SUEDE', '', 'Dry Matt', 'DRYMATT', '6000S_MIDNIGHT_SUEDE.jpg', 'public/uploads/materials/dgtango/6000S_MIDNIGHT_SUEDE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(369, 'DGtango', 'DGtango', '6000M', 'MIDNIGHT MATT', '', 'Dry Matt', 'DRYMATT', '6000M_MIDNIGHT_MATT.jpg', 'public/uploads/materials/dgtango/6000M_MIDNIGHT_MATT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(370, 'DGtango', 'DGtango', '6000G', 'MIDNIGHT GLOSSY', '', 'Dry Matt', 'DRYMATT', '6000G_MIDNIGHT_GLOSSY.jpg', 'public/uploads/materials/dgtango/6000G_MIDNIGHT_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(371, 'DGtango', 'DGtango', '6100S', 'TUSK WHITE SUEDE', '', 'Dry Matt', 'DRYMATT', '6100S_TUSK_WHITE_SUEDE.jpg', 'public/uploads/materials/dgtango/6100S_TUSK_WHITE_SUEDE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(372, 'DGtango', 'DGtango', '6100M', 'TUSK WHITE MATT', '', 'Dry Matt', 'DRYMATT', '6100M_TUSK_WHITE_MATT.jpg', 'public/uploads/materials/dgtango/6100M_TUSK_WHITE_MATT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(373, 'DGtango', 'DGtango', '6100G', 'TUSK WHITE GLOSSY', '', 'Dry Matt', 'DRYMATT', '6100G_TUSK_WHITE_GLOSSY.jpg', 'public/uploads/materials/dgtango/6100G_TUSK_WHITE_GLOSSY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(374, 'DGtango', 'DGtango', '7813', 'SEMPLICE BRISK', '', 'Stone', 'BRISK', '7813_SEMPLICE_BRISK.jpg', 'public/uploads/materials/dgtango/7813_SEMPLICE_BRISK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(375, 'DGtango', 'DGtango', '7814', 'FORTE BRISK', '', 'Stone', 'BRISK', '7814_FORTE_BRISK.jpg', 'public/uploads/materials/dgtango/7814_FORTE_BRISK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(376, 'DGtango', 'DGtango', '7822', 'SILENZIO KAMALA', '', 'Stone', 'KAMALA', '7822_SILENZIO_KAMALA.jpg', 'public/uploads/materials/dgtango/7822_SILENZIO_KAMALA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(377, 'DGtango', 'DGtango', '7823', 'GENTILE KAMALA', '', 'Stone', 'KAMALA', '7823_GENTILE_KAMALA.jpg', 'public/uploads/materials/dgtango/7823_GENTILE_KAMALA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(378, 'DGtango', 'DGtango', '7824', 'LEVE KAMALA', '', 'Stone', 'KAMALA', '7824_LEVE_KAMALA.jpg', 'public/uploads/materials/dgtango/7824_LEVE_KAMALA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(379, 'DGtango', 'DGtango', '7832', 'TORBIDO TWINKLE', '', 'Stone', 'TWINKLE', '7832_TORBIDO_TWINKLE.jpg', 'public/uploads/materials/dgtango/7832_TORBIDO_TWINKLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(380, 'DGtango', 'DGtango', '7833', 'ARROGANZA TWINKLE', '', 'Stone', 'TWINKLE', '7833_ARROGANZA_TWINKLE.jpg', 'public/uploads/materials/dgtango/7833_ARROGANZA_TWINKLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(381, 'DGtango', 'DGtango', '7834', 'AMOROSI TWINKLE', '', 'Stone', 'TWINKLE', '7834_AMOROSI_TWINKLE.jpg', 'public/uploads/materials/dgtango/7834_AMOROSI_TWINKLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(382, 'DGtango', 'DGtango', '7334', 'BIANCO GRAVEL', '', 'Stone', 'GRAVEL', '7334_BIANCO_GRAVEL.jpg', 'public/uploads/materials/dgtango/7334_BIANCO_GRAVEL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(383, 'DGtango', 'DGtango', '7335', 'GRIGIO GRAVEL', '', 'Stone', 'GRAVEL', '7335_GRIGIO_GRAVEL.jpg', 'public/uploads/materials/dgtango/7335_GRIGIO_GRAVEL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(384, 'DGtango', 'DGtango', '7336', 'NERO GRAVEL', '', 'Stone', 'GRAVEL', '7336_NERO_GRAVEL.jpg', 'public/uploads/materials/dgtango/7336_NERO_GRAVEL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(385, 'DGtango', 'DGtango', '7355', 'BIANCO VESTIGE STONE', '', 'Stone', 'GRAVEL', '7355_BIANCO_VESTIGE_STONE.jpg', 'public/uploads/materials/dgtango/7355_BIANCO_VESTIGE_STONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(386, 'DGtango', 'DGtango', '7356', 'GRIOGIO VESTIGE STONE', '', 'Stone', 'GRAVEL', '7356_GRIOGIO_VESTIGE_STONE.jpg', 'public/uploads/materials/dgtango/7356_GRIOGIO_VESTIGE_STONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(387, 'DGtango', 'DGtango', '7357', 'NERO VESTIGE STONE', '', 'Stone', 'GRAVEL', '7357_NERO_VESTIGE_STONE.jpg', 'public/uploads/materials/dgtango/7357_NERO_VESTIGE_STONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(388, 'DGtango', 'DGtango', '7361', 'BIANCO HERRINGBONE', '', 'Stone', 'CALCULUS', '7361_BIANCO_HERRINGBONE.jpg', 'public/uploads/materials/dgtango/7361_BIANCO_HERRINGBONE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(389, 'DGtango', 'DGtango', '7362', 'CARRARA STATUARIETTO', '', 'Stone', 'CALCULUS', '7362_CARRARA_STATUARIETTO.jpg', 'public/uploads/materials/dgtango/7362_CARRARA_STATUARIETTO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(390, 'DGtango', 'DGtango', '7363', 'BIANCO PIETRA', '', 'Stone', 'CALCULUS', '7363_BIANCO_PIETRA.jpg', 'public/uploads/materials/dgtango/7363_BIANCO_PIETRA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(391, 'DGtango', 'DGtango', '7364', 'NERO PIETRA', '', 'Stone', 'CALCULUS', '7364_NERO_PIETRA.jpg', 'public/uploads/materials/dgtango/7364_NERO_PIETRA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(392, 'DGtango', 'DGtango', '8009R', 'LUNIGIANA DESTRO', '', 'Duo', 'LUNIGIANA', '8009R_LUNIGIANA_DESTRO.jpg', 'public/uploads/materials/dgtango/8009R_LUNIGIANA_DESTRO.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(393, 'DGtango', 'DGtango', '8010L', 'LUNIGIANA SINISTRA', '', 'Duo', 'LUNIGIANA', '8010L_LUNIGIANA_SINISTRA.jpg', 'public/uploads/materials/dgtango/8010L_LUNIGIANA_SINISTRA.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(394, 'DGtango', 'DGtango', '8020L', 'TUSCAN RIDGE', '', 'Duo', 'TUSCAN', '8020L_TUSCAN_RIDGE.jpg', 'public/uploads/materials/dgtango/8020L_TUSCAN_RIDGE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(395, 'DGtango', 'DGtango', '8021R', 'TUSCAN VALLEY', '', 'Duo', 'TUSCAN', '8021R_TUSCAN_VALLEY.jpg', 'public/uploads/materials/dgtango/8021R_TUSCAN_VALLEY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(396, 'DGtango', 'DGtango', '6301', 'GLORIOUS GREEN', '', 'Super Matte Solid', '', '6301_GLORIOUS_GREEN.jpg', 'public/uploads/materials/dgtango/6301_GLORIOUS_GREEN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(397, 'DGtango', 'DGtango', '6302', 'ARMY GREEN', '', 'Super Matte Solid', '', '6302_ARMY_GREEN.jpg', 'public/uploads/materials/dgtango/6302_ARMY_GREEN.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(398, 'DGtango', 'DGtango', '6303', 'BLACK', '', 'Super Matte Solid', '', '6303_BLACK.jpg', 'public/uploads/materials/dgtango/6303_BLACK.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(399, 'DGtango', 'DGtango', '6304', 'COOL GREY', '', 'Super Matte Solid', '', '6304_COOL_GREY.jpg', 'public/uploads/materials/dgtango/6304_COOL_GREY.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(400, 'DGtango', 'DGtango', '6305', 'FOG', '', 'Super Matte Solid', '', '6305_FOG.jpg', 'public/uploads/materials/dgtango/6305_FOG.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(401, 'DGtango', 'DGtango', '6306', 'PEBBLE', '', 'Super Matte Solid', '', '6306_PEBBLE.jpg', 'public/uploads/materials/dgtango/6306_PEBBLE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(402, 'DGtango', 'DGtango', '6307', 'DARK CRONCH', '', 'Super Matte Solid', '', '6307_DARK_CRONCH.jpg', 'public/uploads/materials/dgtango/6307_DARK_CRONCH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(403, 'DGtango', 'DGtango', '6308', 'BLUSH', '', 'Super Matte Solid', '', '6308_BLUSH.jpg', 'public/uploads/materials/dgtango/6308_BLUSH.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(404, 'DGtango', 'DGtango', '6309', 'BRIGHT RED', '', 'Super Matte Solid', '', '6309_BRIGHT_RED.jpg', 'public/uploads/materials/dgtango/6309_BRIGHT_RED.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(405, 'DGtango', 'DGtango', '6310', 'NAVY BLUE', '', 'Super Matte Solid', '', '6310_NAVY_BLUE.jpg', 'public/uploads/materials/dgtango/6310_NAVY_BLUE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(406, 'DGtango', 'DGtango', '6311', 'LIGHT YELLOW', '', 'Super Matte Solid', '', '6311_LIGHT_YELLOW.jpg', 'public/uploads/materials/dgtango/6311_LIGHT_YELLOW.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(407, 'DGtango', 'DGtango', '6312', 'SUNSET POINT', '', 'Super Matte Solid', '', '6312_SUNSET_POINT.jpg', 'public/uploads/materials/dgtango/6312_SUNSET_POINT.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(408, 'DGtango', 'DGtango', '6313', 'CAMEL', '', 'Super Matte Solid', '', '6313_CAMEL.jpg', 'public/uploads/materials/dgtango/6313_CAMEL.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(409, 'DGtango', 'DGtango', '6314', 'PRIME WHITE', '', 'Super Matte Solid', '', '6314_PRIME_WHITE.jpg', 'public/uploads/materials/dgtango/6314_PRIME_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43'),
(410, 'DGtango', 'DGtango', '6315', 'PURE WHITE', '', 'Super Matte Solid', '', '6315_PURE_WHITE.jpg', 'public/uploads/materials/dgtango/6315_PURE_WHITE.jpg', 1, '2026-10-07 05:47:43', '2026-10-07 05:47:43');

-- --------------------------------------------------------

--
-- Table structure for table `door_styles`
--

CREATE TABLE `door_styles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `preview_image` varchar(255) DEFAULT NULL,
  `price_modifier` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `door_styles`
--

INSERT INTO `door_styles` (`id`, `name`, `slug`, `description`, `preview_image`, `price_modifier`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Flat Panel', 'flat-panel', 'Simple modern slab-style cabinet door.', 'assets/images/doors/flat-panel.png', 0.00, 1, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(2, 'Shaker', 'shaker', 'Classic framed cabinet door with recessed centre panel.', 'assets/images/doors/shaker.png', 100.00, 2, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(3, 'Slim Shaker', 'slim-shaker', 'Modern narrow-frame interpretation of the Shaker style.', 'assets/images/doors/slim-shaker.png', 130.00, 3, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(4, 'Glass Panel', 'glass-panel', 'Cabinet door with transparent or translucent glass centre.', 'assets/images/doors/glass-panel.png', 150.00, 4, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(5, 'Fluted Panel', 'fluted-panel', 'Decorative vertical fluted panel design.', 'assets/images/doors/fluted-panel.png', 180.00, 5, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(6, 'Demo Slim Panel', 'demo-slim-panel', 'Demo seeded description for door styles.', 'uploads/demo/door_styles-preview_image.dat', 100.00, 1, 1, '2026-10-02 04:19:21', '2026-10-02 04:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `finishes`
--

CREATE TABLE `finishes` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `preview_image` varchar(255) DEFAULT NULL,
  `price_modifier` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `finishes`
--

INSERT INTO `finishes` (`id`, `name`, `slug`, `description`, `preview_image`, `price_modifier`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Melamine', 'melamine', 'Affordable standard cabinet finish with good durability.', 'assets/images/finishes/melamine.jpg', 0.00, 1, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(2, 'Laminate', 'laminate', 'Durable decorative laminate suitable for many styles.', 'assets/images/finishes/laminate.jpg', 100.00, 2, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(3, 'Matte Laminate', 'matte-laminate', 'Low-sheen laminate with a modern appearance.', 'assets/images/finishes/matte-laminate.jpg', 120.00, 3, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(4, 'High Gloss Acrylic', 'high-gloss-acrylic', 'Reflective acrylic finish for a premium contemporary look.', 'assets/images/finishes/high-gloss-acrylic.jpg', 250.00, 4, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(5, 'Matte Acrylic', 'matte-acrylic', 'Soft matte acrylic finish with a premium feel.', 'assets/images/finishes/matte-acrylic.jpg', 280.00, 5, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(6, 'Wood Veneer', 'wood-veneer', 'Natural wood veneer for a warmer premium finish.', 'assets/images/finishes/wood-veneer.jpg', 350.00, 6, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(7, 'Spray Paint', 'spray-paint', 'Custom painted finish for flexible colour choices.', 'assets/images/finishes/spray-paint.jpg', 300.00, 7, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(8, 'Demo Matte Finish', 'demo-matte-finish', 'Demo seeded description for finishes.', 'uploads/demo/finishes-preview_image.dat', 100.00, 1, 1, '2026-10-02 04:19:21', '2026-10-02 04:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `handles`
--

CREATE TABLE `handles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `preview_image` varchar(255) DEFAULT NULL,
  `price_modifier` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `handles`
--

INSERT INTO `handles` (`id`, `name`, `slug`, `description`, `preview_image`, `price_modifier`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Handleless', 'handleless', 'Minimal handleless cabinet front.', 'assets/images/handles/handleless.png', 0.00, 1, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(2, 'Black Bar Handle', 'black-bar-handle', 'Straight matte black bar handle.', 'assets/images/handles/black-bar.png', 25.00, 2, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(3, 'Silver Bar Handle', 'silver-bar-handle', 'Brushed silver straight bar handle.', 'assets/images/handles/silver-bar.png', 25.00, 3, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(4, 'Gold Bar Handle', 'gold-bar-handle', 'Warm metallic straight cabinet handle.', 'assets/images/handles/gold-bar.png', 35.00, 4, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(5, 'Round Knob', 'round-knob', 'Simple round cabinet knob.', 'assets/images/handles/round-knob.png', 15.00, 5, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(6, 'Edge Pull', 'edge-pull', 'Discrete integrated edge pull handle.', 'assets/images/handles/edge-pull.png', 30.00, 6, 1, '2026-10-01 17:06:22', '2026-10-01 17:06:22'),
(7, 'Demo Edge Pull', 'demo-edge-pull', 'Demo seeded description for handles.', 'uploads/demo/handles-preview_image.dat', 100.00, 1, 1, '2026-10-02 04:19:21', '2026-10-02 04:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `inspiration_designs`
--

CREATE TABLE `inspiration_designs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `style_name` varchar(120) DEFAULT NULL,
  `room_type` varchar(100) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `base_design_id` int(10) UNSIGNED DEFAULT NULL,
  `default_template_id` int(10) UNSIGNED DEFAULT NULL,
  `default_finish_id` int(10) UNSIGNED DEFAULT NULL,
  `default_color_id` int(10) UNSIGNED DEFAULT NULL,
  `default_door_style_id` int(10) UNSIGNED DEFAULT NULL,
  `default_handle_id` int(10) UNSIGNED DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inspiration_designs`
--

INSERT INTO `inspiration_designs` (`id`, `title`, `slug`, `style_name`, `room_type`, `description`, `cover_image`, `base_design_id`, `default_template_id`, `default_finish_id`, `default_color_id`, `default_door_style_id`, `default_handle_id`, `is_featured`, `is_published`, `sort_order`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Warm Japandi Demo Kitchen', 'warm-japandi-demo-kitchen', 'Japandi', 'Kitchen', 'Demo seeded description for inspiration designs.', 'uploads/demo/inspiration_designs-cover_image.dat', 3, 15, 8, 13, 6, 7, 1, 1, 1, NULL, '2026-10-02 04:19:22', '2026-11-25 01:50:53');

-- --------------------------------------------------------

--
-- Table structure for table `inspiration_design_tags`
--

CREATE TABLE `inspiration_design_tags` (
  `inspiration_design_id` bigint(20) UNSIGNED NOT NULL,
  `tag_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inspiration_design_tags`
--

INSERT INTO `inspiration_design_tags` (`inspiration_design_id`, `tag_id`) VALUES
(1, 8);

-- --------------------------------------------------------

--
-- Table structure for table `inspiration_images`
--

CREATE TABLE `inspiration_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `inspiration_design_id` bigint(20) UNSIGNED NOT NULL,
  `image_path` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inspiration_images`
--

INSERT INTO `inspiration_images` (`id`, `inspiration_design_id`, `image_path`, `caption`, `sort_order`) VALUES
(1, 1, 'uploads/demo/inspiration_images-image_path.dat', 'Demo caption', 1);

-- --------------------------------------------------------

--
-- Table structure for table `inspiration_tags`
--

CREATE TABLE `inspiration_tags` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inspiration_tags`
--

INSERT INTO `inspiration_tags` (`id`, `name`, `slug`) VALUES
(1, 'Modern', 'modern'),
(2, 'Minimalist', 'minimalist'),
(3, 'Japandi', 'japandi'),
(4, 'Industrial', 'industrial'),
(5, 'Luxury', 'luxury'),
(6, 'Scandinavian', 'scandinavian'),
(7, 'Classic', 'classic'),
(8, 'Demo Style', 'demo-style');

-- --------------------------------------------------------

--
-- Table structure for table `project_gallery_entries`
--

CREATE TABLE `project_gallery_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `short_description` text DEFAULT NULL,
  `full_description` longtext DEFAULT NULL,
  `location_label` varchar(150) DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_gallery_entries`
--

INSERT INTO `project_gallery_entries` (`id`, `project_id`, `title`, `slug`, `category`, `short_description`, `full_description`, `location_label`, `completion_date`, `cover_image`, `is_featured`, `is_published`, `published_at`, `sort_order`, `created_by`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Demo Modern Kitchen Project', 'demo-modern-kitchen-project', 'Kitchen', 'A sample completed kitchen project.', 'Demo seeded full description for project gallery entries.', 'Demo location label', '2026-10-02', 'uploads/demo/project_gallery_entries-cover_image.dat', 1, 1, '2026-10-02 12:00:00', 1, NULL, '2026-10-02 04:19:22', '2026-11-25 01:50:53');

-- --------------------------------------------------------

--
-- Table structure for table `project_gallery_images`
--

CREATE TABLE `project_gallery_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `gallery_entry_id` bigint(20) UNSIGNED NOT NULL,
  `image_path` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `image_type` enum('before','after','detail','general') NOT NULL DEFAULT 'general',
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_gallery_images`
--

INSERT INTO `project_gallery_images` (`id`, `gallery_entry_id`, `image_path`, `caption`, `image_type`, `sort_order`) VALUES
(1, 1, 'uploads/demo/project_gallery_images-image_path.dat', 'Demo caption', 'general', 1);

-- --------------------------------------------------------

--
-- Table structure for table `topmix`
--

CREATE TABLE `topmix` (
  `id` int(10) UNSIGNED NOT NULL,
  `supplier` varchar(100) DEFAULT 'Topmix',
  `brand` varchar(100) DEFAULT 'Topmix',
  `product_code` varchar(100) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `finish_code` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `series` varchar(150) DEFAULT NULL,
  `image_filename` varchar(255) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `topmix`
--

INSERT INTO `topmix` (`id`, `supplier`, `brand`, `product_code`, `product_name`, `finish_code`, `category`, `series`, `image_filename`, `image_path`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Topmix', 'Topmix', 'TW10-53902', 'AARHUS OAK', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53902_IM_AARHUS_OAK.jpg', 'public/uploads/materials/topmix/TW10-53902_IM_AARHUS_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(2, 'Topmix', 'Topmix', 'TW10-53905', 'KIEL OAK', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53905_IM_KIEL_OAK.jpg', 'public/uploads/materials/topmix/TW10-53905_IM_KIEL_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(3, 'Topmix', 'Topmix', 'TW10-53903', 'PRAGUE OAK', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53903_IM_PRAGUE_OAK.jpg', 'public/uploads/materials/topmix/TW10-53903_IM_PRAGUE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(4, 'Topmix', 'Topmix', 'TW10-53051', 'BLED BIRCH', 'M', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53051_M_BLED_BIRCH.jpg', 'public/uploads/materials/topmix/TW10-53051_M_BLED_BIRCH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(5, 'Topmix', 'Topmix', 'TW10-53052', 'TITANIUM BIRCH', 'M', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53052_M_TITANIUM_BIRCH.jpg', 'public/uploads/materials/topmix/TW10-53052_M_TITANIUM_BIRCH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(6, 'Topmix', 'Topmix', 'TW10-53027', 'OSTIA WALNUT', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53027_IM_OSTIA_WALNUT.jpg', 'public/uploads/materials/topmix/TW10-53027_IM_OSTIA_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(7, 'Topmix', 'Topmix', 'TW10-53026', 'COSENZA WALNUT', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53026_IM_COSENZA_WALNUT.jpg', 'public/uploads/materials/topmix/TW10-53026_IM_COSENZA_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(8, 'Topmix', 'Topmix', 'TW10-53050', 'VW BORDEAUX BASSWOOD', '', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53050_VW_BORDEAUX_BASSWOOD.jpg', 'public/uploads/materials/topmix/TW10-53050_VW_BORDEAUX_BASSWOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(9, 'Topmix', 'Topmix', 'TW10-53039', 'VW COMO BASSWOOD', '', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53039_VW_COMO_BASSWOOD.jpg', 'public/uploads/materials/topmix/TW10-53039_VW_COMO_BASSWOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(10, 'Topmix', 'Topmix', 'TW10-53053', 'VW LUCCA BASSWOOD', '', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53053_VW_LUCCA_BASSWOOD.jpg', 'public/uploads/materials/topmix/TW10-53053_VW_LUCCA_BASSWOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(11, 'Topmix', 'Topmix', 'TW10-53755', 'BOGOTA PINE', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53755_SE_BOGOTA_PINE.jpg', 'public/uploads/materials/topmix/TW10-53755_SE_BOGOTA_PINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(12, 'Topmix', 'Topmix', 'TW10-53752', 'PASTO PINE', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53752_SE_PASTO_PINE.jpg', 'public/uploads/materials/topmix/TW10-53752_SE_PASTO_PINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(13, 'Topmix', 'Topmix', 'TW10-53773', 'MINISK ASH', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53773_VM_MINISK_ASH.jpg', 'public/uploads/materials/topmix/TW10-53773_VM_MINISK_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(14, 'Topmix', 'Topmix', 'TW10-53771', 'BREGENZ ASH', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53771_VM_BREGENZ_ASH.jpg', 'public/uploads/materials/topmix/TW10-53771_VM_BREGENZ_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(15, 'Topmix', 'Topmix', 'TW10-53002', 'JOGEVA ELM', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53002_VM_JOGEVA_ELM.jpg', 'public/uploads/materials/topmix/TW10-53002_VM_JOGEVA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(16, 'Topmix', 'Topmix', 'TW10-53003', 'ELVA ELM', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53003_VM_ELVA_ELM.jpg', 'public/uploads/materials/topmix/TW10-53003_VM_ELVA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(17, 'Topmix', 'Topmix', 'TW10-53001', 'VALGA ELM', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53001_VM_VALGA_ELM.jpg', 'public/uploads/materials/topmix/TW10-53001_VM_VALGA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(18, 'Topmix', 'Topmix', 'TW10-53789', 'BOCHUM PEAR', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53789_ST_BOCHUM_PEAR.jpg', 'public/uploads/materials/topmix/TW10-53789_ST_BOCHUM_PEAR.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(19, 'Topmix', 'Topmix', 'TW10-53793', 'TRAVNIK PEAR', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53793_ST_TRAVNIK_PEAR.jpg', 'public/uploads/materials/topmix/TW10-53793_ST_TRAVNIK_PEAR.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(20, 'Topmix', 'Topmix', 'TW10-53705', 'TARANTO WALNUT', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53705_IM_TARANTO_WALNUT.jpg', 'public/uploads/materials/topmix/TW10-53705_IM_TARANTO_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(21, 'Topmix', 'Topmix', 'TW10-53706', 'BOLZANO WALNUT', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53706_IM_BOLZANO_WALNUT.jpg', 'public/uploads/materials/topmix/TW10-53706_IM_BOLZANO_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(22, 'Topmix', 'Topmix', 'TB5-53017', 'GEOMETRIC WOOD', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TB5-53017_VM_GEOMETRIC_WOOD.jpg', 'public/uploads/materials/topmix/TB5-53017_VM_GEOMETRIC_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(23, 'Topmix', 'Topmix', 'TW10-53008', 'OSLO OAK', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53008_VM_OSLO_OAK.jpg', 'public/uploads/materials/topmix/TW10-53008_VM_OSLO_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(24, 'Topmix', 'Topmix', 'TW10-53005', 'OLTEN', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53005_ST_OLTEN.jpg', 'public/uploads/materials/topmix/TW10-53005_ST_OLTEN.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(25, 'Topmix', 'Topmix', 'TW10-53007', 'VARESE OAK', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53007_JW_VARESE_OAK.jpg', 'public/uploads/materials/topmix/TW10-53007_JW_VARESE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(26, 'Topmix', 'Topmix', 'TW10-53009', 'HERISAU', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53009_VM_HERISAU.jpg', 'public/uploads/materials/topmix/TW10-53009_VM_HERISAU.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(27, 'Topmix', 'Topmix', 'TW10-53605', 'FRANKFURT OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53605_SE_FRANKFURT_OAK.jpg', 'public/uploads/materials/topmix/TW10-53605_SE_FRANKFURT_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(28, 'Topmix', 'Topmix', 'TW10-53770', 'SLUTSK', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53770_VM_SLUTSK.jpg', 'public/uploads/materials/topmix/TW10-53770_VM_SLUTSK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(29, 'Topmix', 'Topmix', 'TW10-53006', 'ASAPH ASH', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW10-53006_VM_ASAPH_ASH.jpg', 'public/uploads/materials/topmix/TW10-53006_VM_ASAPH_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(30, 'Topmix', 'Topmix', 'TW9-3906', 'LUMIERE ASH', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3906_S_LUMIERE_ASH.jpg', 'public/uploads/materials/topmix/TW9-3906_S_LUMIERE_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(31, 'Topmix', 'Topmix', 'TW9-3907', 'STIRLING ASH', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3907_S_STIRLING_ASH.jpg', 'public/uploads/materials/topmix/TW9-3907_S_STIRLING_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(32, 'Topmix', 'Topmix', 'TW9-3908', 'BRUNELLO ASH', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3908_S_BRUNELLO_ASH.jpg', 'public/uploads/materials/topmix/TW9-3908_S_BRUNELLO_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(33, 'Topmix', 'Topmix', 'TW9-3910', 'TORINO ASH', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3910_S_TORINO_ASH.jpg', 'public/uploads/materials/topmix/TW9-3910_S_TORINO_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(34, 'Topmix', 'Topmix', 'TW9-3909', 'ALBA ASH', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3909_S_ALBA_ASH.jpg', 'public/uploads/materials/topmix/TW9-3909_S_ALBA_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(35, 'Topmix', 'Topmix', 'TW9-3767', 'STOLBTSY OAK', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3767_S_STOLBISY_OAK.jpg', 'public/uploads/materials/topmix/TW9-3767_S_STOLBISY_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(36, 'Topmix', 'Topmix', 'TW9-3766', 'BORISOV OAK', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3766_S_BORISOV_OAK.jpg', 'public/uploads/materials/topmix/TW9-3766_S_BORISOV_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(37, 'Topmix', 'Topmix', 'TW9-3686', 'ALBURY ASH', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3686_S_ALBURY_ASH.jpg', 'public/uploads/materials/topmix/TW9-3686_S_ALBURY_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(38, 'Topmix', 'Topmix', 'TW9-3688', 'GOSFORD ASH', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3688_S_GOSFORD_ASH.jpg', 'public/uploads/materials/topmix/TW9-3688_S_GOSFORD_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(39, 'Topmix', 'Topmix', 'TW9-3687', 'NEWCASTLE ASH', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3687_S_NEWCASTLE_ASH.jpg', 'public/uploads/materials/topmix/TW9-3687_S_NEWCASTLE_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(40, 'Topmix', 'Topmix', 'TW9-3679', 'ANTELOPE WALNUT', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3679_S_ANTELOPE_WALNUT.jpg', 'public/uploads/materials/topmix/TW9-3679_S_ANTELOPE_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(41, 'Topmix', 'Topmix', 'TW9-3680', 'ARIZONA WALNUT', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3680_S_ARIZONA_WALNUT.jpg', 'public/uploads/materials/topmix/TW9-3680_S_ARIZONA_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(42, 'Topmix', 'Topmix', 'TW9-3681', 'TUSAYAN WALNUT', 'S', 'Woodgrain', 'SYNCHRONIZED SERIES', 'TW9-3681_S_TUSAYAN_WALNUT.jpg', 'public/uploads/materials/topmix/TW9-3681_S_TUSAYAN_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(43, 'Topmix', 'Topmix', 'TW8-3921', 'MARLAY WALNUT', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3921_NT_MARLAY_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3921_NT_MARLAY_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(44, 'Topmix', 'Topmix', 'TW8-3926', 'LUCAN WALNUT', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3926_NT_LUCAN_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3926_NT_LUCAN_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(45, 'Topmix', 'Topmix', 'TW8-3919', 'NW COPENHAGEN OAK', '', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3919_NW_COPENHAGEN_OAK.jpg', 'public/uploads/materials/topmix/TW8-3919_NW_COPENHAGEN_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(46, 'Topmix', 'Topmix', 'TW8-3928', 'NW TOSCANO OAK', '', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3928_NW_TOSCANO_OAK.jpg', 'public/uploads/materials/topmix/TW8-3928_NW_TOSCANO_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(47, 'Topmix', 'Topmix', 'TW8-3929', 'NW SOFIA OAK', '', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3929_NW_SOFIA_OAK.jpg', 'public/uploads/materials/topmix/TW8-3929_NW_SOFIA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(48, 'Topmix', 'Topmix', 'TW8-3922', 'SEVILLE OAK', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3922_NT_SEVILLE_OAK.jpg', 'public/uploads/materials/topmix/TW8-3922_NT_SEVILLE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(49, 'Topmix', 'Topmix', 'TW8-3917', 'VALENCIA OAK', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3917_NT_VALENCIA_OAK.jpg', 'public/uploads/materials/topmix/TW8-3917_NT_VALENCIA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(50, 'Topmix', 'Topmix', 'TW8-3902', 'AARHUS OAK', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3902_IM_AARHUS_OAK.jpg', 'public/uploads/materials/topmix/TW8-3902_IM_AARHUS_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(51, 'Topmix', 'Topmix', 'TW8-3905', 'KIEL OAK', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3905_IM_KIEL_OAK.jpg', 'public/uploads/materials/topmix/TW8-3905_IM_KIEL_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(52, 'Topmix', 'Topmix', 'TW8-3903', '#] PRAGUE OAK', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3903_IM__PRAGUE_OAK.jpg', 'public/uploads/materials/topmix/TW8-3903_IM__PRAGUE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(53, 'Topmix', 'Topmix', 'TW8-3927', 'LUCERNE OAK', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3927_VM_LUCERNE_OAK.jpg', 'public/uploads/materials/topmix/TW8-3927_VM_LUCERNE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(54, 'Topmix', 'Topmix', 'TW8-3920', 'BERN OAK', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3920_VM_BERN_OAK.jpg', 'public/uploads/materials/topmix/TW8-3920_VM_BERN_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(55, 'Topmix', 'Topmix', 'TW8-3923', 'GOREY NOGAL', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3923_NT_GOREY_NOGAL.jpg', 'public/uploads/materials/topmix/TW8-3923_NT_GOREY_NOGAL.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(56, 'Topmix', 'Topmix', 'TW8-3916', 'WICKLOW NOGAL', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3916_NT_WICKLOW_NOGAL.jpg', 'public/uploads/materials/topmix/TW8-3916_NT_WICKLOW_NOGAL.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(57, 'Topmix', 'Topmix', 'TW8-3913', 'KILTERNAN NOGAL', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3913_NT_KILTERNAN_NOGAL.jpg', 'public/uploads/materials/topmix/TW8-3913_NT_KILTERNAN_NOGAL.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(58, 'Topmix', 'Topmix', 'TW8-3911', 'UMBRA BEECH', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3911_JW_UMBRA_BEECH.jpg', 'public/uploads/materials/topmix/TW8-3911_JW_UMBRA_BEECH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(59, 'Topmix', 'Topmix', 'TW8-3918', 'MARRON BEECH', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3918_JW_MARRON_BEECH.jpg', 'public/uploads/materials/topmix/TW8-3918_JW_MARRON_BEECH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(60, 'Topmix', 'Topmix', 'TW8-3912', 'AMBER BEECH', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3912_JW_AMBER_BEECH.jpg', 'public/uploads/materials/topmix/TW8-3912_JW_AMBER_BEECH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(61, 'Topmix', 'Topmix', 'TW8-3915', 'ZERMATT WALNUT', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3915_JW_ZERMATT_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3915_JW_ZERMATT_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(62, 'Topmix', 'Topmix', 'TW8-3769', 'STOLIN ASH', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3769_VF_STOLIN_ASH.jpg', 'public/uploads/materials/topmix/TW8-3769_VF_STOLIN_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(63, 'Topmix', 'Topmix', 'TW8-3768', 'GOMEL ASH', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3768_VF_GOMEL_ASH.jpg', 'public/uploads/materials/topmix/TW8-3768_VF_GOMEL_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(64, 'Topmix', 'Topmix', 'TW8-3773', 'MINISK ASH', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3773_VM_MINISK_ASH.jpg', 'public/uploads/materials/topmix/TW8-3773_VM_MINISK_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(65, 'Topmix', 'Topmix', 'TW8-3771', 'BREGENZ ASH', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3771_VM_BREGENZ_ASH.jpg', 'public/uploads/materials/topmix/TW8-3771_VM_BREGENZ_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(66, 'Topmix', 'Topmix', 'TW8-3707', 'CREMONA WALNUT', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3707_VM_CREMONA_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3707_VM_CREMONA_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(67, 'Topmix', 'Topmix', 'TW8-3705', 'TARANTO WALNUT', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3705_VM_TARANTO_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3705_VM_TARANTO_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(68, 'Topmix', 'Topmix', 'TW8-3706', 'BOLZANO WALNUT', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3706_VM_BOLZANO_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3706_VM_BOLZANO_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(69, 'Topmix', 'Topmix', 'TW8-3785', 'MISSOURI ELM', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3785_IM_MISSOURI_ELM.jpg', 'public/uploads/materials/topmix/TW8-3785_IM_MISSOURI_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(70, 'Topmix', 'Topmix', 'TW8-3779', 'LOWA ELM', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3779_IM_LOWA_ELM.jpg', 'public/uploads/materials/topmix/TW8-3779_IM_LOWA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(71, 'Topmix', 'Topmix', 'TW8-3781', 'ZENICA ELM', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3781_IM_ZENICA_ELM.jpg', 'public/uploads/materials/topmix/TW8-3781_IM_ZENICA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(72, 'Topmix', 'Topmix', 'TW8-3793', 'TRAVNIK PEAR', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3793_ST_TRAVNIK_PEAR.jpg', 'public/uploads/materials/topmix/TW8-3793_ST_TRAVNIK_PEAR.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(73, 'Topmix', 'Topmix', 'TW8-3789', 'BOCHUM PEAR', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3789_ST_BOCHUM_PEAR.jpg', 'public/uploads/materials/topmix/TW8-3789_ST_BOCHUM_PEAR.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(74, 'Topmix', 'Topmix', 'TW8-3788', 'VITEZ ACACIA', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3788_VF_VITEZ_ACACIA.jpg', 'public/uploads/materials/topmix/TW8-3788_VF_VITEZ_ACACIA.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(75, 'Topmix', 'Topmix', 'TW8-3786', 'ERFURT ACACIA', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3786_VF_ERFURT_ACACIA.jpg', 'public/uploads/materials/topmix/TW8-3786_VF_ERFURT_ACACIA.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(76, 'Topmix', 'Topmix', 'TW7-3731', 'TAXCO OAK', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3731_VM_TAXCO_OAK.jpg', 'public/uploads/materials/topmix/TW7-3731_VM_TAXCO_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(77, 'Topmix', 'Topmix', 'TW7-3732', 'MENDOZA OAK', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3732_VM_MENDOZA_OAK.jpg', 'public/uploads/materials/topmix/TW7-3732_VM_MENDOZA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(78, 'Topmix', 'Topmix', 'TW7-3578', 'OXFORD OAK', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3578_VM_OXFORD_OAK.jpg', 'public/uploads/materials/topmix/TW7-3578_VM_OXFORD_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(79, 'Topmix', 'Topmix', 'TW8-3780', 'ORSHA ASH', 'DE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3780_DE_ORSHA_ASH.jpg', 'public/uploads/materials/topmix/TW8-3780_DE_ORSHA_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(80, 'Topmix', 'Topmix', 'TW8-3783', 'KOBRIN ASH', 'DE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3783_DE_KOBRIN_ASH.jpg', 'public/uploads/materials/topmix/TW8-3783_DE_KOBRIN_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(81, 'Topmix', 'Topmix', 'TW8-3782', 'VISOKO ASH', 'DE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3782_DE_VISOKO_ASH.jpg', 'public/uploads/materials/topmix/TW8-3782_DE_VISOKO_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(82, 'Topmix', 'Topmix', 'TW8-3752', 'PASTO PINE', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3752_SE_PASTO_PINE.jpg', 'public/uploads/materials/topmix/TW8-3752_SE_PASTO_PINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(83, 'Topmix', 'Topmix', 'TW8-3755', 'BOGOTA PINE', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3755_SE_BOGOTA_PINE.jpg', 'public/uploads/materials/topmix/TW8-3755_SE_BOGOTA_PINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(84, 'Topmix', 'Topmix', 'TW8-3763', 'BRISBANE OAK', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3763_JW_BRISBANE_OAK.jpg', 'public/uploads/materials/topmix/TW8-3763_JW_BRISBANE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(85, 'Topmix', 'Topmix', 'TW8-3765', 'ZAGORA OAK', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3765_JW_ZAGORA_OAK.jpg', 'public/uploads/materials/topmix/TW8-3765_JW_ZAGORA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(86, 'Topmix', 'Topmix', 'TW8-3721', 'GOUDA ELM', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3721_IM_GOUDA_ELM.jpg', 'public/uploads/materials/topmix/TW8-3721_IM_GOUDA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(87, 'Topmix', 'Topmix', 'TW8-3723', 'VENLO ELM', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3723_IM_VENLO_ELM.jpg', 'public/uploads/materials/topmix/TW8-3723_IM_VENLO_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(88, 'Topmix', 'Topmix', 'TW7-3555', 'LANTINO WALNUT', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3555_NT_LANTINO_WALNUT.jpg', 'public/uploads/materials/topmix/TW7-3555_NT_LANTINO_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(89, 'Topmix', 'Topmix', 'TW7-3556', 'BROWN WALNUT', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3556_NT_BROWN_WALNUT.jpg', 'public/uploads/materials/topmix/TW7-3556_NT_BROWN_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(90, 'Topmix', 'Topmix', 'TW8-3600', 'MANCHESTER CHESTNUT', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3600_SE_MANCHESTER_CHESTNUT.jpg', 'public/uploads/materials/topmix/TW8-3600_SE_MANCHESTER_CHESTNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(91, 'Topmix', 'Topmix', 'TW8-3631', 'SUVA ASH', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3631_JW_SUVA_ASH.jpg', 'public/uploads/materials/topmix/TW8-3631_JW_SUVA_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(92, 'Topmix', 'Topmix', 'TW8-3623', 'SALTO CHESTNUT', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3623_SE_SALTO_CHESTNUT.jpg', 'public/uploads/materials/topmix/TW8-3623_SE_SALTO_CHESTNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(93, 'Topmix', 'Topmix', 'TW7-3629', 'PALESTINE ASH', 'M', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3629_M_PALESTINE_ASH.jpg', 'public/uploads/materials/topmix/TW7-3629_M_PALESTINE_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(94, 'Topmix', 'Topmix', 'TW7-3630', 'BOLIVIA ASH', 'M', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3630_M_BOLIVIA_ASH.jpg', 'public/uploads/materials/topmix/TW7-3630_M_BOLIVIA_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(95, 'Topmix', 'Topmix', 'TW7-3628', 'ESTONIA ASH', 'M', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3628_M_ESTONIA_ASH.jpg', 'public/uploads/materials/topmix/TW7-3628_M_ESTONIA_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(96, 'Topmix', 'Topmix', 'TW8-3790', 'HERNE TEAK', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3790_NT_HERNE_TEAK.jpg', 'public/uploads/materials/topmix/TW8-3790_NT_HERNE_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(97, 'Topmix', 'Topmix', 'TW8-3792', 'HAGEN TEAK', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3792_NT_HAGEN_TEAK.jpg', 'public/uploads/materials/topmix/TW8-3792_NT_HAGEN_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(98, 'Topmix', 'Topmix', 'TW8-3795', 'BONN TEAK', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3795_NT_BONN_TEAK.jpg', 'public/uploads/materials/topmix/TW8-3795_NT_BONN_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(99, 'Topmix', 'Topmix', 'TW8-3638', 'ML VIZHI RECON', '', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3638_ML_VIZHI_RECON.jpg', 'public/uploads/materials/topmix/TW8-3638_ML_VIZHI_RECON.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(100, 'Topmix', 'Topmix', 'TW8-3637', 'ML GENOVA RECON', '', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3637_ML_GENOVA_RECON.jpg', 'public/uploads/materials/topmix/TW8-3637_ML_GENOVA_RECON.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(101, 'Topmix', 'Topmix', 'TW8-3777', 'ESSEN WALNUT', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3777_VF_ESSEN_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3777_VF_ESSEN_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(102, 'Topmix', 'Topmix', 'TW8-3778', 'SALZBURG WALNUT', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3778_VF_SALZBURG_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3778_VF_SALZBURG_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(103, 'Topmix', 'Topmix', 'TW8-3710', 'PARMA WALNUT', 'W', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3710_W_PARMA_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3710_W_PARMA_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(104, 'Topmix', 'Topmix', 'TW8-3708', 'TRENTO WALNUT', 'W', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3708_W_TRENTO_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3708_W_TRENTO_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(105, 'Topmix', 'Topmix', 'TW8-3791', 'INNSBRUCK PINE', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3791_VF_INNSBRUCK_PINE.jpg', 'public/uploads/materials/topmix/TW8-3791_VF_INNSBRUCK_PINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(106, 'Topmix', 'Topmix', 'TW8-3787', 'POLOTSK PINE', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3787_VF_POLOTSK_PINE.jpg', 'public/uploads/materials/topmix/TW8-3787_VF_POLOTSK_PINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(107, 'Topmix', 'Topmix', 'TW8-3776', 'MIORY OAK', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3776_JW_MIORY_OAK.jpg', 'public/uploads/materials/topmix/TW8-3776_JW_MIORY_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(108, 'Topmix', 'Topmix', 'TW8-3775', 'VETKA OAK', 'VF', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3775_VF_VETKA_OAK.jpg', 'public/uploads/materials/topmix/TW8-3775_VF_VETKA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(109, 'Topmix', 'Topmix', 'TW8-3636', 'SLOVENIA OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3636_SE_SLOVENIA_OAK.jpg', 'public/uploads/materials/topmix/TW8-3636_SE_SLOVENIA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(110, 'Topmix', 'Topmix', 'TW8-3635', 'TOGO OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3635_SE_TOGO_OAK.jpg', 'public/uploads/materials/topmix/TW8-3635_SE_TOGO_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(111, 'Topmix', 'Topmix', 'TW8-3607', 'BERLIN OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3607_SE_BERLIN_OAK.jpg', 'public/uploads/materials/topmix/TW8-3607_SE_BERLIN_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(112, 'Topmix', 'Topmix', 'TW8-3757', 'LAGOS CHESTNUT', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3757_SE_LAGOS_CHESTNUT.jpg', 'public/uploads/materials/topmix/TW8-3757_SE_LAGOS_CHESTNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(113, 'Topmix', 'Topmix', 'TW8-3756', 'MAIDUGURI CHESTNUT', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3756_SE_MAIDUGURI_CHESTNUT.jpg', 'public/uploads/materials/topmix/TW8-3756_SE_MAIDUGURI_CHESTNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(114, 'Topmix', 'Topmix', 'TW8-3758', 'SOKOTO CHESTNUT', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3758_SE_SOKOTO_CHESTNUT.jpg', 'public/uploads/materials/topmix/TW8-3758_SE_SOKOTO_CHESTNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(115, 'Topmix', 'Topmix', 'TW8-3716', 'SM GENEVA BIRCH', '', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3716_SM_GENEVA_BIRCH.jpg', 'public/uploads/materials/topmix/TW8-3716_SM_GENEVA_BIRCH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(116, 'Topmix', 'Topmix', 'TW8-3715', 'SM ZURICH BIRCH', '', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3715_SM_ZURICH_BIRCH.jpg', 'public/uploads/materials/topmix/TW8-3715_SM_ZURICH_BIRCH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(117, 'Topmix', 'Topmix', 'TW8-3698', 'RENNES ASH', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3698_JW_RENNES_ASH.jpg', 'public/uploads/materials/topmix/TW8-3698_JW_RENNES_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(118, 'Topmix', 'Topmix', 'TW8-3697', 'NANTES ASH', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3697_JW_NANTES_ASH.jpg', 'public/uploads/materials/topmix/TW8-3697_JW_NANTES_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(119, 'Topmix', 'Topmix', 'TW8-3759', 'JARDIN ELM', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3759_JW_JARDIN_ELM.jpg', 'public/uploads/materials/topmix/TW8-3759_JW_JARDIN_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(120, 'Topmix', 'Topmix', 'TW8-3760', 'MOCOA ELM', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3760_JW_MOCOA_ELM.jpg', 'public/uploads/materials/topmix/TW8-3760_JW_MOCOA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(121, 'Topmix', 'Topmix', 'TW8-3726', 'TORONTO OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3726_SE_TORONTO_OAK.jpg', 'public/uploads/materials/topmix/TW8-3726_SE_TORONTO_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(122, 'Topmix', 'Topmix', 'TW8-3727', 'BURLINGTON OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3727_SE_BURLINGTON_OAK.jpg', 'public/uploads/materials/topmix/TW8-3727_SE_BURLINGTON_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(123, 'Topmix', 'Topmix', 'TW8-3616', 'LIBYA ELM', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3616_ST_LIBYA_ELM.jpg', 'public/uploads/materials/topmix/TW8-3616_ST_LIBYA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(124, 'Topmix', 'Topmix', 'TW8-3613', 'GUATEMALA ELM', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3613_ST_GUATEMALA_ELM.jpg', 'public/uploads/materials/topmix/TW8-3613_ST_GUATEMALA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(125, 'Topmix', 'Topmix', 'TW8-3713', 'CAMBRIDGE OAK', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3713_IM_CAMBRIDGE_OAK.jpg', 'public/uploads/materials/topmix/TW8-3713_IM_CAMBRIDGE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(126, 'Topmix', 'Topmix', 'TW8-3712', 'COVENTRY OAK', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3712_IM_COVENTRY_OAK.jpg', 'public/uploads/materials/topmix/TW8-3712_IM_COVENTRY_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(127, 'Topmix', 'Topmix', 'TW8-3567', 'YORK ASH', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3567_IM_YORK_ASH.jpg', 'public/uploads/materials/topmix/TW8-3567_IM_YORK_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(128, 'Topmix', 'Topmix', 'TW8-3700', 'TOULOUSE ASH', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3700_JW_TOULOUSE_ASH.jpg', 'public/uploads/materials/topmix/TW8-3700_JW_TOULOUSE_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(129, 'Topmix', 'Topmix', 'TW8-3570', 'BIRMINGHAM ASH', 'IM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3570_IM_BIRMINGHAM_ASH.jpg', 'public/uploads/materials/topmix/TW8-3570_IM_BIRMINGHAM_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(130, 'Topmix', 'Topmix', 'TW8-3672', 'ETAWAH WALNUT', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3672_VM_ETAWAH_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3672_VM_ETAWAH_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(131, 'Topmix', 'Topmix', 'TW8-3673', 'PAIVALIKA WALNUT', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3673_VM_PAIVALIKA_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3673_VM_PAIVALIKA_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(132, 'Topmix', 'Topmix', 'TW8-3671', 'IMPHAL WALNUT', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3671_VM_IMPHAL_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3671_VM_IMPHAL_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(133, 'Topmix', 'Topmix', 'TW8-3709', 'NOTTINGHAM WALNUT', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3709_VM_NOTTINGHAM_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3709_VM_NOTTINGHAM_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(134, 'Topmix', 'Topmix', 'TW8-3678', 'PANOOR WALNUT', 'M', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3678_M_PANOOR_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3678_M_PANOOR_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(135, 'Topmix', 'Topmix', 'TW8-3677', 'RAJOURI WALNUT', 'M', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3677_M_RAJOURI_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3677_M_RAJOURI_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(136, 'Topmix', 'Topmix', 'TW8-3720', 'AMSTERDAM OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3720_SE_AMSTERDAM_OAK.jpg', 'public/uploads/materials/topmix/TW8-3720_SE_AMSTERDAM_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(137, 'Topmix', 'Topmix', 'TW8-3719', 'LOCARNO OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3719_SE_LOCARNO_OAK.jpg', 'public/uploads/materials/topmix/TW8-3719_SE_LOCARNO_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(138, 'Topmix', 'Topmix', 'TW8-3718', 'BELLINZONA OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3718_SE_BELLINZONA_OAK.jpg', 'public/uploads/materials/topmix/TW8-3718_SE_BELLINZONA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(139, 'Topmix', 'Topmix', 'TW8-3605', 'FRANKFURT OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3605_SE_FRANKFURT_OAK.jpg', 'public/uploads/materials/topmix/TW8-3605_SE_FRANKFURT_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(140, 'Topmix', 'Topmix', 'TW8-3650', 'GAMBIA OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3650_SE_GAMBIA_OAK.jpg', 'public/uploads/materials/topmix/TW8-3650_SE_GAMBIA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(141, 'Topmix', 'Topmix', 'TW8-3651', 'NEPAL OAK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3651_SE_NEPAL_OAK.jpg', 'public/uploads/materials/topmix/TW8-3651_SE_NEPAL_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(142, 'Topmix', 'Topmix', 'TW8-3611', 'MATTOOL HICKORY', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3611_SE_MATTOOL_HICKORY.jpg', 'public/uploads/materials/topmix/TW8-3611_SE_MATTOOL_HICKORY.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(143, 'Topmix', 'Topmix', 'TW8-3610', 'FLORENCE HICKORY', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3610_SE_FLORENCE_HICKORY.jpg', 'public/uploads/materials/topmix/TW8-3610_SE_FLORENCE_HICKORY.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(144, 'Topmix', 'Topmix', 'TW8-3612', 'CAYENE HICKORY', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3612_SE_CAYENE_HICKORY.jpg', 'public/uploads/materials/topmix/TW8-3612_SE_CAYENE_HICKORY.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(145, 'Topmix', 'Topmix', 'TW8-3701', 'RAGUSA ELM', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3701_SE_RAGUSA_ELM.jpg', 'public/uploads/materials/topmix/TW8-3701_SE_RAGUSA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(146, 'Topmix', 'Topmix', 'TW8-3703', 'POSITANO ELM', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3703_SE_POSITANO_ELM.jpg', 'public/uploads/materials/topmix/TW8-3703_SE_POSITANO_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(147, 'Topmix', 'Topmix', 'TW8-3762', 'GEORGE WALNUT', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3762_SE_GEORGE_WALNUT.jpg', 'public/uploads/materials/topmix/TW8-3762_SE_GEORGE_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(148, 'Topmix', 'Topmix', 'TW8-3738', 'CALAMA OAK', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3738_JW_CALAMA_OAK.jpg', 'public/uploads/materials/topmix/TW8-3738_JW_CALAMA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(149, 'Topmix', 'Topmix', 'TW6-3187', 'BEIGE WOOD', 'W', 'Woodgrain', 'PREMIUM SERIES', 'TW6-3187_W_BEIGE_WOOD.jpg', 'public/uploads/materials/topmix/TW6-3187_W_BEIGE_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(150, 'Topmix', 'Topmix', 'TW6-3510', 'PURE ASH', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW6-3510_ST_PURE_ASH.jpg', 'public/uploads/materials/topmix/TW6-3510_ST_PURE_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(151, 'Topmix', 'Topmix', 'TW6-3509', 'ASH INNATE', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW6-3509_ST_ASH_INNATE.jpg', 'public/uploads/materials/topmix/TW6-3509_ST_ASH_INNATE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(152, 'Topmix', 'Topmix', 'TW8-3667', 'MONACO TEAK', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3667_NT_MONACO_TEAK.jpg', 'public/uploads/materials/topmix/TW8-3667_NT_MONACO_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(153, 'Topmix', 'Topmix', 'TW8-3668', 'SALTO TEAK', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3668_NT_SALTO_TEAK.jpg', 'public/uploads/materials/topmix/TW8-3668_NT_SALTO_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(154, 'Topmix', 'Topmix', 'TW8-3666', 'DURAZNO TEAK', 'NT', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3666_NT_DURAZNO_TEAK.jpg', 'public/uploads/materials/topmix/TW8-3666_NT_DURAZNO_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(155, 'Topmix', 'Topmix', 'TW8-3751', 'LINZ NOGAL', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3751_SE_LINZ_NOGAL.jpg', 'public/uploads/materials/topmix/TW8-3751_SE_LINZ_NOGAL.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(156, 'Topmix', 'Topmix', 'TW8-3750', 'VIENNA NOGAL', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3750_SE_VIENNA_NOGAL.jpg', 'public/uploads/materials/topmix/TW8-3750_SE_VIENNA_NOGAL.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(157, 'Topmix', 'Topmix', 'TW7-3662', 'FLORIDA OAK', 'ST', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3662_ST_FLORIDA_OAK.jpg', 'public/uploads/materials/topmix/TW7-3662_ST_FLORIDA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(158, 'Topmix', 'Topmix', 'TW8-3669', 'BEECH GALLE', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3669_JW_BEECH_GALLE.jpg', 'public/uploads/materials/topmix/TW8-3669_JW_BEECH_GALLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(159, 'Topmix', 'Topmix', 'TW8-3730', 'SANTOS OAK', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3730_JW_SANTOS_OAK.jpg', 'public/uploads/materials/topmix/TW8-3730_JW_SANTOS_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(160, 'Topmix', 'Topmix', 'TP6-3828', 'QUERCUS OAK', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TP6-3828_JW_QUERCUS_OAK.jpg', 'public/uploads/materials/topmix/TP6-3828_JW_QUERCUS_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(161, 'Topmix', 'Topmix', 'TP6-3830', 'ESTONIA OAK', 'JW', 'Woodgrain', 'PREMIUM SERIES', 'TP6-3830_JW_ESTONIA_OAK.jpg', 'public/uploads/materials/topmix/TP6-3830_JW_ESTONIA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(162, 'Topmix', 'Topmix', 'TW8-3676', 'PRETORIA PALISANDER', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3676_VM_PRETORIA_PALISANDER.jpg', 'public/uploads/materials/topmix/TW8-3676_VM_PRETORIA_PALISANDER.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(163, 'Topmix', 'Topmix', 'TW8-3596', 'DURBAN MAPLE', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3596_SE_DURBAN_MAPLE.jpg', 'public/uploads/materials/topmix/TW8-3596_SE_DURBAN_MAPLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(164, 'Topmix', 'Topmix', 'TW7-3689', 'IZOLA HERRINGBONE', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3689_VM_IZOLA_HERRINGBONE.jpg', 'public/uploads/materials/topmix/TW7-3689_VM_IZOLA_HERRINGBONE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(165, 'Topmix', 'Topmix', 'TW7-3691', 'BOVEC HERRINGBONE', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3691_VM_BOVEC_HERRINGBONE.jpg', 'public/uploads/materials/topmix/TW7-3691_VM_BOVEC_HERRINGBONE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(166, 'Topmix', 'Topmix', 'TW7-3690', 'MARIBOR HERRINGBONE', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW7-3690_VM_MARIBOR_HERRINGBONE.jpg', 'public/uploads/materials/topmix/TW7-3690_VM_MARIBOR_HERRINGBONE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(167, 'Topmix', 'Topmix', 'TP6-3565', 'MARACAIBO', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TP6-3565_SE_MARACAIBO.jpg', 'public/uploads/materials/topmix/TP6-3565_SE_MARACAIBO.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(168, 'Topmix', 'Topmix', 'TW8-3770', 'SLUTSK', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3770_VM_SLUTSK.jpg', 'public/uploads/materials/topmix/TW8-3770_VM_SLUTSK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(169, 'Topmix', 'Topmix', 'TP6-3875', 'DEKORACIO', 'VM', 'Woodgrain', 'PREMIUM SERIES', 'TP6-3875_VM_DEKORACIO.jpg', 'public/uploads/materials/topmix/TP6-3875_VM_DEKORACIO.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(170, 'Topmix', 'Topmix', 'TW8-3695', 'DUBLIN HERRINGBONE', 'NE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3695_NE_DUBLIN_HERRINGBONE.jpg', 'public/uploads/materials/topmix/TW8-3695_NE_DUBLIN_HERRINGBONE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(171, 'Topmix', 'Topmix', 'TW8-3693', 'STRASBOURG PLANK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3693_SE_STRASBOURG_PLANK.jpg', 'public/uploads/materials/topmix/TW8-3693_SE_STRASBOURG_PLANK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(172, 'Topmix', 'Topmix', 'TW8-3696', 'LYON PLANK', 'SE', 'Woodgrain', 'PREMIUM SERIES', 'TW8-3696_SE_LYON_PLANK.jpg', 'public/uploads/materials/topmix/TW8-3696_SE_LYON_PLANK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(173, 'Topmix', 'Topmix', 'TP7-53036', 'VW SNOW WHITE WOOD', '', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP7-53036_VW_SNOW_WHITE_WOOD.jpg', 'public/uploads/materials/topmix/TP7-53036_VW_SNOW_WHITE_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(174, 'Topmix', 'Topmix', 'TP7-53033', 'VW CHIFFON WHITE WOOD', '', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP7-53033_VW_CHIFFON_WHITE_WOOD.jpg', 'public/uploads/materials/topmix/TP7-53033_VW_CHIFFON_WHITE_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(175, 'Topmix', 'Topmix', 'TP7-53035', 'VW CHELSEA GREY WOOD', '', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP7-53035_VW_CHELSEA_GREY_WOOD.jpg', 'public/uploads/materials/topmix/TP7-53035_VW_CHELSEA_GREY_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(176, 'Topmix', 'Topmix', 'TP7-53037', 'VW FUSCOUS WOOD', '', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP7-53037_VW_FUSCOUS_WOOD.jpg', 'public/uploads/materials/topmix/TP7-53037_VW_FUSCOUS_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(177, 'Topmix', 'Topmix', 'TP6-3888', 'PUMICE BROWN WOOD', 'S', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP6-3888_S_PUMICE_BROWN_WOOD.jpg', 'public/uploads/materials/topmix/TP6-3888_S_PUMICE_BROWN_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(178, 'Topmix', 'Topmix', 'TP6-3886', 'LIMED SPRUCE WOOD', 'S', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP6-3886_S_LIMED_SPRUCE_WOOD.jpg', 'public/uploads/materials/topmix/TP6-3886_S_LIMED_SPRUCE_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(179, 'Topmix', 'Topmix', 'TP6-3887', 'SMOKE GREEN WOOD', 'S', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP6-3887_S_SMOKE_GREEN_WOOD.jpg', 'public/uploads/materials/topmix/TP6-3887_S_SMOKE_GREEN_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(180, 'Topmix', 'Topmix', 'TP6-3825', 'WHITE WOOD', 'SE', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP6-3825_SE_WHITE_WOOD.jpg', 'public/uploads/materials/topmix/TP6-3825_SE_WHITE_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(181, 'Topmix', 'Topmix', 'TP6-3826', 'BLACK WOOD', 'SE', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP6-3826_SE_BLACK_WOOD.jpg', 'public/uploads/materials/topmix/TP6-3826_SE_BLACK_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(182, 'Topmix', 'Topmix', 'TP6-3861', 'PURE WHITE WOOD', 'S', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP6-3861_S_PURE_WHITE_WOOD.jpg', 'public/uploads/materials/topmix/TP6-3861_S_PURE_WHITE_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(183, 'Topmix', 'Topmix', 'TP6-3860', 'JET BLACK WOOD', 'S', 'Woodgrain', 'WOODY PATTERN SERIES', 'TP6-3860_S_JET_BLACK_WOOD.jpg', 'public/uploads/materials/topmix/TP6-3860_S_JET_BLACK_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(184, 'Topmix', 'Topmix', 'TW8-3900', 'HW BJELOVAR VENEER', '', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW8-3900_HW_BJELOVAR_VENEER.jpg', 'public/uploads/materials/topmix/TW8-3900_HW_BJELOVAR_VENEER.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(185, 'Topmix', 'Topmix', 'TW8-3799', 'HW JENA VENEER', '', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW8-3799_HW_JENA_VENEER.jpg', 'public/uploads/materials/topmix/TW8-3799_HW_JENA_VENEER.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(186, 'Topmix', 'Topmix', 'TW8-3901', 'HW ROVINJ VENEER', '', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW8-3901_HW_ROVINJ_VENEER.jpg', 'public/uploads/materials/topmix/TW8-3901_HW_ROVINJ_VENEER.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(187, 'Topmix', 'Topmix', 'TW8-3798', 'NEUSS OAK', 'VM', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW8-3798_VM_NEUSS_OAK.jpg', 'public/uploads/materials/topmix/TW8-3798_VM_NEUSS_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(188, 'Topmix', 'Topmix', 'TW8-3796', 'KOBLENZ OAK', 'VM', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW8-3796_VM_KOBLENZ_OAK.jpg', 'public/uploads/materials/topmix/TW8-3796_VM_KOBLENZ_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(189, 'Topmix', 'Topmix', 'TW8-3797', 'TRIER OAK', 'VM', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW8-3797_VM_TRIER_OAK.jpg', 'public/uploads/materials/topmix/TW8-3797_VM_TRIER_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(190, 'Topmix', 'Topmix', 'TW7-3501', 'BEIGE NOGAL WOOD', 'VM', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW7-3501_VM_BEIGE_NOGAL_WOOD.jpg', 'public/uploads/materials/topmix/TW7-3501_VM_BEIGE_NOGAL_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(191, 'Topmix', 'Topmix', 'TW7-3503', 'MOCCA NOGAL WOOD', 'VM', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW7-3503_VM_MOCCA_NOGAL_WOOD.jpg', 'public/uploads/materials/topmix/TW7-3503_VM_MOCCA_NOGAL_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(192, 'Topmix', 'Topmix', 'TW7-3502', 'DARK NOGAL WOOD', 'VM', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW7-3502_VM_DARK_NOGAL_WOOD.jpg', 'public/uploads/materials/topmix/TW7-3502_VM_DARK_NOGAL_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(193, 'Topmix', 'Topmix', 'TW4-2310', 'MONEIN OAK', 'G', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW4-2310_G_MONEIN_OAK.jpg', 'public/uploads/materials/topmix/TW4-2310_G_MONEIN_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(194, 'Topmix', 'Topmix', 'TW4-2189', 'PEARL ASH', 'G', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW4-2189_G_PEARL_ASH.jpg', 'public/uploads/materials/topmix/TW4-2189_G_PEARL_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(195, 'Topmix', 'Topmix', 'TW4-2306', 'COCO WALNUT', 'G', 'Woodgrain', 'HIGH GLOSS SERIES', 'TW4-2306_G_COCO_WALNUT.jpg', 'public/uploads/materials/topmix/TW4-2306_G_COCO_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(196, 'Topmix', 'Topmix', 'TW2-1189', 'PEARL ASH', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1189_PEARL_ASH.jpg', 'public/uploads/materials/topmix/TW2-1189_PEARL_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(197, 'Topmix', 'Topmix', 'TW1-1101', 'PEARL PINE', '', 'Woodgrain', 'TROPICAL SERIES', 'TW1-1101_PEARL_PINE.jpg', 'public/uploads/materials/topmix/TW1-1101_PEARL_PINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(198, 'Topmix', 'Topmix', 'TW2-1363', 'COTTON CHERRY', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1363_COTTON_CHERRY.jpg', 'public/uploads/materials/topmix/TW2-1363_COTTON_CHERRY.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(199, 'Topmix', 'Topmix', 'TW2-1316', 'OGDEN ELM', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1316_OGDEN_ELM.jpg', 'public/uploads/materials/topmix/TW2-1316_OGDEN_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(200, 'Topmix', 'Topmix', 'TW2-1328', 'MARYLAND ELM', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1328_MARYLAND_ELM.jpg', 'public/uploads/materials/topmix/TW2-1328_MARYLAND_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(201, 'Topmix', 'Topmix', 'TW2-1312', 'SOMERSET OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1312_SOMERSET_OAK.jpg', 'public/uploads/materials/topmix/TW2-1312_SOMERSET_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(202, 'Topmix', 'Topmix', 'TW2-1366', 'AGRIGENTO EUCALYPTUS', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1366_AGRIGENTO_EUCALYPTUS.jpg', 'public/uploads/materials/topmix/TW2-1366_AGRIGENTO_EUCALYPTUS.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(203, 'Topmix', 'Topmix', 'TW2-1357', 'PAIMIO WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1357_PAIMIO_WALNUT.jpg', 'public/uploads/materials/topmix/TW2-1357_PAIMIO_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(204, 'Topmix', 'Topmix', 'TW2-1336', 'EUROPE OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1336_EUROPE_OAK.jpg', 'public/uploads/materials/topmix/TW2-1336_EUROPE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(205, 'Topmix', 'Topmix', 'TW2-1526', 'BEIGE ELM', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1526_BEIGE_ELM.jpg', 'public/uploads/materials/topmix/TW2-1526_BEIGE_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(206, 'Topmix', 'Topmix', 'TW2-1187', 'BEIGE WOOD', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1187_BEIGE_WOOD.jpg', 'public/uploads/materials/topmix/TW2-1187_BEIGE_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(207, 'Topmix', 'Topmix', 'TW2-1351', 'TEXAS ELM', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1351_TEXAS_ELM.jpg', 'public/uploads/materials/topmix/TW2-1351_TEXAS_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(208, 'Topmix', 'Topmix', 'TW2-1313', 'SUGAR MAPLE', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1313_SUGAR_MAPLE.jpg', 'public/uploads/materials/topmix/TW2-1313_SUGAR_MAPLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(209, 'Topmix', 'Topmix', 'TW2-1371', 'MARBELLA OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1371_MARBELLA_OAK.jpg', 'public/uploads/materials/topmix/TW2-1371_MARBELLA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(210, 'Topmix', 'Topmix', 'TW2-1302', 'AMAZON WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1302_AMAZON_WALNUT.jpg', 'public/uploads/materials/topmix/TW2-1302_AMAZON_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(211, 'Topmix', 'Topmix', 'TW2-1353', 'ORIVESI PINE', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1353_ORIVESI_PINE.jpg', 'public/uploads/materials/topmix/TW2-1353_ORIVESI_PINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(212, 'Topmix', 'Topmix', 'TW1-1183', 'INTAL BEECH', '', 'Woodgrain', 'TROPICAL SERIES', 'TW1-1183_INTAL_BEECH.jpg', 'public/uploads/materials/topmix/TW1-1183_INTAL_BEECH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03');
INSERT INTO `topmix` (`id`, `supplier`, `brand`, `product_code`, `product_name`, `finish_code`, `category`, `series`, `image_filename`, `image_path`, `is_active`, `created_at`, `updated_at`) VALUES
(213, 'Topmix', 'Topmix', 'TW2-1362', 'TOMSK CHERRY', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1362_TOMSK_CHERRY.jpg', 'public/uploads/materials/topmix/TW2-1362_TOMSK_CHERRY.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(214, 'Topmix', 'Topmix', 'TW1-1188', 'BEIGE MAPLE', '', 'Woodgrain', 'TROPICAL SERIES', 'TW1-1188_BEIGE_MAPLE.jpg', 'public/uploads/materials/topmix/TW1-1188_BEIGE_MAPLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(215, 'Topmix', 'Topmix', 'TW2-1368', 'CARLISLE OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1368_CARLISLE_OAK.jpg', 'public/uploads/materials/topmix/TW2-1368_CARLISLE_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(216, 'Topmix', 'Topmix', 'TW2-1331', 'ALABAMA TEAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1331_ALABAMA_TEAK.jpg', 'public/uploads/materials/topmix/TW2-1331_ALABAMA_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(217, 'Topmix', 'Topmix', 'TW2-1367', 'KHIMKI OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1367_KHIMKI_OAK.jpg', 'public/uploads/materials/topmix/TW2-1367_KHIMKI_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(218, 'Topmix', 'Topmix', 'TW2-1350', 'MINNESOTA OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1350_MINNESOTA_OAK.jpg', 'public/uploads/materials/topmix/TW2-1350_MINNESOTA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(219, 'Topmix', 'Topmix', 'TW2-1361', 'KIROV WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1361_KIROV_WALNUT.jpg', 'public/uploads/materials/topmix/TW2-1361_KIROV_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(220, 'Topmix', 'Topmix', 'TW2-1369', 'BERGEN OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1369_BERGEN_OAK.jpg', 'public/uploads/materials/topmix/TW2-1369_BERGEN_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(221, 'Topmix', 'Topmix', 'TW2-1377', 'PLITVICE EUCALYPTUS', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1377_PLITVICE_EUCALYPTUS.jpg', 'public/uploads/materials/topmix/TW2-1377_PLITVICE_EUCALYPTUS.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(222, 'Topmix', 'Topmix', 'TW2-1372', 'BURGES ASH', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1372_BURGES_ASH.jpg', 'public/uploads/materials/topmix/TW2-1372_BURGES_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(223, 'Topmix', 'Topmix', 'TW2-1375', 'GEVENA ELM', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1375_GEVENA_ELM.jpg', 'public/uploads/materials/topmix/TW2-1375_GEVENA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(224, 'Topmix', 'Topmix', 'TW2-1365', 'ORSK VENEER', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1365_ORSK_VENEER.jpg', 'public/uploads/materials/topmix/TW2-1365_ORSK_VENEER.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(225, 'Topmix', 'Topmix', 'TW2-1326', 'VIRGINIA WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1326_VIRGINIA_WALNUT.jpg', 'public/uploads/materials/topmix/TW2-1326_VIRGINIA_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(226, 'Topmix', 'Topmix', 'TW2-1333', 'OKLAHOMA ELM', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1333_OKLAHOMA_ELM.jpg', 'public/uploads/materials/topmix/TW2-1333_OKLAHOMA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(227, 'Topmix', 'Topmix', 'TW2-1358', 'KOUVOLA OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1358_KOUVOLA_OAK.jpg', 'public/uploads/materials/topmix/TW2-1358_KOUVOLA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(228, 'Topmix', 'Topmix', 'TW2-1373', 'TURIN WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1373_TURIN_WALNUT.jpg', 'public/uploads/materials/topmix/TW2-1373_TURIN_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(229, 'Topmix', 'Topmix', 'TW2-1323', 'ALASKA OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1323_ALASKA_OAK.jpg', 'public/uploads/materials/topmix/TW2-1323_ALASKA_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(230, 'Topmix', 'Topmix', 'TW2-1199', 'BAMBOO WOOD', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1199_BAMBOO_WOOD.jpg', 'public/uploads/materials/topmix/TW2-1199_BAMBOO_WOOD.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(231, 'Topmix', 'Topmix', 'TW2-1360', 'FORLI WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1360_FORLI_WALNUT.jpg', 'public/uploads/materials/topmix/TW2-1360_FORLI_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(232, 'Topmix', 'Topmix', 'TW2-1337', 'COLORADO TEAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1337_COLORADO_TEAK.jpg', 'public/uploads/materials/topmix/TW2-1337_COLORADO_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(233, 'Topmix', 'Topmix', 'TW2-1359', 'GROSSETO OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1359_GROSSETO_OAK.jpg', 'public/uploads/materials/topmix/TW2-1359_GROSSETO_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(234, 'Topmix', 'Topmix', 'TW2-1376', 'TALLINN ASH', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1376_TALLINN_ASH.jpg', 'public/uploads/materials/topmix/TW2-1376_TALLINN_ASH.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(235, 'Topmix', 'Topmix', 'TW2-1335', 'KANSAS', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1335_KANSAS.jpg', 'public/uploads/materials/topmix/TW2-1335_KANSAS.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(236, 'Topmix', 'Topmix', 'TW2-1303', 'JARRAH LEGNO', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1303_JARRAH_LEGNO.jpg', 'public/uploads/materials/topmix/TW2-1303_JARRAH_LEGNO.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(237, 'Topmix', 'Topmix', 'TW1-1120', 'STRAIGHT WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW1-1120_STRAIGHT_WALNUT.jpg', 'public/uploads/materials/topmix/TW1-1120_STRAIGHT_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(238, 'Topmix', 'Topmix', 'TW2-1317', 'NEVADA ELM', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1317_NEVADA_ELM.jpg', 'public/uploads/materials/topmix/TW2-1317_NEVADA_ELM.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(239, 'Topmix', 'Topmix', 'TW2-1573', 'WASHINGTON WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1573_WASHINGTON_WALNUT.jpg', 'public/uploads/materials/topmix/TW2-1573_WASHINGTON_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(240, 'Topmix', 'Topmix', 'TW2-1370', 'CATANIA WALNUT', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1370_CATANIA_WALNUT.jpg', 'public/uploads/materials/topmix/TW2-1370_CATANIA_WALNUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(241, 'Topmix', 'Topmix', 'TW2-1310', 'PRUNUS CHERRY', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1310_PRUNUS_CHERRY.jpg', 'public/uploads/materials/topmix/TW2-1310_PRUNUS_CHERRY.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(242, 'Topmix', 'Topmix', 'TW2-1327', 'ATLANTIS OAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1327_ATLANTIS_OAK.jpg', 'public/uploads/materials/topmix/TW2-1327_ATLANTIS_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(243, 'Topmix', 'Topmix', 'TW2-1307', 'TECTONA TEAK', '', 'Woodgrain', 'TROPICAL SERIES', 'TW2-1307_TECTONA_TEAK.jpg', 'public/uploads/materials/topmix/TW2-1307_TECTONA_TEAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(244, 'Topmix', 'Topmix', 'TP7-53015', 'IMOLA MARBLE', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP7-53015_G_IMOLA_MARBLE.jpg', 'public/uploads/materials/topmix/TP7-53015_G_IMOLA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(245, 'Topmix', 'Topmix', 'TP7-53019', 'IMOLA MARBLE', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP7-53019_M_IMOLA_MARBLE.jpg', 'public/uploads/materials/topmix/TP7-53019_M_IMOLA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(246, 'Topmix', 'Topmix', 'TP7-53055', 'GOLDEN ECLIPSE', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP7-53055_G_GOLDEN_ECLIPSE.jpg', 'public/uploads/materials/topmix/TP7-53055_G_GOLDEN_ECLIPSE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(247, 'Topmix', 'Topmix', 'TP7-53056', 'GOLDEN ECLIPSE', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP7-53056_M_GOLDEN_ECLIPSE.jpg', 'public/uploads/materials/topmix/TP7-53056_M_GOLDEN_ECLIPSE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(248, 'Topmix', 'Topmix', 'TP7-53335', 'CRESTOLA MARBLE', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP7-53335_G_CRESTOLA_MARBLE.jpg', 'public/uploads/materials/topmix/TP7-53335_G_CRESTOLA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(249, 'Topmix', 'Topmix', 'TP7-53351', 'CRESTOLA MARBLE', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP7-53351_M_CRESTOLA_MARBLE.jpg', 'public/uploads/materials/topmix/TP7-53351_M_CRESTOLA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(250, 'Topmix', 'Topmix', 'TP7-53013', 'MELITTA MARBLE', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP7-53013_G_MELITTA_MARBLE.jpg', 'public/uploads/materials/topmix/TP7-53013_G_MELITTA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(251, 'Topmix', 'Topmix', 'TP7-53020', 'MELITTA MARBLE', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP7-53020_M_MELITTA_MARBLE.jpg', 'public/uploads/materials/topmix/TP7-53020_M_MELITTA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(252, 'Topmix', 'Topmix', 'TP7-53031', 'ETHEREAL CARRARA', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP7-53031_G_ETHEREAL_CARRARA.jpg', 'public/uploads/materials/topmix/TP7-53031_G_ETHEREAL_CARRARA.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(253, 'Topmix', 'Topmix', 'TP7-53038', 'ETHEREAL CARRARA', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP7-53038_M_ETHEREAL_CARRARA.jpg', 'public/uploads/materials/topmix/TP7-53038_M_ETHEREAL_CARRARA.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(254, 'Topmix', 'Topmix', 'TP7-53032', 'ELYSIAN TRAVERTINE', 'ST', 'Woodgrain', 'INDUSTRIAL SERIES', 'TP7-53032_ST_ELYSIAN_TRAVERTINE.jpg', 'public/uploads/materials/topmix/TP7-53032_ST_ELYSIAN_TRAVERTINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(255, 'Topmix', 'Topmix', 'TP7-53029', 'GLACIAL MICROCEMENT', 'SE', 'Woodgrain', 'INDUSTRIAL SERIES', 'TP7-53029_SE_GLACIAL_MICROCEMENT.jpg', 'public/uploads/materials/topmix/TP7-53029_SE_GLACIAL_MICROCEMENT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(256, 'Topmix', 'Topmix', 'TP7-53030', 'CREMA MICROCEMENT', 'SE', 'Woodgrain', 'INDUSTRIAL SERIES', 'TP7-53030_SE_CREMA_MICROCEMENT.jpg', 'public/uploads/materials/topmix/TP7-53030_SE_CREMA_MICROCEMENT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(257, 'Topmix', 'Topmix', 'TP7-53028', 'ALABASTER MICROCEMENT', 'SE', 'Woodgrain', 'INDUSTRIAL SERIES', 'TP7-53028_SE_ALABASTER_MICROCEMENT.jpg', 'public/uploads/materials/topmix/TP7-53028_SE_ALABASTER_MICROCEMENT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(258, 'Topmix', 'Topmix', 'TB5-53021', 'NOCE TRAVERTINE', 'M', 'Woodgrain', 'INDUSTRIAL SERIES', 'TB5-53021_M_NOCE_TRAVERTINE.jpg', 'public/uploads/materials/topmix/TB5-53021_M_NOCE_TRAVERTINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(259, 'Topmix', 'Topmix', 'TP7-53016', 'EGNET CEMENT', 'SE', 'Woodgrain', 'INDUSTRIAL SERIES', 'TP7-53016_SE_EGNET_CEMENT.jpg', 'public/uploads/materials/topmix/TP7-53016_SE_EGNET_CEMENT.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(260, 'Topmix', 'Topmix', 'TBS-53010', 'DE FERRARA TOP', 'M', 'Woodgrain', 'BOOKMATCH SERIES', 'TBS-53010_M_DE_FERRARA_mee_TOP.jpg', 'public/uploads/materials/topmix/TBS-53010_M_DE_FERRARA_mee_TOP.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(261, 'Topmix', 'Topmix', 'TB5-53012', 'DE FERRARA MIX', 'M', 'Woodgrain', 'BOOKMATCH SERIES', 'TB5-53012_M_DE_FERRARA_OR_VI.jpg', 'public/uploads/materials/topmix/TB5-53012_M_DE_FERRARA_OR_VI.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(262, 'Topmix', 'Topmix', 'TP6-3359', 'OBSIDIAN MARBLE', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP6-3359_G_OBSIDIAN_MARBLE.jpg', 'public/uploads/materials/topmix/TP6-3359_G_OBSIDIAN_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(263, 'Topmix', 'Topmix', 'TP6-3356', 'MIDNIGHT MARBLE', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP6-3356_G_MIDNIGHT_MARBLE.jpg', 'public/uploads/materials/topmix/TP6-3356_G_MIDNIGHT_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(264, 'Topmix', 'Topmix', 'TP6-3319', 'MAKRANA MARBLE', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP6-3319_G_MAKRANA_MARBLE.jpg', 'public/uploads/materials/topmix/TP6-3319_G_MAKRANA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(265, 'Topmix', 'Topmix', 'TP6-3363', 'OBSIDIAN MARBLE', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP6-3363_M_OBSIDIAN_MARBLE.jpg', 'public/uploads/materials/topmix/TP6-3363_M_OBSIDIAN_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(266, 'Topmix', 'Topmix', 'TP6-3361', 'MIDNIGHT MARBLE', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP6-3361_M_MIDNIGHT_MARBLE.jpg', 'public/uploads/materials/topmix/TP6-3361_M_MIDNIGHT_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(267, 'Topmix', 'Topmix', 'TP6-3330', 'MAKRANA MARBLE', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP6-3330_M_MAKRANA_MARBLE.jpg', 'public/uploads/materials/topmix/TP6-3330_M_MAKRANA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(268, 'Topmix', 'Topmix', 'TP6-3323', 'LIGHT GRIGIO', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP6-3323_G_LIGHT_GRIGIO.jpg', 'public/uploads/materials/topmix/TP6-3323_G_LIGHT_GRIGIO.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(269, 'Topmix', 'Topmix', 'TP6-3332', 'PABLO PICASSO', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP6-3332_G_PABLO_PICASSO.jpg', 'public/uploads/materials/topmix/TP6-3332_G_PABLO_PICASSO.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(270, 'Topmix', 'Topmix', 'TP6-3335', 'CRESTOLA MARBLE', 'G', 'Woodgrain', 'MARBLE SERIES', 'TP6-3335_G_CRESTOLA_MARBLE.jpg', 'public/uploads/materials/topmix/TP6-3335_G_CRESTOLA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(271, 'Topmix', 'Topmix', 'TP6-3351', 'CRESTOLA MARBLE', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP6-3351_M_CRESTOLA_MARBLE.jpg', 'public/uploads/materials/topmix/TP6-3351_M_CRESTOLA_MARBLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(272, 'Topmix', 'Topmix', 'TP6-3338', 'PABLO PICASSO', 'M', 'Woodgrain', 'MARBLE SERIES', 'TP6-3338_M_PABLO_PICASSO.jpg', 'public/uploads/materials/topmix/TP6-3338_M_PABLO_PICASSO.jpg', 1, '2026-10-06 04:57:24', '2026-10-07 06:33:03'),
(273, 'Topmix', 'Topmix', 'TP46-3357', 'STARRY NIGHT', 'G', 'Patterns', 'MARBLE SERIES', 'TP46-3357_G_STARRY_NIGHT.jpg', 'public/uploads/materials/topmix/TP46-3357_G_STARRY_NIGHT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(274, 'Topmix', 'Topmix', 'TP6-3360', 'STARRY NIGHT', 'M', 'Patterns', 'MARBLE SERIES', 'TP6-3360_M_STARRY_NIGHT.jpg', 'public/uploads/materials/topmix/TP6-3360_M_STARRY_NIGHT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(275, 'Topmix', 'Topmix', 'TP6-3210', 'NORDIC CEMENT', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3210_VM_NORDIC_CEMENT.jpg', 'public/uploads/materials/topmix/TP6-3210_VM_NORDIC_CEMENT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(276, 'Topmix', 'Topmix', 'TP6-3211', 'ARCTIC CEMENT', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3211_VM_ARCTIC_CEMENT.jpg', 'public/uploads/materials/topmix/TP6-3211_VM_ARCTIC_CEMENT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(277, 'Topmix', 'Topmix', 'TP6-3892', 'TIESO', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3892_VM_TIESO.jpg', 'public/uploads/materials/topmix/TP6-3892_VM_TIESO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(278, 'Topmix', 'Topmix', 'TP6-3893', 'TIESA', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3893_VM_TIESA.jpg', 'public/uploads/materials/topmix/TP6-3893_VM_TIESA.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(279, 'Topmix', 'Topmix', 'TP6-3815', 'DARK STROMBOLI', 'SE', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3815_SE_DARK_STROMBOLI.jpg', 'public/uploads/materials/topmix/TP6-3815_SE_DARK_STROMBOLI.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(280, 'Topmix', 'Topmix', 'TP6-3891', 'MARFIL', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3891_VM_MARFIL.jpg', 'public/uploads/materials/topmix/TP6-3891_VM_MARFIL.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(281, 'Topmix', 'Topmix', 'TP6-3813', 'GREY STROMBOLI', 'SE', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3813_SE_GREY_STROMBOLI.jpg', 'public/uploads/materials/topmix/TP6-3813_SE_GREY_STROMBOLI.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(282, 'Topmix', 'Topmix', 'TP6-3819', 'VERONA CEMENT', 'M', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3819_M_VERONA_CEMENT.jpg', 'public/uploads/materials/topmix/TP6-3819_M_VERONA_CEMENT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(283, 'Topmix', 'Topmix', 'TP5-3816', 'GENOA LIMESTONE', 'ST', 'Patterns', 'INDUSTRIAL SERIES', 'TP5-3816_ST_GENOA_LIMESTONE.jpg', 'public/uploads/materials/topmix/TP5-3816_ST_GENOA_LIMESTONE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(284, 'Topmix', 'Topmix', 'TP6-3871', 'SCHIST', 'SE', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3871_SE_SCHIST.jpg', 'public/uploads/materials/topmix/TP6-3871_SE_SCHIST.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(285, 'Topmix', 'Topmix', 'TP6-3890', 'MEDVEDNICA', 'SE', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3890_SE_MEDVEDNICA.jpg', 'public/uploads/materials/topmix/TP6-3890_SE_MEDVEDNICA.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(286, 'Topmix', 'Topmix', 'TP6-3876', 'ROME SLATE', 'SE', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3876_SE_ROME_SLATE.jpg', 'public/uploads/materials/topmix/TP6-3876_SE_ROME_SLATE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(287, 'Topmix', 'Topmix', 'TP6-3818', 'PISA PILLARS', 'SE', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3818_SE_PISA_PILLARS.jpg', 'public/uploads/materials/topmix/TP6-3818_SE_PISA_PILLARS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(288, 'Topmix', 'Topmix', 'TP6-3839', 'CONASTOTA SLATE', 'SE', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3839_SE_CONASTOTA_SLATE.jpg', 'public/uploads/materials/topmix/TP6-3839_SE_CONASTOTA_SLATE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(289, 'Topmix', 'Topmix', 'TP6-3833', 'IDAHO', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3833_VM_IDAHO.jpg', 'public/uploads/materials/topmix/TP6-3833_VM_IDAHO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(290, 'Topmix', 'Topmix', 'TP6-3896', 'NAVY VECTOR', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3896_VM_NAVY_VECTOR.jpg', 'public/uploads/materials/topmix/TP6-3896_VM_NAVY_VECTOR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(291, 'Topmix', 'Topmix', 'TP6-3897', 'TURQUOISE VECTOR', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3897_VM_TURQUOISE_VECTOR.jpg', 'public/uploads/materials/topmix/TP6-3897_VM_TURQUOISE_VECTOR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(292, 'Topmix', 'Topmix', 'TP6-3895', 'SILVER VECTOR', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3895_VM_SILVER_VECTOR.jpg', 'public/uploads/materials/topmix/TP6-3895_VM_SILVER_VECTOR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(293, 'Topmix', 'Topmix', 'TP6-3873', 'UR GRAFFITI ART', '', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3873_UR_GRAFFITI_ART.jpg', 'public/uploads/materials/topmix/TP6-3873_UR_GRAFFITI_ART.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(294, 'Topmix', 'Topmix', 'TP6-3872', 'HEXAGON OAK', 'VM', 'Patterns', 'INDUSTRIAL SERIES', 'TP6-3872_VM_HEXAGON_OAK.jpg', 'public/uploads/materials/topmix/TP6-3872_VM_HEXAGON_OAK.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(295, 'Topmix', 'Topmix', 'TP6-3209', 'OFF WHITE CHAMBRAY', 'VM', 'Patterns', 'FABRIC SERIES', 'TP6-3209_VM_OFF_WHITE_CHAMBRAY.jpg', 'public/uploads/materials/topmix/TP6-3209_VM_OFF_WHITE_CHAMBRAY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(296, 'Topmix', 'Topmix', 'TP6-3208', 'SILVER DRIFT CHAMBRAY', 'VM', 'Patterns', 'FABRIC SERIES', 'TP6-3208_VM_SILVER_DRIFT_CHAMBRAY.jpg', 'public/uploads/materials/topmix/TP6-3208_VM_SILVER_DRIFT_CHAMBRAY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(297, 'Topmix', 'Topmix', 'TP6-3885', 'DARK LINE CLOTH', 'VM', 'Patterns', 'FABRIC SERIES', 'TP6-3885_VM_DARK_LINE_CLOTH.jpg', 'public/uploads/materials/topmix/TP6-3885_VM_DARK_LINE_CLOTH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(298, 'Topmix', 'Topmix', 'TP6-3205', 'LACE CANVAS', 'ST', 'Patterns', 'FABRIC SERIES', 'TP6-3205_ST_LACE_CANVAS.jpg', 'public/uploads/materials/topmix/TP6-3205_ST_LACE_CANVAS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(299, 'Topmix', 'Topmix', 'TP6-3207', 'LIGHT NUDE CANVAS', 'ST', 'Patterns', 'FABRIC SERIES', 'TP6-3207_ST_LIGHT_NUDE_CANVAS.jpg', 'public/uploads/materials/topmix/TP6-3207_ST_LIGHT_NUDE_CANVAS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(300, 'Topmix', 'Topmix', 'TP6-3206', 'STONE GREY CANVAS', 'ST', 'Patterns', 'FABRIC SERIES', 'TP6-3206_ST_STONE_GREY_CANVAS.jpg', 'public/uploads/materials/topmix/TP6-3206_ST_STONE_GREY_CANVAS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(301, 'Topmix', 'Topmix', 'TP6-3882', 'LINEN WOVEN', 'SD', 'Patterns', 'FABRIC SERIES', 'TP6-3882_SD_LINEN_WOVEN.jpg', 'public/uploads/materials/topmix/TP6-3882_SD_LINEN_WOVEN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(302, 'Topmix', 'Topmix', 'TP6-3883', 'CLOUD WOVEN', 'SD', 'Patterns', 'FABRIC SERIES', 'TP6-3883_SD_CLOUD_WOVEN.jpg', 'public/uploads/materials/topmix/TP6-3883_SD_CLOUD_WOVEN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(303, 'Topmix', 'Topmix', 'TP6-3881', 'MANATEE WOVEN', 'SD', 'Patterns', 'FABRIC SERIES', 'TP6-3881_SD_MANATEE_WOVEN.jpg', 'public/uploads/materials/topmix/TP6-3881_SD_MANATEE_WOVEN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(304, 'Topmix', 'Topmix', 'TP5-3803', 'CREAM CLOTH', 'ST', 'Patterns', 'FABRIC SERIES', 'TP5-3803_ST_CREAM_CLOTH.jpg', 'public/uploads/materials/topmix/TP5-3803_ST_CREAM_CLOTH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(305, 'Topmix', 'Topmix', 'TP5-3805', 'GRIGIO CLOTH', 'ST', 'Patterns', 'FABRIC SERIES', 'TP5-3805_ST_GRIGIO_CLOTH.jpg', 'public/uploads/materials/topmix/TP5-3805_ST_GRIGIO_CLOTH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(306, 'Topmix', 'Topmix', 'TP5-3806', 'NERO CLOTH', 'ST', 'Patterns', 'FABRIC SERIES', 'TP5-3806_ST_NERO_CLOTH.jpg', 'public/uploads/materials/topmix/TP5-3806_ST_NERO_CLOTH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(307, 'Topmix', 'Topmix', 'TP6-3898', 'ANTHRACITE ENGANO', 'VM', 'Patterns', 'FABRIC SERIES', 'TP6-3898_VM_ANTHRACITE_ENGANO.jpg', 'public/uploads/materials/topmix/TP6-3898_VM_ANTHRACITE_ENGANO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(308, 'Topmix', 'Topmix', 'TP6-3899', 'PRISTINE ENGANO', 'VM', 'Patterns', 'FABRIC SERIES', 'TP6-3899_VM_PRISTINE_ENGANO.jpg', 'public/uploads/materials/topmix/TP6-3899_VM_PRISTINE_ENGANO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(309, 'Topmix', 'Topmix', 'TP6-3201', 'ARCTIC CHEVRON', 'VM', 'Patterns', 'FABRIC SERIES', 'TP6-3201_VM_ARCTIC_CHEVRON.jpg', 'public/uploads/materials/topmix/TP6-3201_VM_ARCTIC_CHEVRON.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(310, 'Topmix', 'Topmix', 'TP6-3203', 'PHEASANT CHEVRON', 'VM', 'Patterns', 'FABRIC SERIES', 'TP6-3203_VM_PHEASANT_CHEVRON.jpg', 'public/uploads/materials/topmix/TP6-3203_VM_PHEASANT_CHEVRON.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(311, 'Topmix', 'Topmix', 'TP6-3202', 'TAUPE WEAVE', 'SD', 'Patterns', 'FABRIC SERIES', 'TP6-3202_SD_TAUPE_WEAVE.jpg', 'public/uploads/materials/topmix/TP6-3202_SD_TAUPE_WEAVE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(312, 'Topmix', 'Topmix', 'TP6-3200', 'OPAL WEAVE', 'SD', 'Patterns', 'FABRIC SERIES', 'TP6-3200_SD_OPAL_WEAVE.jpg', 'public/uploads/materials/topmix/TP6-3200_SD_OPAL_WEAVE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(313, 'Topmix', 'Topmix', 'TP6-8811', 'BRANDY COBBLER', 'CW', 'Patterns', 'LEATHER SERIES', 'TP6-8811_CW_BRANDY_COBBLER.jpg', 'public/uploads/materials/topmix/TP6-8811_CW_BRANDY_COBBLER.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(314, 'Topmix', 'Topmix', 'TP6-8812', 'AMERICAN DREAM', 'CW', 'Patterns', 'LEATHER SERIES', 'TP6-8812_CW_AMERICAN_DREAM.jpg', 'public/uploads/materials/topmix/TP6-8812_CW_AMERICAN_DREAM.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(315, 'Topmix', 'Topmix', 'TP6-8813', 'BLACK MARTINI', 'CW', 'Patterns', 'LEATHER SERIES', 'TP6-8813_CW_BLACK_MARTINI.jpg', 'public/uploads/materials/topmix/TP6-8813_CW_BLACK_MARTINI.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(316, 'Topmix', 'Topmix', 'TP3-8808', 'BLACK LEATHER', 'NL', 'Patterns', 'LEATHER SERIES', 'TP3-8808_NL_BLACK_LEATHER.jpg', 'public/uploads/materials/topmix/TP3-8808_NL_BLACK_LEATHER.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(317, 'Topmix', 'Topmix', 'TP3-8803', 'COCO LEATHER', 'NL', 'Patterns', 'LEATHER SERIES', 'TP3-8803_NL_COCO_LEATHER.jpg', 'public/uploads/materials/topmix/TP3-8803_NL_COCO_LEATHER.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(318, 'Topmix', 'Topmix', 'TP3-8802', 'BEIGE LEATHER', 'NL', 'Patterns', 'LEATHER SERIES', 'TP3-8802_NL_BEIGE_LEATHER.jpg', 'public/uploads/materials/topmix/TP3-8802_NL_BEIGE_LEATHER.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(319, 'Topmix', 'Topmix', 'TM8-7112', 'GLOBE', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM8-7112_GLOBE.jpg', 'public/uploads/materials/topmix/TM8-7112_GLOBE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(320, 'Topmix', 'Topmix', 'TM8-7110', 'GRAMMY', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM8-7110_GRAMMY.jpg', 'public/uploads/materials/topmix/TM8-7110_GRAMMY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(321, 'Topmix', 'Topmix', 'TM8-7108', 'OSCAR', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM8-7108_OSCAR.jpg', 'public/uploads/materials/topmix/TM8-7108_OSCAR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(322, 'Topmix', 'Topmix', 'TM8-7109', 'ORVAS', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM8-7109_ORVAS.jpg', 'public/uploads/materials/topmix/TM8-7109_ORVAS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(323, 'Topmix', 'Topmix', 'TM8-7113', 'GHANA', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM8-7113_GHANA.jpg', 'public/uploads/materials/topmix/TM8-7113_GHANA.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(324, 'Topmix', 'Topmix', 'TM8-7111', 'PHOENIX', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM8-7111_PHOENIX.jpg', 'public/uploads/materials/topmix/TM8-7111_PHOENIX.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(325, 'Topmix', 'Topmix', 'TM7-7117', 'SILVER ASH AEROBRUSH', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM7-7117_SILVER_ASH_AEROBRUSH.jpg', 'public/uploads/materials/topmix/TM7-7117_SILVER_ASH_AEROBRUSH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(326, 'Topmix', 'Topmix', 'TM7-7119', 'FOSSIL AEROBRUSH', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM7-7119_FOSSIL_AEROBRUSH.jpg', 'public/uploads/materials/topmix/TM7-7119_FOSSIL_AEROBRUSH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(327, 'Topmix', 'Topmix', 'TM7-7118', 'BLUE SLATE AEROBRUSH', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM7-7118_BLUE_SLATE_AEROBRUSH.jpg', 'public/uploads/materials/topmix/TM7-7118_BLUE_SLATE_AEROBRUSH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(328, 'Topmix', 'Topmix', 'TM7-7116', 'FOSSIL HAIRLINE', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM7-7116_FOSSIL_HAIRLINE.jpg', 'public/uploads/materials/topmix/TM7-7116_FOSSIL_HAIRLINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(329, 'Topmix', 'Topmix', 'TM7-7105', 'CAPPUCCINO HAIRLINE', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM7-7105_CAPPUCCINO_HAIRLINE.jpg', 'public/uploads/materials/topmix/TM7-7105_CAPPUCCINO_HAIRLINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(330, 'Topmix', 'Topmix', 'TM7-7103', 'SPRUCE HAIRLINE', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM7-7103_SPRUCE_HAIRLINE.jpg', 'public/uploads/materials/topmix/TM7-7103_SPRUCE_HAIRLINE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(331, 'Topmix', 'Topmix', 'TP5-3317', 'BRUSHED WHITE', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TP5-3317_BRUSHED_WHITE.jpg', 'public/uploads/materials/topmix/TP5-3317_BRUSHED_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(332, 'Topmix', 'Topmix', 'TM1-6302', 'ALUMINIUM SILVER', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM1-6302_ALUMINIUM_SILVER.jpg', 'public/uploads/materials/topmix/TM1-6302_ALUMINIUM_SILVER.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(333, 'Topmix', 'Topmix', 'TP5-3318', 'BRUSHED BLACK', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TP5-3318_BRUSHED_BLACK.jpg', 'public/uploads/materials/topmix/TP5-3318_BRUSHED_BLACK.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(334, 'Topmix', 'Topmix', 'TM9-8008', 'NOBEL', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM9-8008_NOBEL.jpg', 'public/uploads/materials/topmix/TM9-8008_NOBEL.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(335, 'Topmix', 'Topmix', 'TM9-8010', 'EDGAR', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM9-8010_EDGAR.jpg', 'public/uploads/materials/topmix/TM9-8010_EDGAR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(336, 'Topmix', 'Topmix', 'TM9-8009', 'HEISMAN', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM9-8009_HEISMAN.jpg', 'public/uploads/materials/topmix/TM9-8009_HEISMAN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(337, 'Topmix', 'Topmix', 'TM9-8005', 'PINNACLE', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM9-8005_PINNACLE.jpg', 'public/uploads/materials/topmix/TM9-8005_PINNACLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(338, 'Topmix', 'Topmix', 'TM9-8007', 'CESAR', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM9-8007_CESAR.jpg', 'public/uploads/materials/topmix/TM9-8007_CESAR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(339, 'Topmix', 'Topmix', 'TM9-8006', 'HUGO', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM9-8006_HUGO.jpg', 'public/uploads/materials/topmix/TM9-8006_HUGO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(340, 'Topmix', 'Topmix', 'TM3-6000', 'SILVER BRUSH', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM3-6000_SILVER_BRUSH.jpg', 'public/uploads/materials/topmix/TM3-6000_SILVER_BRUSH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(341, 'Topmix', 'Topmix', 'TM6-7102', 'BRUSHED BRONZE', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM6-7102_BRUSHED_BRONZE.jpg', 'public/uploads/materials/topmix/TM6-7102_BRUSHED_BRONZE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(342, 'Topmix', 'Topmix', 'TM6-7115', 'BRUSHED CHAMPAGNE', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM6-7115_BRUSHED_CHAMPAGNE.jpg', 'public/uploads/materials/topmix/TM6-7115_BRUSHED_CHAMPAGNE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(343, 'Topmix', 'Topmix', 'TM5-8000', 'SILVER MIRROR', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM5-8000_SILVER_MIRROR.jpg', 'public/uploads/materials/topmix/TM5-8000_SILVER_MIRROR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(344, 'Topmix', 'Topmix', 'TM5-8001', 'BLACK MIRROR', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM5-8001_BLACK_MIRROR.jpg', 'public/uploads/materials/topmix/TM5-8001_BLACK_MIRROR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(345, 'Topmix', 'Topmix', 'TM5-9000', 'GOLD MIRROR', '', 'Patterns', 'TIMELESS DELUXE SERIES', 'TM5-9000_GOLD_MIRROR.jpg', 'public/uploads/materials/topmix/TM5-9000_GOLD_MIRROR.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(346, 'Topmix', 'Topmix', 'TPX-0087', '', '', 'Patterns', 'TOPMIX PRIVILEDGE LAMINATE', 'TPX-0087.jpg', 'public/uploads/materials/topmix/TPX-0087.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(347, 'Topmix', 'Topmix', 'TPX-0088', '', '', 'Patterns', 'TOPMIX PRIVILEDGE LAMINATE', 'TPX-0088.jpg', 'public/uploads/materials/topmix/TPX-0088.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(348, 'Topmix', 'Topmix', 'TPX-0086', '', '', 'Patterns', 'TOPMIX PRIVILEDGE LAMINATE', 'TPX-0086.jpg', 'public/uploads/materials/topmix/TPX-0086.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(349, 'Topmix', 'Topmix', 'TPX-0091', '', '', 'Patterns', 'TOPMIX PRIVILEDGE LAMINATE', 'TPX-0091.jpg', 'public/uploads/materials/topmix/TPX-0091.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(350, 'Topmix', 'Topmix', 'TPX-0089', '', '', 'Patterns', 'TOPMIX PRIVILEDGE LAMINATE', 'TPX-0089.jpg', 'public/uploads/materials/topmix/TPX-0089.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(351, 'Topmix', 'Topmix', 'TPX-0090', '', '', 'Patterns', 'TOPMIX PRIVILEDGE LAMINATE', 'TPX-0090.jpg', 'public/uploads/materials/topmix/TPX-0090.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(352, 'Topmix', 'Topmix', 'TC1-6039', 'WHITE', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6039_WHITE.jpg', 'public/uploads/materials/topmix/TC1-6039_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(353, 'Topmix', 'Topmix', 'TC1-6051', 'PLATINUM', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6051_PLATINUM.jpg', 'public/uploads/materials/topmix/TC1-6051_PLATINUM.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(354, 'Topmix', 'Topmix', 'TC1-6030', 'PASTEL IVORY', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6030_PASTEL_IVORY.jpg', 'public/uploads/materials/topmix/TC1-6030_PASTEL_IVORY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(355, 'Topmix', 'Topmix', 'TC1-6033', 'GREY MIST', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6033_GREY_MIST.jpg', 'public/uploads/materials/topmix/TC1-6033_GREY_MIST.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(356, 'Topmix', 'Topmix', 'TC1-6038', 'SIMPLY TAUPE', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6038_SIMPLY_TAUPE.jpg', 'public/uploads/materials/topmix/TC1-6038_SIMPLY_TAUPE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(357, 'Topmix', 'Topmix', 'TC1-6035', 'DUSTED TRUFFLE', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6035_DUSTED_TRUFFLE.jpg', 'public/uploads/materials/topmix/TC1-6035_DUSTED_TRUFFLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(358, 'Topmix', 'Topmix', 'TC1-6031', 'FOG GREY', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6031_FOG_GREY.jpg', 'public/uploads/materials/topmix/TC1-6031_FOG_GREY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(359, 'Topmix', 'Topmix', 'TC1-6037', 'CHARCOAL', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6037_CHARCOAL.jpg', 'public/uploads/materials/topmix/TC1-6037_CHARCOAL.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(360, 'Topmix', 'Topmix', 'TC1-6050', 'MAROON', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6050_MAROON.jpg', 'public/uploads/materials/topmix/TC1-6050_MAROON.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(361, 'Topmix', 'Topmix', 'TC1-6032', 'FOREST TEAL ee', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6032_FOREST_TEAL_ee.jpg', 'public/uploads/materials/topmix/TC1-6032_FOREST_TEAL_ee.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(362, 'Topmix', 'Topmix', 'TC1-6036', 'OXFORD BLUE ee', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6036_OXFORD_BLUE_ee.jpg', 'public/uploads/materials/topmix/TC1-6036_OXFORD_BLUE_ee.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(363, 'Topmix', 'Topmix', 'TC1-6029', 'BLACK a', '', 'Patterns', 'CLEAN TOUCH SERIES', 'TC1-6029_BLACK_a.jpg', 'public/uploads/materials/topmix/TC1-6029_BLACK_a.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(364, 'Topmix', 'Topmix', 'TS10-51280', 'CLOUD WHITE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51280_VM_CLOUD_WHITE.jpg', 'public/uploads/materials/topmix/TS10-51280_VM_CLOUD_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(365, 'Topmix', 'Topmix', 'TS10-51210', 'PURE WHITE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51210_VM_PURE_WHITE.jpg', 'public/uploads/materials/topmix/TS10-51210_VM_PURE_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(366, 'Topmix', 'Topmix', 'TS10-51251', 'IVORY WHITE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51251_VM_IVORY_WHITE.jpg', 'public/uploads/materials/topmix/TS10-51251_VM_IVORY_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(367, 'Topmix', 'Topmix', 'TS10-51229', 'CHIFFON WHITE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51229_VM_CHIFFON_WHITE.jpg', 'public/uploads/materials/topmix/TS10-51229_VM_CHIFFON_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(368, 'Topmix', 'Topmix', 'TS10-51282', 'RETICENCE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51282_VM_RETICENCE.jpg', 'public/uploads/materials/topmix/TS10-51282_VM_RETICENCE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(369, 'Topmix', 'Topmix', 'TS10-51287', 'SOFT PEACH', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51287_VM_SOFT_PEACH.jpg', 'public/uploads/materials/topmix/TS10-51287_VM_SOFT_PEACH.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(370, 'Topmix', 'Topmix', 'TS10-51259', 'LIGHT BEIGE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51259_VM_LIGHT_BEIGE.jpg', 'public/uploads/materials/topmix/TS10-51259_VM_LIGHT_BEIGE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(371, 'Topmix', 'Topmix', 'TS10-51275', 'SEPIA', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51275_VM_SEPIA.jpg', 'public/uploads/materials/topmix/TS10-51275_VM_SEPIA.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(372, 'Topmix', 'Topmix', 'TS10-51266', 'RED', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51266_VM_RED.jpg', 'public/uploads/materials/topmix/TS10-51266_VM_RED.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(373, 'Topmix', 'Topmix', 'TS10-51230', 'SILVER STRAND', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51230_VM_SILVER_STRAND.jpg', 'public/uploads/materials/topmix/TS10-51230_VM_SILVER_STRAND.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(374, 'Topmix', 'Topmix', 'TS10-51231', 'CHELSEA GREY', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51231_VM_CHELSEA_GREY.jpg', 'public/uploads/materials/topmix/TS10-51231_VM_CHELSEA_GREY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(375, 'Topmix', 'Topmix', 'TS10-51290', 'OAT BROWN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51290_VM_OAT_BROWN.jpg', 'public/uploads/materials/topmix/TS10-51290_VM_OAT_BROWN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(376, 'Topmix', 'Topmix', 'TS10-51271', 'SVENSKA BLUE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51271_VM_SVENSKA_BLUE.jpg', 'public/uploads/materials/topmix/TS10-51271_VM_SVENSKA_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(377, 'Topmix', 'Topmix', 'TS10-51269', 'SMOKE GREEN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51269_VM_SMOKE_GREEN.jpg', 'public/uploads/materials/topmix/TS10-51269_VM_SMOKE_GREEN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(378, 'Topmix', 'Topmix', 'TS10-51261', 'SPHINX', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51261_VM_SPHINX.jpg', 'public/uploads/materials/topmix/TS10-51261_VM_SPHINX.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(379, 'Topmix', 'Topmix', 'TS10-51258', 'PINE NUT', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51258_VM_PINE_NUT.jpg', 'public/uploads/materials/topmix/TS10-51258_VM_PINE_NUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(380, 'Topmix', 'Topmix', 'TS10-51276', 'FUSCOUS', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51276_VM_FUSCOUS.jpg', 'public/uploads/materials/topmix/TS10-51276_VM_FUSCOUS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(381, 'Topmix', 'Topmix', 'TS10-51218', 'CHARCOAL', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51218_VM_CHARCOAL.jpg', 'public/uploads/materials/topmix/TS10-51218_VM_CHARCOAL.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(382, 'Topmix', 'Topmix', 'TS10-51238', 'FOREST GREEN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS10-51238_VM_FOREST_GREEN.jpg', 'public/uploads/materials/topmix/TS10-51238_VM_FOREST_GREEN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(383, 'Topmix', 'Topmix', 'TS10-50111', 'IVORY WHITE', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50111_FM_IVORY_WHITE.jpg', 'public/uploads/materials/topmix/TS10-50111_FM_IVORY_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(384, 'Topmix', 'Topmix', 'TS10-50106', 'CHIFFON WHITE', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50106_FM_CHIFFON_WHITE.jpg', 'public/uploads/materials/topmix/TS10-50106_FM_CHIFFON_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(385, 'Topmix', 'Topmix', 'TS10-50109', 'SILVER STRAND', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50109_FM_SILVER_STRAND.jpg', 'public/uploads/materials/topmix/TS10-50109_FM_SILVER_STRAND.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(386, 'Topmix', 'Topmix', 'TS10-50105', 'WARM GREY', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50105_FM_WARM_GREY.jpg', 'public/uploads/materials/topmix/TS10-50105_FM_WARM_GREY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(387, 'Topmix', 'Topmix', 'TS10-50113', 'FUSCOUS', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50113_FM_FUSCOUS.jpg', 'public/uploads/materials/topmix/TS10-50113_FM_FUSCOUS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(388, 'Topmix', 'Topmix', 'TS10-50108', 'LIGHT BEIGE', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50108_FM_LIGHT_BEIGE.jpg', 'public/uploads/materials/topmix/TS10-50108_FM_LIGHT_BEIGE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(389, 'Topmix', 'Topmix', 'TS10-50115', 'OAT BROWN', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50115_FM_OAT_BROWN.jpg', 'public/uploads/materials/topmix/TS10-50115_FM_OAT_BROWN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(390, 'Topmix', 'Topmix', 'TS10-50107', 'SAND BROWN', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50107_FM_SAND_BROWN.jpg', 'public/uploads/materials/topmix/TS10-50107_FM_SAND_BROWN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(391, 'Topmix', 'Topmix', 'TS10-50110', 'PINE NUT', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50110_FM_PINE_NUT.jpg', 'public/uploads/materials/topmix/TS10-50110_FM_PINE_NUT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(392, 'Topmix', 'Topmix', 'TS10-50112', 'CHELSEA GREY', 'FM', 'Patterns', 'DRY MATT SERIES', 'TS10-50112_FM_CHELSEA_GREY.jpg', 'public/uploads/materials/topmix/TS10-50112_FM_CHELSEA_GREY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(393, 'Topmix', 'Topmix', 'TG-5506', 'WHITE GALAXY', 'G', 'Patterns', 'GALAXY SERIES', 'page_045_01.jpg', 'public/uploads/materials/topmix/page_045_01.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(394, 'Topmix', 'Topmix', 'TG-5505', 'DOVE GALAXY', 'G', 'Patterns', 'GALAXY SERIES', 'page_045_02.jpg', 'public/uploads/materials/topmix/page_045_02.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(395, 'Topmix', 'Topmix', 'TG1-5520', 'GAINSBORO GREY GALAXY', 'G', 'Patterns', 'GALAXY SERIES', 'page_045_03.jpg', 'public/uploads/materials/topmix/page_045_03.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(396, 'Topmix', 'Topmix', 'TG1-5521', 'GREIGE GALAXY', 'G', 'Patterns', 'GALAXY SERIES', 'page_045_04.jpg', 'public/uploads/materials/topmix/page_045_04.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(397, 'Topmix', 'Topmix', 'TG1-5518', 'SILVER BEIGE GALAXY', 'G', 'Patterns', 'GALAXY SERIES', 'page_045_05.jpg', 'public/uploads/materials/topmix/page_045_05.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(398, 'Topmix', 'Topmix', 'TG1-5507', 'BEIGE GALAXY', 'G', 'Patterns', 'GALAXY SERIES', 'page_045_06.jpg', 'public/uploads/materials/topmix/page_045_06.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(399, 'Topmix', 'Topmix', 'TG1-5508', 'BLACK GALAXY', 'G', 'Patterns', 'GALAXY SERIES', 'page_045_07.jpg', 'public/uploads/materials/topmix/page_045_07.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(400, 'Topmix', 'Topmix', 'TG1-5517', 'DIM GREY GALAXY', 'G', 'Patterns', 'GALAXY SERIES', 'page_045_08.jpg', 'public/uploads/materials/topmix/page_045_08.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(401, 'Topmix', 'Topmix', 'TG1-5519 G', 'MARINE NAVY GALAXY', '', 'Patterns', 'GALAXY SERIES', 'page_045_09.jpg', 'public/uploads/materials/topmix/page_045_09.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(402, 'Topmix', 'Topmix', 'TS7-6023', 'T SNOW WHITE rs', '', 'Patterns', 'SOLID CORE SERIES', 'TS7-6023_T_SNOW_WHITE_rs.jpg', 'public/uploads/materials/topmix/TS7-6023_T_SNOW_WHITE_rs.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(403, 'Topmix', 'Topmix', 'TS7-6025', 'T DOVE', '', 'Patterns', 'SOLID CORE SERIES', 'TS7-6025_T_DOVE.jpg', 'public/uploads/materials/topmix/TS7-6025_T_DOVE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(404, 'Topmix', 'Topmix', 'TS7-6022', 'T CREAMY So', '', 'Patterns', 'SOLID CORE SERIES', 'TS7-6022_T_CREAMY_So.jpg', 'public/uploads/materials/topmix/TS7-6022_T_CREAMY_So.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(405, 'Topmix', 'Topmix', 'TS7-6027', 'SNOW WHITE', 'G', 'Patterns', 'SOLID CORE SERIES', 'TS7-6027_G_SNOW_WHITE.jpg', 'public/uploads/materials/topmix/TS7-6027_G_SNOW_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(406, 'Topmix', 'Topmix', 'TS7-6028', 'DOVE', 'G', 'Patterns', 'SOLID CORE SERIES', 'TS7-6028_G_DOVE.jpg', 'public/uploads/materials/topmix/TS7-6028_G_DOVE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(407, 'Topmix', 'Topmix', 'TS7-6026', 'CREAMY', 'G', 'Patterns', 'SOLID CORE SERIES', 'TS7-6026_G_CREAMY.jpg', 'public/uploads/materials/topmix/TS7-6026_G_CREAMY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(408, 'Topmix', 'Topmix', 'TS8-1280', 'CLOUD WHITE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1280_VM_CLOUD_WHITE_a.jpg', 'public/uploads/materials/topmix/TS8-1280_VM_CLOUD_WHITE_a.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(409, 'Topmix', 'Topmix', 'TS8-1210', 'PURE WHITE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1210_VM_PURE_WHITE_e.jpg', 'public/uploads/materials/topmix/TS8-1210_VM_PURE_WHITE_e.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(410, 'Topmix', 'Topmix', 'TS8-1251', 'IVORY WHITE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1251_VM_IVORY_WHITE_eO.jpg', 'public/uploads/materials/topmix/TS8-1251_VM_IVORY_WHITE_eO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(411, 'Topmix', 'Topmix', 'TS8-1285', 'SEASHELL', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1285_VM_SEASHELL_NS.jpg', 'public/uploads/materials/topmix/TS8-1285_VM_SEASHELL_NS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(412, 'Topmix', 'Topmix', 'TS8-1289', 'OLD LACE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1289_VM_OLD_LACE_TT.jpg', 'public/uploads/materials/topmix/TS8-1289_VM_OLD_LACE_TT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(413, 'Topmix', 'Topmix', 'TS8-1229', 'CHIFFON WHITE', 'VM', 'Patterns', 'DRY MATT SERIES', 'page_047_06.jpg', 'public/uploads/materials/topmix/page_047_06.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(414, 'Topmix', 'Topmix', 'TS8-1259', 'LIGHT BEIGE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1259_VM_LIGHT_BEIGE_oOo.jpg', 'public/uploads/materials/topmix/TS8-1259_VM_LIGHT_BEIGE_oOo.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(415, 'Topmix', 'Topmix', 'TS8-1282', 'RETICENCE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1282_VM_RETICENCE_BT.jpg', 'public/uploads/materials/topmix/TS8-1282_VM_RETICENCE_BT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(416, 'Topmix', 'Topmix', 'TS8-1287', 'SOFT PEACH', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1287_VM_SOFT_PEACH_TT.jpg', 'public/uploads/materials/topmix/TS8-1287_VM_SOFT_PEACH_TT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(417, 'Topmix', 'Topmix', 'TS8-1236', 'SAND BROWN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1236_VM_SAND_BROWN_eaw.jpg', 'public/uploads/materials/topmix/TS8-1236_VM_SAND_BROWN_eaw.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(418, 'Topmix', 'Topmix', 'TS8-1231', 'CHELSEA GREY', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1231_VM_CHELSEA_GREY_nn.jpg', 'public/uploads/materials/topmix/TS8-1231_VM_CHELSEA_GREY_nn.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(419, 'Topmix', 'Topmix', 'TS8-1290', 'OAT BROWN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1290_VM_OAT_BROWN_5.jpg', 'public/uploads/materials/topmix/TS8-1290_VM_OAT_BROWN_5.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(420, 'Topmix', 'Topmix', 'TS8-1228', 'SABLE BROWN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1228_VM_SABLE_BROWN_nN.jpg', 'public/uploads/materials/topmix/TS8-1228_VM_SABLE_BROWN_nN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(421, 'Topmix', 'Topmix', 'TS8-1263', 'PUMICE BROWN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1263_VM_PUMICE_BROWN_Seau_wm.jpg', 'public/uploads/materials/topmix/TS8-1263_VM_PUMICE_BROWN_Seau_wm.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(422, 'Topmix', 'Topmix', 'TS8-1258', 'PINE NUT', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1258_VM_PINE_NUT_OO.jpg', 'public/uploads/materials/topmix/TS8-1258_VM_PINE_NUT_OO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(423, 'Topmix', 'Topmix', 'TS8-1257', 'LIGHT GREY', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1257_VM_LIGHT_GREY_OO.jpg', 'public/uploads/materials/topmix/TS8-1257_VM_LIGHT_GREY_OO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(424, 'Topmix', 'Topmix', 'TS8-1278', 'SHADY WILLOW', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1278_VM_SHADY_WILLOW_oOo.jpg', 'public/uploads/materials/topmix/TS8-1278_VM_SHADY_WILLOW_oOo.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(425, 'Topmix', 'Topmix', 'TS8-1230', 'SILVER STRAND', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1230_VM_SILVER_STRAND_E_Ee.jpg', 'public/uploads/materials/topmix/TS8-1230_VM_SILVER_STRAND_E_Ee.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(426, 'Topmix', 'Topmix', 'TS8-1276', 'FUSCOUS', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1276_VM_FUSCOUS_SaQGw.jpg', 'public/uploads/materials/topmix/TS8-1276_VM_FUSCOUS_SaQGw.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(427, 'Topmix', 'Topmix', 'TS8-1218', 'CHARCOAL', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1218_VM_CHARCOAL_eaw.jpg', 'public/uploads/materials/topmix/TS8-1218_VM_CHARCOAL_eaw.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33');
INSERT INTO `topmix` (`id`, `supplier`, `brand`, `product_code`, `product_name`, `finish_code`, `category`, `series`, `image_filename`, `image_path`, `is_active`, `created_at`, `updated_at`) VALUES
(428, 'Topmix', 'Topmix', 'TS8-1271', 'SVENSKA BLUE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1271_VM_SVENSKA_BLUE.jpg', 'public/uploads/materials/topmix/TS8-1271_VM_SVENSKA_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(429, 'Topmix', 'Topmix', 'TS8-1233', 'WARM GREY', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1233_VM_WARM_GREY.jpg', 'public/uploads/materials/topmix/TS8-1233_VM_WARM_GREY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(430, 'Topmix', 'Topmix', 'TS8-1267', 'WINTER SKY', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1267_VM_WINTER_SKY.jpg', 'public/uploads/materials/topmix/TS8-1267_VM_WINTER_SKY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(431, 'Topmix', 'Topmix', 'TS8-1265', 'STERLING', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1265_VM_STERLING.jpg', 'public/uploads/materials/topmix/TS8-1265_VM_STERLING.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(432, 'Topmix', 'Topmix', 'TS8-1261', 'SPHINX', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1261_VM_SPHINX.jpg', 'public/uploads/materials/topmix/TS8-1261_VM_SPHINX.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(433, 'Topmix', 'Topmix', 'TS8-1266', 'RED', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1266_VM_RED_.ea_um.jpg', 'public/uploads/materials/topmix/TS8-1266_VM_RED_.ea_um.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(434, 'Topmix', 'Topmix', 'TS8-1288', 'VINE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1288_VM_VINE_CT.jpg', 'public/uploads/materials/topmix/TS8-1288_VM_VINE_CT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(435, 'Topmix', 'Topmix', 'TS8-1262', 'RED DAMASK', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1262_VM_RED_DAMASK.jpg', 'public/uploads/materials/topmix/TS8-1262_VM_RED_DAMASK.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(436, 'Topmix', 'Topmix', 'TS8-1260', 'CORAL', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1260_VM_CORAL.jpg', 'public/uploads/materials/topmix/TS8-1260_VM_CORAL.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(437, 'Topmix', 'Topmix', 'TS8-1255', 'FLAMINGO', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1255_VM_FLAMINGO_nn.jpg', 'public/uploads/materials/topmix/TS8-1255_VM_FLAMINGO_nn.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(438, 'Topmix', 'Topmix', 'TS8-1270', 'TAWNY', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1270_VM_TAWNY_S.ea_um.jpg', 'public/uploads/materials/topmix/TS8-1270_VM_TAWNY_S.ea_um.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(439, 'Topmix', 'Topmix', 'TS8-1272', 'APRICOT', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1272_VM_APRICOT.jpg', 'public/uploads/materials/topmix/TS8-1272_VM_APRICOT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(440, 'Topmix', 'Topmix', 'TS8-1275', 'SEPIA', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1275_VM_SEPIA_Seam.jpg', 'public/uploads/materials/topmix/TS8-1275_VM_SEPIA_Seam.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(441, 'Topmix', 'Topmix', 'TS8-1277', 'MUSTARD', 'VM', 'Patterns', 'DRY MATT SERIES', 'page_048_09.jpg', 'public/uploads/materials/topmix/page_048_09.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(442, 'Topmix', 'Topmix', 'TS8-1252', 'LAVENDER', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1252_VM_LAVENDER_OO.jpg', 'public/uploads/materials/topmix/TS8-1252_VM_LAVENDER_OO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(443, 'Topmix', 'Topmix', 'TS8-1238', 'FOREST GREEN', 'VM', 'Patterns', 'DRY MATT SERIES', 'page_048_11.jpg', 'public/uploads/materials/topmix/page_048_11.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(444, 'Topmix', 'Topmix', 'TS8-1281', 'DARK GREEN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1281_VM_DARK_GREEN_ew.jpg', 'public/uploads/materials/topmix/TS8-1281_VM_DARK_GREEN_ew.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(445, 'Topmix', 'Topmix', 'TS8-1268', 'OLIVE DRAB', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1268_VM_OLIVE_DRAB_Ooo.jpg', 'public/uploads/materials/topmix/TS8-1268_VM_OLIVE_DRAB_Ooo.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(446, 'Topmix', 'Topmix', 'TS8-1286', 'CAREYS PINK', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1286_VM_CAREYS_PINK_ee.jpg', 'public/uploads/materials/topmix/TS8-1286_VM_CAREYS_PINK_ee.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(447, 'Topmix', 'Topmix', 'TS8-1215', 'PURPLE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1215_VM_PURPLE_Sea_wr.jpg', 'public/uploads/materials/topmix/TS8-1215_VM_PURPLE_Sea_wr.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(448, 'Topmix', 'Topmix', 'TS8-1273', 'OXLEY', 'VM', 'Patterns', 'DRY MATT SERIES', 'page_048_16.jpg', 'public/uploads/materials/topmix/page_048_16.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(449, 'Topmix', 'Topmix', 'TS8-1232', 'OLIVE GREEN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1232_VM_OLIVE_GREEN_oO.jpg', 'public/uploads/materials/topmix/TS8-1232_VM_OLIVE_GREEN_oO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(450, 'Topmix', 'Topmix', 'TS8-1283', 'CELADON GREEN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1283_VM_CELADON_GREEN_TT.jpg', 'public/uploads/materials/topmix/TS8-1283_VM_CELADON_GREEN_TT.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(451, 'Topmix', 'Topmix', 'TS8-1269', 'SMOKE GREEN', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1269_VM_SMOKE_GREEN_nS.jpg', 'public/uploads/materials/topmix/TS8-1269_VM_SMOKE_GREEN_nS.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(452, 'Topmix', 'Topmix', 'TS8-1250', 'TURQUOISE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1250_VM_TURQUOISE_OO.jpg', 'public/uploads/materials/topmix/TS8-1250_VM_TURQUOISE_OO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(453, 'Topmix', 'Topmix', 'TS8-1279', 'LIMED SPRUCE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1279_VM_LIMED_SPRUCE.jpg', 'public/uploads/materials/topmix/TS8-1279_VM_LIMED_SPRUCE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(454, 'Topmix', 'Topmix', 'TS8-1253', 'PRUSSIAN BLUE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1253_VM_PRUSSIAN_BLUE.jpg', 'public/uploads/materials/topmix/TS8-1253_VM_PRUSSIAN_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(455, 'Topmix', 'Topmix', 'TS8-1235', 'AIR FORCE BLUE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1235_VM_AIR_FORCE_BLUE.jpg', 'public/uploads/materials/topmix/TS8-1235_VM_AIR_FORCE_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(456, 'Topmix', 'Topmix', 'TS8-1237', 'BABY BLUE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1237_VM_BABY_BLUE.jpg', 'public/uploads/materials/topmix/TS8-1237_VM_BABY_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(457, 'Topmix', 'Topmix', 'TS8-1239', 'SKY BLUE', 'VM', 'Patterns', 'DRY MATT SERIES', 'TS8-1239_VM_SKY_BLUE.jpg', 'public/uploads/materials/topmix/TS8-1239_VM_SKY_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(458, 'Topmix', 'Topmix', 'TS4-2018', 'BLACK', 'G', 'Patterns', 'HIGH GLOSS SERIES (0.7mm)', 'TS4-2018_G_BLACK.jpg', 'public/uploads/materials/topmix/TS4-2018_G_BLACK.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(459, 'Topmix', 'Topmix', 'TS4-2028', 'RED', 'G', 'Patterns', 'HIGH GLOSS SERIES (0.7mm)', 'TS4-2028_G_RED.jpg', 'public/uploads/materials/topmix/TS4-2028_G_RED.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(460, 'Topmix', 'Topmix', 'TS5-2222', 'POWDER WHITE', 'G', 'Patterns', 'HIGH GLOSS SERIES (0.7mm)', 'TS5-2222_G_POWDER_WHITE.jpg', 'public/uploads/materials/topmix/TS5-2222_G_POWDER_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(461, 'Topmix', 'Topmix', 'TS5-2091', 'DOVE', 'G', 'Patterns', 'HIGH GLOSS SERIES (0.7mm)', 'TS5-2091_G_DOVE.jpg', 'public/uploads/materials/topmix/TS5-2091_G_DOVE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(462, 'Topmix', 'Topmix', 'TS5-2001', 'SNOW WHITE', 'G', 'Patterns', 'HIGH GLOSS SERIES (0.7mm)', 'TS5-2001_G_SNOW_WHITE.jpg', 'public/uploads/materials/topmix/TS5-2001_G_SNOW_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(463, 'Topmix', 'Topmix', 'TS2-0103', 'ALPHA WHITE', 'G', 'Patterns', 'HIGH GLOSS SERIES (0.7mm)', 'TS2-0103_G_ALPHA_WHITE.jpg', 'public/uploads/materials/topmix/TS2-0103_G_ALPHA_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(464, 'Topmix', 'Topmix', 'TS6-5028', 'RED', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5028_G_RED_7.jpg', 'public/uploads/materials/topmix/TS6-5028_G_RED_7.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(465, 'Topmix', 'Topmix', 'TS6-5012', 'FLAMINGO', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5012_G_FLAMINGO.jpg', 'public/uploads/materials/topmix/TS6-5012_G_FLAMINGO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(466, 'Topmix', 'Topmix', 'TS6-5016', 'YELLOW', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5016_G_YELLOW.jpg', 'public/uploads/materials/topmix/TS6-5016_G_YELLOW.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(467, 'Topmix', 'Topmix', 'TS6-5022', 'CHIFFON WHITE SE]', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5022_G_CHIFFON_WHITE_SE.jpg', 'public/uploads/materials/topmix/TS6-5022_G_CHIFFON_WHITE_SE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(468, 'Topmix', 'Topmix', 'TS6-5013', 'IVORY WHITE TY', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5013_G_IVORY_WHITE_TY.jpg', 'public/uploads/materials/topmix/TS6-5013_G_IVORY_WHITE_TY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(469, 'Topmix', 'Topmix', 'TS6-5001', 'SNOW WHITE iii', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5001_G_SNOW_WHITE_iii.jpg', 'public/uploads/materials/topmix/TS6-5001_G_SNOW_WHITE_iii.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(470, 'Topmix', 'Topmix', 'TS6-5019', 'PRUSSIAN BLUE |', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5019_G_PRUSSIAN_BLUE.jpg', 'public/uploads/materials/topmix/TS6-5019_G_PRUSSIAN_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(471, 'Topmix', 'Topmix', 'TS6-5020', 'TURQUOISE', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5020_G_TURQUOISE___WJ.jpg', 'public/uploads/materials/topmix/TS6-5020_G_TURQUOISE___WJ.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(472, 'Topmix', 'Topmix', 'TS6-5225', 'TIFFANY BLUE', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5225_G_TIFFANY_BLUE.jpg', 'public/uploads/materials/topmix/TS6-5225_G_TIFFANY_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(473, 'Topmix', 'Topmix', 'TS6-5021', 'SKY BLUE', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5021_G_SKY_BLUE.jpg', 'public/uploads/materials/topmix/TS6-5021_G_SKY_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(474, 'Topmix', 'Topmix', 'TS6-5091', 'DOVE', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5091_G_DOVE.jpg', 'public/uploads/materials/topmix/TS6-5091_G_DOVE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(475, 'Topmix', 'Topmix', 'TS6-5222', 'POWDER WHITE', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5222_G_POWDER_WHITE.jpg', 'public/uploads/materials/topmix/TS6-5222_G_POWDER_WHITE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(476, 'Topmix', 'Topmix', 'TS6-5018', 'BLACK', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5018_G_BLACK.jpg', 'public/uploads/materials/topmix/TS6-5018_G_BLACK.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(477, 'Topmix', 'Topmix', 'TS6-5227', 'DIM GREY', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5227_G_DIM_GREY.jpg', 'public/uploads/materials/topmix/TS6-5227_G_DIM_GREY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(478, 'Topmix', 'Topmix', 'TS6-5011', 'SABLE BROWN', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5011_G_SABLE_BROWN.jpg', 'public/uploads/materials/topmix/TS6-5011_G_SABLE_BROWN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(479, 'Topmix', 'Topmix', 'TS6-5015', 'CHELSEA GREY', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5015_G_CHELSEA_GREY.jpg', 'public/uploads/materials/topmix/TS6-5015_G_CHELSEA_GREY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(480, 'Topmix', 'Topmix', 'TS6-5223', 'GAINSBORO GREY', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5223_G_GAINSBORO_GREY.jpg', 'public/uploads/materials/topmix/TS6-5223_G_GAINSBORO_GREY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(481, 'Topmix', 'Topmix', 'TS6-5017', 'OLIVE GREEN', 'G', 'Patterns', 'HIGH GLOSS SERIES (1.0mm)', 'TS6-5017_G_OLIVE_GREEN.jpg', 'public/uploads/materials/topmix/TS6-5017_G_OLIVE_GREEN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(482, 'Topmix', 'Topmix', 'TS3-1018', 'BLACK', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1018_BLACK_S_aQew.jpg', 'public/uploads/materials/topmix/TS3-1018_BLACK_S_aQew.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(483, 'Topmix', 'Topmix', 'TS4-1017', 'BLACK', 'M', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1017_M_BLACK.jpg', 'public/uploads/materials/topmix/TS4-1017_M_BLACK.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(484, 'Topmix', 'Topmix', 'TS4-1223', 'GAINSBORO GREY', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1223_GAINSBORO_GREY_nn.jpg', 'public/uploads/materials/topmix/TS4-1223_GAINSBORO_GREY_nn.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(485, 'Topmix', 'Topmix', 'TS4-1226', 'LIGHT GREY', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1226_LIGHT_GREY_as.jpg', 'public/uploads/materials/topmix/TS4-1226_LIGHT_GREY_as.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(486, 'Topmix', 'Topmix', 'TS1-0101', 'ALPHA WHITE', 'M', 'Patterns', 'SOLID COLOR SERIES', 'TS1-0101_M_ALPHA_WHITE_rs.jpg', 'public/uploads/materials/topmix/TS1-0101_M_ALPHA_WHITE_rs.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(487, 'Topmix', 'Topmix', 'TS1-0100', 'T ALPHA WHITE', '', 'Patterns', 'SOLID COLOR SERIES', 'TS1-0100_T_ALPHA_WHITE_as.jpg', 'public/uploads/materials/topmix/TS1-0100_T_ALPHA_WHITE_as.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(488, 'Topmix', 'Topmix', 'TS4-1227', 'DIM GREY', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1227_DIM_GREY_Skk_eee.jpg', 'public/uploads/materials/topmix/TS4-1227_DIM_GREY_Skk_eee.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(489, 'Topmix', 'Topmix', 'TS3-1013', 'CHARCOAL GREY', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1013_CHARCOAL_GREY_Sew.jpg', 'public/uploads/materials/topmix/TS3-1013_CHARCOAL_GREY_Sew.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(490, 'Topmix', 'Topmix', 'TS3-1011', 'SILVER GREY', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1011_SILVER_GREY_OO.jpg', 'public/uploads/materials/topmix/TS3-1011_SILVER_GREY_OO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(491, 'Topmix', 'Topmix', 'TS4-1222', 'POWDER WHITE', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1222_POWDER_WHITE_O.jpg', 'public/uploads/materials/topmix/TS4-1222_POWDER_WHITE_O.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(492, 'Topmix', 'Topmix', 'TS4-1001', 'SNOW WHITE', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1001_SNOW_WHITE_a.jpg', 'public/uploads/materials/topmix/TS4-1001_SNOW_WHITE_a.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(493, 'Topmix', 'Topmix', 'TS3-1008', 'DOVE', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1008_DOVE_a.jpg', 'public/uploads/materials/topmix/TS3-1008_DOVE_a.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(494, 'Topmix', 'Topmix', 'TS3-1015', 'CHOCOLATE', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1015_CHOCOLATE_S.eau.jpg', 'public/uploads/materials/topmix/TS3-1015_CHOCOLATE_S.eau.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(495, 'Topmix', 'Topmix', 'TS4-1221', 'SAND BROWN', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1221_SAND_BROWN_oO.jpg', 'public/uploads/materials/topmix/TS4-1221_SAND_BROWN_oO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(496, 'Topmix', 'Topmix', 'TS4-1030', 'CHELSEA GREY', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1030_CHELSEA_GREY_S.emu.jpg', 'public/uploads/materials/topmix/TS4-1030_CHELSEA_GREY_S.emu.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(497, 'Topmix', 'Topmix', 'TS3-1007', 'ASH BROWN', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1007_ASH_BROWN__eaeaQGeE.jpg', 'public/uploads/materials/topmix/TS3-1007_ASH_BROWN__eaeaQGeE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(498, 'Topmix', 'Topmix', 'TS4-1200', 'CREAMY', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1200_CREAMY_OOO.jpg', 'public/uploads/materials/topmix/TS4-1200_CREAMY_OOO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(499, 'Topmix', 'Topmix', 'TS4-1256', 'CREAM', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1256_CREAM_ee.jpg', 'public/uploads/materials/topmix/TS4-1256_CREAM_ee.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(500, 'Topmix', 'Topmix', 'TS3-1028', 'RED', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1028_RED_Sea.jpg', 'public/uploads/materials/topmix/TS3-1028_RED_Sea.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(501, 'Topmix', 'Topmix', 'TS3-1026', 'PINK', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1026_PINK_SeaaQGaw.jpg', 'public/uploads/materials/topmix/TS3-1026_PINK_SeaaQGaw.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(502, 'Topmix', 'Topmix', 'TS4-1201', 'VIOLET', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1201_VIOLET_S.eaIu.jpg', 'public/uploads/materials/topmix/TS4-1201_VIOLET_S.eaIu.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(503, 'Topmix', 'Topmix', 'TS4-1205', 'VIOLA TRAMONTO', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1205_VIOLA_TRAMONTO_Eeee.jpg', 'public/uploads/materials/topmix/TS4-1205_VIOLA_TRAMONTO_Eeee.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(504, 'Topmix', 'Topmix', 'TS3-1051', 'PURPLE', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1051_PURPLE.jpg', 'public/uploads/materials/topmix/TS3-1051_PURPLE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(505, 'Topmix', 'Topmix', 'TS3-1025', 'ROSE PINK', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1025_ROSE_PINK_oo.jpg', 'public/uploads/materials/topmix/TS3-1025_ROSE_PINK_oo.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(506, 'Topmix', 'Topmix', 'TS3-1027', 'VINE', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1027_VINE_OOO.jpg', 'public/uploads/materials/topmix/TS3-1027_VINE_OOO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(507, 'Topmix', 'Topmix', 'TS3-1023', 'PERSIMMON', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1023_PERSIMMON_Seaw.jpg', 'public/uploads/materials/topmix/TS3-1023_PERSIMMON_Seaw.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(508, 'Topmix', 'Topmix', 'TS3-1022', 'SUNNY', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1022_SUNNY.jpg', 'public/uploads/materials/topmix/TS3-1022_SUNNY.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(509, 'Topmix', 'Topmix', 'TS3-1020', 'SPRING', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1020_SPRING_OO.jpg', 'public/uploads/materials/topmix/TS3-1020_SPRING_OO.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(510, 'Topmix', 'Topmix', 'TS3-1021', 'SUNFLOWER', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1021_SUNFLOWER_oOo.jpg', 'public/uploads/materials/topmix/TS3-1021_SUNFLOWER_oOo.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(511, 'Topmix', 'Topmix', 'TS3-1019', 'CHRYSANTHEMUM', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1019_CHRYSANTHEMUM.jpg', 'public/uploads/materials/topmix/TS3-1019_CHRYSANTHEMUM.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(512, 'Topmix', 'Topmix', 'TS4-1209', 'SURF GREEN', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1209_SURF_GREEN.jpg', 'public/uploads/materials/topmix/TS4-1209_SURF_GREEN.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(513, 'Topmix', 'Topmix', 'TS4-1207', 'LIME', '', 'Patterns', 'SOLID COLOR SERIES', 'TS4-1207_LIME_Sea_mw.jpg', 'public/uploads/materials/topmix/TS4-1207_LIME_Sea_mw.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(514, 'Topmix', 'Topmix', 'TS3-1038', 'PACIFIC GREEN', '', 'Patterns', 'SOLID COLOR SERIES', 'TS3-1038_PACIFIC_GREEN_Sew.jpg', 'public/uploads/materials/topmix/TS3-1038_PACIFIC_GREEN_Sew.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(515, 'Topmix', 'Topmix', 'TS4-1225', 'TIFFANY BLUE', 'G', 'Patterns', 'HIGH GLOSS SERIES', 'TS4-1225_TIFFANY_BLUE_Ox.jpg', 'public/uploads/materials/topmix/TS4-1225_TIFFANY_BLUE_Ox.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(516, 'Topmix', 'Topmix', 'TS3-1060', 'NAVY BLUE', '', 'Patterns', 'HIGH GLOSS SERIES', 'TS3-1060_NAVY_BLUE.jpg', 'public/uploads/materials/topmix/TS3-1060_NAVY_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(517, 'Topmix', 'Topmix', 'TS4-1031', 'ZED BLUE', '', 'Patterns', 'HIGH GLOSS SERIES', 'TS4-1031_ZED_BLUE.jpg', 'public/uploads/materials/topmix/TS4-1031_ZED_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(518, 'Topmix', 'Topmix', 'TS3-1059', 'AMAZON BLUE', '', 'Patterns', 'HIGH GLOSS SERIES', 'TS3-1059_AMAZON_BLUE.jpg', 'public/uploads/materials/topmix/TS3-1059_AMAZON_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(519, 'Topmix', 'Topmix', 'TS3-1058', 'OCEAN BLUE', '', 'Patterns', 'HIGH GLOSS SERIES', 'TS3-1058_OCEAN_BLUE.jpg', 'public/uploads/materials/topmix/TS3-1058_OCEAN_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33'),
(520, 'Topmix', 'Topmix', 'TS3-1053', 'SPRING BLUE', '', 'Patterns', 'HIGH GLOSS SERIES', 'TS3-1053_SPRING_BLUE.jpg', 'public/uploads/materials/topmix/TS3-1053_SPRING_BLUE.jpg', 1, '2026-10-06 04:57:24', '2026-10-06 05:25:33');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cabinet_categories`
--
ALTER TABLE `cabinet_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `cabinet_templates`
--
ALTER TABLE `cabinet_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_template_category` (`category_id`);

--
-- Indexes for table `casero_stone_quartz`
--
ALTER TABLE `casero_stone_quartz`
  ADD PRIMARY KEY (`quartz_id`),
  ADD UNIQUE KEY `uq_casero_quartz_sku` (`sku`),
  ADD KEY `idx_quartz_series` (`series_name`),
  ADD KEY `idx_quartz_base_colour` (`base_colour`),
  ADD KEY `idx_quartz_vein_style` (`vein_style`),
  ADD KEY `idx_quartz_status` (`data_status`),
  ADD KEY `idx_quartz_available` (`available`);

--
-- Indexes for table `casero_stone_sintered`
--
ALTER TABLE `casero_stone_sintered`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_casero_sintered_product_code` (`product_code`),
  ADD KEY `idx_sintered_collection` (`collection`),
  ADD KEY `idx_sintered_colour` (`colour_name`),
  ADD KEY `idx_sintered_finish` (`surface_finish`),
  ADD KEY `idx_sintered_review_status` (`review_status`),
  ADD KEY `idx_sintered_active` (`is_active`);

--
-- Indexes for table `colors`
--
ALTER TABLE `colors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_customers_code` (`customer_code`),
  ADD KEY `idx_customers_name` (`name`),
  ADD KEY `idx_customers_phone` (`phone`),
  ADD KEY `idx_customers_email` (`email`),
  ADD KEY `idx_customers_status` (`status`),
  ADD KEY `idx_customers_assigned` (`assigned_to`),
  ADD KEY `fk_customers_created_staff` (`created_by`),
  ADD KEY `idx_search_customers_name_phone` (`name`,`phone`);

--
-- Indexes for table `customer_appointments`
--
ALTER TABLE `customer_appointments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_customer_appointments_code` (`appointment_code`),
  ADD KEY `idx_customer_appointments_date` (`requested_start`,`status`),
  ADD KEY `idx_customer_appointments_customer` (`customer_id`),
  ADD KEY `fk_appointments_project` (`project_id`),
  ADD KEY `fk_appointments_staff` (`assigned_to`);

--
-- Indexes for table `customer_appointment_attachments`
--
ALTER TABLE `customer_appointment_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointment_upload` (`appointment_id`);

--
-- Indexes for table `customer_appointment_details`
--
ALTER TABLE `customer_appointment_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_appointment_details` (`appointment_id`);

--
-- Indexes for table `designer_access_tokens`
--
ALTER TABLE `designer_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dat_hash` (`token_hash`),
  ADD KEY `idx_dat_design` (`design_id`);

--
-- Indexes for table `designer_components`
--
ALTER TABLE `designer_components`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dc_item_uuid` (`design_item_id`,`component_uuid`),
  ADD KEY `idx_dc_parent` (`parent_component_id`),
  ADD KEY `idx_dc_type` (`component_type`);

--
-- Indexes for table `designer_documents`
--
ALTER TABLE `designer_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dd_design` (`design_id`);

--
-- Indexes for table `designer_hardware`
--
ALTER TABLE `designer_hardware`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dh_code` (`hardware_code`),
  ADD KEY `idx_dh_type` (`hardware_type`);

--
-- Indexes for table `designer_material_selections`
--
ALTER TABLE `designer_material_selections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dms_design` (`design_id`),
  ADD KEY `idx_dms_item` (`design_item_id`),
  ADD KEY `idx_dms_component` (`component_id`),
  ADD KEY `idx_dms_shared` (`shared_element_id`);

--
-- Indexes for table `designer_revisions`
--
ALTER TABLE `designer_revisions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_drev_design_rev` (`design_id`,`revision_no`);

--
-- Indexes for table `designer_rooms`
--
ALTER TABLE `designer_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dr_design` (`design_id`);

--
-- Indexes for table `designer_room_features`
--
ALTER TABLE `designer_room_features`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_drf_room_uuid` (`room_id`,`feature_uuid`);

--
-- Indexes for table `designer_shared_elements`
--
ALTER TABLE `designer_shared_elements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dse_design_uuid` (`design_id`,`element_uuid`),
  ADD KEY `fk_dse_room` (`room_id`);

--
-- Indexes for table `designer_shared_element_items`
--
ALTER TABLE `designer_shared_element_items`
  ADD PRIMARY KEY (`element_id`,`design_item_id`),
  ADD KEY `idx_dsei_item` (`design_item_id`);

--
-- Indexes for table `designer_template_hardware`
--
ALTER TABLE `designer_template_hardware`
  ADD PRIMARY KEY (`template_id`,`hardware_id`),
  ADD KEY `fk_dth_hardware` (`hardware_id`);

--
-- Indexes for table `designer_validation_findings`
--
ALTER TABLE `designer_validation_findings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dvf_design_state` (`design_id`,`state`),
  ADD KEY `fk_dvf_item` (`design_item_id`),
  ADD KEY `fk_dvf_rule` (`rule_id`);

--
-- Indexes for table `designer_validation_rules`
--
ALTER TABLE `designer_validation_rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dvr_code_version` (`rule_code`,`rule_version`),
  ADD KEY `idx_dvr_template` (`template_id`);

--
-- Indexes for table `designs`
--
ALTER TABLE `designs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `design_code` (`design_code`),
  ADD KEY `idx_designs_customer` (`customer_id`),
  ADD KEY `idx_designs_project` (`project_id`);

--
-- Indexes for table `design_items`
--
ALTER TABLE `design_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_item_design` (`design_id`),
  ADD KEY `fk_item_template` (`cabinet_template_id`),
  ADD KEY `fk_item_finish` (`finish_id`),
  ADD KEY `fk_item_color` (`color_id`),
  ADD KEY `fk_item_door` (`door_style_id`),
  ADD KEY `fk_item_handle` (`handle_id`);

--
-- Indexes for table `design_item_options`
--
ALTER TABLE `design_item_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_option_design_item` (`design_item_id`);

--
-- Indexes for table `dgtango`
--
ALTER TABLE `dgtango`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dgtango_product_code` (`product_code`);

--
-- Indexes for table `door_styles`
--
ALTER TABLE `door_styles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `finishes`
--
ALTER TABLE `finishes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `handles`
--
ALTER TABLE `handles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `inspiration_designs`
--
ALTER TABLE `inspiration_designs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_inspiration_designs_slug` (`slug`),
  ADD KEY `idx_inspiration_publish` (`is_published`,`is_featured`,`sort_order`),
  ADD KEY `fk_inspiration_base_design` (`base_design_id`),
  ADD KEY `fk_inspiration_template` (`default_template_id`),
  ADD KEY `fk_inspiration_finish` (`default_finish_id`),
  ADD KEY `fk_inspiration_color` (`default_color_id`),
  ADD KEY `fk_inspiration_door` (`default_door_style_id`),
  ADD KEY `fk_inspiration_handle` (`default_handle_id`),
  ADD KEY `fk_inspiration_staff` (`created_by`);

--
-- Indexes for table `inspiration_design_tags`
--
ALTER TABLE `inspiration_design_tags`
  ADD PRIMARY KEY (`inspiration_design_id`,`tag_id`),
  ADD KEY `fk_inspiration_design_tags_tag` (`tag_id`);

--
-- Indexes for table `inspiration_images`
--
ALTER TABLE `inspiration_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_inspiration_images_design` (`inspiration_design_id`,`sort_order`);

--
-- Indexes for table `inspiration_tags`
--
ALTER TABLE `inspiration_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_inspiration_tags_name` (`name`),
  ADD UNIQUE KEY `uq_inspiration_tags_slug` (`slug`);

--
-- Indexes for table `project_gallery_entries`
--
ALTER TABLE `project_gallery_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_gallery_slug` (`slug`),
  ADD KEY `idx_project_gallery_publish` (`is_published`,`is_featured`,`sort_order`),
  ADD KEY `fk_project_gallery_project` (`project_id`),
  ADD KEY `fk_project_gallery_staff` (`created_by`);

--
-- Indexes for table `project_gallery_images`
--
ALTER TABLE `project_gallery_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_project_gallery_images_entry` (`gallery_entry_id`,`sort_order`);

--
-- Indexes for table `topmix`
--
ALTER TABLE `topmix`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_code` (`product_code`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cabinet_categories`
--
ALTER TABLE `cabinet_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `cabinet_templates`
--
ALTER TABLE `cabinet_templates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `casero_stone_quartz`
--
ALTER TABLE `casero_stone_quartz`
  MODIFY `quartz_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `casero_stone_sintered`
--
ALTER TABLE `casero_stone_sintered`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `colors`
--
ALTER TABLE `colors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `customer_appointments`
--
ALTER TABLE `customer_appointments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `customer_appointment_attachments`
--
ALTER TABLE `customer_appointment_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_appointment_details`
--
ALTER TABLE `customer_appointment_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `designer_access_tokens`
--
ALTER TABLE `designer_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_components`
--
ALTER TABLE `designer_components`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_documents`
--
ALTER TABLE `designer_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_hardware`
--
ALTER TABLE `designer_hardware`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_material_selections`
--
ALTER TABLE `designer_material_selections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_revisions`
--
ALTER TABLE `designer_revisions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_rooms`
--
ALTER TABLE `designer_rooms`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_room_features`
--
ALTER TABLE `designer_room_features`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_shared_elements`
--
ALTER TABLE `designer_shared_elements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_validation_findings`
--
ALTER TABLE `designer_validation_findings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designer_validation_rules`
--
ALTER TABLE `designer_validation_rules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `designs`
--
ALTER TABLE `designs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `design_items`
--
ALTER TABLE `design_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `design_item_options`
--
ALTER TABLE `design_item_options`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `dgtango`
--
ALTER TABLE `dgtango`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=411;

--
-- AUTO_INCREMENT for table `door_styles`
--
ALTER TABLE `door_styles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `finishes`
--
ALTER TABLE `finishes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `handles`
--
ALTER TABLE `handles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `inspiration_designs`
--
ALTER TABLE `inspiration_designs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inspiration_images`
--
ALTER TABLE `inspiration_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inspiration_tags`
--
ALTER TABLE `inspiration_tags`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `project_gallery_entries`
--
ALTER TABLE `project_gallery_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project_gallery_images`
--
ALTER TABLE `project_gallery_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `topmix`
--
ALTER TABLE `topmix`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=521;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `designer_access_tokens`
--
ALTER TABLE `designer_access_tokens`
  ADD CONSTRAINT `fk_dat_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `designer_components`
--
ALTER TABLE `designer_components`
  ADD CONSTRAINT `fk_dc_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dc_parent` FOREIGN KEY (`parent_component_id`) REFERENCES `designer_components` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `designer_documents`
--
ALTER TABLE `designer_documents`
  ADD CONSTRAINT `fk_dd_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `designer_material_selections`
--
ALTER TABLE `designer_material_selections`
  ADD CONSTRAINT `fk_dms_component` FOREIGN KEY (`component_id`) REFERENCES `designer_components` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dms_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dms_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dms_shared` FOREIGN KEY (`shared_element_id`) REFERENCES `designer_shared_elements` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `designer_revisions`
--
ALTER TABLE `designer_revisions`
  ADD CONSTRAINT `fk_drev_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `designer_rooms`
--
ALTER TABLE `designer_rooms`
  ADD CONSTRAINT `fk_dr_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `designer_room_features`
--
ALTER TABLE `designer_room_features`
  ADD CONSTRAINT `fk_drf_room` FOREIGN KEY (`room_id`) REFERENCES `designer_rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `designer_shared_elements`
--
ALTER TABLE `designer_shared_elements`
  ADD CONSTRAINT `fk_dse_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dse_room` FOREIGN KEY (`room_id`) REFERENCES `designer_rooms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `designer_shared_element_items`
--
ALTER TABLE `designer_shared_element_items`
  ADD CONSTRAINT `fk_dsei_element` FOREIGN KEY (`element_id`) REFERENCES `designer_shared_elements` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dsei_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `designer_template_hardware`
--
ALTER TABLE `designer_template_hardware`
  ADD CONSTRAINT `fk_dth_hardware` FOREIGN KEY (`hardware_id`) REFERENCES `designer_hardware` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dth_template` FOREIGN KEY (`template_id`) REFERENCES `cabinet_templates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `designer_validation_findings`
--
ALTER TABLE `designer_validation_findings`
  ADD CONSTRAINT `fk_dvf_design` FOREIGN KEY (`design_id`) REFERENCES `designs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dvf_item` FOREIGN KEY (`design_item_id`) REFERENCES `design_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dvf_rule` FOREIGN KEY (`rule_id`) REFERENCES `designer_validation_rules` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `designer_validation_rules`
--
ALTER TABLE `designer_validation_rules`
  ADD CONSTRAINT `fk_dvr_template` FOREIGN KEY (`template_id`) REFERENCES `cabinet_templates` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
