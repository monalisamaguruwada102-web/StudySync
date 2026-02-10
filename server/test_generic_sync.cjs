// server/test_generic_sync.cjs
require('dotenv').config();
const db = require('./database.cjs');
const supabasePersistence = require('./supabasePersistence.cjs');

const runTest = async () => {
    console.log('🚀 Starting Generic Sync Verification Test...\n');

    if (!supabasePersistence.initSupabase()) {
        console.error('❌ Supabase not configured. Check .env');
        process.exit(1);
    }

    const TEST_NOTE_ID = `test-note-${Date.now()}`;
    const TEST_USER_ID = '1769561085648';

    try {
        // 1. Create a test note locally
        console.log(`📝 Creating test note: ${TEST_NOTE_ID}`);
        const testNote = db.insert('notes', {
            id: TEST_NOTE_ID,
            userId: TEST_USER_ID,
            title: 'Sync Test Note',
            content: 'This note should be synced to the cloud.'
        });

        // 2. Mock a sync (manually calling upsert)
        console.log('📤 Syncing note to Supabase...');
        const cloudNote = await supabasePersistence.upsertToCollection('notes', testNote);
        if (!cloudNote) throw new Error('Cloud sync failed');
        console.log(`   ✅ Synced with Supabase ID: ${cloudNote.id}`);

        // 3. Clear local note to simulate data loss
        console.log('🗑️ Clearing local note to simulate data loss...');
        db.delete('notes', TEST_NOTE_ID);
        if (db.getById('notes', TEST_NOTE_ID)) throw new Error('Local delete failed');

        // 4. Restore from Cloud
        console.log('🔄 Restoring from Supabase...');
        const allCloudNotes = await supabasePersistence.fetchAll('notes');
        const recoveredNote = allCloudNotes.find(n => n.id === TEST_NOTE_ID);

        if (recoveredNote) {
            console.log('   ✅ recoveredNote found in fetchAll');
            db.insert('notes', { ...recoveredNote, supabaseId: recoveredNote.id });
        } else {
            throw new Error('Note not found in cloud');
        }

        // 5. Final check
        const finalNote = db.getById('notes', TEST_NOTE_ID);
        if (finalNote && finalNote.title === 'Sync Test Note') {
            console.log('\n===========================================');
            console.log('🎉 GENERIC SYNC TEST PASSED!');
            console.log('===========================================\n');
        } else {
            throw new Error('Final data mismatch');
        }

        // Cleanup
        console.log('🗑️ Cleaning up...');
        await supabasePersistence.deleteFromCollection('notes', recoveredNote.id);
        db.delete('notes', TEST_NOTE_ID);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
    process.exit(0);
};

runTest();
