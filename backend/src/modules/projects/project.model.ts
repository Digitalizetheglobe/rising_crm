import mongoose from 'mongoose';
export const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
