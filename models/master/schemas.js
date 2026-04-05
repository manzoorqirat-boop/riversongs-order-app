const mongoose = require('mongoose');

// ── HOTEL ─────────────────────────────────────────────────
const hotelSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  slug:         { type: String, required: true, unique: true }, // used as hotelId in DB name
  address:      { type: String, default: null },
  phone:        { type: String, default: null },
  email:        { type: String, default: null },
  logo_url:     { type: String, default: null },
  gst_number:   { type: String, default: null },
  status:       { type: String, enum: ['active', 'suspended', 'trial'], default: 'trial' },
  plan:         { type: String, enum: ['trial', 'basic', 'pro'], default: 'trial' },
  // Billing
  installation_fee_paid: { type: Boolean, default: false },
  subscription_paid_until: { type: Date, default: null },
  // Settings
  admin_pin:    { type: String, default: '1234' }, // hotel-level PIN for kitchen/staff
}, { timestamps: true });

// ── HOTEL USER (HotelAdmin + Staff) ──────────────────────
const hotelUserSchema = new mongoose.Schema({
  hotel_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  hotel_slug:   { type: String, required: true },
  username:     { type: String, required: true },
  password_hash:{ type: String, required: true },
  role:         { type: String, enum: ['hotel_admin', 'staff', 'kitchen'], default: 'staff' },
  name:         { type: String, default: null },
  is_active:    { type: Boolean, default: true },
}, { timestamps: true });

hotelUserSchema.index({ username: 1, hotel_slug: 1 }, { unique: true });

// ── SUPER ADMIN ───────────────────────────────────────────
const superAdminSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  password_hash:{ type: String, required: true },
  name:         { type: String, default: 'Super Admin' },
}, { timestamps: true });

module.exports = { hotelSchema, hotelUserSchema, superAdminSchema };