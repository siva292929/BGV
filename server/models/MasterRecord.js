const mongoose = require('mongoose');

const MasterRecordSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  aadharNumber: { type: String, unique: true  },
  panNumber: { type: String, unique: true  },
  fullName: { type: String, required: true },
  dob: { type: String },
  isPreVerified: { type: Boolean, default: true },
  
  // NEW: Academic Fields for Auto-Fetch
  tenthPercentage: { type: String },
  twelfthPercentage: { type: String },
  degreeGPA: { type: String },

  // Document URLs for existing records
  documents: {
    aadharCardUrl: { type: String },
    panCardUrl: { type: String },
    tenthMarksheetUrl: { type: String },
    twelfthMarksheetUrl: { type: String },
    degreeUrl: { type: String }
  }
}, { timestamps: true }); // Good practice to track when records were created

module.exports = mongoose.model('MasterRecord', MasterRecordSchema);