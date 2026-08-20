import { Op, Sequelize } from 'sequelize';
import sequelize from '../../config/sequelize';
import Lead from '../leads/lead.model';
import FollowUp from '../followups/followup.model';
import Booking from '../bookings/booking.model';
import Payment from '../payments/payment.model';
import Project, { MetaCampaign } from '../projects/project.model';
import Unit from '../units/unit.model';
import Call from '../calls/call.model';
import User from '../auth/auth.model';
import { getTenantId } from '../../middleware/tenant.middleware';

const getDateRanges = () => {
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const yesterdayEnd = new Date(todayStart);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  return {
    now,
    todayStart,
    todayEnd,
    yesterdayStart,
    yesterdayEnd,
    thisMonthStart,
    lastMonthStart,
    lastMonthEnd,
  };
};

const buildScopes = (userId: string, role: string, tenantId: string) => {
  const isExec = role === 'SALES_EXECUTIVE';

  return {
    leadScope: { tenantId, ...(isExec ? { assignedTo: userId } : {}) },
    bookingScope: { tenantId, ...(isExec ? { bookedBy: userId } : {}) },
    paymentScope: { tenantId, ...(isExec ? { recordedBy: userId } : {}) },
    followupScope: { tenantId, ...(isExec ? { assignedTo: userId } : {}) },
  };
};

export const getDateFilterClause = (period?: string, startDate?: string, endDate?: string) => {
  const now = new Date();

  if (startDate && endDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    return { [Op.gte]: s, [Op.lte]: e };
  }

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 86_400_000 - 1);

  if (!period || period === 'today') {
    return { [Op.gte]: todayStart, [Op.lte]: todayEnd };
  }
  if (period === 'yesterday') {
    const yestStart = new Date(todayStart.getTime() - 86_400_000);
    const yestEnd = new Date(todayStart.getTime() - 1);
    return { [Op.gte]: yestStart, [Op.lte]: yestEnd };
  }
  if (period === 'this_week' || period === 'week') {
    const day = now.getDay();
    const diffToMon = (day === 0 ? -6 : 1) - day;
    const mon = new Date(todayStart);
    mon.setDate(todayStart.getDate() + diffToMon);
    return { [Op.gte]: mon, [Op.lte]: todayEnd };
  }
  if (period === 'this_month' || period === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { [Op.gte]: monthStart, [Op.lte]: todayEnd };
  }
  if (period === 'this_year' || period === 'year') {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return { [Op.gte]: yearStart, [Op.lte]: todayEnd };
  }
  if (period === 'all') {
    return undefined;
  }

  return { [Op.gte]: todayStart, [Op.lte]: todayEnd };
};

export const getDashboardSummaryService = async (
  userId: string,
  role: string,
  projectId?: string,
  dateRange?: string,
  startDate?: string,
  endDate?: string
) => {
  const tenantId = getTenantId();
  const { leadScope, bookingScope, followupScope } = buildScopes(userId, role, tenantId);

  const projectFilter = projectId && projectId !== 'all' ? { interestedProjectId: projectId } : {};
  const bookingProjectFilter = projectId && projectId !== 'all' ? { projectId: projectId } : {};

  const leadQuery = { ...leadScope, ...projectFilter };
  const dateClause = getDateFilterClause(dateRange, startDate, endDate);

  // 1. Total leads count
  const totalLeads = await Lead.count({ where: leadQuery });

  // 2. Active leads count (status NOT IN LOST, DUPLICATE)
  const activeLeads = await Lead.count({
    where: {
      ...leadQuery,
      status: { [Op.notIn]: ['LOST', 'DUPLICATE'] }
    }
  });

  // 3. Dump leads count (status IN LOST, DUPLICATE, HOLD)
  const dumpLeads = await Lead.count({
    where: {
      ...leadQuery,
      status: { [Op.in]: ['LOST', 'DUPLICATE', 'HOLD'] }
    }
  });

  // 8. Active campaigns count
  let activeCampaigns = 0;
  try {
    const campaignProjectFilter = projectId && projectId !== 'all' ? { projectId } : {};
    activeCampaigns = await MetaCampaign.count({
      where: {
        isActive: true,
        ...campaignProjectFilter
      }
    });
  } catch (err) {
    console.error('Failed to count active campaigns:', err);
    activeCampaigns = 0;
  }

  // 4. New Leads count (with date filter)
  const newLeadsQuery: any = { ...leadQuery };
  if (dateClause) newLeadsQuery.createdAt = dateClause;

  const newLeadsCount = await Lead.count({ where: newLeadsQuery });

  // 5. Follow-ups count (with date filter)
  const followUpQuery: any = {
    ...followupScope,
    type: { [Op.ne]: 'Site Visit' },
  };
  if (dateClause) followUpQuery.scheduledAt = dateClause;

  const [followUpsCount, followUpsCompleted, followUpsPending] = await Promise.all([
    FollowUp.count({ where: followUpQuery }),
    FollowUp.count({ where: { ...followUpQuery, status: 'COMPLETED' } }),
    FollowUp.count({ where: { ...followUpQuery, status: { [Op.in]: ['SCHEDULED', 'PENDING'] } } }),
  ]);

  // 6. Site Visits count (with date filter)
  const visitQuery: any = {
    ...followupScope,
    type: 'Site Visit',
  };
  if (dateClause) visitQuery.scheduledAt = dateClause;

  const [siteVisitsCount, siteVisitsCompleted, siteVisitsConfirmed] = await Promise.all([
    FollowUp.count({ where: visitQuery }),
    FollowUp.count({ where: { ...visitQuery, status: 'COMPLETED' } }),
    FollowUp.count({ where: { ...visitQuery, status: { [Op.in]: ['SCHEDULED', 'PENDING'] } } }),
  ]);

  // 7. Bookings count & revenue (with date filter)
  const bookingBaseQuery: any = { ...bookingScope, ...bookingProjectFilter, status: { [Op.ne]: 'Cancelled' } };
  if (dateClause) bookingBaseQuery.bookingDate = dateClause;

  const bookingsCount = await Booking.count({ where: bookingBaseQuery });
  const revenueResult = await Booking.findOne({
    where: bookingBaseQuery,
    attributes: [[Sequelize.fn('SUM', Sequelize.col('finalAmount')), 'totalRevenue']],
    raw: true,
  }) as any;
  const bookingsRevenue = parseFloat(revenueResult?.totalRevenue || '0');

  return {
    totalLeads,
    activeLeads,
    dumpLeads,
    activeCampaigns,
    newLeadsCount,
    followUpsCount,
    followUpsCompleted,
    followUpsPending,
    siteVisitsCount,
    siteVisitsCompleted,
    siteVisitsConfirmed,
    bookingsCount,
    bookingsRevenue,
  };
};

export const getFilteredNewLeadsService = async (
  userId: string,
  role: string,
  projectId?: string,
  dateRange?: string,
  startDate?: string,
  endDate?: string,
  limit = 50
) => {
  const tenantId = getTenantId();
  const { leadScope } = buildScopes(userId, role, tenantId);
  const projectFilter = projectId && projectId !== 'all' ? { interestedProjectId: projectId } : {};
  const dateClause = getDateFilterClause(dateRange, startDate, endDate);

  const whereClause: any = { ...leadScope, ...projectFilter };
  if (dateClause) whereClause.createdAt = dateClause;

  const [count, leads] = await Promise.all([
    Lead.count({ where: whereClause }),
    Lead.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'assignedUser', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    }),
  ]);

  return {
    count,
    leads: leads.map((l: any) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      source: l.source,
      status: l.status,
      assignedToName: l.assignedUser?.name || 'Unassigned',
      createdAt: l.createdAt,
    })),
  };
};

export const getFilteredFollowUpsService = async (
  userId: string,
  role: string,
  projectId?: string,
  dateRange?: string,
  startDate?: string,
  endDate?: string,
  limit = 50
) => {
  const tenantId = getTenantId();
  const { followupScope } = buildScopes(userId, role, tenantId);
  const dateClause = getDateFilterClause(dateRange, startDate, endDate);

  const whereClause: any = {
    ...followupScope,
    type: { [Op.ne]: 'Site Visit' },
  };
  if (dateClause) whereClause.scheduledAt = dateClause;

  const [count, completedCount, pendingCount, followups] = await Promise.all([
    FollowUp.count({ where: whereClause }),
    FollowUp.count({ where: { ...whereClause, status: 'COMPLETED' } }),
    FollowUp.count({ where: { ...whereClause, status: { [Op.in]: ['SCHEDULED', 'PENDING'] } } }),
    FollowUp.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'assignedUser', attributes: ['name'] },
        { model: Lead, as: 'lead', attributes: ['name', 'phone', 'interestedProjectId'] },
      ],
      order: [['scheduledAt', 'ASC']],
      limit,
    }),
  ]);

  const filtered = followups.filter((f: any) => {
    if (!projectId || projectId === 'all') return true;
    return f.lead?.interestedProjectId === projectId;
  });

  return {
    count,
    completedCount,
    pendingCount,
    followups: filtered.map((f: any) => ({
      id: f.id,
      leadName: f.lead?.name || 'Unknown Lead',
      leadPhone: f.lead?.phone || '',
      type: f.type,
      scheduledAt: f.scheduledAt,
      status: f.status,
      assignedToName: f.assignedUser?.name || 'Unassigned',
      notes: f.notes || '',
    })),
  };
};

export const getFilteredSiteVisitsService = async (
  userId: string,
  role: string,
  projectId?: string,
  dateRange?: string,
  startDate?: string,
  endDate?: string,
  limit = 50
) => {
  const tenantId = getTenantId();
  const { followupScope } = buildScopes(userId, role, tenantId);
  const dateClause = getDateFilterClause(dateRange, startDate, endDate);

  const whereClause: any = {
    ...followupScope,
    type: 'Site Visit',
  };
  if (dateClause) whereClause.scheduledAt = dateClause;

  const [count, completedCount, confirmedCount, visits] = await Promise.all([
    FollowUp.count({ where: whereClause }),
    FollowUp.count({ where: { ...whereClause, status: 'COMPLETED' } }),
    FollowUp.count({ where: { ...whereClause, status: { [Op.in]: ['SCHEDULED', 'PENDING'] } } }),
    FollowUp.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'assignedUser', attributes: ['name'] },
        {
          model: Lead,
          as: 'lead',
          attributes: ['name', 'phone', 'interestedProjectId'],
          include: [{ model: Project, as: 'interestedProject', attributes: ['name'] }]
        },
      ],
      order: [['scheduledAt', 'ASC']],
      limit,
    }),
  ]);

  const filtered = visits.filter((v: any) => {
    if (!projectId || projectId === 'all') return true;
    return v.lead?.interestedProjectId === projectId;
  });

  return {
    count,
    completedCount,
    confirmedCount,
    visits: filtered.map((v: any) => ({
      id: v.id,
      clientName: v.lead?.name || 'Unknown Lead',
      clientPhone: v.lead?.phone || '',
      projectName: v.lead?.interestedProject?.name || 'N/A',
      scheduledAt: v.scheduledAt,
      status: v.status,
      executiveName: v.assignedUser?.name || 'Unassigned',
      notes: v.notes || '',
    })),
  };
};

export const getFilteredBookingsService = async (
  userId: string,
  role: string,
  projectId?: string,
  dateRange?: string,
  startDate?: string,
  endDate?: string,
  limit = 50
) => {
  const tenantId = getTenantId();
  const { bookingScope } = buildScopes(userId, role, tenantId);
  const bookingProjectFilter = projectId && projectId !== 'all' ? { projectId: projectId } : {};
  const dateClause = getDateFilterClause(dateRange, startDate, endDate);

  const whereClause: any = {
    ...bookingScope,
    ...bookingProjectFilter,
    status: { [Op.ne]: 'Cancelled' }
  };
  if (dateClause) whereClause.bookingDate = dateClause;

  const [count, bookings, revRes] = await Promise.all([
    Booking.count({ where: whereClause }),
    Booking.findAll({
      where: whereClause,
      include: [
        { model: Project, as: 'project', attributes: ['name'] },
        { model: Unit, as: 'unit', attributes: ['unitNumber'] },
        { model: Lead, as: 'lead', attributes: ['name', 'phone'] },
      ],
      order: [['bookingDate', 'DESC']],
      limit,
    }),
    Booking.findOne({
      where: whereClause,
      attributes: [[Sequelize.fn('SUM', Sequelize.col('finalAmount')), 'totalRevenue']],
      raw: true,
    }) as any,
  ]);

  return {
    count,
    totalRevenue: parseFloat(revRes?.totalRevenue || '0'),
    bookings: bookings.map((b: any) => ({
      id: b.id,
      clientName: b.lead?.name || 'Client',
      clientPhone: b.lead?.phone || '',
      projectName: b.project?.name || 'N/A',
      unitNumber: b.unit?.unitNumber || 'N/A',
      finalAmount: b.finalAmount,
      bookingDate: b.bookingDate,
      status: b.status,
    })),
  };
};

export const getActiveCampaignsService = async (projectId?: string) => {
  const campaignProjectFilter = projectId && projectId !== 'all' ? { projectId } : {};

  try {
    const campaigns = await MetaCampaign.findAll({
      where: {
        isActive: true,
        ...campaignProjectFilter,
      },
      include: [{ model: Project, as: 'project', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
    });

    return {
      count: campaigns.length,
      campaigns: campaigns.map((c: any) => ({
        id: c.id,
        campaignName: c.campaignName,
        platform: c.platform,
        projectName: c.project?.name || 'All Projects',
        formName: c.formName,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
    };
  } catch (err) {
    console.error('Error fetching active campaigns:', err);
    return { count: 0, campaigns: [] };
  }
};

export const getProjectInventoryService = async (projectId?: string) => {
  const tenantId = getTenantId();
  const matchProject: any = { tenantId };
  if (projectId && projectId !== 'all') {
    matchProject.id = projectId;
  } else {
    matchProject.status = { [Op.in]: ['ACTIVE', 'ONGOING', 'UPCOMING', 'COMPLETED'] };
  }

  const projects = await Project.findAll({ where: matchProject, attributes: ['id', 'name', 'totalUnits', 'status'] });
  const projectIds = projects.map(p => p.id);

  const unitCountsRows = await Unit.findAll({
    where: { projectId: { [Op.in]: projectIds }, tenantId },
    attributes: [
      'projectId',
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['projectId', 'status'],
    raw: true,
  }) as any[];

  const leadCountsRows = await Lead.findAll({
    where: { interestedProjectId: { [Op.in]: projectIds }, tenantId, status: { [Op.notIn]: ['DUPLICATE', 'LOST'] } },
    attributes: [
      'interestedProjectId',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['interestedProjectId'],
    raw: true,
  }) as any[];

  const unitMap: Record<string, { available: number; booked: number; sold: number }> = {};
  unitCountsRows.forEach(u => {
    const pid = u.projectId;
    if (!unitMap[pid]) unitMap[pid] = { available: 0, booked: 0, sold: 0 };
    if (u.status === 'Available') unitMap[pid].available = parseInt(u.count, 10);
    if (u.status === 'Booked') unitMap[pid].booked = parseInt(u.count, 10);
    if (u.status === 'Sold') unitMap[pid].sold = parseInt(u.count, 10);
  });

  const leadMap: Record<string, number> = {};
  leadCountsRows.forEach(l => {
    leadMap[l.interestedProjectId] = parseInt(l.count, 10);
  });

  return projects.map(p => {
    const pid = p.id;
    const units = unitMap[pid] ?? { available: 0, booked: 0, sold: 0 };
    return {
      id: pid,
      name: p.name,
      status: p.status,
      totalUnits: p.totalUnits,
      available: units.available,
      booked: units.booked,
      sold: units.sold,
      totalLeads: leadMap[pid] ?? 0,
    };
  });
};

export const getEmployeePerformanceService = async (userId: string, role: string) => {
  const tenantId = getTenantId();
  const ranges = getDateRanges();
  
  const userFilter: any = { tenantId, role: 'SALES_EXECUTIVE', isActive: true };
  if (role === 'SALES_EXECUTIVE') {
    userFilter.id = userId;
  }

  const executives = await User.findAll({ where: userFilter, attributes: ['id', 'name', 'role'] });
  const execIds = executives.map(e => e.id);

  const followUpRows = await FollowUp.findAll({
    where: {
      tenantId,
      assignedTo: { [Op.in]: execIds },
      type: { [Op.ne]: 'Site Visit' },
      scheduledAt: { [Op.gte]: ranges.todayStart, [Op.lt]: ranges.todayEnd },
      status: { [Op.in]: ['SCHEDULED', 'PENDING', 'COMPLETED'] },
    },
    attributes: [
      'assignedTo',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      [Sequelize.literal(`SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)`), 'done']
    ],
    group: ['assignedTo'],
    raw: true,
  }) as any[];

  const leadRows = await Lead.findAll({
    where: { tenantId, assignedTo: { [Op.in]: execIds }, status: { [Op.ne]: 'DUPLICATE' } },
    attributes: [
      'assignedTo',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      [Sequelize.literal(`SUM(CASE WHEN status IN ('CLOSED', 'BOOKED') THEN 1 ELSE 0 END)`), 'converted']
    ],
    group: ['assignedTo'],
    raw: true,
  }) as any[];

  const bookingRows = await Booking.findAll({
    where: {
      tenantId,
      bookedBy: { [Op.in]: execIds },
      bookingDate: { [Op.gte]: ranges.thisMonthStart },
      status: { [Op.ne]: 'Cancelled' }
    },
    attributes: [
      'bookedBy',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'deals'],
      [Sequelize.fn('SUM', Sequelize.col('finalAmount')), 'revenue']
    ],
    group: ['bookedBy'],
    raw: true,
  }) as any[];

  const callRows = await Call.findAll({
    where: {
      tenantId,
      loggedBy: { [Op.in]: execIds },
      callDate: { [Op.gte]: ranges.todayStart, [Op.lt]: ranges.todayEnd }
    },
    attributes: [
      'loggedBy',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['loggedBy'],
    raw: true,
  }) as any[];

  const visitRows = await FollowUp.findAll({
    where: {
      tenantId,
      assignedTo: { [Op.in]: execIds },
      type: 'Site Visit',
      scheduledAt: { [Op.gte]: ranges.todayStart, [Op.lt]: ranges.todayEnd },
      status: { [Op.in]: ['SCHEDULED', 'PENDING', 'COMPLETED'] },
    },
    attributes: [
      'assignedTo',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['assignedTo'],
    raw: true,
  }) as any[];

  const fuMap: Record<string, { total: number; done: number }> = {};
  followUpRows.forEach(d => { fuMap[d.assignedTo] = { total: parseInt(d.total, 10), done: parseInt(d.done, 10) }; });

  const ldMap: Record<string, { total: number; converted: number }> = {};
  leadRows.forEach(d => { ldMap[d.assignedTo] = { total: parseInt(d.total, 10), converted: parseInt(d.converted, 10) }; });

  const bkMap: Record<string, { deals: number; revenue: number }> = {};
  bookingRows.forEach(d => { bkMap[d.bookedBy] = { deals: parseInt(d.deals, 10), revenue: parseFloat(d.revenue) }; });

  const callMap: Record<string, number> = {};
  callRows.forEach(d => { callMap[d.loggedBy] = parseInt(d.count, 10); });

  const visitMap: Record<string, number> = {};
  visitRows.forEach(d => { visitMap[d.assignedTo] = parseInt(d.count, 10); });

  return executives.map(e => {
    const id = e.id;
    const fu = fuMap[id] ?? { total: 0, done: 0 };
    const ld = ldMap[id] ?? { total: 0, converted: 0 };
    const bk = bkMap[id] ?? { deals: 0, revenue: 0 };
    const conversionRate = ld.total > 0 ? parseFloat(((ld.converted / ld.total) * 100).toFixed(1)) : 0;

    return {
      id,
      name: e.name,
      role: e.role,
      todayFollowUps: fu.total,
      followUpsDone: fu.done,
      leadsAssigned: ld.total,
      dealsClosedMonth: bk.deals,
      revenueThisMonth: bk.revenue,
      conversionRate,
      callsMade: callMap[id] ?? 0,
      visitsScheduled: visitMap[id] ?? 0,
    };
  });
};

export const getTopPerformersService = async (userId: string, role: string, limit = 5) => {
  const tenantId = getTenantId();
  const ranges = getDateRanges();
  const execFilter: any = { tenantId, role: 'SALES_EXECUTIVE', isActive: true };
  if (role === 'SALES_EXECUTIVE') execFilter.id = userId;

  const users = await User.findAll({ where: execFilter, attributes: ['id', 'name'] });
  const execIds = users.map(u => u.id);

  const bookings = await Booking.findAll({
    where: {
      tenantId,
      bookedBy: { [Op.in]: execIds },
      bookingDate: { [Op.gte]: ranges.thisMonthStart },
      status: { [Op.ne]: 'Cancelled' }
    },
    attributes: [
      'bookedBy',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'dealsClosedMonth'],
      [Sequelize.fn('SUM', Sequelize.col('finalAmount')), 'revenue']
    ],
    group: ['bookedBy'],
    order: [[Sequelize.literal('revenue'), 'DESC'], [Sequelize.literal('"dealsClosedMonth"'), 'DESC']],
    limit,
    raw: true,
  }) as any[];

  const leadRows = await Lead.findAll({
    where: { tenantId, assignedTo: { [Op.in]: execIds }, status: { [Op.ne]: 'DUPLICATE' } },
    attributes: [
      'assignedTo',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      [Sequelize.literal(`SUM(CASE WHEN status IN ('CLOSED', 'BOOKED') THEN 1 ELSE 0 END)`), 'converted']
    ],
    group: ['assignedTo'],
    raw: true,
  }) as any[];

  const crMap: Record<string, number> = {};
  leadRows.forEach(c => {
    const total = parseInt(c.total, 10);
    const converted = parseInt(c.converted, 10);
    crMap[c.assignedTo] = total > 0 ? parseFloat(((converted / total) * 100).toFixed(1)) : 0;
  });

  const userMap: Record<string, string> = {};
  users.forEach(u => userMap[u.id] = u.name);

  return bookings.map((p, i) => ({
    rank: i + 1,
    userId: p.bookedBy,
    name: userMap[p.bookedBy],
    dealsClosedMonth: parseInt(p.dealsClosedMonth, 10),
    revenue: parseFloat(p.revenue),
    conversionRate: crMap[p.bookedBy] ?? 0,
  }));
};

export const getTodayVisitsService = async (userId: string, role: string, projectId?: string) => {
  const tenantId = getTenantId();
  const ranges = getDateRanges();
  const assignedFilter = role === 'SALES_EXECUTIVE' ? { assignedTo: userId } : {};

  const visits = await FollowUp.findAll({
    where: {
      ...assignedFilter,
      tenantId,
      type: 'Site Visit',
      scheduledAt: { [Op.gte]: ranges.todayStart, [Op.lt]: ranges.todayEnd },
      status: { [Op.in]: ['SCHEDULED', 'PENDING', 'COMPLETED', 'RESCHEDULED'] },
    },
    include: [
      { model: User, as: 'assignedUser', attributes: ['name'] },
      { 
        model: Lead, 
        as: 'lead', 
        attributes: ['name', 'phone', 'interestedProjectId', 'interestedUnitId'],
        include: [
          { model: Project, as: 'interestedProject', attributes: ['name'] },
        ]
      }
    ],
    order: [['scheduledAt', 'ASC']],
  });

  return visits
    .filter((v: any) => {
      if (!projectId || projectId === 'all') return true;
      return v.lead?.interestedProjectId === projectId;
    })
    .map((v: any) => ({
      id: v.id,
      time: v.scheduledAt,
      clientName: v.lead?.name ?? 'Unknown',
      clientPhone: v.lead?.phone ?? '',
      projectName: v.lead?.interestedProject?.name ?? '',
      unitNumber: v.lead?.interestedUnitId ?? '',
      executiveName: v.assignedUser?.name ?? '',
      status: v.status === 'SCHEDULED' ? 'confirmed' : v.status === 'COMPLETED' ? 'completed' : 'pending',
      notes: v.notes ?? '',
    }));
};

export const getPaymentAlertsService = async (userId: string, role: string, limit = 10) => {
  const tenantId = getTenantId();
  const ranges = getDateRanges();
  const paymentScope = role === 'SALES_EXECUTIVE' ? { recordedBy: userId } : {};
  const sevenDaysFromNow = new Date(ranges.now.getTime() + 7 * 86_400_000);

  const payments = await Payment.findAll({
    where: {
      ...paymentScope,
      tenantId,
      status: { [Op.in]: ['Pending', 'Overdue'] },
      dueDate: { [Op.lte]: sevenDaysFromNow },
    },
    include: [
      {
        model: Booking,
        as: 'booking',
        include: [
          { model: Project, as: 'project', attributes: ['name'] },
          { model: Unit, as: 'unit', attributes: ['unitNumber'] },
        ]
      }
    ],
    order: [['dueDate', 'ASC']],
    limit,
  });

  return payments.map((p: any) => {
    const diffMs = new Date(p.dueDate).getTime() - ranges.now.getTime();
    const diffDays = Math.ceil(diffMs / 86_400_000);
    let dueLabel: string;
    if (p.status === 'Overdue') {
      const days = Math.abs(diffDays);
      dueLabel = days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} overdue`;
    } else if (diffDays <= 0) {
      dueLabel = 'Due today';
    } else if (diffDays === 1) {
      dueLabel = 'Due tomorrow';
    } else {
      dueLabel = `Due in ${diffDays} days`;
    }

    return {
      id: p.id,
      clientName: 'Unknown',
      clientPhone: '',
      amount: p.amount,
      dueDate: p.dueDate,
      dueLabel,
      paymentType: p.paymentType,
      status: p.status,
      urgent: p.status === 'Overdue' || diffDays <= 0,
      projectName: p.booking?.project?.name ?? '',
      unitNumber: p.booking?.unit?.unitNumber ?? '',
    };
  });
};

export const getLeadTrendsService = async (userId: string, role: string, period: 'daily' | 'weekly' | 'monthly' = 'daily', range = 30, projectId?: string) => {
  return [];
};

export const getLeadFunnelService = async (userId: string, role: string, projectId?: string) => {
  const tenantId = getTenantId();
  const leadScope = role === 'SALES_EXECUTIVE' ? { assignedTo: userId } : {};
  const projectFilter = projectId && projectId !== 'all' ? { interestedProjectId: projectId } : {};

  const counts = await Lead.findAll({
    where: { ...leadScope, ...projectFilter, tenantId, status: { [Op.ne]: 'DUPLICATE' } },
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true,
  }) as any[];

  const stages = [
    { key: 'NEW', label: 'New Leads' },
    { key: 'CONTACTED', label: 'Contacted' },
    { key: 'QUALIFIED', label: 'Qualified' },
    { key: 'SITE_VISIT_SCHEDULED', label: 'Visit Scheduled' },
    { key: 'SITE_VISIT_COMPLETED', label: 'Visit Completed' },
    { key: 'INTERESTED', label: 'Interested' },
    { key: 'NEGOTIATION', label: 'Negotiation' },
    { key: 'BOOKING_IN_PROGRESS', label: 'Booking in Progress' },
    { key: 'BOOKED', label: 'Booked' },
    { key: 'PAYMENT_IN_PROGRESS', label: 'Payment in Progress' },
    { key: 'CLOSED', label: 'Closed / Won' },
    { key: 'LOST', label: 'Lost' },
    { key: 'HOLD', label: 'On Hold' },
  ];

  const countMap: Record<string, number> = {};
  counts.forEach(c => { countMap[c.status] = parseInt(c.count, 10); });

  return stages.map(s => ({ status: s.key, label: s.label, count: countMap[s.key] ?? 0 }));
};

export const getLeadSourcesService = async (userId: string, role: string, period: 'thisMonth' | 'lastMonth' | 'allTime' = 'thisMonth', projectId?: string) => {
  const tenantId = getTenantId();
  const ranges = getDateRanges();
  const leadScope = role === 'SALES_EXECUTIVE' ? { assignedTo: userId } : {};
  const projectFilter = projectId && projectId !== 'all' ? { interestedProjectId: projectId } : {};

  let dateFilter: any = {};
  if (period === 'thisMonth') dateFilter = { createdAt: { [Op.gte]: ranges.thisMonthStart } };
  if (period === 'lastMonth') dateFilter = { createdAt: { [Op.gte]: ranges.lastMonthStart, [Op.lte]: ranges.lastMonthEnd } };

  const data = await Lead.findAll({
    where: { ...leadScope, ...projectFilter, ...dateFilter, tenantId, status: { [Op.ne]: 'DUPLICATE' } },
    attributes: [
      'source',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.literal(`SUM(CASE WHEN status IN ('CLOSED', 'BOOKED') THEN 1 ELSE 0 END)`), 'converted']
    ],
    group: ['source'],
    order: [[Sequelize.literal('count'), 'DESC']],
    raw: true,
  }) as any[];

  const total = data.reduce((s, d) => s + parseInt(d.count, 10), 0);

  return data.map(d => {
    const count = parseInt(d.count, 10);
    const converted = parseInt(d.converted, 10);
    return {
      source: d.source ?? 'Unknown',
      count,
      converted,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
      conversionRate: count > 0 ? parseFloat(((converted / count) * 100).toFixed(1)) : 0,
    };
  });
};

export const getTodayWorkService = async (userId: string) => {
  const tenantId = getTenantId();
  const ranges = getDateRanges();

  const [followUps, visits, newLeads, overdueItems] = await Promise.all([
    FollowUp.findAll({
      where: {
        tenantId,
        assignedTo: userId,
        type: { [Op.ne]: 'Site Visit' },
        scheduledAt: { [Op.gte]: ranges.todayStart, [Op.lt]: ranges.todayEnd },
        status: { [Op.in]: ['SCHEDULED', 'PENDING'] },
      },
      include: [{ model: Lead, as: 'lead', attributes: ['name', 'phone', 'status'] }],
      order: [['scheduledAt', 'ASC']],
    }),

    FollowUp.findAll({
      where: {
        tenantId,
        assignedTo: userId,
        type: 'Site Visit',
        scheduledAt: { [Op.gte]: ranges.todayStart, [Op.lt]: ranges.todayEnd },
        status: { [Op.in]: ['SCHEDULED', 'PENDING'] },
      },
      include: [{ 
        model: Lead, 
        as: 'lead', 
        attributes: ['name', 'phone', 'interestedProjectId'],
        include: [{ model: Project, as: 'interestedProject', attributes: ['name'] }]
      }],
      order: [['scheduledAt', 'ASC']],
    }),

    Lead.findAll({
      where: {
        tenantId,
        assignedTo: userId,
        createdAt: { [Op.gte]: ranges.todayStart, [Op.lt]: ranges.todayEnd },
        status: { [Op.ne]: 'DUPLICATE' },
      },
      attributes: ['id', 'name', 'phone', 'source', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
    }),

    FollowUp.findAll({
      where: {
        tenantId,
        assignedTo: userId,
        scheduledAt: { [Op.lt]: ranges.todayStart },
        status: { [Op.in]: ['SCHEDULED', 'PENDING'] },
      },
      include: [{ model: Lead, as: 'lead', attributes: ['name', 'phone', 'status'] }],
      order: [['scheduledAt', 'ASC']],
      limit: 10,
    }),
  ]);

  return {
    followUps: followUps.map((f: any) => ({
      id: f.id,
      time: f.scheduledAt,
      type: f.type,
      leadName: f.lead?.name ?? 'Unknown',
      leadPhone: f.lead?.phone ?? '',
      leadStatus: f.lead?.status ?? '',
      notes: f.notes ?? '',
    })),
    visits: visits.map((v: any) => ({
      id: v.id,
      time: v.scheduledAt,
      leadName: v.lead?.name ?? 'Unknown',
      leadPhone: v.lead?.phone ?? '',
      projectName: v.lead?.interestedProject?.name ?? '',
      notes: v.notes ?? '',
    })),
    newLeadsAssigned: newLeads.map((l: any) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      source: l.source,
      status: l.status,
      assignedAt: l.createdAt,
    })),
    overdueFollowUps: overdueItems.map((f: any) => ({
      id: f.id,
      scheduledAt: f.scheduledAt,
      type: f.type,
      leadName: f.lead?.name ?? 'Unknown',
      leadPhone: f.lead?.phone ?? '',
      notes: f.notes ?? '',
    })),
    summary: {
      followUpsDue: followUps.length,
      visitsDue: visits.length,
      newLeadsToday: newLeads.length,
      overdueItems: overdueItems.length,
    },
  };
};

export const getRemindersService = async (userId: string, hoursAhead = 4) => {
  const tenantId = getTenantId();
  const ranges = getDateRanges();
  const windowEnd = new Date(ranges.now.getTime() + hoursAhead * 3_600_000);

  const [upcoming, overdue] = await Promise.all([
    FollowUp.findAll({
      where: {
        tenantId,
        assignedTo: userId,
        scheduledAt: { [Op.gte]: ranges.now, [Op.lte]: windowEnd },
        status: { [Op.in]: ['SCHEDULED', 'PENDING'] },
      },
      include: [{ model: Lead, as: 'lead', attributes: ['name', 'phone'] }],
      order: [['scheduledAt', 'ASC']],
    }),

    FollowUp.findAll({
      where: {
        tenantId,
        assignedTo: userId,
        scheduledAt: { [Op.lt]: ranges.now },
        status: { [Op.in]: ['SCHEDULED', 'PENDING'] },
      },
      include: [{ model: Lead, as: 'lead', attributes: ['name', 'phone'] }],
      order: [['scheduledAt', 'ASC']],
      limit: 5,
    }),
  ]);

  return {
    upcoming: upcoming.map((f: any) => ({
      id: f.id,
      type: f.type,
      scheduledAt: f.scheduledAt,
      leadName: f.lead?.name ?? 'Unknown',
      leadPhone: f.lead?.phone ?? '',
      notes: f.notes ?? '',
      minutesUntil: Math.round((new Date(f.scheduledAt).getTime() - ranges.now.getTime()) / 60_000),
    })),
    overdue: overdue.map((f: any) => ({
      id: f.id,
      type: f.type,
      scheduledAt: f.scheduledAt,
      leadName: f.lead?.name ?? 'Unknown',
      leadPhone: f.lead?.phone ?? '',
      notes: f.notes ?? '',
      minutesOverdue: Math.round((ranges.now.getTime() - new Date(f.scheduledAt).getTime()) / 60_000),
    })),
  };
};

export const getRevenueByProjectService = async () => {
  const tenantId = getTenantId();
  const ranges = getDateRanges();

  const data = await Booking.findAll({
    where: { tenantId, status: { [Op.ne]: 'Cancelled' } },
    attributes: [
      'projectId',
      [Sequelize.fn('SUM', Sequelize.col('finalAmount')), 'totalRevenue'],
      [Sequelize.literal(`SUM(CASE WHEN "bookingDate" >= '${ranges.thisMonthStart.toISOString()}' THEN "finalAmount" ELSE 0 END)`), 'revenueThisMonth'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'dealsTotal'],
      [Sequelize.literal(`SUM(CASE WHEN "bookingDate" >= '${ranges.thisMonthStart.toISOString()}' THEN 1 ELSE 0 END)`), 'dealsThisMonth']
    ],
    group: ['projectId'],
    order: [[Sequelize.literal('"totalRevenue"'), 'DESC']],
    raw: true,
  }) as any[];

  const projectIds = data.map(d => d.projectId);
  const projects = await Project.findAll({ where: { id: { [Op.in]: projectIds } }, attributes: ['id', 'name'] });
  const pMap: Record<string, string> = {};
  projects.forEach(p => pMap[p.id] = p.name);

  return data.map(d => ({
    projectId: d.projectId,
    projectName: pMap[d.projectId] || 'Unknown',
    totalRevenue: parseFloat(d.totalRevenue),
    revenueThisMonth: parseFloat(d.revenueThisMonth),
    dealsTotal: parseInt(d.dealsTotal, 10),
    dealsThisMonth: parseInt(d.dealsThisMonth, 10),
  }));
};

export const getBookingsTrendService = async (userId: string, role: string) => {
  const tenantId = getTenantId();
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const leadScope: any = { tenantId, ...(role === 'SALES_EXECUTIVE' ? { assignedTo: userId } : {}) };
  const bookingScope: any = { tenantId, ...(role === 'SALES_EXECUTIVE' ? { bookedBy: userId } : {}) };

  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let w = 0; w < 4; w++) {
    const startDay = w * 7 + 1;
    const endDay = Math.min((w + 1) * 7, daysInMonth);
    if (startDay > daysInMonth) break;
    weeks.push({
      start: new Date(now.getFullYear(), now.getMonth(), startDay),
      end: new Date(now.getFullYear(), now.getMonth(), endDay, 23, 59, 59, 999),
      label: `Week ${w + 1}`,
    });
  }

  const results = await Promise.all(
    weeks.map(async (week) => {
      const [leadCount, closureCount] = await Promise.all([
        Lead.count({ where: { ...leadScope, createdAt: { [Op.gte]: week.start, [Op.lte]: week.end } } }),
        Booking.count({
          where: {
            ...bookingScope,
            bookingDate: { [Op.gte]: week.start, [Op.lte]: week.end },
            status: { [Op.in]: ['Active', 'Completed'] },
          },
        }),
      ]);
      return { label: week.label, leads: leadCount, closures: closureCount };
    })
  );

  const maxVal = Math.max(...results.map((r) => Math.max(r.leads, r.closures)), 1);

  return results.map((r) => ({
    label: r.label,
    volumeRaw: r.leads,
    closuresRaw: r.closures,
    volume: Math.round((r.leads / maxVal) * 100),
    closures: Math.round((r.closures / maxVal) * 100),
  }));
};
