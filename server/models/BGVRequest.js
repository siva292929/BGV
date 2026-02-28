const mongoose = require('mongoose');

const BGVRequestSchema = new mongoose.Schema({
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hr: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    isFinalized: { type: Boolean, default: false },
    finalizedAt: { type: Date },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // HR-submitted reference data for cross-verification
    hrData: {
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

    // Document reviews by agent
    reviews: {
        aadhar: { status: { type: String, default: 'Pending' }, comment: String },
        pan: { status: { type: String, default: 'Pending' }, comment: String },
        degree: { status: { type: String, default: 'Pending' }, comment: String },
        twelfth: { status: { type: String, default: 'Pending' }, comment: String },
        tenth: { status: { type: String, default: 'Pending' }, comment: String },
        experience: { status: { type: String, default: 'Pending' }, comment: String },
        payslip: { status: { type: String, default: 'Pending' }, comment: String },
        releasingLetter: { status: { type: String, default: 'Pending' }, comment: String },
        addressProof: { status: { type: String, default: 'Pending' }, comment: String },
        bankStatement: { status: { type: String, default: 'Pending' }, comment: String },
        signature: { status: { type: String, default: 'Pending' }, comment: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('BGVRequest', BGVRequestSchema);
