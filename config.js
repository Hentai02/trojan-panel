const crypto = require('crypto');

const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;
const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH = null;

const LOG_MAX_LINES = 2000;
const LOG_DEFAULT_LINES = 200;

const CONFIG_PATH = '/usr/local/etc/trojan/config.json';

const PORT = process.env.PORT || 3000;

const CORS_ORIGIN = process.env.CORS_ORIGIN || '';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  SESSION_MAX_AGE,
  SESSION_CLEANUP_INTERVAL,
  ADMIN_USER,
  ADMIN_PASS_HASH,
  LOG_MAX_LINES,
  LOG_DEFAULT_LINES,
  CONFIG_PATH,
  PORT,
  CORS_ORIGIN,
  generateToken
};
