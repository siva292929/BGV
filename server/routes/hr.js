const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// HR Creates a Candidate
router.post('/create-candidate', async (req, res) => {
  try {
    const { name, email } = req.body;
    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newCandidate = new User({
      name,
      email,
      password: hashedPassword,
      role: 'CANDIDATE',
      isFirstLogin: true,
      status: 'Pending' // Default BGV status
    });

    await newCandidate.save();

    // Email the candidate
    await transporter.sendMail({
      from: `" BGV" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Action Required: Background Verification Link",
      html: `<h3>Hello ${name},</h3>
             <p>Your background verification process has started.</p>
             <p>Login to upload your documents: <a href="http://localhost:5173">BGV Portal</a></p>
             <p>Temporary Password: <b>${tempPassword}</b></p>`
    });

    res.json({ message: "Candidate added and notified!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all candidates
router.get('/candidates', async (req, res) => {
  const candidates = await User.find({ role: 'CANDIDATE' });
  res.json(candidates);
});

module.exports = router;