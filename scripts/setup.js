/**
 * RESTEL — First-time setup script
 * Creates the initial SuperAdmin account
 * 
 * Usage:
 *   node scripts/setup.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { superAdminSchema } = require('../models/master/schemas');

async function setup() {
  console.log('🏨 RESTEL Setup — Creating SuperAdmin...\n');

  const conn = await mongoose.createConnection(process.env.MASTER_MONGO_URL).asPromise();
  const SuperAdmin = conn.model('SuperAdmin', superAdminSchema);

  const existing = await SuperAdmin.findOne({ username: 'superadmin' });
  if (existing) {
    console.log('⚠️  SuperAdmin already exists. Skipping.');
    await conn.close();
    return;
  }

  const password_hash = await bcrypt.hash('Admin@1234', 10);
  await SuperAdmin.create({ username: 'superadmin', password_hash, name: 'Super Admin' });

  console.log('✅ SuperAdmin created!');
  console.log('   Username: superadmin');
  console.log('   Password: Admin@1234');
  console.log('\n⚠️  Change this password immediately after first login!\n');

  await conn.close();
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});