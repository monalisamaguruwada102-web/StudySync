require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { initSupabase, upsertProfile } = require('./supabasePersistence.cjs');
const db = require('./database.cjs');

async function grantBadges() {
    const searchTerm = 'joshuamujakari15';
    console.log(`Searching for user: ${searchTerm}...`);

    // 1. Search locally
    const localUsers = db.get('users');
    const targetLocal = localUsers.find(u =>
        (u.email && u.email.toLowerCase().includes(searchTerm)) ||
        (u.name && u.name.toLowerCase().includes(searchTerm))
    );

    const supabase = initSupabase();
    if (!supabase) {
        console.error("Supabase not initialized");
        process.exit(1);
    }

    // 2. Search in Supabase
    const { data: cloudUsers, error } = await supabase.from('users').select('*');
    const targetCloud = cloudUsers?.find(u =>
        (u.email && u.email.toLowerCase().includes(searchTerm)) ||
        (u.name && u.name.toLowerCase().includes(searchTerm))
    );

    const target = targetLocal || targetCloud;

    if (!target) {
        console.error("User not found locally or in Supabase.");
        process.exit(1);
    }

    console.log(`Found user: ${target.email} (${target.id})`);

    const allBadges = [
        { name: 'Persistence', icon: 'Flame', color: 'purple', earnedAt: new Date().toISOString() },
        { name: 'Scholar', icon: 'Target', color: 'gold', earnedAt: new Date().toISOString() },
        { name: 'Focus King', icon: 'Award', color: 'green', earnedAt: new Date().toISOString() },
        { name: 'Early Bird', icon: 'Zap', color: 'primary', earnedAt: new Date().toISOString() }
    ];

    console.log("Granting all badges...");

    // Update locally
    db.update('users', target.id, { badges: allBadges });

    // Update Supabase
    try {
        await upsertProfile({
            id: target.id,
            email: target.email,
            badges: allBadges
        });
        console.log("✅ Badges granted and synced to Supabase.");
    } catch (err) {
        console.error("❌ Failed to sync badges to Supabase:", err.message);
    }

    process.exit(0);
}

grantBadges();
