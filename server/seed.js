const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const MasterRecord = require('./models/MasterRecord');
const BGVRequest = require('./models/BGVRequest');
const CandidateSubmission = require('./models/CandidateSubmission');
const ChatMessage = require('./models/ChatMessage');
require('dotenv').config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear ALL collections for a clean slate
    await User.deleteMany({});
    await MasterRecord.deleteMany({});
    await BGVRequest.deleteMany({});
    await CandidateSubmission.deleteMany({});
    await ChatMessage.deleteMany({});
    console.log("All collections cleared.");

    // Drop stale indexes
    const db = mongoose.connection.db;
    const collections = ['users', 'masterrecords', 'bgvrequests', 'candidatesubmissions', 'chatmessages'];
    for (const col of collections) {
      try { await db.collection(col).dropIndexes(); } catch (e) { }
    }
    console.log("Stale indexes dropped.");

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
        phoneNumber: '9876543210'
      }
    ];

    await User.insertMany(users);
    console.log("Users seeded successfully.");

    // 2. Master Records — NO fullName, each with intentionally MISSING fields
    const masterRecords = [
      {
        // Record 1: Full identity, partial academics, NO experience
        phoneNumber: '9876543210',
        aadharNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1998-05-15',
        tenthPercentage: '92',
        twelfthPercentage: '88',
        degreeGPA: '8.5',
      },
      {
        // Record 2: Has experience, but NO Aadhaar, NO degree
        phoneNumber: '9876543211',
        panNumber: 'FGHIJ5678K',
        dob: '1995-11-22',
        tenthPercentage: '85',
        twelfthPercentage: '79',
        previousCompany: 'Infosys Ltd',
        previousDesignation: 'Software Engineer',
        previousDuration: '2 years',
        ctc: '6.5 LPA',
      },
      {
        // Record 3: Has Aadhaar & experience, but NO PAN, NO 12th
        phoneNumber: '9876543212',
        aadharNumber: '987654321098',
        dob: '1997-03-10',
        tenthPercentage: '78',
        degreeGPA: '7.2',
        previousCompany: 'TCS',
        previousDesignation: 'Systems Engineer',
        previousDuration: '3 years',
        ctc: '8 LPA',
      },
      {
        // Record 4: Fresher — has identity and academics, NO experience
        phoneNumber: '9876543213',
        aadharNumber: '456789012345',
        panNumber: 'KLMNO9012P',
        dob: '2000-08-05',
        tenthPercentage: '95',
        twelfthPercentage: '91',
        degreeGPA: '9.1',
      },
      {
        // Record 5: Experienced, but NO academics at all
        phoneNumber: '9876543214',
        aadharNumber: '654321098765',
        panNumber: 'QRSTU3456V',
        dob: '1992-01-18',
        previousCompany: 'Wipro Technologies',
        previousDesignation: 'Project Lead',
        previousDuration: '5 years',
        ctc: '14 LPA',
      },
      {
        // Record 6: Minimal — only phone + Aadhaar
        phoneNumber: '9876543215',
        aadharNumber: '111222333444',
        dob: '1999-12-25',
      }
    ];

    await MasterRecord.insertMany(masterRecords);
    console.log(`${masterRecords.length} Master Records seeded successfully.`);

    console.log("\n=== SEED COMPLETE ===");
    console.log("Password for all accounts: darwin123");
    console.log("Master records have intentionally missing fields for testing.\n");
    process.exit();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seed();