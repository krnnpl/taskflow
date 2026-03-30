const express = require('express');
const router  = express.Router();
const tc = require('../controllers/taskController');
const cc = require('../controllers/commentController');
const ac = require('../controllers/attachmentController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public file download
router.get('/attachments/:id/download', require('../controllers/attachmentController').downloadAttachment);

router.use(protect);

// Task CRUD
router.get('/stats',    tc.getStats);
router.get('/calendar', tc.getCalendarTasks);
router.get('/workload', tc.getWorkload);
router.get('/',         tc.getAllTasks);
router.get('/:id',      tc.getTaskById);
router.get('/:id/activity', tc.getActivity);
router.post('/',        restrictTo('superadmin','admin','pm'), tc.createTask);
router.post('/bulk',    restrictTo('superadmin','admin','pm'), tc.bulkUpdate);
router.put('/:id/assign-writer', restrictTo('superadmin','admin','assigner'), tc.assignToWriter);
router.post('/:id/timer/start',  restrictTo('writer'), tc.startTimer);
router.post('/:id/timer/stop',   restrictTo('writer'), tc.stopTimer);
router.put('/:id',      tc.updateTask);
router.delete('/:id',   restrictTo('superadmin','admin','pm'), tc.deleteTask);

// Comments
router.get('/:taskId/comments',    cc.getComments);
router.post('/:taskId/comments',   cc.addComment);
router.delete('/comments/:id',     cc.deleteComment);

// Attachments
router.get('/:taskId/attachments',       ac.getAttachments);
router.post('/attachments/upload',       upload.single('file'), ac.uploadAttachment);
router.get('/attachments/:id/download',  ac.downloadAttachment);
router.delete('/attachments/:id',        ac.deleteAttachment);

module.exports = router;