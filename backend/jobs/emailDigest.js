const cron = require('node-cron');
const { Op } = require('sequelize');

const sendDigests = async () => {
  try {
    const { User, Task } = require('../models');
    const nodemailer = require('nodemailer');
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const users = await User.findAll({ where: { isActive: true, emailDigest: { [Op.in]: ['daily','weekly'] } } });

    for (const user of users) {
      const now = new Date();
      const since = user.emailDigest === 'weekly'
        ? new Date(now - 7 * 24 * 60 * 60 * 1000)
        : new Date(now - 24 * 60 * 60 * 1000);

      // Get tasks relevant to this user
      const whereClause = {};
      if (user.role === 'writer')   whereClause.assignedToWriter   = user.id;
      if (user.role === 'assigner') whereClause.assignedToAssigner = user.id;
      if (user.role === 'pm')       whereClause.createdBy          = user.id;

      const { Credit } = require('../models');
      const newCredits = await Credit.count({ where: { createdAt: { [Op.gte]: since } } });
      const pending  = await Task.count({ where: { ...whereClause, status: { [Op.notIn]: ['completed','rejected'] } } });
      const overdue  = await Task.count({ where: { ...whereClause, status: 'overdue' } });
      const completed= await Task.count({ where: { ...whereClause, status: 'completed', updatedAt: { [Op.gte]: since } } });

      if (pending === 0 && overdue === 0 && newCredits === 0) continue;

      const period = user.emailDigest === 'weekly' ? 'Weekly' : 'Daily';
      await transporter.sendMail({
        from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `📋 TaskFlow ${period} Digest`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#6366f1">Your ${period} TaskFlow Summary</h2>
          <p>Hi <strong>${user.username}</strong>,</p>
          <div style="display:flex;gap:16px;margin:24px 0;">
            <div style="flex:1;background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:32px;font-weight:800;color:#6366f1">${pending}</div>
              <div style="color:#64748b;font-size:12px">Pending Tasks</div>
            </div>
            <div style="flex:1;background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:32px;font-weight:800;color:#ef4444">${overdue}</div>
              <div style="color:#64748b;font-size:12px">Overdue</div>
            </div>
            <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
              <div style="font-size:32px;font-weight:800;color:#059669">${completed}</div>
              <div style="color:#64748b;font-size:12px">Completed (${period})</div>
            </div>
          </div>
          ${newCredits > 0 ? `<div style="background:#f5f3ff;border-radius:8px;padding:16px;margin:16px 0;"><strong style="color:#6366f1">🏆 ${newCredits} new credit post${newCredits > 1 ? 's' : ''}</strong> in the Credits feed</div>` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${user.role}/dashboard"
            style="display:inline-block;padding:12px 28px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
            Open TaskFlow
          </a>
          <p style="color:#94a3b8;font-size:11px;margin-top:24px;">
            You're receiving this because you enabled ${period.toLowerCase()} digest in your settings.
          </p>
        </div>`,
      });
    }
  } catch (err) { console.error('[Cron] digest failed:', err.message); }
};

// Daily at 7am, weekly on Monday 7am
cron.schedule('0 7 * * *',   sendDigests); // daily
cron.schedule('0 7 * * 1',   sendDigests); // weekly (Mon)
module.exports = sendDigests;
