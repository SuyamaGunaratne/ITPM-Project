const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
};

// Send notification to all students when a new boarding is posted
const sendBoardingNotification = async (boardingId, boardingName, boardingOwnerName) => {
  try {
    const User = require('../models/User');
    
    // Get all students
    const students = await User.find({ role: 'student' });
    
    if (students.length === 0) {
      console.log('[sendBoardingNotification] No students found');
      return;
    }

    // Create notification for each student
    const notifications = students.map((student) => ({
      user: student._id,
      type: 'new_boarding',
      boarding: boardingId,
      message: `New boarding "${boardingName}" has been posted by ${boardingOwnerName}. Check it out in the Boardings section!`,
      read: false,
    }));

    await Notification.insertMany(notifications);
    console.log(`[sendBoardingNotification] Sent notifications to ${students.length} students`);
  } catch (error) {
    console.error('[sendBoardingNotification] Error sending notifications:', error);
    // Don't throw - notifications failing shouldn't break boarding creation
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  sendBoardingNotification,
};