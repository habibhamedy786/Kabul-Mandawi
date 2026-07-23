import { Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";
import { hashPassword, comparePassword } from "@/utils/password";
import { Role } from "@prisma/client";

/** Every role except CUSTOMER — used to keep staff and customers strictly separated. */
const STAFF_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.PROCUREMENT_OFFICER,
  Role.DELIVERY_STAFF,
  Role.CUSTOMER_SUPPORT,
];

/** GET /api/users/me */
export const getMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true, email: true, fullName: true, phone: true, country: true,
      role: true, createdAt: true, addresses: true,
    },
  });
  if (!user) throw new AppError("User not found.", 404);
  res.json(user);
});

const updateMeSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email().optional(),
});

/** PATCH /api/users/me */
export const updateMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = updateMeSchema.parse(req.body);

  // Changing the sign-in email: make sure it isn't already taken by someone else.
  if (data.email) {
    data.email = data.email.trim();
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== req.user!.sub) {
      throw new AppError("An account with this email already exists.", 409);
    }
  }

  const user = await prisma.user.update({ where: { id: req.user!.sub }, data });
  res.json(user);
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/** PATCH /api/users/me/password — any signed-in user (admin, staff, customer) changes their own password */
export const changeMyPassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) throw new AppError("User not found.", 404);
  if (!user.passwordHash) {
    throw new AppError("This account signs in with Google and has no password to change.", 400);
  }
  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new AppError("Your current password is incorrect.", 401);

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ success: true });
});

const addressSchema = z.object({
  label: z.string().min(1),
  receiverName: z.string().min(1),
  phone: z.string().min(5),
  city: z.enum(["KABUL", "HERAT", "MAZAR_I_SHARIF", "KANDAHAR", "JALALABAD", "OTHER"]),
  addressLine: z.string().min(3),
  note: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/** GET /api/users/me/addresses */
export const listMyAddresses = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const addresses = await prisma.savedAddress.findMany({ where: { userId: req.user!.sub } });
  res.json(addresses);
});

/** POST /api/users/me/addresses */
export const createMyAddress = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = addressSchema.parse(req.body);
  if (data.isDefault) {
    await prisma.savedAddress.updateMany({ where: { userId: req.user!.sub }, data: { isDefault: false } });
  }
  const address = await prisma.savedAddress.create({ data: { ...data, userId: req.user!.sub } });
  res.status(201).json(address);
});

/** DELETE /api/users/me/addresses/:id */
export const deleteMyAddress = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const address = await prisma.savedAddress.findUnique({ where: { id: req.params.id } });
  if (!address || address.userId !== req.user!.sub) throw new AppError("Address not found.", 404);
  await prisma.savedAddress.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ── Admin: manage all users ──────────────────────────────────────

/** GET /api/admin/users (Super Admin, Admin)
 *  ?role=CUSTOMER for one role, or ?staff=true for all staff (everyone except customers). */
export const adminListUsers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { role, staff, search, page = "1", pageSize = "25" } = req.query as Record<string, string>;
  const take = Number(pageSize);
  const skip = (Number(page) - 1) * take;

  const where = {
    ...(staff === "true" ? { role: { in: STAFF_ROLES } } : {}),
    ...(role ? { role: role as Role } : {}),
    ...(search ? { OR: [
      { fullName: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ] } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, take, skip, orderBy: { createdAt: "desc" },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, country: true, phone: true, createdAt: true } }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: Number(page), pageSize: take });
});

const updateRoleSchema = z.object({ role: z.nativeEnum(Role) });

/** PATCH /api/admin/users/:id/role — change a staff member's position.
 *  Customers can never be promoted, and staff can never be turned into customers,
 *  so customers and staff stay permanently separate. */
export const adminUpdateUserRole = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { role } = updateRoleSchema.parse(req.body);

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError("User not found.", 404);

  if (target.role === Role.CUSTOMER) {
    throw new AppError("Customer accounts cannot be promoted to staff or admin roles.", 403);
  }
  if (role === Role.CUSTOMER) {
    throw new AppError("Staff accounts cannot be converted into customer accounts.", 403);
  }

  const user = await prisma.user.update({ where: { id: target.id }, data: { role } });
  res.json(user);
});

/** PATCH /api/admin/users/:id/status (Super Admin, Admin) — activate/deactivate */
export const adminSetUserActive = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive } });
  res.json(user);
});

const createStaffSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
});

/** POST /api/admin/staff — create a new staff member with an email, position and password */
export const adminCreateStaff = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = createStaffSchema.parse(req.body);

  if (!STAFF_ROLES.includes(data.role)) {
    throw new AppError("Pick a staff position. Customer accounts are created through registration.", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError("An account with this email already exists.", 409);

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      emailVerified: true, // staff are created by an admin, so the email is trusted
    },
    select: { id: true, email: true, fullName: true, role: true, isActive: true, phone: true, createdAt: true },
  });

  res.status(201).json(user);
});

const setPasswordSchema = z.object({ newPassword: z.string().min(8) });

/** PATCH /api/admin/staff/:id/password — admin sets/resets a staff member's password */
export const adminSetStaffPassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { newPassword } = setPasswordSchema.parse(req.body);

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError("Staff member not found.", 404);
  if (target.role === Role.CUSTOMER) {
    throw new AppError("This action is only available for staff accounts.", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash } });
  res.json({ success: true });
});
