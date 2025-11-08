const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Config ---
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = 'dashboardDB';

// --- JWT Config ---
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev_only';
const TOKEN_EXPIRY = '8h'; // Changed to 8 hours

// --- Auth Middleware ---
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized for this action' });
    }
    next();
};

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://application-monitor.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
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

// Add session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_for_local_dev_only',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database connection and variables
let db;

async function connectToDatabase() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        db = client.db(dbName);

        // Initialize collections
        await db.collection('applications').createIndex(
            { applicationID: 1 },
            { unique: true, sparse: true }
        );

        // Initialize default users
        const defaultUsers = [
            {
                email: 'admin@chevron.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                createdAt: new Date()
            },
            {
                email: 'divyapundhir@chevron.com',
                firstName: 'Divya',
                lastName: 'Pundhir',
                role: 'viewer',
                createdAt: new Date()
            }
        ];

        for (const user of defaultUsers) {
            const exists = await db.collection('users').findOne({ email: user.email });
            if (!exists) {
                await db.collection('users').insertOne(user);
                console.log(`✅ Created user: ${user.email}`);
            }
        }

        console.log('✅ Database connected and initialized');
        return true;
    } catch (err) {
        console.error('Database connection error:', err);
        return false;
    }
}

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

// Add admin middleware
const isAdmin = async (req, res, next) => {
    try {
        const user = await db.collection('users').findOne({
            _id: new ObjectId(req.user.id)
        });
        if (user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Error checking admin status.' });
    }
}

// --- Helper Functions ---
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
            app.status = app.prodUrl ? await checkApplicationHealth(app.prodUrl) : 'down';
            return app;
        })
    );

// --- Multer Setup ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) =>
        cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images (JPEG/PNG/GIF) are allowed!'));
    }
});

// --- Start Server ---
async function startServer() {
    try {
        const connected = await connectToDatabase();
        if (!connected) {
            throw new Error('Failed to connect to database');
        }

        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Server startup failed:', err);
        process.exit(1);
    }
}

// --- User Management Routes ---
app.post('/api/users', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { email, firstName, lastName, role } = req.body;

        if (!email?.trim() || !firstName?.trim() || !lastName?.trim() || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await db.collection('users').findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const newUser = {
            email: email.toLowerCase().trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: role,
            createdAt: new Date()
        };

        await db.collection('users').insertOne(newUser);
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Update single login endpoint with role-based JWT
app.post('/api/login', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Login attempt body:', req.body);

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Valid email is required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await db.collection('users').findOne({ email: normalizedEmail });

        console.log('User found:', user ? 'yes' : 'no');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email not authorized'
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        console.log('Token generated successfully');

        return res.json({
            success: true,
            token,
            user: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error details:', {
            error: error.message,
            body: req.body
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Protect application routes with role-based auth
app.post('/api/applications', requireAuth, requireRole('admin', 'user'), async (req, res) => {
    try {
        const newApp = req.body;
        newApp.status = await checkApplicationHealth(newApp.prodUrl);
        const result = await db.collection('applications').insertOne(newApp);
        res.status(201).json({ _id: result.insertedId, message: 'Added successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding application' });
    }
});

app.put('/api/applications/:id', requireAuth, requireRole('admin', 'user'), async (req, res) => {
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

app.delete('/api/applications/:id', requireAuth, requireRole('admin'), async (req, res) => {
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

app.get('/api/applications', requireAuth, async (req, res) => {
    try {
        const applications = await db.collection('applications').find({}).toArray();
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.id) }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

app.put('/api/users/profile', protect, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        if (!firstName || !lastName) {
            return res.status(400).json({ message: 'Both names required.' });
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(req.user.id) },
            { $set: { firstName, lastName } }
        );

        if (!result.matchedCount) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'Profile updated!', firstName, lastName });
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile.' });
    }
});

app.put('/api/users/password', protect, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) return res.status(400).json({ message: 'Incorrect old password.' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await db.collection('users').updateOne(
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
        await db.collection('users').updateOne(
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
        const existing = await db.collection('users').findOne({ username });
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

        const existing = await db.collection('users').findOne({ username });
        if (existing) return res.status(400).json({ message: 'Username already exists.' });

        const hashed = await bcrypt.hash(password, 10);
        await db.collection('users').insertOne({
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

// User Management Routes
app.post('/api/users', protect, isAdmin, async (req, res) => {
    try {
        const { email, firstName, lastName, role } = req.body;
        const existingUser = await db.collection('users').findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        await db.collection('users').insertOne({
            email,
            firstName,
            lastName,
            role: role || 'viewer',
            createdAt: new Date()
        });

        res.status(201).json({ message: 'User added successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding user.' });
    }
});

// Get all users (admin only)
app.get('/api/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await db.collection('users')
            .find({}, { projection: { password: 0 } })
            .toArray();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users.' });
    }
});

// ---------------- START ----------------
startServer();
