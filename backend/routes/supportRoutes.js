const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const supportController = require('../controllers/supportController');

// Student endpoints
router.post('/', protect, supportController.createSupportRequest);
router.get('/my-requests', protect, supportController.getStudentSupportRequests);

// Admin endpoints (must come after student endpoints to avoid conflicts)
router.get('/', protect, authorize('admin'), supportController.getAllSupportRequests);
router.get('/stats', protect, authorize('admin'), supportController.getSupportStats);
router.put('/:id', protect, authorize('admin'), supportController.updateSupportRequest);

module.exports = router;