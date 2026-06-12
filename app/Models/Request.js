// const mongoose = require('mongoose');

// const RequestSchema = new mongoose.Schema({
//     student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     serviceType: { type: String, required: true },
//     office: { type: String, required: true },
//     description: { type: String, required: true },
//     status: { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending' },
//     dateSubmitted: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Request', RequestSchema);