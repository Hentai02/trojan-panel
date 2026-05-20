const express = require('express');
const { execFile } = require('child_process');

const router = express.Router();

const SERVICE_NAME = 'trojan.service';
const PROPS = 'ActiveState,SubState,LoadState,UnitFileState,ActiveEnterTimestamp,MainPID,ExecMainPID';

function parseSystemctlShow(stdout) {
  const result = {};
  for (const line of stdout.trim().split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      result[line.slice(0, idx)] = line.slice(idx + 1);
    }
  }
  return result;
}

function parsePsOutput(stdout) {
  const parts = stdout.trim().split(/\s+/);
  if (parts.length < 3) return null;
  return {
    cpuPercent: parseFloat(parts[0]) || 0,
    memPercent: parseFloat(parts[1]) || 0,
    rssKb: parseInt(parts[2], 10) || 0
  };
}

function formatUptime(timestampStr) {
  if (!timestampStr || timestampStr === '0') return null;
  const started = new Date(timestampStr.replace(/\s+/g, 'T'));
  if (isNaN(started.getTime())) return null;
  const diff = Date.now() - started.getTime();
  if (diff < 0) return 'just now';
  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(days + 'd');
  if (hours > 0) parts.push(hours + 'h');
  if (minutes > 0 && parts.length < 2) parts.push(minutes + 'm');
  if (parts.length === 0) parts.push(seconds + 's');
  return parts.join(' ');
}

function formatBytes(kb) {
  if (kb < 1024) return kb + ' KB';
  if (kb < 1048576) return (kb / 1024).toFixed(1) + ' MB';
  return (kb / 1048576).toFixed(2) + ' GB';
}

router.get('/', (req, res, next) => {
  execFile('systemctl', ['show', SERVICE_NAME, '--property=' + PROPS], { timeout: 8000 }, (err, stdout, stderr) => {
    if (err) {
      return next(Object.assign(err, { status: 500, message: stderr || 'Failed to query service' }));
    }

    const info = parseSystemctlShow(stdout);
    const pid = parseInt(info.MainPID, 10) || 0;

    const result = {
      activeState: info.ActiveState || 'unknown',
      subState: info.SubState || '',
      loadState: info.LoadState || 'unknown',
      unitFileState: info.UnitFileState || 'unknown',
      mainPID: pid,
      execPID: parseInt(info.ExecMainPID, 10) || 0,
      uptime: formatUptime(info.ActiveEnterTimestamp),
      cpuPercent: null,
      memPercent: null,
      memRssFormatted: null
    };

    if (pid <= 0) {
      return res.json(result);
    }

    execFile('ps', ['-p', String(pid), '-o', '%cpu,%mem,rss', '--no-headers'], { timeout: 5000 }, (psErr, psStdout) => {
      if (!psErr) {
        const usage = parsePsOutput(psStdout);
        if (usage) {
          result.cpuPercent = usage.cpuPercent;
          result.memPercent = usage.memPercent;
          result.memRssFormatted = formatBytes(usage.rssKb);
        }
      }
      res.json(result);
    });
  });
});

module.exports = router;
