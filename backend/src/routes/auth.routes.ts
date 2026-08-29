import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { buildRateLimiter } from "../middleware/rateLimiter.middleware.js";

export const authRouter = Router();

const authLimiter = await buildRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "rl:auth" });

authRouter.post("/register", authLimiter, authController.register);
authRouter.post("/login", authLimiter, authController.login);
authRouter.post("/refresh", authLimiter, authController.refresh);
authRouter.post("/logout", requireAuth, authController.logout);
authRouter.get("/me", requireAuth, authController.me);
