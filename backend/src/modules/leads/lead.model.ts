import mongoose from 'mongoose';
export const Lead = mongoose.model('Lead', new mongoose.Schema({}, { strict: false }));
