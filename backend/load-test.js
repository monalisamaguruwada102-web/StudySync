const axios = require('axios');

const API_GATEWAY = 'http://localhost:8000/api/v1';
const CONCURRENT_USERS = 50;
const MESSAGES_PER_USER = 10;

const simulateUser = async (userIndex) => {
    try {
        const email = `testuser${userIndex}@example.com`;
        // Register/Login
        const loginRes = await axios.post(`${API_GATEWAY}/auth/login`, { email, password: 'password123' });
        const token = loginRes.data.accessToken;

        for (let i = 0; i < MESSAGES_PER_USER; i++) {
            await axios.post(`${API_GATEWAY}/messages/send`, {
                conversationId: 'demo-conv-id',
                senderId: loginRes.data.user.id,
                content: `Load test message ${i} from user ${userIndex}`,
                type: 'text'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`👤 User ${userIndex} sent message ${i}`);
        }
    } catch (err) {
        console.error(`❌ User ${userIndex} failed:`, err.message);
    }
};

const runLoadTest = async () => {
    console.log('🚀 Starting Load Test Simulation...');
    const users = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
        users.push(simulateUser(i));
    }
    await Promise.all(users);
    console.log('✅ Load Test Completed.');
};

runLoadTest();
