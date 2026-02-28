const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAdminRole() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Check the admin user
    const adminUser = await User.findOne({ email: 'suyamagunaratne@gmail.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found! Creating seed user...');
      await User.deleteMany({});
      
      const admin = new User({
        fullName: 'Super Admin',
        email: 'suyamagunaratne@gmail.com',
        password: 'password123',
        role: 'admin',
        adminId: 'ADM001',
        permissions: ['all']
      });
      
      await admin.save();
      console.log('✓ Admin user created with role:', admin.role);
    } else {
      console.log('✓ Admin user found:');
      console.log('  - Email:', adminUser.email);
      console.log('  - Role:', adminUser.role);
      console.log('  - ID:', adminUser._id);
      
      if (adminUser.role !== 'admin') {
        console.log('\n⚠️  Role is not "admin"! Updating...');
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✓ Role updated to "admin"');
      }
    }

    // Check all users
    const allUsers = await User.find({}, 'fullName email role');
    console.log('\n📋 All Users in Database:');
    allUsers.forEach(u => {
      console.log(`  - ${u.fullName} (${u.email}) - Role: ${u.role}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAdminRole();
