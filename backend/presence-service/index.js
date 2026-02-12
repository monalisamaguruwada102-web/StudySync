const express = require('express');
const Redis = require('ioredis');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8005;
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const ONLINE_TTL = 60; // seconds

app.post('/heartbeat', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    await redis.set(`presence:${userId}`, 'online', 'EX', ONLINE_TTL);
    res.json({ success: true });
});

app.get('/status/:userId', async (req, res) => {
    const status = await redis.get(`presence:${req.params.userId}`);
    res.json({ userId: req.params.userId, status: status || 'offline' });
});

app.post('/status/bulk', async (req, res) => {
    const { userIds } = req.body;
    const pipeline = redis.pipeline();
    userIds.forEach(id => pipeline.get(`presence:${id}`));

    const results = await pipeline.exec();
    const presenceMap = {};
    userIds.forEach((id, index) => {
        presenceMap[id] = results[index][1] || 'offline';
    });

    res.json(presenceMap);
});

app.get('/health', (req, res) => res.json({ status: 'Presence Service is healthy' }));

app.listen(PORT, () => {
    console.log(`📡 Presence Service running on port ${PORT}`);
});
