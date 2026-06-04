import mongoose, { Document, Schema } from 'mongoose';
import { UnitType, UnitStatus, UnitFacing, UNIT_TYPES, UNIT_STATUSES, UNIT_FACINGS } from './unit.constants';

export interface IUnit extends Document {
  project: mongoose.Types.ObjectId;
  unitNumber: string;
  type: UnitType;
  floor: number;
  area: number;          // in sq ft
  price: number;         // base price in INR
  status: UnitStatus;
  facing?: UnitFacing;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const unitSchema = new Schema<IUnit>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    unitNumber: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: UNIT_TYPES,
      required: true,
      index: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 0,
    },
    area: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: UNIT_STATUSES,
      default: 'Available',
      index: true,
    },
    facing: {
      type: String,
      enum: UNIT_FACINGS,
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Unique unit number per project
unitSchema.index({ project: 1, unitNumber: 1 }, { unique: true });

// Compound query indexes
unitSchema.index({ project: 1, status: 1 });
unitSchema.index({ project: 1, type: 1 });
unitSchema.index({ project: 1, floor: 1 });

export const Unit = mongoose.model<IUnit>('Unit', unitSchema);