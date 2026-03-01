const mongoose = require('mongoose');

const boardingOwnerRegistrationSchema = new mongoose.Schema({
  // Personal Details
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  idFrontImage: {
    type: String, // Base64 or file path
    required: true
  },
  idBackImage: {
    type: String, // Base64 or file path
    required: true
  },

  // Business Details
  businessName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },

  // Additional optional business details
  monthlyRent: Number,
  totalCapacity: Number,
  availableRooms: Number,
  amenities: [String],

  // Registration Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: String,

  // Admin Notes
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,

  // Associated User (created when approved)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('BoardingOwnerRegistration', boardingOwnerRegistrationSchema);
