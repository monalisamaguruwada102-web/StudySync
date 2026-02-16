const db = require('./database.cjs');
const supabasePersistence = require('./supabasePersistence.cjs');
require('dotenv').config();

const forceSyncAll = async () => {
    console.log('🚀 Starting Full Cloud Synchronization (Local -> Supabase)...');

    const users = db.get('users');
    const modules = db.get('modules');

    console.log(`📊 Processing ${users.length} users and ${modules.length} modules...`);

    // 1. Sync All Users (including now-unfiltered theme, timer_state, streak)
    for (const user of users) {
        try {
            const synced = await supabasePersistence.upsertProfile(user);
            if (synced) {
                console.log(`✅ Synced User Profile: ${user.email}`);
            } else {
                console.error(`❌ Failed to sync User Profile: ${user.email}`);
            }
        } catch (err) {
            console.error(`❌ Error syncing user ${user.email}:`, err.message);
        }
    }

    // 2. Sync All Modules (including targetHours)
    for (const mod of modules) {
        try {
            const synced = await supabasePersistence.upsertToCollection('modules', mod);
            if (synced) {
                console.log(`✅ Synced Module: ${mod.name}`);
            } else {
                console.error(`❌ Failed to sync Module: ${mod.name}`);
            }
        } catch (err) {
            console.error(`❌ Error syncing module ${mod.name}:`, err.message);
        }
    }

    // 3. Optional: Sync other collections if needed (notes, tasks, logs are usually already synced, but this ensures everything is up to date)
    const collections = ['tasks', 'notes', 'studyLogs', 'flashcardDecks', 'flashcards', 'calendarEvents'];
    const tableMap = {
        studyLogs: 'study_logs',
        flashcardDecks: 'flashcard_decks'
    };

    for (const col of collections) {
        const items = db.get(col) || [];
        const table = tableMap[col] || col;
        console.log(`📦 Syncing ${items.length} items from ${col}...`);
        for (const item of items) {
            try {
                await supabasePersistence.upsertToCollection(table, item);
            } catch (err) {
                console.error(`❌ Error syncing ${col} item ${item.id}:`, err.message);
            }
        }
    }

    console.log('🏁 Cloud Synchronization Complete!');
    process.exit(0);
};

forceSyncAll();
