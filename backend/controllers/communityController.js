const StudentPost = require('../models/StudentPost');
const PostRequest = require('../models/PostRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create a new student post request (pending approval)
const createPost = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    // Only students are allowed to create community posts
    if (req.user.role !== 'student') {
      console.warn(`Community post creation blocked for role=\"${req.user.role}\" (user=${req.user._id})`);
      return res.status(403).json({ message: `Only students can create community posts (your role: ${req.user.role})` });
    }

    const { title, content, imageData, imageContentType } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const postRequest = new PostRequest({
      title: title.trim(),
      content: content.trim(),
      author: req.user._id,
      status: 'pending',
    });

    if (imageData && imageContentType) {
      postRequest.image = {
        data: Buffer.from(imageData, 'base64'),
        contentType: imageContentType,
      };
    }

    await postRequest.save();

    // notify admins for approval
    try {
      const admins = await User.find({ role: 'admin' });
      await Promise.all(admins.map((admin) =>
        Notification.create({
          user: admin._id,
          type: 'admin_request',
          postRequest: postRequest._id,
          message: `New student concern pending approval: "${postRequest.title}"`,
        })
      ));
    } catch (notifyErr) {
      console.error('Failed to create admin notifications:', notifyErr);
    }

    res.status(201).json({ message: 'Post submitted and pending admin approval', post: postRequest });
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// Get list of approved community posts (for students to view)
const getApprovedPosts = async (req, res) => {
  try {
    const posts = await StudentPost.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .populate('author', 'fullName profileImageData profileImageContentType')
      .populate('comments.user', 'fullName profileImageData profileImageContentType');

    const transformed = posts.map((p) => {
      const imageUrl = p.image?.data && p.image?.contentType
        ? `data:${p.image.contentType};base64,${p.image.data.toString('base64')}`
        : null;

      const likes = Array.isArray(p.likes) ? p.likes : [];
      const likedByCurrentUser = req.user
        ? likes.some((u) => u.toString() === req.user._id.toString())
        : false;

      return {
        _id: p._id,
        title: p.title,
        content: p.content,
        image: imageUrl,
        author: {
          _id: p.author?._id,
          fullName: p.author?.fullName,
          profileImage: p.author?.profileImageData && p.author?.profileImageContentType
            ? `data:${p.author.profileImageContentType};base64,${Buffer.from(p.author.profileImageData).toString('base64')}`
            : null,
        },
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        likesCount: likes.length,
        likedByCurrentUser,
        comments: p.comments.map((c) => ({
          _id: c._id,
          text: c.text,
          user: c.user,
          createdAt: c.createdAt,
        })),
      };
    });

    res.json(transformed);
  } catch (error) {
    console.error('Error getting approved posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
};

// Get the current user's posts (pending/approved/rejected)
const getMyPosts = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    // Get pending posts from PostRequest table
    const postRequests = await PostRequest.find({ author: req.user._id })
      .sort({ createdAt: -1 });

    // Get approved posts from StudentPost table
    const studentPosts = await StudentPost.find({ author: req.user._id })
      .sort({ createdAt: -1 });

    // Transform PostRequest data
    const transformedRequests = postRequests.map((p) => {
      const imageUrl = p.image?.data && p.image?.contentType
        ? `data:${p.image.contentType};base64,${p.image.data.toString('base64')}`
        : null;

      return {
        _id: p._id,
        title: p.title,
        content: p.content,
        image: imageUrl,
        status: 'pending',
        reviewReason: p.reviewReason || '',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        likesCount: 0,
        source: 'postRequest', // Mark origin for potential frontend use
      };
    });

    // Transform StudentPost data
    const transformedPosts = studentPosts.map((p) => {
      const imageUrl = p.image?.data && p.image?.contentType
        ? `data:${p.image.contentType};base64,${p.image.data.toString('base64')}`
        : null;

      const likes = Array.isArray(p.likes) ? p.likes : [];

      return {
        _id: p._id,
        title: p.title,
        content: p.content,
        image: imageUrl,
        status: p.status,
        reviewReason: p.reviewReason,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        likesCount: likes.length,
        source: 'studentPost',
      };
    });

    // Combine and sort by creation date (newest first)
    const allPosts = [...transformedRequests, ...transformedPosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allPosts);
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ message: 'Failed to fetch your posts', error: error.message });
  }
};

// Add a comment to a post
const addComment = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const { postId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await StudentPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.status !== 'approved') {
      return res.status(400).json({ message: 'Can only comment on approved posts' });
    }

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();

    // respond with newly created comment (last in array)
    const added = post.comments[post.comments.length - 1];

    // Send notification to post owner if it's not the post owner commenting
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        const commenter = await User.findById(req.user._id).select('fullName');
        await Notification.create({
          user: post.author,
          type: 'post_comment',
          post: postId,
          sender: req.user._id,
          messageContent: text.trim(),
          message: `${commenter?.fullName || 'A student'} commented on your post: "${text.trim().substring(0, 50)}${text.trim().length > 50 ? '...' : ''}"`,
        });
      } catch (notifyErr) {
        console.error('Failed to create comment notification:', notifyErr);
      }
    }

    res.status(201).json({ message: 'Comment added', comment: added });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// Toggle like/unlike a post
const toggleLike = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const { postId } = req.params;
    const post = await StudentPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.status !== 'approved') {
      return res.status(400).json({ message: 'Can only like approved posts' });
    }

    const userId = req.user._id.toString();
    const likedIndex = (post.likes || []).findIndex((u) => u.toString() === userId);
    let liked = false;

    if (likedIndex > -1) {
      post.likes.splice(likedIndex, 1);
    } else {
      post.likes = post.likes || [];
      post.likes.push(req.user._id);
      liked = true;
    }

    await post.save();

    // Send notification to post owner if someone likes the post (not for unlike)
    if (liked && post.author.toString() !== req.user._id.toString()) {
      try {
        const liker = await User.findById(req.user._id).select('fullName');
        await Notification.create({
          user: post.author,
          type: 'post_like',
          post: postId,
          sender: req.user._id,
          message: `${liker?.fullName || 'A student'} liked your post "${post.title}"`,
        });
      } catch (notifyErr) {
        console.error('Failed to create like notification:', notifyErr);
      }
    }

    res.json({
      message: liked ? 'Post liked' : 'Like removed',
      likesCount: (post.likes || []).length,
      likedByCurrentUser: liked,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
};

// Get comments of a post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await StudentPost.findById(postId).populate('comments.user', 'fullName profileImageData profileImageContentType');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.status !== 'approved') {
      return res.status(403).json({ message: 'Comments are available only for approved posts' });
    }

    const formatted = post.comments.map((c) => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      user: {
        _id: c.user?._id,
        fullName: c.user?.fullName,
        profileImage: c.user?.profileImageData && c.user?.profileImageContentType
          ? `data:${c.user.profileImageContentType};base64,${Buffer.from(c.user.profileImageData).toString('base64')}`
          : null,
      },
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

// Admin: list pending post requests
const getPendingPosts = async (req, res) => {
  try {
    const postRequests = await PostRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('author', 'fullName email');

    res.json(postRequests);
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    res.status(500).json({ message: 'Failed to fetch pending posts', error: error.message });
  }
};

// Admin: approve a post request and move to StudentPost
const approvePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const postRequest = await PostRequest.findById(postId);
    if (!postRequest) return res.status(404).json({ message: 'Post request not found' });
    if (postRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Post request has already been reviewed' });
    }

    // Create approved post in StudentPost table
    const approvedPost = new StudentPost({
      title: postRequest.title,
      content: postRequest.content,
      author: postRequest.author,
      image: postRequest.image,
      status: 'approved',
      reviewedBy: req.user._id,
      reviewReason: req.body.reviewReason || '',
      createdAt: postRequest.createdAt,
      updatedAt: new Date(),
    });

    await approvedPost.save();

    // Delete from PostRequest table
    await PostRequest.deleteOne({ _id: postId });

    // Notify student of approval
    try {
      if (postRequest.author) {
        await Notification.create({
          user: postRequest.author,
          type: 'post_approved',
          post: approvedPost._id,
          message: `Your concern "${postRequest.title}" was approved by admin.`,
        });
      }
    } catch (notifyErr) {
      console.error('Failed to create user notification:', notifyErr);
    }

    res.json({ message: 'Post approved successfully and moved to StudentPost', post: approvedPost });
  } catch (error) {
    console.error('Error approving post:', error);
    res.status(500).json({ message: 'Failed to approve post', error: error.message });
  }
};

// Admin: reject a post request
const rejectPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reviewReason } = req.body;

    if (!reviewReason || !reviewReason.trim()) {
      return res.status(400).json({ message: 'Review reason is required when rejecting' });
    }

    const postRequest = await PostRequest.findById(postId);
    if (!postRequest) return res.status(404).json({ message: 'Post request not found' });
    if (postRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Post request has already been reviewed' });
    }

    // Notify student of rejection
    try {
      if (postRequest.author) {
        await Notification.create({
          user: postRequest.author,
          type: 'post_rejected',
          message: `Your concern "${postRequest.title}" was rejected by admin. Reason: ${reviewReason.trim()}`,
        });
      }
    } catch (notifyErr) {
      console.error('Failed to create rejection notification:', notifyErr);
    }

    // Delete from PostRequest table
    await PostRequest.deleteOne({ _id: postId });

    res.json({ message: 'Post request rejected and removed successfully' });
  } catch (error) {
    console.error('Error rejecting post:', error);
    res.status(500).json({ message: 'Failed to reject post', error: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const { postId } = req.params;
    const { title, content } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Check if post is in PostRequest (pending)
    let post = await PostRequest.findById(postId);
    if (post) {
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to edit this post' });
      }

      post.title = title.trim();
      post.content = content.trim();
      post.updatedAt = new Date();
      await post.save();

      // Notify admins that a pending concern has been edited and requires review
      try {
        const admins = await User.find({ role: 'admin' });
        await Promise.all(admins.map((admin) =>
          Notification.create({
            user: admin._id,
            type: 'admin_request',
            postRequest: post._id,
            message: `Student concern updated and pending approval: "${post.title}"`,
          })
        ));
      } catch (notifyErr) {
        console.error('Failed to notify admins about updated pending concern:', notifyErr);
      }

      return res.json({ message: 'Post updated successfully', post });
    }

    // Check if post is in StudentPost (approved/other)
    post = await StudentPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    post.title = title.trim();
    post.content = content.trim();

    // Once a student post is approved, future edits are saved directly.
    if (post.status === 'approved') {
      post.updatedAt = new Date();
      await post.save();
      return res.json({ message: 'Approved post updated successfully', post });
    }

    // For non-approved StudentPost status, maintain same behavior.
    post.updatedAt = new Date();
    await post.save();

    res.json({ message: 'Post updated successfully', post });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const { postId } = req.params;

    // Check if post is in PostRequest (pending)
    let post = await PostRequest.findById(postId);
    if (post) {
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }

      await PostRequest.deleteOne({ _id: postId });
      return res.json({ message: 'Post deleted successfully' });
    }

    // Check if post is in StudentPost (approved/other status)
    post = await StudentPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    const deleteResult = await StudentPost.deleteOne({ _id: postId });
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: 'Post not found during deletion' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};

// Get list of users who liked a post
const getLikes = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await StudentPost.findById(postId).populate('likes', 'fullName profileImageData profileImageContentType');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const formatted = (post.likes || []).map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      profileImage: u.profileImageData && u.profileImageContentType
        ? `data:${u.profileImageContentType};base64,${Buffer.from(u.profileImageData).toString('base64')}`
        : null,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error getting likes:', error);
    res.status(500).json({ message: 'Failed to fetch likes', error: error.message });
  }
};

module.exports = {
  createPost,
  getApprovedPosts,
  getMyPosts,
  updatePost,
  deletePost,
  addComment,
  toggleLike,
  getComments,
  getLikes,
  getPendingPosts,
  approvePost,
  rejectPost,
};
