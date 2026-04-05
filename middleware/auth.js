const jwt = require('jsonwebtoken');
const { getTenantDB } = require('../config/db');
const { getTenantModels } = require('../models/tenant/schemas');

const JWT_SECRET = process.env.JWT_SECRET || 'restel-secret-change-in-production';

// ── VERIFY JWT ────────────────────────────────────────────
function verifyToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── REQUIRE SUPERADMIN ────────────────────────────────────
function requireSuperAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }
    next();
  });
}

// ── REQUIRE HOTEL AUTH + INJECT TENANT DB ─────────────────
// Attaches req.db (tenant connection) and req.models to every hotel route
async function requireHotelAuth(req, res, next) {
  verifyToken(req, res, async () => {
    try {
      const { hotelSlug, role } = req.user;
      if (!hotelSlug) return res.status(403).json({ error: 'No hotel context in token' });

      const conn = await getTenantDB(hotelSlug);
      req.db = conn;
      req.models = getTenantModels(conn);
      req.hotelSlug = hotelSlug;
      req.userRole = role;
      next();
    } catch (err) {
      console.error('Tenant DB error:', err.message);
      res.status(500).json({ error: 'Failed to connect to hotel database' });
    }
  });
}

// ── REQUIRE HOTEL ADMIN ROLE ──────────────────────────────
async function requireHotelAdmin(req, res, next) {
  await requireHotelAuth(req, res, () => {
    if (!['hotel_admin', 'superadmin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Hotel Admin access required' });
    }
    next();
  });
}

// ── GENERATE TOKEN ────────────────────────────────────────
function generateToken(payload, expiresIn = '12h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = { verifyToken, requireSuperAdmin, requireHotelAuth, requireHotelAdmin, generateToken };