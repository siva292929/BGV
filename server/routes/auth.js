const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
let otpStore = {}; // Temporary in-memory OTP storage

// 1. SEND OTP
router.post('/send-otp', async (req, res) => {
  try {
    let { phoneNumber, userId } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });
    phoneNumber = phoneNumber.trim();

    // If logged in, we can link the phone number, otherwise it must exist
    const query = userId ? { _id: userId } : { phoneNumber };
    const user = await User.findOne(query);

    if (!user && !userId) return res.status(404).json({ error: "Mobile number not registered." });

    const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
    otpStore[phoneNumber] = otp;

    console.log(`[SIMULATION] OTP for ${phoneNumber}: ${otp}`);
    res.json({ message: "OTP sent successfully (Simulated)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. VERIFY OTP & LOGIN
router.post('/verify-otp', async (req, res) => {
  try {
    let { phoneNumber, otp, userId } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });
    phoneNumber = phoneNumber.trim();

    // 1. Check if user is ALREADY verified with this number (Bypass if OTP store is empty)
    if (userId) {
      const currentUser = await User.findById(userId);
      if (currentUser && currentUser.isPhoneVerified && currentUser.phoneNumber === phoneNumber) {
        return res.json({
          role: currentUser.role,
          userId: currentUser._id,
          name: currentUser.name,
          isPhoneVerified: true
        });
      }
    }

    if (otpStore[phoneNumber] == otp || otp === '1234') { // Allow 1234 for testing
      // Check if this phone number is already taken by ANOTHER user
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser && userId && existingUser._id.toString() !== userId) {
        return res.status(400).json({ error: "This phone number is already registered with another account." });
      }

      const query = userId ? { _id: userId } : { phoneNumber };
      const user = await User.findOneAndUpdate(
        query,
        { isPhoneVerified: true, phoneNumber },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });

      delete otpStore[phoneNumber];
      setTokenCookie(res, user);

      res.json({
        role: user.role,
        userId: user._id,
        name: user.name,
        isPhoneVerified: true
      });
    } else {
      res.status(400).json({ error: "Invalid OTP. Please check the code and try again." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to set cookie
const setTokenCookie = (res, user) => {
  const token = jwt.sign(
    { _id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
};

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: "Invalid password" });

    setTokenCookie(res, user);

    res.json({
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      userId: user._id,
      name: user.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: "Logged out" });
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
      isFirstLogin: false
    }, { new: true });

    if (!user) return res.status(404).json({ error: "User not found" });

    setTokenCookie(res, user);

    res.json({
      message: "Password updated successfully!",
      role: user.role,
      userId: user._id,
      name: user.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ME (Check Auth State)
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const verified = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(verified._id).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;