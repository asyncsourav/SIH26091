import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const listDuplicateReviews = [
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const reviews = await prisma.duplicateReview.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    // Enrich with the two users being compared so the admin UI doesn't need
    // a second round trip per row.
    const enriched = await Promise.all(
      reviews.map(async (review) => {
        const [applicant, matched] = await Promise.all([
          prisma.user.findUnique({ where: { id: review.applicantId } }),
          prisma.user.findUnique({ where: { id: review.matchedUserId } })
        ]);
        return { ...review, applicant, matched };
      })
    );

    res.json({ reviews: enriched });
  })
];

const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional()
});

export const decideDuplicateReview = [
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const input = decisionSchema.parse(req.body);
    const review = await prisma.duplicateReview
      .update({
        where: { id: req.params.id },
        data: { status: input.status, notes: input.notes, reviewedById: req.user!.id }
      })
      .catch(() => {
        throw ApiError.notFound("Duplicate review not found.");
      });
    res.json({ review });
  })
];

export const listAllApplications = [
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const applications = await prisma.application.findMany({
      include: { user: true, scheme: true, aiReport: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ applications });
  })
];
