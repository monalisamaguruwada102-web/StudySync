const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 8004;
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const subRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Socket Auth Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Auth failed'));

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return next(new Error('Auth failed'));
        socket.user = user;
        next();
    });
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.email}`);

    // Join user to their own private room for direct pushes
    socket.join(`user:${socket.user.id}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId) => {
        socket.join(`conv:${conversationId}`);
        console.log(`👤 User ${socket.user.id} joined conversation ${conversationId}`);
    });

    socket.on('typing', (data) => {
        // data: { conversationId, isTyping }
        socket.to(`conv:${data.conversationId}`).emit('user_typing', {
            userId: socket.user.id,
            isTyping: data.isTyping
        });
    });

    socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${socket.user.email}`);
        // Notify others if in a call (optional improvement)
    });

    // --- WebRTC Signaling ---

    socket.on('call-user', (data) => {
        // data: { userToCall, signalData, from, name }
        console.log(`📞 Call initiated from ${socket.user.id} to ${data.userToCall}`);
        io.to(`user:${data.userToCall}`).emit('call-made', {
            signal: data.signalData,
            from: socket.user.id,
            name: socket.user.name || socket.user.email
        });
    });

    socket.on('make-answer', (data) => {
        // data: { signal, to }
        console.log(`✅ Call accepted by ${socket.user.id} for ${data.to}`);
        io.to(`user:${data.to}`).emit('call-answered', {
            signal: data.signal,
            from: socket.user.id
        });
    });

    socket.on('ice-candidate', (data) => {
        // data: { to, candidate }
        io.to(`user:${data.to}`).emit('ice-candidate', {
            candidate: data.candidate,
            from: socket.user.id
        });
    });

    socket.on('call-rejected', (data) => {
        // data: { to }
        console.log(`❌ Call rejected by ${socket.user.id}`);
        io.to(`user:${data.to}`).emit('call-rejected', {
            from: socket.user.id
        });
    });

    socket.on('hang-up', (data) => {
        // data: { to }
        console.log(`📴 Call ended by ${socket.user.id}`);
        io.to(`user:${data.to}`).emit('call-ended', {
            from: socket.user.id
        });
    });
});

// Kafka Consumer (To push background events to clients)
const kafka = new Kafka({
    clientId: 'websocket-gateway',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const consumer = kafka.consumer({ groupId: 'websocket-group' });

const runKafka = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'messages', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const { type, payload } = JSON.parse(message.value.toString());

            if (type === 'message_send') {
                // Push message to the conversation room
                io.to(`conv:${payload.conversationId}`).emit('message_received', payload);
            } else if (type.startsWith('message_')) {
                // Push status updates (delivered/read)
                io.to(`conv:${payload.conversationId}`).emit('message_status_updated', payload);
            }
        }
    });
};
runKafka();

// Redis Pub/Sub for Multi-Node Socket.io (Distributed Bus)
// Note: io.adapter(createAdapter(pubClient, subClient)) is useally used for this, 
// but here we demonstrate the manual event propagation logic if needed for custom scaling.

server.listen(PORT, () => {
    console.log(`🌐 WebSocket Gateway running on port ${PORT}`);
});
