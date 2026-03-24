const Support = require('../models/Support');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create a new support request
const createSupportRequest = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const { subject, category, message, priority, studentId, studentName, studentEmail } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const supportRequest = new Support({
      studentId: studentId || req.user._id,
      studentName: studentName || req.user.fullName || req.user.name,
      studentEmail: studentEmail || req.user.email,
      subject: subject.trim(),
      category,
      message: message.trim(),
      priority,
      status: 'open'
    });

    await supportRequest.save();

    // Notify admins about the new support request
    try {
      const admins = await User.find({ role: 'admin' });
      await Promise.all(admins.map((admin) =>
        Notification.create({
          user: admin._id,
          type: 'support_request',
          supportRequest: supportRequest._id,
          message: `New support request from ${supportRequest.studentName}: "${supportRequest.subject}"`,
        })
      ));
    } catch (notifyErr) {
      console.error('Failed to create admin notifications for support request:', notifyErr);
    }

    res.status(201).json({
      message: 'Support request submitted successfully',
      supportRequest: {
        _id: supportRequest._id,
        subject: supportRequest.subject,
        category: supportRequest.category,
        priority: supportRequest.priority,
        status: supportRequest.status,
        createdAt: supportRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating support request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all support requests (for admins)
const getAllSupportRequests = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const supportRequests = await Support.find()
      .populate('studentId', 'fullName email course batch')
      .populate('respondedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.json(supportRequests);
  } catch (error) {
    console.error('Error fetching support requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get support requests for a specific student
const getStudentSupportRequests = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const supportRequests = await Support.find({ studentId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(supportRequests);
  } catch (error) {
    console.error('Error fetching student support requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update support request status and add response (for admins)
const updateSupportRequest = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const updateData = {
      status,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    if (adminResponse) {
      updateData.adminResponse = adminResponse.trim();
    }

    const supportRequest = await Support.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('studentId', 'fullName email');

    if (!supportRequest) {
      return res.status(404).json({ message: 'Support request not found' });
    }

    // Create notification for the student about the update
    try {
      let notificationMessage = '';
      if (adminResponse && status) {
        notificationMessage = `Your support request "${supportRequest.subject}" has been ${status.replace('_', ' ')} with a response from admin.`;
      } else if (adminResponse) {
        notificationMessage = `Admin has responded to your support request: "${supportRequest.subject}".`;
      } else if (status) {
        notificationMessage = `Your support request "${supportRequest.subject}" status has been updated to: ${status.replace('_', ' ')}.`;
      }

      if (notificationMessage) {
        await Notification.create({
          user: supportRequest.studentId._id,
          type: 'support_request',
          supportRequest: supportRequest._id,
          message: notificationMessage,
        });
      }
    } catch (notifyErr) {
      console.error('Failed to create student notification for support request update:', notifyErr);
      // Don't fail the request if notification creation fails
    }

    res.json({
      message: 'Support request updated successfully',
      supportRequest
    });
  } catch (error) {
    console.error('Error updating support request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get support request statistics (for admins)
const getSupportStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const stats = await Support.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRequests = await Support.countDocuments();
    const openRequests = await Support.countDocuments({ status: 'open' });
    const highPriorityOpen = await Support.countDocuments({ status: 'open', priority: 'high' });

    res.json({
      totalRequests,
      openRequests,
      highPriorityOpen,
      statusBreakdown: stats
    });
  } catch (error) {
    console.error('Error fetching support stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createSupportRequest,
  getAllSupportRequests,
  getStudentSupportRequests,
  updateSupportRequest,
  getSupportStats
};