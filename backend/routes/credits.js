const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const c = require('../controllers/creditController');

// Public file download
router.get('/file/:id',   c.downloadFile);

router.use(protect);
router.get('/',           c.getAllCredits);
router.post('/',          upload.single('file'), c.createCredit);
router.put('/:id',        c.updateCredit);
router.delete('/:id',     c.deleteCredit);
router.post('/:id/react', c.reactCredit);
module.exports = router;