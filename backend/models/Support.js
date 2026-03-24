const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: ['technical', 'account', 'course', 'boarding', 'community', 'other'],
      default: 'technical'
    },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    adminResponse: { type: String },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Support', supportSchema);