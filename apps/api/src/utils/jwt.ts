import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as any,
  });
}

export function signRefreshToken(userId: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as any,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwt.refreshSecret) as { sub: string };
}
