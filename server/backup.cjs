const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const { uploadToMega } = require('./megaPersistence.cjs');

const createBackup = async () => {
    // Check if db.json exists
    if (!fs.existsSync(DB_PATH)) {
        console.log('❌ No db.json found to backup.');
        return null;
    }

    // Generate timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `db-backup-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, fileName);

    // Copy db.json to backup
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`✅ [${new Date().toLocaleTimeString()}] Database backed up locally to: ${path.basename(backupPath)}`);

    // Trigger MEGA backup (asynchronous)
    uploadToMega(backupPath, fileName).catch(err => {
        console.error('⚠️ [MEGA] Background upload failed:', err);
    });

    // Clean up old backups (keep only last 10)
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('db-backup-') && f.endsWith('.json'))
        .sort()
        .reverse();

    if (backups.length > 10) {
        const toDelete = backups.slice(10);
        toDelete.forEach(file => {
            fs.unlinkSync(path.join(BACKUP_DIR, file));
            console.log(`🗑️ Deleted old backup: ${file}`);
        });
    }

    console.log(`📦 Total local backups: ${Math.min(backups.length, 10)}`);
    return backupPath;
};

// Run backup if called directly from command line
if (require.main === module) {
    createBackup();
}

module.exports = { createBackup };
