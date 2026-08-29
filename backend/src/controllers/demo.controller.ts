import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const SUNITA_APPLICATION_ID = "seed-sunita-application";

/**
 * Deliberately public, read-only endpoint serving ONLY the seeded Sunita
 * demo persona — not a general "view any application without auth" hole.
 * This exists so the landing page's "See a sample report" link works for
 * an unauthenticated judge/visitor without requiring them to register
 * first, while every other application/report route stays behind requireAuth.
 */
export const getSunitaDemo = asyncHandler(async (_req: Request, res: Response) => {
  const application = await prisma.application.findUnique({
    where: { id: SUNITA_APPLICATION_ID },
    include: { scheme: true, aiReport: true, user: true }
  });
  if (!application || !application.aiReport) {
    throw ApiError.notFound("Demo persona not found. Run the seed script: npm run seed");
  }
  res.json({ application, report: application.aiReport });
});
