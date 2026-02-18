const mongoose = require('mongoose');

const AllowedHRSchema = new mongoose.Schema({
  email: { type: String, required: true },
  empid: { type: String, required: true }
});

// This line ensures the COMBINATION of email + empid is unique
AllowedHRSchema.index({ email: 1, empid: 1 }, { unique: true });

module.exports = mongoose.model('AllowedHR', AllowedHRSchema);