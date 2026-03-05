require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { initSupabase } = require('./supabasePersistence.cjs');

async function findUUID() {
    const email = 'joshuamujakari15@gmail.com';
    const supabase = initSupabase();
    if (!supabase) {
        console.error("Supabase not initialized");
        process.exit(1);
    }

    console.log(`Searching for '${email}' in Supabase...`);

    // 1. Try finding in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.warn('Auth list error (probably no admin perms):', authError.message);
    } else {
        const authUser = authData.users.find(u => u.email === email);
        if (authUser) {
            console.log(`Found in Auth! UUID: ${authUser.id}`);
        }
    }

    // 2. Try finding in 'users' table
    const { data: users, error: tableError } = await supabase.from('users').select('*').eq('email', email);
    if (tableError) {
        console.error('Table error:', tableError.message);
    } else {
        if (users && users.length > 0) {
            console.log(`Found in 'users' table! ID: ${users[0].id}`);
        }
    }

    process.exit(0);
}

findUUID();
