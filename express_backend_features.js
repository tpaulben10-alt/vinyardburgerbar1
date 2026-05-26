/**
 * Vinyard Burger Bar - Express.js Backend
 * 8 Features Implementation
 * Philippine Peso (₱) Currency Support
 * 100% Free - No Paid APIs
 */

const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const router = express.Router();

// Database Pool Configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vinyard_burger_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const JWT_SECRET = process.env.JWT_SECRET || 'vinyard-burger-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

// =====================================================
// FEATURE 8: HAPPY HOUR MIDDLEWARE
// =====================================================

/**
 * Happy Hour Middleware
 * Automatically applies discounts based on server time
 */
const applyHappyHourDiscount = async (req, res, next) => {
  try {
    // Get current server time in Philippines timezone
    const now = new Date();
    const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentTime = phTime.toTimeString().slice(0, 8); // HH:MM:SS
    const currentDay = phTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check for active happy hour promotions
    const [promotions] = await pool.execute(
      `SELECT * FROM happy_hour_schedules 
       WHERE is_active = TRUE
       AND start_time <= ?
       AND end_time >= ?
       AND FIND_IN_SET(?, applicable_days)
       ORDER BY priority DESC
       LIMIT 1`,
      [currentTime, currentTime, currentDay]
    );
    
    req.happyHour = promotions.length > 0 ? promotions[0] : null;
    next();
  } catch (error) {
    console.error('Happy Hour Middleware Error:', error);
    req.happyHour = null;
    next();
  }
};

// =====================================================
// FEATURE 1: SMART UPSELLING ROUTES
// =====================================================

// GET /api/upsell/:itemId - Get upsell suggestions for an item
router.get('/upsell/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const [upsells] = await pool.execute(
      `SELECT 
        ur.id,
        ur.bundle_name,
        ur.bundle_discount_percent,
        mi.id as suggested_item_id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        ROUND(mi.price * (1 - ur.bundle_discount_percent / 100), 2) as discounted_price,
        ROUND(mi.price * ur.bundle_discount_percent / 100, 2) as you_save
       FROM upsell_relationships ur
       JOIN menu_items mi ON ur.suggested_item_id = mi.id
       WHERE ur.primary_item_id = ? 
       AND ur.is_active = TRUE 
       AND mi.is_available = TRUE
       ORDER BY ur.display_order ASC`,
      [itemId]
    );
    
    // Calculate bundle deal
    const [primaryItem] = await pool.execute(
      'SELECT id, name, price FROM menu_items WHERE id = ?',
      [itemId]
    );
    
    const bundleDeal = {
      primary_item: primaryItem[0] || null,
      upsell_options: upsells,
      bundle_savings: upsells.reduce((sum, u) => sum + parseFloat(u.you_save), 0)
    };
    
    res.json({
      success: true,
      data: bundleDeal,
      message: upsells.length > 0 ? 'Make it a meal!' : null
    });
  } catch (error) {
    console.error('Upsell Error:', error);
    res.status(500).json({ error: 'Failed to fetch upsell suggestions.' });
  }
});

// POST /api/calculate-bundle - Calculate bundle price with discount
router.post('/calculate-bundle', async (req, res) => {
  try {
    const { primary_item_id, suggested_items = [] } = req.body;
    
    // Get primary item price
    const [primary] = await pool.execute(
      'SELECT price FROM menu_items WHERE id = ?',
      [primary_item_id]
    );
    
    if (!primary.length) {
      return res.status(404).json({ error: 'Primary item not found.' });
    }
    
    let total = parseFloat(primary[0].price);
    let originalTotal = total;
    
    // Calculate with upsell discounts
    if (suggested_items.length > 0) {
      const [upsells] = await pool.execute(
        `SELECT ur.bundle_discount_percent, mi.price
         FROM upsell_relationships ur
         JOIN menu_items mi ON ur.suggested_item_id = mi.id
         WHERE ur.primary_item_id = ? AND ur.suggested_item_id IN (?)`,
        [primary_item_id, suggested_items]
      );
      
      upsells.forEach(upsell => {
        const discount = parseFloat(upsell.bundle_discount_percent);
        const itemPrice = parseFloat(upsell.price);
        const discountedPrice = itemPrice * (1 - discount / 100);
        
        total += discountedPrice;
        originalTotal += itemPrice;
      });
    }
    
    const savings = originalTotal - total;
    
    res.json({
      success: true,
      data: {
        original_total: originalTotal,
        bundle_total: total,
        savings: savings,
        savings_percent: originalTotal > 0 ? ((savings / originalTotal) * 100).toFixed(1) : 0,
        message: savings > 0 ? `Save ₱${savings.toFixed(2)} with this bundle!` : null
      }
    });
  } catch (error) {
    console.error('Bundle Calculation Error:', error);
    res.status(500).json({ error: 'Failed to calculate bundle price.' });
  }
});

// =====================================================
// FEATURE 3: CART CUSTOMIZATION ROUTES
// =====================================================

// GET /api/customizations/:itemId - Get add-ons and removals
router.get('/customizations/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const [addons] = await pool.execute(
      `SELECT id, name, price 
       FROM menu_item_addons 
       WHERE menu_item_id = ? AND is_active = TRUE
       ORDER BY display_order ASC`,
      [itemId]
    );
    
    const [removals] = await pool.execute(
      `SELECT id, name 
       FROM menu_item_removals 
       WHERE menu_item_id = ? AND is_active = TRUE`,
      [itemId]
    );
    
    res.json({
      success: true,
      data: {
        addons: addons.map(a => ({ ...a, price: parseFloat(a.price) })),
        removals
      }
    });
  } catch (error) {
    console.error('Customization Error:', error);
    res.status(500).json({ error: 'Failed to fetch customizations.' });
  }
});

// Admin: Manage add-ons
router.post('/admin/addons', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { menu_item_id, name, price, display_order = 0 } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO menu_item_addons (menu_item_id, name, price, display_order) VALUES (?, ?, ?, ?)',
      [menu_item_id, name, price, display_order]
    );
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Add-on created successfully.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create add-on.' });
  }
});

// Admin: Manage removals
router.post('/admin/removals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { menu_item_id, name } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO menu_item_removals (menu_item_id, name) VALUES (?, ?)',
      [menu_item_id, name]
    );
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Removal option created successfully.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create removal option.' });
  }
});

// =====================================================
// FEATURE 4: EXPENSE TRACKER & PROFIT ANALYTICS
// =====================================================

// POST /api/admin/expenses - Create expense
router.post('/admin/expenses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { description, amount, expense_date, category = 'miscellaneous', notes = '' } = req.body;
    
    if (!description || !amount || !expense_date) {
      return res.status(400).json({ error: 'Description, amount, and date are required.' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO expenses (description, amount, expense_date, category, created_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [description, amount, expense_date, category, req.user.userId, notes]
    );
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Expense recorded successfully.'
    });
  } catch (error) {
    console.error('Create Expense Error:', error);
    res.status(500).json({ error: 'Failed to record expense.' });
  }
});

// GET /api/admin/expenses - Get expenses with filters
router.get('/admin/expenses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, category } = req.query;
    
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    
    if (start_date) {
      query += ' AND expense_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND expense_date <= ?';
      params.push(end_date);
    }
    
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY expense_date DESC, created_at DESC';
    
    const [expenses] = await pool.execute(query, params);
    
    // Calculate totals by category
    const totals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      acc.total = (acc.total || 0) + parseFloat(exp.amount);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: expenses,
      summary: totals
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

// DELETE /api/admin/expenses/:id - Delete expense
router.delete('/admin/expenses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

// GET /api/analytics/daily-summary - Profit analytics
router.get('/analytics/daily-summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const start = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = end_date || new Date().toISOString().split('T')[0];
    
    // Get sales data with cost calculations
    const [salesData] = await pool.execute(
      `SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as gross_sales,
        SUM(
          (SELECT SUM(mi.cost_to_make * oi.quantity)
           FROM order_items oi
           JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE oi.order_id = o.id)
        ) as cost_of_goods
       FROM orders o
       WHERE DATE(o.created_at) BETWEEN ? AND ?
       AND o.status != 'cancelled'
       GROUP BY DATE(o.created_at)
       ORDER BY date`,
      [start, end]
    );
    
    // Get expenses for the period
    const [expensesData] = await pool.execute(
      `SELECT 
        expense_date as date,
        category,
        SUM(amount) as amount
       FROM expenses
       WHERE expense_date BETWEEN ? AND ?
       GROUP BY expense_date, category`,
      [start, end]
    );
    
    // Calculate summary totals
    const grossSales = salesData.reduce((sum, d) => sum + parseFloat(d.gross_sales || 0), 0);
    const costOfGoods = salesData.reduce((sum, d) => sum + parseFloat(d.cost_of_goods || 0), 0);
    const totalExpenses = expensesData.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const grossProfit = grossSales - costOfGoods;
    const netProfit = grossProfit - totalExpenses;
    
    res.json({
      success: true,
      period: { start, end },
      summary: {
        gross_sales: grossSales,
        cost_of_goods: costOfGoods,
        gross_profit: grossProfit,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        profit_margin: grossSales > 0 ? ((netProfit / grossSales) * 100).toFixed(2) : 0,
        total_orders: salesData.reduce((sum, d) => sum + parseInt(d.total_orders), 0)
      },
      daily_breakdown: salesData,
      expenses_by_category: expensesData.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// PUT /api/admin/menu/:id/cost - Update item cost
router.put('/admin/menu/:id/cost', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { cost_to_make } = req.body;
    await pool.execute('UPDATE menu_items SET cost_to_make = ? WHERE id = ?', [cost_to_make, req.params.id]);
    res.json({ success: true, message: 'Cost updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cost.' });
  }
});

// =====================================================
// FEATURE 5: KITCHEN DISPLAY SYSTEM ROUTES
// =====================================================

// GET /api/admin/kds/orders - Get orders for KDS
router.get('/admin/kds/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT 
        o.id,
        o.status,
        o.created_at,
        o.estimated_prep_minutes,
        u.name as customer_name,
        TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as pending_minutes,
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) > 25 THEN 'critical'
          WHEN TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) > 15 THEN 'warning'
          ELSE 'normal'
        END as urgency_level,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'name', mi.name,
            'quantity', oi.quantity,
            'addons', JSON_EXTRACT(oi.customizations, '$.addons'),
            'removals', JSON_EXTRACT(oi.customizations, '$.removals')
          )
        )
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = o.id
        ) as items
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status IN ('confirmed', 'preparing', 'ready')
       ORDER BY o.created_at ASC`
    );
    
    // Parse items JSON
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]')
    }));
    
    res.json({ success: true, data: parsedOrders });
  } catch (error) {
    console.error('KDS Error:', error);
    res.status(500).json({ error: 'Failed to fetch KDS orders.' });
  }
});

// PUT /api/admin/kds/:orderId/start - Start preparing
router.put('/admin/kds/:orderId/start', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE orders SET status = "preparing", kitchen_accepted_at = NOW() WHERE id = ?',
      [req.params.orderId]
    );
    res.json({ success: true, message: 'Order started.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start order.' });
  }
});

// PUT /api/admin/kds/:orderId/ready - Mark as ready
router.put('/admin/kds/:orderId/ready', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE orders SET status = "ready", kitchen_completed_at = NOW() WHERE id = ?',
      [req.params.orderId]
    );
    res.json({ success: true, message: 'Order ready.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete order.' });
  }
});

// =====================================================
// FEATURE 6: DELIVERY ROUTE MAP ROUTES
// =====================================================

// GET /api/admin/delivery-routes - Get active deliveries with coordinates
router.get('/admin/delivery-routes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT 
        o.id,
        o.delivery_address,
        o.latitude,
        o.longitude,
        o.status,
        o.total_amount,
        o.created_at,
        u.name as customer_name,
        u.phone as customer_phone,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('name', mi.name, 'quantity', oi.quantity)
        )
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = o.id
        ) as items
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status IN ('ready', 'out_for_delivery')
       AND o.latitude IS NOT NULL
       ORDER BY o.created_at ASC`
    );
    
    const deliveries = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]')
    }));
    
    // Store location at Hinunangan, Southern Leyte
    res.json({
      success: true,
      data: {
        store_location: {
          lat: 10.3971559,
          lng: 125.1983495,
          name: 'Vinyard Burger Bar',
          address: 'Catmonan St., Poblacion, Hinunangan, Philippines'
        },
        deliveries
      }
    });
  } catch (error) {
    console.error('Delivery Routes Error:', error);
    res.status(500).json({ error: 'Failed to fetch delivery routes.' });
  }
});

// =====================================================
// FEATURE 7: SCRATCH CARD REWARDS ROUTES
// =====================================================

// POST /api/scratch-reward - Generate scratch card reward
router.post('/scratch-reward', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Define possible rewards
    const rewards = [
      { type: 'promo', code: 'SCRATCH-FRIES', description: 'Free Solo Fries', value: 85 },
      { type: 'promo', code: 'SCRATCH-DRINK', description: 'Free Drink Upgrade', value: 35 },
      { type: 'promo', code: 'SCRATCH-10OFF', description: '10% Off Next Order', value: 10 },
      { type: 'points', description: '50 Bonus Points', value: 50 }
    ];
    
    // Randomly select reward
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    if (reward.type === 'points') {
      // Add loyalty points directly
      await pool.execute(
        'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
        [reward.value, userId]
      );
      
      res.json({
        success: true,
        reward: {
          type: 'points',
          description: reward.description,
          value: reward.value
        },
        message: `Congratulations! You won ${reward.description}!`
      });
    } else {
      // Assign promo code to user
      const [promo] = await pool.execute(
        'SELECT id FROM promo_codes WHERE code = ?',
        [reward.code]
      );
      
      if (promo.length > 0) {
        await pool.execute(
          'INSERT INTO user_promo_codes (user_id, promo_code_id) VALUES (?, ?)',
          [userId, promo[0].id]
        );
      }
      
      res.json({
        success: true,
        reward: {
          type: 'promo',
          description: reward.description,
          code: reward.code
        },
        message: `Congratulations! You won ${reward.description}!`
      });
    }
  } catch (error) {
    console.error('Scratch Reward Error:', error);
    res.status(500).json({ error: 'Failed to generate reward.' });
  }
});

// GET /api/my-promo-codes - Get user's active promo codes
router.get('/my-promo-codes', authenticateToken, async (req, res) => {
  try {
    const [codes] = await pool.execute(
      `SELECT 
        pc.id,
        pc.code,
        pc.description,
        pc.reward_type,
        pc.reward_value,
        pc.valid_until,
        upc.assigned_at
       FROM promo_codes pc
       JOIN user_promo_codes upc ON pc.id = upc.promo_code_id
       WHERE upc.user_id = ? 
       AND upc.status = 'active'
       AND pc.valid_until >= CURDATE()
       ORDER BY upc.assigned_at DESC`,
      [req.user.userId]
    );
    
    res.json({ success: true, data: codes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promo codes.' });
  }
});

// =====================================================
// FEATURE 8: HAPPY HOUR ROUTES
// =====================================================

// GET /api/happy-hour/status - Check if happy hour is active
router.get('/happy-hour/status', async (req, res) => {
  try {
    // Get Philippines time
    const now = new Date();
    const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentTime = phTime.toTimeString().slice(0, 8);
    const currentDay = phTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const [promotions] = await pool.execute(
      `SELECT 
        id,
        name,
        description,
        discount_percent,
        banner_text,
        applicable_categories,
        start_time,
        end_time
       FROM happy_hour_schedules 
       WHERE is_active = TRUE
       AND ? BETWEEN start_time AND end_time
       AND FIND_IN_SET(?, applicable_days)
       ORDER BY priority DESC
       LIMIT 1`,
      [currentTime, currentDay]
    );
    
    if (promotions.length > 0) {
      const promo = promotions[0];
      const categories = JSON.parse(promo.applicable_categories);
      
      // Get applicable items with discounted prices
      const [items] = await pool.execute(
        `SELECT 
          id,
          name,
          price as original_price,
          ROUND(price * (1 - ? / 100), 2) as discounted_price
         FROM menu_items
         WHERE category_id IN (?)
         AND is_available = TRUE`,
        [promo.discount_percent, categories]
      );
      
      res.json({
        success: true,
        active: true,
        data: {
          ...promo,
          discount_percent: parseFloat(promo.discount_percent),
          discounted_items: items
        }
      });
    } else {
      res.json({ success: true, active: false });
    }
  } catch (error) {
    console.error('Happy Hour Error:', error);
    res.status(500).json({ error: 'Failed to check happy hour status.' });
  }
});

// POST /api/admin/happy-hour - Create happy hour schedule (Admin)
router.post('/admin/happy-hour', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      discount_percent,
      applicable_days,
      start_time,
      end_time,
      applicable_categories,
      banner_text
    } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO happy_hour_schedules 
       (name, description, discount_percent, applicable_days, start_time, end_time, applicable_categories, banner_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, discount_percent, applicable_days, start_time, end_time, 
       JSON.stringify(applicable_categories), banner_text]
    );
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Happy hour schedule created.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create happy hour schedule.' });
  }
});

// =====================================================
// FEATURE 2: NOTIFICATION PREFERENCES
// =====================================================

// PUT /api/notifications/preference - Update notification settings
router.put('/notifications/preference', authenticateToken, async (req, res) => {
  try {
    const { enabled, token } = req.body;
    
    await pool.execute(
      'UPDATE users SET notifications_enabled = ?, notification_token = ? WHERE id = ?',
      [enabled, token || null, req.user.userId]
    );
    
    res.json({ success: true, message: 'Notification preference updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preference.' });
  }
});

// POST /api/notifications/send - Send notification (internal use)
router.post('/notifications/send', authenticateToken, async (req, res) => {
  try {
    const { user_id, order_id, type, title, message } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO notifications_log (user_id, order_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
      [user_id, order_id, type, title, message]
    );
    
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log notification.' });
  }
});

// Export router and middleware
module.exports = {
  router,
  authenticateToken,
  requireAdmin,
  applyHappyHourDiscount
};