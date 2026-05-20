const bcrypt = require('bcryptjs');
const config = require('../config');

const router = require('express').Router();

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW = 15 * 60 * 1000;
const loginAttempts = new Map();

let adminPassHash = config.ADMIN_PASS_HASH;

function initAdminPassword(password) {
  if (!adminPassHash) {
    adminPassHash = bcrypt.hashSync(password, SALT_ROUNDS);
  }
}

initAdminPassword(process.env.ADMIN_PASS || 'admin');

function cleanupAttempts() {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) {
    if (now - entry.firstAttempt > LOCKOUT_WINDOW) {
      loginAttempts.delete(key);
    }
  }
}
setInterval(cleanupAttempts, 5 * 60 * 1000);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  const attemptEntry = loginAttempts.get(clientIp);
  const now = Date.now();

  if (attemptEntry && attemptEntry.count >= MAX_LOGIN_ATTEMPTS) {
    if (now - attemptEntry.firstAttempt < LOCKOUT_WINDOW) {
      return res.status(429).json({
        error: 'Too many login attempts. Try again later.'
      });
    }
    loginAttempts.delete(clientIp);
  }

  try {
    if (username !== config.ADMIN_USER) {
      recordFailedAttempt(clientIp, now);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, adminPassHash);
    if (!valid) {
      recordFailedAttempt(clientIp, now);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    loginAttempts.delete(clientIp);
    const token = config.generateToken();
    req.app.locals.sessions.set(token, { username, createdAt: now });
    res.cookie('session_token', token, {
      httpOnly: true,
      maxAge: config.SESSION_MAX_AGE,
      sameSite: 'strict'
    });
    return res.json({ success: true, username });
  } catch (err) {
    return res.status(500).json({ error: 'Authentication error' });
  }
});

router.post('/logout', (req, res) => {
  const token = req.cookies?.session_token;
  if (token) {
    req.app.locals.sessions.delete(token);
  }
  res.clearCookie('session_token');
  res.json({ success: true });
});

router.get('/status', (req, res) => {
  const token = req.cookies?.session_token;
  if (token && req.app.locals.sessions.has(token)) {
    return res.json({
      authenticated: true,
      username: req.app.locals.sessions.get(token).username
    });
  }
  res.json({ authenticated: false });
});

function recordFailedAttempt(ip, now) {
  const entry = loginAttempts.get(ip);
  if (entry) {
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
}

module.exports = router;
