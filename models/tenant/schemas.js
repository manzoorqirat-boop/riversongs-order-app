const mongoose = require('mongoose');

// ── CATEGORY ──────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name:           { type: String, required: true },
  display_order:  { type: Number, default: 0 },
  available_from: { type: String, default: null },
  available_to:   { type: String, default: null },
  icon:           { type: String, default: '🍽️' },
});

// ── MENU ITEM ─────────────────────────────────────────────
const menuItemSchema = new mongoose.Schema({
  category_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory:  { type: String, default: null },
  name:         { type: String, required: true },
  description:  { type: String, default: null },
  price:        { type: Number, required: true },
  is_veg:       { type: Boolean, default: true },
  is_available: { type: Boolean, default: true },
  size_label:   { type: String, default: null },
});

// ── ORDER ─────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  item_name:    { type: String, required: true },
  unit_price:   { type: Number, required: true },
  quantity:     { type: Number, required: true, default: 1 },
  subtotal:     { type: Number },
});

const orderSchema = new mongoose.Schema({
  room_number:  { type: String, required: true },
  guest_name:   { type: String, default: null },
  status: {
    type: String,
    enum: ['pending','preparing','ready','delivered','cancelled'],
    default: 'pending',
  },
  total_amount: { type: Number, default: 0 },
  special_note: { type: String, default: null },
  items: [orderItemSchema],
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  this.items.forEach(item => { item.subtotal = item.unit_price * item.quantity; });
  next();
});

// ── GUEST ─────────────────────────────────────────────────
const guestSchema = new mongoose.Schema({
  room_number:  { type: String, required: true },
  guest_name:   { type: String, required: true },
  phone:        { type: String, default: null },
  id_proof:     { type: String, default: null },
  adults:       { type: Number, default: 1 },
  children:     { type: Number, default: 0 },
  check_in:     { type: Date, default: Date.now },
  check_out:    { type: Date, default: null },
  status:       { type: String, enum: ['checked_in','checked_out'], default: 'checked_in' },
  room_rate:    { type: Number, default: 0 },
  notes:        { type: String, default: null },
}, { timestamps: true });

// ── BILL ──────────────────────────────────────────────────
const billSchema = new mongoose.Schema({
  bill_number:      { type: String, unique: true },
  guest_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Guest' },
  room_number:      { type: String, required: true },
  guest_name:       { type: String },
  check_in:         { type: Date },
  check_out:        { type: Date },
  room_charges:     { type: Number, default: 0 },
  food_charges:     { type: Number, default: 0 },
  other_charges:    { type: Number, default: 0 },
  subtotal:         { type: Number, default: 0 },
  gst_rate:         { type: Number, default: 18 },
  gst_amount:       { type: Number, default: 0 },
  discount:         { type: Number, default: 0 },
  total_amount:     { type: Number, default: 0 },
  payment_mode:     { type: String, enum: ['Cash','UPI','Card','Credit'], default: 'Cash' },
  payment_status:   { type: String, enum: ['pending','paid'], default: 'pending' },
  orders:           [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  notes:            { type: String, default: null },
}, { timestamps: true });

// ── REGISTER MODELS ON A GIVEN CONNECTION ─────────────────
function getTenantModels(conn) {
  return {
    Category: conn.models.Category || conn.model('Category', categorySchema),
    MenuItem: conn.models.MenuItem || conn.model('MenuItem', menuItemSchema),
    Order:    conn.models.Order    || conn.model('Order', orderSchema),
    Guest:    conn.models.Guest    || conn.model('Guest', guestSchema),
    Bill:     conn.models.Bill     || conn.model('Bill', billSchema),
  };
}

module.exports = { getTenantModels };