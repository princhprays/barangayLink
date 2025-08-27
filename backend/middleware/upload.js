const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/ids'),
    path.join(__dirname, '../uploads/selfies'),
    path.join(__dirname, '../uploads/items')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for ID uploads
const idStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/ids'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_userid_originalname
    const timestamp = Date.now();
    const userId = req.body.email || 'unknown';
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${timestamp}_${userId}_${originalName}`);
  }
});

// Configure storage for item photos
const itemStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/items'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const itemName = req.body.name || 'item';
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${timestamp}_${itemName}_${originalName}`);
  }
});

// File filter function (images only)
const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter that allows images or PDFs (for government ID)
const imageOrPdfFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image or PDF files are allowed'), false);
  }
};

// Create multer instances
const uploadID = multer({
  storage: idStorage,
  fileFilter: imageOrPdfFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_ID_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default for IDs
  }
});

const uploadItemPhoto = multer({
  storage: itemStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default for items
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      // Check if this is an ID-related upload
      const isIdUpload = req.file?.fieldname === 'idImage' || req.file?.fieldname === 'selfieWithId' || 
                        (req.files && (req.files.idImage || req.files.selfieWithId));
      
      if (isIdUpload) {
        return res.status(400).json({ 
          message: 'File too large. Maximum size for ID verification documents is 10MB.' 
        });
      } else {
        return res.status(400).json({ 
          message: 'File too large. Maximum size is 5MB.' 
        });
      }
    }
    return res.status(400).json({ message: error.message });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ 
      message: 'Only image files (JPG, PNG, GIF) are allowed.' 
    });
  }
  
  next(error);
};

// Utility function to clean up uploaded files
const cleanupUploadedFiles = (req) => {
  if (!req.files) return;
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Clean up ID image if uploaded
    if (req.files.idImage?.[0]?.filename) {
      const idPath = path.join(__dirname, '../uploads/ids', req.files.idImage[0].filename);
      if (fs.existsSync(idPath)) {
        fs.unlinkSync(idPath);
        console.log(`Cleaned up ID file: ${req.files.idImage[0].filename}`);
      }
    }
    
    // Clean up selfie if uploaded
    if (req.files.selfieWithId?.[0]?.filename) {
      const selfiePath = path.join(__dirname, '../uploads/selfies', req.files.selfieWithId[0].filename);
      if (fs.existsSync(selfiePath)) {
        fs.unlinkSync(selfiePath);
        console.log(`Cleaned up selfie file: ${req.files.selfieWithId[0].filename}`);
      }
    }
  } catch (cleanupError) {
    console.error('Error during file cleanup:', cleanupError);
  }
};

// Profile picture upload middleware
const uploadProfilePicture = (req, res, next) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile_' + uniqueSuffix + ext);
      }
    }),
    fileFilter: (req, file, cb) => {
      // Only allow image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile pictures'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  }).single('profile_picture');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Profile picture file size must be less than 5MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture file is required'
      });
    }

    next();
  });
};

module.exports = {
  uploadID: uploadID.single('idImage'),
  uploadSelfie: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/selfies')),
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const userHint = (req.body.email || 'user').replace(/[^a-zA-Z0-9.]/g, '_');
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${timestamp}_${userHint}_${originalName}`);
      }
    }),
    fileFilter: fileFilter,
    limits: { fileSize: parseInt(process.env.MAX_ID_FILE_SIZE) || 10 * 1024 * 1024 } // 10MB for selfies
  }).single('selfieWithId'),
  // Combined upload for resident registration (stores by field)
  uploadResidentDocs: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        if (file.fieldname === 'valid_id') return cb(null, path.join(__dirname, '../uploads/ids'));
        if (file.fieldname === 'selfie_with_id') return cb(null, path.join(__dirname, '../uploads/selfies'));
        return cb(null, path.join(__dirname, '../uploads'));
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const hint = (req.body.email || 'user').replace(/[^a-zA-Z0-9.]/g, '_');
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${timestamp}_${hint}_${originalName}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'valid_id') {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') return cb(null, true);
        return cb(new Error('ID must be an image or PDF'));
      }
      if (file.fieldname === 'selfie_with_id') {
        return fileFilter(req, file, cb);
      }
      return cb(new Error('Unexpected upload field'));
    },
    limits: { fileSize: parseInt(process.env.MAX_ID_FILE_SIZE) || 10 * 1024 * 1024 } // 10MB for ID docs
  }).fields([{ name: 'valid_id', maxCount: 1 }, { name: 'selfie_with_id', maxCount: 1 }]),
  uploadItemPhoto: uploadItemPhoto.single('itemPhoto'),
  uploadProfilePicture,
  handleUploadError,
  cleanupUploadedFiles
};
