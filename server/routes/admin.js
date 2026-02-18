const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

//Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

//CREATE HR ACCOUNT
router.post('/create-hr', async (req, res) => {
  try {
    const { name, email, empid } = req.body;

    //if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    //random password
    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    //new HR user
    const newHR = new User({
      name,
      email,
      password: hashedPassword,
      role: 'HR',
      empid,
      isFirstLogin: true //password reset
    });

    // Save to MongoDB
    await newHR.save();

    //Email Notification
    const mailOptions = {
      from: `"BGV Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your HR Access Credentials - BGV",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #2563eb;">Welcome to BGV, ${name}</h2>
          <p>Your HR administrator account has been created successfully. Please use the following details to log in for the first time:</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="http://localhost:5173">BGV</a></p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <span style="color: #dc2626; font-family: monospace; font-size: 1.2em;">${tempPassword}</span></p>
          </div>
          <p style="color: #6b7280; font-size: 0.9em;">Important: You will be prompted to change this temporary password immediately after your first login.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email successfully sent to: ${email}`);
    } catch (mailErr) {
      console.error("❌ Mail Delivery Failed:", mailErr.message);
    }


    res.json({ 
      message: "HR Account created successfully and email dispatched.", 
      tempPassword //password on screen
    });

  } catch (err) {
    console.error("Server Error in create-hr:", err.message);
    res.status(500).json({ error: "Server error during account creation. Please check logs." });
  }
});

//HRs on the Admin Dashboard
router.get('/hrs', async (req, res) => {
  try {
    const hrs = await User.find({ role: 'HR' }).select('-password').sort({ createdAt: -1 });
    res.json(hrs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch HR list." });
  }
});

//DELETE HR ACCOUNT
router.delete('/hr/:id', async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "HR account not found." });
    res.json({ message: "HR account deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete account." });
  }
});

//Verify Transporter Connection on Startup
transporter.verify((error, success) => {
  if (error) {
    console.log("⚠️ Nodemailer Warning: Mail server not ready (Check .env credentials)");
  } else {
    console.log("📧 Nodemailer Success: Ready to send HR credentials");
  }
});

module.exports = router;