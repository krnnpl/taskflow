const { Op } = require('sequelize');
const { Task, User, Feedback, Performance } = require('../models');

// GET /api/search?q=...
exports.search = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) return res.json({ tasks: [], users: [], feedback: [] });

    const like = { [Op.like]: `%${q}%` };

    // Scope tasks by role
    const taskWhere = { [Op.or]: [{ title: like }, { description: like }] };
    if (req.user.role === 'assigner') taskWhere.assignedToAssigner = req.user.id;
    if (req.user.role === 'writer')   taskWhere.assignedToWriter   = req.user.id;

    const [tasks, users, feedback] = await Promise.all([
      Task.findAll({
        where: taskWhere,
        include: [
          { model: User, as: 'writer',  attributes: ['id','username'] },
          { model: User, as: 'creator', attributes: ['id','username'] },
        ],
        limit: 10, order: [['createdAt','DESC']],
      }),
      // Only admin/superadmin/pm can search users
      ['superadmin','admin','pm'].includes(req.user.role)
        ? User.findAll({
            where: { isActive: true, [Op.or]: [{ username: like }, { email: like }] },
            attributes: ['id','username','email','role','availability'],
            include: [{ model: Performance, attributes: ['performanceScore','level'] }],
            limit: 8,
          })
        : Promise.resolve([]),
      // Search feedback text
      ['superadmin','admin','pm','assigner'].includes(req.user.role)
        ? Feedback.findAll({
            where: { feedbackText: like },
            include: [
              { model: User, as: 'giver',    attributes: ['id','username'] },
              { model: User, as: 'receiver', attributes: ['id','username'] },
              { model: Task, attributes: ['id','title'] },
            ],
            limit: 6, order: [['createdAt','DESC']],
          })
        : Promise.resolve([]),
    ]);

    res.json({ tasks, users, feedback });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
