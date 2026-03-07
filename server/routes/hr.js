const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const BGVRequest = require('../models/BGVRequest');
const CandidateSubmission = require('../models/CandidateSubmission');
const emailService = require('../services/emailService');
const { ROLES } = require('../constants');

// CREATE CANDIDATE (with createdBy tracking)
router.post('/create-candidate', async (req, res) => {
  try {
    const { name, email, hrId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const bestAgent = await User.findOne({ role: ROLES.AGENT }).sort({ taskCount: 1 });

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newCandidate = new User({
      name,
      email,
      password: hashedPassword,
      role: ROLES.CANDIDATE,
      assignedAgent: bestAgent ? bestAgent.uid : null,
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

// Helper to strip _id and __v from objects
const stripIds = (obj) => {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(stripIds);
  const cleaned = { ...obj };
  delete cleaned._id;
  delete cleaned.__v;
  return cleaned;
};

// GET CANDIDATES (scoped to HR who created them)
router.get('/candidates', async (req, res) => {
  try {
    const { hrId } = req.query;
    const filter = { role: ROLES.CANDIDATE };
    if (hrId) {
      filter.createdBy = hrId;
    }
    const candidates = await User.find(filter).sort({ createdAt: -1 }).lean();

    // Manually resolve assignedAgent uid -> name
    for (let c of candidates) {
      delete c._id;
      delete c.__v;
      if (c.assignedAgent) {
        const agent = await User.findOne({ uid: c.assignedAgent }).select('name uid');
        c.assignedAgentData = agent ? { name: agent.name, uid: agent.uid } : null;
      }
    }

    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CANDIDATE DETAILED PROGRESS
router.get('/candidate-progress/:uid', async (req, res) => {
  try {
    const candidate = await User.findOne({ uid: req.params.uid }).lean();
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });
    delete candidate._id;
    delete candidate.__v;

    // Resolve agent
    if (candidate.assignedAgent) {
      const agent = await User.findOne({ uid: candidate.assignedAgent }).select('name uid');
      candidate.assignedAgentData = agent ? { name: agent.name, uid: agent.uid } : null;
    }

    // Resolve bgvRequest
    if (candidate.bgvRequest) {
      const bgvData = await BGVRequest.findOne({ uid: candidate.bgvRequest }).lean();
      if (bgvData) { delete bgvData._id; delete bgvData.__v; }
      candidate.bgvRequestData = bgvData;
    }

    let submission = await CandidateSubmission.findOne({ email: candidate.email }).lean();
    if (submission) { delete submission._id; delete submission.__v; }

    res.json({
      ...candidate,
      submission
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HR SUBMIT REFERENCE DATA FOR CROSS-VERIFICATION
router.post('/submit-hr-data/:candidateUid', async (req, res) => {
  try {
    const { candidateUid } = req.params;
    const { tenthPercentage, twelfthPercentage, degreeGPA, degreeName, degreeUniversity,
      previousCompany, previousDesignation, previousDuration,
      hrContactName, hrContactEmail, hrContactPhone, ctc, remarks } = req.body;

    const candidate = await User.findOne({ uid: candidateUid });
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const bgvRequest = await BGVRequest.findOne({ candidate: candidateUid });
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