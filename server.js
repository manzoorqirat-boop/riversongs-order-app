require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { Category, MenuItem, Order } = require('./db/models');
const seedDatabase = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── DATABASE ──────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedDatabase();
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));

// ── ROUTES: MENU ──────────────────────────────────────────

// GET /api/menu
app.get('/api/menu', async (req, res) => {
  try {
    const categories = await Category.find().sort('display_order');
    const items = await MenuItem.find({ is_available: true });

    const menu = categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      display_order: cat.display_order,
      available_from: cat.available_from,
      available_to: cat.available_to,
      icon: cat.icon,
      items: items
        .filter(item => item.category_id.toString() === cat._id.toString())
        .map(item => ({
          id: item._id,
          category_id: item.category_id,
          subcategory: item.subcategory,
          name: item.name,
          description: item.description,
          price: item.price,
          is_veg: item.is_veg,
          is_available: item.is_available,
        })),
    }));

    res.json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load menu' });
  }
});

// GET /api/menu/search?q=paneer
app.get('/api/menu/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    const items = await MenuItem.find({
      is_available: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    }).limit(30);

    const categories = await Category.find();
    const result = items.map(item => {
      const cat = categories.find(c => c._id.toString() === item.category_id.toString());
      return {
        id: item._id,
        name: item.name,
        description: item.description,
        price: item.price,
        is_veg: item.is_veg,
        subcategory: item.subcategory,
        category_id: item.category_id,
        category_name: cat ? cat.name : '',
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── ROUTES: ORDERS ────────────────────────────────────────

// POST /api/orders
app.post('/api/orders', async (req, res) => {
  const { room_number, guest_name, special_note, items } = req.body;

  if (!room_number || !items || items.length === 0) {
    return res.status(400).json({ error: 'room_number and items are required' });
  }

  try {
    const total = items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);

    const order = new Order({
      room_number,
      guest_name: guest_name || null,
      special_note: special_note || null,
      total_amount: total,
      items: items.map(i => ({
        menu_item_id: i.menu_item_id,
        item_name: i.item_name,
        unit_price: i.unit_price,
        quantity: i.quantity,
        subtotal: i.unit_price * i.quantity,
      })),
    });

    await order.save();
    res.status(201).json(formatOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/orders
app.get('/api/orders', async (req, res) => {
  const { status, room } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (room) filter.room_number = { $regex: room, $options: 'i' };

  try {
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(orders.map(formatOrder));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(formatOrder(order));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['pending','preparing','ready','delivered','cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(formatOrder(order));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, preparing, ready, delivered, total, revenueResult] = await Promise.all([
      Order.countDocuments({ status: 'pending', createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'preparing', createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'ready', createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'delivered', createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } },
      ]),
    ]);

    res.json({
      pending, preparing, ready, delivered, total,
      revenue: revenueResult[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── HELPER ────────────────────────────────────────────────
function formatOrder(order) {
  return {
    id: order._id,
    room_number: order.room_number,
    guest_name: order.guest_name,
    status: order.status,
    total_amount: order.total_amount,
    special_note: order.special_note,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    items: order.items,
  };
}

// ── CATCH ALL ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽️  Riversongs running on port ${PORT}`);
});