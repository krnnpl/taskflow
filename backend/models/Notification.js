const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'task_assigned_to_assigner','task_assigned_to_writer',
      'task_completed','feedback_received','task_in_progress',
      'task_overdue','invite_sent','comment_added','file_uploaded'
    ),
    allowNull: false
  },
  title:         { type: DataTypes.STRING,  allowNull: false },
  message:       { type: DataTypes.TEXT,    allowNull: false },
  relatedTaskId: { type: DataTypes.INTEGER, allowNull: true },
  isRead:        { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'notifications' });

module.exports = Notification;
