const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin, requireResident, requireUser, requireVerified } = require('../middleware/auth');
const router = express.Router();

// Create a new request (resident only, requires verification)
router.post('/', authenticateToken, requireResident, requireVerified, async (req, res) => {
  try {
    const { item_id, purpose } = req.body;
    const requester_id = req.user.id;
    const db = getDB();

    // Validation
    if (!item_id || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Item ID and purpose are required',
        fieldErrors: {
          item_id: !item_id ? 'Item ID is required' : null,
          purpose: !purpose ? 'Purpose is required' : null
        }
      });
    }

    if (purpose.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Purpose must be at least 10 characters long',
        fieldErrors: { purpose: 'Purpose must be at least 10 characters long' }
      });
    }



    // Check if item exists and is available
    let item;
    if (process.env.DB_TYPE === 'postgresql') {
      const itemResult = await db.query(
        'SELECT * FROM items WHERE id = $1 AND status = $2',
        [item_id, 'available']
      );
      
      if (itemResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Item not found or not available',
          fieldErrors: { item_id: 'Item not found or not available' }
        });
      }
      item = itemResult.rows[0];
    } else {
      // SQLite implementation
      item = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM items WHERE id = ? AND status = ?',
          [item_id, 'available'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!item) {
        return res.status(400).json({
          success: false,
          message: 'Item not found or not available',
          fieldErrors: { item_id: 'Item not found or not available' }
        });
      }
    }

    // Check if user already has a pending request for this item
    let existingRequest;
    if (process.env.DB_TYPE === 'postgresql') {
      const existingResult = await db.query(
        'SELECT id FROM requests WHERE item_id = $1 AND requester_id = $2 AND status = $3',
        [item_id, requester_id, 'pending']
      );
      existingRequest = existingResult.rows[0];
    } else {
      // SQLite implementation
      existingRequest = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM requests WHERE item_id = ? AND requester_id = ? AND status = ?',
          [item_id, requester_id, 'pending'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    }

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this item',
        fieldErrors: { item_id: 'You already have a pending request for this item' }
      });
    }

    // Create request
    let newRequest;
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `INSERT INTO requests (item_id, requester_id, purpose, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [item_id, requester_id, purpose]
      );
      newRequest = result.rows[0];
    } else {
      // SQLite implementation
      newRequest = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO requests (item_id, requester_id, purpose, status)
           VALUES (?, ?, ?, 'pending')`,
          [item_id, requester_id, purpose],
          function(err) {
            if (err) reject(err);
            else {
              // Get the created request
              db.get('SELECT * FROM requests WHERE id = ?', [this.lastID], (err, row) => {
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
      message: 'Request submitted successfully. Waiting for admin approval.',
      request: newRequest
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request. Please try again.'
    });
  }
});

// Get all requests for admin (with item and user details)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let whereClause = '';
    let params = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND requests.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT 
           requests.*,
           items.name as item_name,
           items.type as item_type,
           items.condition as item_condition,
           items.photo as item_photo,
           users.username as requester_username,
           users.full_name as requester_name,
           users.email as requester_email,
           users.barangay as requester_barangay
         FROM requests 
         LEFT JOIN items ON requests.item_id = items.id
         LEFT JOIN users ON requests.requester_id = users.id
         WHERE 1=1 ${whereClause}
         ORDER BY requests.created_at DESC 
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, limit, offset]
      );

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM requests WHERE 1=1 ${whereClause}`,
        params
      );

      res.json({
        success: true,
        requests: result.rows,
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
        `SELECT 
           requests.*,
           items.name as item_name,
           items.type as item_type,
           items.condition as item_condition,
           items.photo as item_photo,
           users.username as requester_username,
           users.full_name as requester_name,
           users.email as requester_email,
           users.barangay as requester_barangay
         FROM requests 
         LEFT JOIN items ON requests.item_id = items.id
         LEFT JOIN users ON requests.requester_id = users.id
         WHERE 1=1 ${whereSQL}
         ORDER BY requests.created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
        (err, requests) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }

          // Get total count
          db.get(
            `SELECT COUNT(*) as count FROM requests WHERE 1=1 ${whereSQL}`,
            params,
            (err, countRow) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: 'Database error'
                });
              }

              res.json({
                success: true,
                requests,
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
    console.error('Get admin requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get requests'
    });
  }
});

// Get user's own requests (resident only)
router.get('/my-requests', authenticateToken, requireResident, async (req, res) => {
  try {
    const requester_id = req.user.id;
    const db = getDB();

    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT 
           requests.*,
           items.name as item_name,
           items.type as item_type,
           items.condition as item_condition,
           items.photo as item_photo
         FROM requests 
         LEFT JOIN items ON requests.item_id = items.id
         WHERE requests.requester_id = $1
         ORDER BY requests.created_at DESC`,
        [requester_id]
      );

      res.json({
        success: true,
        requests: result.rows
      });
    } else {
      // SQLite implementation
      db.all(
        `SELECT 
           requests.*,
           items.name as item_name,
           items.type as item_type,
           items.condition as item_condition,
           items.photo as item_photo
         FROM requests 
         LEFT JOIN items ON requests.item_id = items.id
         WHERE requests.requester_id = ?
         ORDER BY requests.created_at DESC`,
        [requester_id],
        (err, requests) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }

          res.json({
            success: true,
            requests
          });
        }
      );
    }
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get your requests'
    });
  }
});

// Admin: Approve request
router.put('/:requestId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { remarks } = req.body;
    const db = getDB();

    // Get request details
    let request;
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        'SELECT * FROM requests WHERE id = $1 AND status = $2',
        [requestId, 'pending']
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or not pending'
        });
      }
      request = result.rows[0];
    } else {
      // SQLite implementation
      request = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM requests WHERE id = ? AND status = ?',
          [requestId, 'pending'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or not pending'
        });
      }
    }

    // Update request status
    if (process.env.DB_TYPE === 'postgresql') {
      const updateResult = await db.query(
        `UPDATE requests 
         SET status = 'approved', remarks = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [remarks || null, requestId]
      );

      // Update item status to borrowed
      await db.query(
        'UPDATE items SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['borrowed', request.item_id]
      );

      res.json({
        success: true,
        message: 'Request approved successfully',
        request: updateResult.rows[0]
      });
    } else {
      // SQLite implementation
      db.run(
        `UPDATE requests 
         SET status = 'approved', remarks = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [remarks || null, requestId],
        function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Failed to update request'
            });
          }

          // Update item status to borrowed
          db.run(
            'UPDATE items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['borrowed', request.item_id],
            function(err) {
              if (err) {
                console.error('Failed to update item status:', err);
              }

              // Get updated request
              db.get('SELECT * FROM requests WHERE id = ?', [requestId], (err, row) => {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: 'Failed to get updated request'
                  });
                }

                res.json({
                  success: true,
                  message: 'Request approved successfully',
                  request: row
                });
              });
            }
          );
        }
      );
    }
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request'
    });
  }
});

// Admin: Deny request
router.put('/:requestId/deny', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { remarks } = req.body;
    const db = getDB();

    if (!remarks || remarks.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection remarks are required',
        fieldErrors: { remarks: 'Rejection remarks are required' }
      });
    }

    // Get request details
    let request;
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        'SELECT * FROM requests WHERE id = $1 AND status = $2',
        [requestId, 'pending']
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or not pending'
        });
      }
      request = result.rows[0];
    } else {
      // SQLite implementation
      request = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM requests WHERE id = ? AND status = ?',
          [requestId, 'pending'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or not pending'
        });
      }
    }

    // Update request status
    if (process.env.DB_TYPE === 'postgresql') {
      const updateResult = await db.query(
        `UPDATE requests 
         SET status = 'denied', remarks = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [remarks, requestId]
      );

      res.json({
        success: true,
        message: 'Request denied successfully',
        request: updateResult.rows[0]
      });
    } else {
      // SQLite implementation
      db.run(
        `UPDATE requests 
         SET status = 'denied', remarks = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [remarks, requestId],
        function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Failed to update request'
            });
          }

          // Get updated request
          db.get('SELECT * FROM requests WHERE id = ?', [requestId], (err, row) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Failed to get updated request'
              });
            }

            res.json({
              success: true,
              message: 'Request denied successfully',
              request: row
            });
          });
        }
      );
    }
  } catch (error) {
    console.error('Deny request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deny request'
    });
  }
});

// Get request details by ID
router.get('/:requestId', authenticateToken, requireUser, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const db = getDB();

    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query(
        `SELECT 
           requests.*,
           items.name as item_name,
           items.type as item_type,
           items.condition as item_condition,
           items.photo as item_photo,
           users.username as requester_username,
           users.full_name as requester_name,
           users.email as requester_email,
           users.barangay as requester_barangay
         FROM requests 
         LEFT JOIN items ON requests.item_id = items.id
         LEFT JOIN users ON requests.requester_id = users.id
         WHERE requests.id = $1`,
        [requestId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      const request = result.rows[0];

      // Check access control
      if (req.user.role !== 'admin' && request.requester_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        request
      });
    } else {
      // SQLite implementation
      db.get(
        `SELECT 
           requests.*,
           items.name as item_name,
           items.type as item_type,
           items.condition as item_condition,
           items.photo as item_photo,
           users.username as requester_username,
           users.full_name as requester_name,
           users.email as requester_email,
           users.barangay as requester_barangay
         FROM requests 
         LEFT JOIN items ON requests.item_id = items.id
         LEFT JOIN users ON requests.requester_id = users.id
         WHERE requests.id = ?`,
        [requestId],
        (err, request) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }

          if (!request) {
            return res.status(404).json({
              success: false,
              message: 'Request not found'
            });
          }

          // Check access control
          if (req.user.role !== 'admin' && request.requester_id !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Access denied'
            });
          }

          res.json({
            success: true,
            request
          });
        }
      );
    }
  } catch (error) {
    console.error('Get request details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get request details'
    });
  }
});

module.exports = router;

