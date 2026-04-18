const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const communityController = require('../controllers/communityController');

// Student endpoints - non-parameterized routes FIRST
router.post('/posts', protect, communityController.createPost);
router.get('/posts', protect, communityController.getApprovedPosts);
router.get('/posts/mine', protect, communityController.getMyPosts);

// Admin endpoints - specific routes before wildcards
router.get('/posts/pending', protect, authorize('admin'), communityController.getPendingPosts);

// Parameterized routes with specific sub-paths - BEFORE wildcard :postId routes
router.get('/posts/:postId/likes', protect, communityController.getLikes);
router.get('/posts/:postId/comments', protect, communityController.getComments);
router.post('/posts/:postId/comments', protect, communityController.addComment);
router.put('/posts/:postId/like', protect, communityController.toggleLike);
router.put('/posts/:postId/approve', protect, authorize('admin'), communityController.approvePost);
router.put('/posts/:postId/reject', protect, authorize('admin'), communityController.rejectPost);

// Parameterized routes - LAST (most general)
router.put('/posts/:postId', protect, communityController.updatePost);
router.delete('/posts/:postId', protect, communityController.deletePost);

module.exports = router;
