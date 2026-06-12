import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { loginUser, registerUser, getCurrentUser, getAvailableRoles as getAvailableRolesService } from "./auth.service";

export const getAvailableRoles = async (req: Request, res: Response) => {
    try {
        const roles = await getAvailableRolesService();
        res.status(200).json({
            success: true,
            data: roles,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const register = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, phone, password, role } = req.body;

        const data = await registerUser(name, email, phone, password, role);

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const login = async (req: AuthRequest, res: Response) => {
    try {
        const { identifier, phone, email, password } = req.body;
        const loginIdentifier = identifier || phone || email;

        if (!loginIdentifier || !password) {
            throw new Error("Please provide email/phone and password");
        }

        const data = await loginUser(loginIdentifier, password);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        const user = await getCurrentUser(req.user!.UserId);
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        res.status(401).json({
            success: false,
            message: error.message,
        });
    }
};
