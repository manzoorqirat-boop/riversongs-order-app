const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { requireSuperAdmin, generateToken } = require('../middleware/auth');

// Master models are injected via req.masterModels (set in server.js)

// ── SUPERADMIN LOGIN ──────────────────────────────────────
// POST /api/superadmin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const SuperAdmin = req.masterModels.SuperAdmin;
    const admin = await SuperAdmin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ role: 'superadmin', username: admin.username }, '24h');
    res.json({ token, name: admin.name, role: 'superadmin' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── LIST ALL HOTELS ───────────────────────────────────────
// GET /api/superadmin/hotels
router.get('/hotels', requireSuperAdmin, async (req, res) => {
  try {
    const hotels = await req.masterModels.Hotel.find().sort({ createdAt: -1 });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// ── CREATE HOTEL ──────────────────────────────────────────
// POST /api/superadmin/hotels
router.post('/hotels', requireSuperAdmin, async (req, res) => {
  try {
    const { name, slug, address, phone, email, gst_number, plan, admin_pin } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });

    // slug must be lowercase alphanumeric + hyphens only
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const existing = await req.masterModels.Hotel.findOne({ slug: cleanSlug });
    if (existing) return res.status(409).json({ error: 'Slug already exists' });

    const hotel = new req.masterModels.Hotel({
      name, slug: cleanSlug, address, phone, email, gst_number,
      plan: plan || 'trial',
      admin_pin: admin_pin || '1234',
    });
    await hotel.save();

    res.status(201).json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create hotel' });
  }
});

// ── UPDATE HOTEL ──────────────────────────────────────────
// PATCH /api/superadmin/hotels/:id
router.patch('/hotels/:id', requireSuperAdmin, async (req, res) => {
  try {
    const hotel = await req.masterModels.Hotel.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hotel' });
  }
});

// ── SUSPEND / ACTIVATE HOTEL ──────────────────────────────
// PATCH /api/superadmin/hotels/:id/status
router.patch('/hotels/:id/status', requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active','suspended','trial'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const hotel = await req.masterModels.Hotel.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── CREATE HOTEL USER (HotelAdmin/Staff) ──────────────────
// POST /api/superadmin/hotels/:id/users
router.post('/hotels/:id/users', requireSuperAdmin, async (req, res) => {
  try {
    const hotel = await req.masterModels.Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    const { username, password, role, name } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = new req.masterModels.HotelUser({
      hotel_id: hotel._id,
      hotel_slug: hotel.slug,
      username,
      password_hash,
      role: role || 'hotel_admin',
      name: name || username,
    });
    await user.save();

    res.status(201).json({
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
      hotel_slug: user.hotel_slug,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username already exists for this hotel' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ── LIST HOTEL USERS ──────────────────────────────────────
// GET /api/superadmin/hotels/:id/users
router.get('/hotels/:id/users', requireSuperAdmin, async (req, res) => {
  try {
    const users = await req.masterModels.HotelUser.find(
      { hotel_id: req.params.id },
      '-password_hash'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── BILLING: MARK PAID ────────────────────────────────────
// PATCH /api/superadmin/hotels/:id/billing
router.patch('/hotels/:id/billing', requireSuperAdmin, async (req, res) => {
  try {
    const { installation_fee_paid, subscription_paid_until } = req.body;
    const update = {};
    if (installation_fee_paid !== undefined) update.installation_fee_paid = installation_fee_paid;
    if (subscription_paid_until) update.subscription_paid_until = new Date(subscription_paid_until);

    const hotel = await req.masterModels.Hotel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update billing' });
  }
});

module.exports = router;