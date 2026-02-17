const fs = require('fs');
const sp = require('./supabasePersistence.cjs');
const { sendRestorationNotification, sendEmailRecoveryNotification } = require('./emailService.cjs');
require('dotenv').config();

const monalisaOldId = '1769561085649';
const monalisaNewId = '3815cad6-958d-41a7-97f3-03730096af24';
const monalisaNewEmail = 'maguruwadamonalisa@gmail.com';
const awtrinixEmail = 'awtrinix@gmail.com';

const latestBackupFile = './server/backups/db-backup-2026-02-16T20-00-42-707Z.json';

const runSupportTasks = async () => {
    console.log('🚀 Starting targeted user support tasks...');

    // 1. Notify Awtrinix
    console.log(`📧 Sending email recovery for ${awtrinixEmail}...`);
    await sendEmailRecoveryNotification(awtrinixEmail);

    // 2. Restore Monalisa's Data
    console.log(`📦 Restoring data for ${monalisaNewEmail}...`);
    try {
        const backup = JSON.parse(fs.readFileSync(latestBackupFile, 'utf8'));
        const collections = {
            'modules': 'modules',
            'studyLogs': 'study_logs',
            'tasks': 'tasks',
            'notes': 'notes',
            'flashcardDecks': 'flashcard_decks',
            'flashcards': 'flashcards',
            'calendarEvents': 'calendar_events',
            'pomodoroSessions': 'pomodoro_sessions'
        };

        let restoredCount = 0;

        for (const [localCol, remoteTable] of Object.entries(collections)) {
            if (backup[localCol]) {
                const items = backup[localCol].filter(item => item.userId === monalisaOldId);
                console.log(`   - Migrating ${items.length} items from ${localCol}...`);

                for (const item of items) {
                    // Update ownership
                    const newItem = { ...item, userId: monalisaNewId };
                    // Remove old Supabase ID to force new insert if needed, or keep for stability?
                    // Better to UPSERT with new ownership
                    try {
                        await sp.upsertToCollection(remoteTable, newItem);
                        restoredCount++;
                    } catch (e) {
                        console.error(`     ❌ Error migrating item ${item.id}:`, e.message);
                    }
                }
            }
        }

        console.log(`✅ Successfully restored ${restoredCount} items for Monalisa.`);

        // 3. Notify Monalisa
        const monalisaUser = { id: monalisaNewId, email: monalisaNewEmail, name: 'maguruwadamonalisa' };
        await sendRestorationNotification(monalisaUser);
        console.log('✅ Monalisa notification sent.');

    } catch (error) {
        console.error('❌ Data restoration failed:', error);
    }

    console.log('🏁 Support tasks complete.');
};

runSupportTasks();
