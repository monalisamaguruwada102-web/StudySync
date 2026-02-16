const { sendTutorialGuide } = require('./emailService.cjs');
const db = require('./database.cjs');

async function sendSpecific() {
    const targetEmail = 'maguruwadamonalisa@gmail.com';
    console.log(`🚀 Sending Academic Mastery Guide to ${targetEmail}...`);

    // Create a minimal user object since we might not have them in DB
    const user = {
        email: targetEmail,
        name: 'Monalisa'
    };

    try {
        await sendTutorialGuide(user);
        console.log(`\n✅ Tutorial guide sent to ${targetEmail}`);
        process.exit(0);
    } catch (error) {
        console.error(`❌ Failed to send:`, error);
        process.exit(1);
    }
}

sendSpecific();
