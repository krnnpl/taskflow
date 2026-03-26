const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username:      { type: DataTypes.STRING, allowNull: false },
  email:         { type: DataTypes.STRING, allowNull: false, unique: true },
  password:      { type: DataTypes.STRING, allowNull: true },
  role: {
    type: DataTypes.ENUM('superadmin', 'admin', 'pm', 'assigner', 'writer'),
    allowNull: false, defaultValue: 'writer',
  },
  inviteToken:   { type: DataTypes.STRING,  allowNull: true },
  inviteExpires: { type: DataTypes.DATE,    allowNull: true },
  isActive:      { type: DataTypes.BOOLEAN, defaultValue: false },

  // Password reset
  resetToken:    { type: DataTypes.STRING,  allowNull: true },
  resetExpires:  { type: DataTypes.DATE,    allowNull: true },

  // Writer availability
  availability: {
    type: DataTypes.ENUM('available', 'busy', 'on_leave', 'unavailable'),
    defaultValue: 'available',
  },
  leaveReason:   { type: DataTypes.STRING, allowNull: true },
  leaveUntil:    { type: DataTypes.DATE,   allowNull: true },

  // Preferences
  darkMode:      { type: DataTypes.BOOLEAN, defaultValue: false },
  emailDigest:   { type: DataTypes.ENUM('none','daily','weekly'), defaultValue: 'none' },
  taskSortOrder: { type: DataTypes.TEXT,    allowNull: true }, // JSON array of task IDs
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password)
        user.password = await bcrypt.hash(user.password, 12);
    },
  },
});

User.prototype.comparePassword = async function (p) {
  return bcrypt.compare(p, this.password);
};

module.exports = User;
