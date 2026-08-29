import type { Response } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashAadhaarIdentity } from "../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { findFuzzyDuplicateCandidates, recordDuplicateReviews } from "../services/duplicate.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { Request } from "express";

const registerSchema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().min(2).max(120),
  password: z.string().min(8, "Password must be at least 8 characters"),
  village: z.string().min(1),
  block: z.string().min(1),
  district: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Optional — used only for the exact-match duplicate hash, never stored raw.
  aadhaarLast4: z.string().length(4).regex(/^\d{4}$/).optional(),
  dob: z.string().optional() // ISO date string, e.g. "1990-05-14"
});

const loginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(1)
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth"
  });
}

function publicUser(user: { id: string; name: string; phone: string; role: string; village: string; block: string; district: string }) {
  const { id, name, phone, role, village, block, district } = user;
  return { id, name, phone, role, village, block, district };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);

  const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existingPhone) {
    throw ApiError.conflict("An account with this phone number already exists.");
  }

  let aadhaarHash: string | undefined;
  if (input.aadhaarLast4 && input.dob) {
    aadhaarHash = hashAadhaarIdentity(input.aadhaarLast4, input.dob);
    const existingAadhaar = await prisma.user.findUnique({ where: { aadhaarHash } });
    if (existingAadhaar) {
      // Exact match on (Aadhaar last 4 + DOB) — this is the same person,
      // regardless of what phone number they're registering with now.
      throw ApiError.conflict(
        "An account already exists for this identity. Please log in instead, or contact your Scheme Officer if you believe this is an error."
      );
    }
  }

  const passwordHash = await argon2.hash(input.password);

  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      name: input.name,
      passwordHash,
      village: input.village,
      block: input.block,
      district: input.district,
      latitude: input.latitude,
      longitude: input.longitude,
      aadhaarHash
    }
  });

  // Fuzzy backstop check — flagged for admin review, never blocks registration.
  const candidates = await findFuzzyDuplicateCandidates(user.id, user.name, user.village);
  await recordDuplicateReviews(user.id, candidates);

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.refreshTokenVersion });
  setRefreshCookie(res, refreshToken);

  res.status(201).json({ user: publicUser(user), accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (!user) throw ApiError.unauthorized("Invalid phone number or password.");

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw ApiError.unauthorized("Invalid phone number or password.");

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.refreshTokenVersion });
  setRefreshCookie(res, refreshToken);

  res.json({ user: publicUser(user), accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized("Missing refresh token.");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token.");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
    // Token was rotated out (e.g. by a logout-everywhere or password change) — reject.
    throw ApiError.unauthorized("Refresh token has been revoked.");
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const newRefreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.refreshTokenVersion });
  setRefreshCookie(res, newRefreshToken);

  res.json({ accessToken });
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    // Bump the token version so any outstanding refresh tokens for this user are invalidated.
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshTokenVersion: { increment: 1 } }
    });
  }
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, { path: "/api/auth" });
  res.status(204).send();
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw ApiError.notFound("User not found.");
  res.json({ user: publicUser(user) });
});
