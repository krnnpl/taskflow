const { Op } = require('sequelize');
const path = require('path');
const fs   = require('fs');
const { Credit, User } = require('../models');
const { createNotification } = require('./notificationController');

const include = [{ model: User, as: 'author', attributes: ['id','username','role'] }];

exports.getAllCredits = async (req, res) => {
  try {
    const credits = await Credit.findAll({
      where: { isDeleted: false },
      include, order: [['createdAt','DESC']],
    });
    res.json(credits);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createCredit = async (req, res) => {
  try {
    const { content, scheduledAt } = req.body;
    if (!content?.trim() && !req.file)
      return res.status(400).json({ message: 'Content or file required' });

    const data = {
      userId: req.user.id,
      content: content?.trim() || '',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    };
    if (req.file) {
      data.fileName = req.file.filename;
      data.fileOriginalName = req.file.originalname;
      data.fileMimeType = req.file.mimetype;
      data.fileSize = req.file.size;
    }

    const credit = await Credit.create(data);
    const full   = await Credit.findByPk(credit.id, { include });

    // Notify all active users except poster
    const allUsers = await User.findAll({
      where: { isActive: true, id: { [require('sequelize').Op.ne]: req.user.id } },
      attributes: ['id'],
    });
    const poster = await User.findByPk(req.user.id, { attributes: ['username'] });
    for (const u of allUsers) {
      await createNotification(
        u.id, 'comment_added',
        '🏆 New Credit Post',
        `${poster.username} dropped a new credit in #credits`,
        null
      );
    }

    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateCredit = async (req, res) => {
  try {
    const credit = await Credit.findByPk(req.params.id);
    if (!credit) return res.status(404).json({ message: 'Post not found' });
    if (credit.userId !== req.user.id) return res.status(403).json({ message: 'Not your post' });
    const { content } = req.body;
    await credit.update({ content: content?.trim(), isEdited: true });
    const full = await Credit.findByPk(credit.id, { include });
    res.json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteCredit = async (req, res) => {
  try {
    const credit = await Credit.findByPk(req.params.id);
    if (!credit) return res.status(404).json({ message: 'Post not found' });
    if (credit.userId !== req.user.id) return res.status(403).json({ message: 'Not your post' });
    if (credit.fileName) {
      const fp = path.join(__dirname, '../uploads', credit.fileName);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await credit.update({ isDeleted: true, content: 'This post was deleted', fileName: null });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.reactCredit = async (req, res) => {
  try {
    const { emoji } = req.body;
    const credit = await Credit.findByPk(req.params.id);
    if (!credit) return res.status(404).json({ message: 'Not found' });
    const reactions = JSON.parse(credit.reactions || '{}');
    if (!reactions[emoji]) reactions[emoji] = [];
    const idx = reactions[emoji].indexOf(req.user.id);
    if (idx === -1) reactions[emoji].push(req.user.id);
    else reactions[emoji].splice(idx, 1);
    if (reactions[emoji].length === 0) delete reactions[emoji];
    await credit.update({ reactions: JSON.stringify(reactions) });
    res.json({ reactions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.downloadFile = async (req, res) => {
  try {
    const credit = await Credit.findByPk(req.params.id);
    if (!credit?.fileName) return res.status(404).json({ message: 'File not found' });
    const fp = path.join(__dirname, '../uploads', credit.fileName);
    if (!fs.existsSync(fp)) return res.status(404).json({ message: 'File not found on disk' });
    res.download(fp, credit.fileOriginalName);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
