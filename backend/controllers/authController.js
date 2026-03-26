const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { User, Performance } = require('../models');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Try to send email — but never crash if it fails
const trySendInviteEmail = async (email, token, role, inviterName) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;
  try {
    const emailPort = parseInt(process.env.EMAIL_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: emailPort,
      secure: emailPort === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?token=${token}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `You've been invited to TaskFlow as ${role}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#6366f1">You're invited to TaskFlow!</h2>
          <p><strong>${inviterName}</strong> has invited you to join as <strong>${role.toUpperCase()}</strong>.</p>
          <p>Click the button below to create your account. This link expires in <strong>48 hours</strong>.</p>
          <a href="${link}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">
            Accept Invitation
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Or copy this link:<br/>${link}</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.warn('[Invite] Email send failed:', e.message);
    return false;
  }
};

// Role hierarchy - who can invite whom
const getAllowedRoles = (inviterRole) => {
  switch (inviterRole) {
    case 'superadmin': return ['admin'];
    case 'admin':      return ['pm'];
    case 'pm':         return ['assigner', 'writer'];
    case 'assigner':   return ['writer'];
    default:           return [];
  }
};

// POST /api/auth/invite
exports.inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    const allowed = getAllowedRoles(req.user.role);
    if (!allowed.includes(role))
      return res.status(403).json({ message: `As ${req.user.role} you can only invite: ${allowed.join(', ')}` });
    if (!email?.trim())
      return res.status(400).json({ message: 'Email is required' });

    // Check if already an active user
    const existing = await User.findOne({ where: { email } });
    if (existing && existing.isActive)
      return res.status(400).json({ message: 'A user with this email already exists' });

    const inviteToken   = uuidv4();
    const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    if (existing && !existing.isActive) {
      // Re-issue invite for pending user
      existing.inviteToken   = inviteToken;
      existing.inviteExpires = inviteExpires;
      existing.role          = role;
      await existing.save();
    } else {
      await User.create({
        email,
        role,
        inviteToken,
        inviteExpires,
        username: email.split('@')[0],
        isActive: false,
      });
    }

    const link      = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?token=${inviteToken}&email=${encodeURIComponent(email)}`;
    const emailSent = await trySendInviteEmail(email, inviteToken, role, req.user.username);

    res.status(200).json({
      message: emailSent
        ? `Invitation email sent to ${email}`
        : `Invite created for ${email} (email not configured — share the link manually)`,
      inviteLink: link,
      inviteToken,
      emailSent,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/auth/pending-invites — list pending (not yet activated) invites sent by this user's org
exports.getPendingInvites = async (req, res) => {
  try {
    const allowed = getAllowedRoles(req.user.role);
    const invites = await User.findAll({
      where: { isActive: false, role: allowed },
      attributes: ['id','email','role','inviteToken','inviteExpires','createdAt'],
      order: [['createdAt','DESC']],
    });
    const now = new Date();
    const result = invites.map(u => ({
      id:         u.id,
      email:      u.email,
      role:       u.role,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?token=${u.inviteToken}&email=${encodeURIComponent(u.email)}`,
      expiresAt:  u.inviteExpires,
      expired:    now > new Date(u.inviteExpires),
      createdAt:  u.createdAt,
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/auth/invite/:id — cancel/revoke invite
exports.cancelInvite = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, isActive: false } });
    if (!user) return res.status(404).json({ message: 'Pending invite not found' });
    await user.destroy();
    res.json({ message: 'Invite cancelled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/invite/:id/resend — generate new token + resend/return link
exports.resendInvite = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, isActive: false } });
    if (!user) return res.status(404).json({ message: 'Pending invite not found' });

    const inviteToken   = uuidv4();
    const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    user.inviteToken   = inviteToken;
    user.inviteExpires = inviteExpires;
    await user.save();

    const link      = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?token=${inviteToken}&email=${encodeURIComponent(user.email)}`;
    const emailSent = await trySendInviteEmail(user.email, inviteToken, user.role, req.user.username);

    res.json({ message: 'Invite refreshed', inviteLink: link, emailSent });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { token, email, username, password } = req.body;
    if (!token || !email) return res.status(400).json({ message: 'Invalid invitation link' });
    const user = await User.findOne({ where: { email, inviteToken: token } });
    if (!user)         return res.status(400).json({ message: 'Invalid or already-used invitation link' });
    if (new Date() > new Date(user.inviteExpires))
      return res.status(400).json({ message: 'This invitation link has expired. Ask for a new one.' });
    if (!username?.trim()) return res.status(400).json({ message: 'Username is required' });
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    user.username      = username.trim();
    user.password      = password;
    user.inviteToken   = null;
    user.inviteExpires = null;
    user.isActive      = true;
    await user.save();

    if (user.role === 'writer') {
      await Performance.findOrCreate({ where: { userId: user.id }, defaults: { userId: user.id } });
    }

    const jwtToken = signToken(user.id);
    res.status(200).json({
      message: 'Account created successfully!',
      token: jwtToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user)           return res.status(401).json({ message: 'No account found with this email' });
    if (!user.isActive)  return res.status(401).json({ message: 'Account not activated yet — check your invite link' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch)        return res.status(401).json({ message: 'Incorrect password' });
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMe           = async (req, res) => { res.json({ user: req.user }); };
exports.getAllowedRoles  = getAllowedRoles;

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ where: { email, isActive: true } });
    // Always return success (don't reveal if email exists)
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const resetToken   = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.inviteToken   = resetToken;    // reuse inviteToken field for reset
    user.inviteExpires = resetExpires;
    await user.save();

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST, port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: false, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
          from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Reset your TaskFlow password',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
              <h2 style="color:#6366f1">Reset your password</h2>
              <p>You requested a password reset. Click the button below — this link expires in <strong>1 hour</strong>.</p>
              <a href="${link}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">Reset Password</a>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.<br/>Link: ${link}</p>
            </div>`,
        });
      } catch(e) { console.warn('[Reset] Email failed:', e.message); }
    }
    res.json({ message: 'If that email exists, a reset link has been sent.', resetLink: link });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = await User.findOne({ where: { email, inviteToken: token, isActive: true } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link' });
    if (new Date() > new Date(user.inviteExpires)) return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    user.password      = password;
    user.inviteToken   = null;
    user.inviteExpires = null;
    await user.save();
    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/setup — Register first SuperAdmin (only works if no superadmin exists)
exports.setup = async (req, res) => {
  try {
    // Check if any superadmin already exists
    const existing = await User.findOne({ where: { role: 'superadmin' } });
    if (existing) {
      return res.status(403).json({
        message: 'Setup already complete. A SuperAdmin already exists.',
        setupDone: true,
      });
    }

    const { username, email, password } = req.body;
    if (!username?.trim()) return res.status(400).json({ message: 'Username is required' });
    if (!email?.trim())    return res.status(400).json({ message: 'Email is required' });
    if (!password || password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    // Check email not already used
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) return res.status(400).json({ message: 'Email already in use' });

    const superAdmin = await User.create({
      username: username.trim(),
      email:    email.trim().toLowerCase(),
      password,
      role:     'superadmin',
      isActive: true,
    });

    const token = signToken(superAdmin.id);
    res.status(201).json({
      message: 'SuperAdmin account created successfully!',
      token,
      user: { id: superAdmin.id, username: superAdmin.username, email: superAdmin.email, role: superAdmin.role },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/auth/setup-status — Check if setup is needed
exports.setupStatus = async (req, res) => {
  try {
    const existing = await User.findOne({ where: { role: 'superadmin' } });
    res.json({ setupDone: !!existing });
  } catch (err) { res.status(500).json({ message: err.message }); }
};