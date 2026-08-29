import { prisma } from "../lib/prisma.js";
import type { AIProvider } from "./ai/ai-provider.interface.js";

export interface RetrievedChunk {
  id: string;
  content: string;
}

/**
 * Retrieval-augmented grounding for the AI report. Embeds the query, then
 * runs a pgvector cosine-similarity search over SchemeDocChunk using a raw
 * query (Prisma's query builder doesn't yet support the <=> operator
 * directly). Falls back to an empty list — never throws — so a temporary
 * embedding/DB hiccup degrades to an ungrounded report instead of a hard
 * failure on the whole request.
 */
export async function retrieveGroundingChunks(
  aiProvider: AIProvider,
  query: string,
  topK = 4
): Promise<RetrievedChunk[]> {
  try {
    const queryEmbedding = await aiProvider.embedText(query);
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    const rows = await prisma.$queryRawUnsafe<{ id: string; content: string }[]>(
      `
      SELECT id, content
      FROM "SchemeDocChunk"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `,
      vectorLiteral,
      topK
    );

    return rows;
  } catch {
    // Grounding is a quality enhancement, not a hard dependency — an AI
    // report with no retrieved sources is still useful, just unlabeled.
    return [];
  }
}
