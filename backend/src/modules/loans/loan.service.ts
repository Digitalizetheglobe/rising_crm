import { Op, Sequelize } from 'sequelize';
import Loan from './loan.model';
import Booking from '../bookings/booking.model';
import Client from '../clients/client.model';
import User from '../auth/auth.model';
import { VALID_LOAN_TRANSITIONS } from './loan.constants';
import { ApiError } from '../../utils/ApiError';
import { getTenantId } from '../../middleware/tenant.middleware';

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
  const tenantId = getTenantId();

  const booking = await Booking.findOne({ where: { id: body.booking, tenantId } });
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.clientId !== body.client) {
    throw new ApiError(400, 'Client does not match the booking');
  }

  if (booking.status === 'Cancelled') {
    throw new ApiError(400, 'Cannot create a loan for a cancelled booking');
  }

  const existing = await Loan.findOne({ where: { bookingId: body.booking, tenantId } });
  if (existing) {
    throw new ApiError(409, 'A loan application already exists for this booking');
  }

  const client = await Client.findOne({ where: { id: body.client, tenantId } });
  if (!client) throw new ApiError(404, 'Client not found');

  const loan = await Loan.create({
    tenantId,
    bookingId: body.booking,
    clientId: body.client,
    createdBy,
    bankName: body.bankName,
    loanAmount: body.loanAmount,
    applicationDate: body.applicationDate,
    interestRate: body.interestRate,
    tenureMonths: body.tenureMonths,
    bankContact: body.bankContact,
    remarks: body.remarks,
    status: 'Applied',
    statusHistory: [{ status: 'Applied', changedAt: new Date(), changedBy: createdBy }],
  });

  return await Loan.findByPk(loan.id, {
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount', 'bookingDate'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
    ],
  });
};

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
  const tenantId = getTenantId();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const offset = (page - 1) * limit;

  const where: any = { tenantId };

  if (role === 'SALES_EXECUTIVE') {
    const myBookings = await Booking.findAll({ where: { bookedBy: UserId, tenantId }, attributes: ['id'] });
    where.bookingId = { [Op.in]: myBookings.map((b) => b.id) };
  }

  if (query.clientId) where.clientId = query.clientId;
  if (query.bookingId) where.bookingId = query.bookingId;
  if (query.status) where.status = query.status;
  if (query.bankName) where.bankName = { [Op.iLike]: `%${query.bankName}%` };

  const { rows, count } = await Loan.findAndCountAll({
    where,
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount', 'bookingDate'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    loans: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

export const getLoanByIdService = async (loanId: string, UserId: string, role: string) => {
  const tenantId = getTenantId();
  
  const loan = await Loan.findOne({
    where: { id: loanId, tenantId },
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount', 'bookingDate', 'unitId', 'projectId'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email', 'address'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
    ],
  });

  if (!loan) throw new ApiError(404, 'Loan not found');

  if (role === 'SALES_EXECUTIVE') {
    const booking = await Booking.findOne({ where: { id: loan.bookingId, tenantId } });
    if (booking?.bookedBy !== UserId) {
      throw new ApiError(403, 'You are not authorized to view this loan');
    }
  }

  return loan;
};

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
  const tenantId = getTenantId();
  const loan = await Loan.findOne({ where: { id: loanId, tenantId } });
  if (!loan) throw new ApiError(404, 'Loan not found');

  const terminalStatuses = ['Rejected', 'Closed'];
  if (terminalStatuses.includes(loan.status)) {
    throw new ApiError(400, `Cannot edit a loan that is ${loan.status}`);
  }

  await loan.update(body);

  return await Loan.findByPk(loanId, {
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
    ],
  });
};

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
  const tenantId = getTenantId();
  const loan = await Loan.findOne({ where: { id: loanId, tenantId } });
  if (!loan) throw new ApiError(404, 'Loan not found');

  const allowed = VALID_LOAN_TRANSITIONS[loan.status] || [];
  if (!allowed.includes(body.status)) {
    throw new ApiError(
      400,
      `Invalid status transition: ${loan.status} → ${body.status}. Allowed: ${allowed.join(', ') || 'none (terminal status)'}`
    );
  }

  if (body.status === 'Approved' && !body.sanctionedAmount) {
    throw new ApiError(400, 'Sanctioned amount is required when approving a loan');
  }

  if (body.status === 'Disbursed' && !body.disbursementDate) {
    throw new ApiError(400, 'Disbursement date is required when marking a loan as Disbursed');
  }

  const updateFields: any = { status: body.status };
  if (body.sanctionedAmount !== undefined) updateFields.sanctionedAmount = body.sanctionedAmount;
  if (body.approvalDate) updateFields.approvalDate = body.approvalDate;
  if (body.disbursementDate) updateFields.disbursementDate = body.disbursementDate;
  if (body.emiAmount !== undefined) updateFields.emiAmount = body.emiAmount;

  const newHistory = [
    ...loan.statusHistory,
    {
      status: body.status,
      changedAt: new Date(),
      changedBy,
      note: body.note,
    },
  ];
  
  updateFields.statusHistory = newHistory;

  await loan.update(updateFields);

  return await Loan.findByPk(loanId, {
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const deleteLoanService = async (loanId: string) => {
  const tenantId = getTenantId();
  const loan = await Loan.findOne({ where: { id: loanId, tenantId } });
  if (!loan) throw new ApiError(404, 'Loan not found');

  const nonDeletableStatuses = ['Approved', 'Disbursed', 'Closed'];
  if (nonDeletableStatuses.includes(loan.status)) {
    throw new ApiError(400, `Cannot delete a loan with status: ${loan.status}`);
  }

  await loan.destroy();
  return { deleted: true };
};

export const getLoanStatsService = async (
  query: { clientId?: string; bookingId?: string },
  UserId: string,
  role: string
) => {
  const tenantId = getTenantId();
  const where: any = { tenantId };

  if (role === 'SALES_EXECUTIVE') {
    const myBookings = await Booking.findAll({ where: { bookedBy: UserId, tenantId }, attributes: ['id'] });
    where.bookingId = { [Op.in]: myBookings.map((b) => b.id) };
  }

  if (query.clientId) where.clientId = query.clientId;
  if (query.bookingId) where.bookingId = query.bookingId;

  const byStatusRows = await Loan.findAll({
    where,
    attributes: [
      ['status', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('loanAmount')), 'totalLoanAmount'],
      [Sequelize.fn('SUM', Sequelize.col('sanctionedAmount')), 'totalSanctioned']
    ],
    group: ['status'],
    order: [['status', 'ASC']],
  });
  const byStatus = byStatusRows.map(r => r.get({ plain: true }));

  const totalsRow = await Loan.findOne({
    where,
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalLoans'],
      [Sequelize.fn('SUM', Sequelize.col('loanAmount')), 'totalLoanAmount'],
      [Sequelize.literal(`SUM(COALESCE("sanctionedAmount", 0))`), 'totalSanctioned'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'Disbursed' THEN "sanctionedAmount" ELSE 0 END)`), 'totalDisbursed'],
      [Sequelize.fn('AVG', Sequelize.col('loanAmount')), 'avgLoanAmount'],
    ],
    raw: true,
  }) as any;

  return {
    totalLoans: parseInt(totalsRow?.totalLoans || '0', 10),
    totalLoanAmount: parseFloat(totalsRow?.totalLoanAmount || '0'),
    totalSanctioned: parseFloat(totalsRow?.totalSanctioned || '0'),
    totalDisbursed: parseFloat(totalsRow?.totalDisbursed || '0'),
    avgLoanAmount: Math.round(parseFloat(totalsRow?.avgLoanAmount || '0')),
    byStatus,
  };
};