const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'boardingOwner'],
    required: true
  },

  // Student fields
  studentId: { 
    type: String, 
    required: function() { return this.role === 'student'; } 
  },
  course: { 
    type: String, 
    required: function() { return this.role === 'student'; } 
  },
  batch: String,
  year: Number,
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

  // Teacher fields
  teacherId: { 
    type: String, 
    required: function() { return this.role === 'teacher'; } 
  },
  department: String,
  qualifications: String,
  subjects: [String],
  assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

  // Admin fields
  adminId: { 
    type: String, 
    required: function() { return this.role === 'admin'; } 
  },
  permissions: { type: [String], default: ['all'] },

  // Profile image fields
  profileImageData: Buffer,
  profileImageContentType: String,

  // Boarding Owner fields (exactly as you gave)
  businessName: { 
    type: String, 
    required: function() { return this.role === 'boardingOwner'; } 
  },
  ownerNIC: { 
    type: String, 
    required: function() { return this.role === 'boardingOwner'; } 
  },
  boardingAddress: String,
  city: String,
  district: String,
  monthlyRent: Number,
  availableRooms: Number,
  description: String,
  facilities: [String],
  images: [String],
  isApproved: {
    type: Boolean,
    default: function() { return this.role !== 'boardingOwner'; }
  },
  rating: { type: Number, default: 0, min: 0, max: 5 }

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    
    // Check if password is already bcrypt hashed (starts with $2a$, $2b$, or $2y$)
    if (this.password && typeof this.password === 'string' && this.password.match(/^\$2[aby]\$/)) {
      console.log('[User.pre.save] Password already hashed, skipping hash');
      return next();
    }
    
    console.log('[User.pre.save] Hashing password');
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    console.error('[User.pre.save] Error:', err.message);
    next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);