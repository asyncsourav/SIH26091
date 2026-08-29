import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { z } from "zod";

/** Haversine distance in kilometers. */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const DEFAULT_LAT = 22.9734;
const DEFAULT_LON = 78.6569;
const MAX_ROUTING_RADIUS_KM = 150;

/**
 * Routes an application to the nearest eligible partners — geographic
 * proximity, excluding any Partner flagged hasHighNPA (mirroring PS 26092's
 * requirement not to send fresh applications to a partner with high
 * overdues/NPAs).
 */
export const routeApplicationToPartners = [
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      include: { user: true }
    });
    if (!application) throw ApiError.notFound("Application not found.");
    if (req.user!.role === "ENTREPRENEUR" && application.userId !== req.user!.id) {
      throw ApiError.forbidden();
    }

    const lat = application.user.latitude ?? DEFAULT_LAT;
    const lon = application.user.longitude ?? DEFAULT_LON;

    const eligiblePartners = await prisma.partner.findMany({ where: { active: true, hasHighNPA: false } });

    const ranked = eligiblePartners
      .map((p) => ({ partner: p, distanceKm: distanceKm(lat, lon, p.latitude, p.longitude) }))
      .filter((p) => p.distanceKm <= MAX_ROUTING_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);

    const routings = await Promise.all(
      ranked.map((r) =>
        prisma.partnerRouting.upsert({
          where: { applicationId_partnerId: { applicationId: application.id, partnerId: r.partner.id } },
          update: { distanceKm: r.distanceKm },
          create: { applicationId: application.id, partnerId: r.partner.id, distanceKm: r.distanceKm }
        })
      )
    );

    res.json({ routings, eligiblePartnerCount: eligiblePartners.length });
  })
];

export const listIncomingApplications = [
  requireAuth,
  requireRole("PARTNER"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // A real deployment would map PARTNER users 1:1 to a Partner row; for
    // this build, a PARTNER-role user sees all routed applications flagged
    // "PENDING" — swap in a partnerId-scoped filter once that mapping exists.
    const routings = await prisma.partnerRouting.findMany({
      where: { decision: "PENDING" },
      include: { application: { include: { user: true, scheme: true } }, partner: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ routings });
  })
];

const decisionSchema = z.object({ decision: z.enum(["ACCEPTED", "REJECTED"]) });

export const decideRouting = [
  requireAuth,
  requireRole("PARTNER"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const input = decisionSchema.parse(req.body);
    const routing = await prisma.partnerRouting
      .update({
        where: { id: req.params.id },
        data: { decision: input.decision, decidedAt: new Date() }
      })
      .catch(() => {
        throw ApiError.notFound("Routing record not found.");
      });
    res.json({ routing });
  })
];
