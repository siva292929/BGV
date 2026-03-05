const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

router.post('/create-hr', async (req, res) => {
  try {
    const { name, email, empid, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'HR',
      empid,
      isFirstLogin: true
    });

    await newUser.save();

    await emailService.sendCredentialsEmail(name, email, role || 'HR', tempPassword);

    res.json({ message: "Account Created Successfully!", tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetches all staff (HR + AGENTS) for the dashboard
router.get('/hrs', async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['HR', 'AGENT'] } }).select('-password').sort({ role: 1 }).lean();
    const cleaned = staff.map(u => { delete u._id; delete u.__v; return u; });
    res.json(cleaned);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/hr/:uid', async (req, res) => {
  await User.findOneAndDelete({ uid: req.params.uid });
  res.json({ message: "Deleted" });
});

module.exports = router;