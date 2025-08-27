const { resetDatabase } = require('../config/database');

console.log('🔄 Starting database reset...');

resetDatabase()
  .then(() => {
    console.log('✅ Database reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  });
