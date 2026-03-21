const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addBoarding,
  getMyBoardings,
  updateBoarding,
  deleteBoarding,
  getAllBoardings,
  getBoardingById
} = require('../controllers/boardingController');

// Public routes — no auth required (Student side)
router.get('/', getAllBoardings);                  // GET  /api/boardings?location=&minRent=&maxRent=&type=&search=
router.get('/my', protect, getMyBoardings);        // GET  /api/boardings/my  (must be before /:id)
router.get('/:id', getBoardingById);               // GET  /api/boardings/:id

// Protected routes — require JWT token (Owner side)
router.post('/', protect, addBoarding);            // POST   /api/boardings
router.put('/:id', protect, updateBoarding);       // PUT    /api/boardings/:id
router.delete('/:id', protect, deleteBoarding);    // DELETE /api/boardings/:id

module.exports = router;
