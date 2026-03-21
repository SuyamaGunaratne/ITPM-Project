const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addBoarding,
  getMyBoardings,
  updateBoarding,
  deleteBoarding
} = require('../controllers/boardingController');

// All routes are protected — require JWT token
router.post('/', protect, addBoarding);           // POST /api/boardings
router.get('/my', protect, getMyBoardings);        // GET  /api/boardings/my
router.put('/:id', protect, updateBoarding);       // PUT  /api/boardings/:id
router.delete('/:id', protect, deleteBoarding);    // DELETE /api/boardings/:id

module.exports = router;
