const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createFeedback, updateFeedback, deleteFeedback,
  getFeedbackForTask, getWriterFeedback,
} = require('../controllers/feedbackController');

router.use(protect);
router.post('/',             restrictTo('superadmin','admin','pm','assigner'), createFeedback);
router.put('/:id',           updateFeedback);      // giver or admin
router.delete('/:id',        deleteFeedback);      // giver or admin
router.get('/my-feedback',   getWriterFeedback);
router.get('/task/:taskId',  getFeedbackForTask);
module.exports = router;
