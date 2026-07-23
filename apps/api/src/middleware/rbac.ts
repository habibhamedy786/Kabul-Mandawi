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

// Convenience role groups used across routes. Each group answers "who may do
// this kind of action," so a role's real access = every group it appears in.
export const ROLES = {
  // Full administrators — customer & user management, catch-all.
  ANY_ADMIN: [Role.SUPER_ADMIN, Role.ADMIN] as Role[],

  // Anyone with a staff account — used for read-only order visibility.
  ANY_STAFF: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.INVENTORY_MANAGER,
    Role.FINANCE_OFFICER,
    Role.DELIVERY_COORDINATOR,
    Role.MARKETING_MANAGER,
    Role.PROCUREMENT_OFFICER,
    Role.DELIVERY_STAFF,
    Role.CUSTOMER_SUPPORT,
  ] as Role[],

  // Manage the product catalog & categories (incl. photo uploads).
  CATALOG: [Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY_MANAGER, Role.MARKETING_MANAGER] as Role[],

  // Restocking & supplier invoices.
  PROCUREMENT: [Role.SUPER_ADMIN, Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.INVENTORY_MANAGER, Role.OPERATIONS_MANAGER] as Role[],

  // Delivery execution — a staff member's own assignments & proof uploads.
  DELIVERY: [Role.SUPER_ADMIN, Role.ADMIN, Role.DELIVERY_STAFF, Role.DELIVERY_COORDINATOR, Role.OPERATIONS_MANAGER] as Role[],

  // Assigning delivery staff to orders.
  DELIVERY_ASSIGN: [Role.SUPER_ADMIN, Role.ADMIN, Role.DELIVERY_COORDINATOR, Role.OPERATIONS_MANAGER] as Role[],

  // Customer support — messages & custom requests.
  SUPPORT: [Role.SUPER_ADMIN, Role.ADMIN, Role.CUSTOMER_SUPPORT, Role.OPERATIONS_MANAGER] as Role[],

  // Finance — processing refunds.
  FINANCE: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_OFFICER] as Role[],

  // Who can see the refunds list (finance + the support folks who raise them).
  REFUND_VIEW: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_OFFICER, Role.CUSTOMER_SUPPORT, Role.OPERATIONS_MANAGER] as Role[],

  // Business insights / analytics overview.
  ANALYTICS: [Role.SUPER_ADMIN, Role.ADMIN, Role.OPERATIONS_MANAGER, Role.FINANCE_OFFICER, Role.MARKETING_MANAGER] as Role[],

  SUPER_ADMIN_ONLY: [Role.SUPER_ADMIN] as Role[],
};
