const sequelize  = require('../config/database');
const User       = require('./User');
const Task       = require('./Task');
const Feedback   = require('./Feedback');
const Performance= require('./Performance');
const Notification= require('./Notification');
const Message    = require('./Message');
const TaskComment= require('./TaskComment');
const TaskAttachment= require('./TaskAttachment');
const TaskActivity  = require('./TaskActivity');
const Credit     = require('./Credit');

// ── User associations ──────────────────────────────────────────────────
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Task, { foreignKey: 'assignedToAssigner', as: 'assignerTasks' });
Task.belongsTo(User, { foreignKey: 'assignedToAssigner', as: 'assigner' });

User.hasMany(Task, { foreignKey: 'assignedToWriter', as: 'writerTasks' });
Task.belongsTo(User, { foreignKey: 'assignedToWriter', as: 'writer' });

// Task self-referential (dependencies)
Task.belongsTo(Task, { foreignKey: 'dependsOn', as: 'dependency' });
Task.hasMany(Task,   { foreignKey: 'dependsOn', as: 'dependents' });

// Feedback
User.hasMany(Feedback, { foreignKey: 'receiverId', as: 'receivedFeedback' });
User.hasMany(Feedback, { foreignKey: 'giverId',     as: 'givenFeedback' });
Task.hasMany(Feedback, { foreignKey: 'taskId' });
Feedback.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
Feedback.belongsTo(User, { foreignKey: 'giverId',    as: 'giver' });
Feedback.belongsTo(Task, { foreignKey: 'taskId' });

// Performance
User.hasOne(Performance, { foreignKey: 'userId' });
Performance.belongsTo(User, { foreignKey: 'userId' });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Messages
User.hasMany(Message, { foreignKey: 'senderId',   as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'senderId',   as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
Task.hasMany(Message,    { foreignKey: 'taskId' });
Message.belongsTo(Task,  { foreignKey: 'taskId' });

// Task Comments
TaskComment.belongsTo(Task, { foreignKey: 'taskId' });
TaskComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Task.hasMany(TaskComment, { foreignKey: 'taskId' });

// Task Attachments
TaskAttachment.belongsTo(Task, { foreignKey: 'taskId' });
TaskAttachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
Task.hasMany(TaskAttachment, { foreignKey: 'taskId' });

// Task Activity
TaskActivity.belongsTo(Task, { foreignKey: 'taskId' });
TaskActivity.belongsTo(User, { foreignKey: 'userId', as: 'actor' });
Task.hasMany(TaskActivity, { foreignKey: 'taskId' });

// Credits (feed posts)
Credit.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Credit, { foreignKey: 'userId', as: 'credits' });

module.exports = { sequelize, User, Task, Feedback, Performance, Notification, Message, TaskComment, TaskAttachment, TaskActivity, Credit };
