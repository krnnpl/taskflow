const { Op } = require('sequelize');
const { Task, User, Feedback, Performance, TaskActivity, TaskComment, TaskAttachment, Notification, Message, Credit } = require('../models');
const { createNotification } = require('./notificationController');

const taskIncludes = [
  { model: User, as: 'writer',   attributes: ['id','username','email'] },
  { model: User, as: 'assigner', attributes: ['id','username','email'] },
  { model: User, as: 'creator',  attributes: ['id','username','email'] },
  { model: TaskAttachment, include: [{ model: User, as: 'uploader', attributes: ['id','username'] }] },
  { model: Task, as: 'dependency', attributes: ['id','title','status'] },
];

const log = (taskId, userId, action) =>
  TaskActivity.create({ taskId, userId, action }).catch(() => {});

// GET all tasks (filtered by role)
exports.getAllTasks = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'assigner') where.assignedToAssigner = req.user.id;
    if (req.user.role === 'writer')   where.assignedToWriter   = req.user.id;
    const tasks = await Task.findAll({ where, include: taskIncludes, order: [['createdAt','DESC']] });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET single task
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, { include: taskIncludes });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET activity log
exports.getActivity = async (req, res) => {
  try {
    const activity = await TaskActivity.findAll({
      where: { taskId: req.params.id },
      include: [{ model: User, as: 'actor', attributes: ['id','username'] }],
      order: [['createdAt','DESC']], limit: 100,
    });
    res.json(activity);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET calendar tasks
exports.getCalendarTasks = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year), m = parseInt(month);
    const start = new Date(y, m - 1, 1);
    const end   = new Date(y, m, 0, 23, 59, 59);
    const where = { dueDate: { [Op.between]: [start, end] } };
    if (req.user.role === 'assigner') where.assignedToAssigner = req.user.id;
    if (req.user.role === 'writer')   where.assignedToWriter   = req.user.id;
    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'writer',  attributes: ['id','username'] },
        { model: User, as: 'creator', attributes: ['id','username'] },
      ],
      order: [['dueDate','ASC']],
    });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET workload
exports.getWorkload = async (req, res) => {
  try {
    const writers = await User.findAll({
      where: { role: 'writer', isActive: true },
      attributes: ['id','username','email','availability'],
      include: [{ model: Performance }],
    });
    const activeTasks = await Task.findAll({
      where: { status: { [Op.notIn]: ['completed','rejected'] }, assignedToWriter: { [Op.ne]: null } },
      attributes: ['id','title','status','priority','dueDate','assignedToWriter'],
    });
    const result = writers.map(w => ({
      ...w.toJSON(),
      activeTasks: activeTasks.filter(t => t.assignedToWriter === w.id),
      activeCount: activeTasks.filter(t => t.assignedToWriter === w.id).length,
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST bulk update
exports.bulkUpdate = async (req, res) => {
  try {
    const { taskIds, status, priority } = req.body;
    if (!taskIds?.length) return res.status(400).json({ message: 'No task IDs' });
    const update = {};
    if (status)   update.status   = status;
    if (priority) update.priority = priority;
    // Never update already-completed or rejected tasks
    const where = { id: taskIds };
    if (status) where.status = { [Op.notIn]: ['completed','rejected'] };
    const count = await Task.update(update, { where });
    res.json({ message: `Updated tasks` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST start timer
exports.startTimer = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task || task.assignedToWriter !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    task.timerStartedAt = new Date();
    await task.save();
    res.json({ timerStartedAt: task.timerStartedAt });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST stop timer
exports.stopTimer = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task || task.assignedToWriter !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (task.timerStartedAt) {
      const mins = Math.round((new Date() - new Date(task.timerStartedAt)) / 60000);
      task.loggedMinutes  = (task.loggedMinutes || 0) + Math.max(mins, 0);
      task.timerStartedAt = null;
      await task.save();
      await log(task.id, req.user.id, `logged ${mins} minutes`);
    }
    res.json({ loggedMinutes: task.loggedMinutes });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST create task (PM)
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedToAssigner, dueDate, priority, estimatedMinutes, dependsOn } = req.body;
    const task = await Task.create({
      title, description,
      assignedToAssigner: assignedToAssigner || null,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      estimatedMinutes: estimatedMinutes || null,
      dependsOn: dependsOn || null,
      createdBy: req.user.id,
      status: assignedToAssigner ? 'assigned_to_assigner' : 'pending',
    });
    await log(task.id, req.user.id, 'task created');
    if (assignedToAssigner) {
      await log(task.id, req.user.id, 'assigned to assigner');
      const pm = await User.findByPk(req.user.id, { attributes: ['username'] });
      await createNotification(assignedToAssigner, 'task_assigned_to_assigner', '📋 New Task Assigned', `${pm.username} assigned you: "${title}"`, task.id);
    }
    const full = await Task.findByPk(task.id, { include: taskIncludes });
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT assign to writer (Assigner)
exports.assignToWriter = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check dependency
    if (task.dependsOn) {
      const dep = await Task.findByPk(task.dependsOn);
      if (dep && dep.status !== 'completed')
        return res.status(400).json({ message: `Dependency "${dep.title}" must be completed first` });
    }

    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ message: 'assignedTo is required' });

    // Check writer availability
    const writer = await User.findByPk(assignedTo);
    if (!writer) return res.status(404).json({ message: 'Writer not found' });
    if (writer.availability === 'unavailable' || writer.availability === 'on_leave')
      return res.status(400).json({ message: `${writer.username} is currently ${writer.availability.replace('_',' ')} and cannot be assigned tasks` });

    task.assignedToWriter = assignedTo;
    task.assignedBy       = req.user.id;
    task.status           = 'assigned_to_writer';
    await task.save();

    await Performance.findOrCreate({ where: { userId: assignedTo }, defaults: { userId: assignedTo } });
    const total = await Task.count({ where: { assignedToWriter: assignedTo } });
    await Performance.update({ totalTasks: total }, { where: { userId: assignedTo } });

    await log(task.id, req.user.id, `assigned to ${writer.username}`);
    const assigner = await User.findByPk(req.user.id, { attributes: ['username'] });
    await createNotification(assignedTo,    'task_assigned_to_writer', '📋 Task Assigned to You',      `${assigner.username} assigned you: "${task.title}"`,           task.id);
    if (task.createdBy) await createNotification(task.createdBy, 'task_assigned_to_writer', '✅ Task Forwarded', `"${task.title}" assigned to ${writer.username}`, task.id);

    const full = await Task.findByPk(task.id, { include: taskIncludes });
    res.json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role === 'writer') {
      // Writer can only update status of their own tasks
      if (task.assignedToWriter !== req.user.id) return res.status(403).json({ message: 'Not your task' });
      const { status } = req.body;
      const prev = task.status;
      // LOCK: rejected tasks are permanently closed; completed can be reopened to in_progress only
      if (prev === 'rejected')
        return res.status(400).json({ message: 'Rejected tasks cannot be changed' });
      if (prev === 'completed' && status !== 'in_progress')
        return res.status(400).json({ message: 'A completed task can only be reopened to In Progress' });
      task.status = status;

      if (status === 'completed') {
        task.completionDate = new Date();
        if (task.timerStartedAt) {
          const mins = Math.round((new Date() - new Date(task.timerStartedAt)) / 60000);
          task.loggedMinutes  = (task.loggedMinutes || 0) + Math.max(mins, 0);
          task.timerStartedAt = null;
        }
        const done = await Task.count({ where: { assignedToWriter: req.user.id, status: 'completed' } }) + 1;
        await Performance.update({ completedTasks: done }, { where: { userId: req.user.id } });
        const w = await User.findByPk(req.user.id, { attributes: ['username'] });
        if (task.assignedBy)  await createNotification(task.assignedBy,  'task_completed', '✅ Task Completed', `${w.username} completed "${task.title}"`, task.id);
        if (task.createdBy)   await createNotification(task.createdBy,   'task_completed', '✅ Task Completed', `"${task.title}" completed by ${w.username}`, task.id);
      } else if (status === 'in_progress' && prev !== 'in_progress') {
        const w = await User.findByPk(req.user.id, { attributes: ['username'] });
        if (task.assignedBy) await createNotification(task.assignedBy, 'task_in_progress', '🚀 Task Started', `${w.username} started "${task.title}"`, task.id);
      }
      await log(task.id, req.user.id, `status → ${status}`);

    } else {
      // PM / Admin / Assigner can update — but completed tasks are locked too
      const { title, description, status, dueDate, priority, assignedToAssigner, estimatedMinutes, dependsOn } = req.body;
      // Rejected = permanent lock; completed can only go back to in_progress
      if (status && task.status === 'rejected')
        return res.status(400).json({ message: 'Rejected tasks cannot be changed' });
      if (status && task.status === 'completed' && status !== 'in_progress')
        return res.status(400).json({ message: 'A completed task can only be reopened to In Progress' });
      if (title !== undefined)              task.title = title;
      if (description !== undefined)        task.description = description;
      if (dueDate !== undefined)            task.dueDate = dueDate;
      if (priority !== undefined)           task.priority = priority;
      if (estimatedMinutes !== undefined)   task.estimatedMinutes = estimatedMinutes;
      if (dependsOn !== undefined)          task.dependsOn = dependsOn || null;
      if (assignedToAssigner !== undefined) {
        task.assignedToAssigner = assignedToAssigner;
        // Auto update status when assigning/unassigning
        if (assignedToAssigner && task.status === 'pending') {
          task.status = 'assigned_to_assigner';
        } else if (!assignedToAssigner && task.status === 'assigned_to_assigner') {
          task.status = 'pending';
          task.assignedToWriter = null;
        }
      }
      if (status !== undefined) {
        task.status = status;
        if (status === 'completed') task.completionDate = new Date();
        await log(task.id, req.user.id, `status → ${status}`);
      }
    }

    await task.save();
    const full = await Task.findByPk(task.id, { include: taskIncludes });
    res.json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    // PM can only delete their own tasks; admin/superadmin can delete any
    if (req.user.role === 'pm' && task.createdBy !== req.user.id)
      return res.status(403).json({ message: 'You can only delete tasks you created' });

    const id = task.id;

    // Delete all child records first to avoid FK constraint errors
    await TaskComment.destroy({ where: { taskId: id } });
    await TaskActivity.destroy({ where: { taskId: id } });
    await Notification.destroy({ where: { relatedTaskId: id } });
    await Feedback.destroy({ where: { taskId: id } });
    await Message.destroy({ where: { taskId: id } });
    // Attachments - also delete files from disk
    const atts = await TaskAttachment.findAll({ where: { taskId: id } });
    const path = require('path'), fs = require('fs'); // eslint-disable-line
    for (const att of atts) {
      const fp = path.join(__dirname, '../uploads', att.filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await TaskAttachment.destroy({ where: { taskId: id } });
    // Credits linked to this task
    await Credit.update({ taskId: null }, { where: { taskId: id } }).catch(() => {});

    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET stats
exports.getStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'assigner') where.assignedToAssigner = req.user.id;
    if (req.user.role === 'writer')   where.assignedToWriter   = req.user.id;
    const [total, pending, inProgress, completed, overdue, ata, atw] = await Promise.all([
      Task.count({ where }),
      Task.count({ where: { ...where, status: 'pending' } }),
      Task.count({ where: { ...where, status: 'in_progress' } }),
      Task.count({ where: { ...where, status: 'completed' } }),
      Task.count({ where: { ...where, isOverdue: true } }),
      Task.count({ where: { ...where, status: 'assigned_to_assigner' } }),
      Task.count({ where: { ...where, status: 'assigned_to_writer' } }),
    ]);
    res.json({ total, pending, inProgress, completed, overdue, assignedToAssigner: ata, assignedToWriter: atw });
  } catch (err) { res.status(500).json({ message: err.message }); }
};