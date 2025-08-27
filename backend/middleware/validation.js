const { body, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Helper function to check if value is empty or "N/A" (no longer used)
const isEmptyOrNA = (value) => {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'n/a') {
    return true;
  }
  return false;
};

// Resident registration validation is now handled directly in the route
// This middleware is kept for backward compatibility but not used
const validateResidentRegistration = [];

// Admin registration validation is not used; admin self-registration disabled
const validateAdminRegistration = [];

// Login validation
const validateLogin = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  // Custom validation for either email or username
  body()
    .custom((value, { req }) => {
      const { email, username } = req.body;
      
      // Must have either email or username, but not both
      if (!email && !username) {
        throw new Error('Please provide either email or username');
      }
      
      if (email && username) {
        throw new Error('Please provide either email or username, not both');
      }
      
      // If email is provided, validate it
      if (email) {
        if (!email.includes('@')) {
          throw new Error('Please provide a valid email address');
        }
        if (email.length < 5) {
          throw new Error('Email address is too short');
        }
      }
      
      // If username is provided, validate it
      if (username) {
        if (username.length < 3) {
          throw new Error('Username must be at least 3 characters');
        }
        if (username.length > 50) {
          throw new Error('Username is too long (max 50 characters)');
        }
        // Check for valid username characters
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
          throw new Error('Username can only contain letters, numbers, hyphens, and underscores');
        }
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('barangay')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Barangay must be between 2 and 100 characters'),
  
  body('contact_number')
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Contact number must be between 10 and 20 characters')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Contact number can only contain numbers, spaces, and basic symbols'),
  
  handleValidationErrors
];

module.exports = {
  validateResidentRegistration,
  validateAdminRegistration,
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate
};
