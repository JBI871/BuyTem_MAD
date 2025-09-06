const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads')); // save files in uploads folder
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // preserve extension
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

module.exports = upload;
