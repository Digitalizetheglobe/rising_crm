import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import User from "./auth.model";
import Session from "./session.model";
import { ROLES, SIGNUP_ALLOWED_ROLES, normalizeRole } from "../../constants/roles";
import { ENV } from "../../config/env";

const generateAccessToken = (user: User) =>
    jwt.sign(
        {
            UserId: user.id,
            role: normalizeRole(user.role),
            tenantId: user.tenantId,
        },
        ENV.JWT_SECRET,
        { expiresIn: "1h" }
    );

const generateRefreshToken = (user: User) =>
    jwt.sign(
        {
            UserId: user.id,
        },
        ENV.JWT_SECRET,
        { expiresIn: "7d" }
    );

const sanitizeUser = (user: User) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: normalizeRole(user.role),
    isActive: user.isActive,
    tenantId: user.tenantId,
});

export const getAvailableRoles = async () => {
    const uniqueRoles = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "FINANCIAL_EXECUTIVE"];
    
    // Sequelize distinct query
    const usersWithRoles = await User.findAll({
        attributes: ['role'],
        where: {
            role: { [Op.in]: uniqueRoles }
        },
        group: ['role']
    });
    
    const takenRoles = usersWithRoles.map(u => u.role);
    const normalizedTaken = takenRoles.map(normalizeRole);

    return uniqueRoles.filter(role => !normalizedTaken.includes(role));
};

export const registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: string,
    ipAddress?: string,
    userAgent?: string
) => {
    const normalizedRole = normalizeRole(role);

    if (!SIGNUP_ALLOWED_ROLES.includes(normalizedRole as (typeof SIGNUP_ALLOWED_ROLES)[number])) {
        throw new Error("Invalid role selected for registration");
    }

    if (normalizedRole === "SALES_EXECUTIVE") {
        throw new Error("Public registration for Sales Executives is disabled. Please contact an Administrator.");
    }

    const uniqueRoles = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "FINANCIAL_EXECUTIVE"];
    if (uniqueRoles.includes(normalizedRole)) {
        const existingRoleUser = await User.findOne({ where: { role: { [Op.in]: [normalizedRole, role] } } });
        if (existingRoleUser) {
            throw new Error("This role has already been registered. Please contact the Super Admin.");
        }
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
        throw new Error("Email is already registered");
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
        throw new Error("Phone number is already registered");
    }

    // TODO: During actual tenant implementation, dynamically resolve tenantId.
    // For now we will use a dummy UUID to satisfy Sequelize constraints for testing.
    const tenantId = '00000000-0000-0000-0000-000000000000'; 

    const user = await User.create({
        name,
        email,
        phone,
        password,
        role: normalizedRole,
        tenantId,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await Session.create({
        userId: user.id,
        tenantId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent,
        isActive: true
    });

    return {
        user: sanitizeUser(user),
        token: accessToken,
        refreshToken,
    };
};

export const loginUser = async (
    identifier: string, 
    password: string,
    ipAddress?: string,
    userAgent?: string
) => {
    const user = await User.findOne({ 
        where: {
            [Op.or]: [{ phone: identifier }, { email: identifier }]
        }
    });

    if (!user) {
        throw new Error("Invalid phone number, email or password");
    }

    if (!user.isActive) {
        throw new Error("Your account has been deactivated. Contact an administrator.");
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        throw new Error("Invalid phone number, email or password");
    }

    const tenantId = user.tenantId;
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await Session.create({
        userId: user.id,
        tenantId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent,
        isActive: true
    });

    return {
        user: sanitizeUser(user),
        token: accessToken,
        refreshToken,
    };
};

export const refreshSession = async (token: string, ipAddress?: string, userAgent?: string) => {
    let decoded: any;
    try {
        decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch {
        throw new Error("Invalid refresh token");
    }

    const session = await Session.findOne({ where: { refreshToken: token, isActive: true } });
    if (!session) {
        throw new Error("Session is expired or inactive");
    }

    if (new Date() > new Date(session.expiresAt)) {
        session.isActive = false;
        await session.save();
        throw new Error("Session has expired");
    }

    const user = await User.findByPk(session.userId);
    if (!user) {
        throw new Error("User associated with session not found");
    }
    if (!user.isActive) {
        throw new Error("User account is deactivated");
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (ipAddress) session.ipAddress = ipAddress;
    if (userAgent) session.userAgent = userAgent;
    await session.save();

    return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

export const logoutSession = async (userId: string, refreshToken?: string) => {
    const whereClause: any = { userId, isActive: true };
    if (refreshToken) {
        whereClause.refreshToken = refreshToken;
    }
    
    await Session.update({ isActive: false }, { where: whereClause });
    return true;
};

export const getCurrentUser = async (userId: string) => {
    // Note: To exclude password we can specify attributes in Sequelize
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
    });
    if (!user) {
        throw new Error("User not found");
    }
    if (!user.isActive) {
        throw new Error("Your account has been deactivated");
    }
    return sanitizeUser(user);
};
