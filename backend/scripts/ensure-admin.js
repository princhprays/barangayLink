const { connectDB, getDB } = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function ensureAdminAccount() {
  try {
    console.log('🔄 Ensuring admin account exists...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Wait a bit for tables to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const db = getDB();
    
    // Default admin credentials
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin8265';
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@barangaylink.com';
    const adminFullName = process.env.DEFAULT_ADMIN_FULL_NAME || 'System Administrator';
    
    console.log(`🔍 Checking for admin account: ${adminUsername}`);
    
    if (process.env.DB_TYPE === 'postgresql') {
      // Check if admin exists
      const result = await db.query("SELECT id, username, email, role, is_verified FROM users WHERE role = 'admin'");
      
      if (result.rows.length > 0) {
        const admin = result.rows[0];
        console.log('✅ Admin account already exists:');
        console.log(`   ID: ${admin.id}`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Verified: ${admin.is_verified}`);
        
        // Check if password needs updating
        if (admin.username === adminUsername) {
          console.log('🔐 Admin account is up to date');
        } else {
          console.log('⚠️ Admin account exists but with different username');
        }
      } else {
        console.log('❌ No admin account found, creating one...');
        
                            // Create admin account
                    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
                    const insertResult = await db.query(
                      `INSERT INTO users (username, full_name, password, email, role, is_verified) 
                       VALUES ($1, $2, $3, $4, 'admin', true) 
                       RETURNING id, username, email, role, is_verified`,
                      [adminUsername, adminFullName, hashedPassword, adminEmail]
                    );
        
        const newAdmin = insertResult.rows[0];
        console.log('✅ Admin account created successfully:');
        console.log(`   ID: ${newAdmin.id}`);
        console.log(`   Username: ${newAdmin.username}`);
        console.log(`   Email: ${newAdmin.email}`);
        console.log(`   Role: ${newAdmin.role}`);
        console.log(`   Verified: ${newAdmin.is_verified}`);
      }
    } else {
      // SQLite implementation
      db.get("SELECT id, username, email, role, is_verified FROM users WHERE role = 'admin'", (err, admin) => {
        if (err) {
          console.error('❌ Error checking admin users:', err.message);
          return;
        }
        
        if (admin) {
          console.log('✅ Admin account already exists:');
          console.log(`   ID: ${admin.id}`);
          console.log(`   Username: ${admin.username}`);
          console.log(`   Email: ${admin.email}`);
          console.log(`   Role: ${admin.role}`);
          console.log(`   Verified: ${admin.is_verified}`);
          
          if (admin.username === adminUsername) {
            console.log('🔐 Admin account is up to date');
          } else {
            console.log('⚠️ Admin account exists but with different username');
          }
        } else {
          console.log('❌ No admin account found, creating one...');
          
          // Create admin account
          const hashedPassword = bcrypt.hashSync(adminPassword, 10);
          const insertAdmin = `
            INSERT INTO users (username, full_name, password, email, role, is_verified) 
            VALUES (?, ?, ?, ?, 'admin', 1)
          `;
          
          db.run(insertAdmin, [adminUsername, adminFullName, hashedPassword, adminEmail], function(err) {
            if (err) {
              console.error('❌ Error creating admin account:', err.message);
            } else {
              console.log('✅ Admin account created successfully:');
              console.log(`   ID: ${this.lastID}`);
              console.log(`   Username: ${adminUsername}`);
              console.log(`   Email: ${adminEmail}`);
              console.log(`   Role: admin`);
              console.log(`   Verified: true`);
            }
          });
        }
      });
    }
    
    console.log('\n📋 Login Test Instructions:');
    console.log('1. Start the backend: npm run dev');
    console.log('2. Start the frontend: npm start');
    console.log('3. Try logging in with:');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Or Email: ${adminEmail}`);
    console.log('4. You should be redirected to the admin dashboard');
    
    // Wait a bit for SQLite operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

ensureAdminAccount();
