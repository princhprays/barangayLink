const { connectDB, getDB } = require('../config/database');

(async () => {
  try {
    await connectDB();
    const db = getDB();
    if (process.env.DB_TYPE === 'postgresql') {
      const tables = await db.query("SELECT to_regclass('public.user_rejections') as user_rejections, to_regclass('public.users') as users");
      const cols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' and column_name='rejection_reason'");
      console.log('tables', tables.rows);
      console.log('has_rejection_reason', cols.rows.length > 0);
    } else {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name in ('user_rejections','users')", (err, rows) => {
        if (err) {
          console.error('Error reading tables', err);
          process.exit(1);
        }
        console.log('tables', rows);
        db.all('PRAGMA table_info(users)', (e2, cols) => {
          if (e2) {
            console.error('Error reading columns', e2);
            process.exit(1);
          }
          console.log('has_rejection_reason', cols.some(c => c.name === 'rejection_reason'));
          process.exit(0);
        });
      });
    }
  } catch (e) {
    console.error('check failed', e);
    process.exit(1);
  }
})();


