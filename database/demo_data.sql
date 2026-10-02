USE ideare_staff_db;

INSERT INTO staff(staff_code,role_id,department_id,branch_id,first_name,last_name,email,phone,password_hash,job_title,hire_date,employment_status,must_change_password,is_active) VALUES
('IDR001',(SELECT id FROM roles WHERE slug='owner'),(SELECT id FROM departments WHERE name='Management'),(SELECT id FROM branches WHERE code='HQ'),'Kamal','Rahman','owner@ideare.local','012-1000001','REPLACE_WITH_REAL_PASSWORD_HASH','Owner','2020-01-01','active',1,1),
('IDR002',(SELECT id FROM roles WHERE slug='manager'),(SELECT id FROM departments WHERE name='Management'),(SELECT id FROM branches WHERE code='HQ'),'Aina','Hassan','manager@ideare.local','012-1000002','REPLACE_WITH_REAL_PASSWORD_HASH','Operations Manager','2022-03-15','active',1,1),
('IDR003',(SELECT id FROM roles WHERE slug='supervisor'),(SELECT id FROM departments WHERE name='Sales'),(SELECT id FROM branches WHERE code='HQ'),'Farid','Azman','supervisor@ideare.local','012-1000003','REPLACE_WITH_REAL_PASSWORD_HASH','Sales Supervisor','2023-02-01','active',1,1),
('IDR004',(SELECT id FROM roles WHERE slug='designer'),(SELECT id FROM departments WHERE name='Design'),(SELECT id FROM branches WHERE code='HQ'),'Sofia','Ibrahim','designer@ideare.local','012-1000004','REPLACE_WITH_REAL_PASSWORD_HASH','Cabinet Designer','2024-01-08','active',1,1),
('IDR005',(SELECT id FROM roles WHERE slug='designer'),(SELECT id FROM departments WHERE name='Design'),(SELECT id FROM branches WHERE code='HQ'),'Daniel','Lee','daniel@ideare.local','012-1000005','REPLACE_WITH_REAL_PASSWORD_HASH','Interior Designer','2024-06-03','active',1,1),
('IDR006',(SELECT id FROM roles WHERE slug='staff'),(SELECT id FROM departments WHERE name='Sales'),(SELECT id FROM branches WHERE code='HQ'),'Nadia','Yusof','nadia@ideare.local','012-1000006','REPLACE_WITH_REAL_PASSWORD_HASH','Sales Consultant','2025-01-13','active',1,1),
('IDR007',(SELECT id FROM roles WHERE slug='staff'),(SELECT id FROM departments WHERE name='Operations'),(SELECT id FROM branches WHERE code='HQ'),'Hakim','Roslan','hakim@ideare.local','012-1000007','REPLACE_WITH_REAL_PASSWORD_HASH','Project Coordinator','2025-04-07','active',1,1),
('IDR008',(SELECT id FROM roles WHERE slug='staff'),(SELECT id FROM departments WHERE name='Installation'),(SELECT id FROM branches WHERE code='HQ'),'Rizal','Mahmud','rizal@ideare.local','012-1000008','REPLACE_WITH_REAL_PASSWORD_HASH','Installation Technician','2025-07-01','active',1,1),
('IDR009',(SELECT id FROM roles WHERE slug='staff'),(SELECT id FROM departments WHERE name='Finance'),(SELECT id FROM branches WHERE code='HQ'),'Mei','Tan','mei@ideare.local','012-1000009','REPLACE_WITH_REAL_PASSWORD_HASH','Finance Assistant','2025-08-18','active',1,1);

INSERT INTO attendance(staff_id,attendance_date,clock_in,clock_out,break_minutes,status,notes) VALUES
((SELECT id FROM staff WHERE staff_code='IDR002'),'2026-10-01','2026-10-01 08:48:00','2026-10-01 18:15:00',60,'present',NULL),
((SELECT id FROM staff WHERE staff_code='IDR003'),'2026-10-01','2026-10-01 08:55:00','2026-10-01 18:06:00',60,'present',NULL),
((SELECT id FROM staff WHERE staff_code='IDR004'),'2026-10-01','2026-10-01 08:50:00','2026-10-01 18:35:00',60,'present',NULL),
((SELECT id FROM staff WHERE staff_code='IDR005'),'2026-10-01',NULL,NULL,0,'leave','Annual leave.'),
((SELECT id FROM staff WHERE staff_code='IDR006'),'2026-10-01','2026-10-01 08:58:00','2026-10-01 18:03:00',60,'present',NULL),
((SELECT id FROM staff WHERE staff_code='IDR003'),'2026-09-29','2026-09-29 09:18:00','2026-09-29 18:10:00',60,'late','Traffic congestion.');

INSERT INTO leave_requests(staff_id,leave_type_id,start_date,end_date,total_days,reason,status,reviewed_by,reviewed_at,reviewer_notes) VALUES
((SELECT id FROM staff WHERE staff_code='IDR005'),(SELECT id FROM leave_types WHERE code='AL'),'2026-10-01','2026-10-01',1,'Personal appointment.','approved',(SELECT id FROM staff WHERE staff_code='IDR002'),'2026-09-27 14:30:00','Approved.'),
((SELECT id FROM staff WHERE staff_code='IDR006'),(SELECT id FROM leave_types WHERE code='AL'),'2026-10-12','2026-10-13',2,'Family event.','pending',NULL,NULL,NULL),
((SELECT id FROM staff WHERE staff_code='IDR007'),(SELECT id FROM leave_types WHERE code='EL'),'2026-10-05','2026-10-05',1,'Urgent family matter.','pending',NULL,NULL,NULL);

INSERT INTO overtime_requests(staff_id,overtime_date,start_time,end_time,total_hours,reason,status,reviewed_by,reviewed_at,reviewer_notes) VALUES
((SELECT id FROM staff WHERE staff_code='IDR004'),'2026-09-30','18:00:00','19:30:00',1.50,'Urgent revision of customer kitchen design.','approved',(SELECT id FROM staff WHERE staff_code='IDR002'),'2026-10-01 09:15:00','Approved due to customer deadline.'),
((SELECT id FROM staff WHERE staff_code='IDR005'),'2026-10-03','18:00:00','20:00:00',2.00,'Prepare drawings for Monday presentation.','pending',NULL,NULL,NULL);

INSERT INTO salary_advances(staff_id,amount,reason,repayment_notes,status,reviewed_by,reviewed_at,reviewer_notes) VALUES
((SELECT id FROM staff WHERE staff_code='IDR008'),600,'Unexpected vehicle repair expense.','Deduct RM200 over the next three salary cycles.','approved',(SELECT id FROM staff WHERE staff_code='IDR002'),'2026-09-20 11:00:00','Approved.'),
((SELECT id FROM staff WHERE staff_code='IDR006'),400,'Personal emergency expense.',NULL,'pending',NULL,NULL,NULL);

INSERT INTO salary_records(staff_id,salary_month,salary_year,basic_salary,overtime_amount,allowance_amount,commission_amount,bonus_amount,deduction_amount,advance_deduction,net_salary,notes,payment_status,payment_date,created_by) VALUES
((SELECT id FROM staff WHERE staff_code='IDR002'),9,2026,6500,0,500,0,0,350,0,6650,'September demo payroll.','paid','2026-09-30',(SELECT id FROM staff WHERE staff_code='IDR001')),
((SELECT id FROM staff WHERE staff_code='IDR003'),9,2026,4800,150,300,250,0,270,0,5230,'Includes sales commission.','paid','2026-09-30',(SELECT id FROM staff WHERE staff_code='IDR002')),
((SELECT id FROM staff WHERE staff_code='IDR004'),9,2026,4200,180,250,0,150,230,0,4550,'Design completion bonus included.','paid','2026-09-30',(SELECT id FROM staff WHERE staff_code='IDR002')),
((SELECT id FROM staff WHERE staff_code='IDR006'),9,2026,3000,0,200,480,0,170,0,3510,'Sales commission included.','paid','2026-09-30',(SELECT id FROM staff WHERE staff_code='IDR002'));

INSERT INTO tasks(title,description,assigned_to,assigned_by,priority,status,due_date) VALUES
('Prepare kitchen quotation','Review the saved cabinet design and prepare the first quotation draft.',(SELECT id FROM staff WHERE staff_code='IDR004'),(SELECT id FROM staff WHERE staff_code='IDR003'),'high','in_progress','2026-10-03 17:00:00'),
('Follow up with demo customer','Contact the customer regarding their kitchen cabinet preferences.',(SELECT id FROM staff WHERE staff_code='IDR006'),(SELECT id FROM staff WHERE staff_code='IDR003'),'normal','todo','2026-10-02 15:00:00'),
('Check cabinet measurements','Verify site measurements before final design confirmation.',(SELECT id FROM staff WHERE staff_code='IDR007'),(SELECT id FROM staff WHERE staff_code='IDR002'),'high','todo','2026-10-05 12:00:00');

INSERT INTO design_assignments(design_id,design_code,assigned_to,assigned_by,assignment_type,status,notes) VALUES
(1,'IDEARE-D0001',(SELECT id FROM staff WHERE staff_code='IDR004'),(SELECT id FROM staff WHERE staff_code='IDR003'),'design','in_progress','Review dimensions and prepare quotation-ready version.'),
(1,'IDEARE-D0001',(SELECT id FROM staff WHERE staff_code='IDR006'),(SELECT id FROM staff WHERE staff_code='IDR003'),'follow_up','assigned','Contact customer after designer completes revision.'),
(2,'IDEARE-D0002',(SELECT id FROM staff WHERE staff_code='IDR005'),(SELECT id FROM staff WHERE staff_code='IDR003'),'review','assigned','Review white Shaker concept before customer presentation.');

INSERT INTO announcements(title,content,created_by,target_role_id,is_important,publish_at,expires_at,is_active) VALUES
('Welcome to the IdeaRE Staff Portal','The new internal staff portal is being tested. Please report any issues found during the prototype period.',(SELECT id FROM staff WHERE staff_code='IDR001'),NULL,1,'2026-10-01 09:00:00',NULL,1),
('Cabinet Designer Demo','Design staff should test the new cabinet designer workflow and record any missing cabinet options or measurement rules.',(SELECT id FROM staff WHERE staff_code='IDR002'),(SELECT id FROM roles WHERE slug='designer'),1,'2026-10-02 08:00:00','2026-10-15 23:59:59',1),
('October Attendance Reminder','Remember to clock in and clock out through the staff portal every working day.',(SELECT id FROM staff WHERE staff_code='IDR002'),NULL,0,'2026-10-01 08:00:00','2026-10-31 23:59:59',1);

INSERT INTO notifications(staff_id,title,message,notification_type,related_type,related_id,is_read) VALUES
((SELECT id FROM staff WHERE staff_code='IDR004'),'New design assigned','IDEARE-D0001 has been assigned to you for design review.','assignment','design_assignment',1,0),
((SELECT id FROM staff WHERE staff_code='IDR006'),'Customer follow-up assigned','You have been assigned a follow-up for IDEARE-D0001.','assignment','design_assignment',2,0),
((SELECT id FROM staff WHERE staff_code='IDR005'),'Design review assigned','IDEARE-D0002 requires your review.','assignment','design_assignment',3,0);

INSERT INTO activity_logs(staff_id,action,entity_type,entity_id,description,ip_address,user_agent) VALUES
((SELECT id FROM staff WHERE staff_code='IDR002'),'staff.login','staff','IDR002','Manager logged into staff portal.','127.0.0.1','Demo Browser'),
((SELECT id FROM staff WHERE staff_code='IDR003'),'design.assign','design','IDEARE-D0001','Assigned cabinet design to Sofia Ibrahim.','127.0.0.1','Demo Browser'),
((SELECT id FROM staff WHERE staff_code='IDR004'),'design.open','design','IDEARE-D0001','Opened assigned cabinet design.','127.0.0.1','Demo Browser');
