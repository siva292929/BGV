const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'HR', 'CANDIDATE'], 
    default: 'CANDIDATE' 
  },
  empid: { type: String, unique: true, sparse: true },
  isFirstLogin: { type: Boolean, default: false },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);