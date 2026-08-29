import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export interface DuplicateCandidate {
  matchedUserId: string;
  similarityScore: number;
}

/**
 * Fuzzy duplicate check run at registration time, AFTER the exact-match
 * aadhaarHash check (see auth.controller.ts / utils/hash.ts) has already
 * passed. This is a backstop for the case where the same person registers
 * with a slightly different name spelling or without providing Aadhaar
 * details at all — it flags for human review rather than blocking, to avoid
 * false positives locking out legitimate applicants with common names.
 */
export async function findFuzzyDuplicateCandidates(
  newUserId: string,
  name: string,
  village: string
): Promise<DuplicateCandidate[]> {
  try {
    const threshold = env.DUPLICATE_SIMILARITY_THRESHOLD;

    const rows = await prisma.$queryRawUnsafe<{ id: string; score: number }[]>(
      `
      SELECT id, similarity(name || ' ' || village, $1) AS score
      FROM "User"
      WHERE id != $2
        AND similarity(name || ' ' || village, $1) > $3
      ORDER BY score DESC
      LIMIT 5
      `,
      `${name} ${village}`,
      newUserId,
      threshold
    );

    return rows.map((r) => ({ matchedUserId: r.id, similarityScore: r.score }));
  } catch (err) {
    logger.warn({ err }, "Fuzzy duplicate check failed (pg_trgm extension may not be enabled) — skipping");
    return [];
  }
}

export async function recordDuplicateReviews(
  applicantId: string,
  candidates: DuplicateCandidate[]
): Promise<void> {
  if (candidates.length === 0) return;
  await prisma.duplicateReview.createMany({
    data: candidates.map((c) => ({
      applicantId,
      matchedUserId: c.matchedUserId,
      similarityScore: c.similarityScore
    }))
  });
}
