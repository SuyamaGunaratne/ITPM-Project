const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');


// Public routes
router.post('/register', registrationController.registerBoardingOwner);
router.get('/status', registrationController.getRegistrationStatus);

// Admin routes (protected)
router.get('/admin/all', protect, registrationController.getAllRegistrations);
router.put('/:id/approve', protect, registrationController.approveRegistration);
router.put('/:id/reject', protect, registrationController.rejectRegistration);
router.get('/:id', protect, registrationController.getRegistrationById);

module.exports = router;
