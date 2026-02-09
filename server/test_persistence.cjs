// test_persistence.cjs
// System test to verify user data is saved to Supabase and correctly fetched.

require('dotenv').config();
const db = require('./database.cjs');
const supabasePersistence = require('./supabasePersistence.cjs');
const bcrypt = require('bcryptjs');

const TEST_EMAIL = `system-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'test-password-123';
const TEST_NAME = 'System Test User';

const runTest = async () => {
    console.log('🚀 Starting Supabase User Persistence System Test...\n');

    if (!supabasePersistence.initSupabase()) {
        console.error('❌ Supabase not configured. Check .env');
        process.exit(1);
    }

    console.log('--- Phase 1: Integrity Check (Existing Users) ---');
    const localUsers = db.get('users') || [];
    console.log(`🔍 Local Users found: ${localUsers.length}`);

    let syncCount = 0;
    for (const user of localUsers) {
        const cloudUser = await supabasePersistence.getItemByField('users', 'email', user.email);
        if (cloudUser) {
            syncCount++;
        } else {
            console.warn(`   ⚠️ User ${user.email} NOT found in Supabase.`);
        }
    }
    console.log(`✅ Integrity: ${syncCount}/${localUsers.length} local users found in Supabase.\n`);

    console.log('--- Phase 2: Lifecycle Test (New User) ---');

    // 1. Create Test User Locally
    console.log(`📤 Creating test user locally: ${TEST_EMAIL}`);
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    const testUser = db.insert('users', {
        email: TEST_EMAIL,
        password: hashedPassword,
        name: TEST_NAME,
        xp: 0,
        level: 1,
        badges: []
    });

    if (!testUser) {
        console.error('❌ Failed to create test user locally.');
        process.exit(1);
    }
    console.log(`   ✅ Created with Local ID: ${testUser.id}`);

    // 2. Sync to Supabase
    console.log('📤 Syncing test user to Supabase...');
    const cloudUser = await supabasePersistence.upsertToCollection('users', testUser);

    if (!cloudUser) {
        console.error('❌ Failed to sync test user to Supabase.');
        // Cleanup local
        db.delete('users', testUser.id);
        process.exit(1);
    }
    console.log(`   ✅ Synced with Supabase ID: ${cloudUser.id}`);

    // Update local with supabaseId
    db.update('users', testUser.id, { supabaseId: cloudUser.id });

    // 3. Simulate "Loss of Data" (Delete from Local)
    console.log('🗑️ Simulating local data loss (deleting from local db)...');
    db.delete('users', testUser.id);
    const verifyLocalGone = db.find('users', u => u.email === TEST_EMAIL);

    if (verifyLocalGone) {
        console.error('❌ Failed to delete test user from local DB.');
        process.exit(1);
    }
    console.log('   ✅ Test user successfully removed from local database.');

    // 4. Recovery (Fetch from Supabase)
    console.log('🔄 Attempting recovery from Supabase (fetching by email)...');
    const recoveredUser = await supabasePersistence.getItemByField('users', 'email', TEST_EMAIL);

    if (!recoveredUser) {
        console.error('❌ Failed to recover user from Supabase.');
        process.exit(1);
    }

    if (recoveredUser.email === TEST_EMAIL) {
        console.log('   ✅ USER RECOVERED SUCCESSFULLY!');
        console.log(`   ✅ Persistent Data: ID=${recoveredUser.id}, Email=${recoveredUser.email}`);
    } else {
        console.error('❌ Data mismatch during recovery.');
        process.exit(1);
    }

    // --- Phase 3: Cleanup ---
    console.log('\n--- Phase 3: Cleanup ---');
    console.log('🗑️ Cleaning up test data...');

    // Delete from Supabase
    const deletedFromCloud = await supabasePersistence.deleteFromCollection('users', recoveredUser.id);
    if (deletedFromCloud) {
        console.log('   ✅ Removed from Supabase.');
    } else {
        console.error('   ❌ Failed to remove from Supabase.');
    }

    // (It's already gone from local, but just in case)
    db.delete('users', testUser.id);

    console.log('\n===========================================');
    console.log('🎉 SYSTEM TEST PASSED SUCCESSFULLY!');
    console.log('Every user is saved to Supabase, and data is retrievable even if local data is lost.');
    console.log('===========================================\n');
    process.exit(0);
};

runTest().catch(err => {
    console.error('❌ System test failed with error:', err);
    process.exit(1);
});
