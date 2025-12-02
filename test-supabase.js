
const { Client } = require('pg');

const connectionString = "postgresql://postgres:admin1234%23%23@db.lszomwyawfydplooyafi.supabase.co:5432/postgres";

async function testConnection() {
  console.log('Testing connection to Supabase...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase sometimes
  });

  try {
    await client.connect();
    console.log('✅ SUCCESS: Connected to Supabase!');
    const res = await client.query('SELECT NOW()');
    console.log('Current Time:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  }
}

testConnection();
