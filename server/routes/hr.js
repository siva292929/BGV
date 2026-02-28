const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const BGVRequest = require('../models/BGVRequest');
const CandidateSubmission = require('../models/CandidateSubmission');
const emailService = require('../services/emailService');

// CREATE CANDIDATE (with createdBy tracking)
router.post('/create-candidate', async (req, res) => {
  try {
    const { name, email, hrId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const bestAgent = await User.findOne({ role: 'AGENT' }).sort({ taskCount: 1 });

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newCandidate = new User({
      name,
      email,
      password: hashedPassword,
      role: 'CANDIDATE',
      assignedAgent: bestAgent ? bestAgent._id : null,
      createdBy: hrId || null,
      isFirstLogin: true
    });

    await newCandidate.save();

    if (bestAgent) {
      bestAgent.taskCount += 1;
      await bestAgent.save();
    }

    await emailService.sendInvitationEmail(name, email, tempPassword);

    res.json({ message: "Candidate created and assigned to Agent", tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CANDIDATES (scoped to HR who created them)
router.get('/candidates', async (req, res) => {
  try {
    const { hrId } = req.query;
    const filter = { role: 'CANDIDATE' };
    if (hrId) {
      filter.createdBy = hrId;
    }
    const candidates = await User.find(filter)
      .populate('assignedAgent', 'name _id')
      .sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CANDIDATE DETAILED PROGRESS
router.get('/candidate-progress/:id', async (req, res) => {
  try {
    const candidate = await User.findById(req.params.id)
      .populate('assignedAgent', 'name')
      .populate('bgvRequest');

    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const submission = await CandidateSubmission.findOne({ email: candidate.email });

    res.json({
      ...candidate.toObject(),
      submission
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HR SUBMIT REFERENCE DATA FOR CROSS-VERIFICATION
router.post('/submit-hr-data/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { tenthPercentage, twelfthPercentage, degreeGPA, degreeName, degreeUniversity,
      previousCompany, previousDesignation, previousDuration,
      hrContactName, hrContactEmail, hrContactPhone, ctc, remarks } = req.body;

    const candidate = await User.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const bgvRequest = await BGVRequest.findOne({ candidate: candidateId });
    if (!bgvRequest) return res.status(404).json({ error: "No BGV request found for this candidate" });

    bgvRequest.hrData = {
      tenthPercentage, twelfthPercentage, degreeGPA, degreeName, degreeUniversity,
      previousCompany, previousDesignation, previousDuration,
      hrContactName, hrContactEmail, hrContactPhone, ctc, remarks
    };

    await bgvRequest.save();

    res.json({ success: true, message: "HR reference data submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;