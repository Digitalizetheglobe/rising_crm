import mongoose from 'mongoose';
// Use cached model if already registered (prevents OverwriteModelError on hot-reload)
export const Role = mongoose.models['Role'] ?? mongoose.model('Role', new mongoose.Schema({}, { strict: false }));
