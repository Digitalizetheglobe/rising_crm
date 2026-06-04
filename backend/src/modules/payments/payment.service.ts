
import mongoose from 'mongoose';
import { Payment } from './payment.model';
import { Booking } from '../bookings/booking.model';
import { ApiError } from '../../utils/ApiError';
import { PaymentType } from './payment.constants';

// ─── Create Payment ───────────────────────────────────────────────────────────

export const createPaymentService = async (
  body: {
    booking: string;
    client: string;
    paymentType: string;
    amount: number;
    dueDate: Date;
    notes?: string;
  },
  recordedBy: string
) => {
  // Verify booking exists and belongs to this client
  const booking = await Booking.findById(body.booking);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.client.toString() !== body.client) {
    throw new ApiError(400, 'Client does not match the booking');
  }

  if (booking.status === 'Cancelled') {
    throw new ApiError(400, 'Cannot add payments to a cancelled booking');
  }

  // Verify client exists
  const client = await mongoose.model('Client').findById(body.client);
  if (!client) throw new ApiError(404, 'Client not found');

  const payment = await Payment.create({
    ...body,
    paymentType: body.paymentType as PaymentType,
    recordedBy,
    status: 'Pending',
  });

  return payment.populate([
    { path: 'booking', select: 'bookingType status finalAmount bookingDate' },
    { path: 'client', select: 'name phone email' },
    { path: 'recordedBy', select: 'name email' },
  ]);
};

// ─── List Payments ────────────────────────────────────────────────────────────

export const getPaymentsService = async (
  query: {
    bookingId?: string;
    clientId?: string;
    status?: string;
    paymentType?: string;
    startDate?: string;
    endDate?: string;
    overdue?: string;
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

  // SALES_EXECUTIVE sees only payments for their own clients
  // We join through booking → bookedBy for scoping
  if (role === 'SALES_EXECUTIVE') {
    const myBookings = await Booking.find({ bookedBy: UserId }).select('_id');
    filter.booking = { $in: myBookings.map((b) => b._id) };
  }

  if (query.bookingId) filter.booking = new mongoose.Types.ObjectId(query.bookingId);
  if (query.clientId) filter.client = new mongoose.Types.ObjectId(query.clientId);
  if (query.status) filter.status = query.status;
  if (query.paymentType) filter.paymentType = query.paymentType;

  // Overdue shortcut filter
  if (query.overdue === 'true') {
    filter.status = 'Pending';
    filter.dueDate = { $lt: new Date() };
  }

  if (query.startDate || query.endDate) {
    filter.dueDate = filter.dueDate || {};
    if (query.startDate) filter.dueDate.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.dueDate.$lte = end;
    }
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('booking', 'bookingType status finalAmount')
      .populate('client', 'name phone email')
      .populate('recordedBy', 'name email')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get Single Payment ───────────────────────────────────────────────────────

export const getPaymentByIdService = async (paymentId: string, UserId: string, role: string) => {
  const payment = await Payment.findById(paymentId)
    .populate('booking', 'bookingType status finalAmount bookingDate unit project')
    .populate('client', 'name phone email address')
    .populate('recordedBy', 'name email');

  if (!payment) throw new ApiError(404, 'Payment not found');

  if (role === 'SALES_EXECUTIVE') {
    const booking = await Booking.findById(payment.booking);
    if (booking?.bookedBy.toString() !== UserId) {
      throw new ApiError(403, 'You are not authorized to view this payment');
    }
  }

  return payment;
};

// ─── Update Payment (only Pending payments) ───────────────────────────────────

export const updatePaymentService = async (
  paymentId: string,
  body: {
    paymentType?: string;
    amount?: number;
    dueDate?: Date;
    notes?: string;
  }
) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'Paid') {
    throw new ApiError(400, 'Cannot edit a payment that has already been paid');
  }
  if (payment.status === 'Waived') {
    throw new ApiError(400, 'Cannot edit a waived payment');
  }

  const updated = await Payment.findByIdAndUpdate(paymentId, { $set: body }, { new: true }).populate([
    { path: 'booking', select: 'bookingType status finalAmount' },
    { path: 'client', select: 'name phone email' },
    { path: 'recordedBy', select: 'name email' },
  ]);

  return updated;
};

// ─── Mark as Paid ─────────────────────────────────────────────────────────────

export const markPaymentPaidService = async (
  paymentId: string,
  body: {
    paidDate: Date;
    paymentMode: string;
    receiptNumber?: string;
    transactionId?: string;
    notes?: string;
  }
) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'Paid') {
    throw new ApiError(400, 'Payment has already been marked as paid');
  }
  if (payment.status === 'Waived') {
    throw new ApiError(400, 'Cannot mark a waived payment as paid');
  }

  // Check for duplicate receipt number
  if (body.receiptNumber) {
    const duplicate = await Payment.findOne({
      receiptNumber: body.receiptNumber,
      _id: { $ne: paymentId },
    });
    if (duplicate) {
      throw new ApiError(409, `Receipt number "${body.receiptNumber}" is already used on another payment`);
    }
  }

  const updated = await Payment.findByIdAndUpdate(
    paymentId,
    { $set: { ...body, status: 'Paid' } },
    { new: true }
  ).populate([
    { path: 'booking', select: 'bookingType status finalAmount' },
    { path: 'client', select: 'name phone email' },
    { path: 'recordedBy', select: 'name email' },
  ]);

  return updated;
};

// ─── Waive Payment ────────────────────────────────────────────────────────────

export const waivePaymentService = async (paymentId: string, notes: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'Paid') {
    throw new ApiError(400, 'Cannot waive a payment that has already been paid');
  }
  if (payment.status === 'Waived') {
    throw new ApiError(400, 'Payment is already waived');
  }

  const updated = await Payment.findByIdAndUpdate(
    paymentId,
    { $set: { status: 'Waived', notes } },
    { new: true }
  ).populate([
    { path: 'booking', select: 'bookingType status finalAmount' },
    { path: 'client', select: 'name phone email' },
    { path: 'recordedBy', select: 'name email' },
  ]);

  return updated;
};

// ─── Delete Payment ───────────────────────────────────────────────────────────

export const deletePaymentService = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'Paid') {
    throw new ApiError(400, 'Cannot delete a paid payment. Waive it instead.');
  }

  await Payment.findByIdAndDelete(paymentId);
  return { deleted: true };
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getPaymentStatsService = async (
  query: { bookingId?: string; clientId?: string; startDate?: string; endDate?: string },
  UserId: string,
  role: string
) => {
  const match: Record<string, any> = {};

  if (role === 'SALES_EXECUTIVE') {
    const myBookings = await Booking.find({ bookedBy: UserId }).select('_id');
    match.booking = { $in: myBookings.map((b) => b._id) };
  }

  if (query.bookingId) match.booking = new mongoose.Types.ObjectId(query.bookingId);
  if (query.clientId) match.client = new mongoose.Types.ObjectId(query.clientId);

  if (query.startDate || query.endDate) {
    match.dueDate = {};
    if (query.startDate) match.dueDate.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      match.dueDate.$lte = end;
    }
  }

  const now = new Date();

  const [byStatus, totals, overdueCount] = await Promise.all([
    Payment.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),

    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalDue: { $sum: '$amount' },
          totalCollected: {
            $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0] },
          },
        },
      },
    ]),

    Payment.countDocuments({
      ...match,
      status: 'Pending',
      dueDate: { $lt: now },
    }),
  ]);

  return {
    totalPayments: totals[0]?.totalPayments || 0,
    totalDue: totals[0]?.totalDue || 0,
    totalCollected: totals[0]?.totalCollected || 0,
    totalPending: totals[0]?.totalPending || 0,
    overdueCount,
    byStatus,
  };
};

// ─── Auto-mark Overdue (for cron job) ────────────────────────────────────────

export const markOverduePaymentsService = async () => {
  const result = await Payment.updateMany(
    {
      status: 'Pending',
      dueDate: { $lt: new Date() },
    },
    { $set: { status: 'Overdue' } }
  );

  return { markedOverdue: result.modifiedCount };
};