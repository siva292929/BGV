const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const MasterRecord = require('../models/MasterRecord');
const BGVRequest = require('../models/BGVRequest');
const CandidateSubmission = require('../models/CandidateSubmission');
const emailService = require('../services/emailService');

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
    const user = await User.findById(req.params.userId)
      .populate('assignedAgent', 'name')
      .populate('bgvRequest');

    res.json({
      status: user.status,
      isPhoneVerified: user.isPhoneVerified,
      phoneNumber: user.phoneNumber,
      assignedAgent: user.assignedAgent ? user.assignedAgent.name : null,
      bgvRequest: user.bgvRequest
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch status" });
  }
});

// --- GET DETAILED VERIFICATION STATUS WITH REVIEW DETAILS ---
router.get('/verification-status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('assignedAgent', 'name email')
      .populate('bgvRequest');

    if (!user) return res.status(404).json({ error: "User not found" });

    const bgvRequest = user.bgvRequest;
    if (!bgvRequest) return res.status(404).json({ error: "No BGV request found" });

    // Calculate verification progress
    const reviewStates = Object.values(bgvRequest.reviews).map(r => r.status);
    const totalDocs = reviewStates.length;
    const verifiedDocs = reviewStates.filter(s => s === 'Verified').length;
    const rejectedDocs = reviewStates.filter(s => s === 'Rejected').length;

    res.json({
      bgvRequestId: bgvRequest._id,
      status: bgvRequest.status,
      isFinalized: bgvRequest.isFinalized,
      finalizedAt: bgvRequest.finalizedAt,
      assignedAgent: user.assignedAgent,
      progress: {
        verified: verifiedDocs,
        rejected: rejectedDocs,
        pending: totalDocs - verifiedDocs - rejectedDocs,
        total: totalDocs
      },
      reviews: bgvRequest.reviews,
      submittedAt: bgvRequest.createdAt,
      updatedAt: bgvRequest.updatedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  { name: 'releasingLetter', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId, isFresher, previousCompany, previousDesignation, previousDuration,
      hrContactName, hrContactEmail, hrContactPhone, ...extraDetails } = req.body;
    const files = req.files;

    if (!userId) return res.status(400).json({ error: "User ID missing" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const docPaths = {};
    Object.keys(files).forEach(key => {
      docPaths[key] = `uploads/${files[key][0].filename}`;
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
      releasingLetter: { status: 'Pending' },
      addressProof: { status: 'Pending' },
      bankStatement: { status: 'Pending' },
      signature: { status: 'Pending' }
    };

    // ONLY auto-verify Aadhaar and PAN from MasterRecord
    if (masterRecord) {
      if (masterRecord.aadharNumber) reviews.aadhar = { status: 'Verified', comment: 'Auto-verified from Master Database' };
      if (masterRecord.panNumber) reviews.pan = { status: 'Verified', comment: 'Auto-verified from Master Database' };
    }

    // 1. Create BGVRequest Record
    const newBGVRequest = new BGVRequest({
      candidate: userId,
      agent: bestAgent ? bestAgent._id : null,
      hr: user.createdBy || null,
      status: 'Under Review',
      reviews: reviews
    });
    await newBGVRequest.save();

    // 2. Create/Update CandidateSubmission
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
        previousCompany: previousCompany || '',
        previousDesignation: previousDesignation || '',
        previousDuration: previousDuration || '',
        hrContactName: hrContactName || '',
        hrContactEmail: hrContactEmail || '',
        hrContactPhone: hrContactPhone || ''
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

    // Prevent changes if already finalized
    if (request.isFinalized) {
      return res.status(403).json({ error: "Cannot modify verification after final approval/rejection. Case is locked." });
    }

    if (!request.reviews[documentType]) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    // Capture previous status BEFORE updating
    const previousStatus = request.reviews[documentType].status;

    // Only proceed if the status is actually changing
    if (previousStatus === status && request.reviews[documentType].comment === comment) {
      return res.json({ success: true, message: "No changes detected", status: request.status });
    }

    request.reviews[documentType] = { status, comment };

    // Check if all documents are verified
    const reviewStates = Object.values(request.reviews).map(r => r.status);
    if (reviewStates.every(s => s === 'Verified')) {
      request.status = 'Verified';
    } else {
      request.status = 'Under Review';
    }

    await request.save();

    // Sync status back to User model
    await User.findByIdAndUpdate(candidateId, { status: request.status });

    // 📧 SEND EMAIL ALERT: Only when status CHANGES to Rejected (not on duplicate calls)
    if (status === 'Rejected' && previousStatus !== 'Rejected') {
      const candidate = await User.findById(candidateId);
      if (candidate) {
        await emailService.sendReuploadEmail(candidate.email, candidate.name, documentType, comment);
      }
    }

    res.json({ success: true, message: "Review updated", status: request.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. AGENT FINAL STATUS UPDATE - Locks case after submission
router.patch('/update-status', async (req, res) => {
  const { candidateId, status, agentId } = req.body;
  if (!['Verified', 'Rejected', 'Under Review'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    await User.findByIdAndUpdate(candidateId, { status });

    const user = await User.findById(candidateId);
    if (user.bgvRequest) {
      const bgvRequest = await BGVRequest.findById(user.bgvRequest);
      if (bgvRequest) {
        if (status === 'Verified' || status === 'Rejected') {
          bgvRequest.isFinalized = true;
          bgvRequest.finalizedAt = Date.now();
          bgvRequest.finalizedBy = agentId;
        }
        bgvRequest.status = status;
        await bgvRequest.save();
      }
    }

    // 📧 Send final case email to candidate
    if (status === 'Verified') {
      await emailService.sendCaseApprovedEmail(user.email, user.name);
    } else if (status === 'Rejected') {
      await emailService.sendCaseRejectedEmail(user.email, user.name);
    }

    res.json({ success: true, message: `Candidate ${status} successfully. Case locked.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// 5. CANDIDATE RE-UPLOAD REJECTED DOCUMENT
router.post('/re-upload-document', upload.single('document'), async (req, res) => {
  try {
    const { candidateId, documentType, bgvRequestId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const candidate = await User.findById(candidateId);
    if (!candidate) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Candidate not found" });
    }

    // 1. Update CandidateSubmission
    let submission = await CandidateSubmission.findOne({
      $or: [{ candidateId: candidateId }, { email: candidate.email }]
    });

    const relativePath = `uploads/${req.file.filename}`;

    if (submission) {
      if (!submission.documents) submission.documents = {};

      const oldPath = submission.documents[documentType];
      if (oldPath) {
        const fullOldPath = path.join(__dirname, '..', oldPath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }

      submission.documents[documentType] = relativePath;
      submission.status = 'Under Review';
      await submission.save();
    }

    // 2. Update BGVRequest
    const bgvRequest = await BGVRequest.findById(bgvRequestId);
    if (bgvRequest) {
      if (bgvRequest.reviews[documentType]) {
        bgvRequest.reviews[documentType].status = 'Pending';
        bgvRequest.reviews[documentType].comment = 'Re-uploaded';
      }
      bgvRequest.status = 'Under Review';
      bgvRequest.isFinalized = false; // Unlock case for re-review
      await bgvRequest.save();
    }

    // 3. Update User status
    await User.findByIdAndUpdate(candidateId, { status: 'Under Review' });

    res.json({ success: true, message: `${documentType} re-uploaded successfully. Awaiting review.` });
  } catch (err) {
    console.error('❌ Re-upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to re-upload document" });
  }
});

module.exports = router;