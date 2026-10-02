USE ideare_staff_db;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  phone VARCHAR(50), email VARCHAR(180), address TEXT,
  lead_source VARCHAR(100), interested_service VARCHAR(150),
  assigned_to INT UNSIGNED NULL,
  status ENUM('lead','active','inactive','completed') NOT NULL DEFAULT 'lead',
  notes TEXT, created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_phone(phone), INDEX idx_customer_email(email),
  FOREIGN KEY(assigned_to) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  stage ENUM('new','contacted','consultation','site_measurement','designing','quotation_sent','negotiation','won','lost') NOT NULL DEFAULT 'new',
  estimated_value DECIMAL(12,2) DEFAULT 0,
  probability TINYINT UNSIGNED DEFAULT 20,
  lost_reason TEXT, assigned_to INT UNSIGNED NULL,
  next_follow_up_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_active_lead_customer(customer_id),
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY(assigned_to) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  lead_id BIGINT UNSIGNED NULL,
  assigned_to INT UNSIGNED NULL,
  follow_up_at DATETIME NOT NULL,
  reason VARCHAR(180) NOT NULL,
  notes TEXT,
  status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  completed_at DATETIME NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  FOREIGN KEY(assigned_to) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_followup_date(follow_up_at,status)
);

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_code VARCHAR(30) NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  project_type VARCHAR(120),
  status ENUM('consultation','measurement','design','quotation','approved','procurement','production','qc','installation','completed','on_hold','cancelled') NOT NULL DEFAULT 'consultation',
  assigned_manager INT UNSIGNED NULL,
  site_address TEXT,
  estimated_value DECIMAL(12,2) DEFAULT 0,
  start_date DATE NULL, target_date DATE NULL, completed_at DATETIME NULL,
  notes TEXT, created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY(assigned_manager) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY(created_by) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_project_status(status), INDEX idx_project_customer(customer_id)
);

CREATE TABLE IF NOT EXISTS project_activity (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  staff_id INT UNSIGNED NULL,
  activity_type VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS site_measurements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  measured_by INT UNSIGNED NULL,
  measured_at DATETIME NOT NULL,
  room_name VARCHAR(150) NOT NULL,
  wall_a_mm DECIMAL(10,2) NULL, wall_b_mm DECIMAL(10,2) NULL,
  wall_c_mm DECIMAL(10,2) NULL, wall_d_mm DECIMAL(10,2) NULL,
  ceiling_height_mm DECIMAL(10,2) NULL,
  window_details TEXT, door_details TEXT,
  plumbing_details TEXT, electrical_details TEXT,
  obstacles TEXT, notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(measured_by) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_measurement_project(project_id)
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id BIGINT UNSIGNED NULL AFTER description;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS customer_id BIGINT UNSIGNED NULL AFTER project_id;
CREATE INDEX IF NOT EXISTS idx_task_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_customer ON tasks(customer_id);

INSERT IGNORE INTO permissions(name,permission_key,description) VALUES
('View CRM','crm.view','View customers, leads and follow-ups'),
('Manage CRM','crm.manage','Create and update customers, leads and follow-ups'),
('View Projects','project.view','View projects and site measurements'),
('Manage Projects','project.manage','Create and update projects and measurements');

INSERT IGNORE INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.permission_key IN('crm.view','crm.manage','project.view','project.manage')
WHERE r.slug IN('owner','manager','supervisor');
