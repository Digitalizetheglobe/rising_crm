import mongoose from 'mongoose';
export const Unit = mongoose.model('Unit', new mongoose.Schema({}, { strict: false }));
