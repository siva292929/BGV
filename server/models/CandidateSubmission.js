const mongoose = require('mongoose');
const crypto = require('crypto');
const { STATUS } = require('../constants');

const CandidateSubmissionSchema = new mongoose.Schema({
    uid: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') },
    email: { type: String, required: true, unique: true },
    fullName: String,
    phoneNumber: String,

    autofetchedDetails: {
        aadharNumber: String,
        panNumber: String,
        tenthPercentage: String,
        twelfthPercentage: String,
        degreeGPA: String,
        experience: String,
        payslip: String,
        previousCompany: String,
        previousDesignation: String,
        previousDuration: String,
        ctc: String
    },

    submittedDetails: {
        isFresher: { type: Boolean, default: false },
        previousCompany: String,
        previousDesignation: String,
        previousDuration: String,
        hrContactName: String,
        hrContactEmail: String,
        hrContactPhone: String
    },

    documents: {
        aadhar: String,
        pan: String,
        tenth: String,
        twelfth: String,
        degree: String,
        experience: String,
        payslip: String,
        releasingLetter: String,
        addressProof: String,
        bankStatement: String,
        signature: String
    },

    status: {
        type: Number,
        enum: [STATUS.PENDING, STATUS.UNDER_REVIEW, STATUS.VERIFIED, STATUS.REJECTED],
        default: STATUS.PENDING
    },
    assignedAgent: { type: String },
    bgvRequest: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CandidateSubmission', CandidateSubmissionSchema);
