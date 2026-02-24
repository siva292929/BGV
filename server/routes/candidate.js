const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const MasterRecord = require('../models/MasterRecord');
const BGVRequest = require('../models/BGVRequest');
const CandidateSubmission = require('../models/CandidateSubmission');

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
    const user = await User.findById(req.params.userId).populate('assignedAgent', 'name');
    res.json({
      status: user.status,
      isPhoneVerified: user.isPhoneVerified,
      phoneNumber: user.phoneNumber,
      assignedAgent: user.assignedAgent ? user.assignedAgent.name : null
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch status" });
  }
});

// 1. AUTO-FETCH FROM MASTER RECORDS
router.get('/auto-fetch/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const record = await MasterRecord.findOne({ phoneNumber: phoneNumber.trim() });

    if (!record) {
      return res.status(404).json({ message: "No pre-existing records found for this mobile number." });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. MULTI-CATEGORY MANUAL UPLOAD & AUTO-ASSIGNMENT
router.post('/upload-docs', upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'degree', maxCount: 1 },
  { name: 'twelfth', maxCount: 1 },
  { name: 'tenth', maxCount: 1 },
  { name: 'experience', maxCount: 1 },
  { name: 'payslip', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId, isFresher, ...extraDetails } = req.body;
    const files = req.files;

    if (!userId) return res.status(400).json({ error: "User ID missing" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const docPaths = {};
    Object.keys(files).forEach(key => {
      docPaths[key] = `uploads/${files[key][0].filename}`; // Store relative path
    });

    // --- AUTO-ASSIGNMENT LOGIC: Least taskCount ---
    const bestAgent = await User.findOne({ role: 'AGENT' }).sort({ taskCount: 1 });

    // --- AUTO-VERIFICATION LOGIC ---
    // Fetch MasterRecord if phone exists
    const trimmedPhone = user.phoneNumber ? user.phoneNumber.trim() : null;
    const masterRecord = trimmedPhone ? await MasterRecord.findOne({ phoneNumber: trimmedPhone }) : null;

    const reviews = {
      aadhar: { status: 'Pending' },
      pan: { status: 'Pending' },
      degree: { status: 'Pending' },
      twelfth: { status: 'Pending' },
      tenth: { status: 'Pending' },
      experience: { status: 'Pending' },
      payslip: { status: 'Pending' },
      signature: { status: 'Pending' }
    };

    // Auto-verify if data exists in MasterRecord
    if (masterRecord) {
      if (masterRecord.aadharNumber) reviews.aadhar = { status: 'Verified', comment: 'Auto-verified from Master Database' };
      if (masterRecord.panNumber) reviews.pan = { status: 'Verified', comment: 'Auto-verified from Master Database' };
      if (masterRecord.tenthPercentage) reviews.tenth = { status: 'Verified', comment: 'Auto-verified from Master Database' };
      if (masterRecord.twelfthPercentage) reviews.twelfth = { status: 'Verified', comment: 'Auto-verified from Master Database' };
      if (masterRecord.degreeGPA) reviews.degree = { status: 'Verified', comment: 'Auto-verified from Master Database' };
      if (masterRecord.experience) reviews.experience = { status: 'Verified', comment: 'Auto-verified from Master Database' };
      if (masterRecord.payslip) reviews.payslip = { status: 'Verified', comment: 'Auto-verified from Master Database' };
    }

    // 1. Create/Update BGVRequest Record
    const newBGVRequest = new BGVRequest({
      candidate: userId,
      agent: bestAgent ? bestAgent._id : null,
      status: 'Under Review',
      reviews: reviews
    });
    await newBGVRequest.save();

    // 2. Create/Update CandidateSubmission (Indexed by Email)
    const submissionData = {
      email: user.email,
      fullName: user.name,
      phoneNumber: user.phoneNumber,
      autofetchedDetails: masterRecord ? {
        aadharNumber: masterRecord.aadharNumber,
        panNumber: masterRecord.panNumber,
        tenthPercentage: masterRecord.tenthPercentage,
        twelfthPercentage: masterRecord.twelfthPercentage,
        degreeGPA: masterRecord.degreeGPA,
        experience: masterRecord.experience,
        payslip: masterRecord.payslip
      } : {},
      submittedDetails: {
        isFresher: isFresher === 'true',
        ...extraDetails
      },
      documents: docPaths,
      status: 'Under Review',
      assignedAgent: bestAgent ? bestAgent._id : null,
      bgvRequest: newBGVRequest._id
    };

    await CandidateSubmission.findOneAndUpdate(
      { email: user.email },
      submissionData,
      { upsert: true, new: true }
    );

    const updateData = {
      documents: docPaths,
      status: 'Under Review',
      bgvRequest: newBGVRequest._id
    };

    if (bestAgent) {
      updateData.assignedAgent = bestAgent._id;
      await User.findByIdAndUpdate(bestAgent._id, { $inc: { taskCount: 1 } });
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.json({
      success: true,
      message: bestAgent ? `Documents uploaded and assigned to Agent ${bestAgent.name}` : "Documents uploaded successfully",
      assignedAgent: bestAgent ? bestAgent.name : null,
      requestId: newBGVRequest._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. AGENT DETAILED REVIEW UPDATE
router.post('/update-review', async (req, res) => {
  try {
    const { candidateId, requestId, documentType, status, comment } = req.body;

    const request = await BGVRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.reviews[documentType]) {
      request.reviews[documentType] = { status, comment };
    } else {
      return res.status(400).json({ error: "Invalid document type" });
    }

    // Check if all documents are verified or if any is rejected
    const reviewStates = Object.values(request.reviews).map(r => r.status);
    if (reviewStates.includes('Rejected')) {
      request.status = 'Rejected';
    } else if (reviewStates.every(s => s === 'Verified')) {
      request.status = 'Verified';
    } else {
      request.status = 'Under Review';
    }

    await request.save();

    // Sync status back to User model
    await User.findByIdAndUpdate(candidateId, { status: request.status });

    res.json({ success: true, message: "Review updated", status: request.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. AGENT FINAL STATUS UPDATE (Legacy support/Override)
router.patch('/update-status', async (req, res) => {
  const { candidateId, status } = req.body;
  if (!['Verified', 'Rejected', 'Under Review'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    await User.findByIdAndUpdate(candidateId, { status });
    // Also sync BGVRequest if it exists
    const user = await User.findById(candidateId);
    if (user.bgvRequest) {
      await BGVRequest.findByIdAndUpdate(user.bgvRequest, { status });
    }
    res.json({ success: true, message: `Candidate ${status} successfully` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;