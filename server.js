require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const initDB = require('./db/init');

// Auto-run schema on startup
initDB();

const app = express();
const PORT = process.env.PORT || 3000;

// ── DATABASE ──────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test DB connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected');
    release();
  }
});

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── ROUTES: MENU ──────────────────────────────────────────

// GET /api/menu  — all categories with their items
app.get('/api/menu', async (req, res) => {
  try {
    const categories = await pool.query(
      `SELECT * FROM categories ORDER BY display_order`
    );
    const items = await pool.query(
      `SELECT * FROM menu_items WHERE is_available = TRUE ORDER BY subcategory, id`
    );

    const menu = categories.rows.map(cat => ({
      ...cat,
      items: items.rows.filter(item => item.category_id === cat.id),
    }));

    res.json(menu);
  } catch (err) {
    console.error('GET /api/menu error:', err);
    res.status(500).json({ error: 'Failed to load menu' });
  }
});

// GET /api/menu/search?q=paneer
app.get('/api/menu/search', async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  try {
    const result = await pool.query(
      `SELECT mi.*, c.name AS category_name
       FROM menu_items mi
       JOIN categories c ON c.id = mi.category_id
       WHERE mi.is_available = TRUE
         AND (mi.name ILIKE $1 OR mi.description ILIKE $1)
       ORDER BY mi.name LIMIT 30`,
      [q]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/menu/search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── ROUTES: ORDERS ────────────────────────────────────────

// POST /api/orders  — place a new order
app.post('/api/orders', async (req, res) => {
  const { room_number, guest_name, special_note, items } = req.body;

  if (!room_number || !items || items.length === 0) {
    return res.status(400).json({ error: 'room_number and items are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate total
    const total = items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (room_number, guest_name, special_note, total_amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [room_number, guest_name || null, special_note || null, total]
    );
    const order = orderResult.rows[0];

    // Insert order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.menu_item_id, item.item_name, item.unit_price, item.quantity]
      );
    }

    await client.query('COMMIT');

    // Return full order with items
    const fullOrder = await getOrderById(pool, order.id);
    res.status(201).json(fullOrder);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    client.release();
  }
});

// GET /api/orders  — all orders (kitchen view), optional ?status=pending
app.get('/api/orders', async (req, res) => {
  const { status, room } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (status) {
    params.push(status);
    where += ` AND o.status = $${params.length}`;
  }
  if (room) {
    params.push(room);
    where += ` AND o.room_number ILIKE $${params.length}`;
  }

  try {
    const result = await pool.query(
      `SELECT o.*,
         json_agg(json_build_object(
           'id', oi.id,
           'menu_item_id', oi.menu_item_id,
           'item_name', oi.item_name,
           'unit_price', oi.unit_price,
           'quantity', oi.quantity,
           'subtotal', oi.subtotal
         ) ORDER BY oi.id) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 200`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await getOrderById(pool, req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('GET /api/orders/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id/status  — update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /api/orders/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/orders/:id  — cancel order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE orders SET status='cancelled', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// ── ROUTES: STATS ─────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='pending')   AS pending,
        COUNT(*) FILTER (WHERE status='preparing') AS preparing,
        COUNT(*) FILTER (WHERE status='ready')     AS ready,
        COUNT(*) FILTER (WHERE status='delivered') AS delivered,
        COUNT(*)                                    AS total,
        COALESCE(SUM(total_amount) FILTER (WHERE status='delivered'), 0) AS revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── HELPER ────────────────────────────────────────────────
async function getOrderById(pool, id) {
  const result = await pool.query(
    `SELECT o.*,
       json_agg(json_build_object(
         'id', oi.id,
         'item_name', oi.item_name,
         'unit_price', oi.unit_price,
         'quantity', oi.quantity,
         'subtotal', oi.subtotal
       ) ORDER BY oi.id) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = $1
     GROUP BY o.id`,
    [id]
  );
  return result.rows[0] || null;
}

// ── CATCH-ALL → index.html ────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽️  Riversongs Order App running on port ${PORT}`);
});