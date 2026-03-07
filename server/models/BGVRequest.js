const mongoose = require('mongoose');
const crypto = require('crypto');
const { STATUS, REVIEW } = require('../constants');

const BGVRequestSchema = new mongoose.Schema({
    uid: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') },
    candidate: { type: String, required: true },
    agent: { type: String },
    hr: { type: String },
    status: {
        type: Number,
        enum: [STATUS.PENDING, STATUS.UNDER_REVIEW, STATUS.VERIFIED, STATUS.REJECTED],
        default: STATUS.PENDING
    },
    isFinalized: { type: Boolean, default: false },
    finalizedAt: { type: Date },
    finalizedBy: { type: String },

    hrData: {
        aadharNumber: String,
        panNumber: String,
        tenthPercentage: String,
        twelfthPercentage: String,
        degreeGPA: String,
        degreeName: String,
        degreeUniversity: String,
        previousCompany: String,
        previousDesignation: String,
        previousDuration: String,
        hrContactName: String,
        hrContactEmail: String,
        hrContactPhone: String,
        ctc: String,
        remarks: String
    },

    reviews: {
        aadhar: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        pan: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        degree: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        twelfth: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        tenth: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        experience: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        payslip: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        releasingLetter: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        addressProof: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        bankStatement: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String },
        signature: { status: { type: Number, default: REVIEW.PENDING }, comment: String, verifiedBy: String }
    },

    // AI OCR Verification Results
    aiProcessed: { type: Boolean, default: false },
    aiVerification: {
        type: Map,
        of: {
            extractedText: String,
            extractedData: { type: Map, of: mongoose.Schema.Types.Mixed },
            confidence: { type: Number, default: 0 },
            verdict: { type: Number, default: 0 },
            matchDetails: String,
            processedAt: Date
        },
        default: {}
    },
    executiveSummary: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BGVRequest', BGVRequestSchema);
