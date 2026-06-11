import jwt from "jsonwebtoken";
import User from "./auth.model";
import { ROLES, SIGNUP_ALLOWED_ROLES, normalizeRole } from "../../constants/roles";

const signToken = (user: { _id: unknown; role: string }) =>
    jwt.sign(
        {
            UserId: user._id,
            role: normalizeRole(user.role),
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
    );

const sanitizeUser = (user: InstanceType<typeof User>) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: normalizeRole(user.role),
    isActive: user.isActive,
});

export const registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: string
) => {
    const normalizedRole = normalizeRole(role);

    if (!SIGNUP_ALLOWED_ROLES.includes(normalizedRole as (typeof SIGNUP_ALLOWED_ROLES)[number])) {
        throw new Error("Invalid role selected for registration");
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        throw new Error("Email is already registered");
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
        throw new Error("Phone number is already registered");
    }

    const user = await User.create({
        name,
        email,
        phone,
        password,
        role: normalizedRole,
    });

    const token = signToken(user);

    return {
        user: sanitizeUser(user),
        token,
    };
};

export const loginUser = async (identifier: string, password: string) => {
    const user = await User.findOne({ 
        $or: [{ phone: identifier }, { email: identifier }] 
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

    const token = signToken(user);

    return {
        user: sanitizeUser(user),
        token,
    };
};

export const getCurrentUser = async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    if (!user) {
        throw new Error("User not found");
    }
    if (!user.isActive) {
        throw new Error("Your account has been deactivated");
    }
    return sanitizeUser(user);
};
