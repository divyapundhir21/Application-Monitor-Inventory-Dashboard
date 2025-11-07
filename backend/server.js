const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Config ---
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = 'dashboardDB';

// --- JWT Config ---
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_only';
const TOKEN_EXPIRY = '1d';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://application-monitor.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy: Not allowed by server'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

let db;
let usersCollection;

// --- Helper: Check App Health ---
const checkApplicationHealth = async (url) => {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.status === 200 ? 'up' : 'down';
  } catch {
    return 'down';
  }
};

const checkBulkHealth = async (applications) =>
  Promise.all(
    applications.map(async (app) => {
      app.status = app.prodUrl
        ? await checkApplicationHealth(app.prodUrl)
        : 'down';
      return app;
    })
  );

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) =>
    cb(null, req.user.id + '-' + Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb('Error: Only images (JPEG/PNG/GIF) are allowed!');
  },
});

// --- JWT Auth Middleware ---
function protect(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token.' });
}

// --- Start Server ---
async function startServer() {
  try {
    const client = new MongoClient(mongoUri, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db('dashboardDB');

    // ensure collection and unique index on applicationID to prevent duplicates
    const applicationsCol = db.collection('applications');
    await applicationsCol.createIndex({ applicationID: 1 }, { unique: true, sparse: true });

    usersCollection = db.collection('users');

    // ✅ Create Default Admin if None Exists
    const userCount = await usersCollection.countDocuments();
    if (userCount === 0) {
      const defaultAdmin = {
        username: 'admin',
        password: 'admin123', // plain text shown only in console
        firstName: 'System',
        lastName: 'Admin',
      };

      const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
      await usersCollection.insertOne({
        username: defaultAdmin.username,
        password: hashedPassword,
        firstName: defaultAdmin.firstName,
        lastName: defaultAdmin.lastName,
        role: 'admin',
      });

      console.log('🧩 Default Admin Created');
      console.log(`   Username: ${defaultAdmin.username}`);
      console.log(`   Password: ${defaultAdmin.password}`);
      console.log('----------------------------------------');
    }

    // ---------------- AUTH ROUTES ----------------

    // ❌ Signup route removed

    app.post('/api/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const user = await usersCollection.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

        const token = jwt.sign(
          { id: user._id.toString(), username: user.username },
          JWT_SECRET,
          { expiresIn: TOKEN_EXPIRY }
        );

        res.json({
          token,
          user: {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            profilePicUrl: user.profilePicUrl || null,
          },
        });
      } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server error during login.' });
      }
    });

    // ---------------- APPLICATION ROUTES ----------------

    app.post('/api/applications/bulk', async (req, res) => {
      try {
        console.log('Received bulk upload request');
        const applications = req.body;
        
        if (!Array.isArray(applications)) {
          return res.status(400).json({ error: 'Request body must be an array' });
        }

        // Check if MongoDB connection exists
        if (!db) {
          throw new Error('Database connection not established');
        }

        // Add status field for each application
        const appsWithStatus = await Promise.all(applications.map(async (app) => {
          const status = app.prodUrl ? await checkApplicationHealth(app.prodUrl) : 'unknown';
          return { ...app, status };
        }));

        // Insert all applications
        const result = await db.collection('applications').insertMany(appsWithStatus);

        res.json({
          success: true,
          message: `Successfully uploaded ${result.insertedCount} applications`,
          insertedIds: result.insertedIds
        });
      } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({ 
          error: 'Failed to process bulk upload',
          details: error.message 
        });
      }
    });

    app.get('/api/applications', protect, async (req, res) => {
      try {
        const apps = await db.collection('applications').find({}).toArray();
        const withStatus = await checkBulkHealth(apps);
        res.json(withStatus);
      } catch (err) {
        res.status(500).json({ message: 'Error fetching applications' });
      }
    });

    app.post('/api/applications', protect, async (req, res) => {
      try {
        const newApp = req.body;
        newApp.status = await checkApplicationHealth(newApp.prodUrl);
        const result = await db.collection('applications').insertOne(newApp);
        res.status(201).json({ _id: result.insertedId, message: 'Added successfully' });
      } catch (err) {
        res.status(500).json({ message: 'Error adding application' });
      }
    });

    app.put('/api/applications/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { _id, ...updatedData } = req.body;

        if (!ObjectId.isValid(id))
          return res.status(400).json({ message: 'Invalid ID format' });

        if (updatedData.prodUrl)
          updatedData.status = await checkApplicationHealth(updatedData.prodUrl);

        const result = await db.collection('applications').updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.matchedCount === 0)
          return res.status(404).json({ message: 'Application not found' });

        res.status(200).json({ message: 'Application updated successfully' });
      } catch (err) {
        console.error('Error updating application:', err);
        res.status(500).json({ message: 'Error updating application', error: err.message });
      }
    });

    app.delete('/api/applications/:id', protect, async (req, res) => {
      try {
        const { id } = req.params;
        const result = await db.collection('applications').deleteOne({ _id: new ObjectId(id) });
        if (!result.deletedCount)
          return res.status(404).json({ message: 'Application not found.' });
        res.json({ message: 'Application deleted successfully.' });
      } catch (err) {
        res.status(500).json({ message: 'Error deleting application.' });
      }
    });

    // ---------------- USER ROUTES ----------------

    app.get('/api/users/me', protect, async (req, res) => {
      try {
        const user = await usersCollection.findOne(
          { _id: new ObjectId(req.user.id) },
          { projection: { password: 0 } }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
      } catch (err) {
        res.status(500).json({ message: 'Server error fetching user data.' });
      }
    });

    app.get('/api/user/me', protect, async (req, res) => {
      try {
        const user = await usersCollection.findOne(
          { _id: new ObjectId(req.user.id) },
          { projection: { password: 0 } }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
      } catch (err) {
        res.status(500).json({ message: 'Server error fetching user data.' });
      }
    });

    app.put('/api/users/profile', protect, async (req, res) => {
      try {
        const { firstName, lastName } = req.body;
        if (!firstName || !lastName)
          return res.status(400).json({ message: 'Both names required.' });

        const result = await usersCollection.updateOne(
          { _id: new ObjectId(req.user.id) },
          { $set: { firstName, lastName } }
        );
        if (!result.matchedCount)
          return res.status(404).json({ message: 'User not found.' });

        res.status(200).json({ message: 'Profile updated!', firstName, lastName });
      } catch (err) {
        res.status(500).json({ message: 'Error updating profile.' });
      }
    });

    app.put('/api/users/password', protect, async (req, res) => {
      try {
        const { oldPassword, newPassword } = req.body;
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) return res.status(400).json({ message: 'Incorrect old password.' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await usersCollection.updateOne(
          { _id: new ObjectId(req.user.id) },
          { $set: { password: hashed } }
        );
        res.json({ message: 'Password changed successfully.' });
      } catch (err) {
        res.status(500).json({ message: 'Error changing password.' });
      }
    });

    app.put('/api/users/profile-picture', protect, upload.single('profilePic'), async (req, res) => {
      try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
        const profilePicUrl = `uploads/${req.file.filename}`;
        await usersCollection.updateOne(
          { _id: new ObjectId(req.user.id) },
          { $set: { profilePicUrl } }
        );
        res.json({ message: 'Profile picture updated!', profilePicUrl });
      } catch (err) {
        res.status(500).json({ message: 'Error uploading profile picture.' });
      }
    });

    // ---------------- ADMIN ROUTES ----------------

// Check if username already exists
app.get('/api/users/check-username/:username', protect, async (req, res) => {
  try {
    const { username } = req.params;
    const existing = await usersCollection.findOne({ username });
    res.json({ exists: !!existing });
  } catch (err) {
    res.status(500).json({ message: 'Error checking username.' });
  }
});

// Add new admin
app.post('/api/admins', protect, async (req, res) => {
  try {
    const { firstName, lastName, username, password } = req.body;
    if (!firstName || !lastName || !username || !password)
      return res.status(400).json({ message: 'All fields required.' });

    const existing = await usersCollection.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({
      firstName,
      lastName,
      username,
      password: hashed,
      role: 'admin',
    });

    res.status(201).json({ message: 'Admin created successfully.' });
  } catch (err) {
    console.error('Error adding admin:', err);
    res.status(500).json({ message: 'Server error adding admin.' });
  }
});


    // ---------------- START ----------------
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}

startServer();
