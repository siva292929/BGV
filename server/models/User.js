const mongoose = require('mongoose');
const crypto = require('crypto');
const { ROLES, STATUS } = require('../constants');

const UserSchema = new mongoose.Schema({
  uid: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: Number,
    enum: [ROLES.ADMIN, ROLES.HR, ROLES.AGENT, ROLES.CANDIDATE],
    default: ROLES.CANDIDATE
  },
  empid: { type: String },
  isFirstLogin: { type: Boolean, default: true },
  phoneNumber: { type: String },
  isPhoneVerified: { type: Boolean, default: false },
  status: { type: Number, default: STATUS.PENDING },
  assignedAgent: { type: String },
  createdBy: { type: String },
  taskCount: { type: Number, default: 0 },
  otp: { type: String },
  otpExpires: { type: Date },
  bgvRequest: { type: String },
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