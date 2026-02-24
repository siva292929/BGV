const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const MasterRecord = require('./models/MasterRecord');
require('dotenv').config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data for a clean test
    await User.deleteMany({});
    await MasterRecord.deleteMany({});

    const password = await bcrypt.hash('darwin123', 10);

    // 1. Create Users for each role
    const users = [
      { name: 'Admin User', email: 'admin@darwin.com', password, role: 'ADMIN' },
      { name: 'HR Manager', email: 'hr@darwin.com', password, role: 'HR' },
      { name: 'Agent Smith', email: 'agent@darwin.com', password, role: 'AGENT', taskCount: 0 },
      {
        name: 'Candidate John',
        email: 'candidate@darwin.com',
        password,
        role: 'CANDIDATE',
        phoneNumber: '9876543210' // Matching MasterRecord
      }
    ];

    await User.insertMany(users);
    console.log("Users seeded successfully.");

    // 2. Create Master Records for Autofetch testing
    const masterRecords = [
      {
        fullName: 'John Doe',
        email: 'candidate@darwin.com',
        phoneNumber: '9876543210',
        aadharNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        tenthPercentage: '92',
        twelfthPercentage: '88',
        degreeGPA: '8.5',
        experience: 'Software Engineer at TechCorp',
        payslip: 'Verified'
      }
    ];

    await MasterRecord.insertMany(masterRecords);
    console.log("Master Records seeded successfully.");

    console.log("Seeding complete. Use 'darwin123' for all accounts.");
    process.exit();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seed();