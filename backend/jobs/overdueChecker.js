const cron = require('node-cron');
const { Op } = require('sequelize');

const checkOverdue = async () => {
  try {
    const { Task } = require('../models');
    const { createNotification } = require('../controllers/notificationController');
    const now = new Date();
    const overdueTasks = await Task.findAll({
      where: {
        dueDate:  { [Op.lt]: now },
        status:   { [Op.notIn]: ['completed','rejected','overdue'] },
        isOverdue: false,
      },
    });
    for (const task of overdueTasks) {
      task.isOverdue = true;
      task.status    = 'overdue';
      await task.save();
      const uids = [...new Set([task.createdBy, task.assignedToAssigner, task.assignedToWriter, task.assignedBy].filter(Boolean))];
      for (const uid of uids) {
        await createNotification(uid, 'task_overdue', '⚠️ Task Overdue', `"${task.title}" is past its due date`, task.id);
      }
    }
    if (overdueTasks.length) console.log(`[Cron] Flagged ${overdueTasks.length} task(s) as overdue`);
  } catch (err) { console.error('[Cron] overdue check failed:', err.message); }
};

cron.schedule('0 8 * * *', checkOverdue);
setTimeout(checkOverdue, 10000);
module.exports = checkOverdue;
