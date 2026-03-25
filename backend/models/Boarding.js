const mongoose = require('mongoose');

const boardingSchema = new mongoose.Schema({
  // Owner reference
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Business Details
  businessName: {
    type: String,
    required: true
  },
  ownerNIC: {
    type: String,
    required: true
  },
  boardingAddress: {
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

  // Boarding Details
  monthlyRent: {
    type: Number,
    required: true
  },
  availableRooms: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  facilities: [String],

  // Images stored as base64
  images: [{
    data: Buffer,
    filename: String,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: function() { return true; } // Auto-approved for now
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Boarding', boardingSchema);
