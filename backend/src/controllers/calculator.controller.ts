import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { computeFinancialBreakdown, generateEmiSchedule, InvalidMarginCapitalError } from "../services/financial.service.js";
import { ApiError } from "../utils/ApiError.js";

const computeSchema = z.object({
  marginCapital: z.union([z.number(), z.string()])
});

/**
 * Pure, stateless financial computation — no DB write, no auth required.
 * Powers the live "instant preview" slider on the intake wizard.
 */
export const computeBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const { marginCapital } = computeSchema.parse(req.body);

  try {
    const breakdown = computeFinancialBreakdown(marginCapital);
    const emiSchedule = generateEmiSchedule(breakdown.loanAmount, breakdown.scheme);
    res.json({ breakdown, emiSchedule });
  } catch (err) {
    if (err instanceof InvalidMarginCapitalError) {
      throw ApiError.badRequest(err.message);
    }
    throw err;
  }
});
