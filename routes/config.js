const express = require('express');
const fs = require('fs');
const { execFile } = require('child_process');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const data = fs.readFileSync(config.CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(data);
    res.json(parsed);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Config file not found' });
    }
    next(err);
  }
});

router.put('/', (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body must be a non-empty JSON object' });
  }

  try {
    const json = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(config.CONFIG_PATH, json, { encoding: 'utf8', mode: 0o644 });
    res.json({ message: 'Config saved' });
  } catch (err) {
    next(err);
  }
});

router.post('/restart', (req, res, next) => {
  execFile('systemctl', ['restart', 'trojan.service'], { timeout: 15000 }, (err, stdout, stderr) => {
    if (err) {
      return next(Object.assign(err, { status: 500, message: stderr || err.message }));
    }
    res.json({ message: 'Service restarted' });
  });
});

module.exports = router;
