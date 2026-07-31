import { Op, Sequelize } from 'sequelize';
import sequelize from '../../config/sequelize';
import Booking from './booking.model';
import Unit from '../units/unit.model';
import Client from '../clients/client.model';
import Project from '../projects/project.model';
import User from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { BookingType, PaymentMode } from './booking.constants';
import { getTenantId } from '../../middleware/tenant.middleware';

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
  const tenantId = getTenantId();
  const transaction = await sequelize.transaction();

  try {
    const unit = await Unit.findOne({ where: { id: body.unit, tenantId }, transaction });
    if (!unit) throw new ApiError(404, 'Unit not found');

    if (unit.status === 'Sold') {
      throw new ApiError(400, 'This unit has already been sold and cannot be booked');
    }
    if (unit.status === 'Booked') {
      throw new ApiError(400, 'This unit is already booked');
    }

    const client = await Client.findOne({ where: { id: body.client, tenantId }, transaction });
    if (!client) throw new ApiError(404, 'Client not found');

    const discountAmount = body.discountAmount || 0;
    const finalAmount = body.totalAmount - discountAmount;

    if (finalAmount < 0) throw new ApiError(400, 'Discount cannot exceed total amount');
    if (body.bookingAmount > finalAmount) {
      throw new ApiError(400, 'Booking amount cannot exceed final amount');
    }

    const booking = await Booking.create(
      {
        tenantId,
        clientId: body.client,
        unitId: body.unit,
        projectId: unit.projectId,
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
      { transaction }
    );

    await unit.update({ status: 'Booked' }, { transaction });

    await transaction.commit();

    return await Booking.findByPk(booking.id, {
      include: [
        { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
        { model: Unit, as: 'unit', attributes: ['unitNumber', 'type', 'floor', 'area', 'price', 'status'] },
        { model: Project, as: 'project', attributes: ['name', 'location'] },
        { model: User, as: 'bookedByUser', attributes: ['name', 'email'] },
      ],
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

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
  const tenantId = getTenantId();
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const offset = (page - 1) * limit;

  const where: any = { tenantId };

  if (role === 'SALES_EXECUTIVE') {
    where.bookedBy = UserId;
  }

  if (query.clientId) where.clientId = query.clientId;
  if (query.projectId) where.projectId = query.projectId;
  if (query.unitId) where.unitId = query.unitId;
  if (query.status) where.status = query.status;
  if (query.bookingType) where.bookingType = query.bookingType;

  if (query.startDate || query.endDate) {
    where.bookingDate = {};
    if (query.startDate) where.bookingDate[Op.gte] = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      where.bookingDate[Op.lte] = end;
    }
  }

  const { rows, count } = await Booking.findAndCountAll({
    where,
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: Unit, as: 'unit', attributes: ['unitNumber', 'type', 'floor', 'area'] },
      { model: Project, as: 'project', attributes: ['name', 'location'] },
      { model: User, as: 'bookedByUser', attributes: ['name', 'email'] },
    ],
    order: [['bookingDate', 'DESC']],
    limit,
    offset,
  });

  return {
    bookings: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

export const getBookingByIdService = async (bookingId: string, UserId: string, role: string) => {
  const tenantId = getTenantId();
  const booking = await Booking.findOne({
    where: { id: bookingId, tenantId },
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email', 'address', 'aadhaar', 'PAN'] },
      { model: Unit, as: 'unit', attributes: ['unitNumber', 'type', 'floor', 'area', 'price', 'facing', 'status'] },
      { model: Project, as: 'project', attributes: ['name', 'location', 'description'] },
      { model: User, as: 'bookedByUser', attributes: ['name', 'email'] },
    ],
  });

  if (!booking) throw new ApiError(404, 'Booking not found');

  if (role === 'SALES_EXECUTIVE' && booking.bookedBy !== UserId) {
    throw new ApiError(403, 'You are not authorized to view this booking');
  }

  return booking;
};

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
  const tenantId = getTenantId();
  const booking = await Booking.findOne({ where: { id: bookingId, tenantId } });
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.status === 'Cancelled') {
    throw new ApiError(400, 'Cannot update a cancelled booking');
  }
  if (booking.status === 'Completed') {
    throw new ApiError(400, 'Cannot update a completed booking');
  }

  if (role === 'SALES_EXECUTIVE' && booking.bookedBy !== UserId) {
    throw new ApiError(403, 'You can only edit bookings you created');
  }

  const totalAmount = body.totalAmount ?? booking.totalAmount;
  const discountAmount = body.discountAmount ?? booking.discountAmount;
  const finalAmount = totalAmount - discountAmount;

  if (finalAmount < 0) throw new ApiError(400, 'Discount cannot exceed total amount');

  await booking.update({ ...body, finalAmount });

  return await Booking.findByPk(bookingId, {
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: Unit, as: 'unit', attributes: ['unitNumber', 'type', 'floor', 'area'] },
      { model: Project, as: 'project', attributes: ['name', 'location'] },
      { model: User, as: 'bookedByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const cancelBookingService = async (
  bookingId: string,
  cancellationReason: string,
  UserId: string,
  role: string
) => {
  const tenantId = getTenantId();
  const transaction = await sequelize.transaction();

  try {
    const booking = await Booking.findOne({ where: { id: bookingId, tenantId }, transaction });
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

    await booking.update(
      {
        status: 'Cancelled',
        cancelledAt: new Date(),
        cancellationReason,
      },
      { transaction }
    );

    const unit = await Unit.findOne({ where: { id: booking.unitId, tenantId }, transaction });
    if (unit) {
      await unit.update({ status: 'Available' }, { transaction });
    }

    await transaction.commit();

    return { cancelled: true, bookingId, unitReverted: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const completeBookingService = async (
  bookingId: string,
  UserId: string,
  role: string
) => {
  const tenantId = getTenantId();
  const transaction = await sequelize.transaction();

  try {
    const booking = await Booking.findOne({ where: { id: bookingId, tenantId }, transaction });
    if (!booking) throw new ApiError(404, 'Booking not found');

    if (booking.status !== 'Active') {
      throw new ApiError(400, `Only Active bookings can be completed. Current status: ${booking.status}`);
    }

    await booking.update({ status: 'Completed' }, { transaction });

    const unit = await Unit.findOne({ where: { id: booking.unitId, tenantId }, transaction });
    if (unit) {
      await unit.update({ status: 'Sold' }, { transaction });
    }

    await transaction.commit();

    return { completed: true, bookingId, unitMarkedSold: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getBookingStatsService = async (
  query: { projectId?: string; startDate?: string; endDate?: string },
  UserId: string,
  role: string
) => {
  const tenantId = getTenantId();
  const where: any = { tenantId };

  if (role === 'SALES_EXECUTIVE') {
    where.bookedBy = UserId;
  }
  if (query.projectId) where.projectId = query.projectId;
  
  if (query.startDate || query.endDate) {
    where.bookingDate = {};
    if (query.startDate) where.bookingDate[Op.gte] = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      where.bookingDate[Op.lte] = end;
    }
  }

  const byStatusRows = await Booking.findAll({
    where,
    attributes: [
      ['status', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['status'],
  });
  const byStatus = byStatusRows.map(r => r.get({ plain: true }));

  const byTypeRows = await Booking.findAll({
    where,
    attributes: [
      ['bookingType', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['bookingType'],
  });
  const byType = byTypeRows.map(r => r.get({ plain: true }));

  const totalsRow = await Booking.findOne({
    where,
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalBookings'],
      [Sequelize.fn('SUM', Sequelize.col('finalAmount')), 'totalRevenue'],
      [Sequelize.fn('SUM', Sequelize.col('discountAmount')), 'totalDiscount'],
      [Sequelize.fn('AVG', Sequelize.col('finalAmount')), 'avgDealSize'],
    ],
    raw: true,
  }) as any;

  return {
    totalBookings: parseInt(totalsRow?.totalBookings || '0', 10),
    totalRevenue: parseFloat(totalsRow?.totalRevenue || '0'),
    totalDiscount: parseFloat(totalsRow?.totalDiscount || '0'),
    avgDealSize: Math.round(parseFloat(totalsRow?.avgDealSize || '0')),
    byStatus,
    byType,
  };
};