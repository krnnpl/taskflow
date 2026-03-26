const { TaskComment, TaskActivity, User, Task } = require('../models');
const { createNotification } = require('./notificationController');

exports.getComments = async (req, res) => {
  try {
    const comments = await TaskComment.findAll({
      where: { taskId: req.params.taskId },
      include: [{ model: User, as: 'author', attributes: ['id','username','role'] }],
      order: [['createdAt','ASC']],
    });
    res.json(comments);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const taskId = req.params.taskId;
    if (!comment?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

    const c = await TaskComment.create({ taskId, userId: req.user.id, comment: comment.trim() });
    await TaskActivity.create({ taskId, userId: req.user.id, action: 'added a comment' }).catch(() => {});

    const task   = await Task.findByPk(taskId);
    const author = await User.findByPk(req.user.id, { attributes: ['username'] });
    const uids   = [...new Set([task.createdBy, task.assignedToAssigner, task.assignedBy, task.assignedToWriter].filter(Boolean))];
    for (const uid of uids) {
      if (uid !== req.user.id) {
        await createNotification(uid, 'comment_added', '💬 New Comment', `${author.username} commented on "${task.title}"`, task.id);
      }
    }
    const full = await TaskComment.findByPk(c.id, { include: [{ model: User, as: 'author', attributes: ['id','username','role'] }] });
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteComment = async (req, res) => {
  try {
    const c = await TaskComment.findByPk(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    if (c.userId !== req.user.id && !['superadmin','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Not your comment' });
    await c.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
