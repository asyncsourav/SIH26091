import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedisClient } from "../lib/redis.js";
import { logger } from "../config/logger.js";
import type { RequestHandler } from "express";

/**
 * Builds a rate limiter backed by Redis when REDIS_URL is configured and
 * reachable, and falls back to express-rate-limit's built-in in-memory store
 * otherwise. This keeps local development frictionless (no Redis required)
 * while still using a shared store in a real multi-instance deployment.
 */
export async function buildRateLimiter(opts: {
  windowMs: number;
  max: number;
  keyPrefix: string;
}): Promise<RequestHandler> {
  const redisClient = await getRedisClient();

  if (redisClient) {
    return rateLimit({
      windowMs: opts.windowMs,
      max: opts.max,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        // @ts-expect-error -- rate-limit-redis's type for sendCommand expects node-redis v4 client
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix: opts.keyPrefix
      })
    });
  }

  logger.warn(`Rate limiter "${opts.keyPrefix}" using in-memory store (Redis not configured)`);
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false
  });
}
