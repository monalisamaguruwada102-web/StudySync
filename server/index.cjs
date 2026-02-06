const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('./database.cjs');
const supabasePersistence = require('./supabasePersistence.cjs');
const multer = require('multer');
const ical = require('node-ical');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is not set in environment variables.');
}
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

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
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDFs and Audio files are allowed'), false);
        }
    }
});

const jsonUpload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || path.extname(file.originalname).toLowerCase() === '.json') {
            cb(null, true);
        } else {
            cb(new Error('Only JSON files are allowed'), false);
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
    res.status(200).json({
        status: 'ok',
        version: SYSTEM_VERSION,
        ai_configured: !!genAI,
        timestamp: new Date().toISOString()
    });
});

// --- DOWNLOAD INSTALLER ---
app.get('/api/download/installer', (req, res) => {
    const distPath = path.join(__dirname, '../dist_electron');
    if (!fs.existsSync(distPath)) return res.status(404).send('Installer not found');

    const files = fs.readdirSync(distPath).filter(f => f.endsWith('.exe') && !f.includes('uninstaller'));
    if (files.length === 0) return res.status(404).send('Installer not ready yet');

    // Get the latest file
    const latestFile = files.map(f => ({
        name: f,
        time: fs.statSync(path.join(distPath, f)).mtime.getTime()
    })).sort((a, b) => b.time - a.time)[0];

    res.download(path.join(distPath, latestFile.name), latestFile.name);
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

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = db.find('users', u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.insert('users', {
        email,
        password: hashedPassword,
        xp: 0,
        level: 1,
        badges: []
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = db.find('users', u => u.email === email);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

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

// --- XP ENDPOINT ---
app.post('/api/user/xp', authenticateToken, (req, res) => {
    const { amount } = req.body;
    if (!amount || typeof amount !== 'number') {
        return res.status(400).json({ error: 'Invalid XP amount' });
    }
    const result = db.addXP(req.user.id, amount);
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
});

// --- CHAT ENDPOINTS ---

// Get all users (for user selector)
app.get('/api/users/all', authenticateToken, (req, res) => {
    const users = db.get('users');
    // Return basic user info (no passwords)
    const userList = users.map(u => ({
        id: u.id,
        email: u.email,
        level: u.level || 1,
        xp: u.xp || 0
    }));
    res.json(userList);
});

// Get user conversations (with participant details)
app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
        let conversations = await supabasePersistence.getConversations(req.user.id);
        const users = db.get('users');
        const localConversations = db.get('conversations') || [];
        const userLocalConvs = localConversations.filter(c =>
            c.participants && c.participants.includes(req.user.id)
        );

        let mergedConversations;
        if (!conversations) {
            mergedConversations = userLocalConvs;
        } else {
            // Merge cloud and local, using IDs and groupIds to de-duplicate
            const cloudIds = new Set(conversations.map(c => c.id));
            const localOnly = userLocalConvs.filter(c => !cloudIds.has(c.supabaseId) && !cloudIds.has(c.id));
            mergedConversations = [...conversations, ...localOnly];
        }

        // Enrich with participant/group details
        const enriched = await Promise.all(mergedConversations.map(async (conv) => {
            if (conv.type === 'group' || (conv.type === 'group' && (conv.groupId || conv.group_id))) {
                const groupId = conv.group_id || conv.groupId;
                // Try fetching group from Supabase first
                let group = await supabasePersistence.getGroup(groupId);
                if (!group) {
                    const groups = db.get('groups');
                    group = groups.find(g => g.id === groupId);
                }

                return {
                    ...conv,
                    groupName: group?.name || 'Unknown Group',
                    groupDescription: group?.description,
                    inviteCode: group?.inviteCode || group?.invite_code
                };
            } else {
                // Direct message - find the other participant
                const otherUserId = conv.participants.find(id => id !== req.user.id);
                const otherUser = users.find(u => u.id === otherUserId || u.email === otherUserId);
                return {
                    ...conv,
                    otherUser: otherUser ? {
                        id: otherUser.id,
                        email: otherUser.email,
                        level: otherUser.level,
                        xp: otherUser.xp
                    } : null
                };
            }
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error in /api/conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get messages for a conversation
app.get('/api/messages/:conversationId', authenticateToken, async (req, res) => {
    try {
        let conversation;
        const localConversations = db.get('conversations') || [];

        // Search Supabase first
        const allUserConvs = await supabasePersistence.getConversations(req.user.id);
        if (allUserConvs) {
            conversation = allUserConvs.find(c => c.id === req.params.conversationId);
        }

        // Fallback or Merge check with local
        if (!conversation) {
            conversation = localConversations.find(c => c.id === req.params.conversationId);
        }

        if (!conversation || !conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ error: 'Unauthorized or conversation not found' });
        }

        // Get messages from both sources and merge
        const cloudMessages = await supabasePersistence.getMessages(req.params.conversationId) || [];
        const localMessages = (db.get('messages') || []).filter(m => m.conversationId === req.params.conversationId);

        // De-duplicate: If a local message has a supabaseId that is in cloudMessages, ignore the local one
        const cloudIds = new Set(cloudMessages.map(m => m.id));
        const localOnly = localMessages.filter(m => !cloudIds.has(m.supabaseId) && !cloudIds.has(m.id));

        const mergedMessages = [...cloudMessages, ...localOnly].sort((a, b) => {
            const dateA = new Date(a.timestamp || a.createdAt || a.created_at || 0);
            const dateB = new Date(b.timestamp || b.createdAt || b.created_at || 0);
            return dateA - dateB;
        });

        res.json(mergedMessages);
    } catch (error) {
        console.error('Error in /api/messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Create group (admin only)
app.post('/api/groups/create', authenticateToken, async (req, res) => {
    // Check if user is admin
    if (req.user.email !== 'joshuamujakari15@gmail.com') {
        return res.status(403).json({ error: 'Only admin can create groups' });
    }

    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    let group = await supabasePersistence.createGroup({
        name,
        description: description || '',
        createdBy: req.user.id,
        members: [req.user.id],
        inviteCode
    });

    // Dual-write: Always save to local DB as well
    const localGroup = db.insert('groups', {
        name,
        description: description || '',
        createdBy: req.user.id,
        members: [req.user.id],
        inviteCode,
        supabaseId: group?.id
    });

    if (!group) group = localGroup;

    // Create a conversation for this group
    const convData = {
        type: 'group',
        groupId: group.id,
        participants: [req.user.id],
        lastMessage: 'Group created',
        lastMessageTime: new Date().toISOString()
    };

    let conversation = await supabasePersistence.createConversation(convData);

    // Dual-write: Always save to local DB
    const localConv = db.insert('conversations', {
        ...convData,
        supabaseId: conversation?.id
    });

    if (!conversation) conversation = localConv;

    res.json({ group, conversation });
});

// Join group via invite code
app.post('/api/groups/join/:inviteCode', authenticateToken, async (req, res) => {
    try {
        let group = await supabasePersistence.findGroupByInviteCode(req.params.inviteCode);
        if (!group) {
            const groups = db.get('groups');
            group = groups.find(g => (g.inviteCode || g.invite_code) === req.params.inviteCode);
        }

        if (!group) return res.status(404).json({ error: 'Invalid invite code' });

        const members = group.members || [];
        if (members.includes(req.user.id)) {
            return res.status(400).json({ error: 'Already a member of this group' });
        }

        // Update group
        const newMembers = [...members, req.user.id];
        let updatedGroup = await supabasePersistence.updateGroup(group.id, { members: newMembers });
        if (!updatedGroup) {
            updatedGroup = db.update('groups', group.id, { members: newMembers });
        }

        // Update conversation
        let conversation;
        const userConvs = await supabasePersistence.getConversations(req.user.id);
        if (userConvs) {
            conversation = userConvs.find(c => c.group_id === group.id || c.groupId === group.id);
        }

        if (!conversation) {
            const localConversations = db.get('conversations') || [];
            conversation = localConversations.find(c => c.groupId === group.id);
        }

        if (conversation) {
            const participants = conversation.participants || [];
            if (!participants.includes(req.user.id)) {
                const newParticipants = [...participants, req.user.id];
                const updatedConv = await supabasePersistence.updateConversation(conversation.id, { participants: newParticipants });
                if (!updatedConv) {
                    db.update('conversations', conversation.id, { participants: newParticipants });
                }
            }
        }

        res.json({ message: 'Successfully joined group', group: updatedGroup });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ error: 'Failed to join group' });
    }
});

// Create or get direct conversation
app.post('/api/conversations/direct', authenticateToken, async (req, res) => {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'Other user ID required' });

    try {
        // Search Supabase first
        let existing = await supabasePersistence.findDirectConversation(req.user.id, otherUserId);
        if (!existing) {
            const conversations = db.get('conversations') || [];
            existing = conversations.find(c =>
                c.type === 'direct' &&
                c.participants &&
                c.participants.includes(req.user.id) &&
                c.participants.includes(otherUserId)
            );
        }

        if (existing) {
            return res.json(existing);
        }

        // Create new conversation
        const convData = {
            type: 'direct',
            participants: [req.user.id, otherUserId],
            lastMessage: '',
            lastMessageTime: new Date().toISOString()
        };

        let conversation = await supabasePersistence.createConversation(convData);

        // Always save locally for persistence
        const localConv = db.insert('conversations', {
            ...convData,
            supabaseId: conversation?.id
        });

        if (!conversation) conversation = localConv;

        res.json(conversation);
    } catch (error) {
        console.error('Error in /api/conversations/direct:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Explicit Message Sending Override (to use Supabase)
app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { conversationId, content, type, sharedResource } = req.body;

        if (!conversationId || !content) {
            return res.status(400).json({ error: 'Conversation ID and content required' });
        }

        const messageData = {
            conversationId,
            senderId: req.user.id,
            senderEmail: req.user.email,
            content,
            type: type || 'text',
            sharedResource: sharedResource || null
        };

        // 1. Insert message into Supabase
        let message = await supabasePersistence.insertMessage(messageData);

        // 2. Always write to local DB for persistence
        const localMessage = db.insert('messages', {
            ...messageData,
            supabaseId: message?.id
        });

        if (!message) {
            message = { ...localMessage, timestamp: localMessage.createdAt };
        } else {
            // Ensure local copy also has the supabaseId
            message.timestamp = message.timestamp || localMessage.createdAt;
        }

        // 3. Update conversation's last message (Dual-update)
        const lastMessageTime = new Date().toISOString();
        const convUpdates = {
            lastMessage: content.substring(0, 50),
            lastMessageTime
        };

        await supabasePersistence.updateConversation(conversationId, convUpdates);
        db.update('conversations', conversationId, convUpdates);

        res.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// --- CRUD ROUTES ---

const collections = ['modules', 'studyLogs', 'tasks', 'notes', 'grades', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions', 'tutorials', 'conversations', 'messages', 'groups'];

const genericCollections = ['modules', 'studyLogs', 'tasks', 'notes', 'grades', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions'];

genericCollections.forEach(collection => {
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

    // Single item GET with sharing-aware permissions
    app.get(`/api/${collection}/:id`, authenticateToken, (req, res) => {
        const item = db.find(collection, i => i.id === req.params.id);
        if (!item) return res.sendStatus(404);

        if (item.userId === req.user.id) {
            return res.json(item);
        }

        // Check if shared in a conversation the user is part of
        const messages = db.get('messages') || [];
        const conversations = db.get('conversations') || [];

        const isShared = messages.some(m =>
            m.sharedResource &&
            String(m.sharedResource.id) === String(item.id) &&
            conversations.some(c => c.id === m.conversationId && c.participants.includes(req.user.id))
        );

        if (isShared) {
            return res.json(item);
        }

        res.status(403).json({ error: 'Access denied to this shared resource' });
    });
});

// --- TUTORIALS OVERRIDES (Supabase) ---
app.get('/api/tutorials', authenticateToken, async (req, res) => {
    try {
        let tutorials = await supabasePersistence.getTutorials(req.user.id);
        if (!tutorials) {
            tutorials = db.get('tutorials').filter(t => t.userId === req.user.id);
        }
        res.json(tutorials);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tutorials' });
    }
});

app.post('/api/tutorials', authenticateToken, async (req, res) => {
    try {
        const tutorialData = { ...req.body, userId: req.user.id };
        let tutorial = await supabasePersistence.insertTutorial(tutorialData);
        if (!tutorial) {
            tutorial = db.insert('tutorials', tutorialData);
        }
        res.json(tutorial);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save tutorial' });
    }
});

app.delete('/api/tutorials/:id', authenticateToken, async (req, res) => {
    try {
        const removed = await supabasePersistence.deleteTutorial(req.params.id);
        if (!removed) {
            db.delete('tutorials', req.params.id);
        }
        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete tutorial' });
    }
});

// Single tutorial GET (Supabase + Local fallback)
app.get('/api/tutorials/:id', authenticateToken, async (req, res) => {
    try {
        // Try Supabase first
        let tutorial = await supabasePersistence.getTutorialById(req.params.id);

        // Fallback to local
        if (!tutorial) {
            tutorial = db.find('tutorials', t => t.id === req.params.id);
        }

        if (!tutorial) return res.sendStatus(404);

        if (tutorial.user_id === req.user.id || tutorial.userId === req.user.id) {
            return res.json(tutorial);
        }

        // Check sharing permissions
        const messages = db.get('messages') || [];
        const conversations = db.get('conversations') || [];

        const isShared = messages.some(m =>
            m.sharedResource &&
            String(m.sharedResource.id) === String(req.params.id) &&
            conversations.some(c => c.id === m.conversationId && c.participants.includes(req.user.id))
        );

        if (isShared) {
            return res.json(tutorial);
        }

        res.status(403).json({ error: 'Access denied' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
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

// Test Calendar Connection
app.post('/api/sync/test-calendar', authenticateToken, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Calendar URL is required' });
    try {
        await ical.fromURL(url);
        res.json({ message: 'Success! Calendar connection established.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to connect: ' + error.message });
    }
});

// Test Notion Connection
app.post('/api/sync/test-notion', authenticateToken, async (req, res) => {
    const { token, databaseId } = req.body;
    if (!token) return res.status(400).json({ error: 'Notion token is required' });
    try {
        const endpoint = databaseId
            ? `https://api.notion.com/v1/databases/${databaseId}`
            : 'https://api.notion.com/v1/search';

        await axios.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28'
            }
        });
        res.json({ message: 'Success! Notion connection established.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to connect: ' + (error.response?.data?.message || error.message) });
    }
});

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
        let items = [];
        if (databaseId) {
            // Query specific database
            const response = await axios.post(`https://api.notion.com/v1/databases/${databaseId}/query`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                }
            });
            items = response.data.results;
        } else {
            // Search all pages
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
            items = response.data.results;
        }

        const tasks = items.map(page => {
            const titleProperty = Object.values(page.properties).find(p => p.type === 'title');
            const title = titleProperty?.title[0]?.plain_text || 'Untitled Notion Task';

            // Try to find a date property
            const dateProperty = Object.values(page.properties).find(p => p.type === 'date');
            const deadline = dateProperty?.date?.start || page.last_edited_time;

            // Try to find status
            const statusProperty = Object.values(page.properties).find(p => p.type === 'status' || p.type === 'select');
            const status = statusProperty?.status?.name || statusProperty?.select?.name || 'In Progress';

            return {
                title: title,
                status: status === 'Done' ? 'Completed' : 'Pending',
                priority: 'Medium',
                dueDate: deadline ? new Date(deadline).toISOString().split('T')[0] : null,
                description: `Imported from Notion: ${page.url}`,
                userId: req.user.id,
                source: 'Notion'
            };
        });

        // Insert into database
        const importedTasks = [];
        for (const task of tasks) {
            // Check for duplicates by title and source
            const existing = db.get('tasks').find(t => t.title === task.title && t.source === 'Notion' && t.userId === req.user.id);
            if (!existing) {
                const saved = db.insert('tasks', task);
                importedTasks.push(saved);
            }
        }

        res.json({ message: `Successfully imported ${importedTasks.length} new tasks`, tasks: importedTasks });
    } catch (error) {
        console.error('Notion sync error:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || error.message;
        res.status(500).json({ error: 'Failed to import from Notion: ' + errorMsg });
    }
});

// --- AI PROCESSING (Google Gemini) ---
app.post('/api/ai/process', authenticateToken, async (req, res) => {
    const { action, payload } = req.body;

    if (!genAI) {
        console.error('❌ AI Process failed: GEMINI_API_KEY is not defined on the server.');
        return res.status(500).json({
            error: 'Gemini API key is not configured on the server.',
            suggestion: 'Please set the GEMINI_API_KEY environment variable in your hosting provider settings.',
            version: SYSTEM_VERSION
        });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        let prompt = '';

        switch (action) {
            case 'summarize':
                prompt = `Summarize the following study note into a concise, well-formatted summary using Markdown. 
                Highlight key concepts with bold text and use bullet points for takeaways.
                
                Content:
                ${payload.text}`;
                break;

            case 'generateQuiz':
                prompt = `Generate a 5-question multiple choice quiz from the following study note content.
                Return the result ONLY as a JSON array of objects with the following structure:
                [{"id": number, "question": "string", "options": ["string", "string", "string", "string"], "correctIndex": number}]
                Ensure questions are challenging but fair.
                
                Content:
                ${payload.content}`;
                break;

            case 'generateFlashcards':
                prompt = `Generate a set of 5-8 flashcards from the following text related to the module "${payload.moduleName}".
                Return the result ONLY as a JSON array of objects with the following structure:
                [{"question": "string", "answer": "string", "level": number}]
                Level should be 1 for basic concepts and 2-3 for more complex ones.
                
                Text:
                ${payload.text}`;
                break;

            case 'generateStudyPlan':
                prompt = `Act as an expert study coach. Generate a personalized daily study plan for today.
                
                Current Data:
                - Modules: ${JSON.stringify(payload.modules)}
                - Tasks/Exams: ${JSON.stringify(payload.tasks)}
                - Flashcards: ${payload.cardCount} total.
                
                Instructions:
                1. Prioritize upcoming exams (titles containing Exam, Quiz, Test).
                2. Include time for active recall (flashcards).
                3. Break sessions into manageable chunks (30m - 2h).
                4. Return ONLY a JSON array of objects:
                   [{"type": "exam_prep" | "review" | "task", "title": "string", "duration": "string", "reason": "string"}]
                
                Make the plan realistic and evidence-based.`;
                break;

            default:
                return res.status(400).json({ error: 'Invalid AI action' });
        }

        console.log(`🤖 AI Action: ${action} - Generating content...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text();
        console.log(`✅ AI Response received (${responseText.length} chars)`);

        // Extract JSON for structured responses
        if (['generateQuiz', 'generateFlashcards', 'generateStudyPlan'].includes(action)) {
            try {
                // Remove any markdown formatting if present
                const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                return res.json(JSON.parse(cleanJson));
            } catch (pErr) {
                console.error('JSON Parse error on AI response:', responseText);
                return res.status(500).json({
                    error: 'AI returned invalid JSON format',
                    details: responseText.substring(0, 100) + '...'
                });
            }
        }

        res.json({ text: responseText });

    } catch (error) {
        console.error(`Gemini AI error (${action}):`, error);
        res.status(500).json({
            error: 'AI processing failed on the server',
            message: error.message,
            action: action
        });
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


// START SERVER
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
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
