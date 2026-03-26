require('dotenv').config();
const sequelize = require('./database');
require('../models');

async function dropAllTables() {
  console.log('Dropping all tables...');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  const tables = [
    'credits', 'messages', 'task_activities', 'task_comments', 'task_attachments',
    'notifications', 'feedback', 'performance', 'tasks', 'users'
  ];
  for (const t of tables) {
    await sequelize.query(`DROP TABLE IF EXISTS \`${t}\``);
    console.log(`  dropped: ${t}`);
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function seed() {
  await sequelize.authenticate();
  console.log('✓ Connected to database:', process.env.DB_NAME || 'production', '\n');

  await dropAllTables();
  await sequelize.sync({ force: false });
  console.log('✓ All tables created\n');

  console.log('✅ Database is ready!');
  console.log('─────────────────────────────────────────────');
  console.log('Next step: Open your app and go to /setup');
  console.log('Register your SuperAdmin account there.');
  console.log('Then invite your team from inside the app.');
  console.log('─────────────────────────────────────────────\n');

  await sequelize.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
