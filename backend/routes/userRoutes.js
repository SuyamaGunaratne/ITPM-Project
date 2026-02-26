const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getMe, updateMe, updateMyPassword } = require('../controllers/userController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter(req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    return cb(null, true);
  },
});

router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('profileImage'), updateMe);
router.put('/me/password', protect, updateMyPassword);

module.exports = router;

