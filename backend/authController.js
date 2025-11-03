// backend/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

let usersCollection; // We'll set this from server.js once DB connects

// Initialize the MongoDB collection
exports.init = (db) => {
    usersCollection = db.collection('users');
};

// Admin adds user or admin
exports.addUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!req.user || req.user.role !== 'admin')
            return res.status(403).json({ message: 'Access denied. Admins only.' });

        const existing = await usersCollection.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username,
            email,
            password: hashedPassword,
            role,
            createdBy: new ObjectId(req.user.id),
            createdAt: new Date()
        };

        await usersCollection.insertOne(newUser);
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// User or Admin login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await usersCollection.findOne({ email });

        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: { id: user._id, username: user.username, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
