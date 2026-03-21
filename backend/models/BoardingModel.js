const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const boardingSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    type: { type: String, enum: ['single', 'shared', 'annex'] },
    rent: { type: Number, required: true },
    totalRooms: { type: Number },
    vacantRooms: { type: Number },
    amenities: [String],
    images: [String],
    contactNumber: { type: String, required: true },
    owner: { type: ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Boarding', boardingSchema);