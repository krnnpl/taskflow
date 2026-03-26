const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskComment = sequelize.define('TaskComment', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId:  { type: DataTypes.INTEGER, allowNull: false },
  userId:  { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT,    allowNull: false },
}, { tableName: 'task_comments' });

module.exports = TaskComment;
