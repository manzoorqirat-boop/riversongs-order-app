const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDB() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Check if already initialized
    const check = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'categories'
      ) AS exists
    `);

    if (check.rows[0].exists) {
      console.log('✅ Database already initialized, skipping schema.');
      return;
    }

    console.log('🔧 Running schema for first time...');
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Schema and menu data loaded!');

  } catch (err) {
    console.error('❌ DB init failed:', err.message);
  } finally {
    await pool.end();
  }
}

module.exports = initDB;