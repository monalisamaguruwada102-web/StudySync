const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pocuggehxeuheqzgixsx.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvY3VnZ2VoeGV1aGVxemdpeHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDU1MzQsImV4cCI6MjA4NTI4MTUzNH0.QjIFMzJ4xf3PNnUbMSUMg8mIyPLis7yI_PuPNZT5CMg';
const DB_PATH = path.join(__dirname, 'db.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function restore() {
    console.log('--- Starting Data Restoration from Supabase ---');

    try {
        // 1. Read existing db.json to preserve users and settings
        const currentDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        console.log('✅ Read existing db.json');

        // 2. Fetch data from Supabase
        const tables = [
            'modules',
            'study_logs',
            'tasks',
            'notes',
            'flashcard_decks',
            'flashcards'
        ];

        const data = {};
        for (const table of tables) {
            console.log(`Fetching ${table}...`);
            const { data: items, error } = await supabase.from(table).select('*');
            if (error) throw error;
            data[table] = items;
            console.log(`  Fetched ${items.length} items.`);
        }

        // 3. Map to local structure
        currentDB.modules = data.modules.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            targetHours: m.target_hours,
            userId: m.user_id,
            createdAt: m.created_at
        }));

        currentDB.studyLogs = data.study_logs.map(s => ({
            id: s.id,
            moduleId: s.module_id,
            hours: parseFloat(s.hours),
            date: s.date,
            topic: s.activity || '',
            userId: s.user_id,
            createdAt: s.created_at
        }));

        currentDB.tasks = data.tasks.map(t => ({
            id: t.id,
            moduleId: t.module_id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            dueDate: t.due_date,
            userId: t.user_id,
            createdAt: t.created_at
        }));

        currentDB.notes = data.notes.map(n => ({
            id: n.id,
            moduleId: n.module_id,
            title: n.title,
            content: n.content,
            resourceLink: n.resource_link,
            pdfPath: n.pdf_path,
            userId: n.user_id,
            createdAt: n.created_at
        }));

        currentDB.flashcardDecks = data.flashcard_decks.map(d => ({
            id: d.id,
            moduleId: d.module_id,
            name: d.name,
            description: d.description,
            userId: d.user_id,
            createdAt: d.created_at
        }));

        currentDB.flashcards = data.flashcards.map(f => ({
            id: f.id,
            deckId: f.deck_id,
            question: f.question,
            answer: f.answer,
            level: f.level,
            createdAt: f.created_at
        }));

        // 4. Create backup of current db.json
        const backupPath = DB_PATH + `.pre-restore-${Date.now()}.bak`;
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`✅ Created backup: ${path.basename(backupPath)}`);

        // 5. Write updated db.json
        fs.writeFileSync(DB_PATH, JSON.stringify(currentDB, null, 2));
        console.log('✅ Updated db.json with restored data.');

        console.log('\n🎉 Restoration Successful!');
    } catch (error) {
        console.error('❌ Restoration Failed:', error.message);
        process.exit(1);
    }
}

restore();
