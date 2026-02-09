const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Keep original filename but prefix with timestamp
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    cb(null, safe);
  }
});

const upload = multer({ storage });

// Allow simple CORS for local development
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Upload endpoint: accepts field 'file'
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.originalname, size: req.file.size });
});

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Local upload server running on http://localhost:${port}`));

// Simple root and health endpoints to make debugging easier
app.get('/', (req, res) => {
  res.type('text').send('Local upload server is running. Use POST /upload to upload files.');
});

app.get('/_health', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR).filter(Boolean);
    res.json({ ok: true, uploads: files.length, files });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});
