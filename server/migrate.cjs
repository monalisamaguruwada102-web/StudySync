const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const DB_PATH = path.join(__dirname, 'db.json');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Supabase credentials not found in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const migrate = async () => {
    console.log('🚀 Starting Data Migration to Supabase...');

    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Error: Local db.json not found.');
        return;
    }

    const localData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    const collections = [
        { local: 'modules', remote: 'modules' },
        { local: 'studyLogs', remote: 'study_logs' },
        { local: 'tasks', remote: 'tasks' },
        { local: 'notes', remote: 'notes' },
        { local: 'grades', remote: 'grades' },
        { local: 'flashcardDecks', remote: 'flashcard_decks' },
        { local: 'flashcards', remote: 'flashcards' },
        { local: 'calendarEvents', remote: 'calendar_events' },
        { local: 'pomodoroSessions', remote: 'pomodoro_sessions' }
    ];

    for (const col of collections) {
        const items = localData[col.local];
        if (items && items.length > 0) {
            console.log(`📦 Migrating ${items.length} items from ${col.local} to ${col.remote}...`);

            // Map keys if necessary (e.g. moduleId to module_id)
            const mappedItems = items.map(item => {
                const newItem = { ...item };
                if (newItem.topic) {
                    newItem.activity = newItem.topic;
                    delete newItem.topic;
                }
                if (newItem.moduleId) {
                    newItem.module_id = newItem.moduleId;
                    delete newItem.moduleId;
                }
                if (newItem.deckId) {
                    newItem.deck_id = newItem.deckId;
                    delete newItem.deckId;
                }
                if (newItem.targetHours) {
                    newItem.target_hours = newItem.targetHours;
                    delete newItem.targetHours;
                }
                if (newItem.resourceLink) {
                    newItem.resource_link = newItem.resourceLink;
                    delete newItem.resourceLink;
                }
                if (newItem.pdfPath) {
                    newItem.pdf_path = newItem.pdfPath;
                    delete newItem.pdfPath;
                }
                if (newItem.dueDate) {
                    newItem.due_date = newItem.dueDate;
                    delete newItem.dueDate;
                }
                if (newItem.startTime) {
                    newItem.start_time = newItem.startTime;
                    delete newItem.startTime;
                }
                if (newItem.endTime) {
                    newItem.end_time = newItem.endTime;
                    delete newItem.endTime;
                }
                if (newItem.completedAt) {
                    newItem.completed_at = newItem.completedAt;
                    delete newItem.completedAt;
                }
                if (newItem.userId) {
                    newItem.user_id = newItem.userId;
                    delete newItem.userId;
                }
                if (newItem.createdAt) {
                    newItem.created_at = newItem.createdAt;
                    delete newItem.createdAt;
                }
                if (newItem.updatedAt) {
                    newItem.updated_at = newItem.updatedAt;
                    delete newItem.updatedAt;
                }
                return newItem;
            });

            // Batch insert to Supabase
            const { error } = await supabase
                .from(col.remote)
                .upsert(mappedItems);

            if (error) {
                console.error(`❌ Migration error for ${col.remote}:`, error.message);
            } else {
                console.log(`✅ ${col.remote} migrated successfully.`);
            }
        } else {
            console.log(`⏭️ Skipping ${col.local} (empty)`);
        }
    }

    console.log('🏁 Migration process complete!');
};

migrate();
