-- Vinyard Burger Bar - 8 New Features Database Upgrade
-- Run this SQL file to upgrade your existing database

USE vinyard_burger_db;

-- =====================================================
-- FEATURE 3: Advanced Cart Customization
-- =====================================================

-- Update existing order_items table to ensure customizations column exists
ALTER TABLE order_items 
MODIFY COLUMN customizations JSON NULL COMMENT 'Stores add-ons and removals as JSON';

-- Create table for menu item add-ons
CREATE TABLE IF NOT EXISTS menu_item_addons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  INDEX idx_menu_item (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create table for menu item removal options (free)
CREATE TABLE IF NOT EXISTS menu_item_removals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  INDEX idx_menu_item (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default add-ons for burgers
INSERT INTO menu_item_addons (menu_item_id, name, price) 
SELECT id, 'Extra 100% Beef Patty', 75.00 FROM menu_items WHERE category_id = 4;

INSERT INTO menu_item_addons (menu_item_id, name, price) 
SELECT id, 'Extra Cheese', 20.00 FROM menu_items WHERE category_id = 4;

INSERT INTO menu_item_addons (menu_item_id, name, price) 
SELECT id, 'Bacon', 30.00 FROM menu_items WHERE category_id = 4;

INSERT INTO menu_item_addons (menu_item_id, name, price) 
SELECT id, 'Extra Sauce', 15.00 FROM menu_items WHERE category_id = 4;

-- Insert default removal options for burgers
INSERT INTO menu_item_removals (menu_item_id, name) 
SELECT id, 'No Onions' FROM menu_items WHERE category_id = 4;

INSERT INTO menu_item_removals (menu_item_id, name) 
SELECT id, 'No Mayonnaise' FROM menu_items WHERE category_id = 4;

INSERT INTO menu_item_removals (menu_item_id, name) 
SELECT id, 'No Pickles' FROM menu_items WHERE category_id = 4;

INSERT INTO menu_item_removals (menu_item_id, name) 
SELECT id, 'No Tomatoes' FROM menu_items WHERE category_id = 4;

-- =====================================================
-- FEATURE 4: Expense Tracker & Profit Analytics
-- =====================================================

-- Add cost_to_make column to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS cost_to_make DECIMAL(10, 2) NULL DEFAULT 0.00 COMMENT 'Ingredient cost for profit calculation';

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  category ENUM('inventory', 'utilities', 'rent', 'salary', 'marketing', 'miscellaneous') DEFAULT 'miscellaneous',
  created_by INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_expense_date (expense_date),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update existing menu items with estimated costs (50% of price as default)
UPDATE menu_items SET cost_to_make = price * 0.5 WHERE cost_to_make = 0 OR cost_to_make IS NULL;

-- =====================================================
-- FEATURE 1: Smart Upselling & Cross-Selling
-- =====================================================

-- Create table for upsell/cross-sell relationships
CREATE TABLE IF NOT EXISTS upsell_relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  primary_item_id INT NOT NULL,
  suggested_item_id INT NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Bundle discount amount',
  bundle_name VARCHAR(255) NULL COMMENT 'e.g., Make it a Meal',
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (primary_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (suggested_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_upsell_combo (primary_item_id, suggested_item_id),
  INDEX idx_primary_item (primary_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample upsell relationships
-- Burgers suggest fries and drinks
INSERT INTO upsell_relationships (primary_item_id, suggested_item_id, discount_amount, bundle_name, priority)
SELECT b.id, f.id, 20.00, 'Make it a Meal', 1 
FROM menu_items b, menu_items f 
WHERE b.category_id = 4 AND f.name LIKE '%French Fries%' AND f.name LIKE '%Solo%'
LIMIT 1;

INSERT INTO upsell_relationships (primary_item_id, suggested_item_id, discount_amount, bundle_name, priority)
SELECT b.id, d.id, 10.00, 'Add a Drink', 2 
FROM menu_items b, menu_items d 
WHERE b.category_id = 4 AND d.name = 'Coke'
LIMIT 1;

-- =====================================================
-- FEATURE 7: Scratch Card Rewards & Promo Codes
-- =====================================================

-- Create table for promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  discount_type ENUM('percentage', 'fixed') DEFAULT 'fixed',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  max_uses INT NULL,
  current_uses INT DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_valid_dates (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create table for user promo code redemptions
CREATE TABLE IF NOT EXISTS user_promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  promo_code_id INT NOT NULL,
  order_id INT NULL,
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_promo (user_id, promo_code_id, order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample scratch card rewards as promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, valid_from, valid_until, max_uses) VALUES
('SCRATCH-FRIES-001', 'Free Solo Fries from Scratch Card', 'fixed', 85.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1000),
('SCRATCH-DRINK-001', 'Free Drink Upgrade from Scratch Card', 'fixed', 35.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1000),
('SCRATCH-10OFF-001', '10% Off Next Order from Scratch Card', 'percentage', 10.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1000),
('SCRATCH-50PTS-001', '50 Bonus Points from Scratch Card', 'fixed', 0.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1000);

-- =====================================================
-- FEATURE 8: Happy Hour / Slow-Day Discounts
-- =====================================================

-- Create table for time-based promotions
CREATE TABLE IF NOT EXISTS happy_hour_promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  applicable_days SET('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  applicable_categories JSON NULL COMMENT 'Array of category IDs',
  is_active BOOLEAN DEFAULT true,
  banner_text VARCHAR(255) DEFAULT 'Happy Hour Active!',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active_time (is_active, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default happy hour promotion (Weekdays 2PM-4PM, 10% off Pasta & Frappes)
INSERT INTO happy_hour_promotions (name, description, discount_percentage, applicable_days, start_time, end_time, applicable_categories, banner_text) VALUES
('Weekday Afternoon Happy Hour', '10% off selected items during slow hours', 10.00, 'monday,tuesday,wednesday,thursday,friday', '14:00:00', '16:00:00', '[1, 7]', 'Happy Hour Active! 10% off Pasta & Frappes!');

-- =====================================================
-- FEATURE 5: Kitchen Display System (KDS) - Order Timing
-- =====================================================

-- Add columns for kitchen timing tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS kitchen_started_at TIMESTAMP NULL COMMENT 'When kitchen started preparing',
ADD COLUMN IF NOT EXISTS kitchen_completed_at TIMESTAMP NULL COMMENT 'When kitchen finished',
ADD COLUMN IF NOT EXISTS estimated_prep_time INT DEFAULT 20 COMMENT 'Estimated preparation time in minutes';

-- =====================================================
-- FEATURE 2: Notifications - Store user notification preferences
-- =====================================================

-- Add notification preference to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_token VARCHAR(255) NULL COMMENT 'For push notification tokens';

-- Create notifications log table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_id INT NULL,
  type ENUM('order_status', 'promo', 'system') DEFAULT 'order_status',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_user_notifications (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Verify all tables created
-- =====================================================

SELECT 'Database upgrade completed successfully!' AS status;

-- Show all tables
SHOW TABLES;