
import mongoose from 'mongoose';
import { Loan } from './loan.model';
import { Booking } from '../bookings/booking.model';
import { VALID_LOAN_TRANSITIONS } from './loan.constants';
import { ApiError } from '../../utils/ApiError';

// ─── Create Loan ──────────────────────────────────────────────────────────────

export const createLoanService = async (
  body: {
    booking: string;
    client: string;
    bankName: string;
    loanAmount: number;
    applicationDate: Date;
    interestRate?: number;
    tenureMonths?: number;
    bankContact?: string;
    remarks?: string;
  },
  createdBy: string
) => {
  // Verify booking exists and belongs to this client
  const booking = await Booking.findById(body.booking);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.client.toString() !== body.client) {
    throw new ApiError(400, 'Client does not match the booking');
  }

  if (booking.status === 'Cancelled') {
    throw new ApiError(400, 'Cannot create a loan for a cancelled booking');
  }

  // Enforce one loan per booking
  const existing = await Loan.findOne({ booking: body.booking });
  if (existing) {
    throw new ApiError(409, 'A loan application already exists for this booking');
  }

  // Verify client exists
  const client = await mongoose.model('Client').findById(body.client);
  if (!client) throw new ApiError(404, 'Client not found');

  const loan = await Loan.create({
    ...body,
    createdBy,
    status: 'Applied',
    statusHistory: [{ status: 'Applied', changedAt: new Date(), changedBy: createdBy }],
  });

  return loan.populate([
    { path: 'booking', select: 'bookingType status finalAmount bookingDate' },
    { path: 'client', select: 'name phone email' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

// ─── List Loans ───────────────────────────────────────────────────────────────

export const getLoansService = async (
  query: {
    clientId?: string;
    bookingId?: string;
    status?: string;
    bankName?: string;
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

  // SALES_EXECUTIVE sees only loans tied to their bookings
  if (role === 'SALES_EXECUTIVE') {
    const myBookings = await Booking.find({ bookedBy: UserId }).select('_id');
    filter.booking = { $in: myBookings.map((b) => b._id) };
  }

  if (query.clientId) filter.client = new mongoose.Types.ObjectId(query.clientId);
  if (query.bookingId) filter.booking = new mongoose.Types.ObjectId(query.bookingId);
  if (query.status) filter.status = query.status;
  if (query.bankName) filter.bankName = { $regex: query.bankName, $options: 'i' };

  const [loans, total] = await Promise.all([
    Loan.find(filter)
      .populate('booking', 'bookingType status finalAmount bookingDate')
      .populate('client', 'name phone email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Loan.countDocuments(filter),
  ]);

  return {
    loans,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get Single Loan ──────────────────────────────────────────────────────────

export const getLoanByIdService = async (loanId: string, UserId: string, role: string) => {
  const loan = await Loan.findById(loanId)
    .populate('booking', 'bookingType status finalAmount bookingDate unit project')
    .populate('client', 'name phone email address')
    .populate('createdBy', 'name email')
    .populate('statusHistory.changedBy', 'name email');

  if (!loan) throw new ApiError(404, 'Loan not found');

  if (role === 'SALES_EXECUTIVE') {
    const booking = await Booking.findById(loan.booking);
    if (booking?.bookedBy.toString() !== UserId) {
      throw new ApiError(403, 'You are not authorized to view this loan');
    }
  }

  return loan;
};

// ─── Update Loan Details ──────────────────────────────────────────────────────

export const updateLoanService = async (
  loanId: string,
  body: {
    bankName?: string;
    loanAmount?: number;
    applicationDate?: Date;
    interestRate?: number | null;
    tenureMonths?: number | null;
    bankContact?: string | null;
    remarks?: string;
  }
) => {
  const loan = await Loan.findById(loanId);
  if (!loan) throw new ApiError(404, 'Loan not found');

  const terminalStatuses = ['Rejected', 'Closed'];
  if (terminalStatuses.includes(loan.status)) {
    throw new ApiError(400, `Cannot edit a loan that is ${loan.status}`);
  }

  const updated = await Loan.findByIdAndUpdate(loanId, { $set: body }, { new: true }).populate([
    { path: 'booking', select: 'bookingType status finalAmount' },
    { path: 'client', select: 'name phone email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  return updated;
};

// ─── Update Loan Status ───────────────────────────────────────────────────────

export const updateLoanStatusService = async (
  loanId: string,
  body: {
    status: string;
    sanctionedAmount?: number;
    approvalDate?: Date;
    disbursementDate?: Date;
    emiAmount?: number;
    note?: string;
  },
  changedBy: string
) => {
  const loan = await Loan.findById(loanId);
  if (!loan) throw new ApiError(404, 'Loan not found');

  // Validate transition
  const allowed = VALID_LOAN_TRANSITIONS[loan.status] || [];
  if (!allowed.includes(body.status)) {
    throw new ApiError(
      400,
      `Invalid status transition: ${loan.status} → ${body.status}. Allowed: ${allowed.join(', ') || 'none (terminal status)'}`
    );
  }

  // Require sanctionedAmount when approving
  if (body.status === 'Approved' && !body.sanctionedAmount) {
    throw new ApiError(400, 'Sanctioned amount is required when approving a loan');
  }

  // Require disbursementDate when disbursing
  if (body.status === 'Disbursed' && !body.disbursementDate) {
    throw new ApiError(400, 'Disbursement date is required when marking a loan as Disbursed');
  }

  const updateFields: Record<string, any> = { status: body.status };
  if (body.sanctionedAmount !== undefined) updateFields.sanctionedAmount = body.sanctionedAmount;
  if (body.approvalDate) updateFields.approvalDate = body.approvalDate;
  if (body.disbursementDate) updateFields.disbursementDate = body.disbursementDate;
  if (body.emiAmount !== undefined) updateFields.emiAmount = body.emiAmount;

  const updated = await Loan.findByIdAndUpdate(
    loanId,
    {
      $set: updateFields,
      $push: {
        statusHistory: {
          status: body.status,
          changedAt: new Date(),
          changedBy: new mongoose.Types.ObjectId(changedBy),
          note: body.note,
        },
      },
    },
    { new: true }
  ).populate([
    { path: 'booking', select: 'bookingType status finalAmount' },
    { path: 'client', select: 'name phone email' },
    { path: 'createdBy', select: 'name email' },
    { path: 'statusHistory.changedBy', select: 'name email' },
  ]);

  return updated;
};

// ─── Delete Loan ──────────────────────────────────────────────────────────────

export const deleteLoanService = async (loanId: string) => {
  const loan = await Loan.findById(loanId);
  if (!loan) throw new ApiError(404, 'Loan not found');

  const nonDeletableStatuses = ['Approved', 'Disbursed', 'Closed'];
  if (nonDeletableStatuses.includes(loan.status)) {
    throw new ApiError(400, `Cannot delete a loan with status: ${loan.status}`);
  }

  await Loan.findByIdAndDelete(loanId);
  return { deleted: true };
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getLoanStatsService = async (
  query: { clientId?: string; bookingId?: string },
  UserId: string,
  role: string
) => {
  const match: Record<string, any> = {};

  if (role === 'SALES_EXECUTIVE') {
    const myBookings = await Booking.find({ bookedBy: UserId }).select('_id');
    match.booking = { $in: myBookings.map((b) => b._id) };
  }

  if (query.clientId) match.client = new mongoose.Types.ObjectId(query.clientId);
  if (query.bookingId) match.booking = new mongoose.Types.ObjectId(query.bookingId);

  const [byStatus, totals] = await Promise.all([
    Loan.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalLoanAmount: { $sum: '$loanAmount' },
          totalSanctioned: { $sum: '$sanctionedAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Loan.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalLoanAmount: { $sum: '$loanAmount' },
          totalSanctioned: { $sum: { $ifNull: ['$sanctionedAmount', 0] } },
          totalDisbursed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Disbursed'] }, '$sanctionedAmount', 0],
            },
          },
          avgLoanAmount: { $avg: '$loanAmount' },
        },
      },
    ]),
  ]);

  return {
    totalLoans: totals[0]?.totalLoans || 0,
    totalLoanAmount: totals[0]?.totalLoanAmount || 0,
    totalSanctioned: totals[0]?.totalSanctioned || 0,
    totalDisbursed: totals[0]?.totalDisbursed || 0,
    avgLoanAmount: Math.round(totals[0]?.avgLoanAmount || 0),
    byStatus,
  };
};