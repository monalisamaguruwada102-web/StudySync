const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // Force IPv4 to avoid ENETUNREACH errors on some systems (common with Windows/Gmail)
    family: 4
});

/**
 * Sends a daily study report email to a user.
 */
const sendStudyReport = async (user, stats) => {
    const email = user.email;
    if (!email) {
        console.warn(`⚠️ Cannot send study report: User ${user.id} has no email.`);
        return;
    }

    const { previousDayHours, streak, tasksCompleted, activeModules, prediction, level, xp, pendingTasks, upcomingEvents } = stats;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync" <no-reply@studysync.app>',
        to: email,
        subject: `Your Daily Study Report - ${new Date().toLocaleDateString()}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">StudySync</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; color: #dbeafe;">Excellence through Consistency</p>
                </div>
                
                <div style="padding: 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Good Morning, ${user.name || 'Student'}! ☀️</h2>
                        <p style="margin: 10px 0 0 0; line-height: 1.6; color: #94a3b8; font-size: 16px;">Ready to crush your goals today?</p>
                    </div>

                    <!-- Level & XP Section -->
                    <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 25px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 14px; font-weight: 600; color: #3b82f6;">LEVEL ${level}</span>
                            <span style="font-size: 12px; font-weight: 600; color: #64748b;">${xp} / ${level * 1000} XP</span>
                        </div>
                        <div style="height: 8px; background-color: #0f172a; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${(xp / (level * 1000) * 100).toFixed(0)}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 4px;"></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px;">
                        <div style="flex: 1; min-width: 140px; background-color: #1e293b; padding: 15px; border-radius: 10px; border: 1px solid #334155; text-align: center;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">${stats.isYesterdayInactive ? 'Weekly Momentum' : "Yesterday's Focus"}</div>
                            <div style="font-size: 24px; font-weight: 800; color: #3b82f6;">${stats.isYesterdayInactive ? stats.weeklyHours.toFixed(1) : previousDayHours.toFixed(1)}h</div>
                        </div>
                        <div style="flex: 1; min-width: 140px; background-color: #1e293b; padding: 15px; border-radius: 10px; border: 1px solid #334155; text-align: center;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">Current Streak</div>
                            <div style="font-size: 24px; font-weight: 800; color: #10b981;">${streak} 🔥</div>
                        </div>
                        <div style="flex: 1; min-width: 140px; background-color: #1e293b; padding: 15px; border-radius: 10px; border: 1px solid #334155; text-align: center;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">${stats.isYesterdayInactive ? 'Last Study' : 'Tasks Done'}</div>
                            <div style="font-size: ${stats.isYesterdayInactive ? '14px' : '24px'}; font-weight: 800; color: #f59e0b; padding-top: ${stats.isYesterdayInactive ? '8px' : '0'};">${stats.isYesterdayInactive ? stats.lastSessionDate : tasksCompleted}</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                        <!-- Pending Tasks -->
                        <div style="background-color: #1e293b; padding: 18px; border-radius: 12px; border: 1px solid #334155;">
                            <h3 style="margin-top: 0; font-size: 14px; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em;">Priority Tasks</h3>
                            <ul style="padding: 0; margin: 10px 0 0 0; list-style: none;">
                                ${pendingTasks.length > 0 ? pendingTasks.map(t => `
                                    <li style="font-size: 13px; color: #cbd5e1; margin-bottom: 8px; border-left: 2px solid #3b82f6; padding-left: 10px;">
                                        <strong>${t.title}</strong><br/>
                                        <span style="font-size: 11px; color: #64748b;">Due: ${t.dueDate || 'No Date'}</span>
                                    </li>
                                `).join('') : '<li style="font-size: 13px; color: #64748b; font-style: italic;">All tasks clear! ✅</li>'}
                            </ul>
                        </div>

                        <!-- Upcoming Events -->
                        <div style="background-color: #1e293b; padding: 18px; border-radius: 12px; border: 1px solid #334155;">
                            <h3 style="margin-top: 0; font-size: 14px; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em;">Next 48 Hours</h3>
                            <ul style="padding: 0; margin: 10px 0 0 0; list-style: none;">
                                ${upcomingEvents.length > 0 ? upcomingEvents.map(e => `
                                    <li style="font-size: 13px; color: #cbd5e1; margin-bottom: 8px; border-left: 2px solid #10b981; padding-left: 10px;">
                                        <strong>${e.title}</strong><br/>
                                        <span style="font-size: 11px; color: #64748b;">${new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </li>
                                `).join('') : '<li style="font-size: 13px; color: #64748b; font-style: italic;">No upcoming events.</li>'}
                            </ul>
                        </div>
                    </div>

                    <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #3b82f633; position: relative;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em;">Strategic Progress Analysis</h3>
                        <p style="margin: 10px 0 0 0; font-style: italic; color: #cbd5e1; line-height: 1.7; font-size: 14px;">"${prediction}"</p>
                    </div>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="https://www.joshwebs.co.zw/study" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">GO TO DASHBOARD</a>
                    </div>
                </div>

                <div style="background-color: #020617; padding: 25px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="margin: 0; font-size: 12px; color: #475569;">&copy; 2026 StudySync by JOSHWEBS</p>
                    <div style="margin-top: 10px;">
                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 11px; margin: 0 10px;">Settings</a>
                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 11px; margin: 0 10px;">Unsubscribe</a>
                    </div>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Daily report email sent to ${email}: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Failed to send daily report email to ${email}:`, error);
    }
};

/**
 * Sends a weekly mastery guide email to a user.
 */
const sendTutorialGuide = async (user) => {
    const email = user.email;
    if (!email) {
        console.warn(`⚠️ Cannot send tutorial guide: User ${user.id} has no email.`);
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync" <no-reply@studysync.app>',
        to: email,
        subject: `Academic Mastery Guide: Master StudySync Like a Pro 🚀`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">Academic Mastery Guide</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; color: #e0e7ff;">Your Comprehensive Tutorial to JOSHWEBS STUDY SYNC</p>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 16px; line-height: 1.7; color: #cbd5e1; margin-bottom: 30px;">
                        Hello <strong>${user.name || 'Student'}</strong>,<br/><br/>
                        Welcome to your weekly mastery guide. To help you get the most out of your academic journey, we've outlined the core features of the StudySync platform from start to finish.
                    </p>

                    <!-- Core Steps -->
                    <div style="margin-bottom: 40px;">
                        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                            <div style="flex: 0 0 40px; height: 40px; background-color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white;">1</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #60a5fa;">Interactive Module Mapping</h3>
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Start by adding your modules in the "Journey Map". Use the <strong>Knowledge Graph</strong> to visualize connections between your subjects and track your completion status in 3D.</p>
                            </div>
                        </div>

                        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                            <div style="flex: 0 0 40px; height: 40px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white;">2</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #34d399;">Smart Notes & Spaced Repetition</h3>
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Create rich-text notes for every module. Each note can be converted into <strong>Flashcards</strong>. Use the <strong>Spaced Repetition</strong> system to ensure you retain complex information forever.</p>
                            </div>
                        </div>

                        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                            <div style="flex: 0 0 40px; height: 40px; background-color: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white;">3</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #fbbf24;">Pomodoro Productivity</h3>
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Use the built-in <strong>Pomodoro Timer</strong> to stay focused. Every session you complete earns you 100 XP/hour and builds your study streak!</p>
                            </div>
                        </div>

                        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                            <div style="flex: 0 0 40px; height: 40px; background-color: #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white;">4</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #a78bfa;">Collaborative Chat</h3>
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Don't study alone. Use the <strong>Chat Platform</strong> to share notes, tutorials, and tasks with your peers in real-time. Teamwork makes the dream work.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Pro Tip -->
                    <div style="background-color: #1e293b; padding: 25px; border-radius: 12px; border: 1px solid #3b82f633; margin-bottom: 35px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.05em;">Pro Tip: Daily Reports</h4>
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">Check your inbox every morning at 08:00 AM for your <strong>Daily Study Report</strong>. It contains AI-powered analysis of your progress and helps you plan your next move!</p>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="https://www.joshwebs.co.zw/study" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); color: white; padding: 16px 45px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);">LAUNCH DASHBOARD</a>
                    </div>
                </div>

                <div style="background-color: #020617; padding: 30px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="margin: 0; font-size: 13px; color: #64748b;">This guide is part of your JOSHWEBS STUDY ASSISTANCE SYSTEM subscription.</p>
                    <p style="margin: 10px 0 0 0; font-size: 11px; color: #475569;">&copy; 2026 JOSHWEBS. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Tutorial guide email sent to ${email}: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Failed to send tutorial guide email to ${email}:`, error);
    }
};

/**
 * Sends an active recall flashcard snippet email.
 */
const sendActiveRecallSnippet = async (user, card, srCount) => {
    const email = user.email;
    if (!email) return;

    const questionSnippet = (card.question || "New Flashcard").substring(0, 30);
    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync" <no-reply@studysync.app>',
        to: email,
        subject: `Your Daily Active Recall: ${questionSnippet}... 🧠`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h2 style="margin: 0; color: white;">Daily Active Recall</h2>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Test Your Knowledge</p>
                    <div style="background-color: #1e293b; padding: 40px; border-radius: 15px; border: 1px dashed #34d399; margin: 20px 0;">
                        <h1 style="font-size: 24px; color: #ffffff; line-height: 1.4;">${card.question}</h1>
                    </div>
                    <p style="color: #cbd5e1; font-style: italic; margin-bottom: 30px;">Can you remember the answer? Head to your dashboard to reveal and check your cards.</p>
                    
                    ${srCount > 0 ? `
                    <div style="background-color: #064e3b; color: #34d399; padding: 15px; border-radius: 8px; font-weight: 700; margin-bottom: 30px;">
                        ⚠️ You have ${srCount} other cards due for review today!
                    </div>
                    ` : ''}

                    <a href="https://www.joshwebs.co.zw/study/flashcards" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700;">REVEAL ANSWER</a>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Active recall snippet sent to ${email}`);
    } catch (error) {
        console.error(`❌ Failed to send active recall snippet to ${email}:`, error);
    }
};

/**
 * Sends a high-priority deadline alert with study advice.
 */
const sendDeadlineAlert = async (user, task, advice) => {
    const email = user.email;
    if (!email) return;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync" <no-reply@studysync.app>',
        to: email,
        subject: `URGENT: ${task.title} is due in 3 days! ⏰`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                    <h2 style="margin: 0; color: white;">Due Diligence Alert</h2>
                </div>
                <div style="padding: 30px;">
                    <h3 style="color: #fbbf24; margin-top: 0;">Countdown: 3 Days Remaining</h3>
                    <div style="background-color: #1e293b; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin-bottom: 25px;">
                        <h1 style="font-size: 20px; margin: 0;">${task.title}</h1>
                        <p style="color: #94a3b8; margin: 5px 0 0 0;">Deadline: ${new Date(task.due_date || task.dueDate).toLocaleDateString()}</p>
                    </div>

                    <h4 style="color: #60a5fa; text-transform: uppercase; font-size: 13px;">Elite Coach Advice:</h4>
                    <p style="color: #cbd5e1; line-height: 1.7; font-style: italic; background-color: #0f172a; padding: 15px; border-radius: 8px;">
                        "${advice}"
                    </p>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="https://www.joshwebs.co.zw/study" style="background-color: #f59e0b; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 700;">START INTENSIVE REVISION</a>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Deadline alert sent to ${email}`);
    } catch (error) {
        console.error(`❌ Failed to send deadline alert to ${email}:`, error);
    }
};

/**
 * Sends a milestone reward or streak repair email.
 */
const sendMilestoneReward = async (user, type, data) => {
    const email = user.email;
    if (!email) return;

    let subject = '';
    let content = '';
    let color = '';

    if (type === 'LEVEL_UP') {
        subject = `CONGRATULATIONS! You've reached Level ${data.level}! 🏆`;
        color = 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)';
        content = `
            <div style="text-align: center; padding: 40px 20px;">
                <h1 style="font-size: 50px; margin: 0;">🏆</h1>
                <h1 style="color: white; margin: 10px 0;">LEVEL ${data.level} UNLOCKED</h1>
                <p style="color: #e9d5ff; font-size: 18px;">Mastery of the system is within your reach.</p>
                <div style="margin: 30px 0; border: 2px solid #8b5cf6; padding: 30px; border-radius: 15px;">
                    <h2 style="color: #a78bfa; margin: 0;">Academic Certificate</h2>
                    <p style="color: white;">Awarded to <strong>${user.name || user.email}</strong></p>
                    <p style="color: #94a3b8; font-size: 12px;">Earned through elite consistency: ${data.xp} Total XP</p>
                </div>
            </div>
        `;
    } else if (type === 'STREAK_REPAIR') {
        subject = `Don't Lose Your Momentum! Streak Repair Inside 🎁`;
        color = 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)';
        content = `
            <div style="text-align: center; padding: 40px 20px;">
                <h1 style="font-size: 50px; margin: 0;">💝</h1>
                <h1 style="color: white; margin: 10px 0;">STREAK REPAIR OFFER</h1>
                <p style="color: #fbcfe8; font-size: 16px;">We noticed you missed a day, but your hard work shouldn't disappear.</p>
                <div style="background-color: #1e293b; padding: 25px; border-radius: 12px; margin: 25px 0;">
                    <p style="color: #cbd5e1; line-height: 1.6;">Log in within the next <strong>2 hours</strong> and complete one 25-minute study session to restore your streak!</p>
                </div>
            </div>
        `;
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync" <no-reply@studysync.app>',
        to: email,
        subject: subject,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="background: ${color}; padding: 10px; text-align: center;"></div>
                ${content}
                <div style="text-align: center; padding-bottom: 40px;">
                    <a href="https://www.joshwebs.co.zw/study" style="background-color: white; color: #1e293b; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 800;">CLAIM REWARD</a>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Milestone Reward (${type}) sent to ${email}`);
    } catch (error) {
        console.error(`❌ Failed to send milestone reward to ${email}:`, error);
    }
};

/**
 * Sends a comprehensive Weekly Academic Retrospective email.
 */
const sendWeeklyRetrospective = async (user, analytics) => {
    const email = user.email;
    if (!email) return;

    const { dailyXP, masteryMap, peakHour, totalTasks, totalHours } = analytics;

    // Generate SVG for XP Growth Curve
    const maxXP = Math.max(...dailyXP.map(d => d.xp), 100);
    const width = 500;
    const height = 150;
    const padding = 20;

    const points = dailyXP.map((d, i) => {
        const x = (i * (width - padding * 2) / (dailyXP.length - 1)) + padding;
        const y = height - ((d.xp / maxXP) * (height - padding * 2)) - padding;
        return `${x},${y}`;
    }).join(' ');

    const polyline = `<polyline points="${points}" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    const dots = dailyXP.map((d, i) => {
        const x = (i * (width - padding * 2) / (dailyXP.length - 1)) + padding;
        const y = height - ((d.xp / maxXP) * (height - padding * 2)) - padding;
        return `<circle cx="${x}" cy="${y}" r="4" fill="#6366f1" />`;
    }).join('');

    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync" <no-reply@studysync.app>',
        to: email,
        subject: `Weekly Academic Retrospective: Your Progress Deep-Dive 📊`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid #3730a3;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">Weekly Retrospective</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 14px; color: #cddaf3; text-transform: uppercase; letter-spacing: 0.1em;">Analysis Period: Last 7 Days</p>
                </div>
                
                <div style="padding: 30px;">
                    <!-- Executive Summary -->
                    <div style="display: flex; gap: 15px; margin-bottom: 35px;">
                        <div style="flex: 1; background-color: #1e293b; padding: 15px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
                            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Total Effort</div>
                            <div style="font-size: 22px; font-weight: 800; color: #60a5fa;">${totalHours.toFixed(1)}h</div>
                        </div>
                        <div style="flex: 1; background-color: #1e293b; padding: 15px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
                            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Objectives</div>
                            <div style="font-size: 22px; font-weight: 800; color: #10b981;">${totalTasks} Done</div>
                        </div>
                    </div>

                    <!-- XP Growth Curve -->
                    <div style="margin-bottom: 40px;">
                        <h3 style="font-size: 16px; color: #f1f5f9; margin-bottom: 20px; display: flex; align-items: center;">
                            <span style="background-color: #6366f1; width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                            XP Growth Curve
                        </h3>
                        <div style="background-color: #020617; border-radius: 12px; padding: 20px; border: 1px solid #1e293b;">
                            <svg width="100%" height="150" viewBox="0 0 500 150" preserveAspectRatio="none">
                                ${polyline}
                                ${dots}
                            </svg>
                            <div style="display: flex; justify-content: space-between; margin-top: 10px; color: #475569; font-size: 10px;">
                                <span>Day 1</span>
                                <span>Day 7</span>
                            </div>
                        </div>
                    </div>

                    <!-- Content Mastery Map -->
                    <div style="margin-bottom: 40px;">
                        <h3 style="font-size: 16px; color: #f1f5f9; margin-bottom: 20px; display: flex; align-items: center;">
                            <span style="background-color: #10b981; width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                            Content Mastery Map
                        </h3>
                        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
                            ${masteryMap.length > 0 ? masteryMap.slice(0, 5).map(m => `
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                                        <span style="color: #cbd5e1; font-weight: 600;">${m.name}</span>
                                        <span style="color: #64748b;">${m.hours}h</span>
                                    </div>
                                    <div style="height: 6px; background-color: #0f172a; border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${(m.hours / (totalHours || 1) * 100).toFixed(0)}%; height: 100%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 3px;"></div>
                                    </div>
                                </div>
                            `).join('') : '<p style="color: #64748b; font-style: italic; font-size: 13px;">No module activity tracked this week.</p>'}
                        </div>
                    </div>

                    <!-- Peak Performance Discovery -->
                    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 25px; border-radius: 12px; border: 1px solid #3b82f633; position: relative; overflow: hidden;">
                        <div style="position: absolute; right: -20px; top: -20px; font-size: 80px; opacity: 0.1;">⚡</div>
                        <h3 style="margin-top: 0; font-size: 14px; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em;">Peak Performance Discovery</h3>
                        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 15px 0;">
                            Your <strong>Golden Hour</strong> is at <span style="color: #f59e0b; font-weight: 800;">${peakHour}:00</span>.
                        </p>
                        <p style="color: #94a3b8; font-size: 14px; margin: 0; font-style: italic;">
                            "You are most productive during the afternoon sessions. Leverage this energy for your most complex coding or theoretical tasks."
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://www.joshwebs.co.zw/study/analytics" style="background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); color: white; padding: 16px 45px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);">FULL ANALYTICS BLAST</a>
                    </div>
                </div>

                <div style="background-color: #020617; padding: 30px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="margin: 0; font-size: 12px; color: #475569;">&copy; 2026 JOSHWEBS STUDY CLOUD. Precision Analytics for Peak Performance.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Weekly Retrospective sent to ${email}`);
    } catch (error) {
        console.error(`❌ Failed to send Weekly Retrospective to ${email}:`, error);
    }
};

/**
 * Sends a consolidated engagement report containing stats, rewards, deadlines, and active recall.
 */
const sendUnifiedEngagementReport = async (user, data) => {
    const { email, name } = user;
    if (!email) return;

    const {
        stats,
        prediction,
        milestones = [],
        criticalTask,
        flashcard,
        srCount
    } = data;

    const subject = milestones.length > 0
        ? `Academic Achievement Unlocked! 🏆 + Your Daily Report`
        : `Your Daily Academic Intelligence Report - ${new Date().toLocaleDateString()}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync" <no-reply@studysync.app>',
        to: email,
        subject: subject,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 35px; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">StudySync</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; color: #dbeafe; text-transform: uppercase; letter-spacing: 0.1em;">Precision Study Intelligence</p>
                </div>

                <div style="padding: 35px;">
                    <div style="text-align: center; margin-bottom: 35px;">
                        <h2 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Morning, ${name || 'Researcher'}! ☀️</h2>
                        <p style="margin: 10px 0 0 0; line-height: 1.6; color: #94a3b8; font-size: 16px;">Here is your unified daily academic briefing.</p>
                    </div>

                    <!-- Milestones/Rewards Section -->
                    ${milestones.map(m => `
                        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 25px; border-radius: 12px; border: 1px solid ${m.type === 'LEVEL_UP' ? '#8b5cf6' : '#ec4899'}; margin-bottom: 30px; text-align: center;">
                            <span style="font-size: 40px;">${m.type === 'LEVEL_UP' ? '🏆' : '💝'}</span>
                            <h3 style="color: white; margin: 10px 0;">${m.title}</h3>
                            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">${m.message}</p>
                        </div>
                    `).join('')}

                    <!-- Core Performance Stats -->
                    <div style="background-color: #1e293b; padding: 20px; border-radius: 15px; border: 1px solid #334155; margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-size: 14px; font-weight: 700; color: #3b82f6;">LEVEL ${stats.level}</span>
                            <span style="font-size: 12px; font-weight: 600; color: #64748b;">${stats.xp} XP</span>
                        </div>
                        <div style="height: 10px; background-color: #0f172a; border-radius: 5px; overflow: hidden;">
                            <div style="width: ${Math.min((stats.xp / (stats.level * 1000) * 100), 100).toFixed(0)}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 5px;"></div>
                        </div>
                        
                        <div style="display: flex; gap: 12px; margin-top: 25px;">
                            <div style="flex: 1; background-color: #0f172a; padding: 15px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Activity</div>
                                <div style="font-size: 20px; font-weight: 800; color: #3b82f6;">${stats.previousDayHours.toFixed(1)}h</div>
                            </div>
                            <div style="flex: 1; background-color: #0f172a; padding: 15px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Streak</div>
                                <div style="font-size: 20px; font-weight: 800; color: #10b981;">${stats.streak} 🔥</div>
                            </div>
                            <div style="flex: 1; background-color: #0f172a; padding: 15px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Tasks</div>
                                <div style="font-size: 20px; font-weight: 800; color: #f59e0b;">${stats.tasksCompleted}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Strategic Prediction -->
                    <div style="background-color: #0f172a; padding: 25px; border-radius: 12px; border-left: 4px solid #3b82f6; margin-bottom: 30px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em;">AI Strategic Analysis</h4>
                        <p style="margin: 0; font-style: italic; color: #cbd5e1; line-height: 1.7; font-size: 14px;">"${prediction}"</p>
                    </div>

                    <!-- Critical Deadline -->
                    ${criticalTask ? `
                        <div style="background-color: #451a03; padding: 20px; border-radius: 12px; border: 1px solid #f59e0b; margin-bottom: 30px;">
                            <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #f59e0b; text-transform: uppercase;">⚠️ High Priority Deadline</h4>
                            <p style="margin: 0; color: white; font-weight: 700;">${criticalTask.title}</p>
                            <p style="margin: 5px 0 15px 0; color: #fcd34d; font-size: 13px;">Due: ${new Date(criticalTask.dueDate).toLocaleDateString()}</p>
                            <div style="background-color: #0f172a; padding: 12px; border-radius: 8px; font-size: 13px; color: #cbd5e1; font-style: italic;">
                                "${criticalTask.advice}"
                            </div>
                        </div>
                    ` : ''}

                    <!-- Daily Active Recall -->
                    ${flashcard ? `
                        <div style="background-color: #064e3b; padding: 25px; border-radius: 12px; border: 1px solid #10b981; margin-bottom: 30px; text-align: center;">
                            <h4 style="margin: 0 0 15px 0; font-size: 13px; color: #34d399; text-transform: uppercase;">🧠 Daily Active Recall</h4>
                            <div style="background-color: #0f172a; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                                <p style="margin: 0; color: white; font-size: 18px; font-weight: 600;">${flashcard.front}</p>
                            </div>
                            ${srCount > 0 ? `<p style="color: #6ee7b7; font-size: 12px; font-weight: 600;">⚠️ ${srCount} other cards due for review!</p>` : ''}
                            <a href="https://www.joshwebs.co.zw/study/flashcards?id=${flashcard.id}" style="display: inline-block; margin-top: 10px; color: #10b981; text-decoration: none; font-size: 14px; font-weight: 700;">REVEAL ANSWER →</a>
                        </div>
                    ` : ''}

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="https://www.joshwebs.co.zw/study" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 45px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);">ENTER STUDY COMMAND CENTER</a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #020617; padding: 30px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="margin: 0; font-size: 12px; color: #475569;">&copy; 2026 JOSHWEBS STUDY ASSISTANCE SYSTEM</p>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #334155;">Automated Academic Intelligence Briefing</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Unified engagement report sent to ${email}: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Failed to send unified engagement report to ${email}:`, error);
    }
};

/**
 * Sends an email recovery notification to a user.
 */
const sendEmailRecoveryNotification = async (email) => {
    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync Support" <support@studysync.app>',
        to: email,
        subject: `Your StudySync Account Access: Email Recovery 🔐`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; color: white;">Account Support</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: white; margin-top: 0;">Email Recovery Inquiry</h2>
                    <p style="color: #cbd5e1; line-height: 1.6;">
                        Hello, we received a request regarding your account access. Your correct registered email for StudySync is:
                    </p>
                    <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; border: 1px dashed #6366f1; text-align: center; margin: 20px 0;">
                        <strong style="font-size: 20px; color: #818cf8;">${email}</strong>
                    </div>
                    <p style="color: #94a3b8; font-size: 14px;">
                        You can use this email to log in and sync your study data. If you have any trouble with your password, please use the "Forgot Password" link on the login page.
                    </p>
                </div>
                <div style="background-color: #020617; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #475569;">&copy; 2026 StudySync Support. Excellence through Consistency.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Recovery email sent to ${email}`);
    } catch (error) {
        console.error(`❌ Failed to send recovery email to ${email}:`, error);
    }
};

/**
 * Sends a service restoration notification to a user.
 */
const sendRestorationNotification = async (user) => {
    const email = user.email;
    if (!email) return;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"StudySync" <no-reply@studysync.app>',
        to: email,
        subject: `We're Back! Services Restored & App Working 🚀`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">Services Restored</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; color: #e0e7ff;">The JOSHWEBS STUDY SYSTEM is now fully operational</p>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 18px; line-height: 1.7; color: #ffffff; margin-bottom: 20px;">
                        Hello <strong>${user.name || 'Student'}</strong>,
                    </p>
                    <p style="font-size: 16px; line-height: 1.7; color: #cbd5e1; margin-bottom: 30px;">
                        We are pleased to inform you that we have restored all services. The app is now working perfectly, and all systems (including your study timer and AI fallbacks) are stable and ready for your next study session.
                    </p>

                    <div style="background-color: #1e293b; padding: 25px; border-radius: 12px; border: 1px solid #10b98133; margin-bottom: 35px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em;">What was fixed:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 14px; line-height: 1.8;">
                            <li>Production Timer Synchronization issues</li>
                            <li>Background Report AI Engine 404 errors</li>
                            <li>System Stability & Performance Optimizations</li>
                        </ul>
                    </div>

                    <p style="font-size: 14px; color: #94a3b8; margin-bottom: 30px;">
                        Thank you for your patience while we optimized the system for your academic success.
                    </p>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="https://www.joshwebs.co.zw/study" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 45px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">BACK TO STUDYING</a>
                    </div>
                </div>

                <div style="background-color: #020617; padding: 30px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="margin: 0; font-size: 12px; color: #475569;">&copy; 2026 JOSHWEBS STUDY ASSISTANCE SYSTEM. Excellence through Consistency.</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Restoration email sent to ${email}: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Failed to send restoration email to ${email}:`, error);
    }
};

module.exports = {
    sendStudyReport,
    sendTutorialGuide,
    sendActiveRecallSnippet,
    sendDeadlineAlert,
    sendMilestoneReward,
    sendWeeklyRetrospective,
    sendUnifiedEngagementReport,
    sendRestorationNotification,
    sendEmailRecoveryNotification
};
