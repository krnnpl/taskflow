const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getOverview, getTasksByMonth, getWriterPerformance,
  getStatusBreakdown, getPriorityBreakdown, getWriterReport,
} = require('../controllers/analyticsController');

router.use(protect);
router.use(restrictTo('superadmin','admin','pm'));
router.get('/overview',    getOverview);
router.get('/by-month',    getTasksByMonth);
router.get('/writers',     getWriterPerformance);
router.get('/status',      getStatusBreakdown);
router.get('/priority',    getPriorityBreakdown);
router.get('/writer/:writerId', getWriterReport);
module.exports = router;
