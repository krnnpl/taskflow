const { Notification } = require('../models');

// Helper to create notifications - used by other controllers
const createNotification = async (userId, type, title, message, relatedTaskId = null) => {
  try {
    await Notification.create({ userId, type, title, message, relatedTaskId });
  } catch (err) {
    console.error('Notification create failed:', err.message);
  }
};

exports.createNotification = createNotification;

// GET /api/notifications — get my notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id } });
    res.json({ message: 'All marked as read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
