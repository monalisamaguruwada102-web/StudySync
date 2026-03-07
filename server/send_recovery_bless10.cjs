// Password recovery email script for blesse10dchiwaye@gmail.com
require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

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

const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

async function resetAndSend() {
    // Find user (case-insensitive)
    const userIndex = db.users.findIndex(u => u.email.toLowerCase() === 'blesse10dchiwaye@gmail.com');
    if (userIndex === -1) {
        console.log('User not found in DB');
        return;
    }

    const targetEmail = db.users[userIndex].email; // use exact case from DB
    const userName = db.users[userIndex].name || targetEmail.split('@')[0];
    const newPassword = 'StudySync2025!';
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update DB
    db.users[userIndex].password = hashed;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('Password updated in local DB for:', targetEmail);

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: targetEmail,
        subject: 'StudySync - Password Reset by Admin',
        html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">StudySync</h1>
            <p style="margin: 6px 0 0; color: #dbeafe; font-size: 14px;">Excellence through Consistency</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">Password Reset 🔐</h2>
            <p style="color: #94a3b8; line-height: 1.7;">Hi <strong style="color: #f8fafc;">${userName}</strong>,</p>
            <p style="color: #94a3b8; line-height: 1.7;">Your account password has been reset by the StudySync admin. Here is your new temporary password:</p>
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Temporary Password</p>
              <p style="margin: 8px 0 0; font-size: 26px; font-weight: 800; color: #3b82f6; letter-spacing: 0.05em;">${newPassword}</p>
            </div>
            <p style="color: #f87171; font-weight: 600;">⚠️ Please log in immediately and change this password in your Settings.</p>
            <div style="margin-top: 28px; text-align: center;">
              <a href="https://www.joshwebs.co.zw/study/" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; display: inline-block;">Log In Now</a>
            </div>
            <p style="margin-top: 28px; font-size: 12px; color: #475569; text-align: center;">If you did not request this, please contact support immediately.</p>
          </div>
        </div>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Recovery email sent successfully! ID:', info.messageId);
    } catch (e) {
        console.error('❌ Email failed to send:', e.message);
        console.log('The temporary password is:', newPassword, '(password was still reset in DB)');
    }
}
resetAndSend();
