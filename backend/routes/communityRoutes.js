const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const communityController = require('../controllers/communityController');

// Student endpoints
router.post('/posts', protect, communityController.createPost);
router.get('/posts', protect, communityController.getApprovedPosts);
router.get('/posts/mine', protect, communityController.getMyPosts);
router.put('/posts/:postId', protect, communityController.updatePost);
router.delete('/posts/:postId', protect, communityController.deletePost);
router.post('/posts/:postId/comments', protect, communityController.addComment);
router.put('/posts/:postId/like', protect, communityController.toggleLike);
router.get('/posts/:postId/comments', protect, communityController.getComments);

// Admin endpoints
router.get('/posts/pending', protect, authorize('admin'), communityController.getPendingPosts);
router.put('/posts/:postId/approve', protect, authorize('admin'), communityController.approvePost);
router.put('/posts/:postId/reject', protect, authorize('admin'), communityController.rejectPost);

module.exports = router;
