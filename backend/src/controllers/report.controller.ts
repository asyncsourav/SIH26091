import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { GeminiProvider } from "../services/ai/gemini.provider.js";
import { retrieveGroundingChunks } from "../services/rag.service.js";
import { getCompetitorDensity } from "../services/overpass.service.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// Rough centroid coordinates as a fallback when the user hasn't set precise
// lat/long — keeps the Overpass query and map functional for any village name.
const DEFAULT_INDIA_LAT = 22.9734;
const DEFAULT_INDIA_LON = 78.6569;

/**
 * Generates the full AI feasibility report in a single request/response
 * (no token-level streaming) — see the build spec's rationale: this keeps
 * the core demo working over unreliable venue wifi. The frontend simulates
 * a "live generation" feel by staggering the reveal of each section
 * client-side once this single JSON payload arrives.
 */
export const generateReport = [
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      include: { user: true, aiReport: true }
    });
    if (!application) throw ApiError.notFound("Application not found.");
    if (req.user!.role === "ENTREPRENEUR" && application.userId !== req.user!.id) {
      throw ApiError.forbidden();
    }
    if (application.aiReport) {
      return res.json({ report: application.aiReport });
    }

    const lat = application.user.latitude ?? DEFAULT_INDIA_LAT;
    const lon = application.user.longitude ?? DEFAULT_INDIA_LON;

    const competitorResult = await getCompetitorDensity(lat, lon, application.businessCategory);

    const aiProvider = new GeminiProvider();
    const groundingQuery = `${application.businessCategory} business scheme eligibility rural India project cost ${application.projectCost}`;
    const groundingChunks = await retrieveGroundingChunks(aiProvider, groundingQuery);

    const { report, sourceChunkIds } = await aiProvider.generateFeasibilityReport({
      village: application.user.village,
      block: application.user.block,
      district: application.user.district,
      businessCategory: application.businessCategory,
      marginCapital: Number(application.marginCapital),
      projectCost: Number(application.projectCost),
      loanAmount: Number(application.loanAmount),
      competitorCount: competitorResult.count,
      groundingChunks
    });

    if (competitorResult.isFallbackEstimate) {
      logger.warn(
        { applicationId: application.id },
        "Competitor density used a fallback estimate — Overpass API was unreachable"
      );
    }

    const saved = await prisma.aIReport.create({
      data: {
        applicationId: application.id,
        marketReach: report.marketReach,
        opportunityAnalysis: report.opportunityAnalysis,
        swot: report.swot,
        threats: report.threats,
        competitorDensity: report.competitorDensity,
        pricingSuggestion: report.pricingSuggestion,
        rawSources: sourceChunkIds,
        isStaticFallback: false
      }
    });

    await prisma.application.update({ where: { id: application.id }, data: { status: "ROUTED" } });

    res.status(201).json({ report: saved, competitorPins: competitorResult.pins });
  })
];

export const getReport = [
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await prisma.aIReport.findUnique({
      where: { applicationId: req.params.applicationId },
      include: { application: true }
    });
    if (!report) throw ApiError.notFound("No report generated yet for this application.");
    if (req.user!.role === "ENTREPRENEUR" && report.application.userId !== req.user!.id) {
      throw ApiError.forbidden();
    }
    res.json({ report });
  })
];
