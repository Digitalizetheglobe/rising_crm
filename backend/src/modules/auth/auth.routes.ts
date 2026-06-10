import express from "express";
import { protect } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { login, register, me } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);

export default router;
