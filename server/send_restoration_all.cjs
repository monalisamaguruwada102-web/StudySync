const sp = require('./supabasePersistence.cjs');
const { sendRestorationNotification } = require('./emailService.cjs');
require('dotenv').config();

const sendAllRestorationEmails = async () => {
    console.log('🚀 Starting mass restoration notification email trigger (Supabase Mode)...');
    const users = await sp.getAllProfiles() || [];

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
        if (!user.email) {
            console.warn(`⚠️ Skipping user ${user.id}: No email address.`);
            continue;
        }

        try {
            await sendRestorationNotification(user);
            successCount++;
        } catch (error) {
            console.error(`❌ Error sending to ${user.email}:`, error);
            failCount++;
        }
    }

    console.log('--------------------------------------------------');
    console.log(`🏁 Mass notification complete.`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('--------------------------------------------------');
};

sendAllRestorationEmails();
