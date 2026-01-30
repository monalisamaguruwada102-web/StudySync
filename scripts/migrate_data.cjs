const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from src/services/firestoreService.js
const SUPABASE_URL = 'https://pocuggehxeuheqzgixsx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvY3VnZ2VoeGV1aGVxemdpeHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDU1MzQsImV4cCI6MjA4NTI4MTUzNH0.QjIFMzJ4xf3PNnUbMSUMg8mIyPLis7yI_PuPNZT5CMg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Joshua Mujakari's ID from server/db.json
const TARGET_USER_ID = '1769561085648';

const collections = [
    'modules',
    'study_logs',
    'tasks',
    'notes',
    'grades',
    'flashcard_decks',
    'flashcards',
    'calendar_events',
    'pomodoro_sessions'
];

async function migrate() {
    console.log(`Starting migration to User ID: ${TARGET_USER_ID}`);

    for (const collection of collections) {
        try {
            console.log(`Checking ${collection}...`);

            // 1. Get items with NULL user_id
            const { data: items, error: fetchError } = await supabase
                .from(collection)
                .select('*')
                .is('user_id', null);

            if (fetchError) {
                console.error(`Error fetching ${collection}:`, fetchError.message);
                continue;
            }

            if (!items || items.length === 0) {
                console.log(`  No orphaned items in ${collection}.`);
                continue;
            }

            console.log(`  Found ${items.length} orphaned items in ${collection}. Migrating...`);

            // 2. Update them
            const { error: updateError } = await supabase
                .from(collection)
                .update({ user_id: TARGET_USER_ID })
                .is('user_id', null);

            if (updateError) {
                console.error(`  Error updating ${collection}:`, updateError.message);
            } else {
                console.log(`  ✅ Successfully migrated ${collection}.`);
            }

        } catch (e) {
            console.error(`  Unexpected error processing ${collection}:`, e);
        }
    }

    console.log('Migration complete.');
}

migrate();
