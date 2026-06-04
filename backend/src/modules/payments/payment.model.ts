import mongoose, { Document, Schema } from 'mongoose';
import {
  PaymentStatus,
  PaymentMode,
  PaymentType,
  PAYMENT_STATUSES,
  PAYMENT_MODES,
  PAYMENT_TYPES,
} from './payment.constants';

export interface IPayment extends Document {
  booking: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  paymentType: PaymentType;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  paymentMode?: PaymentMode;
  receiptNumber?: string;
  transactionId?: string;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    paymentType: {
      type: String,
      enum: PAYMENT_TYPES,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'Pending',
      index: true,
    },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      default: null,
    },
    receiptNumber: {
      type: String,
      trim: true,
      default: null,
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ client: 1, status: 1 });
paymentSchema.index({ status: 1, dueDate: 1 }); // For overdue cron job
paymentSchema.index({ receiptNumber: 1 }, { sparse: true });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);