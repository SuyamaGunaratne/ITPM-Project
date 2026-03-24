const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['admin_request', 'post_approved', 'post_rejected', 'boarding_registration_request', 'support_request'], 
      required: true 
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentPost' },
    postRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PostRequest' },
    boardingRegistration: { type: mongoose.Schema.Types.ObjectId, ref: 'BoardingOwnerRegistration' },
    supportRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'Support' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
