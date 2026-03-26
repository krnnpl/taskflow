require('dotenv').config();
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const sequelize = require('./config/database');
require('./models');

const app = express();

// CORS - allow frontend URL and common platforms
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5000',
    ].filter(Boolean);
    if (
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.railway.app') ||
      origin.endsWith('.up.railway.app')
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
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
