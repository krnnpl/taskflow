const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Performance = sequelize.define('Performance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
  totalTasks:      { type: DataTypes.INTEGER, defaultValue: 0 },
  completedTasks:  { type: DataTypes.INTEGER, defaultValue: 0 },
  inProgressTasks: { type: DataTypes.INTEGER, defaultValue: 0 },
  avgRating:        { type: DataTypes.FLOAT, defaultValue: 0 },
  feedbackScore:    { type: DataTypes.FLOAT, defaultValue: 0 },
  complaints:       { type: DataTypes.INTEGER, defaultValue: 0 },
  qualityScore:     { type: DataTypes.FLOAT, defaultValue: 0 },
  completionRate:   { type: DataTypes.FLOAT, defaultValue: 0 },
  performanceScore: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalCorrections: { type: DataTypes.INTEGER, defaultValue: 0 }, // NEW: file correction requests
  level: { type: DataTypes.ENUM('beginner','intermediate','expert'), defaultValue: 'beginner' },
}, {
  tableName: 'performance',
  indexes: [{ unique: true, fields: ['userId'] }],
});

module.exports = Performance;
