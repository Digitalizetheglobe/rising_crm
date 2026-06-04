import { Request, Response } from "express";
import {
    loginUser,
    registerUser,
} from "./auth.service";

export const register = async (
    req: Request,
    res: Response
) => {
    try {
        const { name, email, password, role } =
            req.body;

        const data = await registerUser(
            name,
            email,
            password,
            role
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const login = async (
    req: Request,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        const data = await loginUser(
            email,
            password
        );

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