require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectMaster, getTenantDB } = require('./config/db');
const { hotelSchema, hotelUserSchema, superAdminSchema } = require('./models/master/schemas');
const { getTenantModels } = require('./models/tenant/schemas');
const { requireHotelAuth, requireHotelAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── MASTER DB + MODELS ────────────────────────────────────
let masterModels = null;

async function initMaster() {
  const conn = await connectMaster();
  masterModels = {
    Hotel:      conn.models.Hotel      || conn.model('Hotel', hotelSchema),
    HotelUser:  conn.models.HotelUser  || conn.model('HotelUser', hotelUserSchema),
    SuperAdmin: conn.models.SuperAdmin || conn.model('SuperAdmin', superAdminSchema),
  };
  return masterModels;
}

// ── INJECT MASTER MODELS INTO EVERY REQUEST ───────────────
app.use((req, res, next) => {
  if (!masterModels) return res.status(503).json({ error: 'Server starting up, please retry' });
  req.masterModels = masterModels;
  next();
});

// ── ROUTES: AUTH ──────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/superadmin', require('./routes/superadmin'));

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

// ── MENU ──────────────────────────────────────────────────

app.get('/api/menu', requireHotelAuth, async (req, res) => {
  try {
    const { Category, MenuItem } = req.models;
    const categories = await Category.find().sort('display_order');
    const items = await MenuItem.find({ is_available: true });
    const menu = categories.map(cat => ({
      id: cat._id, name: cat.name, display_order: cat.display_order,
      available_from: cat.available_from, available_to: cat.available_to, icon: cat.icon,
      items: items.filter(item => item.category_id.toString() === cat._id.toString())
        .map(item => ({ id: item._id, category_id: item.category_id, subcategory: item.subcategory, name: item.name, description: item.description, price: item.price, is_veg: item.is_veg, is_available: item.is_available })),
    }));
    res.json(menu);
  } catch (err) { res.status(500).json({ error: 'Failed to load menu' }); }
});

app.get('/api/admin/menu', requireHotelAdmin, async (req, res) => {
  try {
    const { Category, MenuItem } = req.models;
    const categories = await Category.find().sort('display_order');
    const items = await MenuItem.find();
    const menu = categories.map(cat => ({
      id: cat._id, name: cat.name, display_order: cat.display_order, icon: cat.icon,
      items: items.filter(item => item.category_id.toString() === cat._id.toString())
        .map(item => ({ id: item._id, category_id: item.category_id, subcategory: item.subcategory, name: item.name, description: item.description, price: item.price, is_veg: item.is_veg, is_available: item.is_available })),
    }));
    res.json({ categories: categories.map(c => ({ id: c._id, name: c.name, display_order: c.display_order, icon: c.icon })), menu });
  } catch (err) { res.status(500).json({ error: 'Failed to load admin menu' }); }
});

// ── CATEGORIES ────────────────────────────────────────────

app.post('/api/admin/categories', requireHotelAdmin, async (req, res) => {
  try {
    const { Category } = req.models;
    const { name, icon, display_order } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const cat = new Category({ name, icon: icon || '🍽️', display_order: display_order || 99 });
    await cat.save();
    res.status(201).json({ id: cat._id, name: cat.name, icon: cat.icon, display_order: cat.display_order });
  } catch (err) { res.status(500).json({ error: 'Failed to create category' }); }
});

app.patch('/api/admin/categories/:id', requireHotelAdmin, async (req, res) => {
  try {
    const { Category } = req.models;
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json({ id: cat._id, name: cat.name, icon: cat.icon, display_order: cat.display_order });
  } catch (err) { res.status(500).json({ error: 'Failed to update category' }); }
});

app.delete('/api/admin/categories/:id', requireHotelAdmin, async (req, res) => {
  try {
    const { Category, MenuItem } = req.models;
    const count = await MenuItem.countDocuments({ category_id: req.params.id });
    if (count > 0) return res.status(400).json({ error: `Cannot delete — ${count} items exist` });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete category' }); }
});

// ── MENU ITEMS ────────────────────────────────────────────

app.post('/api/admin/items', requireHotelAdmin, async (req, res) => {
  try {
    const { MenuItem } = req.models;
    const { category_id, name, description, price, subcategory, is_veg, is_available } = req.body;
    if (!category_id || !name || price == null) return res.status(400).json({ error: 'category_id, name, price required' });
    const item = new MenuItem({ category_id, name, description, price, subcategory, is_veg: !!is_veg, is_available: is_available !== false });
    await item.save();
    res.status(201).json({ id: item._id, ...req.body });
  } catch (err) { res.status(500).json({ error: 'Failed to create item' }); }
});

app.patch('/api/admin/items/:id', requireHotelAdmin, async (req, res) => {
  try {
    const { MenuItem } = req.models;
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ id: item._id, name: item.name, description: item.description, price: item.price, subcategory: item.subcategory, is_veg: item.is_veg, is_available: item.is_available, category_id: item.category_id });
  } catch (err) { res.status(500).json({ error: 'Failed to update item' }); }
});

app.delete('/api/admin/items/:id', requireHotelAdmin, async (req, res) => {
  try {
    const { MenuItem } = req.models;
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete item' }); }
});

app.get('/api/menu/search', requireHotelAuth, async (req, res) => {
  const q = req.query.q || '';
  try {
    const { MenuItem, Category } = req.models;
    const items = await MenuItem.find({ is_available: true, $or: [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }] }).limit(30);
    const categories = await Category.find();
    res.json(items.map(item => {
      const cat = categories.find(c => c._id.toString() === item.category_id.toString());
      return { id: item._id, name: item.name, description: item.description, price: item.price, is_veg: item.is_veg, subcategory: item.subcategory, category_id: item.category_id, category_name: cat ? cat.name : '' };
    }));
  } catch (err) { res.status(500).json({ error: 'Search failed' }); }
});

// ── ORDERS ────────────────────────────────────────────────

app.post('/api/orders', requireHotelAuth, async (req, res) => {
  const { room_number, guest_name, special_note, items } = req.body;
  if (!room_number || !items || items.length === 0) return res.status(400).json({ error: 'room_number and items are required' });
  try {
    const { Order } = req.models;
    const total = items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
    const order = new Order({ room_number, guest_name: guest_name || null, special_note: special_note || null, total_amount: total, items: items.map(i => ({ menu_item_id: i.menu_item_id, item_name: i.item_name, unit_price: i.unit_price, quantity: i.quantity, subtotal: i.unit_price * i.quantity })) });
    await order.save();
    res.status(201).json(formatOrder(order));
  } catch (err) { res.status(500).json({ error: 'Failed to place order' }); }
});

app.get('/api/orders', requireHotelAuth, async (req, res) => {
  const { status, room } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (room) filter.room_number = { $regex: room, $options: 'i' };
  try {
    const { Order } = req.models;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(orders.map(formatOrder));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

app.get('/api/orders/:id', requireHotelAuth, async (req, res) => {
  try {
    const { Order } = req.models;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(formatOrder(order));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch order' }); }
});

app.patch('/api/orders/:id/status', requireHotelAuth, async (req, res) => {
  const { status } = req.body;
  if (!['pending','preparing','ready','delivered','cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const { Order } = req.models;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(formatOrder(order));
  } catch (err) { res.status(500).json({ error: 'Failed to update status' }); }
});

app.get('/api/stats', requireHotelAuth, async (req, res) => {
  try {
    const { Order } = req.models;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [pending, preparing, ready, delivered, total, revenueResult] = await Promise.all([
      Order.countDocuments({ status: 'pending', createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'preparing', createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'ready', createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'delivered', createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([{ $match: { status: 'delivered', createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    ]);
    res.json({ pending, preparing, ready, delivered, total, revenue: revenueResult[0]?.total || 0 });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch stats' }); }
});

// ── GUESTS ────────────────────────────────────────────────

app.get('/api/guests', requireHotelAuth, async (req, res) => {
  try {
    const { Guest } = req.models;
    const { status, room } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (room) filter.room_number = { $regex: room, $options: 'i' };
    const guests = await Guest.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(guests);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch guests' }); }
});

app.post('/api/guests', requireHotelAuth, async (req, res) => {
  try {
    const { Guest } = req.models;
    const { room_number, guest_name, phone, id_proof, adults, children, room_rate, notes } = req.body;
    if (!room_number || !guest_name) return res.status(400).json({ error: 'room_number and guest_name required' });
    const guest = new Guest({ room_number, guest_name, phone, id_proof, adults: adults || 1, children: children || 0, room_rate: room_rate || 0, notes });
    await guest.save();
    res.status(201).json(guest);
  } catch (err) { res.status(500).json({ error: 'Failed to check in guest' }); }
});

app.get('/api/guests/:id', requireHotelAuth, async (req, res) => {
  try {
    const { Guest } = req.models;
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    res.json(guest);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch guest' }); }
});

app.patch('/api/guests/:id', requireHotelAuth, async (req, res) => {
  try {
    const { Guest } = req.models;
    const updates = { ...req.body };
    if (updates.status === 'checked_out' && !updates.check_out) updates.check_out = new Date();
    const guest = await Guest.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    res.json(guest);
  } catch (err) { res.status(500).json({ error: 'Failed to update guest' }); }
});

app.delete('/api/guests/:id', requireHotelAdmin, async (req, res) => {
  try {
    const { Guest } = req.models;
    await Guest.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete guest' }); }
});

app.get('/api/rooms/:room/orders', requireHotelAuth, async (req, res) => {
  try {
    const { Order } = req.models;
    const orders = await Order.find({ room_number: req.params.room }).sort({ createdAt: -1 });
    const total = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    res.json({ orders: orders.map(formatOrder), food_total: total });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch room orders' }); }
});

// ── BILLS ────────────────────────────────────────────────

app.post('/api/bills', requireHotelAuth, async (req, res) => {
  try {
    const { Guest, Order, Bill } = req.models;
    const { guest_id, room_number, other_charges, discount, payment_mode, gst_rate, notes } = req.body;
    const guest = await Guest.findById(guest_id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    const checkIn = new Date(guest.check_in);
    const checkOut = new Date();
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const room_charges = (guest.room_rate || 0) * nights;
    const orders = await Order.find({ room_number, status: { $ne: 'cancelled' } });
    const food_charges = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const subtotal = room_charges + food_charges + Number(other_charges || 0) - Number(discount || 0);
    const gstRate = Number(gst_rate || 18);
    const gst_amount = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
    const total_amount = parseFloat((subtotal + gst_amount).toFixed(2));
    const bill_number = `RESTEL-${Date.now().toString().slice(-8)}`;
    const bill = new Bill({ bill_number, guest_id: guest._id, room_number, guest_name: guest.guest_name, check_in: guest.check_in, check_out: checkOut, room_charges, food_charges, other_charges: Number(other_charges || 0), subtotal, gst_rate: gstRate, gst_amount, discount: Number(discount || 0), total_amount, payment_mode: payment_mode || 'Cash', payment_status: 'pending', orders: orders.map(o => o._id), notes });
    await bill.save();
    guest.status = 'checked_out';
    guest.check_out = checkOut;
    await guest.save();
    res.status(201).json({ ...bill.toObject(), nights, orders: orders.map(formatOrder) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to generate bill' }); }
});

app.get('/api/bills', requireHotelAuth, async (req, res) => {
  try {
    const { Bill } = req.models;
    const bills = await Bill.find().sort({ createdAt: -1 }).limit(100);
    res.json(bills);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch bills' }); }
});

app.get('/api/bills/:id', requireHotelAuth, async (req, res) => {
  try {
    const { Bill, Order } = req.models;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const orders = await Order.find({ _id: { $in: bill.orders } });
    res.json({ ...bill.toObject(), orders: orders.map(formatOrder) });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch bill' }); }
});

app.patch('/api/bills/:id/pay', requireHotelAuth, async (req, res) => {
  try {
    const { Bill } = req.models;
    const { payment_mode } = req.body;
    const bill = await Bill.findByIdAndUpdate(req.params.id, { payment_status: 'paid', payment_mode: payment_mode || 'Cash' }, { new: true });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) { res.status(500).json({ error: 'Failed to update payment' }); }
});

// ── CATCH ALL ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ─────────────────────────────────────────────────
initMaster()
  .then(() => {
    app.listen(PORT, () => console.log(`🏨 RESTEL running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Failed to connect to master DB:', err.message);
    process.exit(1);
  });