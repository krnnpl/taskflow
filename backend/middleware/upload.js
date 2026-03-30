const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

// Allow all file types
module.exports = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB