const mongoose = require('mongoose');

const BGVRequestSchema = new mongoose.Schema({
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hr: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The HR who initiated
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    reviews: {
        aadhar: { status: { type: String, default: 'Pending' }, comment: String },
        pan: { status: { type: String, default: 'Pending' }, comment: String },
        degree: { status: { type: String, default: 'Pending' }, comment: String },
        twelfth: { status: { type: String, default: 'Pending' }, comment: String },
        tenth: { status: { type: String, default: 'Pending' }, comment: String },
        experience: { status: { type: String, default: 'Pending' }, comment: String },
        payslip: { status: { type: String, default: 'Pending' }, comment: String },
        signature: { status: { type: String, default: 'Pending' }, comment: String }
    },
    submittedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('BGVRequest', BGVRequestSchema);
