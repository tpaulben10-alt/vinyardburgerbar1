const express = require('express');
const router = express.Router();
const { pool } = require('../db.cjs');

const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');

// =====================================================
// FEATURE 1: Smart Upselling & Cross-Selling
// =====================================================

// Get upsell suggestions for a menu item
router.get('/upsell/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Get upsell relationships
    const [upsells] = await pool.execute(
      `SELECT ur.*, mi.name, mi.description, mi.price, mi.image_url,
        (mi.price - ur.discount_amount) as bundle_price
       FROM upsell_relationships ur
       JOIN menu_items mi ON ur.suggested_item_id = mi.id
       WHERE ur.primary_item_id = ? AND ur.is_active = true AND mi.is_available = true
       ORDER BY ur.priority ASC`,
      [itemId]
    );
    
    // Get primary item details
    const [primaryItem] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [itemId]
    );
    
    res.json({
      primary_item: primaryItem[0] || null,
      upsell_options: upsells
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bundle deal (meal deal calculation)
router.post('/upsell/calculate-bundle', async (req, res) => {
  try {
    const { primary_item_id, addon_ids = [] } = req.body;
    
    // Get primary item
    const [primary] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [primary_item_id]
    );
    
    if (primary.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    let total = primary[0].price;
    let savings = 0;
    const items = [primary[0]];
    
    // Get add-ons with discounts
    if (addon_ids.length > 0) {
      const [upsells] = await pool.execute(
        `SELECT ur.*, mi.name, mi.price 
         FROM upsell_relationships ur
         JOIN menu_items mi ON ur.suggested_item_id = mi.id
         WHERE ur.primary_item_id = ? AND ur.suggested_item_id IN (?)`,
        [primary_item_id, addon_ids]
      );
      
      upsells.forEach(upsell => {
        total += (upsell.price - upsell.discount_amount);
        savings += upsell.discount_amount;
        items.push({
          ...upsell,
          discounted_price: upsell.price - upsell.discount_amount
        });
      });
    }
    
    res.json({
      items,
      original_total: items.reduce((sum, item) => sum + (item.price || 0), 0),
      bundle_total: total,
      savings: savings,
      message: savings > 0 ? `Save ₱${savings.toFixed(2)} with this bundle!` : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// FEATURE 3: Advanced Cart Customization
// =====================================================

// Get add-ons and removals for a menu item
router.get('/customizations/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const [addons] = await pool.execute(
      'SELECT * FROM menu_item_addons WHERE menu_item_id = ? AND is_active = true',
      [itemId]
    );
    
    const [removals] = await pool.execute(
      'SELECT * FROM menu_item_removals WHERE menu_item_id = ? AND is_active = true',
      [itemId]
    );
    
    res.json({
      addons,
      removals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Add add-on to menu item
router.post('/admin/addons', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { menu_item_id, name, price } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO menu_item_addons (menu_item_id, name, price) VALUES (?, ?, ?)',
      [menu_item_id, name, price]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Add-on created' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Add removal option to menu item
router.post('/admin/removals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { menu_item_id, name } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO menu_item_removals (menu_item_id, name) VALUES (?, ?)',
      [menu_item_id, name]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Removal option created' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// FEATURE 4: Expense Tracker & Profit Analytics
// =====================================================

// Admin: Create expense
router.post('/admin/expenses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { description, amount, expense_date, category, notes } = req.body;
    const userId = req.user.userId;
    
    const [result] = await pool.execute(
      'INSERT INTO expenses (description, amount, expense_date, category, created_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [description, amount, expense_date, category, userId, notes]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Expense recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get expenses
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
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY expense_date DESC';
    
    const [expenses] = await pool.execute(query, params);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get profit analytics
router.get('/admin/profit-analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to current month if no dates provided
    const start = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = end_date || new Date().toISOString().split('T')[0];
    
    // Get sales data
    const [salesData] = await pool.execute(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as gross_sales,
        SUM(cost_to_make) as cost_of_goods
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE DATE(o.created_at) BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [start, end]
    );
    
    // Get expenses data
    const [expensesData] = await pool.execute(
      `SELECT 
        expense_date as date,
        category,
        SUM(amount) as total
       FROM expenses
       WHERE expense_date BETWEEN ? AND ?
       GROUP BY expense_date, category
       ORDER BY expense_date`,
      [start, end]
    );
    
    // Calculate totals
    const totalSales = salesData.reduce((sum, day) => sum + parseFloat(day.gross_sales || 0), 0);
    const totalCost = salesData.reduce((sum, day) => sum + parseFloat(day.cost_of_goods || 0), 0);
    const totalExpenses = expensesData.reduce((sum, exp) => sum + parseFloat(exp.total || 0), 0);
    
    res.json({
      period: { start, end },
      summary: {
        gross_sales: totalSales,
        cost_of_goods: totalCost,
        gross_profit: totalSales - totalCost,
        expenses: totalExpenses,
        net_profit: totalSales - totalCost - totalExpenses,
        profit_margin: totalSales > 0 ? ((totalSales - totalCost - totalExpenses) / totalSales * 100).toFixed(2) : 0
      },
      daily_sales: salesData,
      expenses_by_category: expensesData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update menu item cost
router.put('/admin/menu/:id/cost', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { cost_to_make } = req.body;
    
    await pool.execute(
      'UPDATE menu_items SET cost_to_make = ? WHERE id = ?',
      [cost_to_make, req.params.id]
    );
    
    res.json({ message: 'Cost updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// FEATURE 5: Kitchen Display System (KDS)
// =====================================================

// Admin: Get orders for KDS
router.get('/admin/kds/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, u.name as customer_name,
        TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as pending_minutes,
        o.estimated_prep_time,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'name', mi.name,
            'quantity', oi.quantity,
            'customizations', oi.customizations
          )
        ) FROM order_items oi 
        JOIN menu_items mi ON oi.menu_item_id = mi.id 
        WHERE oi.order_id = o.id) as items
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status IN ('confirmed', 'preparing', 'ready')
       ORDER BY o.created_at ASC`
    );
    
    // Add urgency level
    const ordersWithUrgency = orders.map(order => {
      const pending = order.pending_minutes || 0;
      let urgency = 'normal';
      let color = 'green';
      
      if (pending > 25) {
        urgency = 'critical';
        color = 'red';
      } else if (pending > 15) {
        urgency = 'warning';
        color = 'orange';
      }
      
      return {
        ...order,
        urgency,
        color,
        items: JSON.parse(order.items || '[]')
      };
    });
    
    res.json(ordersWithUrgency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update kitchen started time
router.put('/admin/kds/:orderId/start', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE orders SET kitchen_started_at = NOW(), status = "preparing" WHERE id = ?',
      [req.params.orderId]
    );
    
    res.json({ message: 'Kitchen started' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Mark order as ready
router.put('/admin/kds/:orderId/ready', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE orders SET kitchen_completed_at = NOW(), status = "ready" WHERE id = ?',
      [req.params.orderId]
    );
    
    res.json({ message: 'Order ready' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// FEATURE 6: Delivery Route Map Data
// =====================================================

// Admin: Get active delivery orders with coordinates
router.get('/admin/delivery-routes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.id, o.delivery_address, o.latitude, o.longitude, 
        o.status, o.created_at, u.name as customer_name, u.phone as customer_phone,
        o.total_amount
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status IN ('preparing', 'ready', 'out_for_delivery')
       AND o.latitude IS NOT NULL
       ORDER BY o.created_at ASC`
    );
    
    // Store location (Hinunangan, Southern Leyte)
    const storeLocation = {
      lat: 10.3971559,
      lng: 125.1983495,
      name: 'Vinyard Burger Bar',
      address: 'Catmonan St., Poblacion, Hinunangan, Philippines'
    };
    
    res.json({
      store: storeLocation,
      deliveries: orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// FEATURE 7: Scratch Card Rewards
// =====================================================

// Generate scratch card reward after review
router.post('/reviews/scratch-reward', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Random reward selection
    const rewards = [
      { type: 'promo', value: 'SCRATCH-FRIES-001', description: 'Free Solo Fries' },
      { type: 'promo', value: 'SCRATCH-DRINK-001', description: 'Free Drink Upgrade' },
      { type: 'promo', value: 'SCRATCH-10OFF-001', description: '10% Off Next Order' },
      { type: 'points', value: 50, description: '50 Bonus Points' }
    ];
    
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    if (reward.type === 'points') {
      // Add loyalty points
      await pool.execute(
        'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
        [reward.value, userId]
      );
    } else {
      // Assign promo code to user
      const [promo] = await pool.execute(
        'SELECT id FROM promo_codes WHERE code = ?',
        [reward.value]
      );
      
      if (promo.length > 0) {
        await pool.execute(
          'INSERT INTO user_promo_codes (user_id, promo_code_id) VALUES (?, ?)',
          [userId, promo[0].id]
        );
      }
    }
    
    res.json({
      reward: reward,
      message: `Congratulations! You won ${reward.description}!`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's available promo codes
router.get('/my-promo-codes', authenticateToken, async (req, res) => {
  try {
    const [codes] = await pool.execute(
      `SELECT pc.*, upc.redeemed_at, upc.order_id
       FROM promo_codes pc
       JOIN user_promo_codes upc ON pc.id = upc.promo_code_id
       WHERE upc.user_id = ? 
       AND pc.is_active = true
       AND pc.valid_until >= CURDATE()
       AND (pc.max_uses IS NULL OR pc.current_uses < pc.max_uses)
       AND upc.order_id IS NULL`,
      [req.user.userId]
    );
    
    res.json(codes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// FEATURE 8: Happy Hour / Slow-Day Discounts
// =====================================================

// Check if happy hour is active
router.get('/happy-hour/status', async (req, res) => {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const [promotions] = await pool.execute(
      `SELECT * FROM happy_hour_promotions 
       WHERE is_active = true
       AND start_time <= ?
       AND end_time >= ?
       AND FIND_IN_SET(?, applicable_days)
       LIMIT 1`,
      [currentTime, currentTime, currentDay]
    );
    
    if (promotions.length > 0) {
      const promo = promotions[0];
      const categories = JSON.parse(promo.applicable_categories || '[]');
      
      // Get applicable menu items
      const [items] = await pool.execute(
        `SELECT * FROM menu_items 
         WHERE category_id IN (?) 
         AND is_available = true`,
        [categories]
      );
      
      res.json({
        active: true,
        promotion: promo,
        discounted_items: items.map(item => ({
          ...item,
          original_price: item.price,
          discounted_price: (item.price * (1 - promo.discount_percentage / 100)).toFixed(2),
          discount_percentage: promo.discount_percentage
        }))
      });
    } else {
      res.json({ active: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create happy hour promotion
router.post('/admin/happy-hour', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, discount_percentage, applicable_days, start_time, end_time, applicable_categories, banner_text } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO happy_hour_promotions 
       (name, description, discount_percentage, applicable_days, start_time, end_time, applicable_categories, banner_text) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, discount_percentage, applicable_days, start_time, end_time, JSON.stringify(applicable_categories), banner_text]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Happy hour promotion created' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// FEATURE 2: Notifications API
// =====================================================

// Update user notification preference
router.put('/notifications/preference', authenticateToken, async (req, res) => {
  try {
    const { enabled, token } = req.body;
    
    await pool.execute(
      'UPDATE users SET notification_enabled = ?, notification_token = ? WHERE id = ?',
      [enabled, token, req.user.userId]
    );
    
    res.json({ message: 'Notification preference updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50',
      [req.user.userId]
    );
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
