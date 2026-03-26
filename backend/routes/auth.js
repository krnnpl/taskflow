const express  = require('express');
const router   = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  login, register, getMe,
  inviteUser, getPendingInvites, cancelInvite, resendInvite,
  forgotPassword, resetPassword,
  setup, setupStatus,
} = require('../controllers/authController');

// Public routes - no auth needed
router.get('/setup-status',     setupStatus);   // Check if setup needed
router.post('/setup',           setup);          // First-time SuperAdmin register
router.post('/login',           login);
router.post('/register',        register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// Protected routes - need to be logged in
router.use(protect);
router.get('/me',                    getMe);
router.post('/invite',               restrictTo('superadmin','admin','pm','assigner'), inviteUser);
router.get('/pending-invites',       restrictTo('superadmin','admin','pm','assigner'), getPendingInvites);
router.post('/invite/:id/resend',    restrictTo('superadmin','admin','pm','assigner'), resendInvite);
router.delete('/invite/:id',         restrictTo('superadmin','admin','pm','assigner'), cancelInvite);

module.exports = router;
