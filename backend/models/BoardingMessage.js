const mongoose = require('mongoose');

const boardingMessageSchema = new mongoose.Schema(
  {
    boardingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boarding', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    initialMessage: { type: String, required: true },
    replies: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        senderName: { type: String, required: true },
        message: { type: String, required: true },
        sentAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['open', 'resolved', 'closed'],
      default: 'open'
    },
    lastActivity: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BoardingMessage', boardingMessageSchema);