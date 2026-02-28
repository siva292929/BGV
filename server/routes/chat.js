const router = require('express').Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const BGVRequest = require('../models/BGVRequest');

// HELPER: Check if two users are an allowed chat pair
// Allowed: candidate↔assigned agent, HR (creator)↔assigned agent
const isAllowedChatPair = async (userId1, userId2) => {
    const user1 = await User.findById(userId1).select('role assignedAgent createdBy');
    const user2 = await User.findById(userId2).select('role assignedAgent createdBy');
    if (!user1 || !user2) return false;

    const r1 = user1.role, r2 = user2.role;

    // Case 1: CANDIDATE ↔ AGENT (agent must be assigned to this candidate)
    if (r1 === 'CANDIDATE' && r2 === 'AGENT') {
        return user1.assignedAgent && user1.assignedAgent.toString() === userId2;
    }
    if (r2 === 'CANDIDATE' && r1 === 'AGENT') {
        return user2.assignedAgent && user2.assignedAgent.toString() === userId1;
    }

    // Case 2: HR ↔ AGENT (HR must have created a candidate assigned to this agent)
    if (r1 === 'HR' && r2 === 'AGENT') {
        const linkedCandidate = await User.findOne({
            role: 'CANDIDATE', createdBy: userId1, assignedAgent: userId2
        });
        return !!linkedCandidate;
    }
    if (r2 === 'HR' && r1 === 'AGENT') {
        const linkedCandidate = await User.findOne({
            role: 'CANDIDATE', createdBy: userId2, assignedAgent: userId1
        });
        return !!linkedCandidate;
    }

    return false;
};

// SEND MESSAGE (with pair validation)
router.post('/send', async (req, res) => {
    try {
        const { senderId, receiverId, message, bgvRequestId } = req.body;

        if (!senderId || !receiverId || !message) {
            return res.status(400).json({ error: "senderId, receiverId, and message are required" });
        }

        const allowed = await isAllowedChatPair(senderId, receiverId);
        if (!allowed) {
            return res.status(403).json({ error: "You are not authorized to chat with this user." });
        }

        const newMessage = new ChatMessage({
            sender: senderId,
            receiver: receiverId,
            message: message.trim(),
            bgvRequest: bgvRequestId || null
        });

        await newMessage.save();
        res.json({ success: true, message: newMessage });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET MESSAGES BETWEEN TWO USERS (with pair validation)
router.get('/messages/:userId1/:userId2', async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;

        const allowed = await isAllowedChatPair(userId1, userId2);
        if (!allowed) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const messages = await ChatMessage.find({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'name role')
            .populate('receiver', 'name role');

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ALLOWED CONTACTS FOR A USER (scoped)
router.get('/contacts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = await User.findById(userId).select('role assignedAgent createdBy');
        if (!currentUser) return res.status(404).json({ error: "User not found" });

        let contacts = [];

        if (currentUser.role === 'CANDIDATE') {
            // Candidate can only chat with their assigned agent
            if (currentUser.assignedAgent) {
                const agent = await User.findById(currentUser.assignedAgent).select('name role email');
                if (agent) contacts.push({ id: agent._id.toString(), name: agent.name, role: agent.role });
            }
        } else if (currentUser.role === 'AGENT') {
            // Agent can chat with: their assigned candidates + HR who created those candidates
            const assignedCandidates = await User.find({
                role: 'CANDIDATE', assignedAgent: userId
            }).select('name role email createdBy');

            for (const cand of assignedCandidates) {
                contacts.push({ id: cand._id.toString(), name: cand.name, role: 'CANDIDATE' });
                // Also add the HR who created this candidate (if createdBy exists and is not the agent)
                if (cand.createdBy && cand.createdBy.toString() !== userId) {
                    const hr = await User.findById(cand.createdBy).select('name role email');
                    if (hr && hr.role === 'HR' && !contacts.find(c => c.id === hr._id.toString())) {
                        contacts.push({ id: hr._id.toString(), name: hr.name, role: 'HR' });
                    }
                }
            }
        } else if (currentUser.role === 'HR') {
            // HR can chat with agents who are assigned to candidates they created
            const createdCandidates = await User.find({
                role: 'CANDIDATE', createdBy: userId
            }).select('assignedAgent');

            const agentIds = [...new Set(
                createdCandidates
                    .filter(c => c.assignedAgent)
                    .map(c => c.assignedAgent.toString())
            )];

            for (const agentId of agentIds) {
                if (agentId === userId) continue; // safety: skip self
                const agent = await User.findById(agentId).select('name role email');
                if (agent) contacts.push({ id: agent._id.toString(), name: agent.name, role: 'AGENT' });
            }
        }

        // Final safety: never include self in contacts
        contacts = contacts.filter(c => c.id !== userId);

        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ALL CONVERSATIONS FOR A USER (only with allowed partners)
router.get('/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const messages = await ChatMessage.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).sort({ createdAt: -1 });

        const partnerMap = new Map();
        for (const msg of messages) {
            const partnerId = msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();
            if (!partnerMap.has(partnerId)) {
                // Verify this is still an allowed pair
                const allowed = await isAllowedChatPair(userId, partnerId);
                if (!allowed) continue;

                partnerMap.set(partnerId, {
                    partnerId,
                    lastMessage: msg.message,
                    lastMessageAt: msg.createdAt,
                    unread: msg.receiver.toString() === userId && !msg.readAt ? 1 : 0
                });
            } else if (msg.receiver.toString() === userId && !msg.readAt) {
                partnerMap.get(partnerId).unread += 1;
            }
        }

        const conversations = [];
        for (const [partnerId, conv] of partnerMap) {
            const partner = await User.findById(partnerId).select('name role email');
            if (partner) {
                conversations.push({ ...conv, partner });
            }
        }

        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MARK MESSAGES AS READ
router.patch('/mark-read', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        await ChatMessage.updateMany(
            { sender: senderId, receiver: receiverId, readAt: null },
            { readAt: new Date() }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
