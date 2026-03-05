const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'db.json');
const OLD_ID = '1769561085648';
const NEW_UUID = '93380b42-ed1f-4140-a84b-43bc1abbe032';

async function migrate() {
    console.log(`Starting migration: ${OLD_ID} -> ${NEW_UUID}`);

    if (!fs.existsSync(DB_PATH)) {
        console.error('db.json not found');
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

        // Helper to replace IDs in collection
        const replaceInCollection = (collection, idField) => {
            if (!data[collection]) return;
            let count = 0;
            data[collection] = data[collection].map(item => {
                if (String(item[idField]) === OLD_ID) {
                    count++;
                    return { ...item, [idField]: NEW_UUID };
                }
                return item;
            });
            console.log(`Updated ${count} items in ${collection} (field: ${idField})`);
        };

        // Replace primary IDs
        replaceInCollection('users', 'id');

        // Replace foreign keys
        const collectionsWithUserId = ['modules', 'studyLogs', 'tasks', 'notes', 'grades', 'flashcardDecks', 'calendarEvents', 'pomodoroSessions', 'conversations', 'messages'];
        collectionsWithUserId.forEach(c => replaceInCollection(c, 'user_id'));
        collectionsWithUserId.forEach(c => replaceInCollection(c, 'userId')); // Some might use userId

        // Special case for participants in conversations
        if (data.conversations) {
            data.conversations = data.conversations.map(c => {
                if (c.participants && c.participants.includes(OLD_ID)) {
                    c.participants = c.participants.map(p => p === OLD_ID ? NEW_UUID : p);
                    console.log(`Updated participants in conversation: ${c.id}`);
                }
                return c;
            });
        }

        // Special case for messages senderId
        if (data.messages) {
            data.messages = data.messages.map(m => {
                if (m.senderId === OLD_ID) {
                    m.senderId = NEW_UUID;
                }
                return m;
            });
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        console.log('✅ Local db.json migration complete.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
