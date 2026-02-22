const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const MasterRecord = require('../models/MasterRecord');

// Ensure the upload directory exists physically on the server
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit per file
});

let otpStore = {}; 

// --- FETCH CURRENT STATUS FOR PERSISTENCE ---
router.get('/status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json({ 
      status: user.status, 
      isPhoneVerified: user.isPhoneVerified,
      phoneNumber: user.phoneNumber 
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch status" });
  }
});

// 1. SEND OTP
router.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });
  
  // FIX: Convert to String immediately to prevent type mismatch during verification
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const cleanPhone = phoneNumber.trim();
  
  otpStore[cleanPhone] = otp;
  
  console.log(`\n------------------------------`);
  console.log(`[VERIFICATION CODE]: ${otp} for ${cleanPhone}`);
  console.log(`------------------------------\n`);
  
  res.json({ message: "OTP sent successfully" });
});

// 2. VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { phoneNumber, otp, userId } = req.body;
  if (!phoneNumber || !otp || !userId) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const cleanPhone = phoneNumber.trim();
  const cleanOtp = otp.toString().trim();

  // FIX: The comparison now works because both are Strings
  if (otpStore[cleanPhone] !== cleanOtp) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  try {
    const record = await MasterRecord.findOne({ phoneNumber: cleanPhone });
    const updateData = { phoneNumber: cleanPhone, isPhoneVerified: true };
    if (record) {
        updateData.status = 'Auto-Verified'; 
    }
    await User.findByIdAndUpdate(userId, updateData);
    
    // Clear OTP after successful verification
    delete otpStore[cleanPhone];

    res.json({ success: true, autoFetchedData: record || null });
  } catch (err) {
    res.status(500).json({ error: "Internal Database Error" });
  }
});

// 3. MULTI-CATEGORY MANUAL UPLOAD & ASSIGNMENT FIX
router.post('/upload-docs', upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'degree', maxCount: 1 },
  { name: 'twelfth', maxCount: 1 },
  { name: 'tenth', maxCount: 1 },
  { name: 'experience', maxCount: 1 },
  { name: 'payslip', maxCount: 1 },
  { name: 'address', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId } = req.body;
    const files = req.files;

    if (!userId) return res.status(400).json({ error: "User ID missing" });

    const docPaths = {};
    Object.keys(files).forEach(key => {
        docPaths[key] = files[key][0].path;
    });

    // --- FIX: AGENT ASSIGNMENT LOGIC ---
    let availableAgent = await User.findOne({ 
      role: { $regex: /^agent$/i } 
    });

    if (!availableAgent) {
      availableAgent = await User.findOne({ role: { $nin: ['candidate', 'admin'] } });
    }

    console.log("Found Agent for assignment:", availableAgent ? availableAgent.name : "NONE FOUND");

    await User.findByIdAndUpdate(userId, {
        documents: docPaths,
        status: 'Under Review',
        assignedAgent: availableAgent ? availableAgent._id : null
    });

    res.json({ success: true, message: `Documents uploaded and assigned to ${availableAgent ? availableAgent.name : 'System'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. AGENT STATUS UPDATE
router.patch('/update-status', async (req, res) => {
  const { candidateId, status } = req.body;
  if (!['Verified', 'Rejected', 'Under Review'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    await User.findByIdAndUpdate(candidateId, { status });
    res.json({ success: true, message: `Candidate ${status} successfully` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;