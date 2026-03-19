const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const studentPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    image: {
      data: Buffer,
      contentType: String,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reviewReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentPost', studentPostSchema);
