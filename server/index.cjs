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
const cookieParser = require('cookie-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { initScheduler } = require('./scheduler_utf8.cjs');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is not set in environment variables.');
}
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const app = express();
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json());

// Initialize Supabase Client for direct usage in routes
const supabase = supabasePersistence.initSupabase();

// --- VERSIONING (For Auto-Push Updates) ---
const SYSTEM_VERSION = "1.3.1";
app.get('/api/version', (req, res) => res.json({ version: SYSTEM_VERSION }));

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'study-secret-key';
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://www.joshwebs.co.zw', 'https://joshwebs.co.zw'], // Restrict origins for cookie security
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// --- MIDDLEWARE ---
function authenticateToken(req, res, next) {
    // Check cookies first, then header fallback
    const token = req.cookies.auth_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.user = decoded;

        // Asynchronously update last_seen_at in Supabase (throttled)
        // We don't await this to keep the request fast
        if (req.user && req.user.id) {
            try {
                const now = Date.now();
                // Simple in-memory throttle per process
                if (!app.lastSeenUpdates) app.lastSeenUpdates = {};
                const lastUpdate = app.lastSeenUpdates[req.user.id] || 0;

                if (now - lastUpdate > 1000 * 60 * 5) { // 5 minutes
                    app.lastSeenUpdates[req.user.id] = now;
                    const timestamp = new Date().toISOString();

                    // Update legacy users table
                    db.update('users', req.user.id, { last_seen_at: timestamp });

                    // Update Supabase profiles
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.user.id);
                    if (supabase && isUUID) {
                        supabase.from('profiles')
                            .update({ last_seen_at: timestamp })
                            .eq('id', req.user.id)
                            .then(({ error }) => {
                                if (error) console.warn('presence update error:', error.message);
                            });
                    }
                }
            } catch (e) {
                // Ignore presence update errors to prevent request failure
            }
        }
        next();
    });
}

const jsonUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || path.extname(file.originalname).toLowerCase() === '.json') {
            cb(null, true);
        } else {
            cb(new Error('Only JSON files are allowed'), false);
        }
    }
});

// Configure Multer for In-Memory uploads (sending directly to Supabase)
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/webm',
            'audio/mp3',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDFs, Audio files, and Images are allowed'), false);
        }
    }
});

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        version: SYSTEM_VERSION,
        ai_configured: !!genAI,
        timestamp: new Date().toISOString()
    });
});

// --- PRESENCE HEARTBEAT ---
app.post('/api/presence/heartbeat', authenticateToken, async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
        db.update('users', req.user.id, { last_seen_at: timestamp });
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.user.id);
        if (supabase && isUUID) {
            await supabase.from('profiles')
                .update({ last_seen_at: timestamp })
                .eq('id', req.user.id);
        }
        res.json({ success: true, lastSeen: timestamp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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

// --- UPLOAD ROUTE (Cloud-Powered) ---
app.post('/api/upload', authenticateToken, (req, res) => {
    memoryUpload.single('file')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            const file = req.file;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `${uniqueSuffix}${path.extname(file.originalname)}`;

            console.log(`📤 Uploading file: ${file.originalname} as ${fileName} (${file.mimetype})`);

            // Upload to Supabase 'study-materials' bucket
            const publicUrl = await supabasePersistence.uploadFile(
                'study-materials',
                fileName,
                file.buffer,
                file.mimetype
            );

            if (!publicUrl) {
                console.error(`❌ Cloud upload failed for: ${file.originalname}`, {
                    bucket: 'study-materials',
                    fileName,
                    size: file.size,
                    mimeType: file.mimetype
                });
                return res.status(500).json({ error: 'Failed to upload to cloud storage. Check server logs for details.' });
            }

            res.json({
                filePath: publicUrl,
                fileName: file.originalname
            });
        } catch (uploadErr) {
            console.error('Upload error:', uploadErr);
            res.status(500).json({
                error: 'Internal server error during upload',
                details: uploadErr.message
            });
        }
    });
});


// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists locally
    const existingUser = db.find('users', u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
    }

    let userId = null;
    let authUser = null;

    // Try to register with Supabase Auth first
    try {
        authUser = await supabasePersistence.signUpUser(email, password);

        if (authUser && authUser.error) {
            // Supabase Auth error (e.g., user already exists)
            console.log('⚠️ Supabase Auth registration failed:', authUser.error);
            // Fall through to local registration
        } else if (authUser && authUser.id) {
            userId = authUser.id;
            console.log(`✅ User registered in Supabase Auth: ${email}`);

            // Create profile in profiles table
            await supabasePersistence.upsertProfile({
                id: userId,
                email,
                name: name || email.split('@')[0],
                xp: 0,
                level: 1,
                badges: [],
                newly_registered: true,
                tutorial_completed: false
            });
            console.log(`✅ Profile created for user: ${email}`);
        }
    } catch (authErr) {
        console.error('❌ Supabase Auth registration error:', authErr.message);
        // Continue with local registration as fallback
    }

    // Create local user (acts as cache and fallback)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.insert('users', {
        id: userId, // Use Supabase Auth ID if available
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        xp: 0,
        level: 1,
        badges: [],
        newly_registered: true,
        supabaseAuthId: userId // Track Supabase Auth ID
    });

    // Mirror to Supabase 'users' table for backward compatibility and visibility
    try {
        const cloudUser = await supabasePersistence.upsertToCollection('users', user);
        if (cloudUser && !user.supabaseId) {
            db.update('users', user.id, { supabaseId: cloudUser.id });
        }
    } catch (syncErr) {
        console.error('❌ Failed to sync user to Supabase users table:', syncErr.message);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    // Set Secure HttpOnly Cookie
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

// Get all users for chat selector
app.get('/api/users/all', authenticateToken, async (req, res) => {
    try {
        // Try to fetch from Supabase first (includes profiles and legacy users)
        let allUsers = null;
        try {
            allUsers = await supabasePersistence.getAllProfiles();
        } catch (err) {
            console.warn('Failed to fetch from Supabase, falling back to local:', err.message);
        }

        // Fallback to local DB if Supabase fails or returns nothing
        if (!allUsers || allUsers.length === 0) {
            allUsers = db.get('users') || [];
        }

        const safeUsers = allUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar
        }));
        res.json(safeUsers);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    let user = null;
    let authMethod = 'local';

    // Try Supabase Auth sign-in first
    try {
        const authResult = await supabasePersistence.signInUser(email, password);

        if (authResult && !authResult.error && authResult.id) {
            console.log(`✅ User authenticated via Supabase Auth: ${email}`);
            authMethod = 'supabase';

            // Check local cache first
            user = db.find('users', u => u.email === email);

            if (!user) {
                console.log(`User ${email} not found locally, fetching from Supabase...`);
                // Try fetching profile or user data from Supabase
                const [cloudProfile, cloudUser] = await Promise.all([
                    supabasePersistence.getById('profiles', authResult.id),
                    supabasePersistence.getItemByField('users', 'email', email)
                ]);

                const existingData = cloudProfile || cloudUser;

                // Create local cache entry from Supabase data
                user = db.insert('users', {
                    id: authResult.id,
                    email: authResult.email,
                    supabaseAuthId: authResult.id,
                    name: existingData?.name || email.split('@')[0],
                    xp: existingData?.xp || 0,
                    level: existingData?.level || 1,
                    badges: existingData?.badges || []
                });
                console.log(`✅ Local user cache created from Supabase data for: ${email}`);
            }
        } else {
            // Silently fall back to local if not found in Supabase Auth
        }
    } catch (authErr) {
        console.log(`⚠️ Supabase Auth unavailable, falling back to local: ${authErr.message}`);
    }

    // Fallback: Local authentication
    if (!user || authMethod === 'local') {
        user = db.find('users', u => u.email === email);

        // If not found locally, try finding in Supabase users table (Cloud Fallback)
        if (!user) {
            console.log(`User ${email} not found locally, checking Supabase...`);
            const cloudUser = await supabasePersistence.getItemByField('users', 'email', email);

            if (cloudUser) {
                console.log(`User ${email} found in Supabase. Syncing to local DB.`);
                user = db.insert('users', {
                    ...cloudUser,
                    supabaseId: cloudUser.id
                });
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password locally (only if not already authenticated via Supabase Auth)
        if (authMethod === 'local') {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    // Set Secure HttpOnly Cookie
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Sync profile data on successful login
    if (authMethod === 'supabase') {
        try {
            await supabasePersistence.upsertProfile({
                id: user.id,
                email: user.email,
                xp: user.xp || 0,
                level: user.level || 1,
                badges: user.badges || []
            });
        } catch (syncErr) {
            console.error('❌ Failed to sync profile on login:', syncErr.message);
        }
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = db.find('users', u => u.id === req.user.id);
    if (!user) return res.sendStatus(404);

    const isAuthorized = true;

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, authorized: isAuthorized });
});

app.get('/api/users/all', authenticateToken, async (req, res) => {
    try {
        // Fetch from both sources to ensure full visibility
        const [profileUsers, legacyUsers] = await Promise.all([
            supabasePersistence.getAllProfiles() || [],
            supabasePersistence.fetchAll('users') || []
        ]);

        // Merge and deduplicate by email
        const userMap = new Map();

        // Process legacy users first
        (legacyUsers || []).forEach(u => {
            if (u.email) userMap.set(u.email.toLowerCase(), { ...u, source: 'legacy' });
        });

        // Process profiles (new users/Auth users) - these take precedence for metadata
        (profileUsers || []).forEach(p => {
            if (p.email) {
                const existing = userMap.get(p.email.toLowerCase());
                userMap.set(p.email.toLowerCase(), {
                    ...(existing || {}),
                    ...p,
                    // Ensure last_seen_at is preserved from whichever source has it
                    last_seen_at: p.last_seen_at || existing?.last_seen_at,
                    source: 'profile'
                });
            }
        });

        let users = Array.from(userMap.values());

        // Final fallback to local if still empty
        if (users.length === 0) {
            users = db.get('users') || [];
        }

        const testPatterns = ['test', 'example.com', 'agent'];

        const safeUsers = users
            .filter(u => {
                const email = u.email?.toLowerCase() || '';
                return !testPatterns.some(pattern => email.includes(pattern));
            })
            .map(u => {
                const { password, ...safe } = u;
                return safe;
            });

        res.json(safeUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Cloud Settings Routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        let profile = await supabasePersistence.getById('users', userId);

        if (!profile) {
            profile = db.getById('users', userId);
        }

        if (profile) {
            const { password, ...safe } = profile;
            res.json(safe);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.post('/api/user/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body; // { theme, dark_mode, timer_state }

        // Update local DB
        db.update('users', userId, updates);

        // Update Supabase
        await supabasePersistence.upsertToCollection('users', { id: userId, ...updates });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// --- MESSAGES FETCH ROUTE ---
app.get('/api/messages/:conversationId', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        let messages = null;

        // 1. Try Supabase first
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId);
        if (isUUID) {
            try {
                messages = await supabasePersistence.getMessages(conversationId);
            } catch (supaErr) {
                console.warn('⚠️ Supabase getMessages failed, checking local:', supaErr.message);
            }
        }

        // 2. Fallback to local
        if (!messages) {
            const localMessages = db.get('messages') || [];
            messages = localMessages
                .filter(m => m.conversationId === conversationId)
                .sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
        }

        res.json(messages || []);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.json([]);
    }
});

// --- GROUP ROUTES ---
app.get('/api/groups', authenticateToken, async (req, res) => {
    try {
        let groups = null;

        // 1. Try Supabase
        try {
            groups = await supabasePersistence.getGroups();
        } catch (supaErr) {
            console.warn('⚠️ Supabase getGroups failed, checking local:', supaErr.message);
        }

        // 2. Fallback to local
        if (!groups) {
            groups = db.get('groups') || [];
        }

        res.json(groups || []);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.json([]);
    }
});

app.post('/api/groups/create', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // Generate a unique invite code
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const groupData = {
            name: name.trim(),
            description: description || '',
            creatorId: req.user.id,
            createdBy: req.user.id, // Explicitly add for created_by mapping
            members: [req.user.id],
            inviteCode,
            createdAt: new Date().toISOString()
        };

        // 1. Save group to Supabase
        let group = null;
        try {
            group = await supabasePersistence.createGroup(groupData);
        } catch (supaErr) {
            console.error('❌ Supabase createGroup failed:', supaErr.message);
        }

        // 2. Always save locally
        const localGroup = db.insert('groups', {
            ...groupData,
            supabaseId: group?.id
        });

        const finalGroup = group || localGroup;

        // 3. Create associated group conversation
        const convData = {
            type: 'group',
            participants: [req.user.id],
            groupId: finalGroup.id,
            groupName: name.trim(),
            inviteCode,
            lastMessage: '',
            lastMessageTime: new Date().toISOString(),
            status: 'active',
            initiatorId: req.user.id
        };

        let conversation = null;
        try {
            conversation = await supabasePersistence.createConversation(convData);
        } catch (supaErr) {
            console.error('❌ Supabase createConversation for group failed:', supaErr.message);
        }

        const localConv = db.insert('conversations', {
            ...convData,
            supabaseId: conversation?.id
        });

        res.json({
            group: finalGroup,
            conversation: conversation || localConv
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

app.post('/api/groups/join/:code', authenticateToken, async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.id;

        // 1. Find the group by invite code
        let group = null;

        // Check Supabase
        try {
            const allGroups = await supabasePersistence.getGroups();
            if (allGroups) {
                group = allGroups.find(g => g.inviteCode === code);
            }
        } catch (supaErr) {
            console.warn('⚠️ Supabase getGroups failed for join:', supaErr.message);
        }

        // Fallback to local
        if (!group) {
            const localGroups = db.get('groups') || [];
            group = localGroups.find(g => g.inviteCode === code);
        }

        if (!group) {
            return res.status(404).json({ error: 'Group not found. Check the invite code and try again.' });
        }

        // 2. Check if user is already a member
        if (group.members && group.members.includes(userId)) {
            // Already a member, just find the conversation
            const conversations = db.get('conversations') || [];
            const existingConv = conversations.find(c => c.groupId === group.id || c.inviteCode === code);
            return res.json({
                message: 'Already a member',
                alreadyMember: true,
                group,
                conversationId: existingConv?.id
            });
        }

        // 3. Add user to group members
        const updatedMembers = [...(group.members || []), userId];

        try {
            await supabasePersistence.upsertToCollection('groups', { ...group, members: updatedMembers });
        } catch (supaErr) {
            console.warn('⚠️ Supabase group update failed:', supaErr.message);
        }
        db.update('groups', group.id, { members: updatedMembers });

        // 4. Add user to the group conversation participants
        let conversation = null;

        // 4a. Try Supabase first (critical for cross-user group joins)
        try {
            const allConvs = await supabasePersistence.fetchAll('conversations');
            if (allConvs) {
                conversation = allConvs.find(c =>
                    c.groupId === group.id || c.inviteCode === code
                );
            }
        } catch (supaErr) {
            console.warn('⚠️ Supabase conversation lookup failed:', supaErr.message);
        }

        // 4b. Fallback to local
        if (!conversation) {
            const localConversations = db.get('conversations') || [];
            conversation = localConversations.find(c =>
                c.groupId === group.id || c.inviteCode === code
            );
        }

        // 4c. Cache conversation locally if fetched from Supabase but missing locally
        if (conversation && !db.getById('conversations', conversation.id)) {
            db.insert('conversations', conversation);
        }

        if (conversation) {
            const updatedParticipants = [...new Set([...(conversation.participants || []), userId])];
            const now = new Date().toISOString();
            const systemMessageContent = `${req.user.name || req.user.email} joined the group`;

            // 4a. Create System Message
            const messageData = {
                conversationId: conversation.id,
                senderId: 'system',
                senderEmail: 'system@studysync.app',
                senderName: 'System',
                content: systemMessageContent,
                type: 'system',
                timestamp: now,
                createdAt: now,
                read: true,
                status: 'sent'
            };

            // Insert Message (Supabase + Local)
            let sysMsg = null;
            try {
                if (conversation.id && conversation.id.length > 20) {
                    sysMsg = await supabasePersistence.insertMessage(messageData);
                }
            } catch (e) {
                console.error('Failed to send system join message to Supabase:', e);
            }
            db.insert('messages', { ...messageData, supabaseId: sysMsg?.id });

            // 4b. Update Conversation Participants and Timestamp
            const updates = {
                participants: updatedParticipants,
                lastMessage: systemMessageContent,
                lastMessageTime: now
            };

            try {
                await supabasePersistence.updateConversation(conversation.id, updates);
            } catch (supaErr) {
                console.warn('⚠️ Supabase conversation update failed:', supaErr.message);
            }
            db.update('conversations', conversation.id, updates);
        }

        res.json({
            message: 'Successfully joined group',
            group: { ...group, members: updatedMembers },
            conversationId: conversation?.id
        });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ error: 'Failed to join group' });
    }
});


// --- TUTORIALS ---
// Redundant GET /api/tutorials removed. Handled by generic genericCollections route.

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

    // Sync to Supabase immediately using upsertProfile for consistency
    try {
        await supabasePersistence.upsertProfile({
            id: req.user.id,
            email: req.user.email,
            xp: result.user.xp,
            level: result.user.level
        });
    } catch (syncErr) {
        console.warn('Could not sync XP to Supabase:', syncErr.message);
    }

    res.json(result);
});

// --- BADGES ENDPOINT ---
app.post('/api/user/badges', authenticateToken, async (req, res) => {
    const { badge } = req.body;
    if (!badge || !badge.name) {
        return res.status(400).json({ error: 'Invalid badge data' });
    }

    const user = db.find('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Check if badge already exists
    const currentBadges = user.badges || [];
    const alreadyHas = currentBadges.some(b => b.name === badge.name);

    if (alreadyHas) {
        return res.json({ success: true, message: 'Badge already earned', badges: currentBadges });
    }

    // 2. Add new badge
    const newBadge = { ...badge, earnedAt: new Date().toISOString() };
    const updatedBadges = [...currentBadges, newBadge];

    // 3. Update local DB
    const updatedUser = db.update('users', user.id, { badges: updatedBadges });

    // 4. Update Supabase
    try {
        await supabasePersistence.upsertToCollection('users', {
            id: user.id,
            badges: updatedBadges
        });

        // Also update profile if it exists
        await supabasePersistence.upsertProfile({
            id: user.id,
            email: user.email,
            badges: updatedBadges,
            // Preserve other fields if possible, or upsert will handle basic
        });
    } catch (syncErr) {
        console.warn('Could not sync badges to Supabase:', syncErr.message);
    }

    res.json({ success: true, badge: newBadge, badges: updatedBadges });
});

// --- CHAT ENDPOINTS ---
// ... (Chat endpoints follow)

// --- REST OF ROUTES ---

// Flashcard Decks/Notes GET routes removed. Handled by generic genericCollections route.


// Shared flashcard deck fetch (Read-only access to any deck by ID)
app.get('/api/flashcardDecks/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let deck = await supabasePersistence.getById('flashcard_decks', id);
        if (!deck) deck = db.find('flashcardDecks', d => d.id === id);
        if (!deck) return res.status(404).json({ error: 'Flashcard deck not found.' });
        res.json(deck);
    } catch (error) {
        console.error('Error fetching shared flashcard deck:', error);
        res.status(500).json({ error: 'System error.' });
    }
});

// Shared note fetch
app.get('/api/notes/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let note = await supabasePersistence.getById('notes', id);
        if (!note) note = db.find('notes', n => n.id === id);
        if (!note) return res.status(404).json({ error: 'Note not found.' });
        res.json(note);
    } catch (error) {
        console.error('Error fetching shared note:', error);
        res.status(500).json({ error: 'System error.' });
    }
});

// Shared tutorial fetch
app.get('/api/tutorials/shared/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        let tutorial = await supabasePersistence.getById('tutorials', id);
        if (!tutorial) tutorial = db.find('tutorials', t => t.id === id);
        if (!tutorial) return res.status(404).json({ error: 'Tutorial not found.' });
        res.json(tutorial);
    } catch (error) {
        console.error('Error fetching shared tutorial:', error);
        res.status(500).json({ error: 'System error.' });
    }
});

// --- CONVERSATION ROUTES ---

app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
        let conversations = null;

        // 1. Fetch from Supabase (with error handling)
        try {
            conversations = await supabasePersistence.getConversations(req.user.id);
        } catch (supaErr) {
            console.warn('⚠️ Supabase getConversations failed, checking local:', supaErr.message);
        }

        // 2. Fallback to local if Supabase returns null or failed
        if (!conversations) {
            const localConvs = db.get('conversations') || [];
            conversations = localConvs.filter(c =>
                c.participants && c.participants.includes(req.user.id)
            ).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
        }

        res.json(conversations || []);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        // Fallback to empty array instead of 500 if everything fails, to keep UI alive
        res.json([]);
    }
});

// Direct message creation logic starts below
app.post('/api/conversations/direct', authenticateToken, async (req, res) => {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'Other user ID required' });

    try {
        let existing = null;

        // 1. Try finding in Supabase first
        try {
            existing = await supabasePersistence.findDirectConversation(req.user.id, otherUserId);
        } catch (supaErr) {
            console.warn('⚠️ Supabase findDirectConversation failed, checking local:', supaErr.message);
        }

        // 2. Fallback to local check
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

        // 3. Create new conversation
        const convData = {
            type: 'direct',
            participants: [req.user.id, otherUserId],
            lastMessage: '',
            lastMessageTime: new Date().toISOString(),
            status: 'pending',
            initiatorId: req.user.id,
            initiator_id: req.user.id // Extra safety for mapping
        };

        let conversation = null;

        // Try creating in Supabase
        try {
            conversation = await supabasePersistence.createConversation(convData);
        } catch (createErr) {
            console.error('❌ Supabase createConversation failed, falling back to local:', createErr.message);
        }

        // 4. Always ensure local persistence
        const localConv = db.insert('conversations', {
            ...convData,
            supabaseId: conversation?.id // Link if Supabase worked
        });

        // Use Supabase version if available, otherwise local
        res.json(conversation || localConv);

    } catch (error) {
        console.error('Error in /api/conversations/direct:', error);
        // Even if everything explodes, try to return something useful or a specific error
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Explicit Message Sending Override (to use Supabase)
app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { conversationId, content, type, sharedResource, replyTo, metadata } = req.body;

        if (!conversationId || !content) {
            return res.status(400).json({ error: 'Conversation ID and content required' });
        }

        const now = new Date().toISOString();
        const messageData = {
            conversationId,
            senderId: req.user.id,
            senderEmail: req.user.email,
            senderName: req.user.name || req.user.email?.split('@')[0],
            content,
            type: type || 'text',
            sharedResource: sharedResource || null,
            replyTo: replyTo || null,
            metadata: metadata || null,
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
        res.status(500).json({
            error: 'Failed to send message',
            details: error.message,
            stack: IS_PROD ? undefined : error.stack
        });
    }
});

app.post('/api/messages/:id/react', authenticateToken, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database service unavailable' });
        }
        const messageId = req.params.id;
        const { emoji } = req.body;
        const userId = req.user.id;

        // Get current message to update reactions
        const { data: message, error: fetchError } = await supabase
            .from('messages')
            .select('reactions')
            .eq('id', messageId)
            .single();

        if (fetchError || !message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const reactions = message.reactions || {};
        const users = reactions[emoji] || [];

        if (users.includes(userId)) {
            // Remove reaction
            reactions[emoji] = users.filter(id => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            // Add reaction
            reactions[emoji] = [...users, userId];
        }

        // Update database
        const { error: updateError } = await supabase
            .from('messages')
            .update({ reactions })
            .eq('id', messageId);

        if (updateError) throw updateError;

        res.json({ success: true, reactions });
    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({ error: 'Failed to update reaction' });
    }
});

app.post('/api/groups/:id/leave', authenticateToken, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database service unavailable' });
        }
        const conversationId = req.params.id;
        const userId = req.user.id;

        // Fetch conversation
        const { data: conversation, error: fetchError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (fetchError || !conversation) {
            return res.status(404).json({ error: 'Group not found' });
        }

        if (conversation.type !== 'group') {
            return res.status(400).json({ error: 'Cannot leave a direct message' });
        }

        // Update participants
        const participants = (conversation.participants || []).filter(id => id !== userId);

        const { error: updateError } = await supabase
            .from('conversations')
            .update({ participants })
            .eq('id', conversationId);

        if (updateError) throw updateError;

        res.json({ success: true });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ error: 'Failed to leave group' });
    }
});

// Respond to conversation request
app.post('/api/conversations/:id/respond', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body; // 'active' or 'rejected'
        const conversationId = req.params.id;

        // Smart ID Resolution
        let supabaseId = conversationId;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId);
        if (!isUUID) {
            const local = db.getById('conversations', conversationId);
            if (local?.supabaseId) supabaseId = local.supabaseId;
        }

        // 1. Update in Supabase
        if (supabaseId && supabaseId.length > 20) { // Simple UUID check
            await supabasePersistence.updateConversation(supabaseId, { status });
        }

        // 2. Update locally (Smart update handles both UUID and local ID)
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

        // Smart ID Resolution
        let supabaseId = conversationId;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId);

        if (!isUUID) {
            const local = db.getById('conversations', conversationId);
            if (local?.supabaseId) supabaseId = local.supabaseId;
        }

        if (supabaseId && supabaseId.length > 20) {
            await supabasePersistence.markMessagesAsRead(supabaseId, req.user.id);
        }

        // Update locally 
        const messages = db.get('messages') || [];
        messages.forEach(m => {
            // Check against both local ID and supabaseId
            if ((m.conversationId === conversationId || m.conversationId === supabaseId) && m.senderId !== req.user.id) {
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

const genericCollections = ['modules', 'studyLogs', 'tasks', 'notes', 'grades', 'flashcardDecks', 'flashcards', 'calendarEvents', 'pomodoroSessions', 'tutorials', 'conversations', 'messages', 'groups'];

// Redundant specific tutorial routes removed to use consolidated generic routes


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
    'tutorials': 'tutorials',
    'groups': 'groups', // Groups MUST sync before conversations
    'conversations': 'conversations',
    'messages': 'messages'
};

const { runDailyReports } = require('./scheduler_utf8.cjs');

app.post('/api/admin/trigger-daily-reports', authenticateToken, async (req, res) => {
    // Basic safety check
    if (req.user.email !== 'joshua@joshwebs.co.zw' && !req.user.email?.includes('admin')) {
        return res.status(403).json({ error: 'Permission denied' });
    }

    try {
        console.log('Manual trigger: Running daily reports...');
        await runDailyReports();
        res.json({ success: true, message: 'Daily reports triggered successfully' });
    } catch (error) {
        console.error('Manual trigger failed:', error);
        res.status(500).json({ error: 'Manual trigger failed', details: error.message });
    }
});

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
        if (!cloudItems) return res.json(localItems);

        const cloudIds = new Set(cloudItems.map(i => i.id));
        const localOnly = localItems.filter(i => !cloudIds.has(i.supabaseId) && !cloudIds.has(i.id));
        res.json([...cloudItems, ...localOnly]);
    });

    app.get(`/api/${collection}/:id`, authenticateToken, async (req, res) => {
        const item = db.getById(collection, req.params.id);
        if (!item) return res.sendStatus(404);
        if (item.userId === req.user.id) return res.json(item);

        // Access check for shared resources
        const messages = db.get('messages') || [];
        const isShared = messages.some(m =>
            m.sharedResource && String(m.sharedResource.id) === String(item.id)
        );
        if (isShared) return res.json(item);
        res.status(403).json({ error: 'Access denied' });
    });

    app.post(`/api/${collection}`, authenticateToken, async (req, res) => {
        const now = new Date().toISOString();
        const rawItem = { ...req.body, userId: req.user.id, createdAt: now, updatedAt: now };

        // 1. Always save locally first (Reliability)
        let item = db.insert(collection, rawItem);
        let syncStatus = 'local-only';

        // Smarter XP Logic
        let xpGained = 0;
        if (collection === 'studyLogs') {
            xpGained = Math.round(parseFloat(req.body.hours || 0) * 100) || 50;
        } else if (collection === 'tasks' && item.status === 'Completed') {
            xpGained = 30;
        } else if (collection === 'pomodoroSessions') {
            xpGained = 40;
        }

        if (xpGained > 0) {
            const xpResult = db.addXP(req.user.id, xpGained);
            try {
                // Fetch full user to get latest XP/Level
                const updatedUser = db.getById('users', req.user.id);
                if (updatedUser) {
                    await supabasePersistence.upsertProfile({
                        id: req.user.id,
                        email: req.user.email,
                        xp: updatedUser.xp,
                        level: updatedUser.level,
                        updated_at: now
                    });
                }
            } catch (e) {
                console.warn('Could not sync XP from collection gain:', e.message);
            }
        }

        // 2. Try to sync to Supabase (Background-ish)
        const supabaseTable = tableMap[collection];
        if (supabaseTable) {
            try {
                const cloudItem = await supabasePersistence.upsertToCollection(supabaseTable, item);
                if (cloudItem) {
                    // Update local item with Supabase ID link
                    item = db.update(collection, item.id, { supabaseId: cloudItem.id });
                    syncStatus = 'synced';
                }
            } catch (err) {
                console.error(`❌ Sync failed for ${collection} (saved locally):`, err.message);
                syncStatus = 'failed';
                // Do NOT return error to client, local save is sufficient for now
            }
        }

        // Always return success if local save worked
        res.status(201).json({ item, syncStatus });
    });

    app.put(`/api/${collection}/:id`, authenticateToken, async (req, res) => {
        const updates = { ...req.body, updatedAt: new Date().toISOString() };

        // Get existing item to check previous state (e.g. for XP)
        const existingItem = db.getById(collection, req.params.id);

        let item = db.update(collection, req.params.id, updates);
        let syncStatus = 'local-only';

        // XP Logic for Updates (specifically Tasks)
        if (collection === 'tasks' && updates.status === 'Completed' && existingItem && existingItem.status !== 'Completed') {
            const xpGained = 30; // Same as creation reward
            const xpResult = db.addXP(req.user.id, xpGained);
            try {
                // Fetch full user to get latest XP/Level
                const updatedUser = db.getById('users', req.user.id);
                if (updatedUser) {
                    await supabasePersistence.upsertProfile({
                        id: req.user.id,
                        email: req.user.email,
                        xp: updatedUser.xp,
                        level: updatedUser.level,
                        updated_at: new Date().toISOString()
                    });
                }
            } catch (e) {
                console.warn('Could not sync XP from task completion:', e.message);
            }
        }

        const supabaseTable = tableMap[collection];
        if (supabaseTable) {
            try {
                if (!item) {
                    const cloudMatch = await supabasePersistence.getById(supabaseTable, req.params.id);
                    if (cloudMatch && (cloudMatch.userId === req.user.id || cloudMatch.user_id === req.user.id)) {
                        item = db.insert(collection, { ...cloudMatch, ...updates, id: req.params.id });
                    }
                }
                if (item) {
                    const cloudItem = await supabasePersistence.upsertToCollection(supabaseTable, item);
                    if (cloudItem) {
                        item = db.update(collection, item.id, { supabaseId: cloudItem.id });
                        syncStatus = 'synced';
                    }
                }
            } catch (err) {
                console.error(`❌ Sync failed for ${collection} update:`, err.message);
                syncStatus = 'failed';
            }
        }

        if (!item) return res.sendStatus(404);
        res.json({ item, syncStatus });
    });

    app.delete(`/api/${collection}/:id`, authenticateToken, async (req, res) => {
        const item = db.getById(collection, req.params.id);
        db.delete(collection, req.params.id);
        const supabaseTable = tableMap[collection];
        if (supabaseTable && item) {
            try { await supabasePersistence.deleteFromCollection(supabaseTable, (item.supabaseId || item.id)); } catch (e) { }
        }
        res.sendStatus(204);
    });
});


// --- PUBLIC SHARING ENDPOINTS ---
// These routes do NOT require authentication
const publicCollections = ['tutorials', 'flashcardDecks', 'notes'];

app.get('/api/public/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;

    if (!publicCollections.includes(collection)) {
        return res.status(400).json({ error: 'Collection not supported for public sharing' });
    }

    try {
        // 1. Try to find locally first (fastest)
        let item = db.getById(collection, id);

        // 2. If not found locally, try Supabase (for persistent links)
        if (!item) {
            const supabaseTable = tableMap[collection];
            if (supabaseTable) {
                item = await supabasePersistence.getById(supabaseTable, id);
            }
        }

        if (!item) {
            return res.status(404).json({ error: 'Shared content not found' });
        }

        // Return only safe fields
        const safeItem = {
            id: item.id,
            title: item.title || item.name,
            description: item.description,
            content: item.content, // For notes
            cards: item.cards, // For flashcards (we might need to fetch them separately)
            url: item.url, // For tutorials
            videoId: item.videoId,
            moduleId: item.moduleId,
            isPublic: item.isPublic || false
        };

        // If it's a flashcard deck, we MUST fetch the cards too
        if (collection === 'flashcardDecks') {
            const allCards = db.get('flashcards') || [];
            // Try to find local cards first
            let deckCards = allCards.filter(c => c.deckId === item.id);

            // If no local cards, try fetching from Supabase
            if (deckCards.length === 0) {
                const { data: cloudCards } = await supabasePersistence.client
                    .from('flashcards')
                    .select('*')
                    .eq('deck_id', item.id || item.supabaseId); // Handle both ID types

                if (cloudCards) {
                    deckCards = cloudCards.map(c => ({ ...c, deckId: c.deck_id }));
                }
            }
            safeItem.cards = deckCards;
        }

        res.json(safeItem);

    } catch (error) {
        console.error(`Error serving public content ${collection}/${id}:`, error);
        res.status(500).json({ error: 'Failed to load shared content' });
    }
});

app.post('/api/public/:collection/:id/toggle', authenticateToken, async (req, res) => {
    const { collection, id } = req.params;
    // simple endpoint to toggle public state
    const item = db.getById(collection, id);
    if (!item) return res.sendStatus(404);

    // specific logic to update isPublic
    const newState = !item.isPublic;
    db.update(collection, id, { isPublic: newState });

    // Sync to supabase
    const supabaseTable = tableMap[collection];
    if (supabaseTable) {
        try {
            await supabasePersistence.upsertToCollection(supabaseTable, { ...item, isPublic: newState });
        } catch (e) { console.warn('Supabase sync failed for public toggle', e); }
    }

    res.json({ success: true, isPublic: newState });
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
        const fileContent = req.file.buffer.toString('utf8');
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
        res.json({ success: true, message: 'Database restored successfully' });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to restore your data: ' + error.message });
    }
});

// Full Account Deletion
app.delete('/api/user/account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`🗑️ Deleting account for user: ${req.user.email} (${userId})`);

        // 1. Delete from Supabase (if configured)
        if (supabasePersistence.initSupabase()) {
            await supabasePersistence.deleteAllUserData(userId);
        }

        // 2. Delete from local database
        db.deleteUser(userId);

        res.clearCookie('auth_token');
        res.json({ success: true, message: 'Account and all associated data deleted successfully.' });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ error: 'Failed to delete account: ' + error.message });
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

// --- STARTUP DATA RESTORATION ---
const restoreCloudData = async () => {
    if (!supabasePersistence.initSupabase()) return;
    console.log('🔄 Starting full system sync from Supabase...');

    try {
        // 1. Restore Users
        const cloudUsers = await supabasePersistence.fetchAll('users') || [];
        const localUsers = db.get('users') || [];
        cloudUsers.forEach(u => {
            const local = localUsers.find(lu => lu.email === u.email || lu.id === u.id);
            if (local) {
                if (!local.supabaseId) db.update('users', local.id, { supabaseId: u.id });
            } else {
                db.insert('users', { ...u, supabaseId: u.id });
            }
        });

        // 2. Restore All Generic Collections in Parallel
        const genericToSync = Object.entries(tableMap).filter(([k]) => !['users', 'conversations', 'groups', 'messages'].includes(k));

        await Promise.all(genericToSync.map(async ([localCol, remoteTable]) => {
            const items = await supabasePersistence.fetchAll(remoteTable) || [];
            const localItems = db.get(localCol) || [];
            items.forEach(item => {
                const match = localItems.find(i => i.id === item.id || i.supabaseId === item.id);
                if (!match) db.insert(localCol, { ...item, supabaseId: item.id });
                else if (!match.supabaseId) db.update(localCol, match.id, { supabaseId: item.id });
            });
        }));

        // 3. Restore Chat Components
        const [groups, convs] = await Promise.all([
            supabasePersistence.fetchAll('groups'),
            supabasePersistence.fetchAll('conversations')
        ]);

        if (groups) {
            const localGroups = db.get('groups') || [];
            groups.forEach(g => {
                const match = localGroups.find(lg => lg.id === g.id || lg.supabaseId === g.id);
                if (!match) db.insert('groups', { ...g, supabaseId: g.id });
                else if (!match.supabaseId) db.update('groups', match.id, { supabaseId: g.id });
            });
        }

        if (convs) {
            const localConvs = db.get('conversations') || [];
            convs.forEach(c => {
                const match = localConvs.find(lc => lc.id === c.id || lc.supabaseId === c.id);
                if (!match) db.insert('conversations', { ...c, supabaseId: c.id });
                else if (!match.supabaseId) db.update('conversations', match.id, { supabaseId: c.id });
            });
        }

        console.log('✅ System sync from cloud complete');
    } catch (error) {
        console.error('❌ Sync failed:', error);
    }
};

// --- BACKGROUND SYNC (Local -> Cloud) ---
const syncLocalDataToCloud = async () => {
    require('dotenv').config({ override: true });
    if (!supabasePersistence.initSupabase()) return;

    console.log('🔄 Running background cloud sync...');
    try {
        // Sync items that only exist locally (missing supabaseId)
        for (const [localCol, remoteTable] of Object.entries(tableMap)) {
            const items = db.get(localCol) || [];
            for (const item of items) {
                if (!item.supabaseId) {
                    if (localCol === 'users' && !item.email) continue;

                    try {
                        // Smart Dependency Resolution
                        const syncItem = { ...item };
                        const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

                        // 1. Resolve moduleId -> Supabase UUID
                        if (syncItem.moduleId && !isUUID(syncItem.moduleId)) {
                            const mod = db.getById('modules', syncItem.moduleId);
                            if (mod?.supabaseId) {
                                syncItem.moduleId = mod.supabaseId;
                            } else {
                                // Orphan or placeholder (like "test-module") - nullify to prevent FK error
                                syncItem.moduleId = null;
                            }
                        }

                        // 2. Resolve deckId -> Supabase UUID
                        if (syncItem.deckId && !isUUID(syncItem.deckId)) {
                            const deck = db.getById('flashcardDecks', syncItem.deckId);
                            if (deck?.supabaseId) {
                                syncItem.deckId = deck.supabaseId;
                            } else {
                                syncItem.deckId = null;
                            }
                        }

                        // 3. Resolve conversationId -> Supabase UUID
                        if (syncItem.conversationId && !isUUID(syncItem.conversationId)) {
                            const conv = db.getById('conversations', syncItem.conversationId);
                            if (conv?.supabaseId) {
                                syncItem.conversationId = conv.supabaseId;
                            } else {
                                syncItem.conversationId = null;
                            }
                        }

                        // 4. Resolve groupId -> Supabase UUID
                        if (syncItem.groupId && !isUUID(syncItem.groupId)) {
                            const group = db.getById('groups', syncItem.groupId);
                            if (group?.supabaseId) {
                                syncItem.groupId = group.supabaseId;
                            } else {
                                syncItem.groupId = null;
                            }
                        }

                        // 5. Resolve creatorId -> Supabase UUID/TEXT
                        if (syncItem.creatorId) {
                            let creatorSupabaseId = null;
                            if (isUUID(syncItem.creatorId)) {
                                creatorSupabaseId = syncItem.creatorId;
                            } else {
                                const creator = db.getById('users', syncItem.creatorId);
                                creatorSupabaseId = creator?.supabaseId || null;
                            }

                            // Map to createdBy so toSnake makes it created_by
                            syncItem.createdBy = creatorSupabaseId || syncItem.creatorId;
                            // Also keep creator_id for backward compatibility if needed
                            syncItem.creatorId = creatorSupabaseId || syncItem.creatorId;
                        }

                        // 6. Resolve participants (Array of IDs)
                        if (syncItem.participants && Array.isArray(syncItem.participants)) {
                            syncItem.participants = syncItem.participants.map(pid => {
                                if (isUUID(pid)) return pid;
                                const u = db.getById('users', pid);
                                return u?.supabaseId || null;
                            }).filter(pid => pid !== null);
                        }

                        // Special mapping for Tutorials (youtubeUrl -> url & youtube_url)
                        if (localCol === 'tutorials' && syncItem.youtubeUrl) {
                            syncItem.url = syncItem.youtubeUrl;
                            syncItem.youtube_url = syncItem.youtubeUrl;
                        }

                        // Special mapping for Flashcards (front/back <-> question/answer)
                        if (localCol === 'flashcards') {
                            if (syncItem.front) syncItem.question = syncItem.front;
                            if (syncItem.back) syncItem.answer = syncItem.back;
                            if (syncItem.question && !syncItem.front) syncItem.front = syncItem.question;
                            if (syncItem.answer && !syncItem.back) syncItem.back = syncItem.answer;

                            // Ensure Supabase required fields are NOT null if possible
                            if (!syncItem.question) syncItem.question = ' ';
                            if (!syncItem.answer) syncItem.answer = ' ';
                        }

                        // Explicit mapping for Task due dates and ownership
                        if (localCol === 'tasks') {
                            if (syncItem.dueDate) syncItem.due_date = syncItem.dueDate;
                            if (!syncItem.userId && item.userId) syncItem.userId = item.userId;
                        }

                        if (syncItem.taskId && !isUUID(syncItem.taskId)) {
                            const t = db.getById('tasks', syncItem.taskId);
                            if (t?.supabaseId) syncItem.taskId = t.supabaseId;
                            else syncItem.taskId = null;
                        }

                        const cloudItem = await supabasePersistence.upsertToCollection(remoteTable, syncItem);
                        if (cloudItem) {
                            db.update(localCol, item.id, { supabaseId: cloudItem.id });
                        } else {
                            console.warn(`⚠️ Sync failed for ${localCol} item ${item.id}: upsertToCollection returned null`);
                        }
                    } catch (upsertErr) {
                        console.error(`❌ Sync error for ${localCol} item ${item.id}:`, upsertErr.message);
                    }
                }
            }
        }
        console.log('✅ Background sync complete');
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
    // Restore data from cloud first
    await restoreCloudData();
    // Run background sync immediately
    await syncLocalDataToCloud();
    // Then every 5 minutes (Local -> Cloud)
    setInterval(syncLocalDataToCloud, 5 * 60 * 1000);
    // Every 10 minutes (Cloud -> Local) to keep multiple clients in sync
    setInterval(restoreCloudData, 10 * 60 * 1000);

    // Initialize the daily study report scheduler
    initScheduler();
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
