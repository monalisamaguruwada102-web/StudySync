const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate timestamp for backup filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `db-backup-${timestamp}.json`);

// Check if db.json exists
if (!fs.existsSync(DB_PATH)) {
    console.log('❌ No db.json found to backup.');
    process.exit(1);
}

// Copy db.json to backup
fs.copyFileSync(DB_PATH, backupPath);
console.log(`✅ Database backed up to: ${backupPath}`);

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

console.log(`📦 Total backups: ${Math.min(backups.length, 10)}`);
