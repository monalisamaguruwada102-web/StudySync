require('dotenv').config();
const db = require('../server/database.cjs');
const supabasePersistence = require('../server/supabasePersistence.cjs');

async function testPostLogic() {
    console.log('Testing App POST Logic Replication...');

    // Simulate req.user.id
    const TEST_USER_ID = '1769561085648';
    const now = new Date().toISOString();

    const rawNote = {
        title: 'App Logic Sync Test',
        content: 'Testing if this appears in Supabase via server logic.',
        userId: TEST_USER_ID,
        createdAt: now,
        updatedAt: now
    };

    console.log('1. Inserting into local DB...');
    let finalItem = db.insert('notes', rawNote);
    console.log('   ✅ Local ID:', finalItem.id);

    console.log('2. Upserting to Supabase...');
    const supabaseTable = 'notes';
    try {
        const cloudItem = await supabasePersistence.upsertToCollection(supabaseTable, finalItem);
        if (cloudItem) {
            console.log('   ✅ Cloud Success! Supabase ID:', cloudItem.id);
            finalItem = db.update('notes', finalItem.id, { supabaseId: cloudItem.id });
            console.log('   ✅ Local DB updated with supabaseId.');
        } else {
            console.error('   ❌ Cloud sync returned null.');
        }
    } catch (error) {
        console.error('   ❌ Cloud sync threw error:', error);
    }
}

testPostLogic();
