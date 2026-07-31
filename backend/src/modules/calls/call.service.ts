import { Op, Sequelize } from 'sequelize';
import Call from './call.model';
import Client from '../clients/client.model';
import User from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { getTenantId } from '../../middleware/tenant.middleware';

const buildFilterQuery = (query: Record<string, any>, tenantId: string) => {
  const filter: any = { tenantId };

  if (query.client) filter.clientId = query.client;
  if (query.loggedBy) filter.loggedBy = query.loggedBy;
  if (query.outcome) filter.outcome = query.outcome;
  if (query.direction) filter.direction = query.direction;
  if (query.purpose) filter.purpose = query.purpose;

  if (query.startDate || query.endDate) {
    filter.callDate = {};
    if (query.startDate) filter.callDate[Op.gte] = new Date(query.startDate);
    if (query.endDate) filter.callDate[Op.lte] = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
  }

  if (query.nextCallToday === 'true') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(); tomorrow.setHours(23, 59, 59, 999);
    filter.nextCallDate = { [Op.gte]: today, [Op.lte]: tomorrow };
  }

  return filter;
};

export const createCallService = async (
  payload: Record<string, any>,
  loggedBy: string
) => {
  const tenantId = getTenantId();

  const client = await Client.findOne({ where: { id: payload.client, tenantId } });
  if (!client) throw new ApiError(404, 'Client not found');

  const call = await Call.create({
    ...payload,
    tenantId,
    clientId: payload.client,
    loggedBy,
  });

  return await Call.findByPk(call.id, {
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const getAllCallsService = async (
  query: Record<string, any>,
  page: number = 1,
  limit: number = 10
) => {
  const tenantId = getTenantId();
  const where = buildFilterQuery(query, tenantId);
  const offset = (page - 1) * limit;

  const { rows, count } = await Call.findAndCountAll({
    where,
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
    ],
    order: [['callDate', 'DESC']],
    limit,
    offset,
  });

  return {
    calls: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    hasNextPage: page < Math.ceil(count / limit),
    hasPrevPage: page > 1,
  };
};

export const getCallByIdService = async (callId: string) => {
  const tenantId = getTenantId();
  const call = await Call.findOne({
    where: { id: callId, tenantId },
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email', 'status'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
    ],
  });

  if (!call) throw new ApiError(404, 'Call not found');
  return call;
};

export const updateCallService = async (
  callId: string,
  payload: Record<string, any>,
  updatedBy: string
) => {
  const tenantId = getTenantId();
  const call = await Call.findOne({ where: { id: callId, tenantId } });
  if (!call) throw new ApiError(404, 'Call not found');

  if (call.loggedBy !== updatedBy) {
    throw new ApiError(403, 'You are not authorised to edit this call log');
  }

  delete payload.client;
  delete payload.loggedBy;
  delete payload.clientId;

  await call.update(payload);

  return await Call.findByPk(callId, {
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const deleteCallService = async (callId: string) => {
  const tenantId = getTenantId();
  const call = await Call.findOne({ where: { id: callId, tenantId } });
  if (!call) throw new ApiError(404, 'Call not found');

  await call.destroy();
  return { message: 'Call log deleted successfully' };
};

export const getCallsByClientService = async (
  clientId: string,
  page: number = 1,
  limit: number = 10
) => {
  const tenantId = getTenantId();
  
  const client = await Client.findOne({ where: { id: clientId, tenantId } });
  if (!client) throw new ApiError(404, 'Client not found');

  const offset = (page - 1) * limit;

  const { rows, count } = await Call.findAndCountAll({
    where: { clientId, tenantId },
    include: [
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
    ],
    order: [['callDate', 'DESC']],
    limit,
    offset,
  });

  return {
    calls: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    hasNextPage: page < Math.ceil(count / limit),
    hasPrevPage: page > 1,
  };
};

export const getCallStatsService = async (filters: Record<string, any> = {}) => {
  const tenantId = getTenantId();
  const where: any = { tenantId };

  if (filters.loggedBy) where.loggedBy = filters.loggedBy;
  if (filters.client) where.clientId = filters.client;
  if (filters.startDate || filters.endDate) {
    where.callDate = {};
    if (filters.startDate) where.callDate[Op.gte] = new Date(filters.startDate);
    if (filters.endDate) where.callDate[Op.lte] = new Date(filters.endDate);
  }

  const byOutcomeRows = await Call.findAll({
    where,
    attributes: [
      ['outcome', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['outcome'],
    order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
  });
  const byOutcome = byOutcomeRows.map(r => r.get({ plain: true }));

  const byPurposeRows = await Call.findAll({
    where,
    attributes: [
      ['purpose', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['purpose'],
    order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
  });
  const byPurpose = byPurposeRows.map(r => r.get({ plain: true }));

  const byDirectionRows = await Call.findAll({
    where,
    attributes: [
      ['direction', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['direction'],
  });
  const byDirection = byDirectionRows.map(r => r.get({ plain: true }));

  const totalsRow = await Call.findOne({
    where,
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      [Sequelize.fn('SUM', Sequelize.col('duration')), 'totalDuration'],
      [Sequelize.literal(`SUM(CASE WHEN outcome = 'ANSWERED' THEN 1 ELSE 0 END)`), 'answered'],
      [Sequelize.literal(`SUM(CASE WHEN "nextCallDate" IS NOT NULL THEN 1 ELSE 0 END)`), 'withNextCall'],
    ],
    raw: true,
  }) as any;

  const total = parseInt(totalsRow?.total || '0', 10);
  const answered = parseInt(totalsRow?.answered || '0', 10);
  const withNextCall = parseInt(totalsRow?.withNextCall || '0', 10);
  const totalDuration = parseFloat(totalsRow?.totalDuration || '0');

  return {
    summary: {
      total,
      answered,
      withNextCall,
      totalDurationSeconds: totalDuration,
      answerRate: total > 0 ? ((answered / total) * 100).toFixed(1) + '%' : '0%',
    },
    byOutcome,
    byPurpose,
    byDirection,
  };
};