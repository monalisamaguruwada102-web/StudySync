const { contextBridge, ipcRenderer } = require('electron');

// Briges the main process with the renderer process securely
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    version: process.versions.electron,
    // Add more desktop-specific APIs here if needed
});

console.log('🛡️ StudySync Desktop Bridge Active');
