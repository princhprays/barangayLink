const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Require admin role
const requireAdmin = requireRole(['admin']);

// Require resident role
const requireResident = requireRole(['resident']);

// Require either admin or resident role
const requireUser = requireRole(['admin', 'resident']);

// Check if user is verified (for residents)
const requireVerified = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next(); // Admins are always verified
    }

    const db = getDB();
    
    if (process.env.DB_TYPE === 'postgresql') {
      // PostgreSQL query
      const result = await db.query(
        'SELECT is_verified FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!result.rows[0].is_verified) {
        return res.status(403).json({ 
          message: 'Account verification required. Please wait for admin approval.' 
        });
      }
    } else {
      // SQLite query
      db.get(
        'SELECT is_verified FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }
          
          if (!row) {
            return res.status(404).json({ message: 'User not found' });
          }
          
          if (!row.is_verified) {
            return res.status(403).json({ 
              message: 'Account verification required. Please wait for admin approval.' 
            });
          }
          
          next();
        }
      );
      return; // SQLite is async, so we return early
    }
    
    next();
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireResident,
  requireUser,
  requireVerified
};
