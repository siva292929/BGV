const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  uid: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['ADMIN', 'HR', 'AGENT', 'CANDIDATE'],
    default: 'CANDIDATE'
  },
  empid: { type: String },
  isFirstLogin: { type: Boolean, default: true },
  phoneNumber: { type: String },
  isPhoneVerified: { type: Boolean, default: false },
  status: { type: String, default: 'Pending' },
  assignedAgent: { type: String },   // stores agent uid
  createdBy: { type: String },       // stores HR uid
  taskCount: { type: Number, default: 0 },
  otp: { type: String },
  otpExpires: { type: Date },
  bgvRequest: { type: String },      // stores BGVRequest uid
  documents: {
    aadhar: String,
    pan: String,
    degree: String,
    twelfth: String,
    tenth: String,
    experience: String,
    payslip: String,
    releasingLetter: String,
    addressProof: String,
    bankStatement: String,
    signature: String
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);