const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    assignedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Module', moduleSchema);
