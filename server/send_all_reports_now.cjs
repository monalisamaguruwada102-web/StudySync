const { runDailyReports } = require('./scheduler_utf8.cjs');

async function sendAllNow() {
    console.log('🚀 Triggering manual study reports for ALL users...');
    try {
        await runDailyReports();
        console.log('\n✅ All reports have been processed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to send reports:', error);
        process.exit(1);
    }
}

sendAllNow();
