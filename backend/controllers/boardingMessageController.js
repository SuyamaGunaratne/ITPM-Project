const BoardingMessage = require('../models/BoardingMessage');
const User = require('../models/User');
const Boarding = require('../models/Boarding');
const Notification = require('../models/Notification');

// Create a new boarding message (student sends to owner)
const createBoardingMessage = async (req, res) => {
  try {
    const { boardingId, subject, message } = req.body;
    const studentId = req.user._id;

    // Verify boarding exists and get owner
    const boarding = await Boarding.findById(boardingId);
    if (!boarding) {
      return res.status(404).json({ message: 'Boarding not found' });
    }

    const owner = await User.findById(boarding.owner);
    if (!owner) {
      return res.status(404).json({ message: 'Boarding owner not found' });
    }

    // Create message
    const boardingMessage = new BoardingMessage({
      boardingId,
      studentId,
      studentName: req.user.fullName || req.user.name,
      studentEmail: req.user.email,
      ownerId: boarding.owner,
      subject,
      initialMessage: message
    });

    await boardingMessage.save();

    // Send notification to owner
    const notification = new Notification({
      user: boarding.owner,
      type: 'boarding_inquiry',
      title: 'New Boarding Inquiry',
      message: `${req.user.fullName || req.user.name} has sent an inquiry about "${boarding.businessName}"`,
      data: { boardingId, messageId: boardingMessage._id },
      boardingMessage: boardingMessage._id
    });
    await notification.save();

    res.status(201).json({ message: 'Message sent successfully', messageId: boardingMessage._id });
  } catch (error) {
    console.error('Error creating boarding message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for boarding owner
const getOwnerMessages = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const messages = await BoardingMessage.find({ ownerId })
      .populate('boardingId', 'businessName')
      .sort({ lastActivity: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching owner messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for student
const getStudentMessages = async (req, res) => {
  try {
    const studentId = req.user._id;

    const messages = await BoardingMessage.find({ studentId })
      .populate('boardingId', 'businessName')
      .populate('ownerId', 'fullName email')
      .sort({ lastActivity: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching student messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reply to a message
const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;

    const boardingMessage = await BoardingMessage.findById(messageId);
    if (!boardingMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is authorized (owner or student)
    if (boardingMessage.ownerId.toString() !== senderId.toString() &&
        boardingMessage.studentId.toString() !== senderId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add reply
    const reply = {
      senderId,
      senderName: req.user.fullName || req.user.name,
      message,
      sentAt: new Date()
    };

    boardingMessage.replies.push(reply);
    boardingMessage.lastActivity = new Date();
    await boardingMessage.save();

    // Determine recipient for notification
    const recipientId = senderId.toString() === boardingMessage.ownerId.toString()
      ? boardingMessage.studentId
      : boardingMessage.ownerId;

    const boarding = await Boarding.findById(boardingMessage.boardingId);

    // Send notification to recipient
    const notification = new Notification({
      user: recipientId,
      type: 'boarding_reply',
      title: 'New Reply to Boarding Inquiry',
      message: `${req.user.fullName || req.user.name} replied to your inquiry about "${boarding.businessName}"`,
      data: { boardingId: boardingMessage.boardingId, messageId },
      boardingMessage: messageId
    });
    await notification.save();

    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update message status
const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    const boardingMessage = await BoardingMessage.findById(messageId);
    if (!boardingMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is authorized
    if (boardingMessage.ownerId.toString() !== req.user._id.toString() &&
        boardingMessage.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    boardingMessage.status = status;
    await boardingMessage.save();

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBoardingMessage,
  getOwnerMessages,
  getStudentMessages,
  replyToMessage,
  updateMessageStatus
};