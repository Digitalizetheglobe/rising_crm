import mongoose from 'mongoose';
import { Booking } from '../bookings/booking.model';
import { Payment } from '../payments/payment.model';
import { Project } from '../projects/project.model';
import { Unit } from '../units/unit.model';
import { Call } from '../calls/call.model';

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

// Scope filter helpers – restrict data to the logged-in sales executive
const buildScopes = (userId: string, role: string) => {
  const isExec = role === 'SALES_EXECUTIVE';
  const uid = new mongoose.Types.ObjectId(userId);

  return {
    leadScope: isExec ? { assignedTo: uid } : {},
    bookingScope: isExec ? { bookedBy: uid } : {},
    paymentScope: isExec ? { recordedBy: uid } : {},
    followupScope: isExec ? { assignedTo: uid } : {},
  };
};

// ─── 1. Dashboard Summary (stat cards) ───────────────────────────────────────
// GET /api/v1/dashboard/summary?projectId=<id|all>

export const getDashboardSummaryService = async (
  userId: string,
  role: string,
  projectId?: string
) => {
  const ranges = getDateRanges();
  const { leadScope, bookingScope, paymentScope, followupScope } = buildScopes(userId, role);
  const Lead = mongoose.model('Lead');
  const FollowUp = mongoose.model('FollowUp');

  const projectFilter =
    projectId && projectId !== 'all'
      ? { interestedProject: new mongoose.Types.ObjectId(projectId) }
      : {};
  const bookingProjectFilter =
    projectId && projectId !== 'all'
      ? { project: new mongoose.Types.ObjectId(projectId) }
      : {};

  const [leadStats, followUpStats, visitStats, bookingStats, paymentStats] = await Promise.all([
    Lead.aggregate([
      { $match: { ...leadScope, ...projectFilter } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          newToday: { $sum: { $cond: [{ $gte: ['$createdAt', ranges.todayStart] }, 1, 0] } },
          newThisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', ranges.thisMonthStart] }, 1, 0] } },
          newLastMonth: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$createdAt', ranges.lastMonthStart] }, { $lte: ['$createdAt', ranges.lastMonthEnd] }] },
                1, 0,
              ],
            },
          },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
        },
      },
    ]),

    FollowUp.aggregate([
      {
        $match: {
          ...followupScope,
          type: { $ne: 'Site Visit' },
          scheduledAt: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
          status: { $in: ['SCHEDULED', 'PENDING', 'COMPLETED'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                { $and: [{ $in: ['$status', ['PENDING', 'SCHEDULED']] }, { $lt: ['$scheduledAt', ranges.now] }] },
                1, 0,
              ],
            },
          },
        },
      },
    ]),

    FollowUp.aggregate([
      {
        $match: {
          ...followupScope,
          type: 'Site Visit',
          scheduledAt: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
          status: { $in: ['SCHEDULED', 'PENDING', 'COMPLETED'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'SCHEDULED'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        },
      },
    ]),

    Booking.aggregate([
      { $match: { ...bookingScope, ...bookingProjectFilter, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          yesterdayBookings: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$bookingDate', ranges.yesterdayStart] }, { $lt: ['$bookingDate', ranges.yesterdayEnd] }] },
                1, 0,
              ],
            },
          },
          thisMonthBookings: { $sum: { $cond: [{ $gte: ['$bookingDate', ranges.thisMonthStart] }, 1, 0] } },
          lastMonthBookings: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$bookingDate', ranges.lastMonthStart] }, { $lte: ['$bookingDate', ranges.lastMonthEnd] }] },
                1, 0,
              ],
            },
          },
          totalRevenue: { $sum: '$finalAmount' },
          revenueThisMonth: {
            $sum: { $cond: [{ $gte: ['$bookingDate', ranges.thisMonthStart] }, '$finalAmount', 0] },
          },
        },
      },
    ]),

    Payment.aggregate([
      { $match: paymentScope },
      {
        $group: {
          _id: null,
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
          dueSoon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'Pending'] },
                    { $lte: ['$dueDate', new Date(ranges.now.getTime() + 7 * 86_400_000)] },
                    { $gte: ['$dueDate', ranges.now] },
                  ],
                },
                1, 0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const ls = leadStats[0] ?? { total: 0, newToday: 0, newThisMonth: 0, newLastMonth: 0, converted: 0 };
  const fs = followUpStats[0] ?? { total: 0, completed: 0, overdue: 0 };
  const vs = visitStats[0] ?? { total: 0, confirmed: 0, completed: 0 };
  const bs = bookingStats[0] ?? { total: 0, yesterdayBookings: 0, thisMonthBookings: 0, lastMonthBookings: 0, totalRevenue: 0, revenueThisMonth: 0 };
  const ps = paymentStats[0] ?? { pending: 0, overdue: 0, dueSoon: 0 };

  const conversionRate = ls.total > 0 ? parseFloat(((ls.converted / ls.total) * 100).toFixed(1)) : 0;
  const dailyAvgLastMonth = ls.newLastMonth > 0 ? ls.newLastMonth / 30 : 0;
  const newLeadsTrendPct = dailyAvgLastMonth > 0
    ? parseFloat((((ls.newToday - dailyAvgLastMonth) / dailyAvgLastMonth) * 100).toFixed(1))
    : 0;

  return {
    totalLeads: ls.total,
    newLeadsToday: ls.newToday,
    newLeadsThisMonth: ls.newThisMonth,
    newLeadsLastMonth: ls.newLastMonth,
    newLeadsTrendPct,
    todayFollowUps: fs.total,
    todayFollowUpsDone: fs.completed,
    overdueFollowUps: fs.overdue,
    todayVisits: vs.total,
    todayVisitsConfirmed: vs.confirmed,
    todayVisitsCompleted: vs.completed,
    yesterdayBookings: bs.yesterdayBookings,
    thisMonthBookings: bs.thisMonthBookings,
    lastMonthBookings: bs.lastMonthBookings,
    totalRevenue: bs.totalRevenue,
    revenueThisMonth: bs.revenueThisMonth,
    pendingPayments: ps.pending,
    overduePayments: ps.overdue,
    dueSoonPayments: ps.dueSoon,
    conversionRate,
  };
};

// ─── 2. Project Inventory ─────────────────────────────────────────────────────
// GET /api/v1/dashboard/project-inventory?projectId=<id|all>

export const getProjectInventoryService = async (projectId?: string) => {
  const matchProject: Record<string, any> =
    projectId && projectId !== 'all'
      ? { _id: new mongoose.Types.ObjectId(projectId) }
      : { status: { $in: ['ACTIVE', 'ONGOING', 'UPCOMING', 'COMPLETED'] } };

  const projects = await Project.find(matchProject).select('_id name totalUnits status').lean();
  const projectIds = projects.map((p) => p._id);

  const unitCounts = await Unit.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const Lead = mongoose.model('Lead');
  const leadCounts = await Lead.aggregate([
    { $match: { interestedProject: { $in: projectIds }, status: { $nin: ['DUPLICATE', 'LOST'] } } },
    { $group: { _id: '$interestedProject', count: { $sum: 1 } } },
  ]);

  const unitMap: Record<string, { available: number; booked: number; sold: number }> = {};
  unitCounts.forEach((u) => {
    const pid = u._id.project.toString();
    if (!unitMap[pid]) unitMap[pid] = { available: 0, booked: 0, sold: 0 };
    if (u._id.status === 'Available') unitMap[pid].available = u.count;
    if (u._id.status === 'Booked') unitMap[pid].booked = u.count;
    if (u._id.status === 'Sold') unitMap[pid].sold = u.count;
  });

  const leadMap: Record<string, number> = {};
  leadCounts.forEach((l) => { leadMap[l._id.toString()] = l.count; });

  return projects.map((p) => {
    const pid = p._id.toString();
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

// ─── 3. Employee Performance ──────────────────────────────────────────────────
// GET /api/v1/dashboard/employee-performance

export const getEmployeePerformanceService = async (userId: string, role: string) => {
  const ranges = getDateRanges();
  const Lead = mongoose.model('Lead');
  const FollowUp = mongoose.model('FollowUp');

  const userFilter =
    role === 'SALES_EXECUTIVE'
      ? { _id: new mongoose.Types.ObjectId(userId) }
      : { role: 'SALES_EXECUTIVE', isActive: true };

  const executives = await mongoose.model('User').find(userFilter).select('_id name role').lean<{ _id: mongoose.Types.ObjectId; name: string; role: string }[]>();
  const execIds = executives.map((e) => e._id);

  const [followupData, leadData, bookingData, callData, visitData] = await Promise.all([
    FollowUp.aggregate([
      {
        $match: {
          assignedTo: { $in: execIds },
          type: { $ne: 'Site Visit' },
          scheduledAt: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
          status: { $in: ['SCHEDULED', 'PENDING', 'COMPLETED'] },
        },
      },
      { $group: { _id: '$assignedTo', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } } } },
    ]),

    Lead.aggregate([
      { $match: { assignedTo: { $in: execIds }, status: { $nin: ['DUPLICATE'] } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          converted: { $sum: { $cond: [{ $in: ['$status', ['CLOSED', 'BOOKED']] }, 1, 0] } },
        },
      },
    ]),

    Booking.aggregate([
      {
        $match: {
          bookedBy: { $in: execIds },
          bookingDate: { $gte: ranges.thisMonthStart },
          status: { $ne: 'Cancelled' },
        },
      },
      { $group: { _id: '$bookedBy', deals: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
    ]),

    Call.aggregate([
      {
        $match: {
          loggedBy: { $in: execIds },
          callDate: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
        },
      },
      { $group: { _id: '$loggedBy', count: { $sum: 1 } } },
    ]),

    FollowUp.aggregate([
      {
        $match: {
          assignedTo: { $in: execIds },
          type: 'Site Visit',
          scheduledAt: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
          status: { $in: ['SCHEDULED', 'PENDING', 'COMPLETED'] },
        },
      },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]),
  ]);

  const fuMap: Record<string, { total: number; done: number }> = {};
  followupData.forEach((d) => { fuMap[d._id.toString()] = { total: d.total, done: d.done }; });

  const ldMap: Record<string, { total: number; converted: number }> = {};
  leadData.forEach((d) => { ldMap[d._id.toString()] = { total: d.total, converted: d.converted }; });

  const bkMap: Record<string, { deals: number; revenue: number }> = {};
  bookingData.forEach((d) => { bkMap[d._id.toString()] = { deals: d.deals, revenue: d.revenue }; });

  const callMap: Record<string, number> = {};
  callData.forEach((d) => { callMap[d._id.toString()] = d.count; });

  const visitMap: Record<string, number> = {};
  visitData.forEach((d) => { visitMap[d._id.toString()] = d.count; });

  return executives.map((e) => {
    const id = e._id.toString();
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

// ─── 4. Top Performers ────────────────────────────────────────────────────────
// GET /api/v1/dashboard/top-performers?limit=5

export const getTopPerformersService = async (
  userId: string,
  role: string,
  limit = 5
) => {
  const ranges = getDateRanges();
  const execFilter = role === 'SALES_EXECUTIVE' ? { 'user._id': new mongoose.Types.ObjectId(userId) } : {};

  const performers = await Booking.aggregate([
    { $match: { bookingDate: { $gte: ranges.thisMonthStart }, status: { $ne: 'Cancelled' } } },
    { $group: { _id: '$bookedBy', dealsClosedMonth: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
    { $sort: { dealsClosedMonth: -1, revenue: -1 } },
    { $limit: limit * 2 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.isActive': true, ...execFilter } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        dealsClosedMonth: 1,
        revenue: 1,
      },
    },
  ]);

  const Lead = mongoose.model('Lead');
  const execIds = performers.map((p) => p.userId);

  const convRates = await Lead.aggregate([
    { $match: { assignedTo: { $in: execIds }, status: { $nin: ['DUPLICATE'] } } },
    {
      $group: {
        _id: '$assignedTo',
        total: { $sum: 1 },
        converted: { $sum: { $cond: [{ $in: ['$status', ['CLOSED', 'BOOKED']] }, 1, 0] } },
      },
    },
  ]);

  const crMap: Record<string, number> = {};
  convRates.forEach((c) => {
    crMap[c._id.toString()] = c.total > 0 ? parseFloat(((c.converted / c.total) * 100).toFixed(1)) : 0;
  });

  return performers.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    name: p.name,
    dealsClosedMonth: p.dealsClosedMonth,
    revenue: p.revenue,
    conversionRate: crMap[p.userId.toString()] ?? 0,
  }));
};

// ─── 5. Today's Site Visits ───────────────────────────────────────────────────
// GET /api/v1/dashboard/today-visits?projectId=<id|all>

export const getTodayVisitsService = async (
  userId: string,
  role: string,
  projectId?: string
) => {
  const ranges = getDateRanges();
  const FollowUp = mongoose.model('FollowUp');

  const assignedFilter = role === 'SALES_EXECUTIVE' ? { assignedTo: new mongoose.Types.ObjectId(userId) } : {};

  const visits = await FollowUp.find({
    ...assignedFilter,
    type: 'Site Visit',
    scheduledAt: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
    status: { $in: ['SCHEDULED', 'PENDING', 'COMPLETED', 'RESCHEDULED'] },
  })
    .populate('assignedTo', 'name')
    .populate({
      path: 'lead',
      select: 'name phone interestedProject interestedUnit',
      populate: [
        { path: 'interestedProject', select: 'name' },
        { path: 'interestedUnit', select: 'unitNumber' },
      ],
    })
    .sort({ scheduledAt: 1 })
    .lean();

  return (visits as any[])
    .filter((v) => {
      if (!projectId || projectId === 'all') return true;
      return v.lead?.interestedProject?._id?.toString() === projectId;
    })
    .map((v) => ({
      id: v._id,
      time: v.scheduledAt,
      clientName: v.lead?.name ?? 'Unknown',
      clientPhone: v.lead?.phone ?? '',
      projectName: v.lead?.interestedProject?.name ?? '',
      unitNumber: v.lead?.interestedUnit?.unitNumber ?? '',
      executiveName: v.assignedTo?.name ?? '',
      status: v.status === 'SCHEDULED' ? 'confirmed' : v.status === 'COMPLETED' ? 'completed' : 'pending',
      notes: v.notes ?? '',
    }));
};

// ─── 6. Payment Alerts ────────────────────────────────────────────────────────
// GET /api/v1/dashboard/payment-alerts?limit=10

export const getPaymentAlertsService = async (userId: string, role: string, limit = 10) => {
  const ranges = getDateRanges();
  const paymentScope = role === 'SALES_EXECUTIVE' ? { recordedBy: new mongoose.Types.ObjectId(userId) } : {};
  const sevenDaysFromNow = new Date(ranges.now.getTime() + 7 * 86_400_000);

  const payments = await Payment.find({
    ...paymentScope,
    status: { $in: ['Pending', 'Overdue'] },
    dueDate: { $lte: sevenDaysFromNow },
  })
    .sort({ dueDate: 1 })
    .limit(limit)
    .populate('client', 'name phone')
    .populate({ path: 'booking', select: 'project unit', populate: [{ path: 'project', select: 'name' }, { path: 'unit', select: 'unitNumber' }] })
    .lean();

  return (payments as any[]).map((p) => {
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
      id: p._id,
      clientName: p.client?.name ?? 'Unknown',
      clientPhone: p.client?.phone ?? '',
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

// ─── 7. Lead Trends ───────────────────────────────────────────────────────────
// GET /api/v1/dashboard/lead-trends?period=daily|weekly|monthly&range=30&projectId=<id|all>

export const getLeadTrendsService = async (
  userId: string,
  role: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  range = 30,
  projectId?: string
) => {
  const now = new Date();
  const leadScope = role === 'SALES_EXECUTIVE' ? { assignedTo: new mongoose.Types.ObjectId(userId) } : {};
  const projectFilter =
    projectId && projectId !== 'all'
      ? { interestedProject: new mongoose.Types.ObjectId(projectId) }
      : {};
  const Lead = mongoose.model('Lead');

  if (period === 'daily') {
    const start = new Date(now);
    start.setDate(start.getDate() - range);
    start.setHours(0, 0, 0, 0);

    const data = await Lead.aggregate([
      { $match: { ...leadScope, ...projectFilter, createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          converted: { $sum: { $cond: [{ $in: ['$status', ['CLOSED', 'BOOKED']] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return data.map((d) => ({ date: d._id, leads: d.count, conversions: d.converted }));
  }

  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(start.getDate() - range * 7);
    start.setHours(0, 0, 0, 0);

    const data = await Lead.aggregate([
      { $match: { ...leadScope, ...projectFilter, createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $isoWeek: '$createdAt' },
          year: { $first: { $isoWeekYear: '$createdAt' } },
          count: { $sum: 1 },
          converted: { $sum: { $cond: [{ $in: ['$status', ['CLOSED', 'BOOKED']] }, 1, 0] } },
        },
      },
      { $sort: { year: 1, _id: 1 } },
    ]);

    return data.map((d) => ({ week: `W${d._id} ${d.year}`, leads: d.count, conversions: d.converted }));
  }

  // monthly
  const start = new Date(now.getFullYear(), now.getMonth() - range + 1, 1);

  const data = await Lead.aggregate([
    { $match: { ...leadScope, ...projectFilter, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
        converted: { $sum: { $cond: [{ $in: ['$status', ['CLOSED', 'BOOKED']] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return data.map((d) => ({ month: `${months[d._id.month - 1]} ${d._id.year}`, leads: d.count, conversions: d.converted }));
};

// ─── 8. Lead Funnel ───────────────────────────────────────────────────────────
// GET /api/v1/dashboard/lead-funnel?projectId=<id|all>

export const getLeadFunnelService = async (
  userId: string,
  role: string,
  projectId?: string
) => {
  const leadScope = role === 'SALES_EXECUTIVE' ? { assignedTo: new mongoose.Types.ObjectId(userId) } : {};
  const projectFilter =
    projectId && projectId !== 'all'
      ? { interestedProject: new mongoose.Types.ObjectId(projectId) }
      : {};
  const Lead = mongoose.model('Lead');

  const counts = await Lead.aggregate([
    { $match: { ...leadScope, ...projectFilter, status: { $nin: ['DUPLICATE'] } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

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
  counts.forEach((c) => { countMap[c._id] = c.count; });

  return stages.map((s) => ({ status: s.key, label: s.label, count: countMap[s.key] ?? 0 }));
};

// ─── 9. Lead Sources ──────────────────────────────────────────────────────────
// GET /api/v1/dashboard/lead-sources?projectId=<id|all>&period=thisMonth|lastMonth|allTime

export const getLeadSourcesService = async (
  userId: string,
  role: string,
  period: 'thisMonth' | 'lastMonth' | 'allTime' = 'thisMonth',
  projectId?: string
) => {
  const ranges = getDateRanges();
  const leadScope = role === 'SALES_EXECUTIVE' ? { assignedTo: new mongoose.Types.ObjectId(userId) } : {};
  const projectFilter =
    projectId && projectId !== 'all'
      ? { interestedProject: new mongoose.Types.ObjectId(projectId) }
      : {};
  const Lead = mongoose.model('Lead');

  let dateFilter: Record<string, any> = {};
  if (period === 'thisMonth') dateFilter = { createdAt: { $gte: ranges.thisMonthStart } };
  if (period === 'lastMonth') dateFilter = { createdAt: { $gte: ranges.lastMonthStart, $lte: ranges.lastMonthEnd } };

  const data = await Lead.aggregate([
    { $match: { ...leadScope, ...projectFilter, ...dateFilter, status: { $nin: ['DUPLICATE'] } } },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        converted: { $sum: { $cond: [{ $in: ['$status', ['CLOSED', 'BOOKED']] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const total = data.reduce((s, d) => s + d.count, 0);

  return data.map((d) => ({
    source: d._id ?? 'Unknown',
    count: d.count,
    converted: d.converted,
    percentage: total > 0 ? parseFloat(((d.count / total) * 100).toFixed(1)) : 0,
    conversionRate: d.count > 0 ? parseFloat(((d.converted / d.count) * 100).toFixed(1)) : 0,
  }));
};

// ─── 10. Today's Work (for logged-in user) ────────────────────────────────────
// GET /api/v1/dashboard/today-work

export const getTodayWorkService = async (userId: string) => {
  const ranges = getDateRanges();
  const uid = new mongoose.Types.ObjectId(userId);
  const FollowUp = mongoose.model('FollowUp');
  const Lead = mongoose.model('Lead');

  const [followUps, visits, newLeads, overdueItems] = await Promise.all([
    FollowUp.find({
      assignedTo: uid,
      type: { $ne: 'Site Visit' },
      scheduledAt: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
      status: { $in: ['SCHEDULED', 'PENDING'] },
    })
      .populate('lead', 'name phone status')
      .sort({ scheduledAt: 1 })
      .lean(),

    FollowUp.find({
      assignedTo: uid,
      type: 'Site Visit',
      scheduledAt: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
      status: { $in: ['SCHEDULED', 'PENDING'] },
    })
      .populate({ path: 'lead', select: 'name phone interestedProject', populate: { path: 'interestedProject', select: 'name' } })
      .sort({ scheduledAt: 1 })
      .lean(),

    Lead.find({
      assignedTo: uid,
      createdAt: { $gte: ranges.todayStart, $lt: ranges.todayEnd },
      status: { $nin: ['DUPLICATE'] },
    })
      .select('name phone source status createdAt')
      .sort({ createdAt: -1 })
      .lean(),

    FollowUp.find({
      assignedTo: uid,
      scheduledAt: { $lt: ranges.todayStart },
      status: { $in: ['SCHEDULED', 'PENDING'] },
    })
      .populate('lead', 'name phone status')
      .sort({ scheduledAt: 1 })
      .limit(10)
      .lean(),
  ]);

  return {
    followUps: (followUps as any[]).map((f) => ({
      id: f._id,
      time: f.scheduledAt,
      type: f.type,
      leadName: f.lead?.name ?? 'Unknown',
      leadPhone: f.lead?.phone ?? '',
      leadStatus: f.lead?.status ?? '',
      notes: f.notes ?? '',
    })),
    visits: (visits as any[]).map((v) => ({
      id: v._id,
      time: v.scheduledAt,
      leadName: v.lead?.name ?? 'Unknown',
      leadPhone: v.lead?.phone ?? '',
      projectName: v.lead?.interestedProject?.name ?? '',
      notes: v.notes ?? '',
    })),
    newLeadsAssigned: (newLeads as any[]).map((l) => ({
      id: l._id,
      name: l.name,
      phone: l.phone,
      source: l.source,
      status: l.status,
      assignedAt: l.createdAt,
    })),
    overdueFollowUps: (overdueItems as any[]).map((f) => ({
      id: f._id,
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

// ─── 11. Reminders (upcoming follow-ups for logged-in user) ───────────────────
// GET /api/v1/dashboard/reminders?hours=4

export const getRemindersService = async (userId: string, hoursAhead = 4) => {
  const ranges = getDateRanges();
  const uid = new mongoose.Types.ObjectId(userId);
  const FollowUp = mongoose.model('FollowUp');

  const windowEnd = new Date(ranges.now.getTime() + hoursAhead * 3_600_000);

  const [upcoming, overdue] = await Promise.all([
    FollowUp.find({
      assignedTo: uid,
      scheduledAt: { $gte: ranges.now, $lte: windowEnd },
      status: { $in: ['SCHEDULED', 'PENDING'] },
    })
      .populate('lead', 'name phone')
      .sort({ scheduledAt: 1 })
      .lean(),

    FollowUp.find({
      assignedTo: uid,
      scheduledAt: { $lt: ranges.now },
      status: { $in: ['SCHEDULED', 'PENDING'] },
    })
      .populate('lead', 'name phone')
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean(),
  ]);

  return {
    upcoming: (upcoming as any[]).map((f) => ({
      id: f._id,
      type: f.type,
      scheduledAt: f.scheduledAt,
      leadName: f.lead?.name ?? 'Unknown',
      leadPhone: f.lead?.phone ?? '',
      notes: f.notes ?? '',
      minutesUntil: Math.round((new Date(f.scheduledAt).getTime() - ranges.now.getTime()) / 60_000),
    })),
    overdue: (overdue as any[]).map((f) => ({
      id: f._id,
      type: f.type,
      scheduledAt: f.scheduledAt,
      leadName: f.lead?.name ?? 'Unknown',
      leadPhone: f.lead?.phone ?? '',
      notes: f.notes ?? '',
      minutesOverdue: Math.round((ranges.now.getTime() - new Date(f.scheduledAt).getTime()) / 60_000),
    })),
  };
};

// ─── 12. Revenue by Project ───────────────────────────────────────────────────
// GET /api/v1/dashboard/revenue-by-project

export const getRevenueByProjectService = async () => {
  const ranges = getDateRanges();

  return Booking.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: '$project',
        totalRevenue: { $sum: '$finalAmount' },
        revenueThisMonth: { $sum: { $cond: [{ $gte: ['$bookingDate', ranges.thisMonthStart] }, '$finalAmount', 0] } },
        dealsTotal: { $sum: 1 },
        dealsThisMonth: { $sum: { $cond: [{ $gte: ['$bookingDate', ranges.thisMonthStart] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
    { $unwind: '$project' },
    {
      $project: {
        _id: 0,
        projectId: '$_id',
        projectName: '$project.name',
        totalRevenue: 1,
        revenueThisMonth: 1,
        dealsTotal: 1,
        dealsThisMonth: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
};

// ─── 13. Bookings Trend (weekly, current month) ───────────────────────────────
// GET /api/v1/dashboard/bookings-trend

export const getBookingsTrendService = async (userId: string, role: string) => {
  const Lead = mongoose.model('Lead');
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const leadScope: Record<string, any> =
    role === 'SALES_EXECUTIVE' ? { assignedTo: new mongoose.Types.ObjectId(userId) } : {};
  const bookingScope: Record<string, any> =
    role === 'SALES_EXECUTIVE' ? { bookedBy: new mongoose.Types.ObjectId(userId) } : {};

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
        Lead.countDocuments({ ...leadScope, createdAt: { $gte: week.start, $lte: week.end } }),
        Booking.countDocuments({
          ...bookingScope,
          bookingDate: { $gte: week.start, $lte: week.end },
          status: { $in: ['Active', 'Completed'] },
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
