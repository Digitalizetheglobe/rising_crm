import mongoose from 'mongoose';
import { Unit } from './unit.model';
import { ApiError } from '../../utils/ApiError';
import { UnitType, UnitStatus, UnitFacing } from './unit.constants';

// ─── Create Single Unit ───────────────────────────────────────────────────────

export const createUnitService = async (body: {
  project: string;
  unitNumber: string;
  type: string;
  floor: number;
  area: number;
  price: number;
  status?: string;
  facing?: string;
  description?: string;
}) => {
  // Verify project exists
  const project = await mongoose.model('Project').findById(body.project);
  if (!project) throw new ApiError(404, 'Project not found');

  // Check for duplicate unit number within the same project
  const exists = await Unit.findOne({ project: body.project, unitNumber: body.unitNumber });
  if (exists) throw new ApiError(409, `Unit number "${body.unitNumber}" already exists in this project`);

  const unit = await Unit.create({
    project: body.project,
    unitNumber: body.unitNumber,
    type: body.type as UnitType,
    floor: body.floor,
    area: body.area,
    price: body.price,
    ...(body.status ? { status: body.status as UnitStatus } : {}),
    ...(body.facing ? { facing: body.facing as UnitFacing } : {}),
    ...(body.description ? { description: body.description } : {}),
  });
  return unit.populate('project', 'name location status');
};

// ─── Bulk Create Units ────────────────────────────────────────────────────────

export const bulkCreateUnitsService = async (body: {
  project: string;
  units: {
    unitNumber: string;
    type: string;
    floor: number;
    area: number;
    price: number;
    facing?: string;
    description?: string;
  }[];
}) => {
  const project = await mongoose.model('Project').findById(body.project);
  if (!project) throw new ApiError(404, 'Project not found');

  // Fetch existing unit numbers for this project
  const existingUnits = await Unit.find({ project: body.project }).select('unitNumber');
  const existingNumbers = new Set(existingUnits.map((u) => u.unitNumber));

  const toInsert: any[] = [];
  const skipped: string[] = [];

  for (const u of body.units) {
    if (existingNumbers.has(u.unitNumber)) {
      skipped.push(u.unitNumber);
    } else {
      toInsert.push({ ...u, project: body.project, status: 'Available' });
      existingNumbers.add(u.unitNumber); // prevent dupes within the same batch
    }
  }

  let inserted: any[] = [];
  if (toInsert.length > 0) {
    inserted = await Unit.insertMany(toInsert);
  }

  return {
    insertedCount: inserted.length,
    skippedCount: skipped.length,
    skippedUnitNumbers: skipped,
  };
};

// ─── List Units ───────────────────────────────────────────────────────────────

export const getUnitsService = async (query: {
  projectId?: string;
  status?: string;
  type?: string;
  floor?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  facing?: string;
  search?: string;
  page?: string;
  limit?: string;
}) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (query.projectId) {
    filter.project = new mongoose.Types.ObjectId(query.projectId);
  }

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.facing) filter.facing = query.facing;

  if (query.floor !== undefined) {
    filter.floor = parseInt(query.floor, 10);
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = parseFloat(query.minPrice);
    if (query.maxPrice) filter.price.$lte = parseFloat(query.maxPrice);
  }

  if (query.minArea || query.maxArea) {
    filter.area = {};
    if (query.minArea) filter.area.$gte = parseFloat(query.minArea);
    if (query.maxArea) filter.area.$lte = parseFloat(query.maxArea);
  }

  if (query.search) {
    filter.$or = [
      { unitNumber: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [units, total] = await Promise.all([
    Unit.find(filter)
      .populate('project', 'name location status')
      .sort({ floor: 1, unitNumber: 1 })
      .skip(skip)
      .limit(limit),
    Unit.countDocuments(filter),
  ]);

  return {
    units,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Get Single Unit ──────────────────────────────────────────────────────────

export const getUnitByIdService = async (unitId: string) => {
  const unit = await Unit.findById(unitId).populate('project', 'name location status totalUnits launchDate');
  if (!unit) throw new ApiError(404, 'Unit not found');
  return unit;
};

// ─── Update Unit ──────────────────────────────────────────────────────────────

export const updateUnitService = async (
  unitId: string,
  body: {
    unitNumber?: string;
    type?: string;
    floor?: number;
    area?: number;
    price?: number;
    facing?: string | null;
    description?: string;
  }
) => {
  const unit = await Unit.findById(unitId);
  if (!unit) throw new ApiError(404, 'Unit not found');

  // If unit is Booked or Sold, block changes to price/type/area
  if (unit.status !== 'Available') {
    const blockedFields = ['type', 'area', 'price'];
    const attemptedBlocked = blockedFields.filter((f) => (body as any)[f] !== undefined);
    if (attemptedBlocked.length > 0) {
      throw new ApiError(
        400,
        `Cannot update ${attemptedBlocked.join(', ')} on a ${unit.status} unit`
      );
    }
  }

  // Check unitNumber uniqueness if changed
  if (body.unitNumber && body.unitNumber !== unit.unitNumber) {
    const duplicate = await Unit.findOne({
      project: unit.project,
      unitNumber: body.unitNumber,
      _id: { $ne: unitId },
    });
    if (duplicate) {
      throw new ApiError(409, `Unit number "${body.unitNumber}" already exists in this project`);
    }
  }

  const updated = await Unit.findByIdAndUpdate(unitId, { $set: body }, { new: true }).populate(
    'project',
    'name location status'
  );

  return updated;
};

// ─── Update Unit Status (Admin only) ─────────────────────────────────────────

export const updateUnitStatusService = async (unitId: string, status: string) => {
  const unit = await Unit.findById(unitId);
  if (!unit) throw new ApiError(404, 'Unit not found');

  // A Sold unit cannot be made Available directly — must go through cancellation flow
  if (unit.status === 'Sold' && status === 'Available') {
    throw new ApiError(400, 'A Sold unit cannot be directly set to Available. Cancel the booking first.');
  }

  const updated = await Unit.findByIdAndUpdate(
    unitId,
    { $set: { status } },
    { new: true }
  ).populate('project', 'name location status');

  return updated;
};

// ─── Delete Unit ──────────────────────────────────────────────────────────────

export const deleteUnitService = async (unitId: string) => {
  const unit = await Unit.findById(unitId);
  if (!unit) throw new ApiError(404, 'Unit not found');

  if (unit.status === 'Booked') {
    throw new ApiError(400, 'Cannot delete a Booked unit. Cancel the booking first.');
  }
  if (unit.status === 'Sold') {
    throw new ApiError(400, 'Cannot delete a Sold unit.');
  }

  await Unit.findByIdAndDelete(unitId);
  return { deleted: true };
};

// ─── Stats ─────────────────────────────────────────────────────────────────────

export const getUnitStatsService = async (projectId?: string) => {
  const match: Record<string, any> = {};
  if (projectId) match.project = new mongoose.Types.ObjectId(projectId);

  const [byStatus, byType, totals] = await Promise.all([
    Unit.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    Unit.aggregate([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } },
    ]),

    Unit.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalUnits: { $sum: 1 },
          availableUnits: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } },
          bookedUnits: { $sum: { $cond: [{ $eq: ['$status', 'Booked'] }, 1, 0] } },
          soldUnits: { $sum: { $cond: [{ $eq: ['$status', 'Sold'] }, 1, 0] } },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' },
          totalArea: { $sum: '$area' },
        },
      },
    ]),
  ]);

  return {
    totalUnits: totals[0]?.totalUnits || 0,
    availableUnits: totals[0]?.availableUnits || 0,
    bookedUnits: totals[0]?.bookedUnits || 0,
    soldUnits: totals[0]?.soldUnits || 0,
    priceRange: {
      min: totals[0]?.minPrice || 0,
      max: totals[0]?.maxPrice || 0,
      avg: Math.round(totals[0]?.avgPrice || 0),
    },
    totalArea: totals[0]?.totalArea || 0,
    byStatus,
    byType,
  };
};
