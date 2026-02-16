const { runWeeklyRetrospectives } = require('./scheduler_utf8.cjs');

async function triggerNow() {
    console.log('🚀 Manually triggering Weekly Academic Retrospectives...');
    try {
        await runWeeklyRetrospectives();
        console.log('✅ Weekly retrospectives sent successfully.');
    } catch (error) {
        console.error('❌ Failed to trigger weekly retrospectives:', error);
    }
}

triggerNow();
