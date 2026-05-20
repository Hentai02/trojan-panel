const mysql = require('mysql2/promise');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha224').update(password).digest('hex');
}

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function randomBigInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'trojan'
  });

  const users = [];
  for (let i = 0; i < 5; i++) {
    const username = randomString(8);
    const plainPassword = randomString(12);
    const password = hashPassword(plainPassword);
    const quota = randomBigInt(0, 5 * 1024 * 1024 * 1024);       // 0 ~ 5 GB
    const download = randomBigInt(0, 2 * 1024 * 1024 * 1024);    // 0 ~ 2 GB
    const upload = randomBigInt(0, 1 * 1024 * 1024 * 1024);      // 0 ~ 1 GB

    const [result] = await conn.query(
      'INSERT INTO users (username, password, quota, download, upload) VALUES (?, ?, ?, ?, ?)',
      [username, password, quota, download, upload]
    );
    users.push({ id: result.insertId, username, plainPassword, quota, download, upload });
  }

  await conn.end();

  console.log('Created 5 accounts:\n');
  users.forEach(u => {
    console.log(`ID: ${u.id}`);
    console.log(`  Username: ${u.username}`);
    console.log(`  Password: ${u.plainPassword}`);
    console.log(`  Quota:    ${(u.quota / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`  Download: ${(u.download / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`  Upload:   ${(u.upload / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log();
  });
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
