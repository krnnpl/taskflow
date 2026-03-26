const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllUsers, getUserById, getWriters, getAssigners,
  getMyPerformance, updateRole, updateAvailability, getAvailability, deleteUser,
} = require('../controllers/userController');

router.use(protect);
router.get('/writers',       getWriters);
router.get('/assigners',     getAssigners);
router.get('/my-performance',getMyPerformance);
router.get('/availability',  getAvailability);
router.put('/availability',  updateAvailability);
router.get('/',              getAllUsers);
router.get('/:id',           getUserById);
router.put('/:id/role',      restrictTo('superadmin','admin'), updateRole);
router.delete('/:id',        restrictTo('superadmin','admin'), deleteUser);
module.exports = router;
