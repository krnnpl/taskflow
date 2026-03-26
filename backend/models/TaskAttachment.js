const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskAttachment = sequelize.define('TaskAttachment', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId:       { type: DataTypes.INTEGER, allowNull: false },
  uploadedBy:   { type: DataTypes.INTEGER, allowNull: false },
  filename:     { type: DataTypes.STRING,  allowNull: false }, // stored filename on disk
  originalName: { type: DataTypes.STRING,  allowNull: false }, // original upload name
  mimetype:     { type: DataTypes.STRING,  allowNull: false },
  size:         { type: DataTypes.INTEGER, allowNull: false },
  // 'brief' = PM attached when creating task | 'deliverable' = writer uploading completed work
  attachmentType: { type: DataTypes.ENUM('brief', 'deliverable', 'other'), defaultValue: 'other' },
}, { tableName: 'task_attachments' });

module.exports = TaskAttachment;
