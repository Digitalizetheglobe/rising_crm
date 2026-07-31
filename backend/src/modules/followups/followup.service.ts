import { Op, Sequelize } from 'sequelize';
import sequelize from '../../config/sequelize';
import FollowUp from './followup.model';
import Lead from '../leads/lead.model';
import User from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { getTenantId } from '../../middleware/tenant.middleware';

const buildFilter = (query: Record<string, any>, tenantId: string) => {
  const filter: any = { tenantId };

  if (query.lead) filter.leadId = query.lead;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  if (query.startDate || query.endDate) {
    filter.scheduledAt = {};
    if (query.startDate) filter.scheduledAt[Op.gte] = new Date(query.startDate);
    if (query.endDate) filter.scheduledAt[Op.lte] = new Date(new Date(query.endDate).setHours(23, 59, 59));
  }

  if (query.today === 'true') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    filter.scheduledAt = { [Op.gte]: start, [Op.lte]: end };
  }

  if (query.overdue === 'true') {
    filter.scheduledAt = { [Op.lt]: new Date() };
    filter.status = { [Op.in]: ['SCHEDULED', 'PENDING'] };
  }

  return filter;
};

export const createFollowUpService = async (
  data: {
    lead: string;
    assignedTo: string;
    type: string;
    scheduledAt: Date;
    notes?: string;
  },
  createdBy: string
) => {
  const tenantId = getTenantId();
  const transaction = await sequelize.transaction();

  try {
    const lead = await Lead.findOne({ where: { id: data.lead, tenantId }, transaction });
    if (!lead) throw new ApiError(404, 'Lead not found');

    const followUp = await FollowUp.create(
      {
        tenantId,
        leadId: data.lead,
        assignedTo: data.assignedTo,
        createdBy,
        type: data.type as any,
        scheduledAt: data.scheduledAt,
        notes: data.notes,
        status: 'SCHEDULED',
        reminderSent: false,
      },
      { transaction }
    );

    const newActivity = {
      action: 'FOLLOWUP_SCHEDULED',
      description: `${data.type} follow-up scheduled for ${new Date(data.scheduledAt).toLocaleString('en-IN')}`,
      performedBy: createdBy,
      performedAt: new Date(),
    };

    await lead.update(
      {
        nextFollowUpDate: data.scheduledAt,
        activityLog: [...lead.activityLog, newActivity],
      },
      { transaction }
    );

    // TODO: Notification creation - adapt Notification module later

    await transaction.commit();

    return await FollowUp.findByPk(followUp.id, {
      include: [
        { model: Lead, as: 'lead', attributes: ['name', 'phone', 'status'] },
        { model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] },
        { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
      ],
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getAllFollowUpsService = async (
  query: Record<string, any>,
  page: number = 1,
  limit: number = 10
) => {
  const tenantId = getTenantId();
  const where = buildFilter(query, tenantId);
  const offset = (page - 1) * limit;

  const { rows, count } = await FollowUp.findAndCountAll({
    where,
    include: [
      { model: Lead, as: 'lead', attributes: ['name', 'phone', 'status', 'priority'] },
      { model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
    ],
    order: [['scheduledAt', 'ASC']],
    limit,
    offset,
  });

  return {
    followUps: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    hasNextPage: page < Math.ceil(count / limit),
    hasPrevPage: page > 1,
  };
};

export const getFollowUpByIdService = async (followUpId: string) => {
  const tenantId = getTenantId();
  const followUp = await FollowUp.findOne({
    where: { id: followUpId, tenantId },
    include: [
      { model: Lead, as: 'lead', attributes: ['name', 'phone', 'email', 'status', 'priority', 'assignedTo'] },
      { model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
      { model: FollowUp, as: 'previousFollowUp', attributes: ['scheduledAt', 'type', 'status'] },
    ],
  });

  if (!followUp) throw new ApiError(404, 'Follow-up not found');
  return followUp;
};

export const updateFollowUpService = async (
  followUpId: string,
  data: Record<string, any>
) => {
  const tenantId = getTenantId();
  const followUp = await FollowUp.findOne({ where: { id: followUpId, tenantId } });
  if (!followUp) throw new ApiError(404, 'Follow-up not found');

  if (['COMPLETED', 'CANCELLED'].includes(followUp.status)) {
    throw new ApiError(400, `Cannot edit a ${followUp.status} follow-up`);
  }

  await followUp.update(data);

  return await FollowUp.findByPk(followUpId, {
    include: [{ model: User, as: 'assignedUser', attributes: ['name', 'email'] }],
  });
};

export const completeFollowUpService = async (
  followUpId: string,
  outcome: string,
  notes: string = '',
  completedBy: string,
  nextFollowUp?: {
    type: string;
    scheduledAt: Date;
    notes?: string;
  }
) => {
  const tenantId = getTenantId();
  const transaction = await sequelize.transaction();

  try {
    const followUp = await FollowUp.findOne({ where: { id: followUpId, tenantId }, transaction });
    if (!followUp) throw new ApiError(404, 'Follow-up not found');

    if (followUp.status === 'COMPLETED') {
      throw new ApiError(400, 'Follow-up is already completed');
    }
    if (followUp.status === 'CANCELLED') {
      throw new ApiError(400, 'Cannot complete a cancelled follow-up');
    }

    await followUp.update(
      {
        status: 'COMPLETED',
        completedAt: new Date(),
        outcome,
        ...(notes ? { notes } : {}),
      },
      { transaction }
    );

    const lead = await Lead.findOne({ where: { id: followUp.leadId, tenantId }, transaction });
    if (lead) {
      const newActivity = {
        action: 'FOLLOWUP_COMPLETED',
        description: `${followUp.type} follow-up completed. Outcome: ${outcome}`,
        performedBy: completedBy,
        performedAt: new Date(),
        metadata: { followUpId: followUp.id, outcome },
      };

      const updateData: any = {
        lastContactedAt: new Date(),
        activityLog: [...lead.activityLog, newActivity],
      };

      if (!nextFollowUp) {
        updateData.nextFollowUpDate = null;
      }

      await lead.update(updateData, { transaction });
    }

    let newFollowUpObj = null;

    if (nextFollowUp) {
      const created = await FollowUp.create(
        {
          tenantId,
          leadId: followUp.leadId,
          assignedTo: followUp.assignedTo,
          createdBy: completedBy,
          type: nextFollowUp.type as any,
          scheduledAt: nextFollowUp.scheduledAt,
          notes: nextFollowUp.notes,
          status: 'SCHEDULED',
          reminderSent: false,
        },
        { transaction }
      );
      newFollowUpObj = created;

      if (lead) {
        await lead.update(
          { nextFollowUpDate: nextFollowUp.scheduledAt },
          { transaction }
        );
      }
    }

    await transaction.commit();

    return {
      completedFollowUp: followUp,
      nextFollowUp: newFollowUpObj,
      message: nextFollowUp
        ? `Follow-up completed and next ${nextFollowUp.type} scheduled for ${new Date(nextFollowUp.scheduledAt).toLocaleString('en-IN')}`
        : 'Follow-up completed successfully',
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const rescheduleFollowUpService = async (
  followUpId: string,
  newScheduledAt: Date,
  rescheduleReason: string,
  rescheduledBy: string,
  notes?: string
) => {
  const tenantId = getTenantId();
  const transaction = await sequelize.transaction();

  try {
    const original = await FollowUp.findOne({ where: { id: followUpId, tenantId }, transaction });
    if (!original) throw new ApiError(404, 'Follow-up not found');

    if (['COMPLETED', 'CANCELLED'].includes(original.status)) {
      throw new ApiError(400, `Cannot reschedule a ${original.status} follow-up`);
    }

    await original.update(
      {
        status: 'RESCHEDULED',
        rescheduledAt: new Date(),
        rescheduleReason,
      },
      { transaction }
    );

    const newFollowUp = await FollowUp.create(
      {
        tenantId,
        leadId: original.leadId,
        assignedTo: original.assignedTo,
        createdBy: rescheduledBy,
        type: original.type,
        scheduledAt: newScheduledAt,
        notes: notes || original.notes,
        status: 'SCHEDULED',
        rescheduledFrom: original.id,
        reminderSent: false,
      },
      { transaction }
    );

    const lead = await Lead.findOne({ where: { id: original.leadId, tenantId }, transaction });
    if (lead) {
      const newActivity = {
        action: 'FOLLOWUP_RESCHEDULED',
        description: `${original.type} follow-up rescheduled to ${new Date(newScheduledAt).toLocaleString('en-IN')}. Reason: ${rescheduleReason}`,
        performedBy: rescheduledBy,
        performedAt: new Date(),
      };

      await lead.update(
        {
          nextFollowUpDate: newScheduledAt,
          activityLog: [...lead.activityLog, newActivity],
        },
        { transaction }
      );
    }

    await transaction.commit();

    return {
      rescheduledFollowUp: original,
      newFollowUp,
      message: `Follow-up rescheduled to ${new Date(newScheduledAt).toLocaleString('en-IN')}`,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const cancelFollowUpService = async (
  followUpId: string,
  cancelledBy: string,
  reason?: string
) => {
  const tenantId = getTenantId();
  const followUp = await FollowUp.findOne({ where: { id: followUpId, tenantId } });
  if (!followUp) throw new ApiError(404, 'Follow-up not found');

  if (followUp.status === 'COMPLETED') {
    throw new ApiError(400, 'Cannot cancel a completed follow-up');
  }
  if (followUp.status === 'CANCELLED') {
    throw new ApiError(400, 'Follow-up is already cancelled');
  }

  await followUp.update({
    status: 'CANCELLED',
    ...(reason ? { notes: reason } : {}),
  });

  const lead = await Lead.findOne({ where: { id: followUp.leadId, tenantId } });
  if (lead) {
    const newActivity = {
      action: 'FOLLOWUP_CANCELLED',
      description: `${followUp.type} follow-up cancelled${reason ? `. Reason: ${reason}` : ''}`,
      performedBy: cancelledBy,
      performedAt: new Date(),
    };

    await lead.update({ activityLog: [...lead.activityLog, newActivity] });
  }

  return { message: 'Follow-up cancelled successfully' };
};

export const getFollowUpStatsService = async (filters: Record<string, any> = {}) => {
  const tenantId = getTenantId();
  const match: any = { tenantId };

  if (filters.assignedTo) match.assignedTo = filters.assignedTo;
  if (filters.startDate || filters.endDate) {
    match.scheduledAt = {};
    if (filters.startDate) match.scheduledAt[Op.gte] = new Date(filters.startDate);
    if (filters.endDate) match.scheduledAt[Op.lte] = new Date(filters.endDate);
  }

  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const byStatusRows = await FollowUp.findAll({
    where: match,
    attributes: [
      ['status', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['status'],
  });
  const byStatus = byStatusRows.map(r => r.get({ plain: true }));

  const byTypeRows = await FollowUp.findAll({
    where: match,
    attributes: [
      ['type', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['type'],
  });
  const byType = byTypeRows.map(r => r.get({ plain: true }));

  const totalsRow = await FollowUp.findOne({
    where: match,
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)`), 'completed'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'MISSED' THEN 1 ELSE 0 END)`), 'missed'],
    ],
    raw: true,
  }) as any;

  const total = parseInt(totalsRow?.total || '0', 10);
  const completed = parseInt(totalsRow?.completed || '0', 10);
  const missed = parseInt(totalsRow?.missed || '0', 10);

  const todayCount = await FollowUp.count({
    where: {
      ...match,
      scheduledAt: { [Op.gte]: today, [Op.lte]: todayEnd },
      status: { [Op.in]: ['SCHEDULED', 'PENDING'] },
    },
  });

  const overdueCount = await FollowUp.count({
    where: {
      ...match,
      scheduledAt: { [Op.lt]: now },
      status: { [Op.in]: ['SCHEDULED', 'PENDING'] },
    },
  });

  return {
    summary: {
      total,
      completed,
      missed,
      todayDue: todayCount,
      overdue: overdueCount,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) + '%' : '0%',
    },
    byStatus,
    byType,
  };
};