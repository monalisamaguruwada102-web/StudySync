const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pocuggehxeuheqzgixsx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvY3VnZ2VoeGV1aGVxemdpeHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDU1MzQsImV4cCI6MjA4NTI4MTUzNH0.QjIFMzJ4xf3PNnUbMSUMg8mIyPLis7yI_PuPNZT5CMg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tables = [
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

async function discover() {
    console.log('--- Supabase Data Discovery ---');
    for (const table of tables) {
        try {
            const { data, count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: false });

            if (error) {
                console.log(`Table ${table}: Error - ${error.message}`);
            } else {
                console.log(`Table ${table}: ${data.length} items (Total count: ${count})`);
                if (data.length > 0) {
                    console.log(`  Sample user_id: ${data[0].user_id}`);
                }
            }
        } catch (e) {
            console.log(`Table ${table}: Unexpected error`);
        }
    }
}

discover();
