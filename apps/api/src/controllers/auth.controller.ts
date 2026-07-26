import { Request, Response } from "express";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/config/prisma";
import { hashPassword, comparePassword } from "@/utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { env } from "@/config/env";
import { AppError } from "@/middleware/errorHandler";
import { sendEmail, passwordResetEmail } from "@/services/email.service";
import { Role } from "@prisma/client";

const googleClient = new OAuth2Client(env.google.clientId);

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  country: z.string().optional(), // e.g. US, CA, DE, TR, GB, AU, AE, SA
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const googleLoginSchema = z.object({
  idToken: z.string(),
});

function issueTokens(user: { id: string; email: string; role: Role }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);
  return { accessToken, refreshToken };
}

async function storeRefreshToken(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
}

/** POST /api/auth/register */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError("An account with this email already exists.", 409);

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      phone: data.phone,
      country: data.country,
      role: Role.CUSTOMER,
    },
  });

  const tokens = issueTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);

  res.status(201).json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    ...tokens,
  });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.passwordHash) {
    throw new AppError("Invalid email or password.", 401);
  }
  const valid = await comparePassword(data.password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password.", 401);
  if (!user.isActive) throw new AppError("This account has been deactivated.", 403);

  const tokens = issueTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);

  res.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    ...tokens,
  });
});

/** POST /api/auth/google — verifies a Google ID token from the frontend Google Sign-In button */
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = googleLoginSchema.parse(req.body);

  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.google.clientId });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new AppError("Invalid Google token.", 401);

  let user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        fullName: payload.name ?? payload.email.split("@")[0],
        googleId: payload.sub,
        emailVerified: true,
        role: Role.CUSTOMER,
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
  }

  const tokens = issueTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);

  res.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    ...tokens,
  });
});

/** POST /api/auth/refresh */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.body.refreshToken as string | undefined;
  if (!token) throw new AppError("Missing refresh token.", 400);

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError("Refresh token invalid or expired.", 401);
  }

  const decoded = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) throw new AppError("User not found.", 404);

  const tokens = issueTokens(user);
  await prisma.refreshToken.update({ where: { token }, data: { revoked: true } });
  await storeRefreshToken(user.id, tokens.refreshToken);

  res.json(tokens);
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.body.refreshToken as string | undefined;
  if (token) {
    await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
  }
  res.status(204).send();
});

/** POST /api/auth/forgot-password — always responds 200 so email existence isn't leaked */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.passwordHash) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
    const mail = passwordResetEmail(resetUrl);
    // Password reset comes from the support address, not orders@.
    await sendEmail({ to: user.email, from: env.email.fromSupport, ...mail });
  }

  res.json({ success: true });
});

/** POST /api/auth/reset-password */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = z
    .object({ token: z.string().min(10), newPassword: z.string().min(8) })
    .parse(req.body);

  const stored = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!stored || stored.used || stored.expiresAt < new Date()) {
    throw new AppError("This reset link is invalid or has expired. Please request a new one.", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { id: stored.id }, data: { used: true } });
  // Sign out all existing sessions for safety.
  await prisma.refreshToken.updateMany({ where: { userId: stored.userId }, data: { revoked: true } });

  res.json({ success: true });
});
