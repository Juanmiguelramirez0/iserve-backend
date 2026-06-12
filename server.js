require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <--- ONLY ONE OF THESE
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// 1. Models
const User = require('./models/User');
const Request = require('./models/Request');

const app = express();

// 2. Middleware
app.use(express.json());
app.use(cors()); // This allows your React frontend to talk to this backend

// 3. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to iServe LVCC Atlas Database"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// 4. Auth Middleware (To protect routes)
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token, denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

// 5. Routes

// --- LOGIN ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { id: user._id, role: user.role, dept: user.department }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1d' }
            );
            res.json({ token, role: user.role, user: { name: user.fullName, email: user.email } });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REGISTER ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, studentId } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ fullName, email, password: hashedPassword, studentId });
        res.status(201).json({ message: "Account created successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- SUBMIT REQUEST ---
app.post('/api/requests', protect, async (req, res) => {
    try {
        const { serviceType, office, description } = req.body;
        const newRequest = await Request.create({
            student: req.user.id,
            serviceType,
            office,
            description
        });
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// --- GET ALL REQUESTS (For Staff/Admin) ---
app.get('/api/admin/requests', protect, async (req, res) => {
    try {
        // If user is 'admin', they see everything. 
        // If 'staff', they see only requests for their 'dept' (office).
        let query = {};
        if (req.user.role === 'staff') {
            query = { office: req.user.dept };
        }

        const requests = await Request.find(query)
            .populate('student', 'fullName email studentId') // Links student details
            .sort({ dateSubmitted: -1 }); // Newest first

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 iServe Backend running on port ${PORT}`));


app.patch('/api/requests/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/auth/profile', protect, async (req, res) => {
    const { fullName, studentId } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { fullName, studentId }, { new: true });
    res.json(user);
});

const nodemailer = require('nodemailer');

// 1. Setup Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        email_pass: process.env.EMAIL_PASS
    }
});

// 2. Updated Patch Route
app.patch('/api/requests/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        
        // Find request and student email
        const request = await Request.findById(req.params.id).populate('student', 'email fullName');
        if (!request) return res.status(404).json({ message: "Request not found" });

        request.status = status;
        await request.save();

        // 3. Send Email if status is "completed"
        if (status === 'completed') {
            const mailOptions = {
                from: `"iServe LVCC" <${process.env.EMAIL_USER}>`,
                to: request.student.email,
                subject: 'iServe Update: Your Request is Completed!',
                text: `Hello ${request.student.fullName},\n\nYour request for "${request.serviceType}" has been marked as COMPLETED by the ${request.office} office.\n\nYou can now check your dashboard for further details.\n\nBest regards,\niServe LVCC Team`
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) console.log("Email Error:", err);
                else console.log("Email sent:", info.response);
            });
        }

        res.json(request);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});