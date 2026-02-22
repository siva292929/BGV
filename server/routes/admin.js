const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

router.post('/create-hr', async (req, res) => {
  try {
    const { name, email, empid, role } = req.body; // Added role here

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'HR', // Dynamic role
      empid,
      isFirstLogin: true 
    });

    await newUser.save();

    try {
      await transporter.sendMail({
        from: `"DarwinTrace Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your ${role} Account Credentials`,
        html: `<h3>Welcome ${name}</h3><p>Role: ${role}</p><p>Temp Pass: <b>${tempPassword}</b></p>`
      });
    } catch (mailErr) {
      console.error("Mail failed, but account created");
    }

    res.json({ message: "Account Created Successfully!", tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetches all staff (HR + AGENTS) for the dashboard
router.get('/hrs', async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['HR', 'AGENT'] } }).select('-password').sort({ role: 1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/hr/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

module.exports = router;