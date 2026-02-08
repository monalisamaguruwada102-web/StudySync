// migrate_to_supabase.cjs
// One-time script to push ALL existing local data to Supabase
// Run this after applying the complete_schema_v4.sql migration

require('dotenv').config();
const db = require('./database.cjs');
const supabasePersistence = require('./supabasePersistence.cjs');

const tableMap = {
    'users': 'users',
    'modules': 'modules',
    'studyLogs': 'study_logs',
    'tasks': 'tasks',
    'notes': 'notes',
    'grades': 'grades',
    'flashcardDecks': 'flashcard_decks',
    'flashcards': 'flashcards',
    'calendarEvents': 'calendar_events',
    'pomodoroSessions': 'pomodoro_sessions',
    'tutorials': 'tutorials',
    'conversations': 'conversations',
    'messages': 'messages',
    'groups': 'groups'
};

const migrateToSupabase = async () => {
    if (!supabasePersistence.initSupabase()) {
        console.error('❌ Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY.');
        process.exit(1);
    }

    console.log('🚀 Starting one-time migration to Supabase...\n');

    let totalMigrated = 0;
    let totalErrors = 0;

    for (const [localCollection, supabaseTable] of Object.entries(tableMap)) {
        try {
            const localItems = db.get(localCollection) || [];

            if (localItems.length === 0) {
                console.log(`⚪ ${localCollection}: No items to migrate`);
                continue;
            }

            console.log(`📤 Migrating ${localItems.length} items from ${localCollection} to ${supabaseTable}...`);

            let migrated = 0;
            let errors = 0;

            for (const item of localItems) {
                try {
                    const result = await supabasePersistence.upsertToCollection(supabaseTable, item);
                    if (result) {
                        // Update local item with supabaseId for tracking
                        if (!item.supabaseId) {
                            db.update(localCollection, item.id, { supabaseId: result.id });
                        }
                        migrated++;
                    } else {
                        console.warn(`   ⚠️  Failed to upsert item ${item.id}`);
                        errors++;
                    }
                } catch (itemError) {
                    console.error(`   ❌ Error migrating item ${item.id}:`, itemError.message);
                    errors++;
                }
            }

            console.log(`   ✅ Migrated ${migrated}/${localItems.length} items (${errors} errors)\n`);
            totalMigrated += migrated;
            totalErrors += errors;

        } catch (collectionError) {
            console.error(`❌ Failed to migrate ${localCollection}:`, collectionError.message);
            totalErrors++;
        }
    }

    console.log('\n===========================================');
    console.log(`✅ Migration Complete!`);
    console.log(`   Total items migrated: ${totalMigrated}`);
    console.log(`   Total errors: ${totalErrors}`);
    console.log('===========================================\n');

    if (totalErrors > 0) {
        console.warn('⚠️  Some items failed to migrate. Check the errors above.');
        process.exit(1);
    } else {
        console.log('🎉 All data successfully migrated to Supabase!');
        process.exit(0);
    }
};

// Run migration
migrateToSupabase().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
