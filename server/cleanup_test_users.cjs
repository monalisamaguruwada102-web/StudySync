// cleanup_test_users.cjs
// Script to remove test user accounts from db.json and Supabase

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabasePersistence = require('./supabasePersistence.cjs');

const DB_PATH = path.join(__dirname, 'db.json');

const cleanupTestUsers = async () => {
    console.log('🧹 Cleaning up test users...\n');

    // Read current database
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const users = dbData.users || [];

    // Identify test users (emails containing 'test' or 'example.com')
    const testUsers = users.filter(u =>
        u.email.toLowerCase().includes('test') ||
        u.email.toLowerCase().includes('example.com')
    );

    const realUsers = users.filter(u =>
        !u.email.toLowerCase().includes('test') &&
        !u.email.toLowerCase().includes('example.com')
    );

    if (testUsers.length === 0) {
        console.log('✅ No test users found. Database is clean!');
        return;
    }

    console.log(`Found ${testUsers.length} test users:`);
    testUsers.forEach(u => console.log(`  - ${u.email}`));
    console.log('');

    // Remove test users from local database
    dbData.users = realUsers;
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2));
    console.log(`✅ Removed ${testUsers.length} test users from local database\n`);

    // Remove test users from Supabase
    if (supabasePersistence.initSupabase()) {
        let supabaseDeleteCount = 0;
        for (const testUser of testUsers) {
            try {
                if (testUser.supabaseId || testUser.id) {
                    await supabasePersistence.deleteFromCollection('users', testUser.supabaseId || testUser.id);
                    supabaseDeleteCount++;
                }
            } catch (error) {
                console.error(`⚠️ Failed to delete ${testUser.email} from Supabase:`, error.message);
            }
        }
        console.log(`✅ Removed ${supabaseDeleteCount} test users from Supabase\n`);
    } else {
        console.log('⚠️ Supabase not configured, skipping cloud cleanup\n');
    }

    console.log('===========================================');
    console.log(`✅ Cleanup Complete!`);
    console.log(`   Remaining users: ${realUsers.length}`);
    realUsers.forEach(u => console.log(`   - ${u.email}`));
    console.log('===========================================\n');
};

cleanupTestUsers().catch(error => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
});
