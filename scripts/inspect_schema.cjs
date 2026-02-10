require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function checkSchema() {
    console.log('--- NOTES TABLE ---');
    try {
        const { data: noteCols, error: err1 } = await supabase.from('notes').select('*').limit(1);
        if (noteCols && noteCols.length > 0) {
            console.log('Sample Note Keys:', Object.keys(noteCols[0]));
        } else {
            console.log('No rows in notes table or fetch failed:', err1?.message);
        }
    } catch (e) { console.error(e.message); }

    console.log('\n--- USERS TABLE ---');
    try {
        const { data: userCols, error: err2 } = await supabase.from('users').select('*').limit(1);
        if (userCols && userCols.length > 0) {
            console.log('Sample User Keys:', Object.keys(userCols[0]));
        } else {
            console.log('No rows in users table or fetch failed:', err2?.message);
        }
    } catch (e) { console.error(e.message); }

    console.log('\n--- PROFILES TABLE ---');
    try {
        const { data: profCols, error: err3 } = await supabase.from('profiles').select('*').limit(1);
        if (profCols && profCols.length > 0) {
            console.log('Sample Profile Keys:', Object.keys(profCols[0]));
        } else {
            console.log('No rows in profiles table or fetch failed:', err3?.message);
        }
    } catch (e) { console.error(e.message); }
}

checkSchema();
