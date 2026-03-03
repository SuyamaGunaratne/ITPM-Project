const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    registerBoardingOwner,
    login,
    logout
} =  require ('../controllers/authController');

router.post('/register-boarding', registerBoardingOwner);
router.post('/login', login);
router.post('/logout', protect, logout);

module.exports = router;