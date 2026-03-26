const cron = require('node-cron');
const { Op } = require('sequelize');

const sendReminderEmail = async (email, taskTitle, dueDate) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `⏰ Task Due Tomorrow: ${taskTitle}`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#6366f1">Task Due Tomorrow</h2>
        <p><strong>"${taskTitle}"</strong> is due tomorrow.</p>
        <p style="color:#94a3b8;font-size:12px;">Due: ${new Date(dueDate).toLocaleString()}</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}"
          style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">
          Open TaskFlow
        </a>
      </div>`,
    });
  } catch (e) { console.warn('[Email] deadline reminder failed:', e.message); }
};

const checkDeadlines = async () => {
  try {
    const { Task, User } = require('../models');
    const { createNotification } = require('../controllers/notificationController');
    const now = new Date();
    const in24h_start = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24h_end   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcoming = await Task.findAll({
      where: {
        dueDate: { [Op.between]: [in24h_start, in24h_end] },
        status: { [Op.notIn]: ['completed', 'rejected', 'overdue'] },
      },
    });

    for (const task of upcoming) {
      const uids = [...new Set([task.createdBy, task.assignedToAssigner, task.assignedToWriter].filter(Boolean))];
      for (const uid of uids) {
        await createNotification(uid, 'task_overdue', '⏰ Due in 24 Hours',
          `"${task.title}" is due tomorrow — make sure it's on track.`, task.id);
        const user = await User.findByPk(uid, { attributes: ['email', 'emailDigest'] });
        if (user?.emailDigest !== 'none') {
          await sendReminderEmail(user.email, task.title, task.dueDate);
        }
      }
    }
    if (upcoming.length) console.log(`[Cron] Sent deadline reminders for ${upcoming.length} task(s)`);
  } catch (err) { console.error('[Cron] deadline reminder failed:', err.message); }
};

cron.schedule('0 9 * * *', checkDeadlines);
module.exports = checkDeadlines;
