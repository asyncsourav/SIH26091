import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const listSchemes = asyncHandler(async (_req: Request, res: Response) => {
  const schemes = await prisma.scheme.findMany({ orderBy: { minProjectCost: "asc" } });
  res.json({ schemes });
});

const upsertSchema = z.object({
  name: z.string().min(1),
  minProjectCost: z.number().nonnegative(),
  maxProjectCost: z.number().positive(),
  maxLoanPct: z.number().min(0).max(1),
  interestRate: z.number().min(0),
  tenureMonths: z.number().int().positive(),
  moratoriumMonths: z.number().int().min(0),
  sourceDocUrl: z.string().url().optional(),
  active: z.boolean().optional()
});

// Admin-only: lets a Scheme Officer update rates/tenures without a code deploy.
export const createScheme = asyncHandler(async (req: Request, res: Response) => {
  const input = upsertSchema.parse(req.body);
  const scheme = await prisma.scheme.create({ data: input });
  res.status(201).json({ scheme });
});

export const updateScheme = asyncHandler(async (req: Request, res: Response) => {
  const input = upsertSchema.partial().parse(req.body);
  const scheme = await prisma.scheme
    .update({ where: { id: req.params.id }, data: input })
    .catch(() => {
      throw ApiError.notFound("Scheme not found.");
    });
  res.json({ scheme });
});

export const deleteScheme = asyncHandler(async (req: Request, res: Response) => {
  await prisma.scheme.delete({ where: { id: req.params.id } }).catch(() => {
    throw ApiError.notFound("Scheme not found.");
  });
  res.status(204).send();
});
