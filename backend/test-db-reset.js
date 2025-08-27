const { connectDB, resetDatabase } = require('./config/database');

async function testDatabaseReset() {
  try {
    console.log('🔄 Testing database reset functionality...');
    
    // First connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Wait a bit for tables to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test reset functionality
    console.log('🔄 Testing database reset...');
    await resetDatabase();
    console.log('✅ Database reset completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDatabaseReset();
