CREATE DATABASE IF NOT EXISTS ideare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ideare_db;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS design_item_options;
DROP TABLE IF EXISTS design_items;
DROP TABLE IF EXISTS designs;
DROP TABLE IF EXISTS handles;
DROP TABLE IF EXISTS door_styles;
DROP TABLE IF EXISTS colors;
DROP TABLE IF EXISTS finishes;
DROP TABLE IF EXISTS cabinet_templates;
DROP TABLE IF EXISTS cabinet_categories;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE cabinet_categories(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,slug VARCHAR(120) NOT NULL UNIQUE,description TEXT,sort_order INT DEFAULT 0,is_active TINYINT(1) DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE cabinet_templates(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,category_id INT UNSIGNED,name VARCHAR(150) NOT NULL,slug VARCHAR(180) NOT NULL UNIQUE,description TEXT,preview_image VARCHAR(255),default_width DECIMAL(10,2) NOT NULL,default_height DECIMAL(10,2) NOT NULL,default_depth DECIMAL(10,2) NOT NULL,min_width DECIMAL(10,2) NOT NULL,max_width DECIMAL(10,2) NOT NULL,width_step DECIMAL(10,2) DEFAULT 50,min_height DECIMAL(10,2) NOT NULL,max_height DECIMAL(10,2) NOT NULL,height_step DECIMAL(10,2) DEFAULT 50,min_depth DECIMAL(10,2) NOT NULL,max_depth DECIMAL(10,2) NOT NULL,depth_step DECIMAL(10,2) DEFAULT 50,base_price DECIMAL(12,2) DEFAULT 0,sort_order INT DEFAULT 0,is_active TINYINT(1) DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(category_id) REFERENCES cabinet_categories(id) ON DELETE SET NULL);
CREATE TABLE finishes(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,slug VARCHAR(120) UNIQUE,description TEXT,preview_image VARCHAR(255),price_modifier DECIMAL(12,2) DEFAULT 0,sort_order INT DEFAULT 0,is_active TINYINT(1) DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE colors(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,slug VARCHAR(120) UNIQUE,hex_code VARCHAR(20),texture_image VARCHAR(255),price_modifier DECIMAL(12,2) DEFAULT 0,sort_order INT DEFAULT 0,is_active TINYINT(1) DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE door_styles(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,slug VARCHAR(120) UNIQUE,description TEXT,preview_image VARCHAR(255),price_modifier DECIMAL(12,2) DEFAULT 0,sort_order INT DEFAULT 0,is_active TINYINT(1) DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE handles(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,slug VARCHAR(120) UNIQUE,description TEXT,preview_image VARCHAR(255),price_modifier DECIMAL(12,2) DEFAULT 0,sort_order INT DEFAULT 0,is_active TINYINT(1) DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE designs(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,design_code VARCHAR(50) NOT NULL UNIQUE,design_name VARCHAR(150),customer_name VARCHAR(150),customer_email VARCHAR(180),customer_phone VARCHAR(50),room_type VARCHAR(100),notes TEXT,total_width DECIMAL(12,2) DEFAULT 0,estimated_price DECIMAL(12,2) DEFAULT 0,status ENUM('draft','saved','submitted','quoted') DEFAULT 'draft',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE design_items(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,design_id INT UNSIGNED NOT NULL,cabinet_template_id INT UNSIGNED NOT NULL,finish_id INT UNSIGNED,color_id INT UNSIGNED,door_style_id INT UNSIGNED,handle_id INT UNSIGNED,position_order INT DEFAULT 0,width DECIMAL(10,2),height DECIMAL(10,2),depth DECIMAL(10,2),quantity INT DEFAULT 1,item_price DECIMAL(12,2) DEFAULT 0,notes TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(design_id) REFERENCES designs(id) ON DELETE CASCADE,FOREIGN KEY(cabinet_template_id) REFERENCES cabinet_templates(id),FOREIGN KEY(finish_id) REFERENCES finishes(id) ON DELETE SET NULL,FOREIGN KEY(color_id) REFERENCES colors(id) ON DELETE SET NULL,FOREIGN KEY(door_style_id) REFERENCES door_styles(id) ON DELETE SET NULL,FOREIGN KEY(handle_id) REFERENCES handles(id) ON DELETE SET NULL);
CREATE TABLE design_item_options(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,design_item_id INT UNSIGNED NOT NULL,option_name VARCHAR(100) NOT NULL,option_value VARCHAR(150),price_modifier DECIMAL(12,2) DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(design_item_id) REFERENCES design_items(id) ON DELETE CASCADE);

INSERT INTO cabinet_categories(name,slug,sort_order) VALUES ('Base Cabinets','base-cabinets',1),('Wall Cabinets','wall-cabinets',2),('Tall Cabinets','tall-cabinets',3),('Special Cabinets','special-cabinets',4);
INSERT INTO cabinet_templates(category_id,name,slug,default_width,default_height,default_depth,min_width,max_width,width_step,min_height,max_height,height_step,min_depth,max_depth,depth_step,base_price,sort_order) VALUES
(1,'Standard Base Cabinet','standard-base-cabinet',600,850,600,300,1200,50,750,950,50,500,650,50,500,1),
(1,'Single Door Base Cabinet','single-door-base-cabinet',450,850,600,300,600,50,750,950,50,500,650,50,420,2),
(1,'Drawer Cabinet','drawer-cabinet',600,850,600,450,900,50,750,950,50,500,650,50,650,3),
(1,'Sink Cabinet','sink-cabinet',900,850,600,600,1200,50,750,950,50,500,650,50,600,4),
(2,'Standard Wall Cabinet','standard-wall-cabinet',600,700,350,300,1200,50,400,1000,50,300,450,50,400,5),
(3,'Tall Storage Cabinet','tall-storage-cabinet',600,2100,600,450,900,50,1800,2400,50,500,650,50,900,6);
INSERT INTO finishes(name,slug,price_modifier,sort_order) VALUES ('Melamine','melamine',0,1),('Laminate','laminate',100,2),('Matte Laminate','matte-laminate',120,3),('High Gloss Acrylic','high-gloss-acrylic',250,4),('Wood Veneer','wood-veneer',350,5);
INSERT INTO colors(name,slug,hex_code,price_modifier,sort_order) VALUES ('Pure White','pure-white','#FFFFFF',0,1),('Soft Grey','soft-grey','#CFCFCF',0,2),('Matte Black','matte-black','#1E1E1E',30,3),('Beige','beige','#D9C7AA',0,4),('Sage Green','sage-green','#A8B5A2',40,5),('Natural Oak','natural-oak','#B58B5B',60,6),('Dark Walnut','dark-walnut','#76543A',80,7);
INSERT INTO door_styles(name,slug,price_modifier,sort_order) VALUES ('Flat Panel','flat-panel',0,1),('Shaker','shaker',100,2),('Slim Shaker','slim-shaker',130,3),('Glass Panel','glass-panel',150,4),('Fluted Panel','fluted-panel',180,5);
INSERT INTO handles(name,slug,price_modifier,sort_order) VALUES ('Handleless','handleless',0,1),('Black Bar Handle','black-bar-handle',25,2),('Silver Bar Handle','silver-bar-handle',25,3),('Gold Bar Handle','gold-bar-handle',35,4),('Round Knob','round-knob',15,5),('Edge Pull','edge-pull',30,6);

INSERT INTO designs(design_code,design_name,customer_name,customer_email,customer_phone,room_type,notes,total_width,estimated_price,status) VALUES
('IDEARE-D0001','Modern Walnut Kitchen Demo','Demo Customer','demo@example.com','012-3456789','Kitchen','First presentation demo design.',2700,3125,'saved'),
('IDEARE-D0002','White Shaker Kitchen Demo','Walk-in Customer',NULL,NULL,'Kitchen','Alternative showroom-style demo.',2400,2890,'draft');
