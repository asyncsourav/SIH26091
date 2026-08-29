import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export interface CompetitorPin {
  id: number;
  name: string;
  lat: number;
  lon: number;
  tag: string;
}

export interface CompetitorDensityResult {
  count: number;
  pins: CompetitorPin[];
  isFallbackEstimate: boolean;
}

const OVERPASS_TIMEOUT_MS = 12_000;

/**
 * Queries the public Overpass API for real shop/craft/amenity nodes within a
 * radius of the given coordinates — used both as a genuine number fed into
 * the AI prompt and as map pins, instead of a fabricated competitor count.
 *
 * Falls back to a conservative estimate (rather than throwing) if the public
 * Overpass endpoint is unreachable or rate-limited, since a hackathon demo
 * shouldn't hard-fail on a third-party outage; isFallbackEstimate tells the
 * caller (and can tell the UI) that this number is not live data.
 */
export async function getCompetitorDensity(
  lat: number,
  lon: number,
  businessCategory: string,
  radiusMeters = 5000
): Promise<CompetitorDensityResult> {
  const tagFilter = mapCategoryToOsmTags(businessCategory);

  const query = `
    [out:json][timeout:10];
    (
      ${tagFilter.map((t) => `node["${t.key}"="${t.value}"](around:${radiusMeters},${lat},${lon});`).join("\n      ")}
    );
    out center ${50};
  `;

  try {
    const response = await axios.post(env.OVERPASS_API_URL, query, {
      headers: { "Content-Type": "text/plain" },
      timeout: OVERPASS_TIMEOUT_MS
    });

    const elements: { id: number; lat: number; lon: number; tags?: Record<string, string> }[] =
      response.data?.elements ?? [];

    const pins: CompetitorPin[] = elements.map((el) => ({
      id: el.id,
      name: el.tags?.name ?? "Unnamed business",
      lat: el.lat,
      lon: el.lon,
      tag: el.tags?.shop ?? el.tags?.craft ?? el.tags?.amenity ?? "unknown"
    }));

    return { count: pins.length, pins, isFallbackEstimate: false };
  } catch (err) {
    logger.warn({ err }, "Overpass API unavailable — using fallback competitor density estimate");
    return fallbackEstimate(businessCategory);
  }
}

function mapCategoryToOsmTags(businessCategory: string): { key: string; value: string }[] {
  const normalized = businessCategory.toLowerCase();
  if (normalized.includes("dairy")) return [{ key: "shop", value: "dairy" }, { key: "shop", value: "farm" }];
  if (normalized.includes("retail") || normalized.includes("kirana"))
    return [{ key: "shop", value: "convenience" }, { key: "shop", value: "general" }];
  if (normalized.includes("textile") || normalized.includes("handloom"))
    return [{ key: "shop", value: "clothes" }, { key: "shop", value: "fabric" }];
  if (normalized.includes("poultry")) return [{ key: "shop", value: "farm" }];
  if (normalized.includes("food") || normalized.includes("agri"))
    return [{ key: "shop", value: "farm" }, { key: "shop", value: "food" }];
  return [{ key: "shop", value: "general" }];
}

/** A deliberately conservative, clearly-labeled fallback — never presented as live data. */
function fallbackEstimate(businessCategory: string): CompetitorDensityResult {
  const normalized = businessCategory.toLowerCase();
  const baseline = normalized.includes("retail") || normalized.includes("kirana") ? 6 : 3;
  return { count: baseline, pins: [], isFallbackEstimate: true };
}
