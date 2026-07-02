import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AccessTokenPayload } from "@/utils/jwt";

export interface AuthedRequest extends Request {
  user?: AccessTokenPayload;
}

/** Verifies the JWT access token in the Authorization header. */
export function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Optional auth: attaches user if present, but never blocks the request. */
export function optionalAuthenticate(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = verifyAccessToken(header.slice("Bearer ".length));
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}
