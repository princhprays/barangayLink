const { connectDB, getDB } = require('./config/database');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
  try {
    console.log('🔄 Testing admin login functionality...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Wait a bit for tables to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const db = getDB();
    
    // Check if admin user exists
    if (process.env.DB_TYPE === 'postgresql') {
      const result = await db.query("SELECT username, full_name, email, role, is_verified FROM users WHERE role = 'admin'");
      if (result.rows.length > 0) {
        const admin = result.rows[0];
        console.log('✅ Admin user found:');
        console.log(`   Username: ${admin.username}`);
        console.log(`   Full Name: ${admin.full_name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Verified: ${admin.is_verified}`);
      } else {
        console.log('❌ No admin user found');
      }
    } else {
      // SQLite implementation
      db.get("SELECT username, full_name, email, role, is_verified FROM users WHERE role = 'admin'", (err, admin) => {
        if (err) {
          console.error('❌ Error checking admin user:', err.message);
        } else if (admin) {
          console.log('✅ Admin user found:');
          console.log(`   Username: ${admin.username}`);
          console.log(`   Full Name: ${admin.full_name}`);
          console.log(`   Email: ${admin.email}`);
          console.log(`   Role: ${admin.role}`);
          console.log(`   Verified: ${admin.is_verified}`);
        } else {
          console.log('❌ No admin user found');
        }
      });
    }
    
    // Test password hashing
    const testPassword = 'Admin8265';
    const hashedPassword = bcrypt.hashSync(testPassword, 10);
    const isValid = bcrypt.compareSync(testPassword, hashedPassword);
    console.log(`🔐 Password test: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    console.log('\n📋 Login Test Instructions:');
    console.log('1. Start the backend: npm run dev');
    console.log('2. Start the frontend: npm start');
    console.log('3. Try logging in with:');
    console.log('   Username: admin');
    console.log('   Password: Admin8265');
    console.log('4. Or try with email: admin@barangaylink.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAdminLogin();
