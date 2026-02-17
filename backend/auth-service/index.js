const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(express.json());

// Auth Rate Limiter
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // 15 attempts per hour
    message: { error: 'Too many auth attempts from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/login', authLimiter);
app.use('/register', authLimiter);

const PORT = process.env.PORT || 8001;

// Mock User DB (In production, use MongoDB/PostgreSQL)
const users = [];

// JWT Helper Functions
const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
};

// Routes
app.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { id: Date.now().toString(), email, password: hashedPassword, name };
        users.push(user);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const user = users.find(u => u.email === req.body.email);
    if (!user) return res.status(400).json({ error: 'User not found' });

    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            const payload = { id: user.id, email: user.email };
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);
            res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'Auth Service is healthy' }));

app.listen(PORT, () => {
    console.log(`🔐 Auth Service running on port ${PORT}`);
});
