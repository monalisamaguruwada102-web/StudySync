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
        badges: [],
        newly_registered: true
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    // Sync to Supabase immediately to avoid data loss
    try {
        const cloudUser = await supabasePersistence.upsertToCollection('users', user);
        if (cloudUser) {
            db.update('users', user.id, { supabaseId: cloudUser.id });
        }
    } catch (syncErr) {
        console.error('❌ Failed to sync new user to Supabase:', syncErr.message);
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    let user = db.find('users', u => u.email === email);

    // Initial check: if not found locally, try finding in Supabase (Cloud Fallback)
    if (!user) {
        console.log(`User ${email} not found locally, checking Supabase...`);
        const cloudUser = await supabasePersistence.getItemByField('users', 'email', email);

        if (cloudUser) {
            // Found in cloud! Sync it down.
            console.log(`User ${email} found in Supabase. Syncing to local DB.`);
            user = db.insert('users', {
                ...cloudUser,
                supabaseId: cloudUser.id // Ensure we track the cloud ID
            });
        }
    }

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    // Sync to Supabase immediately to avoid data loss
    try {
        const cloudUser = await supabasePersistence.upsertToCollection('users', user);
        if (cloudUser) {
            db.update('users', user.id, { supabaseId: cloudUser.id });
        }
    } catch (syncErr) {
        console.error('❌ Failed to sync new user to Supabase:', syncErr.message);
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = db.find('users', u => u.id === req.user.id);
    if (!user) return res.sendStatus(404);

    const isAuthorized = true;

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, authorized: isAuthorized });
});

// --- SHARED RESOURCE ROUTES (With Cloud Fallback) ---
app.get('/api/tutorials/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let item = db.find('tutorials', t => t.id === id);

        if (!item) {
            console.log(`Shared tutorial ${id} not found locally, checking Supabase...`);
            item = await supabasePersistence.getById('tutorials', id);
        }

        if (!item) return res.status(404).json({ error: 'Tutorial not found' });
        res.json(item);
    } catch (err) {
        console.error('Error fetching shared tutorial:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/notes/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let item = db.find('notes', n => n.id === id);

        if (!item) {
            console.log(`Shared note ${id} not found locally, checking Supabase...`);
            item = await supabasePersistence.getById('notes', id);
        }

        if (!item) return res.status(404).json({ error: 'Note not found' });
        res.json(item);
    } catch (err) {
        console.error('Error fetching shared note:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/flashcardDecks/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let item = db.find('flashcard_decks', d => d.id === id);

        if (!item) {
            console.log(`Shared deck ${id} not found locally, checking Supabase...`);
            // Note: Supabase table is 'flashcard_decks'
            item = await supabasePersistence.getById('flashcard_decks', id);
        }

        if (!item) return res.status(404).json({ error: 'Deck not found' });
        res.json(item);
    } catch (err) {
        console.error('Error fetching shared deck:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- TUTORIALS ---
app.get('/api/tutorials', authenticateToken, (req, res) => {
    const tutorials = db.filter('tutorials', t => t.userId === req.user.id);
    res.json(tutorials);
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

// --- TUTORIAL STATUS ---
app.post('/api/users/tutorial-status', authenticateToken, async (req, res) => {
    try {
        const { visited } = req.body;
        const user = db.find('users', u => u.id === req.user.id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const updatedUser = db.update('users', user.id, {
            tutorial_completed: !!visited
        });

        // Sync to Supabase if possible
        try {
            await supabasePersistence.upsertToCollection('users', {
                id: user.id,
                tutorial_completed: !!visited
            });
        } catch (syncErr) {
            console.warn('Could not sync tutorial status to Supabase:', syncErr.message);
        }

        const { password, ...safeUser } = updatedUser;
        res.json({ success: true, user: safeUser });
    } catch (error) {
        console.error('Error updating tutorial status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- XP ENDPOINT ---
app.post('/api/user/xp', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    if (!amount || typeof amount !== 'number') {
        return res.status(400).json({ error: 'Invalid XP amount' });
    }
    const result = db.addXP(req.user.id, amount);
    if (!result) return res.status(404).json({ error: 'User not found' });

    // Sync to Supabase immediately
    try {
        await supabasePersistence.upsertToCollection('users', result.user);
    } catch (syncErr) {
        console.warn('Could not sync XP to Supabase:', syncErr.message);
    }

    res.json(result);
});

// --- CHAT ENDPOINTS ---

// Get all users (for user selector)
app.get('/api/users/all', authenticateToken, async (req, res) => {
    try {
        let users = await supabasePersistence.fetchAll('users');
        if (!users || users.length === 0) {
            users = db.get('users') || [];
        }

        // Return basic user info (no passwords) and remove test accounts
        const userList = users
            .filter(u => u.email && !u.email.endsWith('@example.com'))
            .map(u => ({
                id: u.id,
                email: u.email,
                level: u.level || 1,
                xp: u.xp || 0
            }));
        res.json(userList);
    } catch (error) {
        console.error('Error in /api/users/all:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
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

                // Filter check for unwanted groups
                if (group && (
                    group.name === 'DATABASE ADMIN GROUP' ||
                    group.name === 'COMPUTER SECURITY GROUP' ||
                    group.name === 'DATABASE ADMIN' ||
                    group.name === 'COMPUTER SECURITY'
                )) {
                    return null;
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
                const users = db.get('users') || [];
                const otherUser = users.find(u => u.id === otherUserId);

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

        res.json(enriched.filter(Boolean));
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
    if (req.user.email !== (process.env.ADMIN_EMAIL || 'joshuamujakari15@gmail.com')) {
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

// Get all public groups
app.get('/api/groups', authenticateToken, async (req, res) => {
    try {
        let groups = await supabasePersistence.getGroups();
        if (!groups || groups.length === 0) {
            groups = db.get('groups') || [];
        }

        // Filter out unwanted groups
        const filteredGroups = groups.filter(g =>
            g.name !== 'DATABASE ADMIN GROUP' &&
            g.name !== 'COMPUTER SECURITY GROUP' &&
            g.name !== 'DATABASE ADMIN' &&
            g.name !== 'COMPUTER SECURITY'
        );

        res.json(filteredGroups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

app.post('/api/groups/join/:inviteCode', authenticateToken, async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const userId = req.user.id;

        let group = await supabasePersistence.findGroupByInviteCode(inviteCode);
        if (!group) {
            const groups = db.get('groups') || [];
            group = groups.find(g => (g.inviteCode || g.invite_code) === inviteCode);
        }

        if (!group) {
            return res.status(404).json({ error: 'Invalid invite code. Please check the code and try again.' });
        }

        const members = group.members || [];
        if (members.includes(userId)) {
            return res.status(400).json({ error: 'You are already a member of this group.' });
        }

        // Update group members
        const newMembers = [...members, userId];
        let updatedGroup = await supabasePersistence.updateGroup(group.id, { members: newMembers });

        if (!updatedGroup) {
            // Fallback to local update
            updatedGroup = db.update('groups', group.id, { members: newMembers });
        }

        if (!updatedGroup) {
            return res.status(500).json({ error: 'Failed to update group membership.' });
        }

        // Update or create group conversation
        let conversation;
        // Search Supabase first (try finding any conversation for this group)
        try {
            const client = supabasePersistence.initSupabase();
            if (client) {
                const { data, error } = await client
                    .from('conversations')
                    .select('*')
                    .eq('group_id', group.id)
                    .single();

                if (data && !error) {
                    conversation = {
                        id: data.id,
                        type: data.type,
                        groupId: data.group_id,
                        participants: data.participants || []
                    };
                }
            }
        } catch (err) {
            console.error('Error finding group conversation in Supabase:', err);
        }

        if (!conversation) {
            const localConversations = db.get('conversations') || [];
            conversation = localConversations.find(c => c.groupId === group.id);
        }

        if (conversation) {
            const participants = conversation.participants || [];
            if (!participants.includes(userId)) {
                const newParticipants = [...participants, userId];
                const updatedConv = await supabasePersistence.updateConversation(conversation.id, {
                    participants: newParticipants,
                    lastMessage: `${req.user.email} joined the group`,
                    lastMessageTime: new Date().toISOString()
                });

                if (updatedConv) {
                    db.update('conversations', conversation.id, {
                        participants: newParticipants,
                        lastMessage: `${req.user.email} joined the group`,
                        lastMessageTime: new Date().toISOString(),
                        supabaseId: updatedConv.id
                    });
                } else {
                    db.update('conversations', conversation.id, {
                        participants: newParticipants,
                        lastMessage: `${req.user.email} joined the group`,
                        lastMessageTime: new Date().toISOString()
                    });
                }
            } else {
                // User is already a participant in the conversation, possibly a retry
                return res.status(400).json({ error: 'You are already in this group chat.' });
            }
        }

        res.json({
            message: 'Successfully joined group',
            group: updatedGroup,
            conversationId: conversation?.id
        });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({
            error: 'Failed to join group due to a server error.',
            details: error.message
        });
    }
});

// Shared note fetch (Read-only access to any note by ID)
app.get('/api/notes/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let note = await supabasePersistence.getById('notes', id);

        if (!note) {
            note = db.find('notes', n => n.id === id);
        }

        if (!note) {
            return res.status(404).json({ error: 'Note not found or link has expired.' });
        }

        // Return note without ownership restriction for this specific path
        res.json(note);
    } catch (error) {
        console.error('Error fetching shared note:', error);
        res.status(500).json({ error: 'System error fetching shared note.' });
    }
});

// Shared tutorial fetch (Read-only access to any tutorial by ID)
app.get('/api/tutorials/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let tutorial = await supabasePersistence.getById('tutorials', id);

        if (!tutorial) {
            tutorial = db.find('tutorials', t => t.id === id);
        }

        if (!tutorial) {
            return res.status(404).json({ error: 'Tutorial not found or link has expired.' });
        }

        // Return tutorial without ownership restriction for this specific path
        res.json(tutorial);
    } catch (error) {
        console.error('Error fetching shared tutorial:', error);
        res.status(500).json({ error: 'System error fetching shared tutorial.' });
    }
});

// Shared flashcard deck fetch (Read-only access to any deck by ID)
app.get('/api/flashcardDecks/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Check "flashcard_decks" table in Supabase
        let deck = await supabasePersistence.getById('flashcard_decks', id);

        if (!deck) {
            // Check "flashcardDecks" collection in local DB
            deck = db.find('flashcardDecks', d => d.id === id);
        }

        if (!deck) {
            return res.status(404).json({ error: 'Flashcard deck not found or link has expired.' });
        }

        // Return deck without ownership restriction for this specific path
        res.json(deck);
    } catch (error) {
        console.error('Error fetching shared flashcard deck:', error);
        res.status(500).json({ error: 'System error fetching shared flashcard deck.' });
    }
});

// Direct message creation logic starts below
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
            lastMessageTime: new Date().toISOString(),
            status: 'pending',
            initiatorId: req.user.id
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

        const now = new Date().toISOString();
        const messageData = {
            conversationId,
            senderId: req.user.id,
            senderEmail: req.user.email,
            content,
            type: type || 'text',
            sharedResource: sharedResource || null,
            status: 'sent',
            timestamp: now,
            createdAt: now
        };

        // 1. Insert message into Supabase (if conversationId is a valid UUID)
        let message = null;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId);

        if (isUUID) {
            message = await supabasePersistence.insertMessage(messageData);
        }

        // 2. Always write to local DB for persistence
        const localMessage = db.insert('messages', {
            ...messageData,
            supabaseId: message?.id
        });

        // Use the most accurate message object for the response
        const finalMessage = message || { ...localMessage, timestamp: now };

        // 3. Update conversation's last message (Dual-update)
        const convUpdates = {
            lastMessage: content.substring(0, 50),
            lastMessageTime: now
        };

        if (isUUID) {
            await supabasePersistence.updateConversation(conversationId, convUpdates);
        }
        db.update('conversations', conversationId, convUpdates);

        res.json(finalMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Respond to conversation request
app.post('/api/conversations/:id/respond', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body; // 'active' or 'rejected'
        const conversationId = req.params.id;

        // Update in Supabase
        await supabasePersistence.updateConversation(conversationId, { status });

        // Update locally
        db.update('conversations', conversationId, { status });

        res.json({ success: true, status });
    } catch (error) {
        console.error('Error responding to request:', error);
        res.status(500).json({ error: 'Failed to respond to request' });
    }
});

// Mark messages as read
app.post('/api/conversations/:id/read', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.id;

        // Only attempt Supabase update if ID looks like a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId);

        if (isUUID) {
            await supabasePersistence.markMessagesAsRead(conversationId, req.user.id);
        }

        // Update locally (optional, since UI usually refreshes or updates optimistically)
        const messages = db.get('messages') || [];
        messages.forEach(m => {
            if (m.conversationId === conversationId && m.senderId !== req.user.id) {
                db.update('messages', m.id, { read: true });
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// --- CRUD ROUTES ---

const collections = ['modules', 'studyLogs', 'tasks', 'notes', 'grades', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions', 'tutorials', 'conversations', 'messages', 'groups'];

const genericCollections = ['modules', 'studyLogs', 'tasks', 'notes', 'grades', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions', 'tutorials'];

// Redundant specific tutorial routes removed to use consolidated generic routes


app.post('/api/studyLogs', authenticateToken, async (req, res) => {
    const item = db.insert('studyLogs', { ...req.body, userId: req.user.id });
    const xpAmount = Math.round(parseFloat(req.body.hours || 0) * 100);
    const result = db.addXP(req.user.id, xpAmount);

    // Sync to Supabase
    try {
        await supabasePersistence.upsertToCollection('users', result.user);
    } catch (err) {
        console.warn('XP sync failed for study logs:', err.message);
    }

    res.json({ item, xpGain: xpAmount, ...result });
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        let item = db.update('tasks', req.params.id, req.body);

        // If not found locally, it might be in Supabase
        if (!item) {
            console.log(`⚠️ Task ${req.params.id} not found locally, checking Supabase...`);
            const cloudTask = await supabasePersistence.getById('tasks', req.params.id);
            if (cloudTask) {
                // Merge cloud task with updates and save locally
                item = { ...cloudTask, ...req.body, id: req.params.id, userId: req.user.id };
                db.insert('tasks', item);
            } else {
                // Truly new task or orphaned update - handle gracefully
                console.log(`⚠️ Task ${req.params.id} not found in cloud either. Creating new.`);
                item = { ...req.body, id: req.params.id, userId: req.user.id };
                // Ensure a title exists if creating new
                if (!item.title) item.title = 'Untitled Task';
                db.insert('tasks', item);
            }
        }

        // Sync to Supabase
        await supabasePersistence.upsertToCollection('tasks', item);

        let xpGain = 0;
        let gamification = null;

        // Note: we can't easily check 'oldTask' if it wasn't local, 
        // but for XP we usually care about the transition to 'Completed'
        if (req.body.status === 'Completed') {
            xpGain = 100;
            gamification = db.addXP(req.user.id, xpGain);

            // Sync user state with new XP to Supabase
            try {
                await supabasePersistence.upsertToCollection('users', gamification.user);
            } catch (syncErr) {
                console.warn('Could not sync user XP to Supabase during task update:', syncErr.message);
            }
        }

        res.json({ item, xpGain, ...gamification });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task and sync to cloud' });
    }
});

const tableMap = {
    'users': 'users',
    'modules': 'modules',
    'studyLogs': 'study_logs',
    'tasks': 'tasks',
    'notes': 'notes',
    'grades': 'grades',
    'flashcardDecks': 'flashcard_decks',
    'flashcards': 'flashcards',
    'calendarEvents': 'calendar_events',
    'pomodoroSessions': 'pomodoro_sessions',
    'tutorials': 'tutorials'
};

genericCollections.forEach(collection => {
    app.get(`/api/${collection}`, authenticateToken, async (req, res) => {
        const supabaseTable = tableMap[collection];
        let cloudItems = null;
        if (supabaseTable) {
            try {
                cloudItems = await supabasePersistence.fetchCollection(supabaseTable, req.user.id);
            } catch (error) {
                console.error(`⚠️ Supabase fetch failed for ${collection}:`, error);
            }
        }

        const localItems = (db.get(collection) || []).filter(i => i.userId === req.user.id);

        if (!cloudItems) {
            return res.json(localItems);
        }

        // Merge cloud and local items. Supabase is primary.
        // Match by id or supabaseId to avoid duplicates.
        const cloudIds = new Set(cloudItems.map(i => i.id));
        const localOnly = localItems.filter(i => !cloudIds.has(i.supabaseId) && !cloudIds.has(i.id));

        const mergedItems = [...cloudItems, ...localOnly];
        res.json(mergedItems);
    });

    app.get(`/api/${collection}/:id`, authenticateToken, async (req, res) => {
        const supabaseTable = tableMap[collection];
        if (supabaseTable) {
            try {
                // For now, fetchCollection fetches all, we filter for ID. 
                // In a more mature system, we'd add fetchOne to supabasePersistence.
                const cloudItems = await supabasePersistence.fetchCollection(supabaseTable, req.user.id);
                const item = cloudItems ? cloudItems.find(i => i.id === req.params.id) : null;
                if (item) {
                    return res.json(item);
                }
            } catch (error) {
                console.error(`⚠️ Supabase fetch by ID failed for ${collection}, falling back to local:`, error);
            }
        }

        const item = db.getById(collection, req.params.id);
        if (item && item.userId === req.user.id) {
            res.json(item);
        } else {
            res.sendStatus(404);
        }
    });

    app.post(`/api/${collection}`, authenticateToken, async (req, res) => {
        const now = new Date().toISOString();
        // Attach userId and timestamps to new items
        const rawItem = {
            ...req.body,
            userId: req.user.id,
            createdAt: now,
            updatedAt: now
        };

        let finalItem = db.insert(collection, rawItem);

        // Sync to Supabase
        const supabaseTable = tableMap[collection];
        if (supabaseTable) {
            try {
                const cloudItem = await supabasePersistence.upsertToCollection(supabaseTable, finalItem);
                if (cloudItem) {
                    finalItem = db.update(collection, finalItem.id, { supabaseId: cloudItem.id });
                }
            } catch (error) {
                console.error(`❌ Supabase sync failed during POST for ${collection}:`, error);
            }
        }

        res.json(finalItem);
    });

    app.put(`/api/${collection}/:id`, authenticateToken, async (req, res) => {
        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        let item = db.update(collection, req.params.id, updates);
        if (item) {
            // Sync update to Supabase
            const supabaseTable = tableMap[collection];
            if (supabaseTable) {
                try {
                    await supabasePersistence.upsertToCollection(supabaseTable, item);
                } catch (error) {
                    console.error(`❌ Supabase sync failed during PUT for ${collection}:`, error);
                }
            }
            res.json(item);
        } else {
            res.sendStatus(404);
        }
    });

    app.delete(`/api/${collection}/:id`, authenticateToken, async (req, res) => {
        db.delete(collection, req.params.id);

        // Sync delete to Supabase
        const supabaseTable = tableMap[collection];
        if (supabaseTable) {
            try {
                await supabasePersistence.deleteFromCollection(supabaseTable, req.params.id);
            } catch (error) {
                console.error(`❌ Supabase sync failed during DELETE for ${collection}:`, error);
            }
        }

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



app.put('/api/flashcards/:id', authenticateToken, async (req, res) => {
    const oldCard = db.find('flashcards', c => c.id === req.params.id);
    const item = db.update('flashcards', req.params.id, req.body);

    let xpGain = 0;
    let gamification = null;

    if (oldCard && req.body.level > oldCard.level) {
        xpGain = 50;
        gamification = db.addXP(req.user.id, xpGain);

        // Sync to Supabase
        try {
            await supabasePersistence.upsertToCollection('users', gamification.user);
        } catch (err) {
            console.warn('XP sync failed for flashcard level up:', err.message);
        }
    }

    res.json({ item, xpGain, ...gamification });
});

app.post('/api/pomodoroSessions', authenticateToken, async (req, res) => {
    const item = db.insert('pomodoroSessions', { ...req.body, userId: req.user.id });
    const xpGain = 50;
    const result = db.addXP(req.user.id, xpGain);

    // Sync to Supabase
    try {
        await supabasePersistence.upsertToCollection('users', result.user);
    } catch (err) {
        console.warn('XP sync failed for pomodoro session:', err.message);
    }

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

const callGeminiWithRetry = async (model, prompt, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result;
        } catch (error) {
            const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded');
            if (isRateLimit && i < retries - 1) {
                const delay = Math.pow(2, i) * 2000 + Math.random() * 1000; // Aggressive backoff for free tier
                console.log(`⚠️ Gemini Rate Limit. Retrying in ${Math.round(delay)}ms...`);
                await new Promise(res => setTimeout(res, delay));
                continue;
            }
            throw error;
        }
    }
};

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
        // Default to flash model for speed/cost, fallback logic handled by retry if needed (though quota is usually project-wide)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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

            case 'chat':
                const localResponse = getLocalChatBoatResponse(payload.message, payload.context);
                return res.json({ text: localResponse });

            default:
                return res.status(400).json({ error: 'Invalid AI action' });
        }

        console.log(`🤖 AI Action: ${action} - Generating content...`);

        // Use retry wrapper to handle rate limits
        const result = await callGeminiWithRetry(model, prompt);
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
        // Extract more detailed error info if available
        const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown AI error';

        res.status(500).json({
            error: 'AI processing failed on the server',
            message: errorMessage,
            action: action
        });
    }
});

// --- LOCAL AI BRAIN (ChatBoat) ---
const getLocalChatBoatResponse = (message, context = {}) => {
    const msg = message.toLowerCase();

    // Feature explanations
    if (msg.includes('module') || msg.includes('subject')) {
        return "Modules help you organize your subjects! You can track your target study hours and see your progress for each topic. Try creating a new module to get started.";
    }
    if (msg.includes('kanban') || msg.includes('task') || msg.includes('board')) {
        return "The Kanban board is your mission control for tasks! Drag and drop tasks between 'To Do', 'In Progress', and 'Completed' to stay organized.";
    }
    if (msg.includes('note') || msg.includes('pdf')) {
        return "Notes let you upload PDFs and write rich-text summaries. Our AI can even help you generate quizzes and flashcards from your notes!";
    }
    if (msg.includes('flashcard') || msg.includes('recall')) {
        return "Flashcards use spaced repetition to help you memorize critical info. Go to many of your modules and click 'Flashcards' to start practicing.";
    }
    if (msg.includes('chat') || msg.includes('group') || msg.includes('community')) {
        return "Chat and Study Groups allow you to collaborate with others! You can join groups, start direct chats, and share your notes or flashcards with friends.";
    }
    if (msg.includes('xp') || msg.includes('level') || msg.includes('gamify')) {
        return "You earn XP for studying and completing tasks! Level up to show off your progress on the leaderboard.";
    }

    // Motivational & Generic
    const responses = [
        "That's a great question! Keep pushing forward with your studies. Consistency is key!",
        "I'm here to help you ace your exams. What else would you like to know about StudySync?",
        "Remember to take breaks using the Pomodoro timer. A rested mind learns faster!",
        "StudySync is designed to make your learning journey smoother. Is there a specific feature I can explain?",
        "Focused study sessions today will lead to success tomorrow. You've got this!",
        "Hello! I'm ChatBoat, your StudySync assistant. I can help you navigate the platform and stay motivated."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
};

// SPA Catch-all (Ignore assets and API)
app.get(/.*/, (req, res, next) => {
    // If request is for an asset or API, skip to 404
    if (req.url.startsWith('/api/') || req.url.includes('.') || req.url.startsWith('/assets/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- BACKGROUND SYNC (Local to Cloud) ---
const syncLocalDataToCloud = async () => {
    if (!supabasePersistence.initSupabase()) return;

    console.log('🔄 Starting background synchronization to Supabase...');

    try {
        // 0. Sync Users
        const users = db.get('users') || [];
        for (const localUser of users) {
            if (!localUser.supabaseId) {
                console.log(`📡 Syncing user: ${localUser.email}`);
                // Use upsert to handle existing emails or new mappings
                const cloudUser = await supabasePersistence.upsertToCollection('users', localUser);
                if (cloudUser) {
                    db.update('users', localUser.id, { supabaseId: cloudUser.id });
                }
            }
        }

        // 1. Sync Groups
        const groups = db.get('groups') || [];
        for (const localGroup of groups) {
            if (!localGroup.supabaseId) {
                console.log(`📡 Syncing group: ${localGroup.name}`);
                const cloudGroup = await supabasePersistence.createGroup(localGroup);
                if (cloudGroup) {
                    db.update('groups', localGroup.id, { supabaseId: cloudGroup.id });
                    // Update any local conversations that reference this group
                    const convs = db.get('conversations') || [];
                    convs.forEach(c => {
                        if (c.groupId === localGroup.id) {
                            db.update('conversations', c.id, { groupId: cloudGroup.id });
                        }
                    });
                }
            }
        }

        // 2. Sync Conversations
        const conversations = db.get('conversations') || [];
        for (const localConv of conversations) {
            if (!localConv.supabaseId) {
                console.log(`📡 Syncing conversation: ${localConv.id}`);
                const cloudConv = await supabasePersistence.createConversation(localConv);
                if (cloudConv) {
                    db.update('conversations', localConv.id, { supabaseId: cloudConv.id });
                    // Update any local messages that reference this conversation
                    const messages = db.get('messages') || [];
                    messages.forEach(m => {
                        if (m.conversationId === localConv.id) {
                            db.update('messages', m.id, { conversationId: cloudConv.id });
                        }
                    });
                }
            }
        }

        // 3. Sync Messages
        const messages = db.get('messages') || [];
        for (const localMsg of messages) {
            if (!localMsg.supabaseId) {
                const messageData = {
                    conversationId: localMsg.conversationId,
                    senderId: localMsg.senderId,
                    senderEmail: localMsg.senderEmail,
                    content: localMsg.content,
                    type: localMsg.type,
                    sharedResource: localMsg.sharedResource
                };
                const cloudMsg = await supabasePersistence.insertMessage(messageData);
                if (cloudMsg) {
                    db.update('messages', localMsg.id, { supabaseId: cloudMsg.id });
                }
            }
        }

        // 4. Sync Generic Collections (Notes, Tasks, etc.)
        for (const [localCol, remoteTable] of Object.entries(tableMap)) {
            const items = db.get(localCol) || [];
            for (const localItem of items) {
                if (!localItem.supabaseId) {
                    console.log(`📡 Syncing ${localCol} item: ${localItem.id}`);
                    const cloudItem = await supabasePersistence.upsertToCollection(remoteTable, localItem);
                    if (cloudItem) {
                        db.update(localCol, localItem.id, { supabaseId: cloudItem.id });
                    }
                }
            }
        }

        console.log('✅ Background synchronization completed');
    } catch (error) {
        console.error('❌ Background sync error:', error);
    }
};

// Final 404 handler
app.use((req, res) => {
    res.status(404).send('Not Found');
});


// START SERVER
const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    // Run background sync immediately
    await syncLocalDataToCloud();
    // Then every 5 minutes
    setInterval(syncLocalDataToCloud, 5 * 60 * 1000);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Create final backup and sync
    console.log('📦 Creating final backup and syncing...');
    const backupPath = db.createBackup();
    if (backupPath) {
        console.log('✅ Final backup created successfully');
    }

    syncLocalDataToCloud().then(() => {
        console.log('☁️ Final sync completed');
        // Close server
        server.close(() => {
            console.log('👋 Server closed. All data saved.');
            process.exit(0);
        });
    }).catch(err => {
        console.error('❌ Final sync failed:', err);
        server.close(() => process.exit(1));
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
