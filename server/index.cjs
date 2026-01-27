const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database.cjs');
const multer = require('multer');

const app = express();

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
    let user = db.find('users', u => u.email === email);

    const settings = db.getSettings();

    if (!user) {
        // If no owner set, this is the first user
        if (!settings.owner) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = db.insert('users', { email, password: hashedPassword });
            db.updateSettings({ owner: { uid: user.id, email: user.email } });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
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

    const settings = db.getSettings();
    const isAuthorized = settings.owner && settings.owner.uid === req.user.id;

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, authorized: isAuthorized });
});

// --- CRUD ROUTES ---

const collections = ['modules', 'studyLogs', 'tasks', 'notes', 'grades', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions'];

collections.forEach(collection => {
    app.get(`/api/${collection}`, authenticateToken, (req, res) => {
        res.json(db.get(collection));
    });

    app.post(`/api/${collection}`, authenticateToken, (req, res) => {
        const item = db.insert(collection, req.body);
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
    const item = db.insert('studyLogs', req.body);
    const xpAmount = Math.round(parseFloat(req.body.hours || 0) * 100);
    const result = db.addXP(xpAmount);
    res.json({ item, xpGain: xpAmount, ...result });
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const oldTask = db.find('tasks', t => t.id === req.params.id);
    const item = db.update('tasks', req.params.id, req.body);

    let xpGain = 0;
    let gamification = null;

    if (oldTask && oldTask.status !== 'Completed' && req.body.status === 'Completed') {
        xpGain = 100;
        gamification = db.addXP(xpGain);
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
        gamification = db.addXP(xpGain);
    }

    res.json({ item, xpGain, ...gamification });
});

app.post('/api/pomodoroSessions', authenticateToken, (req, res) => {
    const item = db.insert('pomodoroSessions', req.body);
    const xpGain = 50;
    const result = db.addXP(xpGain);
    res.json({ item, xpGain, ...result });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
