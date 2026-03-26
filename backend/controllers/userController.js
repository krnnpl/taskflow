const { User, Performance, Task, Feedback } = require('../models');
const { Op } = require('sequelize');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: { exclude: ['password','inviteToken','inviteExpires','resetToken','resetExpires'] },
      order: [['role','ASC'],['username','ASC']],
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password','inviteToken','inviteExpires','resetToken','resetExpires'] },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getWriters = async (req, res) => {
  try {
    const writers = await User.findAll({
      where: { role: 'writer', isActive: true },
      attributes: { exclude: ['password','inviteToken','inviteExpires','resetToken','resetExpires'] },
      include: [{ model: Performance, attributes: ['performanceScore','level'] }],
    });
    res.json(writers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAssigners = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'assigner', isActive: true },
      attributes: { exclude: ['password','inviteToken','inviteExpires','resetToken','resetExpires'] },
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyPerformance = async (req, res) => {
  try {
    const perf = await Performance.findOne({ where: { userId: req.user.id } });
    res.json(perf || {});
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/users/:id/role — Admin/SuperAdmin role change
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['admin','pm','assigner','writer'];
    const saAllowed = ['admin','pm','assigner','writer'];

    // SuperAdmin can change anything; Admin can only manage below them
    if (req.user.role === 'admin' && !['pm','assigner','writer'].includes(role))
      return res.status(403).json({ message: 'Admins can only assign PM, Assigner, or Writer roles' });
    if (!saAllowed.includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'superadmin') return res.status(403).json({ message: 'Cannot change SuperAdmin role' });

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // If promoted to/from writer — ensure Performance record
    if (role === 'writer') {
      await Performance.findOrCreate({ where: { userId: user.id }, defaults: { userId: user.id } });
    }

    res.json({ message: `Role changed from ${oldRole} to ${role}`, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/users/availability — writer sets their availability
exports.updateAvailability = async (req, res) => {
  try {
    const { availability, leaveReason, leaveUntil } = req.body;
    const validStatuses = ['available','busy','on_leave','unavailable'];
    if (!validStatuses.includes(availability))
      return res.status(400).json({ message: 'Invalid availability status' });

    await req.user.update({ availability, leaveReason: leaveReason || null, leaveUntil: leaveUntil || null });
    res.json({ message: 'Availability updated', availability, leaveReason, leaveUntil });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/users/availability — get all writers' availability (for assigner/PM)
exports.getAvailability = async (req, res) => {
  try {
    const writers = await User.findAll({
      where: { role: 'writer', isActive: true },
      attributes: ['id','username','availability','leaveReason','leaveUntil'],
      include: [{ model: Performance, attributes: ['performanceScore','level'] }],
    });
    // Count active tasks per writer
    const data = await Promise.all(writers.map(async w => {
      const activeTasks = await Task.count({
        where: { assignedToWriter: w.id, status: { [Op.in]: ['assigned_to_writer','in_progress'] } },
      });
      return { ...w.toJSON(), activeTasks };
    }));
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'superadmin') return res.status(403).json({ message: 'Cannot delete SuperAdmin' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
