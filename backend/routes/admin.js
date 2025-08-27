const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all pending resident verifications with additional profile fields
router.get('/verifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT id, username, full_name, email, barangay, municipality, province, contact_number, valid_id, selfie_with_id, status, is_verified, created_at
         FROM users 
         WHERE role = 'resident' AND status = 'pending'
         ORDER BY created_at ASC`
      );
      
      res.json({ verifications: result.rows });
    } else {
      // SQLite implementation
      db.all(
        `SELECT id, username, full_name, email, barangay, municipality, province, contact_number, valid_id, selfie_with_id, status, is_verified, created_at
         FROM users 
         WHERE role = 'resident' AND status = 'pending'
         ORDER BY created_at ASC`,
        (err, rows) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }
          res.json({ verifications: rows });
        }
      );
    }
  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({ message: 'Failed to get verifications' });
  }
});

// Get all requests for admin management with filtering and pagination
router.get('/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'all', search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const db = getDB();
    let whereClause = '';
    let params = [];
    let paramIndex = 1;
    
    // Build where clause based on filters
    if (status !== 'all') {
      whereClause = `WHERE r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      const searchCondition = `(i.name ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      if (whereClause) {
        whereClause += ` AND ${searchCondition}`;
      } else {
        whereClause = `WHERE ${searchCondition}`;
      }
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (process.env.DB_TYPE === 'postgresql') {
      // Get total count
      let countQuery = `
        SELECT COUNT(*) 
        FROM requests r 
        JOIN items i ON r.item_id = i.id 
        JOIN users u ON r.requester_id = u.id
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);
      
      // Get requests with pagination
      let requestsQuery = `
        SELECT 
          r.id, r.purpose, r.status, r.remarks, r.created_at, r.updated_at,
          i.name as item_name, i.type as item_type, i.condition as item_condition,
          u.full_name as resident_name, u.email as resident_email, u.barangay as resident_barangay
        FROM requests r 
        JOIN items i ON r.item_id = i.id 
        JOIN users u ON r.requester_id = u.id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      const result = await db.query(requestsQuery, params);
      
      res.json({
        requests: result.rows,
        totalCount,
        totalPages,
        currentPage: parseInt(page)
      });
    } else {
      // SQLite implementation
      // Convert PostgreSQL-style queries to SQLite
      let sqliteWhereClause = whereClause
        .replace(/\$\d+/g, '?')
        .replace(/ILIKE/g, 'LIKE');
      
      let countQuery = `
        SELECT COUNT(*) as count
        FROM requests r 
        JOIN items i ON r.item_id = i.id 
        JOIN users u ON r.requester_id = u.id
        ${sqliteWhereClause}
      `;
      
      db.get(countQuery, params, (err, countRow) => {
        if (err) {
          console.error('SQLite count error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        const totalCount = countRow.count;
        const totalPages = Math.ceil(totalCount / limit);
        
        // Get requests with pagination
        let requestsQuery = `
          SELECT 
            r.id, r.purpose, r.status, r.remarks, r.created_at, r.updated_at,
            i.name as item_name, i.type as item_type, i.condition as item_condition,
            u.full_name as resident_name, u.email as resident_email, u.barangay as resident_barangay
          FROM requests r 
          JOIN items i ON r.item_id = i.id 
          JOIN users u ON r.requester_id = u.id
          ${sqliteWhereClause}
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?
        `;
        
        const requestParams = [...params, limit, offset];
        db.all(requestsQuery, requestParams, (err, rows) => {
          if (err) {
            console.error('SQLite requests error:', err);
            return res.status(500).json({ message: 'Database error' });
          }
          
          res.json({
            requests: rows,
            totalCount,
            totalPages,
            currentPage: parseInt(page)
          });
        });
      });
    }
  } catch (error) {
    console.error('Get admin requests error:', error);
    res.status(500).json({ message: 'Failed to get requests' });
  }
});

// Get verification details with ID image
router.get('/verifications/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDB();
    
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT id, username, full_name, email, barangay, municipality, province, contact_number, valid_id, selfie_with_id, status, is_verified, created_at 
         FROM users 
         WHERE id = $1 AND role = 'resident'`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user: result.rows[0] });
    } else {
      // SQLite implementation
      db.get(
        `SELECT id, username, full_name, email, barangay, municipality, province, contact_number, valid_id, selfie_with_id, status, is_verified, created_at 
         FROM users WHERE id = ? AND role = 'resident'`,
        [userId],
        (err, user) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }
          
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          
          res.json({ user });
        }
      );
    }
  } catch (error) {
    console.error('Get verification details error:', error);
    res.status(500).json({ message: 'Failed to get verification details' });
  }
});

// Approve resident verification
router.put('/verifications/:userId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDB();
    
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `UPDATE users 
         SET status = 'approved', is_verified = true, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND role = 'resident' 
         RETURNING id, username, full_name, email, status, is_verified`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found or not a resident' });
      }
      
      res.json({ 
        message: 'Resident verification approved successfully',
        user: result.rows[0]
      });
    } else {
      // SQLite implementation
      db.run(
        `UPDATE users 
         SET status = 'approved', is_verified = 1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND role = 'resident'`,
        [userId],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found or not a resident' });
          }
          
          // Get updated user
          db.get(
            'SELECT id, username, full_name, email, status, is_verified FROM users WHERE id = ?',
            [userId],
            (err, user) => {
              if (err) {
                return res.status(500).json({ message: 'Database error' });
              }
              
              res.json({ 
                message: 'Resident verification approved successfully',
                user
              });
            }
          );
        }
      );
    }
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ message: 'Failed to approve verification' });
  }
});

// Reject resident verification
router.put('/verifications/:userId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const db = getDB();
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    if (process.env.DB_TYPE === 'postgresql') {
      // Capture snapshot before update for audit
      const pre = await db.query(`SELECT id, full_name, email, barangay, municipality, province, contact_number, valid_id, selfie_with_id FROM users WHERE id = $1`, [userId]);
      const prev = pre.rows[0];
      const result = await db.query(
        `UPDATE users 
         SET status = 'denied', is_verified = false, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND role = 'resident' 
         RETURNING id, username, full_name, email, status, is_verified, rejection_reason`,
        [userId, reason]
      );
      // Insert audit record if table exists
      try {
        await db.query(
          `INSERT INTO user_rejections (user_id, reason, snapshot_full_name, snapshot_email, snapshot_barangay, snapshot_municipality, snapshot_province, snapshot_contact_number, snapshot_valid_id, snapshot_selfie_with_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [userId, reason, prev?.full_name || null, prev?.email || null, prev?.barangay || null, prev?.municipality || null, prev?.province || null, prev?.contact_number || null, prev?.valid_id || null, prev?.selfie_with_id || null]
        );
      } catch (e) {}
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found or not a resident' });
      }
      
      res.json({ 
        message: 'Resident verification rejected',
        user: result.rows[0]
      });
    } else {
      // SQLite implementation
      // Capture snapshot before update
      db.get('SELECT id, full_name, email, barangay, municipality, province, contact_number, valid_id, selfie_with_id FROM users WHERE id = ?', [userId], (preErr, prev) => {
        db.run(
        `UPDATE users 
         SET status = 'denied', is_verified = 0, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND role = 'resident'`,
        [reason, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found or not a resident' });
            }
          
          // Insert audit record if table exists
          db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='user_rejections'", (tblErr, tbl) => {
            if (!tblErr && tbl) {
              db.run(
                `INSERT INTO user_rejections (user_id, reason, snapshot_full_name, snapshot_email, snapshot_barangay, snapshot_municipality, snapshot_province, snapshot_contact_number, snapshot_valid_id, snapshot_selfie_with_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, reason, prev?.full_name || null, prev?.email || null, prev?.barangay || null, prev?.municipality || null, prev?.province || null, prev?.contact_number || null, prev?.valid_id || null, prev?.selfie_with_id || null],
                () => {}
              );
            }
          });

          // Get updated user
          db.get(
            'SELECT id, username, full_name, email, status, is_verified, rejection_reason FROM users WHERE id = ?',
            [userId],
            (err, user) => {
              if (err) {
                return res.status(500).json({ message: 'Database error' });
              }
              
              res.json({ 
                message: 'Resident verification rejected',
                user
              });
            }
          );
        }
      );
      });
    }
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ message: 'Failed to reject verification' });
  }
});

// Get user rejection history (audit trail)
router.get('/users/:userId/rejections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDB();

    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT id, reason, snapshot_full_name, snapshot_email, snapshot_barangay, snapshot_municipality, snapshot_province, snapshot_contact_number, snapshot_valid_id, snapshot_selfie_with_id, created_at
         FROM user_rejections WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      return res.json({ rejections: result.rows });
    } else {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='user_rejections'", (tblErr, tbl) => {
        if (tblErr || !tbl) {
          return res.json({ rejections: [] });
        }
        db.all(
          `SELECT id, reason, snapshot_full_name, snapshot_email, snapshot_barangay, snapshot_municipality, snapshot_province, snapshot_contact_number, snapshot_valid_id, snapshot_selfie_with_id, created_at
           FROM user_rejections WHERE user_id = ? ORDER BY created_at DESC`,
          [userId],
          (err, rows) => {
            if (err) {
              return res.status(500).json({ message: 'Database error' });
            }
            return res.json({ rejections: rows });
          }
        );
      });
    }
  } catch (error) {
    console.error('Get rejection history error:', error);
    res.status(500).json({ message: 'Failed to get rejection history' });
  }
});

// Get admin dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    if (process.env.DB_TYPE === 'postgresql') {
      // Get counts for different user statuses
      const pendingCount = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'resident' AND status = 'pending'"
      );
      
      const approvedCount = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'resident' AND status = 'approved'"
      );
      
      const rejectedCount = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'resident' AND status = 'denied'"
      );
      
      const totalResidents = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'resident'"
      );
      
      const totalAdmins = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
      );
      
      res.json({
        stats: {
          pendingVerifications: parseInt(pendingCount.rows[0].count),
          approvedResidents: parseInt(approvedCount.rows[0].count),
          rejectedResidents: parseInt(rejectedCount.rows[0].count),
          totalResidents: parseInt(totalResidents.rows[0].count),
          totalAdmins: parseInt(totalAdmins.rows[0].count)
        }
      });
    } else {
      // SQLite implementation
      db.get(
        "SELECT COUNT(*) as count FROM users WHERE role = 'resident' AND status = 'pending'",
        (err, pendingRow) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }
          
          db.get(
            "SELECT COUNT(*) as count FROM users WHERE role = 'resident' AND status = 'approved'",
            (err, approvedRow) => {
              if (err) {
                return res.status(500).json({ message: 'Database error' });
              }
              
              db.get(
                "SELECT COUNT(*) as count FROM users WHERE role = 'resident' AND status = 'denied'",
                (err, rejectedRow) => {
                  if (err) {
                    return res.status(500).json({ message: 'Database error' });
                  }
                  
                  db.get(
                    "SELECT COUNT(*) as count FROM users WHERE role = 'resident'",
                    (err, totalResidentsRow) => {
                      if (err) {
                        return res.status(500).json({ message: 'Database error' });
                      }
                      
                      db.get(
                        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
                        (err, totalAdminsRow) => {
                          if (err) {
                            return res.status(500).json({ message: 'Database error' });
                          }
                          
                          res.json({
                            stats: {
                              pendingVerifications: pendingRow.count,
                              approvedResidents: approvedRow.count,
                              rejectedResidents: rejectedRow.count,
                              totalResidents: totalResidentsRow.count,
                              totalAdmins: totalAdminsRow.count
                            }
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, role } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();
    
    let whereClause = '';
    let params = [];
    let paramCount = 1;
    
    if (status) {
      whereClause += ` AND is_verified = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (role) {
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }
    
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT id, username, full_name, email, role, barangay, contact_number, is_verified, created_at 
         FROM users 
         WHERE 1=1 ${whereClause}
         ORDER BY created_at DESC 
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, limit, offset]
      );
      
      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM users WHERE 1=1 ${whereClause}`,
        params
      );
      
      res.json({
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } else {
      // SQLite implementation
      const whereSQL = whereClause.replace(/\$\d+/g, '?');
      
      db.all(
        `SELECT id, username, full_name, email, role, barangay, contact_number, is_verified, created_at 
         FROM users 
         WHERE 1=1 ${whereSQL}
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
        (err, users) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }
          
          // Get total count
          db.get(
            `SELECT COUNT(*) as count FROM users WHERE 1=1 ${whereSQL}`,
            params,
            (err, countRow) => {
              if (err) {
                return res.status(500).json({ message: 'Database error' });
              }
              
              res.json({
                users,
                pagination: {
                  page: parseInt(page),
                  limit: parseInt(limit),
                  total: countRow.count,
                  pages: Math.ceil(countRow.count / limit)
                }
              });
            }
          );
        }
      );
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Create new admin user (admin only)
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, full_name, email, contact_number } = req.body;
    const db = getDB();

    // Validation
    if (!username || !password || !full_name || !email || !contact_number) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        fieldErrors: {
          username: !username ? 'Username is required' : null,
          password: !password ? 'Password is required' : null,
          full_name: !full_name ? 'Full name is required' : null,
          email: !email ? 'Email is required' : null,
          contact_number: !contact_number ? 'Contact number is required' : null
        }
      });
    }

    // Username validation
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters',
        fieldErrors: { username: 'Username must be at least 3 characters' }
      });
    }

    // Email format validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        fieldErrors: { email: 'Please provide a valid email address' }
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
        fieldErrors: { password: 'Password must be at least 6 characters' }
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain lowercase, uppercase, and number',
        fieldErrors: { password: 'Password must contain lowercase, uppercase, and number' }
      });
    }

    // Contact number validation
    if (contact_number.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Contact number must be at least 10 digits',
        fieldErrors: { contact_number: 'Contact number must be at least 10 digits' }
      });
    }

    // Check if email or username already exists
    let existingUser;
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
      existingUser = result.rows[0];
    } else {
      // SQLite implementation
      existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or username already exists',
        fieldErrors: {
          email: 'Email already exists',
          username: 'Username already exists'
        }
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    let newAdmin;
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `INSERT INTO users (username, full_name, password, email, contact_number, role, status, is_verified) 
         VALUES ($1, $2, $3, $4, $5, 'admin', 'approved', true) 
         RETURNING id, username, full_name, email, contact_number, role, status, is_verified, created_at`,
        [username, full_name, hashedPassword, email, contact_number]
      );
      newAdmin = result.rows[0];
    } else {
      // SQLite implementation
      newAdmin = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO users (username, full_name, password, email, contact_number, role, status, is_verified) 
           VALUES (?, ?, ?, ?, ?, 'admin', 'approved', 1)`,
          [username, full_name, hashedPassword, email, contact_number],
          function(err) {
            if (err) reject(err);
            else {
              // Get the created admin
              db.get('SELECT id, username, full_name, email, contact_number, role, status, is_verified, created_at FROM users WHERE id = ?', [this.lastID], (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            }
          }
        );
      });
    }

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      admin: newAdmin
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user. Please try again.'
    });
  }
});

// Get all admin users
router.get('/admins', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT id, username, full_name, email, contact_number, created_at 
         FROM users 
         WHERE role = 'admin' 
         ORDER BY created_at ASC`
      );
      
      res.json({ admins: result.rows });
    } else {
      // SQLite implementation
      db.all(
        `SELECT id, username, full_name, email, contact_number, created_at 
         FROM users 
         WHERE role = 'admin' 
         ORDER BY created_at ASC`,
        (err, rows) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }
          res.json({ admins: rows });
        }
      );
    }
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Failed to get admin users' });
  }
});

// Delete admin user (except default admin)
router.delete('/admins/:adminId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { adminId } = req.params;
    const db = getDB();

    // Check if it's the default admin (username: Admin)
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        'SELECT username FROM users WHERE id = $1 AND role = $2',
        [adminId, 'admin']
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Admin user not found' });
      }

      if (result.rows[0].username === 'Admin') {
        return res.status(403).json({ message: 'Cannot delete the default admin user' });
      }

      await db.query('DELETE FROM users WHERE id = $1 AND role = $2', [adminId, 'admin']);
    } else {
      // SQLite implementation
      db.get(
        'SELECT username FROM users WHERE id = ? AND role = ?',
        [adminId, 'admin'],
        (err, admin) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }

          if (!admin) {
            return res.status(404).json({ message: 'Admin user not found' });
          }

          if (admin.username === 'Admin') {
            return res.status(403).json({ message: 'Cannot delete the default admin user' });
          }

          db.run('DELETE FROM users WHERE id = ? AND role = ?', [adminId, 'admin'], function(err) {
            if (err) {
              return res.status(500).json({ message: 'Failed to delete admin user' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ message: 'Admin user not found' });
            }

            res.json({ message: 'Admin user deleted successfully' });
          });
        }
      );
      return; // SQLite is async, so we return early
    }

    res.json({ message: 'Admin user deleted successfully' });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Failed to delete admin user' });
  }
});

module.exports = router;
