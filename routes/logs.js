const express = require('express');
const { execFile } = require('child_process');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res, next) => {
  const raw = Number(req.query.lines);
  const lines = Number.isFinite(raw) && raw > 0
    ? Math.min(raw, config.LOG_MAX_LINES)
    : config.LOG_DEFAULT_LINES;

  const args = ['-u', 'trojan.service', '--no-pager', '-n', String(lines), '-o', 'short-iso'];

  execFile('journalctl', args, { timeout: 15000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
      return next(Object.assign(err, { status: 500, message: stderr || err.message }));
    }
    res.json({ logs: stdout.trimEnd() });
  });
});

module.exports = router;
