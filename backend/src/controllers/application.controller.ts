import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { computeFinancialBreakdown, generateEmiSchedule, InvalidMarginCapitalError } from "../services/financial.service.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const createApplicationSchema = z.object({
  marginCapital: z.union([z.number(), z.string()]),
  businessCategory: z.string().min(1)
});

/**
 * Creates an Application row with the financial breakdown computed and
 * persisted server-side (never trust a client-submitted projectCost/loanAmount).
 * Also finds/creates the matching Scheme row so the application is linked to
 * a real, admin-editable scheme record rather than a snapshot of numbers.
 */
export const createApplication = [
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const input = createApplicationSchema.parse(req.body);

    let breakdown;
    try {
      breakdown = computeFinancialBreakdown(input.marginCapital);
    } catch (err) {
      if (err instanceof InvalidMarginCapitalError) throw ApiError.badRequest(err.message);
      throw err;
    }

    if (breakdown.scheme.slab === "OUT_OF_RANGE") {
      throw ApiError.badRequest(
        "This project cost exceeds the ₹50 lakh Term Loan ceiling — no matching scheme is available."
      );
    }

    const scheme = await prisma.scheme.findFirst({
      where: { name: breakdown.scheme.name, active: true }
    });
    if (!scheme) {
      throw ApiError.internal(
        `No active "${breakdown.scheme.name}" scheme found in the database. Run the seed script.`
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: req.user.id,
        marginCapital: breakdown.marginCapital,
        projectCost: breakdown.projectCost,
        loanAmount: breakdown.loanAmount,
        schemeId: scheme.id,
        businessCategory: input.businessCategory,
        status: "SUBMITTED"
      },
      include: { scheme: true }
    });

    const emiSchedule = generateEmiSchedule(breakdown.loanAmount, breakdown.scheme);

    res.status(201).json({ application, emiSchedule });
  })
];

export const getApplication = [
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { scheme: true, aiReport: true, user: true, routedPartners: { include: { partner: true } } }
    });
    if (!application) throw ApiError.notFound("Application not found.");
    if (req.user!.role === "ENTREPRENEUR" && application.userId !== req.user!.id) {
      throw ApiError.forbidden("You do not have access to this application.");
    }
    res.json({ application });
  })
];

export const listMyApplications = [
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const applications = await prisma.application.findMany({
      where: { userId: req.user!.id },
      include: { scheme: true, aiReport: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ applications });
  })
];
