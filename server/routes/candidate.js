const router = require('express').Router();
const User = require('../models/User');
const MasterRecord = require('../models/MasterRecord');
const BGVRequest = require('../models/BGVRequest');
const CandidateSubmission = require('../models/CandidateSubmission');
const emailService = require('../services/emailService');
const { upload, cloudinary } = require('../config/cloudinary');
const { ROLES, STATUS, STATUS_LABELS, REVIEW } = require('../constants');

// --- FETCH CURRENT STATUS FOR PERSISTENCE ---
router.get('/status/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.userId }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    // Resolve agent name
    let agentName = null;
    if (user.assignedAgent) {
      const agent = await User.findOne({ uid: user.assignedAgent }).select('name');
      agentName = agent ? agent.name : null;
    }

    // Resolve bgvRequest
    let bgvRequest = null;
    if (user.bgvRequest) {
      bgvRequest = await BGVRequest.findOne({ uid: user.bgvRequest }).lean();
      if (bgvRequest) { delete bgvRequest._id; delete bgvRequest.__v; }
    }

    res.json({
      status: user.status,
      isPhoneVerified: user.isPhoneVerified,
      phoneNumber: user.phoneNumber,
      assignedAgent: agentName,
      bgvRequest: bgvRequest
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch status" });
  }
});

// --- GET DETAILED VERIFICATION STATUS WITH REVIEW DETAILS ---
router.get('/verification-status/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.userId }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    let bgvRequest = null;
    if (user.bgvRequest) {
      bgvRequest = await BGVRequest.findOne({ uid: user.bgvRequest }).lean();
    }
    if (!bgvRequest) return res.status(404).json({ error: "No BGV request found" });

    // Resolve agent
    let assignedAgent = null;
    if (user.assignedAgent) {
      const agent = await User.findOne({ uid: user.assignedAgent }).select('name email uid');
      assignedAgent = agent ? { name: agent.name, email: agent.email, uid: agent.uid } : null;
    }

    // Calculate verification progress
    const reviewStates = Object.values(bgvRequest.reviews).map(r => r.status);
    const totalDocs = reviewStates.length;
    const verifiedDocs = reviewStates.filter(s => s === REVIEW.VERIFIED).length;
    const rejectedDocs = reviewStates.filter(s => s === REVIEW.REJECTED).length;

    res.json({
      bgvRequestId: bgvRequest.uid,
      status: bgvRequest.status,
      isFinalized: bgvRequest.isFinalized,
      finalizedAt: bgvRequest.finalizedAt,
      assignedAgent: assignedAgent,
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

    const recordObj = record.toObject();
    delete recordObj._id;
    delete recordObj.__v;
    res.json(recordObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. MULTI-CATEGORY MANUAL UPLOAD & AUTO-ASSIGNMENT (CLOUDINARY)
const uploadFields = upload.fields([
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
]);

router.post('/upload-docs', (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      console.error('❌ Multer/Cloudinary upload error:', err);
      return res.status(500).json({ error: `File upload failed: ${err.message || err}` });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { userId, isFresher, previousCompany, previousDesignation, previousDuration,
      hrContactName, hrContactEmail, hrContactPhone, ...extraDetails } = req.body;
    const files = req.files;

    if (!userId) return res.status(400).json({ error: "User ID missing" });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Build Cloudinary URLs from uploaded files
    const docPaths = {};
    Object.keys(files).forEach(key => {
      docPaths[key] = files[key][0].path;
    });

    // --- AUTO-ASSIGNMENT LOGIC: Least taskCount ---
    const bestAgent = await User.findOne({ role: ROLES.AGENT }).sort({ taskCount: 1 });

    // --- AUTO-VERIFICATION LOGIC ---
    const trimmedPhone = user.phoneNumber ? user.phoneNumber.trim() : null;
    const masterRecord = trimmedPhone ? await MasterRecord.findOne({ phoneNumber: trimmedPhone }) : null;

    const reviews = {
      aadhar: { status: REVIEW.PENDING },
      pan: { status: REVIEW.PENDING },
      degree: { status: REVIEW.PENDING },
      twelfth: { status: REVIEW.PENDING },
      tenth: { status: REVIEW.PENDING },
      experience: { status: REVIEW.PENDING },
      payslip: { status: REVIEW.PENDING },
      releasingLetter: { status: REVIEW.PENDING },
      addressProof: { status: REVIEW.PENDING },
      bankStatement: { status: REVIEW.PENDING },
      signature: { status: REVIEW.PENDING }
    };

    // ONLY auto-verify Aadhaar and PAN from MasterRecord
    if (masterRecord) {
      if (masterRecord.aadharNumber) reviews.aadhar = { status: REVIEW.VERIFIED, comment: 'Auto-verified from Master Database' };
      if (masterRecord.panNumber) reviews.pan = { status: REVIEW.VERIFIED, comment: 'Auto-verified from Master Database' };
    }

    // 1. Create BGVRequest Record
    const newBGVRequest = new BGVRequest({
      candidate: userId,
      agent: bestAgent ? bestAgent.uid : null,
      hr: user.createdBy || null,
      status: STATUS.UNDER_REVIEW,
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
        previousCompany: masterRecord.previousCompany,
        previousDesignation: masterRecord.previousDesignation,
        previousDuration: masterRecord.previousDuration,
        ctc: masterRecord.ctc
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
      status: STATUS.UNDER_REVIEW,
      assignedAgent: bestAgent ? bestAgent.uid : null,
      bgvRequest: newBGVRequest.uid
    };

    await CandidateSubmission.findOneAndUpdate(
      { email: user.email },
      submissionData,
      { upsert: true, new: true }
    );

    const updateData = {
      documents: docPaths,
      status: STATUS.UNDER_REVIEW,
      bgvRequest: newBGVRequest.uid
    };

    if (bestAgent) {
      updateData.assignedAgent = bestAgent.uid;
      await User.findOneAndUpdate({ uid: bestAgent.uid }, { $inc: { taskCount: 1 } });
    }

    await User.findOneAndUpdate({ uid: userId }, updateData);

    res.json({
      success: true,
      message: bestAgent ? `Documents uploaded and assigned to Agent ${bestAgent.name}` : "Documents uploaded successfully",
      assignedAgent: bestAgent ? bestAgent.name : null,
      requestId: newBGVRequest.uid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. AGENT DETAILED REVIEW UPDATE
router.post('/update-review', async (req, res) => {
  try {
    const { candidateId, requestId, documentType, status, comment } = req.body;

    const request = await BGVRequest.findOne({ uid: requestId });
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
    if (reviewStates.every(s => s === REVIEW.VERIFIED)) {
      request.status = STATUS.VERIFIED;
    } else {
      request.status = STATUS.UNDER_REVIEW;
    }

    await request.save();

    // Sync status back to User model
    const candidate = await User.findOne({ uid: candidateId });
    if (candidate) {
      candidate.status = request.status;
      await candidate.save();
    }

    // 📧 SEND EMAIL ALERT: Only when status CHANGES to Rejected
    if (status === REVIEW.REJECTED && previousStatus !== REVIEW.REJECTED) {
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
  if (![STATUS.VERIFIED, STATUS.REJECTED, STATUS.UNDER_REVIEW].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const user = await User.findOne({ uid: candidateId });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.status = status;
    await user.save();

    if (user.bgvRequest) {
      const bgvRequest = await BGVRequest.findOne({ uid: user.bgvRequest });
      if (bgvRequest) {
        if (status === STATUS.VERIFIED || status === STATUS.REJECTED) {
          bgvRequest.isFinalized = true;
          bgvRequest.finalizedAt = Date.now();
          bgvRequest.finalizedBy = agentId;
        }
        bgvRequest.status = status;
        await bgvRequest.save();
      }
    }

    // 📧 Send final case email to candidate
    if (status === STATUS.VERIFIED) {
      await emailService.sendCaseApprovedEmail(user.email, user.name);
    } else if (status === STATUS.REJECTED) {
      await emailService.sendCaseRejectedEmail(user.email, user.name);
    }

    res.json({ success: true, message: `Candidate ${STATUS_LABELS[status]} successfully. Case locked.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// 5. CANDIDATE RE-UPLOAD REJECTED DOCUMENT (CLOUDINARY)
router.post('/re-upload-document', upload.single('document'), async (req, res) => {
  try {
    const { candidateId, documentType, bgvRequestId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const candidate = await User.findOne({ uid: candidateId });
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // The new Cloudinary URL
    const cloudinaryUrl = req.file.path;

    // 1. Update CandidateSubmission
    let submission = await CandidateSubmission.findOne({ email: candidate.email });

    if (submission) {
      if (!submission.documents) submission.documents = {};

      // Delete old file from Cloudinary if it exists
      const oldUrl = submission.documents[documentType];
      if (oldUrl && oldUrl.includes('cloudinary')) {
        try {
          const publicId = oldUrl.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.log('Could not delete old Cloudinary file:', e.message);
        }
      }

      submission.documents[documentType] = cloudinaryUrl;
      submission.status = STATUS.UNDER_REVIEW;
      await submission.save();
    }

    // 2. Update BGVRequest
    const bgvRequest = await BGVRequest.findOne({ uid: bgvRequestId });
    if (bgvRequest) {
      if (bgvRequest.reviews[documentType]) {
        bgvRequest.reviews[documentType].status = REVIEW.PENDING;
        bgvRequest.reviews[documentType].comment = 'Re-uploaded';
      }
      bgvRequest.status = STATUS.UNDER_REVIEW;
      bgvRequest.isFinalized = false; // Unlock case for re-review
      await bgvRequest.save();
    }

    // 3. Update User status
    candidate.status = STATUS.UNDER_REVIEW;
    await candidate.save();

    res.json({ success: true, message: `${documentType} re-uploaded successfully. Awaiting review.` });
  } catch (err) {
    console.error('❌ Re-upload error:', err);
    res.status(500).json({ error: "Failed to re-upload document" });
  }
});

module.exports = router;