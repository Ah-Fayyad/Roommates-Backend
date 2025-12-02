
const { Client } = require('pg');

const passwords = ['password', 'postgres', 'admin', 'root', '123456', '1234', 'admin123'];
const user = 'postgres';
const db = 'postgres'; // Connect to default db first

async function testConnection() {
  console.log('Testing database connections...');
  
  for (const password of passwords) {
    const client = new Client({
      user,
      host: 'localhost',
      database: db,
      password,
      port: 5432,
    });

    try {
      await client.connect();
      console.log(`SUCCESS: Connected with password: "${password}"`);
      await client.end();
      return password;
    } catch (err) {
      console.log(`Failed with password: "${password}" - ${err.message}`);
    }
  }
  
  console.log('All attempts failed.');
  return null;
}

testConnection();
