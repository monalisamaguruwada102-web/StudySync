require('dotenv').config();
const axios = require('axios');

// Match test_system_sync.cjs logic
const API_URL = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:3000';
const BASE_API = `${API_URL}/api`;

async function testSharedRoutes() {
    console.log(`🧪 Testing Shared Resource Routes at ${BASE_API}...`);

    try {
        // 1. Login to get token
        console.log('🔑 Attempting login...');
        let token;
        try {
            const loginRes = await axios.post(`${BASE_API}/auth/login`, {
                email: 'test@example.com',
                password: 'password123'
            });
            token = loginRes.data.token;
        } catch (e) {
            console.warn('⚠️ Login failed, attempting registration...');
            const regRes = await axios.post(`${BASE_API}/auth/register`, {
                email: 'test@example.com',
                password: 'password123',
                name: 'Tester'
            });
            token = regRes.data.token;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Authenticated');

        // 2. Fetch a note to test shared route
        const notesRes = await axios.get(`${BASE_API}/notes`, config);
        const notes = notesRes.data.results || notesRes.data;

        if (notes.length === 0) {
            console.warn('⚠️ No notes found to test shared route.');
        } else {
            const noteId = notes[0].id;
            console.log(`📝 Testing shared note: ${noteId}`);
            const sharedRes = await axios.get(`${BASE_API}/notes/shared/${noteId}`, config);
            console.log('📦 Shared Response Received');
            if (sharedRes.data.id === noteId || sharedRes.data.supabaseId === noteId) {
                console.log('✅ Shared Note Route PASSED');
            } else {
                console.error(`❌ Shared Note Route FAILED (Mismatch: ${sharedRes.data.id} vs ${noteId})`);
            }
        }

    } catch (error) {
        console.error('❌ Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testSharedRoutes();
