const { Op, fn, col, literal } = require('sequelize');
const { Task, User, Feedback, Performance, sequelize } = require('../models');

// GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    const [total, completed, overdue, inProgress, pending] = await Promise.all([
      Task.count(),
      Task.count({ where: { status: 'completed' } }),
      Task.count({ where: { status: 'overdue' } }),
      Task.count({ where: { status: 'in_progress' } }),
      Task.count({ where: { status: { [Op.in]: ['pending','assigned_to_assigner','assigned_to_writer'] } } }),
    ]);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    res.json({ total, completed, overdue, inProgress, pending, completionRate });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/analytics/tasks-by-month — last 6 months
exports.getTasksByMonth = async (req, res) => {
  try {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const [created, completed, overdue] = await Promise.all([
        Task.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
        Task.count({ where: { status: 'completed', updatedAt: { [Op.between]: [start, end] } } }),
        Task.count({ where: { status: 'overdue',   updatedAt: { [Op.between]: [start, end] } } }),
      ]);
      months.push({ label, created, completed, overdue });
    }
    res.json(months);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/analytics/writer-performance — all writers ranked
exports.getWriterPerformance = async (req, res) => {
  try {
    const writers = await User.findAll({
      where: { role: 'writer', isActive: true },
      include: [{ model: Performance, attributes: ['performanceScore','level','completedTasks','avgRating','complaints','totalCorrections'] }],
      attributes: ['id','username'],
    });
    const data = await Promise.all(writers.map(async w => {
      const [total, completed, overdue, inProgress] = await Promise.all([
        Task.count({ where: { assignedToWriter: w.id } }),
        Task.count({ where: { assignedToWriter: w.id, status: 'completed' } }),
        Task.count({ where: { assignedToWriter: w.id, status: 'overdue' } }),
        Task.count({ where: { assignedToWriter: w.id, status: 'in_progress' } }),
      ]);
      return {
        id: w.id, username: w.username,
        score: w.Performance?.performanceScore || 0,
        level: w.Performance?.level || 'beginner',
        avgRating: w.Performance?.avgRating || 0,
        complaints: w.Performance?.complaints || 0,
        corrections: w.Performance?.totalCorrections || 0,
        total, completed, overdue, inProgress,
        completionRate: total > 0 ? Math.round((completed/total)*100) : 0,
      };
    }));
    data.sort((a,b) => b.score - a.score);
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/analytics/task-status-breakdown
exports.getStatusBreakdown = async (req, res) => {
  try {
    const statuses = ['pending','assigned_to_assigner','assigned_to_writer','in_progress','completed','overdue','rejected'];
    const data = await Promise.all(statuses.map(async s => ({
      status: s,
      count: await Task.count({ where: { status: s } }),
    })));
    res.json(data.filter(d => d.count > 0));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/analytics/priority-breakdown
exports.getPriorityBreakdown = async (req, res) => {
  try {
    const priorities = ['low','medium','high'];
    const data = await Promise.all(priorities.map(async p => ({
      priority: p,
      count: await Task.count({ where: { priority: p } }),
    })));
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/analytics/writer-report/:writerId
exports.getWriterReport = async (req, res) => {
  try {
    const writer = await User.findByPk(req.params.writerId, {
      attributes: ['id','username','email','role','createdAt'],
      include: [{ model: Performance }],
    });
    if (!writer) return res.status(404).json({ message: 'Writer not found' });

    const tasks = await Task.findAll({
      where: { assignedToWriter: writer.id },
      include: [{ model: Feedback, attributes: ['rating','comment','createdAt'] }],
      order: [['createdAt','DESC']],
    });

    // Monthly performance trend (last 6 months)
    const now = new Date();
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleString('default', { month: 'short' });
      const [done, overdueCount] = await Promise.all([
        Task.count({ where: { assignedToWriter: writer.id, status: 'completed', updatedAt: { [Op.between]: [start, end] } } }),
        Task.count({ where: { assignedToWriter: writer.id, status: 'overdue',   updatedAt: { [Op.between]: [start, end] } } }),
      ]);
      trend.push({ label, completed: done, overdue: overdueCount });
    }

    res.json({ writer, tasks, trend });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
