import { Op, Sequelize } from 'sequelize';
import Payment from './payment.model';
import Booking from '../bookings/booking.model';
import Client from '../clients/client.model';
import User from '../auth/auth.model';
import Project from '../projects/project.model';
import Unit from '../units/unit.model';
import { ApiError } from '../../utils/ApiError';
import { PaymentType, PaymentStatus, PaymentMode } from './payment.constants';
import { getTenantId } from '../../middleware/tenant.middleware';

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
  const tenantId = getTenantId();

  const booking = await Booking.findOne({ where: { id: body.booking, tenantId } });
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.clientId !== body.client) {
    throw new ApiError(400, 'Client does not match the booking');
  }

  if (booking.status === 'Cancelled') {
    throw new ApiError(400, 'Cannot add payments to a cancelled booking');
  }

  const client = await Client.findOne({ where: { id: body.client, tenantId } });
  if (!client) throw new ApiError(404, 'Client not found');

  const payment = await Payment.create({
    tenantId,
    bookingId: body.booking,
    clientId: body.client,
    paymentType: body.paymentType as PaymentType,
    amount: body.amount,
    dueDate: body.dueDate,
    notes: body.notes,
    recordedBy,
    status: 'Pending',
  });

  return await Payment.findByPk(payment.id, {
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount', 'bookingDate'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'recordedByUser', attributes: ['name', 'email'] },
    ],
  });
};

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
  const tenantId = getTenantId();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const offset = (page - 1) * limit;

  const where: any = { tenantId };

  if (role === 'SALES_EXECUTIVE') {
    const myBookings = await Booking.findAll({ where: { bookedBy: UserId, tenantId }, attributes: ['id'] });
    where.bookingId = { [Op.in]: myBookings.map((b) => b.id) };
  }

  if (query.bookingId) where.bookingId = query.bookingId;
  if (query.clientId) where.clientId = query.clientId;
  if (query.status) where.status = query.status;
  if (query.paymentType) where.paymentType = query.paymentType;

  if (query.overdue === 'true') {
    where.status = 'Pending';
    where.dueDate = { [Op.lt]: new Date() };
  }

  if (query.startDate || query.endDate) {
    where.dueDate = where.dueDate || {};
    if (query.startDate) where.dueDate[Op.gte] = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      where.dueDate[Op.lte] = end;
    }
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'recordedByUser', attributes: ['name', 'email'] },
    ],
    order: [['dueDate', 'ASC']],
    limit,
    offset,
  });

  return {
    payments: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

export const getPaymentByIdService = async (paymentId: string, UserId: string, role: string) => {
  const tenantId = getTenantId();
  const payment = await Payment.findOne({
    where: { id: paymentId, tenantId },
    include: [
      { 
        model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount', 'bookingDate'],
        include: [
          { model: Unit, as: 'unit' },
          { model: Project, as: 'project' }
        ]
      },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email', 'address'] },
      { model: User, as: 'recordedByUser', attributes: ['name', 'email'] },
    ],
  });

  if (!payment) throw new ApiError(404, 'Payment not found');

  if (role === 'SALES_EXECUTIVE') {
    const booking = await Booking.findOne({ where: { id: payment.bookingId, tenantId } });
    if (booking?.bookedBy !== UserId) {
      throw new ApiError(403, 'You are not authorized to view this payment');
    }
  }

  return payment;
};

export const updatePaymentService = async (
  paymentId: string,
  body: {
    paymentType?: string;
    amount?: number;
    dueDate?: Date;
    notes?: string;
  }
) => {
  const tenantId = getTenantId();
  const payment = await Payment.findOne({ where: { id: paymentId, tenantId } });
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'Paid') {
    throw new ApiError(400, 'Cannot edit a payment that has already been paid');
  }
  if (payment.status === 'Waived') {
    throw new ApiError(400, 'Cannot edit a waived payment');
  }

  await payment.update(body);

  return await Payment.findByPk(paymentId, {
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'recordedByUser', attributes: ['name', 'email'] },
    ],
  });
};

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
  const tenantId = getTenantId();
  const payment = await Payment.findOne({ where: { id: paymentId, tenantId } });
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'Paid') {
    throw new ApiError(400, 'Payment has already been marked as paid');
  }
  if (payment.status === 'Waived') {
    throw new ApiError(400, 'Cannot mark a waived payment as paid');
  }

  if (body.receiptNumber) {
    const duplicate = await Payment.findOne({
      where: {
        receiptNumber: body.receiptNumber,
        tenantId,
        id: { [Op.ne]: paymentId },
      },
    });
    if (duplicate) {
      throw new ApiError(409, `Receipt number "${body.receiptNumber}" is already used on another payment`);
    }
  }

  await payment.update({ ...body, status: 'Paid' });

  return await Payment.findByPk(paymentId, {
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'recordedByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const waivePaymentService = async (paymentId: string, notes: string) => {
  const tenantId = getTenantId();
  const payment = await Payment.findOne({ where: { id: paymentId, tenantId } });
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'Paid') {
    throw new ApiError(400, 'Cannot waive a payment that has already been paid');
  }
  if (payment.status === 'Waived') {
    throw new ApiError(400, 'Payment is already waived');
  }

  await payment.update({ status: 'Waived', notes });

  return await Payment.findByPk(paymentId, {
    include: [
      { model: Booking, as: 'booking', attributes: ['bookingType', 'status', 'finalAmount'] },
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'recordedByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const deletePaymentService = async (paymentId: string) => {
  const tenantId = getTenantId();
  const payment = await Payment.findOne({ where: { id: paymentId, tenantId } });
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'Paid') {
    throw new ApiError(400, 'Cannot delete a paid payment. Waive it instead.');
  }

  await payment.destroy();
  return { deleted: true };
};

export const getPaymentStatsService = async (
  query: { bookingId?: string; clientId?: string; startDate?: string; endDate?: string },
  UserId: string,
  role: string
) => {
  const tenantId = getTenantId();
  const where: any = { tenantId };

  if (role === 'SALES_EXECUTIVE') {
    const myBookings = await Booking.findAll({ where: { bookedBy: UserId, tenantId }, attributes: ['id'] });
    where.bookingId = { [Op.in]: myBookings.map((b) => b.id) };
  }

  if (query.bookingId) where.bookingId = query.bookingId;
  if (query.clientId) where.clientId = query.clientId;

  if (query.startDate || query.endDate) {
    where.dueDate = {};
    if (query.startDate) where.dueDate[Op.gte] = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      where.dueDate[Op.lte] = end;
    }
  }

  const now = new Date();

  const byStatusRows = await Payment.findAll({
    where,
    attributes: [
      ['status', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
    ],
    group: ['status'],
    order: [['status', 'ASC']],
  });
  const byStatus = byStatusRows.map(r => r.get({ plain: true }));

  const totalsRow = await Payment.findOne({
    where,
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalPayments'],
      [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalDue'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END)`), 'totalCollected'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END)`), 'totalPending'],
    ],
    raw: true,
  }) as any;

  const overdueCount = await Payment.count({
    where: {
      ...where,
      status: 'Pending',
      dueDate: { [Op.lt]: now },
    },
  });

  return {
    totalPayments: parseInt(totalsRow?.totalPayments || '0', 10),
    totalDue: parseFloat(totalsRow?.totalDue || '0'),
    totalCollected: parseFloat(totalsRow?.totalCollected || '0'),
    totalPending: parseFloat(totalsRow?.totalPending || '0'),
    overdueCount,
    byStatus,
  };
};

export const markOverduePaymentsService = async () => {
  const [affectedCount] = await Payment.update(
    { status: 'Overdue' },
    {
      where: {
        status: 'Pending',
        dueDate: { [Op.lt]: new Date() },
      },
    }
  );

  return { markedOverdue: affectedCount };
};