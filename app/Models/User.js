// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//     fullName: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     studentId: { type: String, unique: true, sparse: true },
//     role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
//     department: { type: String, default: 'General' }
// });

// module.exports = mongoose.model('User', UserSchema);