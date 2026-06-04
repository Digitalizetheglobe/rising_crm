
import mongoose from 'mongoose';
import { Booking } from './booking.model';
import { Unit } from '../units/unit.model';
import { ApiError } from '../../utils/ApiError';
import { BookingType, PaymentMode } from './booking.constants';

// ─── Create Booking ───────────────────────────────────────────────────────────

export const createBookingService = async (
  body: {
    client: string;
    unit: string;
    bookingType: string;
    bookingDate: Date;
    totalAmount: number;
    discountAmount?: number;
    bookingAmount: number;
    paymentMode: string;
    remarks?: string;
  },
  bookedBy: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch unit with session lock
    const unit = await Unit.findById(body.unit).session(session);
    if (!unit) throw new ApiError(404, 'Unit not found');

    // 2. Enforce business rules on unit status
    if (unit.status === 'Sold') {
      throw new ApiError(400, 'This unit has already been sold and cannot be booked');
    }
    if (unit.status === 'Booked') {
      throw new ApiError(400, 'This unit is already booked');
    }

    // 3. Verify client exists
    const client = await mongoose.model('Client').findById(body.client).session(session);
    if (!client) throw new ApiError(404, 'Client not found');

    // 4. Calculate finalAmount
    const discountAmount = body.discountAmount || 0;
    const finalAmount = body.totalAmount - discountAmount;

    if (finalAmount < 0) throw new ApiError(400, 'Discount cannot exceed total amount');
    if (body.bookingAmount > finalAmount) {
      throw new ApiError(400, 'Booking amount cannot exceed final amount');
    }

    // 5. Create booking
    const [booking] = await Booking.create(
      [
        {
          client: body.client,
          unit: body.unit,
          project: unit.project,
          bookedBy,
          bookingType: body.bookingType as BookingType,
          bookingDate: body.bookingDate,
          totalAmount: body.totalAmount,
          discountAmount,
          finalAmount,
          bookingAmount: body.bookingAmount,
          paymentMode: body.paymentMode as PaymentMode,
          remarks: body.remarks,
          status: 'Active',
        },
      ],
      { session }
    );

    // 6. Mark unit as Booked — CRITICAL business rule
    await Unit.findByIdAndUpdate(
      body.unit,
      { $set: { status: 'Booked' } },
      { session }
    );

    await session.commitTransaction();

    return booking.populate([
      { path: 'client', select: 'name phone email' },
      { path: 'unit', select: 'unitNumber type floor area price status' },
      { path: 'project', select: 'name location' },
      { path: 'bookedBy', select: 'name email' },
    ]);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ─── List Bookings ────────────────────────────────────────────────────────────

export const getBookingsService = async (
  query: {
    clientId?: string;
    projectId?: string;
    unitId?: string;
    status?: string;
    bookingType?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  },
  UserId: string,
  role: string
) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  // SALES_EXECUTIVE sees only bookings they created
  if (role === 'SALES_EXECUTIVE') {
    filter.bookedBy = new mongoose.Types.ObjectId(UserId);
  }

  if (query.clientId) filter.client = new mongoose.Types.ObjectId(query.clientId);
  if (query.projectId) filter.project = new mongoose.Types.ObjectId(query.projectId);
  if (query.unitId) filter.unit = new mongoose.Types.ObjectId(query.unitId);
  if (query.status) filter.status = query.status;
  if (query.bookingType) filter.bookingType = query.bookingType;

  if (query.startDate || query.endDate) {
    filter.bookingDate = {};
    if (query.startDate) filter.bookingDate.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.bookingDate.$lte = end;
    }
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('client', 'name phone email')
      .populate('unit', 'unitNumber type floor area')
      .populate('project', 'name location')
      .populate('bookedBy', 'name email')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get Single Booking ───────────────────────────────────────────────────────

export const getBookingByIdService = async (bookingId: string, UserId: string, role: string) => {
  const booking = await Booking.findById(bookingId)
    .populate('client', 'name phone email address aadhaar PAN')
    .populate('unit', 'unitNumber type floor area price facing status')
    .populate('project', 'name location description')
    .populate('bookedBy', 'name email');

  if (!booking) throw new ApiError(404, 'Booking not found');

  if (role === 'SALES_EXECUTIVE' && booking.bookedBy._id.toString() !== UserId) {
    throw new ApiError(403, 'You are not authorized to view this booking');
  }

  return booking;
};

// ─── Update Booking ───────────────────────────────────────────────────────────

export const updateBookingService = async (
  bookingId: string,
  body: {
    bookingType?: string;
    bookingDate?: Date;
    totalAmount?: number;
    discountAmount?: number;
    bookingAmount?: number;
    paymentMode?: string;
    remarks?: string;
  },
  UserId: string,
  role: string
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.status === 'Cancelled') {
    throw new ApiError(400, 'Cannot update a cancelled booking');
  }
  if (booking.status === 'Completed') {
    throw new ApiError(400, 'Cannot update a completed booking');
  }

  if (role === 'SALES_EXECUTIVE' && booking.bookedBy.toString() !== UserId) {
    throw new ApiError(403, 'You can only edit bookings you created');
  }

  // Recalculate finalAmount if amounts changed
  const totalAmount = body.totalAmount ?? booking.totalAmount;
  const discountAmount = body.discountAmount ?? booking.discountAmount;
  const finalAmount = totalAmount - discountAmount;

  if (finalAmount < 0) throw new ApiError(400, 'Discount cannot exceed total amount');

  const updated = await Booking.findByIdAndUpdate(
    bookingId,
    { $set: { ...body, finalAmount } },
    { new: true }
  ).populate([
    { path: 'client', select: 'name phone email' },
    { path: 'unit', select: 'unitNumber type floor area' },
    { path: 'project', select: 'name location' },
    { path: 'bookedBy', select: 'name email' },
  ]);

  return updated;
};

// ─── Cancel Booking ───────────────────────────────────────────────────────────

export const cancelBookingService = async (
  bookingId: string,
  cancellationReason: string,
  UserId: string,
  role: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new ApiError(404, 'Booking not found');

    if (booking.status === 'Cancelled') {
      throw new ApiError(400, 'Booking is already cancelled');
    }
    if (booking.status === 'Completed') {
      throw new ApiError(400, 'A completed booking cannot be cancelled');
    }

    if (role === 'SALES_EXECUTIVE') {
      throw new ApiError(403, 'Sales Executives cannot cancel bookings');
    }

    // 1. Cancel the booking
    await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          status: 'Cancelled',
          cancelledAt: new Date(),
          cancellationReason,
        },
      },
      { session }
    );

    // 2. Revert unit back to Available — CRITICAL business rule
    await Unit.findByIdAndUpdate(
      booking.unit,
      { $set: { status: 'Available' } },
      { session }
    );

    await session.commitTransaction();

    return { cancelled: true, bookingId, unitReverted: true };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ─── Complete Booking ─────────────────────────────────────────────────────────

export const completeBookingService = async (
  bookingId: string,
  UserId: string,
  role: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new ApiError(404, 'Booking not found');

    if (booking.status !== 'Active') {
      throw new ApiError(400, `Only Active bookings can be completed. Current status: ${booking.status}`);
    }

    // 1. Mark booking as Completed
    await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { status: 'Completed' } },
      { session }
    );

    // 2. Mark unit as Sold — final state
    await Unit.findByIdAndUpdate(
      booking.unit,
      { $set: { status: 'Sold' } },
      { session }
    );

    await session.commitTransaction();

    return { completed: true, bookingId, unitMarkedSold: true };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getBookingStatsService = async (
  query: { projectId?: string; startDate?: string; endDate?: string },
  UserId: string,
  role: string
) => {
  const match: Record<string, any> = {};

  if (role === 'SALES_EXECUTIVE') {
    match.bookedBy = new mongoose.Types.ObjectId(UserId);
  }
  if (query.projectId) match.project = new mongoose.Types.ObjectId(query.projectId);
  if (query.startDate || query.endDate) {
    match.bookingDate = {};
    if (query.startDate) match.bookingDate.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      match.bookingDate.$lte = end;
    }
  }

  const [byStatus, byType, totals] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Booking.aggregate([
      { $match: match },
      { $group: { _id: '$bookingType', count: { $sum: 1 } } },
    ]),

    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          avgDealSize: { $avg: '$finalAmount' },
        },
      },
    ]),
  ]);

  return {
    totalBookings: totals[0]?.totalBookings || 0,
    totalRevenue: totals[0]?.totalRevenue || 0,
    totalDiscount: totals[0]?.totalDiscount || 0,
    avgDealSize: Math.round(totals[0]?.avgDealSize || 0),
    byStatus,
    byType,
  };
};