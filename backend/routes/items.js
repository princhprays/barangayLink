const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin, requireResident, requireUser, requireVerified } = require('../middleware/auth');
const { uploadItemPhoto, handleUploadError } = require('../middleware/upload');
const router = express.Router();

// Create a new item (resident only, requires verification)
router.post('/', authenticateToken, requireResident, requireVerified, (req, res, next) => {
  uploadItemPhoto(req, res, function(err) {
    if (err) return handleUploadError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    const { type, name, description = '', condition, due_date } = req.body;
    const photoPath = req.file ? `/uploads/items/${req.file.filename}` : null;
    const db = getDB();

    if (!type || !name || !condition) {
      return res.status(400).json({ message: 'type, name and condition are required' });
    }

    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `INSERT INTO items (owner_id, type, name, description, condition, photo, status, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
         RETURNING *`,
        [req.user.id, type, name, description, condition, photoPath, due_date || null]
      );
      return res.status(201).json({ message: 'Item submitted for approval', item: result.rows[0] });
    } else {
      const sql = `INSERT INTO items (owner_id, type, name, description, condition, photo, status, due_date)
                   VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`;
      const params = [req.user.id, type, name, description, condition, photoPath, due_date || null];
      db.run(sql, params, function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to create item' });
        }
        db.get('SELECT * FROM items WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to retrieve created item' });
          }
          return res.status(201).json({ message: 'Item submitted for approval', item: row });
        });
      });
    }
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available items (authenticated users can view) with optional filters
// Query params: q (search), type (donation|lending), condition, barangay
router.get('/', authenticateToken, requireUser, async (req, res) => {
  try {
    const db = getDB();
    const { q, type, condition, barangay } = req.query;

    if (process.env.DB_TYPE === 'postgresql') {
      const clauses = ["items.status = 'available'"];
      const params = [];
      let idx = 1;
      if (type) { clauses.push(`items.type = $${idx++}`); params.push(type); }
      if (condition) { clauses.push(`items.condition = $${idx++}`); params.push(condition); }
      if (barangay) { clauses.push(`users.barangay = $${idx++}`); params.push(barangay); }
      if (q) {
        clauses.push(`(LOWER(items.name) LIKE $${idx} OR LOWER(items.description) LIKE $${idx})`);
        params.push(`%${q.toLowerCase()}%`);
        idx++;
      }

      const result = await db.query(
        `SELECT items.*, users.username as owner_username, users.full_name as owner_name, users.barangay
         FROM items LEFT JOIN users ON items.owner_id = users.id
         WHERE ${clauses.join(' AND ')}
         ORDER BY items.created_at DESC`,
        params
      );
      return res.json({ items: result.rows });
    } else {
      const clauses = ["items.status = 'available'"];
      const params = [];
      if (type) { clauses.push(`items.type = ?`); params.push(type); }
      if (condition) { clauses.push(`items.condition = ?`); params.push(condition); }
      if (barangay) { clauses.push(`users.barangay = ?`); params.push(barangay); }
      if (q) {
        clauses.push(`(LOWER(items.name) LIKE ? OR LOWER(items.description) LIKE ?)`);
        const needle = `%${q.toLowerCase()}%`;
        params.push(needle, needle);
      }

      const sql = `SELECT items.*, users.username as owner_username, users.full_name as owner_name, users.barangay
                   FROM items LEFT JOIN users ON items.owner_id = users.id
                   WHERE ${clauses.join(' AND ')}
                   ORDER BY items.created_at DESC`;
      db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        return res.json({ items: rows });
      });
    }
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Failed to get items' });
  }
});

// Get my items (resident)
router.get('/mine', authenticateToken, requireResident, async (req, res) => {
  try {
    const db = getDB();
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT * FROM items WHERE owner_id = $1 ORDER BY created_at DESC`,
        [req.user.id]
      );
      return res.json({ items: result.rows });
    } else {
      db.all(
        `SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC`,
        [req.user.id],
        (err, rows) => {
          if (err) return res.status(500).json({ message: 'Database error' });
          return res.json({ items: rows });
        }
      );
    }
  } catch (error) {
    console.error('My items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: list pending items for approval
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT items.*, users.username as owner_username, users.full_name as owner_name, users.email
         FROM items LEFT JOIN users ON items.owner_id = users.id
         WHERE items.status = 'pending'
         ORDER BY items.created_at ASC`
      );
      return res.json({ items: result.rows });
    } else {
      db.all(
        `SELECT items.*, users.username as owner_username, users.full_name as owner_name, users.email
         FROM items LEFT JOIN users ON items.owner_id = users.id
         WHERE items.status = 'pending'
         ORDER BY items.created_at ASC`,
        (err, rows) => {
          if (err) return res.status(500).json({ message: 'Database error' });
          return res.json({ items: rows });
        }
      );
    }
  } catch (error) {
    console.error('Pending items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: approve item (set to available)
router.put('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `UPDATE items SET status = 'available', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found or not pending' });
      return res.json({ message: 'Item approved', item: result.rows[0] });
    } else {
      db.run(
        `UPDATE items SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`,
        [id],
        function(err) {
          if (err) return res.status(500).json({ message: 'Update failed' });
          if (this.changes === 0) return res.status(404).json({ message: 'Item not found or not pending' });
          db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
            if (err) return res.status(500).json({ message: 'Failed to fetch item' });
            return res.json({ message: 'Item approved', item: row });
          });
        }
      );
    }
  } catch (error) {
    console.error('Approve item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: reject item
router.put('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `UPDATE items SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found or not pending' });
      return res.json({ message: 'Item rejected', item: result.rows[0] });
    } else {
      db.run(
        `UPDATE items SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`,
        [id],
        function(err) {
          if (err) return res.status(500).json({ message: 'Update failed' });
          if (this.changes === 0) return res.status(404).json({ message: 'Item not found or not pending' });
          db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
            if (err) return res.status(500).json({ message: 'Failed to fetch item' });
            return res.json({ message: 'Item rejected', item: row });
          });
        }
      );
    }
  } catch (error) {
    console.error('Reject item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

