const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  getAllBoardings,
  getMyBoardings,
  getBoardingById,
  createBoarding,
  updateBoarding,
  deleteBoarding
} = require('../controllers/boardingController');

const router = express.Router();

// Configure multer for multiple image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter(req, file, cb) {
    // Allow PNG, JPG, JPEG
    if (!file.mimetype || !['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
      return cb(new Error('Only PNG and JPG images are allowed'));
    }
    return cb(null, true);
  },
});

// Public route - Get all boardings (for students)
router.get('/public/all', getAllBoardings);

// All routes require authentication for boarding owners
router.use(protect);

// Get all boardings for the current user
router.get('/', getMyBoardings);

// Get a specific boarding
router.get('/:id', getBoardingById);

// Create a new boarding (with multiple image uploads)
router.post('/', upload.array('images', 10), createBoarding);

// Update a boarding (with multiple image uploads)
router.put('/:id', upload.array('images', 10), updateBoarding);

// Delete a boarding
router.delete('/:id', deleteBoarding);

module.exports = router;
