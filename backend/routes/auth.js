const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { authenticateToken, requireUser, requireVerified } = require('../middleware/auth');
const { uploadID, uploadResidentDocs, uploadProfilePicture, handleUploadError, cleanupUploadedFiles } = require('../middleware/upload');
const {
  validateAdminRegistration,
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate
} = require('../middleware/validation');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.full_name 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Resident Registration (enhanced uploads: ID + selfie)
router.post('/register/resident', 
  uploadResidentDocs,
  async (req, res) => {
    try {
      // First, validate all the data without uploading files
      const {
        username, full_name, email, password, barangay, municipality, province, contact_number
      } = req.body;

      // Basic validation before file upload
      if (!username || !full_name || !email || !password || !contact_number) {
        return res.status(400).json({ 
          success: false,
          message: 'All required fields must be provided',
          fieldErrors: {
            username: !username ? 'Username is required' : null,
            full_name: !full_name ? 'Full name is required' : null,
            email: !email ? 'Email is required' : null,
            password: !password ? 'Password is required' : null,
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

      // Barangay, municipality, and province validation - required for residents
      if (!barangay || !barangay.trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'Barangay is required for residents',
          fieldErrors: { barangay: 'Barangay is required for residents' }
        });
      }
      
      if (!municipality || !municipality.trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'Municipality is required for residents',
          fieldErrors: { municipality: 'Municipality is required for residents' }
        });
      }
      
      if (!province || !province.trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'Province is required for residents',
          fieldErrors: { province: 'Province is required for residents' }
        });
      }

      // Check if email or username already exists
      const db = getDB();
      let existingUser;
      
      if (process.env.DB_TYPE === 'postgresql') {
        const result = await db.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        existingUser = result.rows[0];
      } else {
        // SQLite implementation
        existingUser = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      }

      if (existingUser) {
        // If already approved, block re-registration
        if (existingUser.status === 'approved') {
          return res.status(400).json({ 
            success: false,
            message: 'Email or username already exists',
            fieldErrors: { 
              email: 'Email already exists',
              username: 'Username already exists'
            }
          });
        }

        // If rejected/denied, allow resubmission: update details and reset to pending
        if (existingUser.status === 'denied') {
          const hashedPasswordResubmit = await bcrypt.hash(password, 10);

          let validIdFilename = null;
          let selfieWithIdFilename = null;
          try {
            if (req.files) {
              if (req.files.valid_id && req.files.valid_id[0]) {
                validIdFilename = req.files.valid_id[0].filename;
              }
              if (req.files.selfie_with_id && req.files.selfie_with_id[0]) {
                selfieWithIdFilename = req.files.selfie_with_id[0].filename;
              }
            }
          } catch {}

          // Use previous uploads if new ones not provided
          if (!validIdFilename) validIdFilename = existingUser.valid_id;
          if (!selfieWithIdFilename) selfieWithIdFilename = existingUser.selfie_with_id;

          if (process.env.DB_TYPE === 'postgresql') {
            // Optionally record previous state in audit table if exists
            try {
              await db.query(
                `INSERT INTO user_rejections (user_id, reason, snapshot_full_name, snapshot_email, snapshot_barangay, snapshot_municipality, snapshot_province, snapshot_contact_number, snapshot_valid_id, snapshot_selfie_with_id)
                 VALUES ($1, COALESCE($2, 'resubmission'), $3, $4, $5, $6, $7, $8, $9, $10)`,
                [existingUser.id, existingUser.rejection_reason || 'resubmission', existingUser.full_name, existingUser.email, existingUser.barangay, existingUser.municipality, existingUser.province, existingUser.contact_number, existingUser.valid_id, existingUser.selfie_with_id]
              );
            } catch (e) {}

            const resultUpdate = await db.query(
              `UPDATE users SET username = $1, full_name = $2, password = $3, email = $4, contact_number = $5, barangay = $6, municipality = $7, province = $8, valid_id = $9, selfie_with_id = $10, status = 'pending', is_verified = false, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $11 RETURNING id, username, full_name, email, role, status, is_verified`,
              [username, full_name, hashedPasswordResubmit, email, contact_number, barangay, municipality, province, validIdFilename, selfieWithIdFilename, existingUser.id]
            );
            const updatedUser = resultUpdate.rows[0];
            const token = generateToken(updatedUser);
            return res.status(200).json({
              success: true,
              message: 'Your previous application was rejected. We have updated your details and resubmitted for approval.',
              user: updatedUser,
              token
            });
          } else {
            // SQLite: create audit row if table exists
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='user_rejections'", (tblErr, tbl) => {
              if (!tblErr && tbl) {
                db.run(
                  `INSERT INTO user_rejections (user_id, reason, snapshot_full_name, snapshot_email, snapshot_barangay, snapshot_municipality, snapshot_province, snapshot_contact_number, snapshot_valid_id, snapshot_selfie_with_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [existingUser.id, existingUser.rejection_reason || 'resubmission', existingUser.full_name, existingUser.email, existingUser.barangay, existingUser.municipality, existingUser.province, existingUser.contact_number, existingUser.valid_id, existingUser.selfie_with_id],
                  () => {}
                );
              }
            });

            return await new Promise((resolve, reject) => {
              db.run(
                `UPDATE users SET username = ?, full_name = ?, password = ?, email = ?, contact_number = ?, barangay = ?, municipality = ?, province = ?, valid_id = ?, selfie_with_id = ?, status = 'pending', is_verified = 0, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [username, full_name, hashedPasswordResubmit, email, contact_number, barangay, municipality, province, validIdFilename, selfieWithIdFilename, existingUser.id],
                function(err) {
                  if (err) {
                    return reject(res.status(500).json({ success: false, message: 'Failed to resubmit registration' }));
                  }
                  db.get('SELECT id, username, full_name, email, role, status, is_verified FROM users WHERE id = ?', [existingUser.id], (gerr, updatedUser) => {
                    if (gerr) {
                      return reject(res.status(500).json({ success: false, message: 'Failed to load updated user' }));
                    }
                    const token = generateToken(updatedUser);
                    resolve(res.status(200).json({
                      success: true,
                      message: 'Your previous application was rejected. We have updated your details and resubmitted for approval.',
                      user: updatedUser,
                      token
                    }));
                  });
                }
              );
            });
          }
        }

        // Otherwise (pending), block duplicate
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
      const hashedPassword = await bcrypt.hash(password, 10);

      // Get uploaded file information
      let validIdFilename = null;
      let selfieWithIdFilename = null;
      
      try {
        if (req.files) {
          console.log('Uploaded files:', Object.keys(req.files));
          
          if (req.files.valid_id && req.files.valid_id[0]) {
            validIdFilename = req.files.valid_id[0].filename;
            console.log('Valid ID file uploaded:', validIdFilename);
          }
          
          if (req.files.selfie_with_id && req.files.selfie_with_id[0]) {
            selfieWithIdFilename = req.files.selfie_with_id[0].filename;
            console.log('Selfie file uploaded:', selfieWithIdFilename);
          }
        } else {
          console.log('No files uploaded');
        }
      } catch (fileError) {
        console.error('Error processing uploaded files:', fileError);
        // Continue without files if there's an error
      }

      // Create user
      let newUser;
      if (process.env.DB_TYPE === 'postgresql') {
        const result = await db.query(
          `INSERT INTO users (username, full_name, password, email, contact_number, barangay, municipality, province, valid_id, selfie_with_id, role, status, is_verified) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'resident', 'pending', false) 
           RETURNING id, username, full_name, email, role, status, is_verified`,
          [username, full_name, hashedPassword, email, contact_number, barangay, municipality, province, validIdFilename, selfieWithIdFilename]
        );
        newUser = result.rows[0];
      } else {
        // SQLite implementation
        newUser = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO users (username, full_name, password, email, contact_number, barangay, municipality, province, valid_id, selfie_with_id, role, status, is_verified) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'resident', 'pending', 0)`,
            [username, full_name, hashedPassword, email, contact_number, barangay, municipality, province, validIdFilename, selfieWithIdFilename],
            function(err) {
              if (err) reject(err);
              else {
                // Get the created user
                db.get('SELECT id, username, full_name, email, role, status, is_verified FROM users WHERE id = ?', [this.lastID], (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                });
              }
            }
          );
        });
      }

      // Generate JWT token
      const token = generateToken(newUser);

      res.status(201).json({
        success: true,
        message: '✅ Account created successfully. Please wait for admin approval before you can use all features.',
        user: {
          id: newUser.id,
          username: newUser.username,
          full_name: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          is_verified: newUser.is_verified
        },
        token
      });

    } catch (error) {
      console.error('Resident registration error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Registration failed. Please try again.' 
      });
    }
  }
);

// Admin self-registration is disabled by default
// To enable temporarily for setup, set ALLOW_ADMIN_SELF_REGISTER=true in env
router.post('/register/admin', async (req, res) => {
  if (process.env.ALLOW_ADMIN_SELF_REGISTER === 'true') {
    return res.status(403).json({
      message: 'Self-registration for admins is temporarily allowed flag, but this endpoint is intentionally disabled in this build.'
    });
  }
  return res.status(403).json({
    message: 'Admin accounts cannot be self-registered. Contact the system administrator to be provisioned.'
  });
});

// Login (supports both email for residents and username for admins)
router.post('/login',
  validateLogin,
  async (req, res) => {
    try {
      const { email, username, password } = req.body;
      const db = getDB();
      
      // Debug login attempt
      console.log('🔐 Login attempt:', { email, username, hasPassword: !!password });
      console.log('🔑 JWT_SECRET available:', !!process.env.JWT_SECRET);

      // Determine login method (email for residents, username for admins)
      let loginField, loginValue;
      if (username) {
        loginField = 'username';
        loginValue = username;
      } else if (email) {
        loginField = 'email';
        loginValue = email;
      } else {
        return res.status(400).json({ 
          success: false,
          message: 'Please provide either email or username',
          fieldErrors: { identifier: 'Please provide either email or username' }
        });
      }

      if (process.env.DB_TYPE === 'postgresql') {
        // Find user by email or username
        const result = await db.query(
          `SELECT id, username, full_name, email, password, role, status, is_verified FROM users WHERE ${loginField} = $1`,
          [loginValue]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid username/email or password',
            fieldErrors: { identifier: 'Invalid username/email or password' }
          });
        }

        const user = result.rows[0];

        if (user.status === 'denied') {
          return res.status(403).json({
            success: false,
            message: 'Your account was rejected. Please resubmit your registration.'
          });
        }
        if (user.status === 'pending') {
          return res.status(403).json({
            success: false,
            message: 'Your account is pending approval.'
          });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid username/email or password',
            fieldErrors: { password: 'Invalid username/email or password' }
          });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            is_verified: user.is_verified
          },
          token
        });
      } else {
        // SQLite implementation
        db.get(
          `SELECT id, username, full_name, email, password, role, status, is_verified FROM users WHERE ${loginField} = ?`,
          [loginValue],
          (err, user) => {
            if (err) {
              return res.status(500).json({ message: 'Database error' });
            }

            if (user.status === 'denied') {
              return res.status(403).json({
                success: false,
                message: 'Your account was rejected. Please resubmit your registration.'
              });
            }
            if (user.status === 'pending') {
              return res.status(403).json({
                success: false,
                message: 'Your account is pending approval.'
              });
            }

            if (!user) {
              return res.status(401).json({ 
                success: false,
                message: 'Invalid username/email or password',
                fieldErrors: { identifier: 'Invalid username/email or password' }
              });
            }

            // Check password
            bcrypt.compare(password, user.password, (err, isValidPassword) => {
              if (err) {
                return res.status(500).json({ 
                  success: false,
                  message: 'Password verification error',
                  fieldErrors: { password: 'Password verification error' }
                });
              }

              if (!isValidPassword) {
                return res.status(401).json({ 
                  success: false,
                  message: 'Invalid username/email or password',
                  fieldErrors: { password: 'Invalid username/email or password' }
                });
              }

              // Generate token
              const token = generateToken(user);

              res.json({
                message: 'Login successful',
                user: {
                  id: user.id,
                  username: user.username,
                  full_name: user.full_name,
                  email: user.email,
                  role: user.role,
                  is_verified: user.is_verified
                },
                token
              });
            });
          }
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Login failed. Please try again.',
        fieldErrors: { general: 'Login failed. Please try again.' }
      });
    }
  }
);

// Get current user profile
router.get('/profile',
  authenticateToken,
  requireUser,
  async (req, res) => {
    try {
      const db = getDB();
      const userId = req.user.id;

      if (process.env.DB_TYPE === 'postgresql') {
        const result = await db.query(
          'SELECT id, full_name, email, role, barangay, contact_number, valid_id, status, is_verified, profile_picture, created_at FROM users WHERE id = $1',
          [userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        res.json({ user });
      } else {
        // SQLite implementation
        db.get(
          'SELECT id, full_name, email, role, barangay, contact_number, valid_id, status, is_verified, profile_picture, created_at FROM users WHERE id = ?',
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
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to get profile' });
    }
  }
);

// Update profile
router.put('/profile',
  authenticateToken,
  requireUser,
  validateProfileUpdate,
  async (req, res) => {
    try {
      const { full_name, barangay, contact_number } = req.body;
      const userId = req.user.id;
      const db = getDB();

      if (process.env.DB_TYPE === 'postgresql') {
        const result = await db.query(
          `UPDATE users 
           SET full_name = COALESCE($1, full_name), 
               barangay = COALESCE($2, barangay), 
               contact_number = COALESCE($3, contact_number),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4 
           RETURNING id, full_name, email, role, barangay, contact_number, status, is_verified, profile_picture`,
          [full_name, barangay, contact_number, userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
          message: 'Profile updated successfully',
          user
        });
      } else {
        // SQLite implementation
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (full_name !== undefined) {
          updates.push(`full_name = ?`);
          values.push(full_name);
          paramCount++;
        }
        if (barangay !== undefined) {
          updates.push(`barangay = ?`);
          values.push(barangay);
          paramCount++;
        }
        if (contact_number !== undefined) {
          updates.push(`contact_number = ?`);
          values.push(contact_number);
          paramCount++;
        }

        if (updates.length === 0) {
          return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        
        db.run(query, values, function(err) {
          if (err) {
            return res.status(500).json({ message: 'Update failed' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
          }

          // Get updated user
          db.get(
            'SELECT id, full_name, email, role, barangay, contact_number, status, is_verified, profile_picture FROM users WHERE id = ?',
            [userId],
            (err, user) => {
              if (err) {
                return res.status(500).json({ message: 'Failed to get updated user' });
              }

              res.json({
                message: 'Profile updated successfully',
                user
              });
            }
          );
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Profile update failed' });
    }
  }
);

// Upload profile picture
router.put('/profile/picture',
  authenticateToken,
  requireUser,
  uploadProfilePicture,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const db = getDB();

      // Get uploaded file information
      const profilePictureFilename = req.file ? req.file.filename : null;

      if (!profilePictureFilename) {
        return res.status(400).json({ message: 'Profile picture is required' });
      }

      if (process.env.DB_TYPE === 'postgresql') {
        const result = await db.query(
          `UPDATE users 
           SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2 
           RETURNING id, full_name, email, role, barangay, contact_number, status, is_verified, profile_picture`,
          [profilePictureFilename, userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
          message: 'Profile picture updated successfully',
          user
        });
      } else {
        // SQLite implementation
        db.run(
          `UPDATE users 
           SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [profilePictureFilename, userId],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Update failed' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ message: 'User not found' });
            }

            // Get updated user
            db.get(
              'SELECT id, full_name, email, role, barangay, contact_number, status, is_verified, profile_picture FROM users WHERE id = ?',
              [userId],
              (err, user) => {
                if (err) {
                  return res.status(500).json({ message: 'Failed to get updated user' });
                }

                res.json({
                  message: 'Profile picture updated successfully',
                  user
                });
              }
            );
          }
        );
      }
    } catch (error) {
      console.error('Update profile picture error:', error);
      res.status(500).json({ message: 'Profile picture update failed' });
    }
  }
);

// Change password
router.put('/change-password',
  authenticateToken,
  requireUser,
  validatePasswordChange,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      const db = getDB();

      if (process.env.DB_TYPE === 'postgresql') {
        // Get current password
        const result = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password);
        if (!isValidPassword) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await db.query(
          'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [hashedNewPassword, userId]
        );

        res.json({ message: 'Password changed successfully' });
      } else {
        // SQLite implementation
        db.get('SELECT password FROM users WHERE id = ?', [userId], (err, user) => {
          if (err) {
            return res.status(500).json({ message: 'Database error' });
          }

          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }

          // Verify current password
          bcrypt.compare(currentPassword, user.password, (err, isValidPassword) => {
            if (err) {
              return res.status(500).json({ message: 'Password verification error' });
            }

            if (!isValidPassword) {
              return res.status(400).json({ message: 'Current password is incorrect' });
            }

            // Hash new password
            bcrypt.hash(newPassword, 12, (err, hashedNewPassword) => {
              if (err) {
                return res.status(500).json({ message: 'Password hashing error' });
              }

              // Update password
              db.run(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedNewPassword, userId],
                function(err) {
                  if (err) {
                    return res.status(500).json({ message: 'Password update failed' });
                  }

                  res.json({ message: 'Password changed successfully' });
                }
              );
            });
          });
        });
      }
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Password change failed' });
    }
  }
);

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Verify token endpoint - return full user info including verification_status
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

          if (process.env.DB_TYPE === 'postgresql') {
        const result = await db.query(
          'SELECT id, full_name, email, role, barangay, contact_number, valid_id, status, is_verified, profile_picture, created_at FROM users WHERE id = $1',
          [userId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.json({ message: 'Token is valid', user: result.rows[0] });
      } else {
        db.get(
          'SELECT id, full_name, email, role, barangay, contact_number, valid_id, status, is_verified, profile_picture, created_at FROM users WHERE id = ?',
          [userId],
          (err, user) => {
            if (err) {
              return res.status(500).json({ message: 'Database error' });
            }
            if (!user) {
              return res.status(404).json({ message: 'User not found' });
            }
            return res.json({ message: 'Token is valid', user });
          }
        );
      }
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

