const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Railway provides MYSQL_URL or MYSQL_PUBLIC_URL
// Try all possible connection methods in order
const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
const dbHost   = process.env.DB_HOST || process.env.MYSQLHOST || process.env.RAILWAY_PRIVATE_DOMAIN;
const dbPort   = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306');
const dbUser   = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPass   = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
const dbName   = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway';

console.log('🔍 DB Config:', {
  hasUrl: !!mysqlUrl,
  host: dbHost || 'NOT SET',
  port: dbPort,
  user: dbUser,
  name: dbName,
});

if (mysqlUrl) {
  sequelize = new Sequelize(mysqlUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: { connectTimeout: 60000 },
    pool: { max: 5, min: 0, acquire: 120000, idle: 30000 },
  });
} else {
  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost || 'localhost',
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 120000, idle: 30000 },
    dialectOptions: { connectTimeout: 60000 },
  });
}

module.exports = sequelize;
