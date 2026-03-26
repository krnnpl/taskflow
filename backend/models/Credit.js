const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Credit = sequelize.define('Credit', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:   { type: DataTypes.INTEGER, allowNull: false },
  content:  { type: DataTypes.TEXT,    allowNull: true },
  isEdited: { type: DataTypes.BOOLEAN, defaultValue: false },
  isDeleted:{ type: DataTypes.BOOLEAN, defaultValue: false },
  reactions:{ type: DataTypes.TEXT,    allowNull: true, defaultValue: '{}' },
  scheduledAt:{ type: DataTypes.DATE,  allowNull: true },
  fileName: { type: DataTypes.STRING,  allowNull: true },
  fileOriginalName: { type: DataTypes.STRING, allowNull: true },
  fileMimeType:     { type: DataTypes.STRING, allowNull: true },
  fileSize: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'credits', timestamps: true });

module.exports = Credit;
