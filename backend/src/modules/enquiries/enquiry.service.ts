import { Op, Sequelize } from 'sequelize';
import sequelize from '../../config/sequelize';
import Enquiry, { EnquirySource, BudgetRange, PropertyType } from './enquiry.model';
import Project from '../projects/project.model';
import User from '../auth/auth.model';
import Lead from '../leads/lead.model';
import { ApiError } from '../../utils/ApiError';
import { LeadPriority } from '../leads/lead.constants';
import { getTenantId } from '../../middleware/tenant.middleware';

const buildFilterQuery = (query: Record<string, any>, tenantId: string) => {
  const filter: any = { tenantId };

  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.isConverted !== undefined) filter.isConverted = query.isConverted === 'true';

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt[Op.gte] = new Date(query.startDate);
    if (query.endDate) filter.createdAt[Op.lte] = new Date(new Date(query.endDate).setHours(23, 59, 59));
  }

  if (query.search) {
    filter[Op.or] = [
      { name: { [Op.iLike]: `%${query.search}%` } },
      { phone: { [Op.iLike]: `%${query.search}%` } },
      { email: { [Op.iLike]: `%${query.search}%` } },
    ];
  }

  return filter;
};

export const createEnquiryService = async (
  data: {
    name: string;
    phone: string;
    email?: string;
    source: EnquirySource;
    message?: string;
    budgetRange?: BudgetRange;
    propertyType?: PropertyType;
    preferredLocation?: string;
    interestedProject?: string;
    notes?: string;
  },
  createdBy: string
) => {
  const tenantId = getTenantId();

  const enquiry = await Enquiry.create({
    ...data,
    tenantId,
    createdBy,
    interestedProjectId: data.interestedProject || null,
  } as any);

  return enquiry;
};

export const getAllEnquiriesService = async (
  query: Record<string, any>,
  page: number = 1,
  limit: number = 10
) => {
  const tenantId = getTenantId();
  const where = buildFilterQuery(query, tenantId);
  const offset = (page - 1) * limit;

  const { rows, count } = await Enquiry.findAndCountAll({
    where,
    include: [
      { model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
      { model: Project, as: 'interestedProject', attributes: ['name', 'location'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    enquiries: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    hasNextPage: page < Math.ceil(count / limit),
    hasPrevPage: page > 1,
  };
};

export const getEnquiryByIdService = async (enquiryId: string) => {
  const tenantId = getTenantId();
  const enquiry = await Enquiry.findOne({
    where: { id: enquiryId, tenantId },
    include: [
      { model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] },
      { model: User, as: 'assignedByUser', attributes: ['name', 'email'] },
      { model: User, as: 'createdByUser', attributes: ['name', 'email'] },
      { model: Project, as: 'interestedProject', attributes: ['name', 'location'] },
      { model: Lead, as: 'convertedLead', attributes: ['name', 'phone', 'status'] },
      { model: User, as: 'convertedByUser', attributes: ['name', 'email'] },
      { model: User, as: 'rejectedByUser', attributes: ['name', 'email'] },
    ],
  });

  if (!enquiry) throw new ApiError(404, 'Enquiry not found');

  return enquiry;
};

export const updateEnquiryService = async (
  enquiryId: string,
  data: Record<string, any>
) => {
  const tenantId = getTenantId();
  const enquiry = await Enquiry.findOne({ where: { id: enquiryId, tenantId } });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');

  if (enquiry.isConverted) {
    throw new ApiError(400, 'Cannot edit a converted enquiry');
  }

  await enquiry.update(data);

  return await Enquiry.findByPk(enquiryId, {
    include: [{ model: User, as: 'assignedUser', attributes: ['name', 'email'] }],
  });
};

export const updateEnquiryStatusService = async (
  enquiryId: string,
  status: string,
  updatedBy: string,
  notes?: string,
  rejectionReason?: string
) => {
  const tenantId = getTenantId();
  const enquiry = await Enquiry.findOne({ where: { id: enquiryId, tenantId } });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');

  if (enquiry.isConverted) {
    throw new ApiError(400, 'Cannot change status of a converted enquiry');
  }

  const updateData: any = { status };

  if (notes) updateData.notes = notes;

  if (status === 'Rejected') {
    if (!rejectionReason) throw new ApiError(400, 'Rejection reason is required');
    updateData.rejectedAt = new Date();
    updateData.rejectedBy = updatedBy;
    updateData.rejectionReason = rejectionReason;
  }

  if (status === 'Contacted') {
    updateData.lastContactedAt = new Date();
  }

  await enquiry.update(updateData);

  return await Enquiry.findByPk(enquiryId, {
    include: [{ model: User, as: 'assignedUser', attributes: ['name', 'email'] }],
  });
};

export const assignEnquiryService = async (
  enquiryId: string,
  assignedTo: string,
  assignedBy: string
) => {
  const tenantId = getTenantId();
  const enquiry = await Enquiry.findOne({ where: { id: enquiryId, tenantId } });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');

  if (enquiry.isConverted) {
    throw new ApiError(400, 'Cannot reassign a converted enquiry');
  }

  await enquiry.update({
    assignedTo,
    assignedBy,
    assignedAt: new Date(),
  });

  return await Enquiry.findByPk(enquiryId, {
    include: [{ model: User, as: 'assignedUser', attributes: ['name', 'email', 'phone'] }],
  });
};

export const convertToLeadService = async (
  enquiryId: string,
  convertedBy: string,
  assignedTo: string,
  followUpDate: Date,
  followUpNotes: string = '',
  priority: LeadPriority = 'Medium'
) => {
  const tenantId = getTenantId();
  const transaction = await sequelize.transaction();

  try {
    const enquiry = await Enquiry.findOne({ where: { id: enquiryId, tenantId }, transaction });
    if (!enquiry) throw new ApiError(404, 'Enquiry not found');

    if (enquiry.status !== 'Qualified') {
      throw new ApiError(400, 'Only Qualified enquiries can be converted to leads');
    }

    if (enquiry.isConverted) {
      throw new ApiError(400, 'This enquiry has already been converted to a lead');
    }

    const { default: FollowUp } = await import('../followups/followup.model');

    const lead = await Lead.create(
      {
        tenantId,
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiry.email,
        source: enquiry.source as string,
        status: 'NEW',
        priority,
        budgetRange: enquiry.budgetRange as string | undefined,
        propertyType: enquiry.propertyType as string | undefined,
        preferredLocation: enquiry.preferredLocation,
        interestedProjectId: enquiry.interestedProjectId,
        assignedTo,
        assignedBy: convertedBy,
        assignedAt: new Date(),
        notes: enquiry.notes,
        enquiryId: enquiry.id,
        createdBy: convertedBy,
        activityLog: [],
        reassignmentHistory: [],
      } as any,
      { transaction }
    );

    await FollowUp.create(
      {
        tenantId,
        leadId: lead.id,
        scheduledAt: followUpDate,
        type: 'Call',
        notes: followUpNotes || `First follow-up for converted enquiry from ${enquiry.source}`,
        status: 'SCHEDULED',
        createdBy: convertedBy,
        assignedTo,
        reminderSent: false,
      },
      { transaction }
    );

    await enquiry.update(
      {
        status: 'Converted',
        isConverted: true,
        convertedAt: new Date(),
        convertedBy,
        convertedLeadId: lead.id,
      },
      { transaction }
    );

    // TODO: add notifications module logic

    await transaction.commit();

    const { createClientFromLeadService } = await import('../clients/client.service');
    await createClientFromLeadService(lead, convertedBy, 'ASSIGNED');

    return {
      lead,
      message: `Enquiry successfully converted to lead and assigned. Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString('en-IN')}.`,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deleteEnquiryService = async (enquiryId: string) => {
  const tenantId = getTenantId();
  const enquiry = await Enquiry.findOne({ where: { id: enquiryId, tenantId } });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');

  if (enquiry.isConverted) {
    throw new ApiError(400, 'Cannot delete a converted enquiry. It is linked to a lead.');
  }

  await enquiry.destroy();
  return { message: 'Enquiry deleted successfully' };
};

export const getEnquiryStatsService = async (query: Record<string, any> = {}) => {
  const tenantId = getTenantId();
  const filter = buildFilterQuery(query, tenantId);

  const statsRows = await Enquiry.findAll({
    where: filter,
    attributes: [
      ['status', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['status'],
  });
  const stats = statsRows.map(r => r.get({ plain: true }));

  const sourceStatsRows = await Enquiry.findAll({
    where: filter,
    attributes: [
      ['source', '_id'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['source'],
  });
  const sourceStats = sourceStatsRows.map(r => r.get({ plain: true }));

  const total = await Enquiry.count({ where: filter });
  const converted = await Enquiry.count({ where: { ...filter, isConverted: true } });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todayFilter = {
    ...filter,
    createdAt: {
      ...(filter.createdAt || {}),
      [Op.gte]: startOfToday,
      [Op.lte]: endOfToday,
    }
  };

  const today = await Enquiry.count({ where: todayFilter });

  return {
    total,
    converted,
    today,
    conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) + '%' : '0%',
    byStatus: stats,
    bySource: sourceStats,
  };
};