const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const initialState = {
    users: [],
    modules: [],
    studyLogs: [],
    tasks: [],
    notes: [],
    grades: [],
    flashcardDecks: [],
    flashcards: [],
    calendarEvents: [],
    pomodoroSessions: [],
    settings: {
        owner: null
    }
};

const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(initialState, null, 2));
        return initialState;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
};

const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const db = {
    get: (collection) => readDB()[collection],

    find: (collection, predicate) => {
        return readDB()[collection].find(predicate);
    },

    insert: (collection, item) => {
        const data = readDB();
        const newItem = { ...item, id: Date.now().toString(), createdAt: new Date().toISOString() };
        data[collection].push(newItem);
        writeDB(data);
        return newItem;
    },

    update: (collection, id, updates) => {
        const data = readDB();
        const index = data[collection].findIndex(i => i.id === id);
        if (index !== -1) {
            data[collection][index] = { ...data[collection][index], ...updates, updatedAt: new Date().toISOString() };
            writeDB(data);
            return data[collection][index];
        }
        return null;
    },

    delete: (collection, id) => {
        const data = readDB();
        data[collection] = data[collection].filter(i => i.id !== id);
        writeDB(data);
    },

    getSettings: () => readDB().settings,

    updateSettings: (updates) => {
        const data = readDB();
        data.settings = { ...data.settings, ...updates };
        writeDB(data);
        return data.settings;
    },

    addXP: (userId, amount) => {
        const data = readDB();

        const user = data.users.find(u => u.id === userId);
        if (!user) return null;

        user.xp = (user.xp || 0) + amount;

        // Level up logic (every level requires level * 1000 XP)
        let levelUp = false;
        while (user.xp >= user.level * 1000) {
            user.xp -= user.level * 1000;
            user.level += 1;
            levelUp = true;
            // Add a leveling badge if not exists
            const levelBadge = `Level ${user.level} Pro`;
            if (!user.badges.includes(levelBadge)) {
                user.badges.push(levelBadge);
            }
        }

        writeDB(data);
        return { user, levelUp };
    }
};

module.exports = db;
