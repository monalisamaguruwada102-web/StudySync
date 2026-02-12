const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8002;

// MongoDB Conversation Schema
const conversationSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    type: { type: String, enum: ['direct', 'group'], default: 'direct' },
    name: String,
    participants: [String], // Array of User IDs
    lastMessage: String,
    lastMessageTime: Date,
    groupMetadata: {
        description: String,
        inviteCode: String,
        creatorId: String
    },
    createdAt: { type: Date, default: Date.now }
});
const Conversation = mongoose.model('Conversation', conversationSchema);

// Routes
app.post('/conversations', async (req, res) => {
    try {
        const { type, participants, name, description } = req.body;

        // For direct chats, ensure we don't duplicate
        if (type === 'direct') {
            const existing = await Conversation.findOne({
                type: 'direct',
                participants: { $all: participants, $size: 2 }
            });
            if (existing) return res.json(existing);
        }

        const conv = new Conversation({
            type,
            participants,
            name,
            groupMetadata: type === 'group' ? {
                description,
                inviteCode: Math.random().toString(36).substring(7).toUpperCase(),
                creatorId: participants[0]
            } : undefined
        });

        await conv.save();
        res.status(201).json(conv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/user/:userId', async (req, res) => {
    try {
        const convs = await Conversation.find({ participants: req.params.userId })
            .sort({ lastMessageTime: -1 });
        res.json(convs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'Chat Service is healthy' }));

app.listen(PORT, () => {
    console.log(`💬 Chat Service running on port ${PORT}`);
});
