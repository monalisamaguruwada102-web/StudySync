const { Storage } = require('megajs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MEGA_EMAIL = process.env.MEGA_EMAIL;
const MEGA_PASSWORD = process.env.MEGA_PASSWORD;

/**
 * Uploads a file to MEGA storage.
 * @param {string} localPath Path to the local file to upload.
 * @param {string} remoteName Name of the file in MEGA storage.
 * @returns {Promise<boolean>} True if upload was successful, false otherwise.
 */
const uploadToMega = async (localPath, remoteName) => {
    if (!MEGA_EMAIL || !MEGA_PASSWORD) {
        console.warn('⚠️ MEGA credentials not configured - skipping cloud backup');
        return false;
    }

    try {
        console.log(`☁️ Connecting to MEGA as ${MEGA_EMAIL}...`);
        const storage = await new Storage({
            email: MEGA_EMAIL,
            password: MEGA_PASSWORD
        }).ready;

        console.log(`📦 Uploading ${path.basename(localPath)} to MEGA...`);

        // Find or create 'StudySync_Backups' folder
        let folder = storage.root.children.find(f => f.name === 'StudySync_Backups' && f.directory);
        if (!folder) {
            folder = await storage.mkdir('StudySync_Backups');
        }

        const fileData = fs.readFileSync(localPath);
        await folder.upload(remoteName, fileData).complete;

        console.log(`✅ MEGA backup successful: ${remoteName}`);
        return true;
    } catch (error) {
        console.error('❌ MEGA backup failed:', error);
        return false;
    }
};

module.exports = { uploadToMega };
