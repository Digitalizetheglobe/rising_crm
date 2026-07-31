import User from './user.model';
import { ApiError } from '../../utils/ApiError';
import Lead from '../leads/lead.model';
import Booking from '../bookings/booking.model';
import { normalizeRole } from '../../constants/roles';
import { Op } from 'sequelize';
import sequelize from '../../config/sequelize';
import { getTenantId } from '../../middleware/tenant.middleware';

const attachUserStats = async (users: any[]) => {
    if (!users.length) return [];

    const userIds = users.map((u) => u.id);
    const tenantId = getTenantId();

    const [leadStats, bookingStats] = await Promise.all([
        Lead.findAll({
            attributes: [
                'assignedTo',
                [sequelize.fn('COUNT', sequelize.col('id')), 'assignedLeads'],
                [
                    sequelize.fn('SUM', sequelize.literal(`CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END`)),
                    'dealsClosed'
                ]
            ],
            where: { assignedTo: { [Op.in]: userIds }, tenantId },
            group: ['assignedTo']
        }),
        Booking.findAll({
            attributes: [
                'bookedBy',
                [sequelize.fn('SUM', sequelize.col('finalAmount')), 'revenueGenerated']
            ],
            where: {
                bookedBy: { [Op.in]: userIds },
                status: { [Op.in]: ['Active', 'Completed'] },
                tenantId
            },
            group: ['bookedBy']
        })
    ]);

    const leadMap = new Map(leadStats.map((s: any) => [s.assignedTo, { assignedLeads: parseInt(s.getDataValue('assignedLeads') || '0', 10), dealsClosed: parseInt(s.getDataValue('dealsClosed') || '0', 10) }]));
    const bookingMap = new Map(bookingStats.map((s: any) => [s.bookedBy, { revenueGenerated: parseFloat(s.getDataValue('revenueGenerated') || '0') }]));

    const enriched = users.map((user) => {
        const id = user.id;
        const leads = leadMap.get(id) || { assignedLeads: 0, dealsClosed: 0 };
        const booking = bookingMap.get(id) || { revenueGenerated: 0 };
        const conversionRate =
            leads.assignedLeads > 0
                ? Math.round((leads.dealsClosed / leads.assignedLeads) * 100)
                : 0;

        const obj = user.toJSON ? user.toJSON() : user;

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
    const tenantId = getTenantId();
    const query: any = { tenantId };
    if (role) {
        query.role = role;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
        where: query,
        attributes: { exclude: ['password'] },
        offset,
        limit,
        order: [['createdAt', 'DESC']]
    });

    const usersWithStats = await attachUserStats(rows);

    return {
        users: usersWithStats,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

export const getUserById = async (id: string) => {
    const tenantId = getTenantId();
    const user = await User.findOne({
        where: { id, tenantId },
        attributes: { exclude: ['password'] }
    });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    const usersWithStats = await attachUserStats([user]);
    return usersWithStats[0];
};

export const createUser = async (data: any) => {
    const tenantId = getTenantId();
    
    // Check if email is already taken
    const existingUser = await User.findOne({ where: { email: data.email, tenantId } });
    if (existingUser) {
        throw new ApiError(400, 'Email is already in use');
    }

    if (data.role) {
        const normalizedRole = normalizeRole(data.role);
        const uniqueRoles = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "FINANCIAL_EXECUTIVE"];
        if (uniqueRoles.includes(normalizedRole)) {
            const existingRoleUser = await User.findOne({ where: { role: { [Op.in]: [normalizedRole, data.role] }, tenantId } });
            if (existingRoleUser) {
                throw new ApiError(400, "This role has already been registered. Please contact the Super Admin.");
            }
        }
    }

    const user = await User.create({ ...data, tenantId });
    
    const { password: _password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
};

export const updateUser = async (id: string, data: any) => {
    const tenantId = getTenantId();
    const user = await User.findOne({ where: { id, tenantId } });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: data.email, tenantId } });
        if (existingUser) {
            throw new ApiError(400, 'Email is already in use');
        }
    }

    if (data.role && data.role !== user.role) {
        const normalizedRole = normalizeRole(data.role);
        const uniqueRoles = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "FINANCIAL_EXECUTIVE"];
        if (uniqueRoles.includes(normalizedRole)) {
            const existingRoleUser = await User.findOne({ where: { role: { [Op.in]: [normalizedRole, data.role] }, tenantId } });
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
    
    const { password: _password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
};

export const deleteUser = async (id: string) => {
    const tenantId = getTenantId();
    const user = await User.findOne({ where: { id, tenantId } });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    await user.destroy();
    return user;
};
