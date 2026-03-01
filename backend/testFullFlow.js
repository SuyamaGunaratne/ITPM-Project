const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const BoardingOwnerRegistration = require('./models/BoardingOwnerRegistration');
const jwt = require('jsonwebtoken');

async function testFullFlow() {
  try {
    console.log('===== TESTING FULL BOARDING REGISTRATION FLOW =====\n');
    
    // 1. Connect to MongoDB
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // 2. Check/Seed Admin User
    console.log('2. Checking Admin User...');
    let adminUser = await User.findOne({ email: 'suyamagunaratne@gmail.com' });
    if (!adminUser) {
      console.log('   Admin not found, creating one...');
      adminUser = await User.create({
        fullName: "Super Admin",
        email: "suyamagunaratne@gmail.com",
        password: "password123",
        role: "admin",
        adminId: "ADM001"
      });
      console.log('✓ Admin user created');
    } else {
      console.log(`✓ Admin user exists: ${adminUser.fullName}`);
    }

    // 3. Generate admin token
    console.log('\n3. Generating Admin JWT Token...');
    const adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log(`✓ Token generated (first 50 chars): ${adminToken.substring(0, 50)}...`);

    // 4. Create test registration
    console.log('\n4. Creating Test Boarding Owner Registration...');
    const testRegistration = new BoardingOwnerRegistration({
      firstName: 'John',
      lastName: 'Doe',
      email: `testboarding-${Date.now()}@example.com`,
      idNumber: `NIC-${Date.now()}`,
      password: await bcrypt.hash('password123', 12),
      idFrontImage: 'data:image/jpeg;base64,test',
      idBackImage: 'data:image/jpeg;base64,test',
      businessName: 'Premium Boarding House',
      address: '123 Main Street',
      city: 'Colombo',
      district: 'Western',
      monthlyRent: 8000,
      totalCapacity: 25,
      availableRooms: 8,
      amenities: ['WiFi', 'Water', 'Security'],
      status: 'pending'
    });

    await testRegistration.save();
    console.log(`✓ Registration saved with ID: ${testRegistration._id}`);

    // 5. Query all registrations (simulating what admin endpoint does)
    console.log('\n5. Querying All Pending Registrations...');
    const registrations = await BoardingOwnerRegistration.find({ status: 'pending' })
      .populate('reviewedBy', 'fullName email')
      .populate('userId', 'fullName email role')
      .sort({ createdAt: -1 });

    console.log(`✓ Found ${registrations.length} pending registrations`);
    registrations.forEach((reg, index) => {
      console.log(`\n   Registration ${index + 1}:`);
      console.log(`   - ID: ${reg._id}`);
      console.log(`   - Name: ${reg.firstName} ${reg.lastName}`);
      console.log(`   - Email: ${reg.email}`);
      console.log(`   - Business: ${reg.businessName}`);
      console.log(`   - Status: ${reg.status}`);
    });

    // 6. Verify admin can access
    console.log('\n6. Simulating Admin API Access...');
    console.log(`   Admin Role Check: ${adminUser.role === 'admin' ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`   Admin ID: ${adminUser._id}`);
    console.log(`   Can Access: ${adminUser.role === 'admin' && adminToken ? '✓ YES' : '✗ NO'}`);

    // 7. Summary
    console.log('\n===== TEST SUMMARY =====');
    console.log(`Total Registrations in DB: ${await BoardingOwnerRegistration.countDocuments()}`);
    console.log(`Pending Registrations: ${await BoardingOwnerRegistration.countDocuments({ status: 'pending' })}`);
    console.log(`Admin User Exists: ${adminUser ? '✓ YES' : '✗ NO'}`);
    console.log(`Admin Role: ${adminUser?.role}`);
    console.log('\n✓ FULL FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('\nTo test the API:');
    console.log(`1. Login with: suyamagunaratne@gmail.com / password123`);
    console.log(`2. Use the returned token for API calls`);
    console.log(`3. Fetch registrations from: GET /api/registration/admin/all`);

    process.exit(0);
  } catch (error) {
    console.error('✗ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testFullFlow();
