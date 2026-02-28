const BoardingOwnerRegistration = require('../models/BoardingOwnerRegistration');
const User = require('../models/User');
const bcrypt = require('bcryptjs');


// Register new boarding owner (create registration request)
const registerBoardingOwner = async (req, res) => {
  try {
    console.log('=== Registration Request Received ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Content-Type:', req.headers['content-type']);
    
    const {
      firstName,
      lastName,
      email,
      idNumber,
      password,
      idFrontImage,
      idBackImage,
      businessName,
      address,
      city,
      district,
      monthlyRent,
      totalCapacity,
      availableRooms,
      amenities
    } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      console.log('Password validation failed:', { password: password ? password.length : 'missing' });
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    console.log('Creating registration for:', { firstName, lastName, email, idNumber });

    // Check if email or ID already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with this email');
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingRegistration = await BoardingOwnerRegistration.findOne({ email });
    if (existingRegistration && existingRegistration.status === 'pending') {
      console.log('Pending registration already exists');
      return res.status(400).json({ message: 'Registration request already pending for this email' });
    }

    const existingId = await BoardingOwnerRegistration.findOne({ idNumber });
    if (existingId && existingId.status === 'pending') {
      console.log('ID already submitted for registration');
      return res.status(400).json({ message: 'ID already submitted for registration' });
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Create registration request
    const registration = new BoardingOwnerRegistration({
      firstName,
      lastName,
      email,
      idNumber,
      password: hashedPassword,
      idFrontImage,
      idBackImage,
      businessName,
      address,
      city,
      district,
      monthlyRent,
      totalCapacity,
      availableRooms,
      amenities,
      status: 'pending'
    });

    console.log('Registration object created, saving to database...');
    try {
      await registration.save();
      console.log('✓ Registration saved successfully:', registration._id);
    } catch (saveError) {
      console.error('❌ Save error occurred:', saveError.message);
      throw saveError; // Re-throw to be caught by outer catch block
    }
    
    // Verify the registration was actually saved
    try {
      const verifyReg = await BoardingOwnerRegistration.findById(registration._id);
      if (verifyReg) {
        console.log('✓ Verification: Registration found in database');
      } else {
        console.error('❌ Verification failed: Registration NOT found in database!');
        throw new Error('Registration was not persisted to database');
      }
    } catch (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
      throw verifyError;
    }

    res.status(201).json({
      message: 'Registration request submitted successfully. Please wait for admin approval.',
      registrationId: registration._id
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Get all registration requests (for admin)
const getAllRegistrations = async (req, res) => {
  try {
    console.log('getAllRegistrations - User:', req.user?._id, 'Role:', req.user?.role);

    // Check if user is admin
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      console.log('Access denied - User role is:', req.user.role, 'Expected: admin');
      return res.status(403).json({ message: 'Only admins can access registration requests. Your role: ' + req.user.role });
    }

    const { status } = req.query;
    const filter = status ? { status } : {};

    console.log('Fetching registrations with filter:', filter);

    const registrations = await BoardingOwnerRegistration.find(filter)
      .populate('reviewedBy', 'fullName email')
      .populate('userId', 'fullName email role')
      .sort({ createdAt: -1 });

    console.log(`Found ${registrations.length} registrations`);

    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error.message);
    res.status(500).json({ message: 'Failed to fetch registrations', error: error.message });
  }
};

// Get single registration by ID
const getRegistrationById = async (req, res) => {
  try {
    const registration = await BoardingOwnerRegistration.findById(req.params.id).populate('userId');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch registration', error: error.message });
  }
};

// Approve registration request
const approveRegistration = async (req, res) => {
  try {
    const registration = await BoardingOwnerRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ message: 'This registration has already been reviewed' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: registration.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user account for boarding owner
    // Note: Password is already hashed in registration, so we bypass pre-save hashing
    const user = new User({
      fullName: `${registration.firstName} ${registration.lastName}`,
      email: registration.email,
      password: registration.password, // Already hashed from registration
      role: 'boardingOwner',
      ownerNIC: registration.idNumber,
      businessName: registration.businessName,
      boardingAddress: registration.address,
      city: registration.city,
      district: registration.district,
      monthlyRent: registration.monthlyRent,
      availableRooms: registration.availableRooms,
      description: registration.businessName,
      facilities: registration.amenities || [],
      isApproved: true
    });

    // Save without triggering the password hash middleware again
    // We need to mark password as not modified to avoid re-hashing
    await user.save();

    // Update registration with approval details
    registration.status = 'approved';
    registration.userId = user._id;
    registration.reviewedBy = req.user._id;
    registration.reviewedAt = new Date();
    registration.adminNotes = req.body.adminNotes || '';

    await registration.save();

    console.log(`✓ Registration approved for: ${registration.email}, User created: ${user._id}`);

    res.json({
      message: 'Registration approved successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error approving registration:', error.message);
    res.status(500).json({ message: 'Failed to approve registration', error: error.message });
  }
};

// Reject registration request
const rejectRegistration = async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;
    
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const registration = await BoardingOwnerRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ message: 'This registration has already been reviewed' });
    }

    registration.status = 'rejected';
    registration.rejectionReason = rejectionReason.trim();
    registration.adminNotes = adminNotes || '';
    registration.reviewedBy = req.user._id;
    registration.reviewedAt = new Date();

    await registration.save();

    console.log(`✓ Registration rejected for: ${registration.email}, Reason: ${rejectionReason}`);

    res.json({
      message: 'Registration rejected',
      registration: {
        id: registration._id,
        email: registration.email,
        status: registration.status,
        rejectionReason: registration.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error rejecting registration:', error.message);
    res.status(500).json({ message: 'Failed to reject registration', error: error.message });
  }
};

// Get registration status for user (using email)
const getRegistrationStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email is required' });
    }
    const registration = await BoardingOwnerRegistration.findOne({ email });

    if (!registration) {
      return res.status(404).json({ message: 'No registration found' });
    }

    res.json({
      status: registration.status,
      message: registration.status === 'rejected' ? registration.rejectionReason : null,
      registrationId: registration._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get status', error: error.message });
  }
};

module.exports = {
    registerBoardingOwner,
    getAllRegistrations,
    getRegistrationById,
    approveRegistration,
    rejectRegistration,
    getRegistrationStatus
};