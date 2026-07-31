import { Op, Sequelize } from 'sequelize';
import Feedback from './feedback.model';
import Client from '../clients/client.model';
import User from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { getTenantId } from '../../middleware/tenant.middleware';

const buildFilterQuery = (query: Record<string, any>, tenantId: string) => {
  const filter: any = { tenantId };

  if (query.client) filter.clientId = query.client;
  if (query.loggedBy) filter.loggedBy = query.loggedBy;
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.rating) filter.rating = Number(query.rating);

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt[Op.gte] = new Date(query.startDate);
    if (query.endDate) filter.createdAt[Op.lte] = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
  }

  return filter;
};

export const createFeedbackService = async (
  payload: Record<string, any>,
  loggedBy: string
) => {
  const tenantId = getTenantId();
  
  const client = await Client.findOne({ where: { id: payload.client, tenantId } });
  if (!client) throw new ApiError(404, 'Client not found');

  const feedback = await Feedback.create({
    ...payload,
    tenantId,
    clientId: payload.client,
    loggedBy,
    status: 'OPEN',
  });

  return await Feedback.findByPk(feedback.id, {
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const getAllFeedbacksService = async (
  query: Record<string, any>,
  page: number = 1,
  limit: number = 10
) => {
  const tenantId = getTenantId();
  const where = buildFilterQuery(query, tenantId);
  const offset = (page - 1) * limit;

  const { rows, count } = await Feedback.findAndCountAll({
    where,
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['name', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    feedbacks: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    hasNextPage: page < Math.ceil(count / limit),
    hasPrevPage: page > 1,
  };
};

export const getFeedbackByIdService = async (feedbackId: string) => {
  const tenantId = getTenantId();
  const feedback = await Feedback.findOne({
    where: { id: feedbackId, tenantId },
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email', 'status'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['name', 'email'] },
    ],
  });

  if (!feedback) throw new ApiError(404, 'Feedback not found');
  return feedback;
};

export const updateFeedbackService = async (
  feedbackId: string,
  payload: Record<string, any>,
  updatedBy: string
) => {
  const tenantId = getTenantId();
  const feedback = await Feedback.findOne({ where: { id: feedbackId, tenantId } });
  if (!feedback) throw new ApiError(404, 'Feedback not found');

  if (feedback.status === 'RESOLVED') {
    throw new ApiError(400, 'Cannot edit a resolved feedback');
  }

  delete payload.client;
  delete payload.loggedBy;
  delete payload.clientId;
  delete payload.resolvedBy;
  delete payload.resolvedAt;

  await feedback.update(payload);

  return await Feedback.findByPk(feedbackId, {
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const resolveFeedbackService = async (
  feedbackId: string,
  resolvedNote: string,
  resolvedBy: string
) => {
  const tenantId = getTenantId();
  const feedback = await Feedback.findOne({ where: { id: feedbackId, tenantId } });
  if (!feedback) throw new ApiError(404, 'Feedback not found');

  if (feedback.status === 'RESOLVED') {
    throw new ApiError(400, 'Feedback is already resolved');
  }

  await feedback.update({
    status: 'RESOLVED',
    resolvedBy,
    resolvedAt: new Date(),
    resolvedNote,
  });

  return await Feedback.findByPk(feedbackId, {
    include: [
      { model: Client, as: 'client', attributes: ['name', 'phone', 'email'] },
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['name', 'email'] },
    ],
  });
};

export const deleteFeedbackService = async (feedbackId: string) => {
  const tenantId = getTenantId();
  const feedback = await Feedback.findOne({ where: { id: feedbackId, tenantId } });
  if (!feedback) throw new ApiError(404, 'Feedback not found');

  await feedback.destroy();
  return { message: 'Feedback deleted successfully' };
};

export const getFeedbacksByClientService = async (
  clientId: string,
  page: number = 1,
  limit: number = 10
) => {
  const tenantId = getTenantId();
  const client = await Client.findOne({ where: { id: clientId, tenantId } });
  if (!client) throw new ApiError(404, 'Client not found');

  const offset = (page - 1) * limit;

  const { rows, count } = await Feedback.findAndCountAll({
    where: { clientId, tenantId },
    include: [
      { model: User, as: 'loggedByUser', attributes: ['name', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['name', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    feedbacks: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    hasNextPage: page < Math.ceil(count / limit),
    hasPrevPage: page > 1,
  };
};

export const getFeedbackStatsService = async (filters: Record<string, any> = {}) => {
  const tenantId = getTenantId();
  const match: any = { tenantId };

  if (filters.loggedBy) match.loggedBy = filters.loggedBy;
  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) match.createdAt[Op.gte] = new Date(filters.startDate);
    if (filters.endDate) match.createdAt[Op.lte] = new Date(filters.endDate);
  }

  const byCategoryRows = await Feedback.findAll({
    where: match,
    attributes: [
      ['category', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating']
    ],
    group: ['category'],
    order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
  });
  const byCategory = byCategoryRows.map(r => r.get({ plain: true }));

  const byRatingRows = await Feedback.findAll({
    where: match,
    attributes: [
      ['rating', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['rating'],
    order: [['rating', 'ASC']],
  });
  const byRating = byRatingRows.map(r => r.get({ plain: true }));

  const byStatusRows = await Feedback.findAll({
    where: match,
    attributes: [
      ['status', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['status'],
  });
  const byStatus = byStatusRows.map(r => r.get({ plain: true }));

  const totalsRow = await Feedback.findOne({
    where: match,
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END)`), 'open'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END)`), 'resolved'],
    ],
    raw: true,
  }) as any;

  return {
    summary: {
      total: parseInt(totalsRow?.total || '0', 10),
      open: parseInt(totalsRow?.open || '0', 10),
      resolved: parseInt(totalsRow?.resolved || '0', 10),
      avgRating: totalsRow?.avgRating ? Number(parseFloat(totalsRow.avgRating).toFixed(2)) : 0,
    },
    byCategory,
    byRating,
    byStatus,
  };
};