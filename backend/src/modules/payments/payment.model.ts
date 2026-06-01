import mongoose from 'mongoose';
export const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
