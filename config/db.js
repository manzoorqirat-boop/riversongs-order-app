require('dotenv').config();
const mongoose = require('mongoose');

// ── MASTER DB CONNECTION ──────────────────────────────────
// Stores hotels, superadmins, billing
let masterConn = null;

async function connectMaster() {
  if (masterConn) return masterConn;
  masterConn = await mongoose.createConnection(process.env.MASTER_MONGO_URL).asPromise();
  console.log('✅ Master DB connected');
  return masterConn;
}

// ── TENANT DB CONNECTIONS ─────────────────────────────────
// One connection per hotel, cached after first use
const tenantConnections = {};

async function getTenantDB(hotelId) {
  if (!hotelId) throw new Error('hotelId is required');

  if (tenantConnections[hotelId]) return tenantConnections[hotelId];

  const baseUrl = process.env.TENANT_MONGO_BASE_URL; // e.g. mongodb+srv://user:pass@cluster/
  const dbName = `restel_hotel_${hotelId}`;
  const url = `${baseUrl.replace(/\/$/, '')}/${dbName}?retryWrites=true&w=majority`;

  const conn = await mongoose.createConnection(url).asPromise();
  tenantConnections[hotelId] = conn;
  console.log(`✅ Tenant DB connected: ${dbName}`);
  return conn;
}

module.exports = { connectMaster, getTenantDB };