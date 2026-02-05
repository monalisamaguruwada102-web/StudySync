const cron = require('node-cron');
const db = require('./database.cjs');
const { sendStudyReport } = require('./emailService.cjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Generates an AI prediction for a user's study progress.
 */
const generatePrediction = async (user, stats) => {
    if (!genAI) return "Keep up the great work! Consistency is key to mastering your modules.";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `Act as a supportive and expert study coach from the "JOSHWEBS STUDY ASSISTANCE SYSTEM".
        
        User: ${user.username || 'Student'} (Level ${user.level || 1})
        Stats for the last 24 hours:
        - Hours Studied: ${stats.previousDayHours.toFixed(1)}h
        - Current Streak: ${stats.streak} days
        - Tasks Completed: ${stats.tasksCompleted}
        - Active Modules: ${stats.activeModules.join(', ')}
        
        Based on these stats, provide a short (2-3 sentences), encouraging, and personalized prediction/advice for their study journey today. 
        Focus on their momentum and what they should aim for next. Use a professional yet motivating tone.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('AI Prediction error:', error);
        return "You're making steady progress. Focus on your top priority tasks today to keep the momentum going!";
    }
};

/**
 * Runs the daily report process for all users.
 */
const runDailyReports = async () => {
    console.log('🚀 Starting daily study report process...');
    const users = db.get('users') || [];
    const allLogs = db.get('studyLogs') || [];
    const allTasks = db.get('tasks') || [];
    const allModules = db.get('modules') || [];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    for (const user of users) {
        if (!user.email) continue;

        // Aggregate stats for this user
        const userLogs = allLogs.filter(l => l.userId === user.id);
        const userTasks = allTasks.filter(t => t.userId === user.id);

        const yesterdayLogs = userLogs.filter(l => (l.date || l.createdAt)?.split('T')[0] === yesterdayStr);
        const previousDayHours = yesterdayLogs.reduce((acc, l) => acc + parseFloat(l.hours || 0), 0);

        const tasksCompleted = userTasks.filter(t => t.status === 'Completed' && t.updatedAt?.split('T')[0] === yesterdayStr).length;

        // Modules involved
        const moduleIds = [...new Set(yesterdayLogs.map(l => l.moduleId))];
        const activeModules = allModules.filter(m => moduleIds.includes(m.id)).map(m => m.name);

        // Streak logic (simplified for the email)
        const sortedDates = [...new Set(userLogs.map(log => {
            const date = log.date || log.createdAt;
            return date ? new Date(date).toISOString().split('T')[0] : null;
        }))].filter(Boolean).sort().reverse();

        let streak = 0;
        if (sortedDates.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (sortedDates[0] === todayStr || sortedDates[0] === yesterStr) {
                streak = 1;
                for (let i = 0; i < sortedDates.length - 1; i++) {
                    const current = new Date(sortedDates[i]);
                    const next = new Date(sortedDates[i + 1]);
                    const diff = (current - next) / (1000 * 60 * 60 * 24);
                    if (diff === 1) streak++;
                    else break;
                }
            }
        }

        const stats = {
            previousDayHours,
            streak,
            tasksCompleted,
            activeModules: activeModules.length > 0 ? activeModules : ['General Study']
        };

        const prediction = await generatePrediction(user, stats);

        await sendStudyReport(user, {
            ...stats,
            prediction
        });
    }
    console.log('✅ Daily study reports completed.');
};

/**
 * Initializes the scheduler.
 */
const initScheduler = () => {
    // Schedule for 01:45 every day as requested for testing
    // Cron: minute hour day-of-month month day-of-week
    cron.schedule('45 1 * * *', () => {
        console.log('⏰ 1:45 AM - Triggering daily study reports...');
        runDailyReports();
    });

    console.log('📅 Scheduler initialized: Daily reports set for 01:45 AM');
};

module.exports = { initScheduler, runDailyReports };
