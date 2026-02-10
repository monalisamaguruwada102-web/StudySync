require('dotenv').config();
const db = require('../server/database.cjs');
const supabasePersistence = require('../server/supabasePersistence.cjs');

async function simulateGetNotes() {
    console.log('Simulating GET /api/notes...');

    // Primary User
    const TEST_USER_ID = '1769561085648';
    const collection = 'notes';
    const supabaseTable = 'notes';

    try {
        console.log('1. Fetching from Supabase...');
        const cloudItems = await supabasePersistence.fetchCollection(supabaseTable, TEST_USER_ID) || [];
        console.log(`   Found ${cloudItems.length} cloud items.`);

        console.log('2. Fetching from Local DB...');
        const localItems = (db.get(collection) || []).filter(i => i.userId === TEST_USER_ID);
        console.log(`   Found ${localItems.length} local items.`);

        // Merge logic
        const cloudIds = new Set(cloudItems.map(i => i.id));
        const localOnly = localItems.filter(i => !cloudIds.has(i.supabaseId) && !cloudIds.has(i.id));
        const mergedItems = [...cloudItems, ...localOnly];

        console.log(`3. Merged total: ${mergedItems.length}`);
        console.log('Sample of first merged item:', mergedItems[0]);

    } catch (error) {
        console.error('❌ Error during simulation:', error);
    }
}

simulateGetNotes();
