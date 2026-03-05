const mongoose = require('mongoose');
const crypto = require('crypto');

const CandidateSubmissionSchema = new mongoose.Schema({
    uid: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') },
    email: { type: String, required: true, unique: true },
    fullName: String,
    phoneNumber: String,

    // Autofetched data from MasterRecords
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

    // Candidate-entered text details
    submittedDetails: {
        isFresher: { type: Boolean, default: false },
        previousCompany: String,
        previousDesignation: String,
        previousDuration: String,
        hrContactName: String,
        hrContactEmail: String,
        hrContactPhone: String
    },

    // File URLs (Cloudinary)
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
        type: String,
        enum: ['Pending', 'Under Review', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    assignedAgent: { type: String },    // stores User uid
    bgvRequest: { type: String }        // stores BGVRequest uid
}, { timestamps: true });

module.exports = mongoose.model('CandidateSubmission', CandidateSubmissionSchema);
