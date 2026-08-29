import { createClient, type RedisClientType } from "redis";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// Redis is optional. If REDIS_URL isn't set (or the connection fails), the
// rate limiter middleware falls back to an in-memory store automatically —
// see middleware/rateLimiter.middleware.ts. This keeps local dev friction-free.
let client: RedisClientType | null = null;
let connectionAttempted = false;

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (!env.REDIS_URL) return null;
  if (client) return client;
  if (connectionAttempted) return null;

  connectionAttempted = true;
  try {
    client = createClient({ url: env.REDIS_URL });
    client.on("error", (err) => logger.warn({ err }, "Redis client error"));
    await client.connect();
    logger.info("Connected to Redis");
    return client;
  } catch (err) {
    logger.warn({ err }, "Could not connect to Redis — falling back to in-memory rate limiting");
    client = null;
    return null;
  }
}
