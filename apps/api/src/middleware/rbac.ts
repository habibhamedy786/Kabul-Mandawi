import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthedRequest } from "@/middleware/auth";

/**
 * Role-based access control.
 * Usage: router.post("/products", authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN), handler)
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }
    return next();
  };
}

// Convenience role groups used across routes
export const ROLES = {
  ANY_ADMIN: [Role.SUPER_ADMIN, Role.ADMIN] as Role[],
  ANY_STAFF: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.PROCUREMENT_OFFICER,
    Role.DELIVERY_STAFF,
    Role.CUSTOMER_SUPPORT,
  ] as Role[],
  PROCUREMENT: [Role.SUPER_ADMIN, Role.ADMIN, Role.PROCUREMENT_OFFICER] as Role[],
  DELIVERY: [Role.SUPER_ADMIN, Role.ADMIN, Role.DELIVERY_STAFF] as Role[],
  SUPPORT: [Role.SUPER_ADMIN, Role.ADMIN, Role.CUSTOMER_SUPPORT] as Role[],
  SUPER_ADMIN_ONLY: [Role.SUPER_ADMIN] as Role[],
};
