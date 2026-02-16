const { runWeeklyTutorials } = require('./scheduler_utf8.cjs');

async function sendTutorialNow() {
    console.log('🚀 Manually triggering Academic Mastery Guide for ALL users...');
    try {
        await runWeeklyTutorials();
        console.log('\n✅ All tutorial guides have been processed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to send tutorial guides:', error);
        process.exit(1);
    }
}

sendTutorialNow();
