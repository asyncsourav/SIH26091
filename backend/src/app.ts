import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { buildRateLimiter } from "./middleware/rateLimiter.middleware.js";

import { authRouter } from "./routes/auth.routes.js";
import { calculatorRouter } from "./routes/calculator.routes.js";
import { schemeRouter } from "./routes/scheme.routes.js";
import { applicationRouter } from "./routes/application.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { partnerRouter } from "./routes/partner.routes.js";
import { demoRouter } from "./routes/demo.routes.js";

export async function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestLogger);

  const generalLimiter = await buildRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyPrefix: "rl:general"
  });
  app.use("/api", generalLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok", env: env.NODE_ENV }));

  app.use("/api/auth", authRouter);
  app.use("/api/calculator", calculatorRouter);
  app.use("/api/schemes", schemeRouter);
  app.use("/api/applications", applicationRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/partner", partnerRouter);
  app.use("/api/demo", demoRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
