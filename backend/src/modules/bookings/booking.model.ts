import mongoose from 'mongoose';
export const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));
