require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const sequelize = require('./config/database');
require('./models');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/feedback',      require('./routes/feedback'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/credits',       require('./routes/credits'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/search',        require('./routes/search'));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
}));

// Serve React frontend from backend
// Try multiple possible paths for frontend build
const possiblePaths = [
  path.join(__dirname, '../frontend/build'),
  path.join(__dirname, '../../frontend/build'),
  path.join('/app/frontend/build'),
  path.join(process.cwd(), 'frontend/build'),
  path.join(process.cwd(), '../frontend/build'),
];
const fs = require('fs');
const frontendBuild = possiblePaths.find(p => fs.existsSync(p)) || path.join(__dirname, '../frontend/build');
console.log('✓ Frontend build path:', frontendBuild, fs.existsSync(frontendBuild) ? '(found)' : '(NOT FOUND)');
app.use(express.static(frontendBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log('✓ Database synced');
  require('./jobs/overdueChecker');
  require('./jobs/emailDigest');
  require('./jobs/deadlineReminder');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on :${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('DB connection failed:', err);
  process.exit(1);
});