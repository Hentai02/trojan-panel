const express = require('express');
const crypto = require('crypto');
const pool = require('../db');

const router = express.Router();

const USERNAME_MAX = 64;
const FIELD_MAX = 255;

function hashPassword(password) {
  return crypto.createHash('sha224').update(password).digest('hex');
}

function validateUserBody(body, isCreate) {
  const errors = [];

  if (isCreate || body.username !== undefined) {
    if (!body.username || typeof body.username !== 'string' || !body.username.trim()) {
      errors.push('username is required');
    } else if (body.username.length > USERNAME_MAX) {
      errors.push('username must be 64 characters or fewer');
    }
  }

  if (isCreate) {
    if (!body.password || typeof body.password !== 'string' || !body.password) {
      errors.push('password is required');
    } else if (body.password.length > FIELD_MAX) {
      errors.push('password is too long');
    }
  }

  if (body.password !== undefined && body.password !== null && body.password.length > FIELD_MAX) {
    errors.push('password is too long');
  }

  for (const field of ['download', 'upload']) {
    if (body[field] !== undefined) {
      const val = Number(body[field]);
      if (!Number.isFinite(val) || val < 0) {
        errors.push(field + ' must be a non-negative number');
      }
    }
  }

  if (body.quota !== undefined) {
    const val = Number(body.quota);
    if (!Number.isFinite(val)) {
      errors.push('quota must be a valid number');
    }
  }

  return errors;
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, username, quota, download, upload FROM users');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, quota, download, upload FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const errors = validateUserBody(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const { username, password, quota = 0, download = 0, upload = 0 } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO users (username, password, quota, download, upload) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), hashPassword(password), quota, download, upload]
    );
    res.status(201).json({ id: result.insertId, username: username.trim(), quota, download, upload });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const errors = validateUserBody(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const { username, password, quota, download, upload } = req.body;
  const fields = [];
  const values = [];

  if (username !== undefined) {
    fields.push('username = ?');
    values.push(username.trim());
  }
  if (password !== undefined) {
    fields.push('password = ?');
    values.push(hashPassword(password));
  }
  if (quota !== undefined) {
    fields.push('quota = ?');
    values.push(quota);
  }
  if (download !== undefined) {
    fields.push('download = ?');
    values.push(download);
  }
  if (upload !== undefined) {
    fields.push('upload = ?');
    values.push(upload);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const [rows] = await pool.query(
      'SELECT id, username, quota, download, upload FROM users WHERE id = ?',
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
