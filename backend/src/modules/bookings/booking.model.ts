import mongoose, { Document, Schema } from 'mongoose';
import {
  BookingType,
  BookingStatus,
  PaymentMode,
  BOOKING_TYPES,
  BOOKING_STATUSES,
  PAYMENT_MODES,
} from './booking.constants';

export interface IBooking extends Document {
  client: mongoose.Types.ObjectId;
  unit: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  bookedBy: mongoose.Types.ObjectId;         // User who created the booking
  bookingType: BookingType;
  status: BookingStatus;
  bookingDate: Date;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  bookingAmount: number;                     // Initial token/booking amount paid
  paymentMode: PaymentMode;
  remarks?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    bookedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingType: {
      type: String,
      enum: BOOKING_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'Active',
      index: true,
    },
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// One active booking per unit at a time
bookingSchema.index({ unit: 1, status: 1 });
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ project: 1, bookingDate: -1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);