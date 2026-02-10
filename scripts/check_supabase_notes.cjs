require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkNotes() {
    console.log('Checking Supabase Notes...');
    const { data, error } = await supabase.from('notes').select('*');
    if (error) {
        console.error('Error fetching notes:', error);
    } else {
        console.log(`Found ${data.length} notes in Supabase.`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkNotes();
