const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8007;

// Configure Multer for local storage (In prod, use S3)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

app.post('/upload', upload.single('media'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    res.json({
        mediaUrl: `http://localhost:8007/uploads/${req.file.filename}`,
        fileName: req.file.filename,
        mimetype: req.file.mimetype
    });
});

app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => res.json({ status: 'Media Service is healthy' }));

app.listen(PORT, () => {
    console.log(`🖼️ Media Service running on port ${PORT}`);
});
