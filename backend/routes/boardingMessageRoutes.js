const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const boardingMessageController = require('../controllers/boardingMessageController');

// Student routes
router.post('/', protect, boardingMessageController.createBoardingMessage);
router.get('/student', protect, boardingMessageController.getStudentMessages);

// Boarding owner routes
router.get('/owner', protect, authorize('boardingOwner'), boardingMessageController.getOwnerMessages);

// Shared routes
router.put('/:messageId/reply', protect, boardingMessageController.replyToMessage);
router.put('/:messageId/status', protect, boardingMessageController.updateMessageStatus);

module.exports = router;