const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskActivity = sequelize.define('TaskActivity', {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING,  allowNull: false }, // e.g. "changed status to completed"
  meta:   { type: DataTypes.JSON,    allowNull: true },  // extra data
}, { tableName: 'task_activities' });

module.exports = TaskActivity;
