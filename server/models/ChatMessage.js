const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bgvRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BGVRequest' },
    message: { type: String, required: true },
    readAt: { type: Date, default: null }
}, { timestamps: true });

// Indexes for fast lookups
ChatMessageSchema.index({ sender: 1, receiver: 1 });
ChatMessageSchema.index({ bgvRequest: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
