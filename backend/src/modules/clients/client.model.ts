import mongoose from 'mongoose';
export const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
