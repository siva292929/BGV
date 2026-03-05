const mongoose = require('mongoose');
const crypto = require('crypto');

const ChatMessageSchema = new mongoose.Schema({
    uid: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') },
    sender: { type: String, required: true },     // stores User uid
    receiver: { type: String, required: true },   // stores User uid
    bgvRequest: { type: String },                 // stores BGVRequest uid
    message: { type: String, required: true },
    readAt: { type: Date, default: null }
}, { timestamps: true });

// Indexes for fast lookups
ChatMessageSchema.index({ sender: 1, receiver: 1 });
ChatMessageSchema.index({ bgvRequest: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
