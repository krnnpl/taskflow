const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const c = require('../controllers/chatController');

// Public file download - direct browser downloads don't send auth headers
router.get('/file/:id',           c.downloadFile);

router.use(protect);
router.get('/users',              c.getChatUsers);
router.get('/unread-count',       c.getUnreadCount);

// DMs
router.get('/dm',                 c.getDMList);
router.get('/dm/:userId',         c.getDMConversation);
router.post('/dm/:userId',        upload.single('file'), c.sendDM);
router.put('/dm/msg/:id',         c.editDM);
router.delete('/dm/msg/:id',      c.deleteDM);
router.post('/dm/msg/:id/react',  c.reactDM);

// Task chat
router.get('/task/:taskId',            c.getTaskChat);
router.post('/task/:taskId',           upload.single('file'), c.sendTaskMessage);
router.put('/task/msg/:id',            c.editTaskMessage);
router.delete('/task/msg/:id',         c.deleteTaskMessage);
router.post('/task/msg/:id/react',     c.reactMessage);


module.exports = router;
