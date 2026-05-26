const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const { pool } = require('./db.cjs');
const { authenticateToken, requireAdmin } = require('./middleware/auth.cjs');
const featureRoutes = require('./routes/features.cjs');
require('dotenv').config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'vinyard-burger-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const distPath = path.resolve(__dirname, '..', 'dist');

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ status: 'OK', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'unavailable' });
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role = 'customer' } = req.body;
    
    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, address, role, loyalty_points) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [name, email, hashedPassword, phone, address, role]
    );
    
    // Generate token
    const token = jwt.sign(
      { userId: result.insertId, email, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.insertId, name, email, role, loyalty_points: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW(), is_online = true WHERE id = ?',
      [user.id]
    );
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        loyalty_points: user.loyalty_points,
        is_online: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google login is not configured' });
    }

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, email_verified: emailVerified, name, picture } = payload || {};

    if (!googleId || !email || !emailVerified) {
      return res.status(401).json({ message: 'Google account email must be verified' });
    }
    
    // Check if user exists by Google ID first, then by email for account linking.
    const [existing] = await pool.execute(
      `SELECT * FROM users
       WHERE google_id = ? OR email = ?
       ORDER BY CASE WHEN google_id = ? THEN 0 ELSE 1 END
       LIMIT 1`,
      [googleId, email, googleId]
    );

    const displayName = name || email.split('@')[0];
    let user = existing[0];

    if (user) {
      if (!user.google_id) {
        await pool.execute(
          'UPDATE users SET google_id = ?, avatar = COALESCE(avatar, ?) WHERE id = ?',
          [googleId, picture || null, user.id]
        );
        user.google_id = googleId;
        user.avatar = user.avatar || picture || null;
      }
    } else {
      const [result] = await pool.execute(
        `INSERT INTO users
          (google_id, name, email, password, phone, address, role, loyalty_points, avatar)
         VALUES (?, ?, ?, NULL, '', '', 'customer', 0, ?)`,
        [googleId, displayName, email, picture || null]
      );

      const [createdUsers] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );
      user = createdUsers[0];
    }

    if (!user) {
      return res.status(500).json({ message: 'Unable to create Google account' });
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW(), is_online = true WHERE id = ?',
      [user.id]
    );

    const [freshUsers] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [user.id]
    );
    user = freshUsers[0] || user;
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        loyalty_points: user.loyalty_points,
        avatar: user.avatar,
        is_online: true
      }
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A user already exists with this Google account or email' });
    }

    if (error?.message?.toLowerCase().includes('token')) {
      return res.status(401).json({ message: 'Invalid Google credential' });
    }

    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE users SET is_online = false WHERE id = ?',
      [req.user.userId]
    );
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, phone, address, role, loyalty_points, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    await pool.execute(
      'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone, address, req.user.userId]
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Menu Routes
app.get('/api/menu', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE is_active = true ORDER BY display_order'
    );
    
    const [items] = await pool.execute(
      'SELECT * FROM menu_items WHERE is_available = true ORDER BY category_id, name'
    );
    
    const menuData = categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.category_id === cat.id)
    }));
    
    res.json(menuData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/menu/:id', async (req, res) => {
  try {
    const [items] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [req.params.id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(items[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Order Routes
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, total_amount, delivery_address, latitude, longitude, payment_method, notes } = req.body;
    const userId = req.user.userId;
    
    // Calculate estimated time (15 mins base + 5 mins per item)
    const estimatedMinutes = 15 + (items.length * 5);
    const estimatedCompletion = new Date(Date.now() + estimatedMinutes * 60000);
    
    // Create order
    const [orderResult] = await pool.execute(
      `INSERT INTO orders 
       (user_id, total_amount, delivery_address, latitude, longitude, payment_method, notes, status, estimated_completion, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [userId, total_amount, delivery_address, latitude, longitude, payment_method, notes, estimatedCompletion]
    );
    
    const orderId = orderResult.insertId;
    
    // Insert order items
    for (const item of items) {
      await pool.execute(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price, customizations) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.price, JSON.stringify(item.customizations || {})]
      );
    }
    
    // Add loyalty points (1 point per 50 pesos)
    const pointsEarned = Math.floor(total_amount / 50);
    await pool.execute(
      'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
      [pointsEarned, userId]
    );
    
    res.status(201).json({
      message: 'Order placed successfully',
      orderId,
      estimated_completion: estimatedCompletion,
      points_earned: pointsEarned
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', oi.id, 'name', mi.name, 'quantity', oi.quantity, 'price', oi.price)
        ) FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = o.id) as items
       FROM orders o 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [req.user.userId]
    );
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [req.params.id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Check if user owns the order or is admin
    if (order.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const [items] = await pool.execute(
      `SELECT oi.*, mi.name, mi.image_url 
       FROM order_items oi 
       JOIN menu_items mi ON oi.menu_item_id = mi.id 
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    
    order.items = items;
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Routes
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = `
      SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.is_online
      FROM orders o 
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    if (date) {
      query += ' AND DATE(o.created_at) = ?';
      params.push(date);
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    const [orders] = await pool.execute(query, params);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );
    
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, phone, address, loyalty_points, is_online, last_login, created_at, role,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as total_orders
       FROM users 
       ORDER BY created_at DESC`
    );
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/online-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, is_online, last_login 
       FROM users 
       WHERE is_online = true AND role = 'customer'`
    );
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== 'admin' && role !== 'customer') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, req.params.id]
    );
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Today's orders
    const [todayOrders] = await pool.execute(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE DATE(created_at) = CURDATE()"
    );
    
    // Total customers
    const [customers] = await pool.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'customer'"
    );
    
    // Online customers
    const [onlineCustomers] = await pool.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND is_online = true"
    );
    
    // Pending orders
    const [pendingOrders] = await pool.execute(
      "SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'confirmed', 'preparing')"
    );
    
    // Monthly revenue
    const [monthlyRevenue] = await pool.execute(
      "SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())"
    );
    
    res.json({
      today_orders: todayOrders[0].count,
      today_revenue: todayOrders[0].revenue,
      total_customers: customers[0].count,
      online_customers: onlineCustomers[0].count,
      pending_orders: pendingOrders[0].count,
      monthly_revenue: monthlyRevenue[0].revenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Menu Management (Admin)
app.post('/api/admin/menu', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category_id, image_url, preparation_time } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO menu_items (name, description, price, category_id, image_url, preparation_time, is_available) VALUES (?, ?, ?, ?, ?, ?, true)',
      [name, description, price, category_id, image_url, preparation_time]
    );
    
    res.status(201).json({ message: 'Menu item added', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/menu/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category_id, image_url, preparation_time, is_available } = req.body;
    
    await pool.execute(
      'UPDATE menu_items SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, preparation_time = ?, is_available = ? WHERE id = ?',
      [name, description, price, category_id, image_url, preparation_time, is_available, req.params.id]
    );
    
    res.json({ message: 'Menu item updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ratings and Reviews
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    const userId = req.user.userId;
    
    // Verify order belongs to user and is delivered
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = "delivered"',
      [order_id, userId]
    );
    
    if (orders.length === 0) {
      return res.status(400).json({ message: 'Invalid order or order not delivered yet' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO reviews (user_id, order_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, order_id, rating, comment]
    );
    
    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.*, u.name as user_name, u.avatar 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.created_at DESC 
       LIMIT 20`
    );
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Loyalty Program
app.get('/api/loyalty/rewards', async (req, res) => {
  try {
    const [rewards] = await pool.execute(
      'SELECT * FROM loyalty_rewards WHERE is_active = true ORDER BY points_required'
    );
    
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/loyalty/redeem', authenticateToken, async (req, res) => {
  try {
    const { reward_id } = req.body;
    const userId = req.user.userId;
    
    // Get reward details
    const [rewards] = await pool.execute(
      'SELECT * FROM loyalty_rewards WHERE id = ? AND is_active = true',
      [reward_id]
    );
    
    if (rewards.length === 0) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    
    const reward = rewards[0];
    
    // Check user points
    const [users] = await pool.execute(
      'SELECT loyalty_points FROM users WHERE id = ?',
      [userId]
    );
    
    if (users[0].loyalty_points < reward.points_required) {
      return res.status(400).json({ message: 'Insufficient points' });
    }
    
    // Deduct points
    await pool.execute(
      'UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?',
      [reward.points_required, userId]
    );
    
    // Record redemption
    await pool.execute(
      'INSERT INTO loyalty_redemptions (user_id, reward_id, points_used, redeemed_at) VALUES (?, ?, ?, NOW())',
      [userId, reward_id, reward.points_required]
    );
    
    res.json({ message: 'Reward redeemed successfully', reward });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use('/api/features', featureRoutes);

app.use(express.static(distPath));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
