const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(helmet());

// Message Service Rate Limiter
const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(messageLimiter);

app.use(express.json());

const PORT = process.env.PORT || 8003;

// MongoDB Message Schema
const messageSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    conversationId: String,
    senderId: String,
    content: String,
    type: { type: String, default: 'text' },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    metadata: Object,
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Kafka Setup
const kafka = new Kafka({
    clientId: 'message-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const producer = kafka.producer();

const connectKafka = async () => {
    await producer.connect();
    console.log('📡 Kafka Producer connected');
};
connectKafka();

// Routes
app.post('/send', async (req, res) => {
    try {
        const { conversationId, senderId, content, type, metadata } = req.body;

        const message = new Message({
            conversationId,
            senderId,
            content,
            type,
            metadata
        });

        await message.save();

        // Produce Kafka Event
        await producer.send({
            topic: 'messages',
            messages: [
                { value: JSON.stringify({ type: 'message_send', payload: message }) }
            ]
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/:conversationId', async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .sort({ createdAt: 1 })
            .limit(50);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/status', async (req, res) => {
    try {
        const { messageId, status } = req.body;
        const message = await Message.findOneAndUpdate({ id: messageId }, { status }, { new: true });

        if (message) {
            await producer.send({
                topic: 'messages',
                messages: [
                    { value: JSON.stringify({ type: `message_${status}`, payload: { messageId, status, conversationId: message.conversationId } }) }
                ]
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'Message Service is healthy' }));

app.listen(PORT, () => {
    console.log(`💬 Message Service running on port ${PORT}`);
});
