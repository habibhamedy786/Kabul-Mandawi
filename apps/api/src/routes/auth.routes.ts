import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, googleLogin, refresh, logout, forgotPassword, resetPassword } from "@/controllers/auth.controller";

const router = Router();

// Throttle auth endpoints to slow down credential stuffing / brute force.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
