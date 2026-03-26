const path = require('path');
const fs   = require('fs');
const { TaskAttachment, TaskActivity, Task, User } = require('../models');
const { createNotification } = require('./notificationController');

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { taskId, attachmentType = 'other' } = req.body;
    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const att = await TaskAttachment.create({
      taskId, uploadedBy: req.user.id,
      filename: req.file.filename, originalName: req.file.originalname,
      mimetype: req.file.mimetype, size: req.file.size, attachmentType,
    });
    await TaskActivity.create({ taskId, userId: req.user.id, action: `uploaded file "${req.file.originalname}"` }).catch(() => {});

    if (attachmentType === 'deliverable') {
      const writer = await User.findByPk(req.user.id, { attributes: ['username'] });
      const uids = [...new Set([task.createdBy, task.assignedBy].filter(Boolean))];
      for (const uid of uids) {
        await createNotification(uid, 'file_uploaded', '📎 Deliverable Uploaded', `${writer.username} uploaded deliverable for "${task.title}"`, task.id);
      }
    }

    const full = await TaskAttachment.findByPk(att.id, { include: [{ model: User, as: 'uploader', attributes: ['id','username'] }] });
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAttachments = async (req, res) => {
  try {
    const atts = await TaskAttachment.findAll({
      where: { taskId: req.params.taskId },
      include: [{ model: User, as: 'uploader', attributes: ['id','username'] }],
      order: [['createdAt','DESC']],
    });
    res.json(atts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.downloadAttachment = async (req, res) => {
  try {
    const att = await TaskAttachment.findByPk(req.params.id);
    if (!att) return res.status(404).json({ message: 'File not found' });
    const filePath = path.join(__dirname, '../uploads', att.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on disk' });
    res.download(filePath, att.originalName);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const att = await TaskAttachment.findByPk(req.params.id);
    if (!att) return res.status(404).json({ message: 'Not found' });
    if (att.uploadedBy !== req.user.id && !['superadmin','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Not your file' });
    const fp = path.join(__dirname, '../uploads', att.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    await att.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
