// verify_supabase_sync.cjs
// System test to verify what data is in Supabase

require('dotenv').config();
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

const verifySupabaseSync = async () => {
    if (!supabasePersistence.initSupabase()) {
        console.error('❌ Supabase not configured.');
        process.exit(1);
    }

    console.log('🔍 Checking Supabase data...\n');
    console.log('===========================================\n');

    let totalInSupabase = 0;
    let successfulTables = 0;
    let failedTables = 0;

    for (const [localCollection, supabaseTable] of Object.entries(tableMap)) {
        try {
            const cloudItems = await supabasePersistence.fetchAll(supabaseTable) || [];

            if (cloudItems.length > 0) {
                console.log(`✅ ${localCollection.padEnd(20)} → ${cloudItems.length} items in Supabase`);
                totalInSupabase += cloudItems.length;
                successfulTables++;
            } else {
                console.log(`⚪ ${localCollection.padEnd(20)} → 0 items`);
            }
        } catch (error) {
            console.log(`❌ ${localCollection.padEnd(20)} → ERROR: ${error.message}`);
            failedTables++;
        }
    }

    console.log('\n===========================================');
    console.log(`📊 Summary:`);
    console.log(`   Tables with data: ${successfulTables}`);
    console.log(`   Tables with errors: ${failedTables}`);
    console.log(`   Total items in Supabase: ${totalInSupabase}`);
    console.log('===========================================\n');

    if (failedTables > 0) {
        console.warn('⚠️  Some tables have errors. This likely means:');
        console.warn('   1. The SQL schema (complete_schema_v4.sql) hasn\'t been run');
        console.warn('   2. Or the tables don\'t exist in Supabase yet\n');
    }

    if (totalInSupabase > 0) {
        console.log('✅ Supabase is connected and has data!');
    } else {
        console.log('⚠️  No data found in Supabase. Run the migration after applying the schema.');
    }
};

verifySupabaseSync().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
});
