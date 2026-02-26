const express = require('express');
const router = express.Router();
const { getGlobalStats, getTeacherDashboardStats } = require('../controllers/statsController');

// public statistics used by the homepage
router.get('/', getGlobalStats);

// stats for teacher dashboard cards
router.get('/teacher-dashboard', getTeacherDashboardStats);

module.exports = router;
