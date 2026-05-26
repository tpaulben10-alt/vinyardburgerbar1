-- Vinyard Burger Bar - 8 New Features Database Schema Upgrade
-- MySQL Schema with Philippine Peso (₱) Support
-- Run this SQL file to upgrade your existing database

USE vinyard_burger_db;

-- =====================================================
-- FEATURE 3: Advanced Cart Customization
-- =====================================================

-- Modify order_items table to support JSON customizations
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS customizations JSON DEFAULT NULL COMMENT 'Stores add-ons and removals as JSON array',
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2) DEFAULT NULL COMMENT 'Price before customizations';

-- Create table for paid add-ons per menu item
CREATE TABLE IF NOT EXISTS menu_item_addons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(255) NOT NULL COMMENT 'e.g., Extra Beef Patty',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  INDEX idx_menu_item (menu_item_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for free removal options per menu item
CREATE TABLE IF NOT EXISTS menu_item_removals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(255) NOT NULL COMMENT 'e.g., No Onions',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  INDEX idx_menu_item (menu_item_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default add-ons for burgers (category_id = 4)
INSERT IGNORE INTO menu_item_addons (menu_item_id, name, price) 
SELECT id, 'Extra 100% Beef Patty', 75.00 FROM menu_items WHERE category_id = 4;

INSERT IGNORE INTO menu_item_addons (menu_item_id, name, price) 
SELECT id, 'Extra Cheese', 20.00 FROM menu_items WHERE category_id = 4;

INSERT IGNORE INTO menu_item_addons (menu_item_id, name, price) 
SELECT id, 'Bacon Strips', 30.00 FROM menu_items WHERE category_id = 4;

INSERT IGNORE INTO menu_item_addons (menu_item_id, name, price) 
SELECT id, 'Extra Sauce', 15.00 FROM menu_items WHERE category_id = 4;

-- Insert default removal options for burgers
INSERT IGNORE INTO menu_item_removals (menu_item_id, name) 
SELECT id, 'No Onions' FROM menu_items WHERE category_id = 4;

INSERT IGNORE INTO menu_item_removals (menu_item_id, name) 
SELECT id, 'No Mayonnaise' FROM menu_items WHERE category_id = 4;

INSERT IGNORE INTO menu_item_removals (menu_item_id, name) 
SELECT id, 'No Pickles' FROM menu_items WHERE category_id = 4;

INSERT IGNORE INTO menu_item_removals (menu_item_id, name) 
SELECT id, 'No Tomatoes' FROM menu_items WHERE category_id = 4;

-- =====================================================
-- FEATURE 1: Smart Upselling & Cross-Selling
-- =====================================================

CREATE TABLE IF NOT EXISTS upsell_relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  primary_item_id INT NOT NULL COMMENT 'Main item being purchased',
  suggested_item_id INT NOT NULL COMMENT 'Item to suggest as add-on',
  bundle_discount_percent DECIMAL(5, 2) DEFAULT 10.00 COMMENT 'Percentage discount on suggested item',
  bundle_name VARCHAR(255) DEFAULT 'Make it a Meal' COMMENT 'Display name for bundle',
  min_primary_qty INT DEFAULT 1 COMMENT 'Minimum quantity of primary to trigger',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (primary_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (suggested_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_upsell_combo (primary_item_id, suggested_item_id),
  INDEX idx_primary (primary_item_id, is_active),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample upsell relationships (burgers suggest sides and drinks)
INSERT IGNORE INTO upsell_relationships (primary_item_id, suggested_item_id, bundle_discount_percent, bundle_name)
SELECT 
  b.id as primary_item_id,
  f.id as suggested_item_id,
  10.00 as bundle_discount_percent,
  'Make it a Meal' as bundle_name
FROM menu_items b
CROSS JOIN menu_items f
WHERE b.category_id = 4 
  AND f.name LIKE '%French Fries%'
  AND f.name LIKE '%Solo%'
LIMIT 1;

-- =====================================================
-- FEATURE 4: Expense Tracker & Profit Analytics
-- =====================================================

-- Add cost tracking to menu items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS cost_to_make DECIMAL(10, 2) NULL DEFAULT 0.00 COMMENT 'Ingredient cost per item for COGS calculation',
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5, 2) GENERATED ALWAYS AS (
  CASE 
    WHEN price > 0 THEN ((price - cost_to_make) / price * 100)
    ELSE 0
  END
) STORED COMMENT 'Auto-calculated profit margin percentage';

-- Create expenses table for tracking operational costs
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL COMMENT 'e.g., Electricity Bill, Gas Delivery',
  amount DECIMAL(10, 2) NOT NULL COMMENT 'Amount in Philippine Peso',
  expense_date DATE NOT NULL,
  category ENUM('inventory', 'utilities', 'rent', 'salary', 'marketing', 'maintenance', 'miscellaneous') DEFAULT 'miscellaneous',
  receipt_url VARCHAR(500) NULL COMMENT 'Optional receipt image URL',
  created_by INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_expense_date (expense_date),
  INDEX idx_category (category),
  INDEX idx_date_category (expense_date, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize cost_to_make for existing items (estimated at 40% of price)
UPDATE menu_items 
SET cost_to_make = price * 0.40 
WHERE cost_to_make = 0 OR cost_to_make IS NULL;

-- =====================================================
-- FEATURE 5: Kitchen Display System (KDS)
-- =====================================================

-- Add kitchen timing columns to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS kitchen_accepted_at TIMESTAMP NULL COMMENT 'When kitchen started order',
ADD COLUMN IF NOT EXISTS kitchen_completed_at TIMESTAMP NULL COMMENT 'When kitchen finished order',
ADD COLUMN IF NOT EXISTS kds_priority ENUM('normal', 'rush', 'delayed') DEFAULT 'normal' COMMENT 'Priority flag for KDS',
ADD COLUMN IF NOT EXISTS estimated_prep_minutes INT DEFAULT 20 COMMENT 'Estimated preparation time';

-- Create KDS configuration table
CREATE TABLE IF NOT EXISTS kds_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warning_threshold_minutes INT DEFAULT 15 COMMENT 'Minutes before warning color',
  critical_threshold_minutes INT DEFAULT 25 COMMENT 'Minutes before critical color',
  auto_refresh_seconds INT DEFAULT 10,
  sound_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO kds_config (id, warning_threshold_minutes, critical_threshold_minutes) VALUES (1, 15, 25);

-- =====================================================
-- FEATURE 6: Delivery Route Map
-- =====================================================

-- Ensure orders table has coordinates (may already exist)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL COMMENT 'Customer latitude',
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL COMMENT 'Customer longitude',
ADD COLUMN IF NOT EXISTS delivery_zone VARCHAR(50) NULL COMMENT 'Assigned delivery zone';

-- Create delivery routes tracking
CREATE TABLE IF NOT EXISTS delivery_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rider_id INT NULL,
  route_date DATE NOT NULL,
  orders JSON NOT NULL COMMENT 'Array of order IDs in route sequence',
  estimated_distance_km DECIMAL(6, 2) NULL,
  status ENUM('planned', 'active', 'completed') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_route_date (route_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- FEATURE 7: Scratch Card / Mini-Game Rewards
-- =====================================================

-- Create promo codes table for scratch card rewards
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g., SCRATCH-WIN-001',
  description VARCHAR(255) NOT NULL COMMENT 'e.g., Free Solo Fries',
  reward_type ENUM('free_item', 'discount_percent', 'discount_fixed', 'bonus_points') NOT NULL,
  reward_value DECIMAL(10, 2) NOT NULL COMMENT 'Amount or percentage value',
  applicable_item_id INT NULL COMMENT 'Specific item for free_item type',
  min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  max_uses INT NULL,
  current_uses INT DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_scratch_card_reward BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicable_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_valid_dates (valid_from, valid_until),
  INDEX idx_scratch_card (is_scratch_card_reward)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user promo code assignments
CREATE TABLE IF NOT EXISTS user_promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  promo_code_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  redeemed_at TIMESTAMP NULL,
  order_id INT NULL,
  status ENUM('active', 'used', 'expired') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_code (user_id, promo_code_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert scratch card reward templates
INSERT IGNORE INTO promo_codes (code, description, reward_type, reward_value, applicable_item_id, valid_from, valid_until, is_scratch_card_reward) VALUES
('SCRATCH-FRIES', 'Free Solo Fries from Scratch Card', 'free_item', 85.00, NULL, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE),
('SCRATCH-DRINK', 'Free Drink Upgrade from Scratch Card', 'free_item', 35.00, NULL, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE),
('SCRATCH-10OFF', '10% Off Next Order from Scratch Card', 'discount_percent', 10.00, NULL, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE),
('SCRATCH-50PTS', '50 Bonus Points from Scratch Card', 'bonus_points', 50.00, NULL, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE);

-- =====================================================
-- FEATURE 8: Happy Hour / Automated Discounts
-- =====================================================

CREATE TABLE IF NOT EXISTS happy_hour_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'e.g., Weekday Afternoon Special',
  description TEXT,
  discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  applicable_days SET('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  applicable_categories JSON NOT NULL COMMENT 'Array of category IDs',
  min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  max_discount_amount DECIMAL(10, 2) NULL COMMENT 'Cap on discount amount',
  banner_text VARCHAR(255) DEFAULT 'Happy Hour Active!',
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_time (is_active, start_time, end_time),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default happy hour: Weekdays 2PM-4PM, 10% off Pasta(1) & Frappes(7)
INSERT IGNORE INTO happy_hour_schedules (name, description, discount_percent, applicable_days, start_time, end_time, applicable_categories, banner_text) VALUES
('Weekday Afternoon Happy Hour', '10% discount during slow afternoon hours on selected categories', 10.00, 'monday,tuesday,wednesday,thursday,friday', '14:00:00', '16:00:00', '[1, 7]', 'Happy Hour Active! 10% off Pasta & Frappes!');

-- =====================================================
-- FEATURE 2: Notifications Support
-- =====================================================

-- Add notification preferences to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_token VARCHAR(255) NULL COMMENT 'For push notification subscriptions',
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT TRUE COMMENT 'Enable order sounds';

-- Create notifications log
CREATE TABLE IF NOT EXISTS notifications_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_id INT NULL,
  type ENUM('order_status', 'promo', 'reward', 'system') DEFAULT 'order_status',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'sent', 'delivered', 'read') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_user_notifications (user_id, status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Verification Query
-- =====================================================

SELECT 'Database schema upgrade completed successfully!' AS status,
       COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'vinyard_burger_db';