const mongoose = require('mongoose');
const crypto = require('crypto');

const MasterRecordSchema = new mongoose.Schema({
  uid: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') },
  phoneNumber: { type: String, required: true, unique: true },
  aadharNumber: { type: String, unique: true, sparse: true },
  panNumber: { type: String, unique: true, sparse: true },
  dob: { type: String },
  isPreVerified: { type: Boolean, default: true },

  // Academic Fields
  tenthPercentage: { type: String },
  twelfthPercentage: { type: String },
  degreeGPA: { type: String },

  // Previous Experience Fields
  previousCompany: { type: String },
  previousDesignation: { type: String },
  previousDuration: { type: String },
  ctc: { type: String },

  // Document URLs for existing records
  documents: {
    aadharCardUrl: { type: String },
    panCardUrl: { type: String },
    tenthMarksheetUrl: { type: String },
    twelfthMarksheetUrl: { type: String },
    degreeUrl: { type: String },
    experienceLetterUrl: { type: String },
    relievingLetterUrl: { type: String },
    payslipUrl: { type: String },
    addressProofUrl: { type: String },
    bankStatementUrl: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('MasterRecord', MasterRecordSchema);