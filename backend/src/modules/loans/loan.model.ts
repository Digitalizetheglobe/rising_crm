
import mongoose, { Document, Schema } from 'mongoose';
import { LoanStatus, LOAN_STATUSES } from './loan.constants';

export interface ILoan extends Document {
  booking: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  bankName: string;
  loanAmount: number;
  sanctionedAmount?: number;
  interestRate?: number;        // % per annum
  tenureMonths?: number;
  emiAmount?: number;
  status: LoanStatus;
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  bankContact?: string;         // name or phone of bank relationship manager
  remarks?: string;
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      // index :true
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    sanctionedAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    interestRate: {
      type: Number,
      default: null,
      min: 0,
    },
    tenureMonths: {
      type: Number,
      default: null,
      min: 1,
    },
    emiAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: LOAN_STATUSES,
      default: 'Applied',
      index: true,
    },
    applicationDate: {
      type: Date,
      required: true,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    disbursementDate: {
      type: Date,
      default: null,
    },
    bankContact: {
      type: String,
      trim: true,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        note: { type: String, trim: true },
      },
    ],
  },
  { timestamps: true }
);

// One loan per booking (a booking can only have one active loan application)
loanSchema.index({ booking: 1 }, { unique: true });
loanSchema.index({ client: 1, status: 1 });

export const Loan = mongoose.model<ILoan>('Loan', loanSchema);