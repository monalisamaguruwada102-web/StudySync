const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends a daily study journey report to a user.
 * @param {Object} user User object (email, name, level)
 * @param {Object} report Current study stats and AI predictions
 */
const sendStudyReport = async (user, report) => {
    const { email } = user;
    if (!email) return;

    const mailOptions = {
        from: process.env.SMTP_FROM || `"JOSHWEBS STUDY ASSISTANCE SYSTEM" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Daily Study Journey Report - ${new Date().toLocaleDateString()}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
                <h1 style="color: #6366f1; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 20px;">
                    <b>JOSHWEBS STUDY ASSISTANCE SYSTEM</b>
                </h1>
                
                <p style="font-size: 16px; color: #1e293b;">Hello <b>${user.username || 'Student'}</b>,</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; margin: 20px 0;">
                    <h2 style="color: #4338ca; font-size: 18px; margin-top: 0;">📊 Your Study Journey Yesterday</h2>
                    <ul style="list-style: none; padding: 0; color: #475569;">
                        <li style="margin-bottom: 8px;">⏱️ <b>Hours Studied:</b> ${report.previousDayHours.toFixed(1)}h</li>
                        <li style="margin-bottom: 8px;">🔥 <b>Daily Streak:</b> ${report.streak} Days</li>
                        <li style="margin-bottom: 8px;">🎯 <b>Tasks Completed:</b> ${report.tasksCompleted}</li>
                    </ul>
                </div>

                <div style="background-color: #f5f3ff; padding: 15px; border-radius: 12px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
                    <h2 style="color: #6d28d9; font-size: 18px; margin-top: 0;">🔮 AI Progress Prediction</h2>
                    <p style="color: #4c1d95; line-height: 1.6; font-style: italic;">
                        ${report.prediction}
                    </p>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://www.joshwebs.co.zw" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">CONTINUE YOUR JOURNEY</a>
                </div>

                <hr style="margin-top: 40px; border: 0; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                    This is an automated report from the JOSHWEBS Study Logic Engine. 
                    Manage your notification settings in the StudySync App.
                </p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Study report sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error);
        return false;
    }
};

module.exports = { sendStudyReport };
