const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "connect-src": ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 mins for the gateway
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());

// Auth Middleware for Gateway
const authenticateRequest = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
        req.user = user;
        next();
    });
};

// Route Definitions
// These would typically be managed in a service discovery or config file
const services = {
    auth: 'http://localhost:8001',
    chat: 'http://localhost:8002',
    message: 'http://localhost:8003',
    presence: 'http://localhost:8004',
    notification: 'http://localhost:8005',
    media: 'http://localhost:8006',
};

// Auth Service (Public Access for Login/Register)
app.use('/api/v1/auth', createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auth': '' },
}));

// Protected Services
app.use('/api/v1/chat', authenticateRequest, createProxyMiddleware({
    target: services.chat,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/chat': '' },
}));

app.use('/api/v1/messages', authenticateRequest, createProxyMiddleware({
    target: services.message,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/messages': '' },
}));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
});
