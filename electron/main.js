const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "StudySync Desktop",
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Remove default menu
    mainWindow.setMenuBarVisibility(false);

    // URL for the live hosted site
    const liveUrl = "https://www.joshwebs.co.zw/";
    let currentVersion = null;

    const checkForUpdates = async () => {
        try {
            const fetch = require('node-fetch');
            const response = await fetch(`${liveUrl}api/version`);
            const data = await response.json();

            if (currentVersion && data.version !== currentVersion) {
                console.log("🚀 New version detected! Reloading...");
                mainWindow.reload();
            }
            currentVersion = data.version;
        } catch (e) {
            // Ignore offline errors during background check
        }
    };

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Attempt to load live site, fallback to local file on failure
        mainWindow.loadURL(liveUrl).then(() => {
            // Start periodic version checking after initial load
            setInterval(checkForUpdates, 1000 * 60 * 5); // Check every 5 minutes
        }).catch(() => {
            console.log("⚠️ Offline or server down - loading local fallback");
            mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        });
    }

    // Open external links in the default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
