require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { Category, MenuItem, Order } = require('./db/models');
const seedDatabase = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || '9999';

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

// ── ADMIN PIN CHECK MIDDLEWARE ────────────────────────────
function requireAdmin(req, res, next) {
  const pin = req.headers['x-admin-pin'];
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── ROUTES: MENU ──────────────────────────────────────────

// GET /api/menu  (customers - only available items)
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

// GET /api/admin/menu  (admin - all items including unavailable)
app.get('/api/admin/menu', requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort('display_order');
    const items = await MenuItem.find();

    const menu = categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      display_order: cat.display_order,
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

    res.json({ categories: categories.map(c => ({ id: c._id, name: c.name, display_order: c.display_order, icon: c.icon })), menu });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load admin menu' });
  }
});

// ── ADMIN: CATEGORIES ─────────────────────────────────────

// POST /api/admin/categories
app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { name, icon, display_order } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const cat = new Category({ name, icon: icon || '🍽️', display_order: display_order || 99 });
    await cat.save();
    res.status(201).json({ id: cat._id, name: cat.name, icon: cat.icon, display_order: cat.display_order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/admin/categories/:id
app.patch('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { name, icon, display_order } = req.body;
    const cat = await Category.findByIdAndUpdate(req.params.id, { name, icon, display_order }, { new: true });
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json({ id: cat._id, name: cat.name, icon: cat.icon, display_order: cat.display_order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/admin/categories/:id
app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const count = await MenuItem.countDocuments({ category_id: req.params.id });
    if (count > 0) return res.status(400).json({ error: `Cannot delete — ${count} items exist in this category` });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ── ADMIN: MENU ITEMS ─────────────────────────────────────

// POST /api/admin/items
app.post('/api/admin/items', requireAdmin, async (req, res) => {
  try {
    const { category_id, name, description, price, subcategory, is_veg, is_available } = req.body;
    if (!category_id || !name || price == null) return res.status(400).json({ error: 'category_id, name, price required' });
    const item = new MenuItem({ category_id, name, description, price, subcategory, is_veg: !!is_veg, is_available: is_available !== false });
    await item.save();
    res.status(201).json({ id: item._id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PATCH /api/admin/items/:id
app.patch('/api/admin/items/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, subcategory, is_veg, is_available, category_id } = req.body;
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, description, price, subcategory, is_veg, is_available, category_id },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ id: item._id, name: item.name, description: item.description, price: item.price, subcategory: item.subcategory, is_veg: item.is_veg, is_available: item.is_available, category_id: item.category_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/admin/items/:id
app.delete('/api/admin/items/:id', requireAdmin, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
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