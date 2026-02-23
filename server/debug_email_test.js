
const nodemailer = require('nodemailer');
require('dotenv').config();
const { runDailyReports } = require('./scheduler_utf8.cjs');
const db = require('./database.cjs');

async function testEmail() {
    console.log('--- Email Debugger ---');
    console.log('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '***' : 'MISSING',
        pass: process.env.SMTP_PASS ? '***' : 'MISSING'
    });

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        family: 4
    });

    try {
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error);
        return;
    }

    console.log('\n--- Testing Scheduler Logic ---');
    const users = db.get('users');
    console.log(`Found ${users.length} users in database.`);

    if (users.length > 0) {
        // Mocking console.log to capture output
        const originalLog = console.log;

        console.log('Triggering runDailyReports manually...');
        try {
            await runDailyReports();
            console.log('✅ runDailyReports completed execution.');
        } catch (err) {
            console.error('❌ runDailyReports failed:', err);
        }
    } else {
        console.log('⚠️ No users found to test scheduler.');
    }
}

testEmail();
