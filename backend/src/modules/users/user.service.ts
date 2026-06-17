import { User } from './user.model';
import { ApiError } from '../../utils/ApiError';
import { Lead } from '../leads/lead.model';
import { Booking } from '../bookings/booking.model';
import { normalizeRole } from '../../constants/roles';

const attachUserStats = async (users: any[]) => {
    if (!users.length) return [];

    const userIds = users.map((u) => u._id);

    const [leadStats, bookingStats] = await Promise.all([
        Lead.aggregate([
            { $match: { assignedTo: { $in: userIds } } },
            {
                $group: {
                    _id: '$assignedTo',
                    assignedLeads: { $sum: 1 },
                    dealsClosed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
                },
            },
        ]),
        Booking.aggregate([
            {
                $match: {
                    bookedBy: { $in: userIds },
                    status: { $in: ['Active', 'Completed'] },
                },
            },
            {
                $group: {
                    _id: '$bookedBy',
                    revenueGenerated: { $sum: '$finalAmount' },
                },
            },
        ]),
    ]);

    const leadMap = new Map(leadStats.map((s) => [s._id.toString(), s]));
    const bookingMap = new Map(bookingStats.map((s) => [s._id.toString(), s]));

    const enriched = users.map((user) => {
        const id = user._id.toString();
        const leads = leadMap.get(id) || { assignedLeads: 0, dealsClosed: 0 };
        const booking = bookingMap.get(id) || { revenueGenerated: 0 };
        const conversionRate =
            leads.assignedLeads > 0
                ? Math.round((leads.dealsClosed / leads.assignedLeads) * 100)
                : 0;

        const obj = typeof user.toObject === 'function' ? user.toObject() : user;

        return {
            ...obj,
            stats: {
                assignedLeads: leads.assignedLeads,
                dealsClosed: leads.dealsClosed,
                conversionRate,
                revenueGenerated: booking.revenueGenerated,
            },
        };
    });

    const maxConversion = Math.max(...enriched.map((u) => u.stats.conversionRate), 0);

    return enriched.map((user) => ({
        ...user,
        performanceTag:
            user.stats.dealsClosed >= 3 &&
            user.stats.conversionRate >= 40 &&
            user.stats.conversionRate === maxConversion &&
            maxConversion > 0
                ? 'Top performance'
                : user.stats.conversionRate >= 30
                  ? 'Good performance'
                  : null,
    }));
};

export const getAllUsers = async (page: number = 1, limit: number = 10, role?: string) => {
    const query: Record<string, unknown> = {};
    if (role) {
        query.role = role;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);
    const usersWithStats = await attachUserStats(users);

    return {
        users: usersWithStats,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getUserById = async (id: string) => {
    const user = await User.findById(id).select('-password');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    const usersWithStats = await attachUserStats([user]);
    return usersWithStats[0];
};

export const createUser = async (data: any) => {
    // Check if email is already taken
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
        throw new ApiError(400, 'Email is already in use');
    }

    if (data.role) {
        const normalizedRole = normalizeRole(data.role);
        const uniqueRoles = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "FINANCIAL_EXECUTIVE"];
        if (uniqueRoles.includes(normalizedRole)) {
            const existingRoleUser = await User.findOne({ role: { $in: [normalizedRole, data.role] } });
            if (existingRoleUser) {
                throw new ApiError(400, "This role has already been registered. Please contact the Super Admin.");
            }
        }
    }

    const user = new User(data);
    await user.save();
    
    const { password: _password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
};

export const updateUser = async (id: string, data: any) => {
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            throw new ApiError(400, 'Email is already in use');
        }
    }

    if (data.role && data.role !== user.role) {
        const normalizedRole = normalizeRole(data.role);
        const uniqueRoles = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "FINANCIAL_EXECUTIVE"];
        if (uniqueRoles.includes(normalizedRole)) {
            const existingRoleUser = await User.findOne({ role: { $in: [normalizedRole, data.role] } });
            if (existingRoleUser) {
                throw new ApiError(400, "This role has already been registered. Please contact the Super Admin.");
            }
        }
    }

    // Assign new fields
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.password) user.password = data.password; // pre-save hook will hash it
    if (data.role) user.role = data.role;
    if (data.phone !== undefined) user.phone = data.phone || undefined;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    await user.save();
    
    const { password: _password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
};

export const deleteUser = async (id: string) => {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    return user;
};
