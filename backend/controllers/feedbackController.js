const { Feedback, Task, User, Performance } = require('../models');
const { createNotification } = require('./notificationController');

// ── Recalculate performance (called after any feedback change) ────────────
const recalcPerformance = async (writerId) => {
  const feedbacks      = await Feedback.findAll({ where: { receiverId: writerId } });
  const completedTasks = await Task.count({ where: { assignedToWriter: writerId, status: 'completed' } });
  const totalTasks     = await Task.count({ where: { assignedToWriter: writerId } });

  const complaints       = feedbacks.filter(f => f.isComplaint).length;
  const corrections      = feedbacks.filter(f => f.correctionRequested).length;
  const ratings          = feedbacks.filter(f => f.rating != null).map(f => f.rating);
  const avgRating        = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const completionRate   = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const qualityScore     = avgRating * 20;
  const feedbackScore    = Math.max(0, avgRating * 20 - complaints * 10);

  // New formula includes corrections penalty (-3 per correction)
  const score = Math.max(0, Math.min(100,
    completionRate * 0.30 +
    qualityScore   * 0.25 +
    feedbackScore  * 0.20 +
    Math.min(completedTasks / 20, 1) * 100 * 0.15 -
    complaints  * 5 -
    corrections * 3
  ));
  const level = score >= 75 ? 'expert' : score >= 45 ? 'intermediate' : 'beginner';
  const updateData = {
    totalTasks, completedTasks,
    avgRating:        parseFloat(avgRating.toFixed(2)),
    feedbackScore:    parseFloat(feedbackScore.toFixed(2)),
    qualityScore:     parseFloat(qualityScore.toFixed(2)),
    completionRate:   parseFloat(completionRate.toFixed(2)),
    complaints,
    totalCorrections: corrections,
    performanceScore: parseFloat(score.toFixed(2)),
    level,
  };
  // Ensure performance row exists before updating
  const [perf] = await Performance.findOrCreate({ where: { userId: writerId }, defaults: { userId: writerId, ...updateData } });
  await perf.update(updateData);
};

// POST /api/feedback — create (admin, pm, assigner)
exports.createFeedback = async (req, res) => {
  try {
    const { taskId, feedbackText, rating, isComplaint, correctionRequested } = req.body;
    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status !== 'completed') return res.status(400).json({ message: 'Can only give feedback on completed tasks' });
    if (!task.assignedToWriter) return res.status(400).json({ message: 'Task has no assigned writer' });

    // Prevent duplicate feedback from same giver on same task
    const existing = await Feedback.findOne({ where: { taskId, giverId: req.user.id } });
    if (existing) return res.status(400).json({ message: 'You already gave feedback on this task. Use update instead.' });

    const feedback = await Feedback.create({
      taskId, giverId: req.user.id,
      receiverId: task.assignedToWriter,
      feedbackText, rating,
      isComplaint:         isComplaint         || false,
      correctionRequested: correctionRequested || false,
    });

    await Performance.findOrCreate({ where: { userId: task.assignedToWriter }, defaults: { userId: task.assignedToWriter } });
    await recalcPerformance(task.assignedToWriter);

    const giver = await User.findByPk(req.user.id, { attributes: ['username'] });
    const msgParts = [];
    if (rating)              msgParts.push(`${rating}/5 stars`);
    if (isComplaint)         msgParts.push('complaint');
    if (correctionRequested) msgParts.push('correction requested');
    await createNotification(task.assignedToWriter, 'feedback_received',
      isComplaint ? '⚠️ Complaint Received' : correctionRequested ? '🔄 Correction Requested' : '⭐ Feedback Received',
      `${giver.username}: ${msgParts.join(', ')} on "${task.title}"`, task.id);

    const full = await Feedback.findByPk(feedback.id, {
      include: [
        { model: User, as: 'giver',    attributes: ['id','username','role'] },
        { model: User, as: 'receiver', attributes: ['id','username','role'] },
      ],
    });
    res.status(201).json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/feedback/:id — update/override feedback (giver only)
exports.updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id, {
      include: [{ model: Task }],
    });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    // PM, Assigner can update their own feedback; admin/superadmin can update any
    if (feedback.giverId !== req.user.id && !['superadmin','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'You can only update your own feedback' });

    const { feedbackText, rating, isComplaint, correctionRequested } = req.body;
    await feedback.update({
      feedbackText:        feedbackText        ?? feedback.feedbackText,
      rating:              rating              ?? feedback.rating,
      isComplaint:         isComplaint         ?? feedback.isComplaint,
      correctionRequested: correctionRequested ?? feedback.correctionRequested,
    });

    await recalcPerformance(feedback.receiverId);

    const full = await Feedback.findByPk(feedback.id, {
      include: [
        { model: User, as: 'giver',    attributes: ['id','username','role'] },
        { model: User, as: 'receiver', attributes: ['id','username','role'] },
      ],
    });
    res.json(full);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/feedback/:id — remove feedback (giver or admin)
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    // PM, Assigner can delete their own feedback; admin/superadmin can delete any
    if (feedback.giverId !== req.user.id && !['superadmin','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'You can only delete your own feedback' });

    const writerId = feedback.receiverId;
    await feedback.destroy();
    await recalcPerformance(writerId);
    res.json({ message: 'Feedback removed and scores recalculated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/feedback/task/:taskId
exports.getFeedbackForTask = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { taskId: req.params.taskId },
      include: [
        { model: User, as: 'giver',    attributes: ['id','username','role'] },
        { model: User, as: 'receiver', attributes: ['id','username','role'] },
      ],
      order: [['createdAt','DESC']],
    });
    res.json(feedback);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/feedback/my-feedback — writer sees own received feedback
exports.getWriterFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { receiverId: req.user.id },
      include: [
        { model: User, as: 'giver', attributes: ['id','username','role'] },
        { model: Task, attributes: ['id','title'] },
      ],
      order: [['createdAt','DESC']],
    });
    res.json(feedback);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyFeedback     = exports.getWriterFeedback;
exports.recalcPerformance = recalcPerformance;
