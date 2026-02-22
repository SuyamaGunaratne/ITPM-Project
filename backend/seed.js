const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Don't pre-hash - let the User model's pre-save hook do it
    await User.create([
      {
        fullName: "Super Admin",
        email: "suyamagunaratne@gmail.com",
        password: "password123",
        role: "admin",
        adminId: "ADM001"
      },
      {
        fullName: "Dr. Kasun Perera",
        email: "teacher@edu.lk",
        password: "password123",
        role: "teacher",
        teacherId: "TCH001",
        department: "Computer Science",
        qualifications: "PhD in AI",
        subjects: ["Programming", "Database"]
      },
      {
        fullName: "Suyama Senura",
        email: "student@edu.lk",
        password: "password123",
        role: "student",
        studentId: "STU001",
        course: "BSc Computer Science",
        batch: "2023",
        year: 2
      }
    ]);

    console.log('✅ Sample Admin, Teacher & Student added successfully!');
    console.log('Emails: suyamagunaratne@gmail.com | teacher@edu.lk | student@edu.lk');
    console.log('Password for all: password123');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedUsers();