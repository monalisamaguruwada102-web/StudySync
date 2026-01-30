const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('./database.cjs');
const multer = require('multer');
const ical = require('node-ical');
const axios = require('axios');

const app = express();

// --- VERSIONING (For Auto-Push Updates) ---
const SYSTEM_VERSION = "1.2.0";
app.get('/api/version', (req, res) => res.json({ version: SYSTEM_VERSION }));

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../dist')));

// Configure Multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './server/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDFs are allowed'), false);
        }
    }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'study-secret-key';

app.use(cors({
    origin: '*', // Allow all origins for simplicity in deployment
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- UPLOAD ROUTE ---
app.post('/api/upload', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            filePath: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname
        });
    });
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Whitelist check
    const allowedUsers = ['joshuamujakari15@gmail.com', 'monalisamaguruwada@gmail.com'];
    if (!allowedUsers.includes(email)) {
        return res.status(403).json({ error: 'Access denied. Please contact system administrator.' });
    }

    let user = db.find('users', u => u.email === email);

    const settings = db.getSettings();

    if (!user) {
        // If no owner set, this is the first user
        if (!settings.owner) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = db.insert('users', { email, password: hashedPassword });
            db.updateSettings({ owner: { uid: user.id, email: user.email } });
        } else {
            // Allow new users to sign up even if owner exists (Multi-user capability)
            const hashedPassword = await bcrypt.hash(password, 10);
            user = db.insert('users', { email, password: hashedPassword });
        }
    } else {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = db.find('users', u => u.id === req.user.id);
    if (!user) return res.sendStatus(404);

    const isAuthorized = true;

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, authorized: isAuthorized });
});

// --- PER-USER SETTINGS ---
app.get('/api/user/settings', authenticateToken, (req, res) => {
    const user = db.find('users', u => u.id === req.user.id);
    res.json(user.settings || {});
});

app.post('/api/user/settings', authenticateToken, (req, res) => {
    const user = db.find('users', u => u.id === req.user.id);
    const updatedUser = db.update('users', user.id, {
        settings: { ...(user.settings || {}), ...req.body }
    });
    res.json(updatedUser.settings);
});

// --- CRUD ROUTES ---

const collections = ['modules', 'studyLogs', 'tasks', 'notes', 'grades', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions'];

collections.forEach(collection => {
    app.get(`/api/${collection}`, authenticateToken, (req, res) => {
        const items = db.get(collection);
        // Filter by userId to ensure data isolation
        const userItems = items.filter(i => i.userId === req.user.id);
        res.json(userItems);
    });

    app.post(`/api/${collection}`, authenticateToken, (req, res) => {
        // Attach userId to new items
        const item = db.insert(collection, { ...req.body, userId: req.user.id });
        res.json(item);
    });

    app.put(`/api/${collection}/:id`, authenticateToken, (req, res) => {
        const item = db.update(collection, req.params.id, req.body);
        if (item) res.json(item);
        else res.sendStatus(404);
    });

    app.delete(`/api/${collection}/:id`, authenticateToken, (req, res) => {
        db.delete(collection, req.params.id);
        res.sendStatus(204);
    });
});

// --- GAMIFICATION OVERRIDES ---

app.post('/api/studyLogs', authenticateToken, (req, res) => {
    const item = db.insert('studyLogs', { ...req.body, userId: req.user.id });
    const xpAmount = Math.round(parseFloat(req.body.hours || 0) * 100);
    const result = db.addXP(req.user.id, xpAmount);
    res.json({ item, xpGain: xpAmount, ...result });
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const oldTask = db.find('tasks', t => t.id === req.params.id);
    const item = db.update('tasks', req.params.id, req.body);

    let xpGain = 0;
    let gamification = null;

    if (oldTask && oldTask.status !== 'Completed' && req.body.status === 'Completed') {
        xpGain = 100;
        gamification = db.addXP(req.user.id, xpGain);
    }

    res.json({ item, xpGain, ...gamification });
});

app.put('/api/flashcards/:id', authenticateToken, (req, res) => {
    const oldCard = db.find('flashcards', c => c.id === req.params.id);
    const item = db.update('flashcards', req.params.id, req.body);

    let xpGain = 0;
    let gamification = null;

    if (oldCard && req.body.level > oldCard.level) {
        xpGain = 50;
        gamification = db.addXP(req.user.id, xpGain);
    }

    res.json({ item, xpGain, ...gamification });
});

app.post('/api/pomodoroSessions', authenticateToken, (req, res) => {
    const item = db.insert('pomodoroSessions', { ...req.body, userId: req.user.id });
    const xpGain = 50;
    const result = db.addXP(req.user.id, xpGain);
    res.json({ item, xpGain, ...result });
});

// --- Data Preservation Endpoints (USER SCOPED) ---

// Export user-specific database
app.get('/api/admin/export', authenticateToken, (req, res) => {
    const allData = db.getRawData();
    const userData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        user: { email: req.user.email },
        data: {}
    };

    // Filter every collection by userId
    const collections = ['modules', 'studyLogs', 'tasks', 'notes', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions'];
    collections.forEach(col => {
        userData.data[col] = (allData[col] || []).filter(item => item.userId === req.user.id);
    });

    const fileName = `studysync-export-${req.user.id}.json`;
    const filePath = path.join(__dirname, 'uploads', 'temp', fileName);

    if (!fs.existsSync(path.join(__dirname, 'uploads', 'temp'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads', 'temp'), { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
    res.download(filePath, 'my-study-backup.json', () => {
        fs.unlinkSync(filePath); // Cleanup after download
    });
});

// Import user-specific database
app.post('/api/admin/import', authenticateToken, jsonUpload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        const imported = JSON.parse(fileContent);

        if (!imported.data) throw new Error('Invalid export format');

        const allData = db.getRawData();
        const collections = ['modules', 'studyLogs', 'tasks', 'notes', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions'];

        collections.forEach(col => {
            if (imported.data[col]) {
                // Remove existing user items to avoid duplicates on fresh import
                allData[col] = allData[col].filter(item => item.userId !== req.user.id);
                // Add new items with the current user's ID to be safe
                const itemsToImport = imported.data[col].map(item => ({ ...item, userId: req.user.id }));
                allData[col].push(...itemsToImport);
            }
        });

        await db.restore(allData);
        fs.unlinkSync(req.file.path);
        res.json({ message: 'Your study data has been restored successfully!' });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to restore your data: ' + error.message });
    }
});

// --- SYNC ROUTES ---

// Google Calendar iCal Sync
app.post('/api/sync/calendar', authenticateToken, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Calendar URL is required' });

    try {
        const events = await ical.fromURL(url);
        const formattedEvents = [];

        for (const k in events) {
            if (events.hasOwnProperty(k)) {
                const ev = events[k];
                if (ev.type === 'VEVENT') {
                    formattedEvents.push({
                        id: `external-${ev.uid || k}`,
                        title: ev.summary || 'Untitled Event',
                        start: ev.start,
                        end: ev.end,
                        description: ev.description || '',
                        location: ev.location || '',
                        isExternal: true,
                        source: 'Google Calendar'
                    });
                }
            }
        }

        res.json(formattedEvents);
    } catch (error) {
        console.error('Calendar sync error:', error);
        res.status(500).json({ error: 'Failed to sync calendar: ' + error.message });
    }
});

// Notion Task Import
app.post('/api/sync/notion-tasks', authenticateToken, async (req, res) => {
    const { token, databaseId } = req.body;
    if (!token) return res.status(400).json({ error: 'Notion token is required' });

    try {
        // Fetch tasks from Notion (using Search or Query Database)
        // For simplicity, we search for 'Pages' which are often used as tasks
        const response = await axios.post('https://api.notion.com/v1/search', {
            filter: { property: 'object', value: 'page' },
            sort: { direction: 'descending', timestamp: 'last_edited_time' }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });

        const tasks = response.data.results.map(page => {
            const titleProperty = Object.values(page.properties).find(p => p.type === 'title');
            const title = titleProperty ? titleProperty.title[0]?.plain_text : 'Untitled Notion Task';

            return {
                title: title,
                status: 'In Progress',
                priority: 'Medium',
                deadline: page.last_edited_time,
                description: `Imported from Notion: ${page.url}`,
                userId: req.user.id,
                source: 'Notion'
            };
        });

        // Insert into database
        const importedTasks = [];
        for (const task of tasks) {
            const saved = db.insert('tasks', task);
            importedTasks.push(saved);
        }

        res.json({ message: `Successfully imported ${importedTasks.length} tasks`, tasks: importedTasks });
    } catch (error) {
        console.error('Notion sync error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to import from Notion: ' + (error.response?.data?.message || error.message) });
    }
});

// SPA Catch-all (Ignore assets and API)
app.get(/.*/, (req, res, next) => {
    // If request is for an asset or API, skip to 404
    if (req.url.startsWith('/api/') || req.url.includes('.') || req.url.startsWith('/assets/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Final 404 handler
app.use((req, res) => {
    res.status(404).send('Not Found');
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Create final backup
    console.log('📦 Creating final backup...');
    const backupPath = db.createBackup();
    if (backupPath) {
        console.log('✅ Final backup created successfully');
    }

    // Close server
    server.close(() => {
        console.log('👋 Server closed. All data saved.');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
