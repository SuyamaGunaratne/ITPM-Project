const express = require('express');
const router = express.Router();
const { getGlobalStats, getTeacherDashboardStats, getAdminDashboardStats } = require('../controllers/statsController');

// public statistics used by the homepage
router.get('/', getGlobalStats);

// stats for teacher dashboard cards
router.get('/teacher-dashboard', getTeacherDashboardStats);

// stats for admin dashboard
router.get('/admin-dashboard', getAdminDashboardStats);

module.exports = router;
