const mongoose = require('mongoose');
require('dotenv').config();

async function testRegistration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const BoardingOwnerRegistration = require('./models/BoardingOwnerRegistration');
    
    // Check existing registrations
    const countBefore = await BoardingOwnerRegistration.countDocuments();
    console.log('Registrations before test:', countBefore);

    // Create a test registration
    const testReg = new BoardingOwnerRegistration({
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      idNumber: `ID-${Date.now()}`,
      password: 'hashedPassword123',
      idFrontImage: 'data:image/jpeg;base64,test',
      idBackImage: 'data:image/jpeg;base64,test',
      businessName: 'Test Boarding House',
      address: '123 Test Street',
      city: 'Test City',
      district: 'Test District',
      monthlyRent: 5000,
      totalCapacity: 20,
      availableRooms: 5,
      amenities: ['WiFi', 'Water']
    });

    console.log('Saving test registration...');
    await testReg.save();
    console.log('✓ Registration saved with ID:', testReg._id);

    // Verify it was saved
    const found = await BoardingOwnerRegistration.findById(testReg._id);
    if (found) {
      console.log('✓ Verification successful: Registration found in database');
      console.log('  Name:', found.firstName, found.lastName);
      console.log('  Email:', found.email);
      console.log('  Status:', found.status);
    } else {
      console.error('❌ Verification failed: Registration NOT found in database');
    }

    // Check total count
    const countAfter = await BoardingOwnerRegistration.countDocuments();
    console.log('Registrations after test:', countAfter);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRegistration();
