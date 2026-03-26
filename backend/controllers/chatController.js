const path = require('path');
const fs   = require('fs');
const { Op } = require('sequelize');
const { Message, User, Task } = require('../models');

const msgInclude = [
  { model: User, as: 'sender',   attributes: ['id','username','role'] },
  { model: User, as: 'receiver', attributes: ['id','username','role'] },
];

// ── DM: get conversation ────────────────────────────────────────────────
exports.getDMConversation = async (req, res) => {
  try {
    const me = req.user.id;
    const other = parseInt(req.params.userId);

    // FIX: Cannot have two [Op.or] keys - second overwrites first.
    // Use [Op.and] to combine both conditions.
    const messages = await Message.findAll({
      where: {
        type: 'dm',
        isDeleted: false,
        [Op.and]: [
          // Must be between these two users
          {
            [Op.or]: [
              { senderId: me,    receiverId: other },
              { senderId: other, receiverId: me    },
            ],
          },
          // Must not be scheduled in the future
          {
            [Op.or]: [
              { scheduledAt: null },
              { scheduledAt: { [Op.lte]: new Date() } },
            ],
          },
        ],
      },
      include: msgInclude,
      order: [['createdAt','ASC']],
      limit: 300,
    });

    // Mark received messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      { where: { senderId: other, receiverId: me, isRead: false, type: 'dm' } }
    );
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── DM: send ────────────────────────────────────────────────────────────
exports.sendDM = async (req, res) => {
  try {
    const { content, scheduledAt } = req.body;
    const receiverId = parseInt(req.params.userId);
    if (!content?.trim() && !req.file)
      return res.status(400).json({ message: 'Message or file required' });

    const receiver = await User.findByPk(receiverId);
    if (!receiver) return res.status(404).json({ message: 'User not found' });

    const data = {
      senderId: req.user.id, receiverId,
      content: content?.trim() || '', type: 'dm',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    };
    if (req.file) {
      data.fileName         = req.file.filename;
      data.fileOriginalName = req.file.originalname;
      data.fileMimeType     = req.file.mimetype;
      data.fileSize         = req.file.size;
    }

    const msg  = await Message.create(data);
    const full = await Message.findByPk(msg.id, { include: msgInclude });
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── DM: edit ────────────────────────────────────────────────────────────
exports.editDM = async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.senderId !== req.user.id) return res.status(403).json({ message: 'Not your message' });
    await msg.update({ content: req.body.content?.trim(), isEdited: true });
    res.json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── DM: delete ──────────────────────────────────────────────────────────
exports.deleteDM = async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.senderId !== req.user.id) return res.status(403).json({ message: 'Not your message' });
    if (msg.fileName) {
      const fp = path.join(__dirname, '../uploads', msg.fileName);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await msg.update({ isDeleted: true, content: 'This message was deleted', fileName: null });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── DM: react ───────────────────────────────────────────────────────────
exports.reactDM = async (req, res) => {
  try {
    const { emoji } = req.body;
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const reactions = JSON.parse(msg.reactions || '{}');
    if (!reactions[emoji]) reactions[emoji] = [];
    const idx = reactions[emoji].indexOf(req.user.id);
    if (idx === -1) reactions[emoji].push(req.user.id);
    else            reactions[emoji].splice(idx, 1);
    if (reactions[emoji].length === 0) delete reactions[emoji];
    await msg.update({ reactions: JSON.stringify(reactions) });
    res.json({ reactions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Task chat: get ────────────────────────────────────────────────────────
exports.getTaskChat = async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        taskId: parseInt(req.params.taskId),
        type: 'task',
        isDeleted: false,
        [Op.or]: [
          { scheduledAt: null },
          { scheduledAt: { [Op.lte]: new Date() } },
        ],
      },
      include: [{ model: User, as: 'sender', attributes: ['id','username','role'] }],
      order: [['createdAt','ASC']],
      limit: 300,
    });
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Task chat: send ───────────────────────────────────────────────────────
exports.sendTaskMessage = async (req, res) => {
  try {
    const { content, scheduledAt } = req.body;
    const taskId = parseInt(req.params.taskId);
    if (!content?.trim() && !req.file)
      return res.status(400).json({ message: 'Message or file required' });
    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const data = {
      senderId: req.user.id, taskId,
      content: content?.trim() || '', type: 'task',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    };
    if (req.file) {
      data.fileName         = req.file.filename;
      data.fileOriginalName = req.file.originalname;
      data.fileMimeType     = req.file.mimetype;
      data.fileSize         = req.file.size;
    }
    const msg  = await Message.create(data);
    const full = await Message.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id','username','role'] }],
    });
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Task chat: edit ───────────────────────────────────────────────────────
exports.editTaskMessage = async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg || msg.senderId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await msg.update({ content: req.body.content?.trim(), isEdited: true });
    res.json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Task chat: delete ─────────────────────────────────────────────────────
exports.deleteTaskMessage = async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg || msg.senderId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (msg.fileName) {
      const fp = path.join(__dirname, '../uploads', msg.fileName);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await msg.update({ isDeleted: true, content: 'This message was deleted', fileName: null });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Task chat: react ──────────────────────────────────────────────────────
exports.reactMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const reactions = JSON.parse(msg.reactions || '{}');
    if (!reactions[emoji]) reactions[emoji] = [];
    const idx = reactions[emoji].indexOf(req.user.id);
    if (idx === -1) reactions[emoji].push(req.user.id);
    else            reactions[emoji].splice(idx, 1);
    if (reactions[emoji].length === 0) delete reactions[emoji];
    await msg.update({ reactions: JSON.stringify(reactions) });
    res.json({ reactions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── File download ─────────────────────────────────────────────────────────
exports.downloadFile = async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg?.fileName) return res.status(404).json({ message: 'File not found' });
    const fp = path.join(__dirname, '../uploads', msg.fileName);
    if (!fs.existsSync(fp)) return res.status(404).json({ message: 'File not found on disk' });
    res.download(fp, msg.fileOriginalName);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Unread count ──────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.count({
      where: { receiverId: req.user.id, isRead: false, type: 'dm', isDeleted: false },
    });
    res.json({ unreadCount: count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── DM list ───────────────────────────────────────────────────────────────
exports.getDMList = async (req, res) => {
  try {
    const me = req.user.id;
    const sent     = await Message.findAll({ where: { senderId: me,   type: 'dm' }, attributes: ['receiverId'], group: ['receiverId'] });
    const received = await Message.findAll({ where: { receiverId: me, type: 'dm' }, attributes: ['senderId'],   group: ['senderId']   });
    const userIds  = [...new Set([...sent.map(m => m.receiverId), ...received.map(m => m.senderId)])];

    const convos = await Promise.all(userIds.map(async uid => {
      const lastMsg = await Message.findOne({
        where: {
          type: 'dm', isDeleted: false,
          [Op.or]: [{ senderId: me, receiverId: uid }, { senderId: uid, receiverId: me }],
        },
        order: [['createdAt','DESC']],
        include: [{ model: User, as: 'sender', attributes: ['id','username','role'] }],
      });
      const unread = await Message.count({
        where: { senderId: uid, receiverId: me, isRead: false, type: 'dm' },
      });
      const user = await User.findByPk(uid, { attributes: ['id','username','role'] });
      return { user, lastMessage: lastMsg, unreadCount: unread };
    }));
    convos.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));
    res.json(convos);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── All users for chat ────────────────────────────────────────────────────
exports.getChatUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true, id: { [Op.ne]: req.user.id } },
      attributes: ['id','username','role'],
      order: [['username','ASC']],
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
