const mysql = require('mysql2/promise');

async function setup() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '123456'
  });

  await conn.query('CREATE DATABASE IF NOT EXISTS trojan');
  console.log('Database "trojan" created.');

  await conn.query('USE trojan');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      username VARCHAR(64) NOT NULL,
      password CHAR(56) NOT NULL,
      quota BIGINT NOT NULL DEFAULT 0,
      download BIGINT UNSIGNED NOT NULL DEFAULT 0,
      upload BIGINT UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      INDEX (password)
    )
  `);
  console.log('Table "users" created.');

  await conn.end();
  console.log('Setup complete.');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
