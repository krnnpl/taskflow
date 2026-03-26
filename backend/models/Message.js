const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  senderId:   { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: true },
  taskId:     { type: DataTypes.INTEGER, allowNull: true },
  content:    { type: DataTypes.TEXT,    allowNull: true },
  isRead:     { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt:     { type: DataTypes.DATE,    allowNull: true },
  type:       { type: DataTypes.ENUM('dm','task'), defaultValue: 'dm' },
  isEdited:   { type: DataTypes.BOOLEAN, defaultValue: false },
  isDeleted:  { type: DataTypes.BOOLEAN, defaultValue: false },
  reactions:  { type: DataTypes.TEXT,    allowNull: true, defaultValue: '{}' }, // JSON {emoji: [userId,...]}
  scheduledAt:{ type: DataTypes.DATE,    allowNull: true },
  fileName:   { type: DataTypes.STRING,  allowNull: true },
  fileOriginalName: { type: DataTypes.STRING, allowNull: true },
  fileMimeType:     { type: DataTypes.STRING, allowNull: true },
  fileSize:   { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'messages', timestamps: true });

module.exports = Message;
