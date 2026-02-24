const mongoose = require('mongoose');

const CandidateSubmissionSchema = new mongoose.Schema({
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
        payslip: String
    },

    // Details manually uploaded/entered by user
    submittedDetails: {
        isFresher: { type: Boolean, default: false },
        aadhar: String,
        pan: String,
        tenth: String,
        twelfth: String,
        degree: String,
        experience: String,
        payslip: String,
        signature: String
    },

    // File paths on server
    documents: {
        aadhar: String,
        pan: String,
        tenth: String,
        twelfth: String,
        degree: String,
        experience: String,
        payslip: String,
        signature: String
    },

    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bgvRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BGVRequest' }
}, { timestamps: true });

module.exports = mongoose.model('CandidateSubmission', CandidateSubmissionSchema);
