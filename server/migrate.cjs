const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { dbConfig } = require('./db.cjs');

const schemaPath = path.join(__dirname, 'database', 'schema.sql');

const ddl = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    avatar VARCHAR(500),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    loyalty_points INT DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    notification_enabled BOOLEAN DEFAULT false,
    notification_token VARCHAR(255) NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    preparation_time INT DEFAULT 15,
    cost_to_make DECIMAL(10, 2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_menu_item (category_id, name),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    payment_method ENUM('cash_on_delivery', 'gcash', 'maya') DEFAULT 'cash_on_delivery',
    notes TEXT,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    estimated_completion TIMESTAMP NULL,
    estimated_prep_time INT DEFAULT 20,
    kitchen_started_at TIMESTAMP NULL,
    kitchen_completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    customizations JSON,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_review_order (order_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    points_required INT NOT NULL,
    reward_type ENUM('discount', 'free_item', 'voucher') NOT NULL,
    reward_value DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS loyalty_redemptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_used INT NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reward_id) REFERENCES loyalty_rewards(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS menu_item_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    UNIQUE KEY uniq_addon (menu_item_id, name),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS menu_item_removals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    UNIQUE KEY uniq_removal (menu_item_id, name),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS upsell_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    primary_item_id INT NOT NULL,
    suggested_item_id INT NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    bundle_name VARCHAR(255),
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    UNIQUE KEY uniq_upsell (primary_item_id, suggested_item_id),
    FOREIGN KEY (primary_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (suggested_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    category ENUM('inventory', 'utilities', 'rent', 'salary', 'marketing', 'miscellaneous') DEFAULT 'miscellaneous',
    created_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type ENUM('percentage', 'fixed', 'free_item') NOT NULL,
    discount_value DECIMAL(10, 2) DEFAULT 0.00,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    max_uses INT NULL,
    current_uses INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS user_promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    promo_code_id INT NOT NULL,
    redeemed_at TIMESTAMP NULL,
    order_id INT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_promo (user_id, promo_code_id, order_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS happy_hour_promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    applicable_days SET('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    applicable_categories JSON,
    banner_text VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NULL,
    type ENUM('order_status', 'promo', 'system') DEFAULT 'order_status',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_user_notifications (user_id, is_read)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

const requiredColumns = {
  users: [
    ['notification_enabled', 'BOOLEAN DEFAULT false'],
    ['notification_token', 'VARCHAR(255) NULL']
  ],
  menu_items: [
    ['cost_to_make', 'DECIMAL(10, 2) DEFAULT 0.00']
  ],
  orders: [
    ['estimated_prep_time', 'INT DEFAULT 20'],
    ['kitchen_started_at', 'TIMESTAMP NULL'],
    ['kitchen_completed_at', 'TIMESTAMP NULL']
  ]
};

function splitSql(sql) {
  return sql
    .replace(/CREATE DATABASE IF NOT EXISTS.*?;\s*/gis, '')
    .replace(/USE\s+.*?;\s*/gis, '')
    .replace(/INSERT INTO/g, 'INSERT IGNORE INTO')
    .split(/;\s*(?:\r?\n|$)/)
    .map(statement => statement.trim())
    .filter(Boolean);
}

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );

  return rows[0].count > 0;
}

async function ensureColumns(connection) {
  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    for (const [columnName, definition] of columns) {
      if (!(await columnExists(connection, tableName, columnName))) {
        await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
      }
    }
  }
}

async function seedFeatureData(connection) {
  await connection.query(
    `UPDATE users
     SET password = ?
     WHERE email = 'admin@vinyardburger.com'`,
    ['$2b$10$DDIG03LHz2b4yAE6yG28K.ZN.vnMQTSSDx4ONR1bdtPmVT.18SoYm']
  );
  await connection.query(`UPDATE menu_items SET cost_to_make = price * 0.4 WHERE cost_to_make = 0 OR cost_to_make IS NULL`);
  await connection.query(`
    INSERT IGNORE INTO promo_codes (code, description, discount_type, discount_value, valid_from, valid_until, max_uses)
    VALUES
      ('SCRATCH-FRIES-001', 'Free Solo Fries scratch reward', 'free_item', 0.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), NULL),
      ('SCRATCH-DRINK-001', 'Free drink upgrade scratch reward', 'free_item', 0.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), NULL),
      ('SCRATCH-10OFF-001', '10% off next order scratch reward', 'percentage', 10.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), NULL)
  `);
  await connection.query(`
    INSERT IGNORE INTO happy_hour_promotions
      (name, description, discount_percentage, applicable_days, start_time, end_time, applicable_categories, banner_text)
    VALUES
      ('Weekday Afternoon Special', 'Selected menu items are discounted during slow afternoon hours.', 10.00, 'monday,tuesday,wednesday,thursday,friday', '14:00:00', '16:00:00', JSON_ARRAY(2,4,9), 'Happy Hour Active!')
  `);
}

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    for (const statement of ddl) {
      await connection.query(statement);
    }

    await ensureColumns(connection);

    const seedSql = fs.readFileSync(schemaPath, 'utf8');
    for (const statement of splitSql(seedSql)) {
      await connection.query(statement);
    }

    await seedFeatureData(connection);
    console.log(`Database migration complete for ${dbConfig.database}.`);
  } finally {
    await connection.end();
  }
}

migrate().catch(error => {
  console.error('Database migration failed:', error.message);
  process.exit(1);
});
