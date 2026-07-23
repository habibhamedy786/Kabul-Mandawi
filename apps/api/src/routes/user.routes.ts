import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import {
  getMe, updateMe, changeMyPassword, listMyAddresses, createMyAddress, deleteMyAddress,
  adminListUsers, adminUpdateUserRole, adminSetUserActive, adminCreateStaff, adminUpdateStaff, adminSetStaffPassword,
} from "@/controllers/user.controller";

const router = Router();

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);
router.patch("/me/password", authenticate, changeMyPassword);
router.get("/me/addresses", authenticate, listMyAddresses);
router.post("/me/addresses", authenticate, createMyAddress);
router.delete("/me/addresses/:id", authenticate, deleteMyAddress);

// Admin user management — mounted again under /api/admin/users in routes/index.ts
export const adminUserRouter = Router();
adminUserRouter.get("/", authenticate, authorize(...ROLES.ANY_ADMIN), adminListUsers);
adminUserRouter.patch("/:id/role", authenticate, authorize(Role.SUPER_ADMIN), adminUpdateUserRole);
adminUserRouter.patch("/:id/status", authenticate, authorize(...ROLES.ANY_ADMIN), adminSetUserActive);

// Staff management — mounted under /api/admin/staff in routes/index.ts.
// Restricted to the Super Admin: only they can create staff/admins,
// change positions, reset passwords, or deactivate staff accounts.
export const adminStaffRouter = Router();
adminStaffRouter.get("/", authenticate, authorize(Role.SUPER_ADMIN), adminListUsers);
adminStaffRouter.post("/", authenticate, authorize(Role.SUPER_ADMIN), adminCreateStaff);
adminStaffRouter.patch("/:id", authenticate, authorize(Role.SUPER_ADMIN), adminUpdateStaff);
adminStaffRouter.patch("/:id/role", authenticate, authorize(Role.SUPER_ADMIN), adminUpdateUserRole);
adminStaffRouter.patch("/:id/password", authenticate, authorize(Role.SUPER_ADMIN), adminSetStaffPassword);
adminStaffRouter.patch("/:id/status", authenticate, authorize(Role.SUPER_ADMIN), adminSetUserActive);

export default router;
