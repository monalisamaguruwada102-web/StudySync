const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'db.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

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
    tutorials: [],
    conversations: [],
    messages: [],
    groups: [],
    settings: {
        owner: null
    }
};

// Write queue to prevent concurrent write conflicts
let writeQueue = Promise.resolve();
let lastBackupTime = 0;
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

const readDB = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            console.log('📝 Initializing new database...');
            fs.writeFileSync(DB_PATH, JSON.stringify(initialState, null, 2));
            return initialState;
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        const parsed = JSON.parse(data);

        // Ensure all collections from initialState exist (schema migration)
        let modified = false;
        Object.keys(initialState).forEach(key => {
            if (parsed[key] === undefined) {
                parsed[key] = initialState[key];
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2));
        }

        return parsed;
    } catch (error) {
        console.error('❌ Error reading database:', error.message);
        // Try to restore from latest backup
        const backups = getBackupFiles();
        if (backups.length > 0) {
            console.log('🔄 Attempting to restore from latest backup...');
            const latestBackup = path.join(BACKUP_DIR, backups[0]);
            const backupData = fs.readFileSync(latestBackup, 'utf8');
            return JSON.parse(backupData);
        }
        return initialState;
    }
};

const writeDB = (data) => {
    // Queue writes to prevent conflicts
    writeQueue = writeQueue.then(() => {
        return new Promise((resolve, reject) => {
            try {
                // Write to temporary file first
                const tempPath = DB_PATH + '.tmp';
                fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));

                // Atomic rename
                fs.renameSync(tempPath, DB_PATH);

                // Create periodic backups
                const now = Date.now();
                if (now - lastBackupTime > BACKUP_INTERVAL) {
                    createBackup();
                    lastBackupTime = now;
                }

                resolve();
            } catch (error) {
                console.error('❌ Error writing database:', error.message);
                reject(error);
            }
        });
    });
    return writeQueue;
};

const getBackupFiles = () => {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    return fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('db-backup-') && f.endsWith('.json'))
        .sort()
        .reverse();
};

const createBackup = () => {
    try {
        if (!fs.existsSync(DB_PATH)) return null;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `db-backup-${timestamp}.json`);

        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`✅ Backup created: ${backupPath}`);

        // Clean up old backups (keep only last 10)
        const backups = getBackupFiles();
        if (backups.length > 10) {
            const toDelete = backups.slice(10);
            toDelete.forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
                console.log(`🗑️ Deleted old backup: ${file}`);
            });
        }

        return backupPath;
    } catch (error) {
        console.error('❌ Error creating backup:', error.message);
        return null;
    }
};

const db = {
    get: (collection) => readDB()[collection],

    find: (collection, predicate) => {
        return readDB()[collection].find(predicate);
    },

    insert: (collection, item) => {
        const data = readDB();
        // Use UUID for compatibility with Supabase
        const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        const newItem = {
            ...item,
            id,
            createdAt: new Date().toISOString(),
            tutorial_completed: false // Default for new users
        };
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
        data[collection] = data[collection].filter(i => String(i.id) !== String(id));
        writeDB(data);
    },

    getById: (collection, id) => {
        const data = readDB();
        return data[collection].find(i => String(i.id) === String(id));
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
    },

    // Raw data access for export
    getRawData: () => readDB(),

    // Restore database from uploaded JSON
    restore: async (newData) => {
        // Basic validation
        if (!newData || typeof newData !== 'object') {
            throw new Error('Invalid database format');
        }

        // Ensure all required collections exist
        const keys = Object.keys(initialState);
        for (const key of keys) {
            if (!newData[key]) {
                newData[key] = initialState[key];
            }
        }

        // Create a backup of the current state before overwriting
        createBackup();

        // Write the new data
        await writeDB(newData);
        return true;
    },

    // Export backup function for graceful shutdown
    createBackup,
    DB_PATH
};

module.exports = db;
