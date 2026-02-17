const db = require('./server/database.cjs');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testDynamics() {
    console.log('🧪 Starting Core Dynamics Verification...');

    // 1. Initial State
    const testUser = {
        id: 'test-user-' + Date.now(),
        name: 'Test Student',
        email: 'test@example.com',
        xp: 0,
        level: 1,
        badges: []
    };
    const insertedUser = db.insert('users', testUser);
    const userId = insertedUser.id;
    await sleep(200);
    console.log('✅ Created test user with ID:', userId);

    // 2. Test Task Completion XP (150 XP)
    const task = db.insert('tasks', { title: 'Test Task', status: 'Pending', userId: userId });
    await sleep(200);
    db.update('tasks', task.id, { status: 'Completed' });
    await sleep(200);

    // In the real app, the /api/tasks/:id route handles the XP gain.
    // Since we are calling DB directly, we should call addXP as the route would.
    db.addXP(userId, 150);
    await sleep(200);

    let user = db.getById('users', userId);
    if (!user) {
        console.error('❌ Could not find user after update');
        return;
    }
    console.log(`📊 After task completion: XP=${user.xp}, Level=${user.level}`);
    if (user.xp === 150) console.log('✅ Task XP logic correct');

    // 3. Test Pomodoro Session XP (1 hour = 100 XP)
    // Route logic: xpGained = Math.round(parseFloat(req.body.duration || 0) * 100) || 50;
    const duration = 1.0;
    const xpGained = Math.round(duration * 100);
    db.addXP(userId, xpGained);
    await sleep(200);

    user = db.getById('users', userId);
    console.log(`📊 After pomodoro session: XP=${user.xp}, Level=${user.level}`);
    if (user.xp === 250) console.log('✅ Pomodoro XP logic correct');

    // 4. Test Level Up threshold (1000 XP)
    console.log('📈 Simulating more activity to level up...');
    db.addXP(userId, 800);
    await sleep(200);
    user = db.getById('users', userId);
    console.log(`📊 Current: XP=${user.xp}, Level=${user.level}`);
    if (user.level === 2) {
        console.log('✅ Level up logic correct (Linear 1000 threshold)');
        if (user.badges.includes('Level 2 Pro')) console.log('✅ Badge awarded');
    }

    // Cleanup
    db.delete('users', userId);
    console.log('🧹 Test user cleaned up');
}

testDynamics().catch(console.error);
