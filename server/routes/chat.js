const router = require('express').Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const BGVRequest = require('../models/BGVRequest');
const { ROLES, ROLE_LABELS } = require('../constants');

// HELPER: Check if two users are an allowed chat pair
const isAllowedChatPair = async (uid1, uid2) => {
    const user1 = await User.findOne({ uid: uid1 }).select('role assignedAgent createdBy uid');
    const user2 = await User.findOne({ uid: uid2 }).select('role assignedAgent createdBy uid');
    if (!user1 || !user2) return false;

    const r1 = user1.role, r2 = user2.role;

    // Case 1: CANDIDATE ↔ AGENT
    if (r1 === ROLES.CANDIDATE && r2 === ROLES.AGENT) {
        return user1.assignedAgent && user1.assignedAgent === uid2;
    }
    if (r2 === ROLES.CANDIDATE && r1 === ROLES.AGENT) {
        return user2.assignedAgent && user2.assignedAgent === uid1;
    }

    // Case 2: HR ↔ AGENT
    if (r1 === ROLES.HR && r2 === ROLES.AGENT) {
        const linkedCandidate = await User.findOne({
            role: ROLES.CANDIDATE, createdBy: uid1, assignedAgent: uid2
        });
        return !!linkedCandidate;
    }
    if (r2 === ROLES.HR && r1 === ROLES.AGENT) {
        const linkedCandidate = await User.findOne({
            role: ROLES.CANDIDATE, createdBy: uid2, assignedAgent: uid1
        });
        return !!linkedCandidate;
    }

    return false;
};

// SEND MESSAGE
router.post('/send', async (req, res) => {
    try {
        const { senderId, receiverId, message, bgvRequestId } = req.body;

        if (!senderId || !receiverId || !message) {
            return res.status(400).json({ error: "senderId, receiverId, and message are required" });
        }

        const allowed = await isAllowedChatPair(senderId, receiverId);
        if (!allowed) {
            return res.status(403).json({ error: "Not authorized to chat with this user" });
        }

        // Look up bgvRequest uid if not provided
        let resolvedBgvRequestId = bgvRequestId;
        if (!resolvedBgvRequestId) {
            const sender = await User.findOne({ uid: senderId });
            const receiver = await User.findOne({ uid: receiverId });
            const candidate = [sender, receiver].find(u => u && u.role === ROLES.CANDIDATE);
            if (candidate && candidate.bgvRequest) {
                resolvedBgvRequestId = candidate.bgvRequest;
            }
        }

        const newMsg = new ChatMessage({
            sender: senderId,
            receiver: receiverId,
            message: message.trim(),
            bgvRequest: resolvedBgvRequestId || null
        });
        await newMsg.save();

        res.json({ success: true, message: newMsg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET MESSAGES BETWEEN TWO USERS
router.get('/messages/:uid1/:uid2', async (req, res) => {
    try {
        const { uid1, uid2 } = req.params;

        const allowed = await isAllowedChatPair(uid1, uid2);
        if (!allowed) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const messages = await ChatMessage.find({
            $or: [
                { sender: uid1, receiver: uid2 },
                { sender: uid2, receiver: uid1 }
            ]
        }).sort({ createdAt: 1 }).lean();

        // Manually resolve sender/receiver names and strip _id
        for (const msg of messages) {
            delete msg._id;
            delete msg.__v;
            const senderUser = await User.findOne({ uid: msg.sender }).select('name role');
            const receiverUser = await User.findOne({ uid: msg.receiver }).select('name role');
            msg.senderData = senderUser ? { name: senderUser.name, role: senderUser.role } : null;
            msg.receiverData = receiverUser ? { name: receiverUser.name, role: receiverUser.role } : null;
        }

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ALLOWED CONTACTS FOR A USER (scoped)
router.get('/contacts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = await User.findOne({ uid: userId }).select('role assignedAgent createdBy uid');
        if (!currentUser) return res.status(404).json({ error: "User not found" });

        let contacts = [];

        if (currentUser.role === ROLES.CANDIDATE) {
            if (currentUser.assignedAgent) {
                const agent = await User.findOne({ uid: currentUser.assignedAgent }).select('name role email uid');
                if (agent) contacts.push({ id: agent.uid, name: agent.name, role: agent.role });
            }
        } else if (currentUser.role === ROLES.AGENT) {
            const assignedCandidates = await User.find({
                role: ROLES.CANDIDATE, assignedAgent: userId
            }).select('name role email createdBy uid');

            for (const cand of assignedCandidates) {
                contacts.push({ id: cand.uid, name: cand.name, role: cand.role });
                if (cand.createdBy && cand.createdBy !== userId) {
                    const hr = await User.findOne({ uid: cand.createdBy }).select('name role email uid');
                    if (hr && hr.role === ROLES.HR && !contacts.find(c => c.id === hr.uid)) {
                        contacts.push({ id: hr.uid, name: hr.name, role: hr.role });
                    }
                }
            }
        } else if (currentUser.role === ROLES.HR) {
            const createdCandidates = await User.find({
                role: ROLES.CANDIDATE, createdBy: userId
            }).select('assignedAgent');

            const agentUids = [...new Set(
                createdCandidates
                    .filter(c => c.assignedAgent)
                    .map(c => c.assignedAgent)
            )];

            for (const agentUid of agentUids) {
                if (agentUid === userId) continue;
                const agent = await User.findOne({ uid: agentUid }).select('name role email uid');
                if (agent) contacts.push({ id: agent.uid, name: agent.name, role: agent.role });
            }
        }

        contacts = contacts.filter(c => c.id !== userId);

        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET CONTACTS GROUPED BY HR (for agents)
router.get('/contacts-grouped/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = await User.findOne({ uid: userId }).select('role uid');
        if (!currentUser) return res.status(404).json({ error: "User not found" });

        if (currentUser.role !== ROLES.AGENT) {
            return res.status(400).json({ error: "Grouped contacts only available for agents" });
        }

        const assignedCandidates = await User.find({
            role: ROLES.CANDIDATE, assignedAgent: userId
        }).select('name role email createdBy uid status').lean();

        const hrMap = new Map();
        const noHrCandidates = [];

        for (const cand of assignedCandidates) {
            delete cand._id; delete cand.__v;
            if (cand.createdBy) {
                if (!hrMap.has(cand.createdBy)) {
                    const hr = await User.findOne({ uid: cand.createdBy }).select('name role email uid').lean();
                    if (hr) {
                        delete hr._id; delete hr.__v;
                        hrMap.set(cand.createdBy, { hr, candidates: [] });
                    }
                }
                if (hrMap.has(cand.createdBy)) {
                    hrMap.get(cand.createdBy).candidates.push(cand);
                } else {
                    noHrCandidates.push(cand);
                }
            } else {
                noHrCandidates.push(cand);
            }
        }

        const groups = Array.from(hrMap.values());

        if (noHrCandidates.length > 0) {
            groups.push({ hr: null, candidates: noHrCandidates });
        }

        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ALL CONVERSATIONS FOR A USER
router.get('/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const messages = await ChatMessage.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).sort({ createdAt: -1 });

        const partnerMap = new Map();
        for (const msg of messages) {
            const partnerId = msg.sender === userId ? msg.receiver : msg.sender;
            if (!partnerMap.has(partnerId)) {
                const allowed = await isAllowedChatPair(userId, partnerId);
                if (!allowed) continue;

                partnerMap.set(partnerId, {
                    partnerId,
                    lastMessage: msg.message,
                    lastMessageAt: msg.createdAt,
                    unread: msg.receiver === userId && !msg.readAt ? 1 : 0
                });
            } else if (msg.receiver === userId && !msg.readAt) {
                partnerMap.get(partnerId).unread += 1;
            }
        }

        const conversations = [];
        for (const [partnerId, conv] of partnerMap) {
            const partner = await User.findOne({ uid: partnerId }).select('name role email uid');
            if (partner) {
                conversations.push({ ...conv, partner: { ...partner.toObject(), id: partner.uid } });
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
