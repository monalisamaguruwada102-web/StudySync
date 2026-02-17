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

                // Use open/write/fsync/close pattern for durability
                const fd = fs.openSync(tempPath, 'w');
                fs.writeSync(fd, JSON.stringify(data, null, 2));
                fs.fsyncSync(fd); // Flush to disk
                fs.closeSync(fd);

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

    // Helper to find index by either local ID or Supabase ID
    findIndex: (collection, id) => {
        const data = readDB()[collection];
        return data.findIndex(i => String(i.id) === String(id) || (i.supabaseId && String(i.supabaseId) === String(id)));
    },

    filter: (collection, predicate) => {
        return readDB()[collection].filter(predicate);
    },

    insert: (collection, item) => {
        const data = readDB();
        // Use provided ID if available (for sync), otherwise generate UUID
        let id = item.id;
        if (!id) {
            if (crypto.randomUUID) {
                id = crypto.randomUUID();
            } else {
                // Fallback UUID v4 generator for older Node environments
                id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        }

        const newItem = {
            ...item,
            id,
            createdAt: new Date().toISOString()
        };

        // Add user-specific defaults
        if (collection === 'users') {
            newItem.tutorial_completed = false;
        }

        data[collection].push(newItem);
        writeDB(data);
        return newItem;
    },

    update: (collection, id, updates) => {
        const data = readDB();
        const index = data[collection].findIndex(i => String(i.id) === String(id) || (i.supabaseId && String(i.supabaseId) === String(id)));
        if (index !== -1) {
            data[collection][index] = { ...data[collection][index], ...updates, updatedAt: new Date().toISOString() };
            writeDB(data);
            return data[collection][index];
        }
        return null;
    },

    delete: (collection, id) => {
        const data = readDB();
        data[collection] = data[collection].filter(i =>
            String(i.id) !== String(id) &&
            (!i.supabaseId || String(i.supabaseId) !== String(id))
        );
        writeDB(data);
    },

    getById: (collection, id) => {
        const data = readDB();
        return data[collection].find(i =>
            String(i.id) === String(id) ||
            (i.supabaseId && String(i.supabaseId) === String(id))
        );
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

        // Keep xp as a total running value for consistency with syncService
        user.xp = (user.xp || 0) + amount;

        // Level up logic (Linear: 1000 XP per level, matching live calculation)
        const oldLevel = user.level || 1;
        const newLevel = Math.floor(user.xp / 1000) + 1;

        let levelUp = false;
        if (newLevel > oldLevel) {
            user.level = newLevel;
            levelUp = true;

            // Add a leveling badge
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

    deleteUser: (userId) => {
        const data = readDB();
        const collections = [
            'modules', 'studyLogs', 'tasks', 'notes', 'grades',
            'flashcardDecks', 'flashcards', 'calendarEvents',
            'pomodoroSessions', 'tutorials', 'conversations', 'messages'
        ];

        collections.forEach(col => {
            if (data[col]) {
                data[col] = data[col].filter(item =>
                    item.userId !== userId &&
                    item.senderId !== userId &&
                    !(item.participants && item.participants.includes(userId)) &&
                    !(item.members && item.members.includes(userId))
                );
            }
        });

        // Also remove user record
        if (data.users) {
            data.users = data.users.filter(u => u.id !== userId);
        }

        writeDB(data);
    },

    // Export backup function for graceful shutdown
    createBackup,
    DB_PATH
};

module.exports = db;
