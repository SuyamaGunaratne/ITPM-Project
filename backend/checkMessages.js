const mongoose = require('mongoose');
const BoardingMessage = require('./models/BoardingMessage');
require('dotenv').config();

async function checkMessages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const messages = await BoardingMessage.find({})
      .populate('boardingId', 'businessName')
      .populate('ownerId', 'fullName email role')
      .populate('studentId', 'fullName email role');

    console.log(`Found ${messages.length} boarding messages:`);
    messages.forEach((msg, index) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log(`  ID: ${msg._id}`);
      console.log(`  Subject: ${msg.subject}`);
      console.log(`  Student: ${msg.studentName} (${msg.studentId?.role})`);
      console.log(`  Owner: ${msg.ownerId?.fullName} (${msg.ownerId?.role})`);
      console.log(`  Boarding: ${msg.boardingId?.businessName}`);
      console.log(`  Status: ${msg.status}`);
      console.log(`  Replies: ${msg.replies.length}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMessages();