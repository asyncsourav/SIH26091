import crypto from "node:crypto";
import { env } from "../config/env.js";

/**
 * Salted hash for exact-match duplicate detection.
 *
 * IMPORTANT: this hashes (aadhaarLast4 + dob) ONLY. Phone number must never
 * be included here — User.phone already has its own unique DB constraint,
 * so folding phone into this hash would let the same person re-register
 * under a new phone number completely bypass this exact-match check, which
 * exists specifically to catch that case. The weaker fuzzy trigram check
 * (duplicate.service.ts) is a backstop for near-matches, not a substitute
 * for this one.
 */
export function hashAadhaarIdentity(aadhaarLast4: string, dob: string): string {
  const normalized = `${aadhaarLast4.trim()}|${dob.trim()}|${env.AADHAAR_HASH_SALT}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
