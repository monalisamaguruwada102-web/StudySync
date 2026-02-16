const cron = require('node-cron');
const db = require('./database.cjs');
const { getLiveDashboardStats, getWeeklyAnalytics } = require('./syncService.cjs');
const { sendStudyReport, sendTutorialGuide, sendActiveRecallSnippet, sendDeadlineAlert, sendMilestoneReward, sendWeeklyRetrospective } = require('./emailService.cjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const generatePrediction = async (user, stats) => {
    if (!genAI) return "Keep up the great work! Consistency is key to mastering your modules.";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const noteContext = stats.recentNotes && stats.recentNotes.length > 0
            ? stats.recentNotes.map(n => `- Note: "${n.title}"\n  Content: ${n.content}`).join('\n')
            : "No recent notes available.";

        const taskContext = stats.pendingTasksDetails && stats.pendingTasksDetails.length > 0
            ? stats.pendingTasksDetails.map(t => `- Task: "${t.title}"\n  Objective: ${t.description}`).join('\n')
            : "No pending tasks available.";

        const prompt = `Act as an elite Academic Strategist and Study Coach from the "JOSHWEBS STUDY ASSISTANCE SYSTEM".
        
        Analyze the following data for ${user.name || 'Student'} (Academic Level ${user.level || 1}, XP: ${user.xp || 0}):
        
        PERFORMANCE DATA (Last 24h):
        - Hours Studied: ${stats.previousDayHours.toFixed(1)}h
        - Momentum: ${stats.streak} day streak
        - Output: ${stats.tasksCompleted} tasks completed
        - Active Focus Areas: ${stats.activeModules.join(', ')}
        
        CONTENT CONTEXT:
        Recent Note Summaries:
        ${noteContext}
        
        Upcoming Deadlines & Objectives:
        ${taskContext}
        
        YOUR TASK:
        Perform a REAL, substantial analysis. Do not provide generic motivation. 
        1. Identify conceptual overlaps or gaps based on their notes and upcoming tasks.
        2. Provide a specific, data-driven "Strategic Prediction" for their performance today.
        3. Give 1-2 pieces of advanced study advice tailored to their specific content (e.g., specific active recall techniques for their topics).
        
        Keep the response concise (approx. 4-5 sentences), authoritative, yet highly supportive. Focus on REAL intelligence.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('AI Prediction error:', error);
        return "Continue your momentum! You've been focusing on " + (stats.activeModules.join(', ') || 'your core subjects') + " recently. Today, try connecting your recent notes with your pending tasks to deepen your understanding. You're on track for a productive day.";
    }
};

/**
 * Generates tailored study advice for a specific high-priority task.
 */
const generateStudyAdvice = async (user, task) => {
    if (!genAI) return "Break this task into smaller manageable chunks and use the Pomodoro timer to stay focused.";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Act as an elite Academic Strategist. A student named ${user.name || 'Student'} has an important task: "${task.title}".
        Objective: ${task.description || 'Complete the task successfully'}.
        Deadline: in 3 days.
        
        Provide 2 sentences of highly specific, high-leverage study advice for this task. 
        Focus on advanced techniques like Active Recall, Feynman Technique, or specific resource organization. 
        Be professional, intense, and encouraging.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('AI Advice error:', error);
        return "Focus on the core concepts of this task and try explaining them to someone else to solidify your understanding.";
    }
};

/**
 * Runs the daily report process for all users.
 */
const runDailyReports = async () => {
    console.log('🚀 Starting daily study report process with Cloud Sync...');
    const users = db.get('users') || [];

    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (const user of users) {
        if (!user.email) continue;

        const userId = user.id;
        const supabaseId = user.supabaseId;
        const lookupId = supabaseId || userId;

        console.log(`📊 Syncing live data for ${user.email}...`);
        const liveStats = await getLiveDashboardStats(lookupId);

        if (!liveStats) {
            console.warn(`⚠️ Could not sync live data for ${user.email}, skipping.`);
            continue;
        }

        // Use live Supabase data instead of stale local db.json
        const userLogs = liveStats.logs;
        const userTasks = liveStats.tasks;
        const allModules = liveStats.modules;

        const yesterdayLogs = userLogs.filter(l => {
            const dateVal = l.date || l.createdAt || l.created_at;
            return dateVal && String(dateVal).split('T')[0] === yesterdayStr;
        });
        const previousDayHours = yesterdayLogs.reduce((acc, l) => acc + parseFloat(l.hours || 0), 0);

        const tasksCompleted = userTasks.filter(t => {
            const dateVal = t.updatedAt || t.updated_at || t.created_at;
            return t.status === 'Completed' && dateVal && String(dateVal).split('T')[0] === yesterdayStr;
        }).length;

        // --- ENHANCED: Activity Fallback Logic ---
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyLogs = userLogs.filter(l => new Date(l.date || l.createdAt) >= oneWeekAgo);
        const weeklyHours = weeklyLogs.reduce((acc, l) => acc + parseFloat(l.hours || 0), 0);

        const lastSession = userLogs.sort((a, b) => new Date(b.date || b.createdAt || b.created_at) - new Date(a.date || a.createdAt || a.created_at))[0];
        const lastSessionDate = lastSession ? String(lastSession.date || lastSession.createdAt || lastSession.created_at).split('T')[0] : 'No activity yet';

        // Modules involved (using weekly if yesterday is empty for more context)
        const relevantLogs = yesterdayLogs.length > 0 ? yesterdayLogs : weeklyLogs.slice(0, 5);
        const moduleIds = [...new Set(relevantLogs.map(l => l.moduleId || l.module_id))];
        const activeModules = allModules.filter(m => moduleIds.includes(m.id)).map(m => m.name);

        // Streak logic (Simplified for the email, but consistent)
        const sortedDates = [...new Set(userLogs.map(log => {
            const dateVal = log.date || log.createdAt || log.created_at;
            return dateVal ? String(dateVal).split('T')[0] : null;
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
                    const diff = Math.round((current - next) / (1000 * 60 * 60 * 24));
                    if (diff === 1) streak++;
                    else break;
                }
            }
        }

        const pendingTasks = userTasks
            .filter(t => t.status !== 'Completed')
            .sort((a, b) => new Date(a.dueDate || a.due_date || '9999') - new Date(b.dueDate || b.due_date || '9999'))
            .slice(0, 3)
            .map(t => ({ title: t.title, dueDate: t.dueDate || t.due_date }));

        const allEvents = db.get('calendarEvents') || [];
        const upcomingEvents = allEvents
            .filter(e => e.userId === userId || (supabaseId && e.userId === supabaseId) || (supabaseId && e.user_id === supabaseId))
            .filter(e => {
                const eventDate = new Date(e.start || e.startDate);
                const now = new Date();
                const diff = (eventDate - now) / (1000 * 60 * 60);
                return diff > 0 && diff < 48; // Next 48 hours
            })
            .sort((a, b) => new Date(a.start || a.startDate) - new Date(b.start || b.startDate))
            .slice(0, 3)
            .map(e => ({ title: e.title, start: e.start || e.startDate }));

        // Real Analysis Content Gathering
        const allNotes = db.get('notes') || [];
        const recentNotes = allNotes
            .filter(n => n.userId === userId || (supabaseId && n.userId === supabaseId) || (supabaseId && n.user_id === supabaseId))
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 3)
            .map(n => ({ title: n.title, content: n.content?.replace(/<[^>]*>?/gm, '').substring(0, 300) }));

        const pendingTasksDetails = userTasks
            .filter(t => t.status !== 'Completed')
            .sort((a, b) => new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999'))
            .slice(0, 3)
            .map(t => ({ title: t.title, description: t.description || 'No detailed objective provided.' }));

        const stats = {
            previousDayHours,
            streak: liveStats.streak,
            tasksCompleted,
            activeModules: activeModules.length > 0 ? activeModules : ['General Study'],
            level: liveStats.level,
            xp: liveStats.totalXP,
            pendingTasks,
            upcomingEvents,
            recentNotes,
            pendingTasksDetails,
            weeklyHours,
            lastSessionDate,
            isYesterdayInactive: yesterdayLogs.length === 0
        };

        const prediction = await generatePrediction(user, stats);

        // --- CONSOLIDATED ENGAGEMENT DATA ---
        const milestones = [];
        // 1. Level Up
        if (stats.level > (user.level || 1)) {
            milestones.push({
                type: 'LEVEL_UP',
                title: `🏆 LEVEL ${stats.level} UNLOCKED`,
                message: `Mastery of the system is within your reach. Awarded for earning ${stats.totalXP || stats.xp} Total XP.`
            });
            db.update('users', user.id, { level: stats.level });
        }
        // 2. Streak Repair
        const prevStreak = user.streak || 0;
        if (stats.streak === 0 && prevStreak > 0) {
            milestones.push({
                type: 'STREAK_REPAIR',
                title: '💝 STREAK REPAIR OFFER',
                message: 'We noticed you missed a day, but your hard work shouldn\'t disappear. Log in now and complete a session to restore your momentum!'
            });
        }
        db.update('users', user.id, { streak: stats.streak });

        // 3. Deadline Alerts (Due in 3 days)
        let criticalTaskPayload = null;
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

        const matchingTask = userTasks.find(t =>
            t.status !== 'Completed' &&
            (t.dueDate || t.due_date)?.split('T')[0] === threeDaysStr
        );
        if (matchingTask) {
            const advice = await generateStudyAdvice(user, matchingTask);
            criticalTaskPayload = { ...matchingTask, advice, dueDate: matchingTask.dueDate || matchingTask.due_date };
        }

        // 4. Daily Active Recall Snippet
        let flashcardPayload = null;
        let flashcardSrCount = 0;
        if (liveStats.flashcards && liveStats.flashcards.length > 0) {
            flashcardPayload = liveStats.flashcards[Math.floor(Math.random() * liveStats.flashcards.length)];
            flashcardSrCount = liveStats.flashcards.filter(c => (c.level || 1) <= 2).length;
        }

        // --- SEND THE UNIFIED REPORT ---
        const { sendUnifiedEngagementReport } = require('./emailService.cjs');
        await sendUnifiedEngagementReport(user, {
            stats: stats,
            prediction: prediction,
            milestones: milestones,
            criticalTask: criticalTaskPayload,
            flashcard: flashcardPayload,
            srCount: flashcardSrCount
        });

        console.log(`✅ SUCCESS: Unified engagement report sent to ${user.email}`);

    }
    console.log('✅ Daily study reports and engagement checks completed.');
};

/**
 * Runs the weekly tutorial guide process for all users.
 */
const runWeeklyTutorials = async () => {
    console.log('🚀 Starting weekly academic mastery guide process...');
    const users = db.get('users') || [];

    for (const user of users) {
        if (!user.email) continue;
        console.log(`✉️ Sending mastery guide to ${user.email}...`);
        await sendTutorialGuide(user);
    }
    console.log('🏁 Weekly mastery guide process completed.');
};

/**
 * Runs the weekly retrospective process for all users.
 */
const runWeeklyRetrospectives = async () => {
    console.log('🚀 Starting weekly academic retrospective process...');
    const users = db.get('users') || [];

    for (const user of users) {
        if (!user.email) continue;

        const lookupId = user.supabaseId || user.id;
        console.log(`📊 Generating retrospective for ${user.email}...`);

        const analytics = await getWeeklyAnalytics(lookupId);
        if (analytics) {
            await sendWeeklyRetrospective(user, analytics);
        } else {
            console.warn(`⚠️ Could not generate weekly analytics for ${user.email}`);
        }
    }
    console.log('🏁 Weekly retrospective process completed.');
};

/**
 * Initializes the scheduler.
 */
const initScheduler = () => {
    // Schedule for 08:00 every day
    // Cron: minute hour day-of-month month day-of-week
    cron.schedule('00 08 * * *', () => {
        console.log('⏰ 8:00 AM - Triggering daily study reports...');
        runDailyReports();
    });

    // Schedule for 09:00 every Sunday
    // Cron: minute hour day-of-month month day-of-week (0-6, 0=Sunday)
    cron.schedule('00 09 * * 0', () => {
        console.log('⏰ Sunday 9:00 AM - Triggering weekly mastery guide...');
        runWeeklyTutorials();
    });

    // Schedule for 18:00 every Saturday
    // Cron: minute hour day-of-month month day-of-week (0-6, 6=Saturday)
    cron.schedule('00 18 * * 6', () => {
        console.log('⏰ Saturday 6:00 PM - Triggering weekly academic retrospective...');
        runWeeklyRetrospectives();
    });

    console.log('📅 Scheduler initialized: Daily reports set for 08:00 AM');
};

module.exports = { initScheduler, runDailyReports, runWeeklyTutorials, runWeeklyRetrospectives, generatePrediction };
