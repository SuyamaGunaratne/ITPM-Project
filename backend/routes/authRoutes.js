const express = require('express');
const router = express.Router();

const {
    registerBoardingOwner,
    login
} =  require ('../controllers/authController');

router.post('/register-boarding', registerBoardingOwner);
router.post('/login', login);

module.exports = router;