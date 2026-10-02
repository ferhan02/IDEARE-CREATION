CREATE DATABASE IF NOT EXISTS ideare_staff_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ideare_staff_db;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS announcement_reads;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS design_assignments;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS salary_records;
DROP TABLE IF EXISTS salary_advances;
DROP TABLE IF EXISTS overtime_requests;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS system_settings;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE branches (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(150) NOT NULL,
 code VARCHAR(30) NOT NULL UNIQUE,
 address_line1 VARCHAR(200), address_line2 VARCHAR(200), city VARCHAR(100), state VARCHAR(100), postcode VARCHAR(20),
 phone VARCHAR(50), email VARCHAR(150),
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departments (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 description TEXT,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 slug VARCHAR(100) NOT NULL UNIQUE,
 description TEXT,
 hierarchy_level INT NOT NULL DEFAULT 100,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(150) NOT NULL,
 permission_key VARCHAR(150) NOT NULL UNIQUE,
 description TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_code VARCHAR(30) NOT NULL UNIQUE,
 role_id INT UNSIGNED NOT NULL,
 department_id INT UNSIGNED,
 branch_id INT UNSIGNED,
 first_name VARCHAR(100) NOT NULL,
 last_name VARCHAR(100),
 email VARCHAR(180) NOT NULL UNIQUE,
 phone VARCHAR(50),
 password_hash VARCHAR(255) NOT NULL,
 profile_photo VARCHAR(255),
 job_title VARCHAR(150),
 hire_date DATE,
 date_of_birth DATE,
 address TEXT,
 emergency_contact_name VARCHAR(150),
 emergency_contact_phone VARCHAR(50),
 employment_status ENUM('active','inactive','probation','resigned','terminated') NOT NULL DEFAULT 'active',
 must_change_password TINYINT(1) NOT NULL DEFAULT 1,
 last_login_at DATETIME,
 failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
 locked_until DATETIME,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(role_id) REFERENCES roles(id),
 FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL,
 FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE role_permissions (
 role_id INT UNSIGNED NOT NULL,
 permission_id INT UNSIGNED NOT NULL,
 PRIMARY KEY(role_id,permission_id),
 FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
 FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id INT UNSIGNED NOT NULL,
 token_hash VARCHAR(255) NOT NULL,
 expires_at DATETIME NOT NULL,
 used_at DATETIME,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id INT UNSIGNED NOT NULL,
 attendance_date DATE NOT NULL,
 clock_in DATETIME,
 clock_out DATETIME,
 break_minutes INT UNSIGNED NOT NULL DEFAULT 0,
 status ENUM('present','late','absent','half_day','leave','off_day') NOT NULL DEFAULT 'present',
 notes TEXT,
 approved_by INT UNSIGNED,
 approved_at DATETIME,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY unique_staff_attendance(staff_id,attendance_date),
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE,
 FOREIGN KEY(approved_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE leave_types (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 code VARCHAR(30) NOT NULL UNIQUE,
 default_days DECIMAL(5,2) NOT NULL DEFAULT 0,
 paid_leave TINYINT(1) NOT NULL DEFAULT 1,
 requires_document TINYINT(1) NOT NULL DEFAULT 0,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_requests (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id INT UNSIGNED NOT NULL,
 leave_type_id INT UNSIGNED NOT NULL,
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 total_days DECIMAL(5,2) NOT NULL,
 reason TEXT NOT NULL,
 attachment_path VARCHAR(255),
 status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
 reviewed_by INT UNSIGNED,
 reviewed_at DATETIME,
 reviewer_notes TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE,
 FOREIGN KEY(leave_type_id) REFERENCES leave_types(id),
 FOREIGN KEY(reviewed_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE overtime_requests (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id INT UNSIGNED NOT NULL,
 overtime_date DATE NOT NULL,
 start_time TIME NOT NULL,
 end_time TIME NOT NULL,
 total_hours DECIMAL(5,2) NOT NULL,
 reason TEXT NOT NULL,
 status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
 reviewed_by INT UNSIGNED,
 reviewed_at DATETIME,
 reviewer_notes TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE,
 FOREIGN KEY(reviewed_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE salary_advances (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id INT UNSIGNED NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 reason TEXT NOT NULL,
 repayment_notes TEXT,
 status ENUM('pending','approved','rejected','paid','cancelled') NOT NULL DEFAULT 'pending',
 reviewed_by INT UNSIGNED,
 reviewed_at DATETIME,
 reviewer_notes TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE,
 FOREIGN KEY(reviewed_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE salary_records (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id INT UNSIGNED NOT NULL,
 salary_month TINYINT UNSIGNED NOT NULL,
 salary_year SMALLINT UNSIGNED NOT NULL,
 basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
 overtime_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 allowance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 bonus_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 deduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 advance_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
 net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
 notes TEXT,
 payment_status ENUM('draft','approved','paid') NOT NULL DEFAULT 'draft',
 payment_date DATE,
 created_by INT UNSIGNED,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY unique_salary_month(staff_id,salary_month,salary_year),
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE,
 FOREIGN KEY(created_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE tasks (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(200) NOT NULL,
 description TEXT,
 assigned_to INT UNSIGNED,
 assigned_by INT UNSIGNED,
 priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
 status ENUM('todo','in_progress','waiting','completed','cancelled') NOT NULL DEFAULT 'todo',
 due_date DATETIME,
 completed_at DATETIME,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(assigned_to) REFERENCES staff(id) ON DELETE SET NULL,
 FOREIGN KEY(assigned_by) REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE design_assignments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 design_id INT UNSIGNED,
 design_code VARCHAR(50) NOT NULL,
 assigned_to INT UNSIGNED NOT NULL,
 assigned_by INT UNSIGNED,
 assignment_type ENUM('consultation','design','quotation','review','installation','follow_up') NOT NULL DEFAULT 'design',
 status ENUM('assigned','in_progress','waiting_customer','completed','cancelled') NOT NULL DEFAULT 'assigned',
 notes TEXT,
 assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 completed_at DATETIME,
 FOREIGN KEY(assigned_to) REFERENCES staff(id) ON DELETE CASCADE,
 FOREIGN KEY(assigned_by) REFERENCES staff(id) ON DELETE SET NULL,
 INDEX idx_design_code(design_code),
 INDEX idx_design_id(design_id)
);

CREATE TABLE announcements (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(200) NOT NULL,
 content TEXT NOT NULL,
 created_by INT UNSIGNED,
 target_role_id INT UNSIGNED,
 is_important TINYINT(1) NOT NULL DEFAULT 0,
 publish_at DATETIME,
 expires_at DATETIME,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(created_by) REFERENCES staff(id) ON DELETE SET NULL,
 FOREIGN KEY(target_role_id) REFERENCES roles(id) ON DELETE SET NULL
);

CREATE TABLE announcement_reads (
 announcement_id BIGINT UNSIGNED NOT NULL,
 staff_id INT UNSIGNED NOT NULL,
 read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(announcement_id,staff_id),
 FOREIGN KEY(announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id INT UNSIGNED NOT NULL,
 title VARCHAR(200) NOT NULL,
 message TEXT NOT NULL,
 notification_type VARCHAR(50),
 related_type VARCHAR(50),
 related_id BIGINT UNSIGNED,
 is_read TINYINT(1) NOT NULL DEFAULT 0,
 read_at DATETIME,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE,
 INDEX idx_notification_unread(staff_id,is_read)
);

CREATE TABLE activity_logs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id INT UNSIGNED,
 action VARCHAR(150) NOT NULL,
 entity_type VARCHAR(100),
 entity_id VARCHAR(100),
 description TEXT,
 ip_address VARCHAR(45),
 user_agent TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE SET NULL,
 INDEX idx_activity_staff(staff_id),
 INDEX idx_activity_date(created_at)
);

CREATE TABLE system_settings (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 setting_key VARCHAR(150) NOT NULL UNIQUE,
 setting_value TEXT,
 description TEXT,
 updated_by INT UNSIGNED,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(updated_by) REFERENCES staff(id) ON DELETE SET NULL
);

INSERT INTO branches(name,code,city,state) VALUES ('IdeaRE Main Branch','HQ','Seremban','Negeri Sembilan');
INSERT INTO departments(name,description) VALUES
('Management','Company management and administration.'),
('Sales','Customer consultation, quotation and sales.'),
('Design','Cabinet and interior design work.'),
('Operations','Project coordination and general operations.'),
('Installation','On-site installation and project completion.'),
('Finance','Salary, payment and financial administration.');

INSERT INTO roles(name,slug,description,hierarchy_level) VALUES
('Owner','owner','Full access to all IdeaRE staff systems.',1),
('Manager','manager','Management access to staff and operations.',10),
('Supervisor','supervisor','Supervises daily staff operations.',20),
('Designer','designer','Cabinet/interior designer access.',50),
('Staff','staff','Standard staff self-service access.',100);

INSERT INTO permissions(name,permission_key) VALUES
('View Staff Dashboard','dashboard.view'),
('View Management Dashboard','dashboard.management'),
('View Own Profile','profile.view_own'),
('Edit Own Profile','profile.edit_own'),
('View Staff','staff.view'),
('Create Staff','staff.create'),
('Edit Staff','staff.edit'),
('Deactivate Staff','staff.deactivate'),
('View Own Attendance','attendance.view_own'),
('Clock Attendance','attendance.clock'),
('View All Attendance','attendance.view_all'),
('Edit Attendance','attendance.edit'),
('Submit Leave','leave.submit'),
('View Own Leave','leave.view_own'),
('View All Leave','leave.view_all'),
('Approve Leave','leave.approve'),
('Submit Overtime','overtime.submit'),
('View Own Overtime','overtime.view_own'),
('View All Overtime','overtime.view_all'),
('Approve Overtime','overtime.approve'),
('View Own Salary','salary.view_own'),
('View All Salaries','salary.view_all'),
('Manage Salaries','salary.manage'),
('Request Salary Advance','salary_advance.submit'),
('View Own Salary Advances','salary_advance.view_own'),
('View All Salary Advances','salary_advance.view_all'),
('Approve Salary Advances','salary_advance.approve'),
('View Assigned Designs','design.view_assigned'),
('View All Designs','design.view_all'),
('Assign Designs','design.assign'),
('Edit Designs','design.edit'),
('View Own Tasks','task.view_own'),
('View All Tasks','task.view_all'),
('Create Tasks','task.create'),
('Edit Tasks','task.edit'),
('View Announcements','announcement.view'),
('Manage Announcements','announcement.manage'),
('View Activity Log','activity.view'),
('Manage System Settings','settings.manage');

INSERT INTO role_permissions(role_id,permission_id)
SELECT (SELECT id FROM roles WHERE slug='staff'),id FROM permissions WHERE permission_key IN
('dashboard.view','profile.view_own','profile.edit_own','attendance.view_own','attendance.clock','leave.submit','leave.view_own','overtime.submit','overtime.view_own','salary.view_own','salary_advance.submit','salary_advance.view_own','design.view_assigned','task.view_own','announcement.view');

INSERT INTO role_permissions(role_id,permission_id)
SELECT (SELECT id FROM roles WHERE slug='designer'),id FROM permissions WHERE permission_key IN
('dashboard.view','profile.view_own','profile.edit_own','attendance.view_own','attendance.clock','leave.submit','leave.view_own','overtime.submit','overtime.view_own','salary.view_own','salary_advance.submit','salary_advance.view_own','design.view_assigned','design.edit','task.view_own','announcement.view');

INSERT INTO role_permissions(role_id,permission_id)
SELECT (SELECT id FROM roles WHERE slug='supervisor'),id FROM permissions WHERE permission_key IN
('dashboard.view','dashboard.management','profile.view_own','profile.edit_own','staff.view','attendance.view_own','attendance.clock','attendance.view_all','leave.submit','leave.view_own','leave.view_all','leave.approve','overtime.submit','overtime.view_own','overtime.view_all','overtime.approve','salary.view_own','salary_advance.submit','salary_advance.view_own','design.view_assigned','design.view_all','design.assign','task.view_own','task.view_all','task.create','task.edit','announcement.view');

INSERT INTO role_permissions(role_id,permission_id)
SELECT (SELECT id FROM roles WHERE slug='manager'),id FROM permissions WHERE permission_key <> 'settings.manage';

INSERT INTO role_permissions(role_id,permission_id)
SELECT (SELECT id FROM roles WHERE slug='owner'),id FROM permissions;

INSERT INTO leave_types(name,code,default_days,paid_leave,requires_document) VALUES
('Annual Leave','AL',12,1,0),
('Medical Leave','MC',14,1,1),
('Emergency Leave','EL',3,1,0),
('Unpaid Leave','UL',0,0,0);

INSERT INTO system_settings(setting_key,setting_value,description) VALUES
('company_name','IdeaRE','Company display name.'),
('currency','MYR','Currency used by the staff portal.'),
('standard_work_start','09:00','Normal work starting time.'),
('standard_work_end','18:00','Normal work ending time.'),
('attendance_late_after','09:15','Clock-ins after this time may be considered late.'),
('default_break_minutes','60','Standard daily break allowance in minutes.'),
('overtime_requires_approval','1','Whether overtime requires management approval.'),
('leave_requires_approval','1','Whether leave applications require management approval.'),
('staff_portal_name','IdeaRE Staff Portal','Display name of the internal staff system.');
