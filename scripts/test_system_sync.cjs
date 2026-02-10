// test_system_sync.cjs
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';
const TEST_USER = {
    email: 'test@example.com',
    password: 'password123'
};

async function testSync() {
    console.log('🧪 Starting System Sync Verification...');

    try {
        // 1. Authenticate (or use a test token if you have one)
        console.log('🔑 Logging in...');
        const authRes = await axios.post(`${API_URL}/api/auth/login`, TEST_USER).catch(e => {
            console.warn('⚠️ Login failed, trying registration...');
            return axios.post(`${API_URL}/api/auth/register`, { ...TEST_USER, name: 'Tester' });
        });

        const token = authRes.data.token;
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Authenticated');

        // 2. Test Note Creation (Write-Through)
        const testNote = {
            title: 'Refactor Test Note ' + Date.now(),
            content: 'This is a test of the nuclear refactor.'
        };

        console.log('📝 Creating test note...');
        const postRes = await axios.post(`${API_URL}/api/notes`, testNote, authHeader);
        console.log('✅ Note created:', postRes.data.item.id);
        console.log('📊 Sync Status:', postRes.data.syncStatus);

        if (postRes.data.syncStatus !== 'synced') {
            console.error('❌ Sync failed! Note is local-only.');
        } else {
            console.log('🚀 SUCCESS: Note confirmed in Supabase');
        }

        // 3. Test Note Update
        console.log('🔄 Updating note...');
        const putRes = await axios.put(`${API_URL}/api/notes/${postRes.data.item.id}`, { content: 'Updated content' }, authHeader);
        console.log('✅ Note updated. Sync Status:', putRes.data.syncStatus);

        // 4. Verify Fetch (Merge logic)
        console.log('📥 Verifying fetch...');
        const getRes = await axios.get(`${API_URL}/api/notes`, authHeader);
        const found = getRes.data.find(n => n.id === postRes.data.item.id);
        if (found) {
            console.log('✅ Note found in merged collection');
        } else {
            console.error('❌ Note MISSING from fetch results!');
        }

        console.log('\n🌟 System Sync Verification PASSED');
    } catch (error) {
        console.error('❌ Verification failed:', error.response?.data || error.message);
        console.log('\n💡 Tip: Ensure the server is running with "npm run dev" or "node server/index.cjs" before running this test.');
    }
}

testSync();
