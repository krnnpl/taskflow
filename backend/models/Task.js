const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:       { type: DataTypes.STRING,  allowNull: false },
  description: { type: DataTypes.TEXT,    allowNull: true },
  createdBy:          { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
  assignedToAssigner: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
  assignedToWriter:   { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
  assignedBy:         { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
  dependsOn:          { type: DataTypes.INTEGER, allowNull: true, references: { model: 'tasks',  key: 'id' } },
  status: {
    type: DataTypes.ENUM('pending','assigned_to_assigner','assigned_to_writer','in_progress','completed','rejected','overdue'),
    defaultValue: 'pending',
  },
  priority:       { type: DataTypes.ENUM('low','medium','high'), defaultValue: 'medium' },
  dueDate:        { type: DataTypes.DATE,    allowNull: true },
  completionDate: { type: DataTypes.DATE,    allowNull: true },
  isOverdue:      { type: DataTypes.BOOLEAN, defaultValue: false },
  estimatedMinutes: { type: DataTypes.INTEGER, allowNull: true },
  loggedMinutes:    { type: DataTypes.INTEGER, defaultValue: 0 },
  timerStartedAt:   { type: DataTypes.DATE,    allowNull: true },
}, { tableName: 'tasks' });

module.exports = Task;
