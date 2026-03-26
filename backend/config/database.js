const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Railway provides MYSQL_URL or DATABASE_URL
// Clever Cloud provides MYSQL_ADDON_URI
const connectionUri =
  process.env.MYSQL_URL ||
  process.env.DATABASE_URL ||
  process.env.MYSQL_ADDON_URI;

if (connectionUri) {
  // URI format (Railway / Clever Cloud)
  sequelize = new Sequelize(connectionUri, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
      connectTimeout: 60000,
    },
    pool: { max: 5, min: 0, acquire: 120000, idle: 30000 },
  });
} else {
  // Individual variables (local development / Render / manual)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: false,
      pool: { max: 5, min: 0, acquire: 120000, idle: 30000, evict: 60000 },
      dialectOptions: {
        connectTimeout: 60000,
        keepAlive: true,
      },
      retry: { max: 3 },
    }
  );
}

module.exports = sequelize;
