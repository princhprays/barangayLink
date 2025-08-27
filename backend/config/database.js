const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let db;

// Database connection based on environment
const connectDB = async () => {
  try {
    if (process.env.DB_TYPE === 'postgresql') {
      // PostgreSQL connection
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await pool.connect();
      console.log('✅ Connected to PostgreSQL database');
      client.release();
      
      db = pool;
      
      // Initialize PostgreSQL tables
      await initPostgreSQLTables();
    } else {
      // SQLite connection (default for MVP)
      const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/barangaylink.db');
      
      // Ensure database directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Connect to existing database (don't delete it)
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Error connecting to SQLite database:', err.message);
          throw err;
        }
        console.log('✅ Connected to SQLite database');
        
        // Initialize tables
        initTables();
      });
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Initialize PostgreSQL tables
const initPostgreSQLTables = async () => {
  try {
    const createTables = `
      -- Users table (Residents and Admins)
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        contact_number VARCHAR(20),
        barangay VARCHAR(100),
        municipality VARCHAR(100),
        province VARCHAR(100),
        valid_id VARCHAR(500),
        selfie_with_id VARCHAR(500),
        profile_picture VARCHAR(500),
        role VARCHAR(20) NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
        rejection_reason TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User rejections audit table
      CREATE TABLE IF NOT EXISTS user_rejections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        snapshot_full_name VARCHAR(255),
        snapshot_email VARCHAR(255),
        snapshot_barangay VARCHAR(100),
        snapshot_municipality VARCHAR(100),
        snapshot_province VARCHAR(100),
        snapshot_contact_number VARCHAR(20),
        snapshot_valid_id VARCHAR(500),
        snapshot_selfie_with_id VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Items table
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('donation', 'lending')),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
        photo VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'available', 'borrowed')),
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Requests table
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES items(id),
        requester_id INTEGER NOT NULL REFERENCES users(id),
        purpose TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES requests(id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('donation', 'lending')),
        handover_date TIMESTAMP,
        due_date DATE,
        return_date TIMESTAMP,
        condition_on_return TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Strikes table
      CREATE TABLE IF NOT EXISTS strikes (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id);
      CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
      CREATE INDEX IF NOT EXISTS idx_requests_item ON requests(item_id);
      CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_request ON transactions(request_id);
    `;

    await db.query(createTables);
    // Ensure rejection_reason column exists (for existing DBs)
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT");
    console.log('✅ PostgreSQL tables initialized successfully');
    
    // Create default admin user
    await createDefaultAdmin();
    
  } catch (error) {
    console.error('❌ Error initializing PostgreSQL tables:', error);
    throw error;
  }
};

// Initialize SQLite tables
const initTables = () => {
  const createTables = `
    -- Users table (Residents and Admins)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      contact_number TEXT,
      barangay TEXT,
      municipality TEXT,
      province TEXT,
      valid_id TEXT,
      selfie_with_id TEXT,
      profile_picture TEXT,
      role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin')),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
      rejection_reason TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User rejections audit table
    CREATE TABLE IF NOT EXISTS user_rejections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      snapshot_full_name TEXT,
      snapshot_email TEXT,
      snapshot_barangay TEXT,
      snapshot_municipality TEXT,
      snapshot_province TEXT,
      snapshot_contact_number TEXT,
      snapshot_valid_id TEXT,
      snapshot_selfie_with_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Items table
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('donation', 'lending')),
      name TEXT NOT NULL,
      description TEXT,
      condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
      photo TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'available', 'borrowed')),
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users (id)
    );

    -- Requests table
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      requester_id INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items (id),
      FOREIGN KEY (requester_id) REFERENCES users (id)
    );

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('donation', 'lending')),
      handover_date DATETIME,
      due_date DATE,
      return_date DATETIME,
      condition_on_return TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES requests (id)
    );

    -- Strikes table
    CREATE TABLE IF NOT EXISTS strikes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES users (id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id);
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_requests_item ON requests(item_id);
    CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_request ON transactions(request_id);
  `;

  db.exec(createTables, (err) => {
    if (err) {
      console.error('❌ Error creating tables:', err.message);
    } else {
      console.log('✅ SQLite tables initialized successfully');
      // Best-effort migration: add rejection_reason if missing
      db.get("PRAGMA table_info(users)", (pragmaErr) => {
        if (!pragmaErr) {
          db.all("PRAGMA table_info(users)", (e, cols) => {
            if (!e && cols && !cols.find(c => c.name === 'rejection_reason')) {
              db.run("ALTER TABLE users ADD COLUMN rejection_reason TEXT", () => {});
            }
          });
        }
      });
      
      // Create default admin user
      createDefaultAdmin();
    }
  });
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const bcrypt = require('bcryptjs');

    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'Admin';
    const defaultAdminFullName = process.env.DEFAULT_ADMIN_FULL_NAME || 'System Administrator';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin8265';
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@barangaylink.com';

    if (process.env.DB_TYPE === 'postgresql') {
      // Check if admin exists
      const result = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      
      if (result.rows[0].count === 0) {
        const hashedPassword = bcrypt.hashSync(defaultAdminPassword, 10);
        await db.query(
          `INSERT INTO users (username, full_name, password, email, role, status, is_verified) 
           VALUES ($1, $2, $3, $4, 'admin', 'approved', true)`,
          [defaultAdminUsername, defaultAdminFullName, hashedPassword, defaultAdminEmail]
        );
        
        console.log('✅ Default admin user created');
        console.log(`👤 Username: ${defaultAdminUsername}`);
        console.log(`🔑 Password: ${defaultAdminPassword}`);
        console.log(`📧 Email: ${defaultAdminEmail}`);
      }
    } else {
      // SQLite implementation
      db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", (err, row) => {
        if (err) {
          console.error('❌ Error checking admin users:', err.message);
          return;
        }
        
        if (row.count === 0) {
          const hashedPassword = bcrypt.hashSync(defaultAdminPassword, 10);
          const insertAdmin = `
            INSERT INTO users (username, full_name, password, email, role, status, is_verified) 
            VALUES (?, ?, ?, ?, 'admin', 'approved', 1)
          `;
          
          db.run(insertAdmin, [defaultAdminUsername, defaultAdminFullName, hashedPassword, defaultAdminEmail], function(err) {
            if (err) {
              console.error('❌ Error creating default admin:', err.message);
            } else {
              console.log('✅ Default admin user created');
              console.log(`👤 Username: ${defaultAdminUsername}`);
              console.log(`🔑 Password: ${defaultAdminPassword}`);
              console.log(`📧 Email: ${defaultAdminEmail}`);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

// Get database instance
const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

// Reset database function
const resetDatabase = async () => {
  try {
    if (process.env.DB_TYPE === 'postgresql') {
      // Drop all tables
      await db.query(`
        DROP TABLE IF EXISTS strikes CASCADE;
        DROP TABLE IF EXISTS transactions CASCADE;
        DROP TABLE IF EXISTS requests CASCADE;
        DROP TABLE IF EXISTS items CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);
      console.log('🗑️ PostgreSQL tables dropped');
      
      // Reinitialize
      await initPostgreSQLTables();
    } else {
      // For SQLite, just reconnect which will recreate the database
      const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/barangaylink.db');
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('🗑️ SQLite database file removed');
      }
      
      // Reconnect to recreate database
      await connectDB();
    }
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  getDB,
  resetDatabase
};

