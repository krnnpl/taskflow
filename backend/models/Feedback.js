const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId:       { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tasks', key: 'id' } },
  giverId:      { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  receiverId:   { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  feedbackText: { type: DataTypes.TEXT,    allowNull: true },
  rating:       { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
  isComplaint:  { type: DataTypes.BOOLEAN, defaultValue: false },
  correctionRequested: { type: DataTypes.BOOLEAN, defaultValue: false }, // NEW: counts toward corrections metric
}, { tableName: 'feedback' });

module.exports = Feedback;
