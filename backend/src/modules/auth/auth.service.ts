import jwt from "jsonwebtoken";
import User from "./auth.model";

export const registerUser = async (
    name: string,
    email: string,
    password: string,
    role: string
) => {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error("User already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "7d",
        }
    );

    return {
        user,
        token,
    };
};

export const loginUser = async (
    email: string,
    password: string
) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isPasswordMatched =
        await user.comparePassword(password);

    if (!isPasswordMatched) {
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "7d",
        }
    );

    return {
        user,
        token,
    };
};