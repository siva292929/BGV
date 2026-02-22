const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

router.post('/create-candidate', async (req, res) => {
  try {
    const { name, email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    // 1. AUTOMATED ASSIGNMENT: Find Agent with least tasks
    const bestAgent = await User.findOne({ role: 'AGENT' }).sort({ taskCount: 1 });

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newCandidate = new User({
      name,
      email,
      password: hashedPassword,
      role: 'CANDIDATE',
      assignedAgent: bestAgent ? bestAgent._id : null,
      isFirstLogin: true
    });

    await newCandidate.save();

    // 2. Update Agent's workload
    if (bestAgent) {
      bestAgent.taskCount += 1;
      await bestAgent.save();
    }

    // 3. Notify Candidate
    try {
      await transporter.sendMail({
        from: `"DarwinTrace BGV" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "BGV Initiation - Login Credentials",
        html: `<h3>Welcome ${name}</h3><p>Temp Pass: <b>${tempPassword}</b></p>`
      });
    } catch (mailErr) {
      console.error("Mail failed, but candidate created");
    }

    res.json({ message: "Candidate created and assigned to Agent", tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/candidates', async (req, res) => {
  try {
    const candidates = await User.find({ role: 'CANDIDATE' }).populate('assignedAgent', 'name');
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;