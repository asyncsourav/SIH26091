import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";

// Requires a reachable DATABASE_URL (integration-level, not pure unit).
// If you're running only `npm test` for the financial engine locally without
// a database configured, run `vitest run tests/financial.test.ts` instead.
let app: Express;

beforeAll(async () => {
  const { createApp } = await import("../src/app.js");
  app = await createApp();
});

describe("GET /health", () => {
  it("returns 200 and status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /api/calculator/compute", () => {
  it("returns a financial breakdown for valid margin capital", async () => {
    const res = await request(app).post("/api/calculator/compute").send({ marginCapital: 100000 });
    expect(res.status).toBe(200);
    expect(res.body.breakdown.projectCost).toBe(1000000);
    expect(res.body.breakdown.loanAmount).toBe(900000);
  });

  it("returns 400 for invalid margin capital", async () => {
    const res = await request(app).post("/api/calculator/compute").send({ marginCapital: -100 });
    expect(res.status).toBe(400);
  });
});
