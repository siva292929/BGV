const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'hr', 'agent', 'candidate', 'ADMIN', 'HR', 'AGENT', 'CANDIDATE'], 
    default: 'candidate' 
  },
  // ADD THIS FIELD TO FIX THE ISSUE
  isFirstLogin: { type: Boolean, default: true }, 
  
  phoneNumber: { type: String },
  isPhoneVerified: { type: Boolean, default: false },
  status: { type: String, default: 'Pending' },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documents: {
    aadhar: String,
    pan: String,
    degree: String,
    twelfth: String,
    tenth: String,
    experience: String,
    payslip: String,
    signature: String
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);