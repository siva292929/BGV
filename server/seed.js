require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function runSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    const hashedPassword = await bcrypt.hash("superadmin123", 10);

    const admin = new User({ 
      name: "System Admin",
      email: "admin@admin.com",
      password: hashedPassword,
      role: "ADMIN",
      empid: "ADM-01"
    });

    await admin.save();
    console.log("✅ Admin Created Successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

runSeed();