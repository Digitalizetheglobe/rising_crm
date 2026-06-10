
import mongoose from 'mongoose';
import { Booking } from '../bookings/booking.model';
import { Payment } from '../payments/payment.model';
import { Loan } from '../loans/loan.model';

// Helper to build the start of today, this month, last month
const getDateRanges = () => {
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  return { now, todayStart, thisMonthStart, lastMonthStart, lastMonthEnd, thisYearStart };
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const getDashboardService = async (UserId: string, role: string) => {
  const { now, todayStart, thisMonthStart, lastMonthStart, lastMonthEnd, thisYearStart } =
    getDateRanges();

  // Scope filter for SALES_EXECUTIVE
  const leadScope: Record<string, any> = {};
  const bookingScope: Record<string, any> = {};
  const paymentScope: Record<string, any> = {};
  const loanScope: Record<string, any> = {};

  if (role === 'SALES_EXECUTIVE') {
    leadScope.assignedTo = new mongoose.Types.ObjectId(UserId);
    bookingScope.bookedBy = new mongoose.Types.ObjectId(UserId);
    paymentScope.recordedBy = new mongoose.Types.ObjectId(UserId);
    loanScope.createdBy = new mongoose.Types.ObjectId(UserId);
  }

  const Lead = mongoose.model('Lead');
  const FollowUp = mongoose.model('FollowUp');

  const [
    leadStats,
    leadsByStatus,
    followUpStats,
    bookingStats,
    revenueStats,
    paymentStats,
    loanStats,
    topPerformers,
    recentBookings,
    recentPayments,
  ] = await Promise.all([

    // ── Lead counts ──────────────────────────────────────────────────────────
    Lead.aggregate([
      { $match: leadScope },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          newToday: {
            $sum: { $cond: [{ $gte: ['$createdAt', todayStart] }, 1, 0] },
          },
          newThisMonth: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisMonthStart] }, 1, 0] },
          },
          newLastMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', lastMonthStart] },
                    { $lte: ['$createdAt', lastMonthEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // ── Leads by status ──────────────────────────────────────────────────────
    Lead.aggregate([
      { $match: leadScope },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // ── Follow-up stats ──────────────────────────────────────────────────────
    FollowUp.aggregate([
      {
        $match: {
          ...(role === 'SALES_EXECUTIVE'
            ? { assignedTo: new mongoose.Types.ObjectId(UserId) }
            : {}),
        },
      },
      {
        $group: {
          _id: null,
          overdueCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'PENDING'] }, { $lt: ['$scheduledAt', now] }] },
                1,
                0,
              ],
            },
          },
          dueToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['SCHEDULED', 'PENDING']] },
                    { $gte: ['$scheduledAt', todayStart] },
                    { $lt: ['$scheduledAt', new Date(todayStart.getTime() + 86400000)] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          completedThisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'COMPLETED'] },
                    { $gte: ['$updatedAt', thisMonthStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // ── Booking stats ────────────────────────────────────────────────────────
    Booking.aggregate([
      { $match: bookingScope },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
          thisMonth: {
            $sum: { $cond: [{ $gte: ['$bookingDate', thisMonthStart] }, 1, 0] },
          },
          lastMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$bookingDate', lastMonthStart] },
                    { $lte: ['$bookingDate', lastMonthEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // ── Revenue stats ────────────────────────────────────────────────────────
    Booking.aggregate([
      { $match: { ...bookingScope, status: { $in: ['Active', 'Completed'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          revenueThisMonth: {
            $sum: {
              $cond: [{ $gte: ['$bookingDate', thisMonthStart] }, '$finalAmount', 0],
            },
          },
          revenueLastMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$bookingDate', lastMonthStart] },
                    { $lte: ['$bookingDate', lastMonthEnd] },
                  ],
                },
                '$finalAmount',
                0,
              ],
            },
          }
        }
      }
    ]),

    // ── Payment stats ────────────────────────────────────────────────────────
    Payment.aggregate([
      { $match: paymentScope },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),

    // ── Loan stats ───────────────────────────────────────────────────────────
    Loan.aggregate([
      { $match: loanScope },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // ── Top performers ─────────────────────────────────────────────────────────
    Lead.aggregate([
      { $match: { ...leadScope, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
        },
      },
      { $sort: { converted: -1, totalLeads: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          totalLeads: 1,
          converted: 1,
        },
      },
    ]),

    // ── Recent bookings ──────────────────────────────────────────────────────
    Booking.find(bookingScope)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('client', 'name phone')
      .populate('project', 'name')
      .lean(),

    // ── Recent payments ──────────────────────────────────────────────────────
    Payment.find(paymentScope)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('client', 'name')
      .lean(),
  ]);
  return {
    leadStats, leadsByStatus, followUpStats, bookingStats,
    revenueStats, paymentStats, loanStats, topPerformers,
    recentBookings, recentPayments
  };
};

export const getBookingsTrendService = async (UserId: string, role: string) => {
  const Lead = mongoose.model('Lead');
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const leadScope: Record<string, any> = {};
  const bookingScope: Record<string, any> = {};
  if (role === 'SALES_EXECUTIVE') {
    leadScope.assignedTo = new mongoose.Types.ObjectId(UserId);
    bookingScope.bookedBy = new mongoose.Types.ObjectId(UserId);
  }

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
        Lead.countDocuments({
          ...leadScope,
          createdAt: { $gte: week.start, $lte: week.end },
        }),
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

export const getRevenueByProjectService = async () => {
  return [];
};